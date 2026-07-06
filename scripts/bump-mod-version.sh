#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

MOD_JSON="mod/mod.json"

VERSION=$(jq -r '.version' "$MOD_JSON")
MAJOR=$(echo "$VERSION" | cut -d. -f1)
MINOR=$(echo "$VERSION" | cut -d. -f2)
PATCH=$(echo "$VERSION" | cut -d. -f3)
NEW="$MAJOR.$MINOR.$((PATCH + 1))"

jq ".version = \"$NEW\"" "$MOD_JSON" > "$MOD_JSON.tmp" && mv "$MOD_JSON.tmp" "$MOD_JSON"
echo "⬆️  Mod version: $VERSION → $NEW"
