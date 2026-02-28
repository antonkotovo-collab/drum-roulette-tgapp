import React, { useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { PRIZES } from '../../types/prizes';
import { useGameStore } from '../../store/gameStore';

const NUM_ITEMS = PRIZES.length; // 8
const ITEM_HEIGHT = 88; // высота одного сегмента барабана (px)
const ANGLE_PER_ITEM = 360 / NUM_ITEMS; // 45° между призами

// Радиус цилиндра вычисляется из длины окружности = NUM_ITEMS * ITEM_HEIGHT
const RADIUS = Math.round((NUM_ITEMS * ITEM_HEIGHT) / (2 * Math.PI)); // ≈ 112px

// Высота видимого окна барабана (3 сегмента видно)
const VISIBLE_HEIGHT = ITEM_HEIGHT * 3;
const DRUM_WIDTH = 280;

/**
 * Настоящий 3D-барабан с CSS perspective.
 * Цилиндр составлен из N граней, каждая повёрнута на i*ANGLE_PER_ITEM по оси X,
 * и вынесена на RADIUS по оси Z. При анимации вращается весь цилиндр (rotateX).
 */
const DrumReel: React.FC = () => {
    const controls = useAnimation();
    const { reelPosition, targetPrizeIndex, isSpinning } = useGameStore();
    const currentAngleRef = useRef(0);

    // reelPosition теперь хранит угол в градусах (отрицательный = барабан крутится вперёд)
    React.useEffect(() => {
        if (isSpinning && reelPosition !== 0) {
            controls.start({
                rotateX: reelPosition,
                transition: {
                    duration: 4,
                    ease: [0.08, 0.6, 0.25, 1], // быстрый старт → плавная остановка
                },
            });
            currentAngleRef.current = reelPosition;
        }
    }, [isSpinning, reelPosition, controls]);

    // Сброс позиции после закрытия модала
    React.useEffect(() => {
        if (!isSpinning && reelPosition === 0) {
            controls.set({ rotateX: 0 });
            currentAngleRef.current = 0;
        }
    }, [isSpinning, reelPosition, controls]);

    return (
        <div className="flex flex-col items-center gap-0 w-full">
            {/* ── Обёртка барабана ─────────────────────────────────────────────── */}
            <div className="relative flex items-center justify-center w-full">

                {/* Боковые «торцы» барабана — декоративные кольца */}
                <DrumEndCap side="left" />
                <DrumEndCap side="right" />

                {/* ── Основной блок: perspective + clip ────────────────────────── */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        width: `${DRUM_WIDTH}px`,
                        height: `${VISIBLE_HEIGHT}px`,
                        perspective: `${RADIUS * 4}px`,
                        perspectiveOrigin: 'center center',
                        background: 'linear-gradient(to bottom, #080808 0%, #111111 30%, #111111 70%, #080808 100%)',
                        borderRadius: '12px',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
                    }}
                >
                    {/* Центральный highlight — подсвеченная зона выбранного приза */}
                    <div
                        className="absolute left-0 right-0 pointer-events-none z-20"
                        style={{
                            top: `${VISIBLE_HEIGHT / 2 - ITEM_HEIGHT / 2}px`,
                            height: `${ITEM_HEIGHT}px`,
                            background: 'linear-gradient(to bottom, rgba(127,255,0,0.06), rgba(127,255,0,0.04), rgba(127,255,0,0.06))',
                            borderTop: '1.5px solid rgba(127,255,0,0.5)',
                            borderBottom: '1.5px solid rgba(127,255,0,0.5)',
                            boxShadow: '0 0 20px rgba(127,255,0,0.2)',
                        }}
                    />

                    {/* Верхний и нижний градиенты fade — создают иллюзию глубины цилиндра */}
                    <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                            background: `
                linear-gradient(to bottom,
                  rgba(8,8,8,0.95) 0%,
                  rgba(8,8,8,0.5) 18%,
                  transparent 35%,
                  transparent 65%,
                  rgba(8,8,8,0.5) 82%,
                  rgba(8,8,8,0.95) 100%
                )
              `,
                        }}
                    />

                    {/* ── 3D Цилиндр ──────────────────────────────────────────────── */}
                    <motion.div
                        animate={controls}
                        initial={{ rotateX: 0 }}
                        style={{
                            transformStyle: 'preserve-3d',
                            position: 'absolute',
                            width: '100%',
                            height: `${ITEM_HEIGHT}px`,
                            top: '50%',
                            marginTop: `-${ITEM_HEIGHT / 2}px`,
                            willChange: 'transform',
                        }}
                    >
                        {PRIZES.map((prize, i) => {
                            const faceAngle = i * ANGLE_PER_ITEM; // угол этой грани
                            const isTarget = i === targetPrizeIndex;

                            return (
                                <div
                                    key={prize.id}
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: `${ITEM_HEIGHT}px`,
                                        // Размещаем грань на поверхности цилиндра
                                        transform: `rotateX(${-faceAngle}deg) translateZ(${RADIUS}px)`,
                                        backfaceVisibility: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        padding: '0 20px',
                                    }}
                                >
                                    {/* Иконка */}
                                    <span
                                        style={{
                                            fontSize: '36px',
                                            lineHeight: 1,
                                            flexShrink: 0,
                                            filter: isTarget && !isSpinning
                                                ? 'drop-shadow(0 0 8px rgba(127,255,0,0.8))'
                                                : 'none',
                                            transition: 'filter 0.3s',
                                        }}
                                    >
                                        {prize.icon}
                                    </span>

                                    {/* Название */}
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            color: isTarget && !isSpinning ? '#7FFF00' : '#cccccc',
                                            lineHeight: 1.2,
                                            textAlign: 'left',
                                            maxWidth: '160px',
                                            transition: 'color 0.3s',
                                        }}
                                    >
                                        {prize.name}
                                    </span>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>

            {/* Стрелка-указатель снизу */}
            <div style={{
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '13px solid #7FFF00',
                filter: 'drop-shadow(0 0 6px rgba(127,255,0,0.8))',
                marginBottom: '-4px',
            }} />
        </div>
    );
};

/** Декоративные торцевые кольца барабана */
function DrumEndCap({ side }: { side: 'left' | 'right' }) {
    return (
        <div
            style={{
                flexShrink: 0,
                width: '28px',
                height: `${VISIBLE_HEIGHT}px`,
                background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'},
          #1a1a1a 0%, #2a2a2a 40%, #1a1a1a 100%)`,
                borderRadius: side === 'left'
                    ? `${VISIBLE_HEIGHT / 2}px 0 0 ${VISIBLE_HEIGHT / 2}px`
                    : `0 ${VISIBLE_HEIGHT / 2}px ${VISIBLE_HEIGHT / 2}px 0`,
                border: '1.5px solid #333',
                borderRight: side === 'left' ? 'none' : '1.5px solid #333',
                borderLeft: side === 'right' ? 'none' : '1.5px solid #333',
                boxShadow: side === 'left'
                    ? 'inset -4px 0 8px rgba(0,0,0,0.5)'
                    : 'inset 4px 0 8px rgba(0,0,0,0.5)',
                // Зелёное свечение на торце
                outline: '1px solid rgba(127,255,0,0.15)',
            }}
        />
    );
}

export default DrumReel;
