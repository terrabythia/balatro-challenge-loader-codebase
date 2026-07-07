#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MOD_DIR="$ROOT_DIR/mod"
OUTPUT="$ROOT_DIR/web/public/challenge-loader-mod.zip"

print_help() {
  echo "Usage: $0 [--env dev|prod]"
  echo ""
  echo "Build the Challenge Loader mod zip and place it in web/public/."
  echo ""
  echo "  --env dev    Use hub-dev.challenge-hub.online config"
  echo "  --env prod   Use hub.challenge-hub.online config (default)"
  exit 0
}

ENV="prod"
case "${1:-}" in
  --help|-h) print_help ;;
  --env)
    ENV="${2:-prod}"
    if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
      echo "Invalid --env value: '$ENV'. Use 'dev' or 'prod'." >&2
      exit 1
    fi
    ;;
  "") ;;
  *) echo "Unknown flag: $1. Use --help for usage." >&2; exit 1 ;;
esac

# Save the current config so we can restore it
ORIGINAL_CONFIG=$(cat "$MOD_DIR/config.json" 2>/dev/null || echo "")

echo "🔧 Building mod zip ($ENV environment)..."

# Apply environment config
if [[ "$ENV" == "dev" ]]; then
  echo '{"api_host":"hub-dev.challenge-hub.online","api_use_https":true}' > "$MOD_DIR/config.json"
  echo "   ✅ dev config applied"
else
  cp "$MOD_DIR/config.production.json" "$MOD_DIR/config.json"
  echo "   ✅ production config applied"
fi

# Create the zip
cd "$MOD_DIR"
zip -r "$OUTPUT" . \
  -x "*.DS_Store" "AGENTS.md" "config.production.json" "hub_challenges/*" \
  > /dev/null
cd "$ROOT_DIR"

echo "   ✅ $OUTPUT"

# Restore original config
if [[ -n "$ORIGINAL_CONFIG" ]]; then
  echo "$ORIGINAL_CONFIG" > "$MOD_DIR/config.json"
  echo "   ✅ original config restored"
fi

echo ""
echo "Done. Publicly available at /challenge-loader-mod.zip"
