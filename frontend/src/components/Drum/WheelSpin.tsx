import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PRIZES, NOTHING_SECTOR_INDICES, NOTHING_PRIZE, BEAR_SECTOR_INDEX, BEAR_PRIZE } from '../../types/prizes';
import { useGameStore } from '../../store/gameStore';

// ─── Размеры ────────────────────────────────────────────────────────────────
const SIZE = 358;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 168;
const R_RIM = R_OUTER + 10;
const R_INNER = 34;
const R_TEXT = 108;
const R_ICON = 128;

const NUM = PRIZES.length * 2; // 16
const ANGLE = 360 / NUM;       // 22.5°
const NOTHING_SET = new Set(NOTHING_SECTOR_INDICES);
// Чередуем: приз → пусто → приз → пусто...
// Индекс 1 (BEAR_SECTOR_INDEX) — сектор медведя вместо обычного "не повезло"
const WHEEL_PZ = PRIZES.flatMap((p, pi) => [
    p,
    pi * 2 + 1 === BEAR_SECTOR_INDEX ? BEAR_PRIZE : NOTHING_PRIZE,
]);

// ─── Брендовые цвета ─────────────────────────────────────────────────────────
const CLR_A = [
    '#e8e8e8', '#CAFC38', '#005BFF', '#111111',
    '#FFCC00', '#CB11AB', '#D63031', '#FF8C00',
];
const CLR_B = [
    '#f5f5f5', '#d8fd6a', '#3379ff', '#2a2a2a',
    '#FFE030', '#d930bc', '#e74c3c', '#FFA500',
];

// Тёмные края для градиента — по индексу приза (Math.floor(i/2))
const CLR_DARK_PRIZES = [
    '#b0b0b0', '#8fc800', '#003db3', '#000000',
    '#c89900', '#8a0077', '#992020', '#cc5500',
];
const CLR_DARK = Array.from({ length: 16 }, (_, i) => {
    if (i === BEAR_SECTOR_INDEX) return '#5c3a1e'; // тёмно-коричневый для медведя
    return NOTHING_SET.has(i) ? '#110d2e' : CLR_DARK_PRIZES[Math.floor(i / 2)];
});

const TEXT_COLORS_PRIZES = [
    '#1a1a1a', '#1a2d00', '#ffffff', '#ffffff', '#3d2a00', '#ffffff', '#ffffff', '#3d1a00',
];
const TEXT_COLORS = Array.from({ length: 16 }, (_, i) => {
    if (i === BEAR_SECTOR_INDEX) return '#fff8f0';
    return NOTHING_SET.has(i) ? '#ffffff' : TEXT_COLORS_PRIZES[Math.floor(i / 2)];
});

const LABEL_PRIZES = [
    'iPhone 17', 'Зол. Яблоко', 'Ozon', 'Uber', 'Яндекс', 'WB', '+1 спин', '+2 спина',
];
const LABELS = Array.from({ length: 16 }, (_, i) => {
    if (i === BEAR_SECTOR_INDEX) return 'Медведь';
    return NOTHING_SET.has(i) ? 'Не повезло' : LABEL_PRIZES[Math.floor(i / 2)];
});

// Зол. Яблоко теперь на индексе 2 (0→iPhone, 1→пусто, 2→Яблоко)
const ZY_INDICES = new Set([2]);
const ZY_COLOR = '#CAFC38';

function sectorColor(i: number) {
    if (i === BEAR_SECTOR_INDEX) return '#c8882a'; // тёплый коричневый
    if (NOTHING_SET.has(i)) return '#5b21b6';
    return CLR_A[Math.floor(i / 2)];
}

function sectorPath(r: number, s: number, e: number) {
    const sr = (s * Math.PI) / 180, er = (e * Math.PI) / 180;
    return `M${CX} ${CY} L${CX + r * Math.cos(sr)} ${CY + r * Math.sin(sr)} A${r} ${r} 0 0 1 ${CX + r * Math.cos(er)} ${CY + r * Math.sin(er)}Z`;
}

