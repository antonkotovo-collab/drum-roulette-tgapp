import React from 'react';

/**
 * Анимированное градиентное пятно aurora позади колеса.
 * Вместо JS-интерполяции градиентных строк — три цветных слоя с CSS opacity-анимацией (GPU).
 */
const AuroraBackground: React.FC = () => (
    <div
        style={{
            position: 'absolute',
            top: '50%', left: '50%',
            marginTop: -210, marginLeft: -210,
            width: 420, height: 420,
            pointerEvents: 'none', zIndex: 0,
        }}
    >
        {/* Слой 1: Фиолетовый → Розовый */}
        <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, #7c3aed 0%, #db2777 50%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'pulse-opacity 9s ease-in-out infinite',
            '--pulse-from': '0.8',
            '--pulse-to': '1',
            willChange: 'opacity',
        } as React.CSSProperties} />
        {/* Слой 2: Синий → Фиолетовый */}
        <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, #2563eb 0%, #7c3aed 50%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'pulse-opacity 9s ease-in-out infinite 3s',
            '--pulse-from': '0',
            '--pulse-to': '0.7',
            willChange: 'opacity',
        } as React.CSSProperties} />
        {/* Слой 3: Розовый → Оранжевый */}
        <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, #db2777 0%, #f59e0b 50%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'pulse-opacity 9s ease-in-out infinite 6s',
            '--pulse-from': '0',
            '--pulse-to': '0.6',
            willChange: 'opacity',
        } as React.CSSProperties} />
    </div>
);

export default AuroraBackground;
