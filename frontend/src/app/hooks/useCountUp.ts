import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 → target with easeOutCubic easing.
 *
 * Usage:
 *   const animatedScore = useCountUp(roundScore, 1500);
 *   <span>{animatedScore.toFixed(1)}</span>
 */
export function useCountUp(target: number, durationMs: number = 1500): number {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const prevTargetRef = useRef<number>(0);

    useEffect(() => {
        // Cancel any running animation.
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

        const from = prevTargetRef.current;
        const delta = target - from;
        startTimeRef.current = null;

        function tick(timestamp: number) {
            if (startTimeRef.current === null) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / durationMs, 1);

            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);

            setValue(from + delta * eased);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                prevTargetRef.current = target;
                rafRef.current = null;
            }
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [target, durationMs]);

    return value;
}
