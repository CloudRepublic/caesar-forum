# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install --global npm@10.9.3

COPY package*.json ./
RUN npm install --include=dev --no-audit --no-fund \
    && test -x node_modules/.bin/tsx

COPY . .
RUN npm run build
RUN npm prune --omit=dev --no-audit --no-fund

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
