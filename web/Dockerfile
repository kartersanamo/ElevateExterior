# syntax=docker/dockerfile:1.4

FROM node:20-alpine AS base
RUN apk add --no-cache openssl

FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts --prefer-offline && \
    npx prisma generate

FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV DATABASE_URL="file:./data/db.sqlite"
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --prefer-offline && \
    npx prisma generate
COPY next.config.ts tsconfig.json postcss.config.mjs middleware.ts next-env.d.ts ./
COPY public ./public
COPY app ./app
COPY components ./components
COPY lib ./lib
RUN --mount=type=cache,target=/app/.next/cache \
    npx prisma generate && \
    npx next build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=prod-deps /app/prisma ./prisma
COPY --from=prod-deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=prod-deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prod-deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=prod-deps /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=prod-deps /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
RUN mkdir -p /app/data
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
