# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app
COPY web/package.json web/bun.lockb* ./
RUN bun install --frozen-lockfile
COPY web/ ./
RUN bun run build

# Runtime stage
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Mod files for the download API
COPY mod/ ./mod/

EXPOSE 3000
CMD ["bun", "server.js"]
