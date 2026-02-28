import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
    active: boolean;
}

const COLORS = ['#d4a5f5', '#f5a5d4', '#fde68a', '#86efac', '#7dd3fc', '#f9a8d4', '#a5b4fc', '#fbbf24'];
const SHAPES = ['circle', 'rect', 'rect'] as const;

function randomBetween(a: number, b: number) {
    return a + Math.random() * (b - a);
}

const Confetti: React.FC<ConfettiProps> = ({ active }) => {
    // useMemo: частицы генерируются ОДИН раз, не при каждом рендере
    const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
        id: i,
        color: COLORS[i % COLORS.length],
        shape: SHAPES[i % SHAPES.length],
        size: randomBetween(6, 14),
        x: randomBetween(-160, 160),
        y: randomBetween(-220, -40),
        rotate: randomBetween(0, 360),
        duration: randomBetween(1.2, 2.2),
        delay: randomBetween(0, 0.4),
    })), []);

    return (
        <AnimatePresence>
            {active && (
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 200, willChange: 'transform',
                }}>
                    {particles.map(p => (
                        <motion.div
                            key={p.id}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                            animate={{
                                x: p.x * 3,
                                y: [0, p.y, p.y + 400],
                                opacity: [1, 1, 0],
                                scale: [0, 1, 0.8],
                                rotate: p.rotate * 4,
                            }}
                            transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                width: p.shape === 'circle' ? p.size : p.size * 1.5,
                                height: p.shape === 'circle' ? p.size : p.size * 0.6,
                                borderRadius: p.shape === 'circle' ? '50%' : '2px',
                                background: p.color,
                                boxShadow: `0 0 6px ${p.color}88`,
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
};

export default Confetti;
