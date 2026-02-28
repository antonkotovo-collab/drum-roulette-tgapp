# Drum Roulette Backend

Express + TypeScript + Prisma backend для Telegram Mini App.

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Скопировать и заполнить .env
cp .env.example .env

# 3. Сгенерировать Prisma клиент
npm run prisma:generate

# 4. Выполнить миграции (PostgreSQL должен быть запущен)
npm run prisma:migrate

# 5. Запустить в dev-режиме
npm run dev
```

## API Endpoints

| Method | Path       | Описание                    |
|--------|------------|-----------------------------|
| GET    | /health    | Healthcheck                 |
| GET    | /api/user  | Данные пользователя         |
| POST   | /api/user  | Регистрация/обновление      |
| POST   | /api/spin  | Прокрутить барабан          |

## Переменные окружения

| Переменная   | Описание                              |
|--------------|---------------------------------------|
| DATABASE_URL | PostgreSQL connection string          |
| BOT_TOKEN    | Telegram Bot Token для HMAC валидации |
| PORT         | Порт сервера (default: 3001)          |
| DEV_MODE     | `true` = отключить Telegram auth      |
| FRONTEND_URL | URL фронтенда для CORS                |

## Логика спинов

- Спин №1 → всегда проигрыш (`"nothing"`)
- Спин №2+ → взвешенный случайный приз
- Вся логика на сервере, клиент получает результат только после завершения анимации
