# Деплой Baraban (funplace.pro)

Baraban — Telegram Mini App «Барабан рулетка». Располагается на том же сервере, что и оффер **esoteric** (`esotericvision.ru`). Входящий трафик обслуживает единый **esoteric_nginx**, который роутит оба домена.

## Архитектура на сервере

```
Интернет
    │ :80 / :443
    ▼
esoteric_nginx (единственная точка входа)
    ├── esotericvision.ru ──→ esoteric_frontend:3000  (Next.js SSR)
    └── funplace.pro      ──→ baraban_frontend:80     (nginx → React SPA)
                                    │
                                    └──→ baraban_backend:3001  (Express API /api/*)

Docker-сети:
  esoteric_network: esoteric_nginx, esoteric_frontend, esoteric_backend, baraban_frontend
  baraban_net:      baraban_frontend, baraban_backend, baraban_postgres
```

`baraban_frontend` подключён к двум сетям одновременно:
- `esoteric_network` — чтобы `esoteric_nginx` мог проксировать на него по имени контейнера
- `baraban_net` — чтобы его внутренний nginx мог проксировать `/api/*` на `baraban_backend`

Certbot (`esoteric_certbot`) обслуживает SSL для обоих доменов.

---

## Переменные окружения

Скопировать `.env.production` в `.env` и заполнить перед запуском:

```bash
cp .env.production .env
```

| Переменная              | Описание                                                  |
|-------------------------|-----------------------------------------------------------|
| `POSTGRES_PASSWORD`     | Пароль базы данных (придумать надёжный)                   |
| `BOT_TOKEN`             | Telegram Bot Token от @BotFather                          |
| `TELEGRAM_BEAR_GIFT_ID` | ID подарка из `GET /bot{TOKEN}/getAvailableGifts`         |

---

## Первый деплой на сервере

> **Важно:** esoteric-стек должен быть запущен ДО baraban.
> Baraban подключается к `esoteric_network` как к external сети — если она не существует, `docker compose up` завершится с ошибкой.

### Шаг 1. Убедиться что esoteric-стек запущен

```bash
cd ~/AffiliateService
docker compose -f backend/offers/esoteric/docker-compose.base.yml \
               -f backend/offers/esoteric/docker-compose.prod.yml up -d
```

Проверить что `esoteric_network` существует:
```bash
docker network ls | grep esoteric_network
```

### Шаг 2. Пересобрать esoteric_nginx (один раз, после добавления baraban)

Нужно только при первом деплое baraban или после изменений в `funplace.conf` / `docker-compose.prod.yml`:

```bash
docker compose -f backend/offers/esoteric/docker-compose.base.yml \
               -f backend/offers/esoteric/docker-compose.prod.yml \
               build nginx

docker compose -f backend/offers/esoteric/docker-compose.base.yml \
               -f backend/offers/esoteric/docker-compose.prod.yml \
               up -d nginx
```

nginx поднимется с HTTP-only конфигом для `funplace.pro` (без SSL). `esotericvision.ru` работает в штатном режиме.

Если nginx упал — проверить конфиг:
```bash
docker exec esoteric_nginx nginx -t
docker logs esoteric_nginx --tail 30
```

### Шаг 3. Поднять baraban

```bash
cd ~/AffiliateService/devops/baraban

cp .env.production .env
# Заполнить .env: POSTGRES_PASSWORD, BOT_TOKEN, TELEGRAM_BEAR_GIFT_ID

docker compose up -d --build
```

Проверить что контейнеры запущены:
```bash
docker ps | grep baraban
```

### Шаг 4. Получить SSL для funplace.pro

Убедиться, что DNS `funplace.pro` указывает на этот сервер, затем:

```bash
./ssl-init.sh your@email.com
```

Скрипт:
1. Проверяет, что `baraban_frontend`, `esoteric_nginx` и `esoteric_certbot` запущены
2. Получает сертификат через `esoteric_certbot` (webroot challenge)
3. Записывает полный SSL-конфиг поверх `backend/offers/esoteric/nginx/prod/funplace.conf`
4. Делает `nginx -s reload` — rebuild образа не нужен

Авто-обновление: `esoteric_certbot` проверяет сертификаты каждые 12 часов.

---

## Обновление кода baraban

```bash
cd ~/AffiliateService
git pull

cd devops/baraban
docker compose up -d --build
```

Esoteric-стек при этом не затрагивается.

---

## Перезапуск / откат

```bash
# Перезапустить все сервисы baraban
docker compose -f ~/AffiliateService/devops/baraban/docker-compose.yml restart

# Посмотреть логи
docker logs baraban_backend --tail 50
docker logs baraban_frontend --tail 50

# Остановить
docker compose -f ~/AffiliateService/devops/baraban/docker-compose.yml down
```

---

## Локальная разработка

`docker-compose.override.yml` автоматически подхватывается Docker Compose и включает `DEV_MODE=true` (отключает проверку Telegram-подписи).

> Файл override **не копировать на сервер**.

```bash
cd devops/baraban
docker compose up -d   # автоматически применит override.yml
```

Только фронтенд через Vite:
```bash
cd frontend/baraban
npm install && npm run dev
```

---

## Диагностика

```bash
# Проверить сеть — baraban_frontend должен быть в esoteric_network
docker network inspect esoteric_network | grep baraban

# Проверить nginx конфиг
docker exec esoteric_nginx nginx -t

# Логи nginx (все ошибки)
docker logs esoteric_nginx 2>&1 | grep -i "error\|emerg\|crit"

# Логи в реальном времени
docker logs esoteric_nginx -f
```

---

## Структура файлов

```
devops/baraban/
├── docker-compose.yml           # prod — основной стек baraban
├── docker-compose.override.yml  # локальный dev (DEV_MODE, не копировать на сервер)
├── .env.production              # шаблон переменных окружения
├── ssl-init.sh                  # первичный выпуск SSL-сертификата
├── nginx.funplace.conf          # устарело (см. ниже)
└── nginx.funplace.http.conf     # устарело (см. ниже)
```

Актуальный nginx-конфиг для `funplace.pro` (HTTP bootstrap, заменяется ssl-init.sh):
```
backend/offers/esoteric/nginx/prod/funplace.conf
```
