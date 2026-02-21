// ============================================================================
//  SWORD & SHIELD — Real-Time Multiplayer Backend
// ============================================================================
//  Tech: Node.js · Express · Socket.io
//  Deployment target: Render  |  Frontend host: Vercel
//  Upgraded for 100+ player live events with session persistence.
// ============================================================================

// ─── 1. IMPORTS & CONFIG ─────────────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// ─── Allowed origins (comma-separated in .env, or sensible defaults) ────────
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

// ─── 2. EXPRESS + HTTP SERVER ────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ─── 3. SOCKET.IO SERVER ────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  // Performance: increase default buffer sizes for 100+ players
  maxHttpBufferSize: 1e6,      // 1 MB
  pingTimeout: 30000,          // 30s before considering a client dead
  pingInterval: 10000,         // ping every 10s
});

// ─── 4. IN-MEMORY GAME STATE ────────────────────────────────────────────────
//
//  players  – Map<username, PlayerData>   ← keyed by username for reconnection
//      PlayerData = {
//        socketId: string | null,
//        username: string,
//        connected: boolean,
//        disconnectedAt: number | null,      // timestamp when they went offline
//        cumulativeScore: number,
//        currentRoundSubmission: { x: int 1-10, z: int 0-100 } | null
//      }
//
//  gameState    – 'lobby' | 'round_input' | 'round_resolution' | 'final_standings'
//  currentRound – 1 | 2 | 3
//
const players = new Map();
let gameState = 'lobby';
let currentRound = 1;

// Stores the most recent round results so we can broadcast them.
let lastRoundResults = [];

// Admin password loaded from .env.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

// How long (ms) to keep a disconnected player before purging them.
const RECONNECT_GRACE_MS = 10 * 60 * 1000; // 10 minutes

// ─── 5. BROADCAST THROTTLE ─────────────────────────────────────────────────
//
// During round_input, many submit_choice events can arrive nearly simultaneously.
// Instead of broadcasting after every single one, we debounce to one broadcast
// per 500ms window to avoid flooding 100+ clients.
//
let broadcastTimer = null;

function broadcastThrottled() {
  if (broadcastTimer) return;  // already scheduled
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    io.emit('game_state_update', buildGameStatePayload());
  }, 500);
}

/** Broadcast immediately (used for admin actions / phase transitions). */
function broadcastImmediate() {
  if (broadcastTimer) {
    clearTimeout(broadcastTimer);
    broadcastTimer = null;
  }
  io.emit('game_state_update', buildGameStatePayload());
}

// ─── 6. HELPER: BUILD BROADCAST PAYLOAD ─────────────────────────────────────
function buildGameStatePayload() {
  // Leaderboard: include ALL players (even disconnected) sorted by score.
  const leaderboard = Array.from(players.values())
    .map(p => ({
      username: p.username,
      cumulativeScore: Math.round(p.cumulativeScore * 100) / 100,
      connected: p.connected,
    }))
    .sort((a, b) => b.cumulativeScore - a.cumulativeScore);

  // Count only connected players.
  let connectedCount = 0;
  for (const [, p] of players) {
    if (p.connected) connectedCount++;
  }

  // Count how many connected players have submitted this round.
  let submittedCount = 0;
  if (gameState === 'round_input') {
    for (const [, p] of players) {
      if (p.connected && p.currentRoundSubmission) submittedCount++;
    }
  }

  return {
    phase: gameState,
    currentRound,
    leaderboard,
    playerCount: connectedCount,
    submittedCount,
    // Round-level detail (only after resolution — keep payload small during input).
    roundResults: (gameState === 'round_resolution' || gameState === 'final_standings')
      ? lastRoundResults.map(r => ({
        username: r.username,
        x: r.x,
        z: r.z,
        k: r.k,
        Y: Math.round(r.Y * 100) / 100,
        baseScore: Math.round(r.baseScore * 100) / 100,
        penalty: Math.round(r.penalty * 100) / 100,
        roundScore: Math.round(r.roundScore * 100) / 100,
      }))
      : [],
  };
}

