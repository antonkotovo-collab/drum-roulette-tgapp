import { useEffect } from 'react';
import { getUser } from '../services/api';
import { useGameStore } from '../store/gameStore';
import { useTelegram } from './useTelegram';

/**
 * Хук загрузки данных пользователя при инициализации приложения.
 * Также обновляет данные при возврате в приложение (visibilitychange).
 * Возвращает nextBonusMs — миллисекунды до следующего дейли бонуса.
 */
export function useUserData() {
    const { initData, user: tgUser, isReady } = useTelegram();
    const { setLoading, setUserData, setError } = useGameStore();

    useEffect(() => {
        if (!isReady) return;

        const fetchUser = async () => {
            try {
                setLoading(true);
                const u = await getUser(initData);
                setUserData({
                    spinsUsed: u.spinsUsed,
                    spinsLeft: u.spinsLeft,
                    userId: u.id,
                    firstName: u.firstName || tgUser?.first_name || null,
                    nextBonusMs: u.nextBonusMs ?? 0,
                });
            } catch (err: any) {
                setError(err?.message || 'Ошибка загрузки. Перезапустите приложение.');
                setLoading(false);
            }
        };

        fetchUser();

        // Обновляем данные при возврате в приложение
        const handleVisibility = () => {
            if (!document.hidden) fetchUser();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [isReady, initData]);
}
