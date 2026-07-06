#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

APP="balatro-challenge-hub-dev"

echo "🔑 Pushing secrets from web/.env.development to Fly.io ($APP)..."

set -a
source web/.env.development 2>/dev/null || {
  echo "❌ web/.env.development not found."
  echo "   Create it with your dev Supabase + Discord credentials."
  exit 1
}
set +a

fly secrets set \
  --app "$APP" \
  DATABASE_URL="$DATABASE_URL" \
  BASE_URL="https://balatro-challenge-hub-dev.fly.dev" \
  DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID" \
  DISCORD_CLIENT_SECRET="$DISCORD_CLIENT_SECRET" \
  JWT_SECRET="$JWT_SECRET" \
  NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"

echo "✅ Done. Deploy with: fly deploy --app $APP --config fly.dev.toml"
