import pino from 'pino';

/**
 * Структурированный логгер на базе pino.
 * В dev-режиме красивый вывод через pino-pretty.
 * В production — JSON для сбора в лог-агрегаторах.
 */
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    ...(process.env.NODE_ENV !== 'production' && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname',
            },
        },
    }),
});

export default logger;
