#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOD_DIR="$(dirname "$SCRIPT_DIR")/mod"

echo "🔧 Building mod for production..."

# Copy production config over the active config
cp "$MOD_DIR/config.production.json" "$MOD_DIR/config.json"
echo "   ✅ config.production.json → config.json"

echo ""
echo "✅ Build complete. Mod in '$MOD_DIR' is ready for distribution."
echo ""
echo "   To restore dev config, edit mod/config.json manually or run:"
echo "     cp mod/config.production.json mod/config.json  # for production"
echo "     echo '{\"api_host\":\"localhost:3000\",\"api_use_https\":false}' > mod/config.json  # for local"
echo "     echo '{\"api_host\":\"hub-dev.challenge-hub.online\",\"api_use_https\":true}' > mod/config.json  # for dev"
