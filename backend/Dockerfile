# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY tsconfig.json .
COPY src ./src
COPY prisma ./prisma

# Генерируем Prisma-клиент под linux/alpine (целевая платформа)
RUN npx prisma generate

# Компилируем TypeScript → dist/
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

# Копируем node_modules из builder (включая prisma CLI и query engine)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 3001
ENV NODE_ENV=production

# Запускаем миграции, затем сервер
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
