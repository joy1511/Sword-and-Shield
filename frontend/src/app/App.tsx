import { useState, useEffect, useCallback, useRef } from 'react';
import { socket, getStoredUsername, setStoredUsername } from '../lib/socket';
import { LandingScreen } from './components/LandingScreen';
import { WaitingRoom } from './components/WaitingRoom';
import { ActiveInputScreen } from './components/ActiveInputScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { ParticleBackground } from './components/ParticleBackground';
import { Button } from './components/ui/button';
import { Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Mirrors the payload the server sends on every `game_state_update`. */
interface ServerGameState {
  phase: 'lobby' | 'round_input' | 'round_resolution' | 'final_standings';
  currentRound: number;
  playerCount: number;
  submittedCount: number;
  leaderboard: { username: string; cumulativeScore: number; connected: boolean }[];
  roundResults: {
    username: string;
    x: number;
    z: number;
    k: number;
    Y: number;
    baseScore: number;
    penalty: number;
    roundScore: number;
  }[];
}

/** Local UI view — adds 'landing' (pre-join) and 'admin' overlay. */
type UIView = 'landing' | 'waiting' | 'active' | 'results' | 'admin';

// ─── Map server phases → UI views ────────────────────────────────────────────
function phaseToView(phase: ServerGameState['phase']): UIView {
  switch (phase) {
    case 'lobby': return 'waiting';
    case 'round_input': return 'active';
    case 'round_resolution': return 'results';
    case 'final_standings': return 'results';
    default: return 'waiting';
  }
}

// ─── Page transition variants ────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Connection & identity ──────────────────────────────────────────────────
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [username, setUsername] = useState('');

  // ── Server-driven game state ───────────────────────────────────────────────
  const [serverState, setServerState] = useState<ServerGameState>({
    phase: 'lobby',
    currentRound: 1,
    playerCount: 0,
    submittedCount: 0,
    leaderboard: [],
    roundResults: [],
  });

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [view, setView] = useState<UIView>('landing');
  const [showAdmin, setShowAdmin] = useState(false);
  const [userChoice, setUserChoice] = useState<number>(0);
  const [userPrediction, setUserPrediction] = useState<number>(50);
  const [errorMsg, setErrorMsg] = useState('');
  const [timerLeft, setTimerLeft] = useState(60);

  // Track whether we already attempted auto-reconnect.
  const autoReconnectedRef = useRef(false);

  // ── Auto-reconnect from localStorage ───────────────────────────────────────
  useEffect(() => {
    if (autoReconnectedRef.current) return;
    autoReconnectedRef.current = true;

    const stored = getStoredUsername();
    if (stored) {
      console.log('[auto-reconnect] Found saved username:', stored);
      setUsername(stored);
      setHasJoined(true);
      setView('waiting');
      if (!socket.connected) socket.connect();
      // Re-join after connection is established.
      socket.on('connect', function autoJoin() {
        socket.emit('join_lobby', { username: stored });
        socket.off('connect', autoJoin);  // one-shot
      });
      // If already connected (unlikely but possible), emit immediately.
      if (socket.connected) {
        socket.emit('join_lobby', { username: stored });
      }
    }
  }, []);

  // ── Socket.io lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    function onConnect() {
      console.log('[socket] connected:', socket.id);
      setIsConnected(true);
      // On reconnect, re-join with stored username to restore session.
      const stored = getStoredUsername();
      if (stored) {
        socket.emit('join_lobby', { username: stored });
      }
    }
    function onDisconnect() {
      console.log('[socket] disconnected');
      setIsConnected(false);
    }

    function onGameStateUpdate(data: ServerGameState) {
      console.log('[socket] game_state_update:', data);
      setServerState(data);

      setView((prev) => {
        if (prev === 'landing') return 'landing';
        if (prev === 'admin') return 'admin';
        return phaseToView(data.phase);
      });
    }

    function onError(data: { message: string }) {
      console.warn('[socket] error:', data.message);
      setErrorMsg(data.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_state_update', onGameStateUpdate);
    socket.on('error_message', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_state_update', onGameStateUpdate);
      socket.off('error_message', onError);
    };
  }, []);

  // ── Timer for ActiveInputScreen (resets when round changes) ────────────────
  useEffect(() => {
    if (serverState.phase !== 'round_input') {
      setTimerLeft(60);
      return;
    }
    setTimerLeft(60);
    const timer = setInterval(() => {
      setTimerLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [serverState.phase, serverState.currentRound]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleJoin = useCallback((name: string) => {
    setUsername(name);
    setStoredUsername(name);   // persist for reconnection
    if (!socket.connected) socket.connect();
    socket.emit('join_lobby', { username: name });
    setHasJoined(true);
    setView('waiting');
  }, []);

  const handleSubmit = useCallback((sword: number, shield: number) => {
    setUserChoice(sword);
    setUserPrediction(shield);
    socket.emit('submit_choice', { x: sword, z: shield });
  }, []);

  const handleAdminAction = useCallback((action: string, password: string) => {
    if (!socket.connected) socket.connect();
    socket.emit('admin_action', { action, password });
  }, []);

  const toggleAdmin = useCallback(() => {
    setView((prev) => {
      if (prev === 'admin') {
        return hasJoined ? phaseToView(serverState.phase) : 'landing';
      }
      return 'admin';
    });
    setShowAdmin((prev) => !prev);
  }, [hasJoined, serverState.phase]);

  // ── Derived data for the Results screen ────────────────────────────────────

  const distribution = (() => {
    const dist: { sword: number; count: number; percentage: number }[] = [];
    for (let i = 1; i <= 10; i++) {
      dist.push({ sword: i, count: 0, percentage: 0 });
    }
    const yByX: Record<number, number> = {};
    for (const r of serverState.roundResults) {
      yByX[r.x] = r.Y;
    }
    for (let i = 1; i <= 10; i++) {
      const y = yByX[i] ?? 0;
      dist[i - 1].percentage = Math.round(y * 100) / 100;
      dist[i - 1].count = serverState.roundResults.filter(r => r.x === i).length;
    }
    return dist;
  })();

  const myResult = serverState.roundResults.find(r => r.username === username);
  const actualPercentage = myResult ? myResult.Y : 0;
  const roundScore = myResult ? myResult.roundScore : 0;
  const baseScore = myResult ? myResult.baseScore : 0;
  const penalty = myResult ? myResult.penalty : 0;

  const leaderboard = serverState.leaderboard.map((p, i) => ({
    rank: i + 1,
    username: p.username,
    roundScore: serverState.roundResults.find(r => r.username === p.username)?.roundScore ?? 0,
    totalScore: p.cumulativeScore,
  }));

  const isFinalRound = serverState.phase === 'final_standings';
  const totalRounds = 3;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen">
      {/* ── Particle background ──────────────────────────────────────────── */}
      <ParticleBackground phase={serverState.phase} timeLeft={timerLeft} />

      {/* ── Error toast ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#EF4444]/90 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Admin toggle button (top-right gear) ───────────────────────── */}
      {view !== 'admin' && (
        <button
          onClick={toggleAdmin}
          className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-card border-2 border-border hover:border-[#06B6D4] flex items-center justify-center transition-all hover:scale-110 shadow-lg"
          title="Open Admin Dashboard"
        >
          <Settings className="w-5 h-5 text-muted-foreground hover:text-[#06B6D4] transition-colors" />
        </button>
      )}

      {/* ── Page views with AnimatePresence ───────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ── ADMIN VIEW ─────────────────────────────────────────────── */}
        {view === 'admin' && (
          <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="fixed top-4 right-4 z-50">
              <Button
                onClick={toggleAdmin}
                variant="outline"
                size="sm"
                className="border-[#06B6D4] text-[#06B6D4]"
              >
                Back to Game
              </Button>
            </div>
            <AdminDashboard
              playerCount={serverState.playerCount}
              currentRound={serverState.currentRound}
              totalRounds={totalRounds}
              gamePhase={serverState.phase}
              onAdminAction={handleAdminAction}
              isConnected={isConnected}
            />
          </motion.div>
        )}

        {/* ── LANDING VIEW ───────────────────────────────────────────── */}
        {view === 'landing' && (
          <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <LandingScreen
              onJoin={handleJoin}
              playerCount={serverState.playerCount}
              isConnected={isConnected}
            />
          </motion.div>
        )}

        {/* ── WAITING VIEW ───────────────────────────────────────────── */}
        {view === 'waiting' && (
          <motion.div key="waiting" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <WaitingRoom
              playerCount={serverState.playerCount}
              currentRound={serverState.currentRound}
            />
          </motion.div>
        )}

        {/* ── INPUT VIEW ─────────────────────────────────────────────── */}
        {view === 'active' && (
          <motion.div key="active" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ActiveInputScreen
              currentRound={serverState.currentRound}
              totalRounds={totalRounds}
              onSubmit={handleSubmit}
            />
          </motion.div>
        )}

        {/* ── RESULTS VIEW ───────────────────────────────────────────── */}
        {view === 'results' && (
          <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ResultsScreen
              currentRound={serverState.currentRound}
              userChoice={userChoice}
              userPrediction={userPrediction}
              actualPercentage={Math.round(actualPercentage * 100) / 100}
              roundScore={Math.round(roundScore * 100) / 100}
              baseScore={Math.round(baseScore * 100) / 100}
              penalty={Math.round(penalty * 100) / 100}
              distribution={distribution}
              leaderboard={leaderboard}
              currentUsername={username}
              isFinalStandings={isFinalRound}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}