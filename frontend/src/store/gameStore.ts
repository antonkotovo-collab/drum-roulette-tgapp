import { create } from 'zustand';
import { Prize, ModalType, SpinResponse } from '../types/prizes';

interface GameState {
    // Состояние пользователя
    spinsUsed: number;
    spinsLeft: number;
    userId: number | null;
    firstName: string | null;
    nextBonusMs: number;  // мс до следующего бонуса (0 = доступен прямо сейчас)

    // Состояние игры
    isSpinning: boolean;
    isLoading: boolean;
    error: string | null;

    // Результат последнего спина
    lastResult: SpinResponse | null;

    // Модальное окно
    modalType: ModalType;
    showModal: boolean;

    // Позиция барабана для анимации (в пикселях)
    reelPosition: number;
    targetPrizeIndex: number;

    // Действия
    setUserData: (data: { spinsUsed: number; spinsLeft: number; userId: number; firstName: string | null; nextBonusMs: number }) => void;
    setSpinning: (spinning: boolean) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSpinResult: (result: SpinResponse) => void;
    setReelPosition: (position: number) => void;
    setTargetPrizeIndex: (index: number) => void;
    openModal: (type: ModalType) => void;
    closeModal: () => void;
    resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    // Начальное состояние
    spinsUsed: 0,
    spinsLeft: 2,
    userId: null,
    firstName: null,
    nextBonusMs: 0,

    isSpinning: false,
    isLoading: true,
    error: null,

    lastResult: null,

    modalType: null,
    showModal: false,

    reelPosition: 0,
    targetPrizeIndex: -1,

    // Установить данные пользователя после загрузки
    setUserData: (data) => set({
        spinsUsed: data.spinsUsed,
        spinsLeft: data.spinsLeft,
        userId: data.userId,
        firstName: data.firstName,
        nextBonusMs: data.nextBonusMs,
        isLoading: false,
    }),

    setSpinning: (spinning) => set({ isSpinning: spinning }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    // Сохранить результат спина (обновляем spinsLeft из ответа сервера)
    setSpinResult: (result) => set((state) => ({
        lastResult: result,
        spinsLeft: result.spinsLeft,
        spinsUsed: state.spinsUsed + 1,
    })),

    setReelPosition: (position) => set({ reelPosition: position }),
    setTargetPrizeIndex: (index) => set({ targetPrizeIndex: index }),

    openModal: (type) => set({ modalType: type, showModal: true }),
    closeModal: () => set({ showModal: false, modalType: null }),

    resetGame: () => set({
        lastResult: null,
        showModal: false,
        modalType: null,
        error: null,
        isSpinning: false,
    }),
}));

// Вспомогательный тип для selector
export type { Prize };