// ─── 7. HELPER: RESOLVE CURRENT ROUND ───────────────────────────────────────
function resolveRound() {
  const submitters = [];
  for (const [username, data] of players.entries()) {
    if (data.currentRoundSubmission) {
      submitters.push({ username, ...data });
    }
  }

  const N = submitters.length;
  if (N === 0) {
    lastRoundResults = [];
    return;
  }

  // Frequency map — O(N)
  const freqMap = {};
  for (const s of submitters) {
    const x = s.currentRoundSubmission.x;
    freqMap[x] = (freqMap[x] || 0) + 1;
  }

  // Score calculation — O(N)
  lastRoundResults = submitters.map(s => {
    const x = s.currentRoundSubmission.x;
    const z = s.currentRoundSubmission.z;
    const k = freqMap[x];

    const Y = (k / N) * 100;
    const baseScore = x * (1 - (Y / 100));
    const penalty = Math.abs(Y - z) / 10;
    const roundScore = baseScore - penalty;

    // Accumulate into the player's running total.
    const playerData = players.get(s.username);
    if (playerData) {
      playerData.cumulativeScore += roundScore;
    }

    return { username: s.username, x, z, k, Y, baseScore, penalty, roundScore };
  });
}

// ─── 8. HELPER: RESET SUBMISSIONS FOR A NEW ROUND ──────────────────────────
function clearSubmissions() {
  for (const [, data] of players.entries()) {
    data.currentRoundSubmission = null;
  }
}

// ─── 9. HELPER: FULL GAME RESET (back to lobby) ────────────────────────────
function resetGame() {
  gameState = 'lobby';
  currentRound = 1;
  lastRoundResults = [];
  for (const [, data] of players.entries()) {
    data.cumulativeScore = 0;
    data.currentRoundSubmission = null;
  }
}

// ─── 10. CLEANUP: PURGE STALE DISCONNECTED PLAYERS ─────────────────────────
// Runs every 60 seconds. Removes players who have been offline > 10 minutes.
setInterval(() => {
  const now = Date.now();
  let purged = 0;
  for (const [username, data] of players.entries()) {
    if (!data.connected && data.disconnectedAt && (now - data.disconnectedAt > RECONNECT_GRACE_MS)) {
      players.delete(username);
      purged++;
    }
  }
  if (purged > 0) {
    console.log(`[cleanup] Purged ${purged} stale player(s). ${players.size} remaining.`);
    broadcastImmediate();
  }
}, 60_000);

