# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable

# ---------- 1) 의존성 설치 (dev 포함, 빌드용) ----------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- 2) 빌드 (tsoa 라우트/스펙 생성 + prisma generate + tsc) ----------
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma:generate
RUN pnpm build

# ---------- 3) 운영용 의존성만 별도 설치 (devDependencies 제외) ----------
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---------- 4) 최종 런타임 이미지 ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 컨테이너 안에서 root로 안 돌리기
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY package.json ./

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server/server.js"]