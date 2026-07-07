# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Build-time vars for Next.js client bundle (NEXT_PUBLIC_ are inlined at build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

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

# Mod files — build zip once at image build time, serve as static asset
COPY mod/ ./mod/
RUN apt-get update && apt-get install -y --no-install-recommends zip && \
    cd mod && \
    cp config.production.json config.json && \
    zip -r /app/public/challenge-loader-mod.zip . \
      -x "*.DS_Store" "AGENTS.md" "config.production.json" "hub_challenges/*" && \
    apt-get remove -y zip && apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 3000
CMD ["bun", "server.js"]
