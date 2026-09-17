# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install --global pnpm@9.15.9

COPY package*.json ./
RUN pnpm import \
    && pnpm install --frozen-lockfile \
    && test -x node_modules/.bin/tsx

COPY . .
RUN pnpm run build
RUN pnpm prune --prod

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
