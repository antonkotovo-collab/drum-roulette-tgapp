# 🥁 Барабанная Рулетка — Telegram Mini App

Fullstack Telegram Mini App с барабанной рулеткой и системой призов.

## Структура проекта

```
БАРАБАН/
├── frontend/    # React + Vite + TypeScript + Tailwind + Framer Motion
├── backend/     # Node.js + Express + TypeScript + Prisma (SQLite)
└── .env.example # Шаблон переменных окружения
```

---

## 🚀 Деплой на сервер (пошаговая инструкция)

### Требования

- **Node.js** v18+ (рекомендуется v20 LTS)
- **npm** v9+
- **Nginx** (для проксирования)
- **Домен** с SSL-сертификатом (Telegram Mini App требует HTTPS)
- **Telegram Bot Token** от [@BotFather](https://t.me/BotFather)

---

### Шаг 1. Загрузка проекта на сервер

```bash
# Скопировать архив на сервер (scp, rsync, git clone — на ваш выбор)
scp БАРАБАН.zip user@server:/home/user/
ssh user@server
unzip БАРАБАН.zip
cd БАРАБАН
```

---

### Шаг 2. Настройка Backend

```bash
cd backend
npm install
```

#### Создать файл `.env`:
```bash
cp ../.env.example .env
nano .env
```

#### Заполнить переменные:
```env
# === ОБЯЗАТЕЛЬНЫЕ ===

# Telegram Bot Token (получить у @BotFather)
BOT_TOKEN="123456:ABC-DEF1234..."

# База данных SQLite (для продакшена можно PostgreSQL)
DATABASE_URL="file:./prod.db"

# === СЕРВЕР ===
PORT=3001
NODE_ENV=production

# ВАЖНО: на продакшене DEV_MODE должен быть false!
DEV_MODE=false

# CORS — URL фронтенда (ваш домен)
FRONTEND_URL="https://yourdomain.com"

# === ОПЦИОНАЛЬНО ===

# ID подарка-медведя из Telegram
# Узнать: GET https://api.telegram.org/bot{TOKEN}/getAvailableGifts
TELEGRAM_BEAR_GIFT_ID=""
```

> ⚠️ **ВАЖНО**: `DEV_MODE=false` — обязательно на продакшене! Иначе авторизация Telegram будет отключена.

#### Инициализация базы данных:
```bash
npx prisma generate
npx prisma db push
```

#### Сборка и запуск:
```bash
# Сборка TypeScript
npm run build

# Запуск
npm start
# → Backend работает на http://localhost:3001
```

#### Опционально — запуск через PM2 (рекомендуется):
```bash
npm install -g pm2
pm2 start dist/server.js --name drum-backend
pm2 save
pm2 startup
```

---

### Шаг 3. Настройка Frontend

```bash
cd ../frontend
npm install
```

#### Создать файл `.env` (если API на другом домене):
```bash
echo 'VITE_API_URL=https://yourdomain.com' > .env
```

> Если фронтенд и бэкенд на одном домене через Nginx прокси — файл `.env` не нужен.

#### Сборка:
```bash
npm run build
# → Статика появится в frontend/dist/
```

---

### Шаг 4. Настройка Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL сертификат (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Фронтенд — статика
    root /home/user/БАРАБАН/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API прокси на backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Редирект HTTP → HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

```bash
# Проверить конфиг и перезапустить
sudo nginx -t
sudo systemctl reload nginx
```

#### Получение SSL (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### Шаг 5. Настройка Telegram Bot

1. Открыть [@BotFather](https://t.me/BotFather) в Telegram
2. Выбрать вашего бота → **Bot Settings** → **Menu Button**
3. Установить URL: `https://yourdomain.com`
4. Или через команду: `/setmenubutton` → отправить URL

Также можно настроить Mini App:
1. BotFather → ваш бот → **Bot Settings** → **Web App Info**
2. Установить URL: `https://yourdomain.com`

---

## 🎰 Логика спинов

| Спин | Результат |
|------|-----------|
| 1-й  | Ничего (всегда проигрыш) |
| 2-й  | +2 дополнительных прокрута |
| 3-й  | Ничего |
| 4-й  | Telegram подарок 🐻 Медведь |
| 5-й  | +1 дополнительный прокрут |
| 6+   | Случайный купон (Золотое Яблоко / Ozon / Uber / Яндекс / Wildberries) |

**Начальные спины**: 3 штуки при регистрации  
**Ежедневный бонус**: +1 спин каждые 24 часа  
**Восстановление**: Таймер на 3 дня после окончания спинов

---

## 💰 Монетизация

- **Купоны**: Кнопка «Забрать за 2₽» → `https://esotericvision.ru/checkout/lottery`
- **Медведь**: Кнопка «Забрать подарок» → `https://t.me/servise_support`

---

## 🛠 Локальная разработка

### Backend
```bash
cd backend
npm install
# Убедиться что DEV_MODE=true в .env
npm run dev
# → http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
# API прокси на backend настроен в vite.config.ts
```

> При `DEV_MODE=true` авторизация Telegram пропускается — используется тестовый пользователь. Удобно для разработки в обычном браузере.

---

## 📁 Ключевые файлы

| Файл | Описание |
|------|----------|
| `backend/src/services/spinService.ts` | Пайплайн спинов (логика выигрышей) |
| `backend/src/services/userService.ts` | Управление пользователями, спинами, дейли бонус |
| `backend/src/middleware/telegramAuth.ts` | Валидация Telegram initData (HMAC-SHA256) |
| `backend/prisma/schema.prisma` | Схема БД (User, SpinResult) |
| `frontend/src/App.tsx` | Главный компонент приложения |
| `frontend/src/components/Drum/WheelSpin.tsx` | Колесо рулетки |
| `frontend/src/components/PrizeShowcase.tsx` | Плашка призов на главной |
| `frontend/src/components/MyPrizesPage.tsx` | Страница «Мои призы» |
| `frontend/src/components/Modal/PrizeModal.tsx` | Модалка выигрыша |
| `frontend/src/components/BottomNav.tsx` | Нижняя навигация (Liquid Glass) |

---

## 🔧 Полезные команды

```bash
# Просмотр БД через Prisma Studio
cd backend && npx prisma studio

# Сброс БД (удаляет все данные!)
cd backend && npx prisma db push --force-reset

# Пересборка фронтенда
cd frontend && npm run build
```
