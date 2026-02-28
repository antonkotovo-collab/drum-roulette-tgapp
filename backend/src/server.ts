import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import pinoHttp from 'pino-http';
import spinRouter from './routes/spin';
import userRouter from './routes/user';
import winnersRouter from './routes/winners';
import { logger } from './lib/logger';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────

// CORS: разрешаем запросы с фронтенда
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        // Telegram WebApp может открываться из любого iframe
        /\.telegram\.org$/,
        /\.twa\.dev$/,
    ],
    credentials: true,
}));

// Структурированное HTTP-логирование через pino
app.use(pinoHttp({ logger, autoLogging: process.env.NODE_ENV !== 'test' }));

// Парсинг JSON тела запросов
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Общий лимит: 100 запросов в минуту на IP
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Слишком много запросов, попробуйте позже' },
});

// Строгий лимит для спинов: 20 в минуту на IP (защита от скрипт-атак)
const spinLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Слишком много спинов, подождите минуту' },
    keyGenerator: (req) => {
        // Учитываем Telegram User ID из тела запроса (если есть) для точного ограничения
        return req.ip || 'unknown';
    },
});

app.use(generalLimiter);

// ─── Роуты ────────────────────────────────────────────────────────────────────

app.use('/api/spin', spinLimiter, spinRouter);
app.use('/api/user', userRouter);
app.use('/api/winners', winnersRouter);

// Healthcheck
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ─── Глобальный Error Handler ─────────────────────────────────────────────────
// Express распознаёт error middleware по 4 параметрам (err, req, res, next)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
    });
});

// ─── Запуск ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    logger.info(`🥁 Drum Roulette Backend running on port ${PORT}`);
    logger.info(`   Mode: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   Dev mode: ${process.env.DEV_MODE === 'true' ? 'ON (no Telegram auth)' : 'OFF'}`);
});

export default app;
