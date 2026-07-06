#!/usr/bin/env bash
# Bumps the patch version in mod/mod.json and echoes the new version.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOD_JSON="$(dirname "$SCRIPT_DIR")/mod/mod.json"

VERSION=$(jq -r '.version' "$MOD_JSON")
MAJOR=$(echo "$VERSION" | cut -d. -f1)
MINOR=$(echo "$VERSION" | cut -d. -f2)
PATCH=$(echo "$VERSION" | cut -d. -f3)

NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

jq --arg v "$NEW_VERSION" '.version = $v' "$MOD_JSON" > "${MOD_JSON}.tmp"
mv "${MOD_JSON}.tmp" "$MOD_JSON"

echo "$NEW_VERSION"
