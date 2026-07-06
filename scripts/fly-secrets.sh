#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🔑 Pushing secrets from web/.env to Fly.io..."

set -a
source web/.env
set +a

fly secrets set \
  DATABASE_URL="$DATABASE_URL" \
  DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID" \
  DISCORD_CLIENT_SECRET="$DISCORD_CLIENT_SECRET" \
  DISCORD_REDIRECT_URI="https://hub.challenge-hub.online/api/auth/callback" \
  JWT_SECRET="$JWT_SECRET" \
  NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"

echo "✅ Done."
