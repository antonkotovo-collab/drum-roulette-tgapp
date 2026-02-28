import React from 'react';

const FAR_STARS = Array.from({ length: 12 }, (_, i) => ({
    top: `${(i * 37 + 5) % 100}%`,
    left: `${(i * 53 + 8) % 100}%`,
    size: 1,
    delay: (i * 0.37) % 4,
    duration: 2.5 + (i % 5) * 0.6,
}));

const NEAR_STARS = Array.from({ length: 6 }, (_, i) => ({
    top: `${(i * 71 + 13) % 100}%`,
    left: `${(i * 47 + 22) % 100}%`,
    size: i % 3 === 0 ? 3 : 2,
    delay: (i * 0.6) % 3,
    duration: 1.8 + (i % 4) * 0.5,
}));

/**
 * Мерцающий звёздный фон — CSS-only, работает на GPU compositor.
 */
const StarBackground: React.FC = () => (
    <>
        {FAR_STARS.map((s, i) => (
            <div
                key={`fs${i}`}
                style={{
                    position: 'fixed', top: s.top, left: s.left,
                    width: s.size, height: s.size,
                    borderRadius: '50%', background: 'white',
                    pointerEvents: 'none', filter: 'blur(0.5px)', zIndex: 0,
                    animation: `pulse-opacity ${s.duration}s ease-in-out infinite`,
                    animationDelay: `${s.delay}s`,
                    willChange: 'opacity',
                }}
            />
        ))}
        {NEAR_STARS.map((s, i) => (
            <div
                key={`ns${i}`}
                style={{
                    position: 'fixed', top: s.top, left: s.left,
                    width: s.size, height: s.size,
                    borderRadius: '50%', background: 'white',
                    pointerEvents: 'none', zIndex: 0,
                    boxShadow: s.size === 3 ? '0 0 4px 1px rgba(255,255,255,0.6)' : undefined,
                    animation: `star-near ${s.duration}s ease-in-out infinite`,
                    animationDelay: `${s.delay}s`,
                    willChange: 'opacity, transform',
                }}
            />
        ))}
    </>
);

export default StarBackground;
