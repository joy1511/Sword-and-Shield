// ─── Socket.io Client Singleton ──────────────────────────────────────────────
// Creates a single, reusable Socket.io connection to the backend.
// Includes reconnection support and localStorage session helpers.
// ─────────────────────────────────────────────────────────────────────────────

import { io, Socket } from 'socket.io-client';

const BACKEND_URL: string =
    import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';

// ── LocalStorage helpers for session persistence ─────────────────────────────
const STORAGE_KEY = 'sword_shield_username';

export function getStoredUsername(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setStoredUsername(name: string): void {
    try {
        localStorage.setItem(STORAGE_KEY, name);
    } catch {
        // localStorage may be unavailable (incognito, quota, etc.)
    }
}

export function clearStoredUsername(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // noop
    }
}

// ── Socket singleton with auto-reconnection ──────────────────────────────────
export const socket: Socket = io(BACKEND_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    // Reconnection settings for live events
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
});