// ─── 11. SOCKET.IO EVENT HANDLERS ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // ── JOIN LOBBY ────────────────────────────────────────────────────────────
  socket.on('join_lobby', ({ username }) => {
    if (!username || typeof username !== 'string') {
      socket.emit('error_message', { message: 'A valid username is required.' });
      return;
    }

    const cleanName = username.trim().substring(0, 20);

    // Check if this username already exists (reconnection).
    const existing = players.get(cleanName);
    if (existing) {
      // ── Reconnect: re-attach the new socket to the existing session ──
      existing.socketId = socket.id;
      existing.connected = true;
      existing.disconnectedAt = null;
      console.log(`[lobby] "${cleanName}" reconnected (score: ${existing.cumulativeScore.toFixed(1)}, ${players.size} players)`);
    } else {
      // ── New player: create a fresh entry ──
      players.set(cleanName, {
        socketId: socket.id,
        username: cleanName,
        connected: true,
        disconnectedAt: null,
        cumulativeScore: 0,
        currentRoundSubmission: null,
      });
      console.log(`[lobby] "${cleanName}" joined (${players.size} players online)`);
    }

    // Send current state to everyone.
    broadcastImmediate();
  });

  // ── SUBMIT CHOICE ─────────────────────────────────────────────────────────
  socket.on('submit_choice', ({ x, z }) => {
    // Find the player by socket ID.
    const player = findPlayerBySocketId(socket.id);
    if (!player) {
      socket.emit('error_message', { message: 'You must join the lobby first.' });
      return;
    }

    if (gameState !== 'round_input') {
      socket.emit('error_message', { message: 'Submissions are not open right now.' });
      return;
    }

    const parsedX = parseInt(x, 10);
    if (isNaN(parsedX) || parsedX < 1 || parsedX > 10) {
      socket.emit('error_message', { message: 'Sword (x) must be an integer between 1 and 10.' });
      return;
    }

    const parsedZ = parseFloat(z);
    if (isNaN(parsedZ) || parsedZ < 0 || parsedZ > 100) {
      socket.emit('error_message', { message: 'Shield (z) must be a number between 0 and 100.' });
      return;
    }

    player.currentRoundSubmission = { x: parsedX, z: parsedZ };
    console.log(`[round ${currentRound}] ${player.username} submitted x=${parsedX}, z=${parsedZ}`);

    socket.emit('submission_ack', {
      message: `Round ${currentRound} choice received.`,
      x: parsedX,
      z: parsedZ,
    });

    // Throttled broadcast — avoids flooding when 100 players submit at once.
    broadcastThrottled();
  });

  // ── ADMIN ACTION ──────────────────────────────────────────────────────────
  socket.on('admin_action', ({ action, password }) => {
    if (password !== ADMIN_PASSWORD) {
      socket.emit('error_message', { message: 'Invalid admin password.' });
      return;
    }

    console.log(`[admin] action="${action}" by socket ${socket.id}`);

    switch (action) {
      case 'start_round': {
        if (gameState !== 'lobby' && gameState !== 'round_resolution') {
          socket.emit('error_message', { message: `Cannot start round from phase "${gameState}".` });
          return;
        }
        clearSubmissions();
        gameState = 'round_input';
        lastRoundResults = [];
        console.log(`[game] ▶ Round ${currentRound} — input phase`);
        break;
      }

      case 'resolve_round': {
        if (gameState !== 'round_input') {
          socket.emit('error_message', { message: `Cannot resolve from phase "${gameState}".` });
          return;
        }
        resolveRound();
        gameState = 'round_resolution';
        console.log(`[game] ✓ Round ${currentRound} resolved — ${lastRoundResults.length} submissions scored`);
        break;
      }

      case 'next_round': {
        if (gameState !== 'round_resolution') {
          socket.emit('error_message', { message: `Cannot advance from phase "${gameState}".` });
          return;
        }
        if (currentRound >= 3) {
          gameState = 'final_standings';
          console.log('[game] 🏆 Final standings');
        } else {
          currentRound += 1;
          clearSubmissions();
          gameState = 'round_input';
          lastRoundResults = [];
          console.log(`[game] ▶ Round ${currentRound} — input phase`);
        }
        break;
      }

      case 'reset_game': {
        resetGame();
        console.log('[game] 🔄 Game reset to lobby');
        break;
      }

      default: {
        socket.emit('error_message', { message: `Unknown admin action: "${action}".` });
        return;
      }
    }

    // Admin actions broadcast immediately (phase transitions must be instant).
    broadcastImmediate();
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const player = findPlayerBySocketId(socket.id);
    if (player) {
      player.connected = false;
      player.disconnectedAt = Date.now();
      player.socketId = null;
      console.log(`[-] ${player.username} disconnected (kept in memory for ${RECONNECT_GRACE_MS / 60000}m)`);
    } else {
      console.log(`[-] Socket ${socket.id} disconnected (was not in lobby)`);
    }

    broadcastImmediate();
  });
});

// ─── 12. HELPER: FIND PLAYER BY SOCKET ID ──────────────────────────────────
// Since the map is now keyed by username, we need a lookup by socket ID.
// For 200 players this is O(N) which is fine — runs only on individual events.
function findPlayerBySocketId(socketId) {
  for (const [, data] of players) {
    if (data.socketId === socketId) return data;
  }
  return null;
}

// ─── 13. EXPRESS ROUTES (health check / debug) ──────────────────────────────
app.get('/', (_req, res) => {
  let connectedCount = 0;
  for (const [, p] of players) {
    if (p.connected) connectedCount++;
  }
  res.json({
    game: 'Sword & Shield',
    status: 'online',
    phase: gameState,
    round: currentRound,
    players: connectedCount,
    totalRegistered: players.size,
  });
});

app.get('/debug/state', (_req, res) => {
  const playersArr = [];
  for (const [username, data] of players.entries()) {
    playersArr.push({ username, ...data });
  }
  res.json({
    gameState,
    currentRound,
    players: playersArr,
    lastRoundResults,
  });
});

// ─── 14. START SERVER ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`\n⚔️  Sword & Shield server listening on port ${PORT}`);
  console.log(`   Phase: ${gameState}  |  Round: ${currentRound}`);
  console.log(`   Reconnect grace: ${RECONNECT_GRACE_MS / 60000} minutes\n`);
});
