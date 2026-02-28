import { useEffect, useState } from 'react';

// Типы для Telegram WebApp SDK
interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
        };
        start_param?: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    ready: () => void;
    expand: () => void;
    close: () => void;
    openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
    openTelegramLink: (url: string) => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (ok: boolean) => void) => void;
    HapticFeedback: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        selectionChanged: () => void;
    };
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        isProgressVisible: boolean;
        setText: (text: string) => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
        show: () => void;
        hide: () => void;
        enable: () => void;
        disable: () => void;
        showProgress: (leaveActive?: boolean) => void;
        hideProgress: () => void;
    };
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

interface UseTelegramReturn {
    webApp: TelegramWebApp | null;
    initData: string;
    user: TelegramWebApp['initDataUnsafe']['user'] | null;
    isReady: boolean;
    isTelegramEnv: boolean;
    openLink: (url: string) => void;
    triggerHaptic: (type: 'impact' | 'success' | 'error') => void;
}

/**
 * Хук для работы с Telegram WebApp SDK.
 * Инициализирует SDK, разворачивает приложение, предоставляет данные пользователя.
 */
export function useTelegram(): UseTelegramReturn {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;

        if (tg) {
            // Сообщаем Telegram что приложение готово
            tg.ready();
            // Разворачиваем на весь экран
            tg.expand();
            setWebApp(tg);
        }

        setIsReady(true);
    }, []);

    const isTelegramEnv = !!webApp;

    // initData для dev-режима (пустая строка — бэкенд в DEV_MODE примет)
    const initData = webApp?.initData || '';

    const user = webApp?.initDataUnsafe?.user || null;

    // Открыть внешнюю ссылку (через Telegram или window.open)
    const openLink = (url: string) => {
        if (webApp) {
            webApp.openLink(url);
        } else {
            window.open(url, '_blank');
        }
    };

    // Тактильная обратная связь
    const triggerHaptic = (type: 'impact' | 'success' | 'error') => {
        if (!webApp?.HapticFeedback) return;
        if (type === 'impact') {
            webApp.HapticFeedback.impactOccurred('medium');
        } else if (type === 'success') {
            webApp.HapticFeedback.notificationOccurred('success');
        } else if (type === 'error') {
            webApp.HapticFeedback.notificationOccurred('error');
        }
    };

    return { webApp, initData, user, isReady, isTelegramEnv, openLink, triggerHaptic };
}
