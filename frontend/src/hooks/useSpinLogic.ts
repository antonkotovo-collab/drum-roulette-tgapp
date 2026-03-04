import { useCallback, useRef } from 'react';
import { PRIZES, NOTHING_SECTOR_INDICES, BEAR_SECTOR_INDEX } from '../types/prizes';
import { spinDrum } from '../services/api';
import { useGameStore } from '../store/gameStore';
import { useTelegram } from './useTelegram';


const NUM_ITEMS = PRIZES.length;       // 8 призов
const NUM_SECTORS = NUM_ITEMS * 2;     // 16 секторов на колесе
const ANGLE_PER_SEG = 360 / NUM_SECTORS; // 22.5° на сектор
const FULL_LAPS = 8;

// Чётные секторы (0,2,4,...) — призы, нечётные — пустые/медведь
// NOTHING_SECTOR_INDICES импортирован из types/prizes (без индекса 1 = медведь)

/**
 * Вычисляет угол поворота колеса для нужного приза (16 секторов).
 *
 * Старая формула (baseAngle - LAPS*360 - centerAngle) работала только при baseAngle=0.
 * При накопленном угле колесо останавливалось на НЕПРАВИЛЬНОМ секторе!
 *
 * Исправление: вычисляем delta — сколько ЕЩЁ нужно повернуть от текущей позиции,
 * чтобы нужный сектор оказался у указателя.
 */
function calcWheelAngle(sectorIdx: number, baseAngle: number): number {
    // Абсолютная цель: центр нужного сектора (в градусах CCW)
    const targetNetCCW = (sectorIdx + 0.5) * ANGLE_PER_SEG;

    // Текущая накопленная позиция (нормализована в [0, 360))
    const currentNetCCW = ((-baseAngle) % 360 + 360) % 360;

    // Насколько ещё нужно повернуть CCW (от текущей позиции до цели)
    let delta = ((targetNetCCW - currentNetCCW) % 360 + 360) % 360;
    // Гарантируем минимальный ход (не останавливаемся сразу)
    if (delta < 5) delta += 360;

    return baseAngle - (FULL_LAPS * 360 + delta);
}



export function useSpinLogic() {
    const { initData, triggerHaptic } = useTelegram();
    const {
        isSpinning,
        spinsLeft,
        setSpinning,
        setError,
        setSpinResult,
        setReelPosition,
        setTargetPrizeIndex,
        openModal,
        resetGame,
    } = useGameStore();

    // Ref-замок против двойного нажатия (ref синхронный, в отличие от стейта)
    const spinningRef = useRef(false);

    // Отслеживаем текущий угол чтобы каждый следующий спин добавлял к нему
    const currentAngleRef = useRef(0);

    const spin = useCallback(async () => {
        if (spinningRef.current || spinsLeft <= 0) return;
        spinningRef.current = true;

        resetGame();
        setSpinning(true);
        setError(null);
        triggerHaptic('impact');

        try {
            const result = await spinDrum(initData);

            let angle: number;
            let wheelSectorIdx: number; // реальный индекс сектора на колесе (0-15)

            if (result.isWin && result.prizeId) {
                if (result.prizeId === 'telegram_bear') {
                    // Медведь — особый сектор (BEAR_SECTOR_INDEX = 1, не чётный)
                    wheelSectorIdx = BEAR_SECTOR_INDEX;
                } else {
                    // Обычная победа: чётный сектор (prizeIdx * 2)
                    const idx = PRIZES.findIndex((p) => p.id === result.prizeId);
                    wheelSectorIdx = (idx === -1 ? 0 : idx) * 2;
                }
                angle = calcWheelAngle(wheelSectorIdx, currentAngleRef.current);
            } else {
                // Проигрыш: случайный nothing-сектор (без медведя)
                const nothingIdx = NOTHING_SECTOR_INDICES[
                    Math.floor(Math.random() * NOTHING_SECTOR_INDICES.length)
                ];
                wheelSectorIdx = -1;
                angle = calcWheelAngle(nothingIdx, currentAngleRef.current);
            }

            currentAngleRef.current = angle;
            setReelPosition(angle);
            setTargetPrizeIndex(result.isWin ? wheelSectorIdx : -1); // единственный вызов

            // Ждём окончания анимации (4 секунды + буфер 300мс)
            await new Promise((resolve) => setTimeout(resolve, 4300));

            // Обновляем счётчик спинов ПОСЛЕ анимации — чтобы пользователь видел
            // изменение цифры в момент показа результата, а не во время вращения
            setSpinResult(result);

            if (result.isWin) {
                triggerHaptic('success');
                openModal('prize');
            } else {
                triggerHaptic('error');
                openModal('lose');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ошибка соединения';
            if (message === 'No spins left') {
                // Спины закончились — обновляем счётчик и показываем соответствующий экран
                setSpinResult({ success: false, spinsLeft: 0, spinNumber: 0, result: 'nothing', prizeId: null, prize: null, isWin: false });
                openModal('lose');
            } else {
                setError(message);
            }
            triggerHaptic('error');
        } finally {
            setSpinning(false);
            spinningRef.current = false;
        }
    }, [spinsLeft, initData, resetGame, setSpinning, setError,
        setSpinResult, setReelPosition, setTargetPrizeIndex, openModal, triggerHaptic]);

    return { spin, isSpinning, spinsLeft };
}
