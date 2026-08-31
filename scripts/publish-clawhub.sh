#!/usr/bin/env bash
# Publish all PostLake agent skills to ClawHub (https://clawhub.ai).
# Requires: npx clawhub login  (once)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMMIT="$(git -C "$ROOT" rev-parse HEAD)"
OWNER="${CLAWHUB_OWNER:-postlake}"
TOPICS="social-media,mcp,postlake,publishing,analytics"
CATS="communication,development,integrations"

for dir in "$ROOT"/skills/postlake-*/; do
  slug="$(basename "$dir")"
  name="PostLake ${slug#postlake-}"
  echo "Publishing $slug ..."
  npx -y clawhub skill publish "$dir" \
    --slug "$slug" \
    --name "$name" \
    --owner "$OWNER" \
    --categories "$CATS" \
    --topics "$TOPICS" \
    --source-repo PostLake/postlake-mcp \
    --source-commit "$COMMIT" \
    --source-path "skills/$slug"
done
