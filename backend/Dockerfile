FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S gavel -u 1001

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ARG GAVEL_REVISION=development
ENV GAVEL_REVISION=${GAVEL_REVISION}
ENV NODE_ENV=production
ENV PORT=8080

USER gavel

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]