// ─── SVG Логотипы брендов ─────────────────────────────────────────────────────
function BrandLogo({ prizeId, tc }: { prizeId: string; tc: string }) {
    switch (prizeId) {

        case 'iphone17':
            return (
                <g>
                    <circle r="11" fill="rgba(255,255,255,0.95)" />
                    <g transform="scale(0.75) translate(-12, -13)">
                        <path fill="#1a1a1a" d="
                            M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83
                            -1.207.052-2.662.805-3.532 1.818
                            -.78.896-1.454 2.338-1.273 3.714
                            1.338.104 2.715-.688 3.559-1.701z
                            M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04
                            -2.04.027-3.91 1.183-4.96 3.014
                            -2.117 3.675-.54 9.103 1.519 12.09
                            1.013 1.454 2.208 3.09 3.792 3.029
                            1.52-.065 2.09-.987 3.935-.987
                            1.831 0 2.35.987 3.96.948
                            1.637-.026 2.676-1.48 3.676-2.948
                            1.156-1.688 1.636-3.325 1.662-3.415
                            -.039-.013-3.182-1.221-3.22-4.857
                            -.026-3.04 2.48-4.494 2.597-4.559
                            -1.429-2.09-3.623-2.324-4.39-2.376
                            -2-.156-3.675 1.09-4.61 1.09z
                        " />
                    </g>
                </g>
            );

        case 'zolotoe_yabloko':
            return (
                <image href="/zya-logo.png" x="-18" y="-18" width="36" height="36" />
            );

        case 'ozon':
            return (
                <g>
                    <circle r="11" fill="#ffffff" opacity="0.95" />
                    <text fontSize="13" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#005BFF" y="0.5" fontFamily="Inter,sans-serif">O</text>
                </g>
            );

        case 'uber':
            return (
                <g>
                    <rect x="-11" y="-11" width="22" height="22" rx="5" fill="#ffffff" opacity="0.95" />
                    <text fontSize="14" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#000000" y="0.5" fontFamily="Inter,sans-serif">U</text>
                </g>
            );

        case 'yandex':
            return (
                <g>
                    <circle r="11" fill="#ffffff" opacity="0.95" />
                    <text fontSize="14" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#FFCC00" y="0.5" fontFamily="Inter,sans-serif">Я</text>
                </g>
            );

        case 'wildberries':
            return (
                <g>
                    <circle r="11" fill="#ffffff" opacity="0.95" />
                    <text fontSize="9" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#CB11AB" y="0.5" fontFamily="Inter,sans-serif">WB</text>
                </g>
            );

        case 'extra_spin_1':
            return (
                <g>
                    <circle r="11" fill="#ffffff" opacity="0.95" />
                    <text fontSize="11" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#D63031" y="0.5" fontFamily="Inter,sans-serif">×1</text>
                </g>
            );

        case 'extra_spin_2':
            return (
                <g>
                    <circle r="11" fill="#ffffff" opacity="0.95" />
                    <text fontSize="11" fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                        fill="#FF8C00" y="0.5" fontFamily="Inter,sans-serif">×2</text>
                </g>
            );

        case 'telegram_bear':
            return (
                <g>
                    <image href="/bear4444.png" x="-28" y="-32" width="56" height="56" />
                </g>
            );

        default:
            if (prizeId === 'nothing') {
                return (
                    <g>
                        <circle r="11" fill="rgba(80,70,160,0.5)" />
                        <text fontSize="14" textAnchor="middle" dominantBaseline="middle" y="0.5">😔</text>
                    </g>
                );
            }
            return <circle r="10" fill={tc} opacity="0.6" />;
    }
}

// ─── Chase LED цвета ──────────────────────────────────────────────────────────
const CHASE_COLORS = ['#f59e0b', '#fbbf24', '#fde68a', '#f59e0b', '#a78bfa', '#c084fc', '#fde68a', '#fb7185'];

