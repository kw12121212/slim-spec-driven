#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/skills"

# Parse flags
PROJECT_MODE=false
for arg in "$@"; do
  case "$arg" in
    --project) PROJECT_MODE=true ;;
  esac
done

if $PROJECT_MODE; then
  TARGET_DIR="$(pwd)/.agent/skills"
else
  TARGET_DIR="$HOME/.agents/skills"
fi

echo "Installing skills to: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

installed=0
skipped=0

for skill_file in "$SKILLS_SRC"/*.md; do
  [ -f "$skill_file" ] || continue
  filename="$(basename "$skill_file")"
  target="$TARGET_DIR/$filename"

  if [ -L "$target" ]; then
    # Update existing symlink
    ln -sf "$skill_file" "$target"
    echo "  updated: $filename"
    installed=$((installed + 1))
  elif [ -e "$target" ]; then
    # Non-symlink file exists — skip to avoid overwriting user content
    echo "  skipped: $filename (non-symlink file exists at $target)"
    skipped=$((skipped + 1))
  else
    ln -s "$skill_file" "$target"
    echo "  linked:  $filename"
    installed=$((installed + 1))
  fi
done

echo ""
echo "Done. $installed skill(s) installed, $skipped skipped."
if $PROJECT_MODE; then
  echo "Skills are available project-locally at: $TARGET_DIR"
else
  echo "Skills are available globally at: $TARGET_DIR"
fi
