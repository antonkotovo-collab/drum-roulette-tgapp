/**
 * PM2 Ecosystem Config для drum-roulette backend
 *
 * Запуск:  pm2 reload ecosystem.config.js --update-env
 * Стоп:    pm2 delete drum-backend
 * Сохр.:   pm2 save
 *
 * ВАЖНО: BOT_TOKEN и другие секреты берутся из .env на сервере.
 * Для prod-сервера значения env выставлены явно ниже чтобы PM2
 * гарантированно передавал их в процесс (dotenv не гарантирует загрузку
 * в некоторых версиях PM2).
 */

// Читаем .env вручную как fallback
const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const [key, ...rest] = line.split('=');
            if (key && !key.startsWith('#')) {
                env[key.trim()] = rest.join('=').trim();
            }
        });
        return env;
    } catch {
        return {};
    }
}

const envFile = parseEnvFile(path.join(__dirname, '.env'));

module.exports = {
    apps: [{
        name: 'drum-backend',
        script: path.join(__dirname, 'dist/server.js'),
        cwd: __dirname,
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '300M',
        env: {
            NODE_ENV: 'production',
            PORT: '3001',
            DEV_MODE: 'false',
            FRONTEND_URL: 'https://funplace.pro',
            // Явно берём из .env файла — гарантируем что PM2 всегда получает BOT_TOKEN
            BOT_TOKEN: envFile.BOT_TOKEN || process.env.BOT_TOKEN || '',
            BOT_USERNAME: envFile.BOT_USERNAME || process.env.BOT_USERNAME || '',
            WEBHOOK_SECRET: envFile.WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '',
            DATABASE_URL: envFile.DATABASE_URL || process.env.DATABASE_URL || '',
            TELEGRAM_BEAR_GIFT_ID: envFile.TELEGRAM_BEAR_GIFT_ID || process.env.TELEGRAM_BEAR_GIFT_ID || '',
        },
    }],
};