// ─── Компонент ───────────────────────────────────────────────────────────────
const WHEEL_TOTAL = SIZE + 24; // 382px

const WheelSpin: React.FC = () => {
    const { reelPosition, isSpinning, targetPrizeIndex } = useGameStore();

    // Автомасштабирование под актуальный экран
    const [scale, setScale] = useState(1);
    useEffect(() => {
        const update = () => {
            const vw = window.innerWidth;
            const maxW = Math.min(vw - 8, WHEEL_TOTAL); // 4px padding each side
            setScale(Math.min(1, maxW / WHEEL_TOTAL));
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // LED rim dots
    const ledDots = Array.from({ length: 120 }, (_, i) => {
        const rad = ((i * 3 - 90) * Math.PI) / 180;
        const r = R_RIM + 3;
        const big = i % 15 === 0;
        return {
            x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad),
            r: big ? 5 : 2.5,
            fill: big ? CLR_A[Math.floor(i / 15) % 8] : 'rgba(255,255,255,0.55)',
            idx: i,
        };
    });

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            transform: `scale(${scale})`, transformOrigin: 'center top',
            // Компенсируем коллапс высоты при scale < 1
            marginBottom: scale < 1 ? `${(WHEEL_TOTAL * scale - WHEEL_TOTAL) * 0.5}px` : 0,
        }}>

            {/* ── Указатель ─────────────────────────────────────────── */}
            <div style={{ zIndex: 10, marginBottom: '-2px' }}>
                <svg width="46" height="36" viewBox="0 0 46 36">
                    <defs>
                        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fdf4ff" />
                            <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                        <filter id="ptrShadow">
                            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#7c3aed" floodOpacity="0.6" />
                        </filter>
                    </defs>
                    <polygon points="23,34 2,6 44,6" fill="url(#ag)" stroke="white" strokeWidth="2"
                        strokeLinejoin="round" filter="url(#ptrShadow)" />
                    <polygon points="23,16 10,6 36,6" fill="white" opacity="0.35" />
                    <circle cx="23" cy="6" r="6" fill="#7c3aed" stroke="white" strokeWidth="2" />
                    <circle cx="23" cy="6" r="3" fill="#e9d5ff" />
                </svg>
            </div>

            {/* ── Внешняя рамка ──────────────────────────────────────── */}
            <div
                style={{
                    position: 'relative', width: SIZE + 24, height: SIZE + 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: !isSpinning ? 'gentle-scale 3s ease-in-out infinite' : 'none',
                    '--scale-to': '1.008',
                    willChange: 'transform',
                } as React.CSSProperties}
            >
                {/* Пульсирующий ореол при вращении */}
                {isSpinning && (
                    <div style={{
                        position: 'absolute', inset: -12, borderRadius: '50%',
                        background: 'transparent',
                        boxShadow: '0 0 80px 30px rgba(168,85,247,0.6), 0 0 140px 60px rgba(219,39,119,0.3), 0 0 200px 80px rgba(251,191,36,0.15)',
                        animation: 'pulse-opacity 0.8s ease-in-out infinite',
                        '--pulse-from': '0.6',
                        '--pulse-to': '1',
                        willChange: 'opacity',
                    } as React.CSSProperties}
                    />
                )}

                {/* Статичный ободок */}
                <svg width={SIZE + 24} height={SIZE + 24}
                    viewBox={`${-12} ${-12} ${SIZE + 24} ${SIZE + 24}`}
                    style={{ position: 'absolute', inset: 0 }}>
                    <defs>
                        <linearGradient id="rimGold" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#fde68a" />
                            <stop offset="25%" stopColor="#ffffff" />
                            <stop offset="50%" stopColor="#fde68a" />
                            <stop offset="75%" stopColor="#d4a5f5" />
                            <stop offset="100%" stopColor="#fde68a" />
                        </linearGradient>
                        <filter id="ledGlow">
                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>
                    <circle cx={CX} cy={CY} r={R_RIM + 9} fill="none" stroke="url(#rimGold)" strokeWidth="4" opacity="0.9" />
                    <circle cx={CX} cy={CY} r={R_RIM + 4.5} fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
                    <circle cx={CX} cy={CY} r={R_RIM - 1} fill="none" stroke="url(#rimGold)" strokeWidth="3" opacity="0.7" />

                    {/* LED Dots */}
                    {ledDots.map((d, i) => {
                        const isChase = isSpinning && i % 15 === 0;
                        if (isChase) {
                            return (
                                <circle key={i} cx={d.x} cy={d.y} r={d.r}
                                    fill={CHASE_COLORS[Math.floor(i / 15) % CHASE_COLORS.length]}
                                    filter="url(#ledGlow)"
                                    style={{
                                        animation: `led-chase 0.5s ease-in-out infinite`,
                                        animationDelay: `${(i / 15) * 0.065}s`,
                                    }}
                                />
                            );
                        }
                        return <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.fill} />;
                    })}
                </svg>

                {/* ── Вращающийся диск ──────────────────────────────── */}
                <motion.svg
                    width={SIZE} height={SIZE}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    style={{ transformOrigin: `${CX}px ${CY}px`, flexShrink: 0 }}
                    animate={{ rotate: reelPosition }}
                    transition={{ duration: isSpinning ? 4.5 : 0, ease: [0.04, 0.7, 0.18, 1] }}
                >
                    <defs>
                        {/* Градиенты для каждого сектора: выраженная глубина от центра к краю */}
                        {WHEEL_PZ.map((prize, i) => {
                            const isZY = ZY_INDICES.has(i);
                            const isNothing = NOTHING_SET.has(i);
                            const centerClr = isZY ? ZY_COLOR : sectorColor(i);
                            const edgeClr = isZY ? '#6a9400' : CLR_DARK[i];
                            const mid = (i + 0.5) * ANGLE - 90;
                            const midRad = (mid * Math.PI) / 180;
                            const fx = (0.5 + 0.25 * Math.cos(midRad)).toFixed(3);
                            const fy = (0.5 + 0.25 * Math.sin(midRad)).toFixed(3);
                            return (
                                <radialGradient key={i} id={`sg${i}`} cx={fx} cy={fy} r="1.0"
                                    gradientUnits="objectBoundingBox">
                                    <stop offset="0%" stopColor={centerClr} stopOpacity="1" />
                                    {isNothing ? (
                                        <>
                                            <stop offset="30%" stopColor={centerClr} stopOpacity="1" />
                                            <stop offset="70%" stopColor="#2e1065" stopOpacity="1" />
                                            <stop offset="100%" stopColor={edgeClr} stopOpacity="1" />
                                        </>
                                    ) : (
                                        <>
                                            {/* Призовые: плоская зона 20%, потом глубокое затемнение */}
                                            <stop offset="20%" stopColor={centerClr} stopOpacity="1" />
                                            <stop offset="65%" stopColor={edgeClr} stopOpacity="0.55" />
                                            <stop offset="100%" stopColor={edgeClr} stopOpacity="1" />
                                        </>
                                    )}
                                </radialGradient>
                            );
                        })}

                        <radialGradient id="gloss" cx="40%" cy="25%" r="55%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="innerRim" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#fde68a" />
                            <stop offset="50%" stopColor="white" />
                            <stop offset="100%" stopColor="#fde68a" />
                        </linearGradient>

                        {/* Hub градиент — premium glassmorphism */}
                        <radialGradient id="hubOuter" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.6" />
                        </radialGradient>
                        <radialGradient id="hub" cx="35%" cy="30%" r="80%">
                            <stop offset="0%" stopColor="#c084fc" />
                            <stop offset="45%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#3b0764" />
                        </radialGradient>
                        <filter id="hubGlow">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <filter id="hubShadow">
                            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#1a0050" floodOpacity="0.9" />
                        </filter>
                        <clipPath id="wheelClip">
                            <circle cx={CX} cy={CY} r={R_OUTER} />
                        </clipPath>
                    </defs>

                    {/* ── Секторы ───────────────────────────────────── */}
                    {WHEEL_PZ.map((prize, i) => {
                        const s = i * ANGLE - 90, e = s + ANGLE;
                        const fromTopDeg = (i + 0.5) * ANGLE;
                        const needsFlip = fromTopDeg >= 90 && fromTopDeg <= 270;
                        const isWinner = !isSpinning && i === targetPrizeIndex && reelPosition !== 0;
                        const fillId = isWinner ? 'none' : `sg${i}`;
                        const fill = isWinner ? '#ffffff' : `url(#${fillId})`;
                        const tc = isWinner ? '#7c3aed' : TEXT_COLORS[i];

                        return (
                            <g key={`s${i}`}>
                                <path d={sectorPath(R_OUTER, s, e)} fill={fill} stroke="none" />

                                <g transform={`rotate(${fromTopDeg},${CX},${CY})`}>
                                    {/* Логотип */}
                                    <g transform={`translate(${CX},${CY - R_ICON}) rotate(${needsFlip ? 180 : 0})`}>
                                        <BrandLogo prizeId={prize.id} tc={tc} />
                                    </g>
                                    {/* Подпись */}
                                    <g transform={`translate(${CX},${CY - R_TEXT}) rotate(${needsFlip ? 180 : 0})`}>
                                        <text textAnchor="middle" y="0" fontSize="7.5" fontWeight="800"
                                            fontFamily="Inter,sans-serif" fill={tc}
                                            dominantBaseline="middle" textLength="36" lengthAdjust="spacingAndGlyphs">
                                            {LABELS[i]}
                                        </text>
                                    </g>
                                </g>
                            </g>
                        );
                    })}

                    {/* Разделители */}
                    {WHEEL_PZ.map((_, i) => {
                        const rad = ((i * ANGLE - 90) * Math.PI) / 180;
                        return (
                            <line key={`l${i}`} x1={CX} y1={CY}
                                x2={CX + R_OUTER * Math.cos(rad)} y2={CY + R_OUTER * Math.sin(rad)}
                                stroke="white" strokeWidth={i % 2 === 0 ? 2.5 : 1.5}
                                opacity={i % 2 === 0 ? 0.8 : 0.35} />
                        );
                    })}

                    {/* Глянец поверх секторов */}
                    <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="url(#innerRim)" strokeWidth="3.5" />
                    <circle cx={CX} cy={CY} r={R_OUTER} fill="url(#gloss)" />

                    {/* ── Втулка Premium ─────────────────────────── */}
                    {/* Мягкое тёмное кольцо вокруг хаба */}
                    <circle cx={CX} cy={CY} r={R_INNER + 14}
                        fill="rgba(10,0,30,0.55)" />
                    {/* Кольцо-обвод */}
                    <circle cx={CX} cy={CY} r={R_INNER + 10} fill="none"
                        stroke="url(#innerRim)" strokeWidth="3" opacity="0.9" />
                    {/* Основной хаб */}
                    <circle cx={CX} cy={CY} r={R_INNER}
                        fill="url(#hub)" stroke="rgba(255,255,255,0.6)" strokeWidth="2"
                        filter="url(#hubShadow)" />
                    {/* Бликовый элипс */}
                    <ellipse cx={CX - 7} cy={CY - 9} rx={11} ry={7} fill="white" opacity="0.3"
                        transform={`rotate(-30,${CX},${CY})`} />
                    <ellipse cx={CX - 4} cy={CY - 5} rx={5} ry={3} fill="white" opacity="0.5"
                        transform={`rotate(-30,${CX},${CY})`} />

                </motion.svg>
            </div>
        </div>
    );
};

export default WheelSpin;
