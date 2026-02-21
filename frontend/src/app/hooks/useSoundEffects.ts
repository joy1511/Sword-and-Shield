import { useRef, useCallback } from 'react';

/**
 * Provides short synthetic sound effects via the Web Audio API.
 * No audio files needed — everything is generated from oscillators.
 *
 * Usage:
 *   const { playClick, playLockIn, playTension, stopTension } = useSoundEffects();
 */
export function useSoundEffects() {
    const ctxRef = useRef<AudioContext | null>(null);
    const tensionRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

    function getCtx(): AudioContext {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        // Resume if suspended (browser autoplay policy).
        if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
        return ctxRef.current;
    }

    /** Short 800Hz blip (50ms) — button tap feedback. */
    const playClick = useCallback(() => {
        try {
            const ctx = getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain).connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.05);
        } catch {
            // Audio may be blocked
        }
    }, []);

    /** Ascending sweep 400→1200Hz (200ms) — lock-in confirmation. */
    const playLockIn = useCallback(() => {
        try {
            const ctx = getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain).connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch {
            // Audio may be blocked
        }
    }, []);

    /** Low rumble 100Hz with rising gain — tension for final 5 seconds. */
    const playTension = useCallback(() => {
        try {
            const ctx = getCtx();
            // Don't stack multiples
            if (tensionRef.current) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain).connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 5);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 5);
            osc.start(ctx.currentTime);
            tensionRef.current = { osc, gain };
        } catch {
            // Audio may be blocked
        }
    }, []);

    /** Stop the tension drone. */
    const stopTension = useCallback(() => {
        try {
            if (tensionRef.current) {
                const { osc, gain } = tensionRef.current;
                const ctx = getCtx();
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                osc.stop(ctx.currentTime + 0.15);
                tensionRef.current = null;
            }
        } catch {
            // noop
        }
    }, []);

    return { playClick, playLockIn, playTension, stopTension };
}
