import { useRef, useEffect, useCallback } from 'react';

interface ParticleBackgroundProps {
    /** Current game phase — controls particle color palette. */
    phase: 'lobby' | 'round_input' | 'round_resolution' | 'final_standings';
    /** Seconds remaining in the current round (only relevant during round_input). */
    timeLeft?: number;
}

// ── Particle config ──────────────────────────────────────────────────────────
const PARTICLE_COUNT = 50;
const MAX_RADIUS = 3;
const MIN_RADIUS = 0.5;
const MAX_SPEED = 0.3;

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    alpha: number;
}

// ── Color palettes per phase ────────────────────────────────────────────────
const PALETTES: Record<string, string> = {
    lobby: '6, 182, 212',           // cyan
    round_input: '6, 182, 212',     // cyan (shifts to red when danger)
    round_resolution: '16, 185, 129', // green
    final_standings: '139, 92, 246',  // purple
    danger: '239, 68, 68',           // red (final 10s)
};

export function ParticleBackground({ phase, timeLeft }: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);
    const sizeRef = useRef({ w: 0, h: 0 });

    // Determine active color.
    const isDanger = phase === 'round_input' && timeLeft !== undefined && timeLeft <= 10;
    const colorKey = isDanger ? 'danger' : phase;
    const rgb = PALETTES[colorKey] || PALETTES.lobby;

    // ── Initialize particles ──────────────────────────────────────────────────
    const initParticles = useCallback((w: number, h: number) => {
        const arr: Particle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            arr.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * MAX_SPEED,
                vy: (Math.random() - 0.5) * MAX_SPEED,
                r: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
                alpha: 0.1 + Math.random() * 0.4,
            });
        }
        particlesRef.current = arr;
    }, []);

    // ── Canvas setup & resize ─────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        function resize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            canvas!.width = w;
            canvas!.height = h;
            sizeRef.current = { w, h };
            if (particlesRef.current.length === 0) initParticles(w, h);
        }

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [initParticles]);

    // ── Animation loop ────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        function draw() {
            const { w, h } = sizeRef.current;
            ctx!.clearRect(0, 0, w, h);

            for (const p of particlesRef.current) {
                // Move
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < -5) p.x = w + 5;
                if (p.x > w + 5) p.x = -5;
                if (p.y < -5) p.y = h + 5;
                if (p.y > h + 5) p.y = -5;

                // Draw
                ctx!.beginPath();
                ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(${rgb}, ${p.alpha})`;
                ctx!.fill();
            }

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, [rgb]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    );
}
