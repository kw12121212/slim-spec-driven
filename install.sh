#!/usr/bin/env bash
set -euo pipefail

REPO="kw12121212/slim-spec-driven"
BRANCH="main"
SCRIPTS=(
  propose
  modify
  apply
  verify
  archive
)
SKILLS=(
  spec-driven-propose
  spec-driven-modify
  spec-driven-apply
  spec-driven-verify
  spec-driven-archive
)

# Known CLI target directories
# "all" installs to ~/.agents/skills/ — the shared Agent Skills standard path
declare -A GLOBAL_DIRS=(
  [claude]="$HOME/.claude/skills"
  [opencode]="$HOME/.config/opencode/skills"
  [all]="$HOME/.agents/skills"
)
declare -A PROJECT_DIRS=(
  [claude]=".claude/skills"
  [opencode]=".opencode/skills"
  [all]=".agents/skills"
)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_SKILLS_DIR="$SCRIPT_DIR/skills"

# Parse flags
CLI="all"
PROJECT_DIR=""
UNINSTALL=false

i=1
while [ $i -le $# ]; do
  arg="${!i}"
  case "$arg" in
    --cli)
      i=$((i + 1))
      CLI="${!i}"
      if [[ ! "${GLOBAL_DIRS[$CLI]+set}" ]]; then
        echo "Error: unknown --cli value '$CLI'. Valid values: claude, opencode, all"
        exit 1
      fi
      ;;
    --project)
      i=$((i + 1))
      if [ $i -le $# ] && [[ "${!i}" != --* ]]; then
        PROJECT_DIR="${!i}"
      else
        PROJECT_DIR="$(pwd)"
        i=$((i - 1))
      fi
      ;;
    --uninstall) UNINSTALL=true ;;
  esac
  i=$((i + 1))
done

if [ -n "$PROJECT_DIR" ]; then
  TARGET_DIR="$PROJECT_DIR/${PROJECT_DIRS[$CLI]}"
else
  TARGET_DIR="${GLOBAL_DIRS[$CLI]}"
fi

# Uninstall: remove symlinks (and empty curl-installed dirs)
if $UNINSTALL; then
  echo "Uninstalling skills from: $TARGET_DIR"
  removed=0
  skipped=0
  for skill in "${SKILLS[@]}"; do
    target="$TARGET_DIR/$skill"
    if [ -L "$target" ]; then
      rm "$target"
      echo "  removed: $skill/"
      removed=$((removed + 1))
    elif [ -d "$target" ]; then
      # curl-installed: only remove if directory contains SKILL.md and scripts/ only
      extra=$(ls -A "$target" | grep -v '^SKILL\.md$' | grep -v '^scripts$') || true
      if [ -z "$extra" ]; then
        rm -rf "$target"
        echo "  removed: $skill/"
        removed=$((removed + 1))
      else
        echo "  skipped: $skill/ (contains unexpected files, remove manually)"
        skipped=$((skipped + 1))
      fi
    else
      echo "  skipped: $skill/ (not installed)"
      skipped=$((skipped + 1))
    fi
  done
  echo ""
  echo "Done. $removed skill(s) removed, $skipped skipped."
  echo "Target: $TARGET_DIR"
  exit 0
fi

echo "Installing skills to: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

installed=0
skipped=0

if [ -d "$LOCAL_SKILLS_DIR" ]; then
  # Running from a local clone — symlink skill directories for live updates
  # Structure: <target>/<skill>/ → repo/skills/<skill>/  (contains SKILL.md + scripts/ symlink)
  for skill in "${SKILLS[@]}"; do
    skill_dir="$LOCAL_SKILLS_DIR/$skill"
    target="$TARGET_DIR/$skill"

    [ -d "$skill_dir" ] || { echo "  missing: $skill/ (skipped)"; skipped=$((skipped + 1)); continue; }

    if [ -L "$target" ]; then
      ln -sfn "$skill_dir" "$target"
      echo "  updated: $skill/"
    elif [ -e "$target" ]; then
      echo "  skipped: $skill/ (non-symlink already exists)"
      skipped=$((skipped + 1))
      continue
    else
      ln -s "$skill_dir" "$target"
      echo "  linked:  $skill/"
    fi
    installed=$((installed + 1))
  done
else
  # Running via curl — download SKILL.md and compiled scripts into each skill directory
  if ! command -v curl &>/dev/null; then
    echo "Error: curl is required for remote install"
    exit 1
  fi

  BASE_URL="https://raw.githubusercontent.com/$REPO/$BRANCH"

  for skill in "${SKILLS[@]}"; do
    target_dir="$TARGET_DIR/$skill"
    target_file="$target_dir/SKILL.md"

    if [ -f "$target_file" ] && [ ! -L "$target_file" ]; then
      echo "  skipped: $skill/ (already installed)"
      skipped=$((skipped + 1))
      continue
    fi

    mkdir -p "$target_dir/scripts"

    curl -fsSL "$BASE_URL/skills/$skill/SKILL.md" -o "$target_file"

    for script in "${SCRIPTS[@]}"; do
      curl -fsSL "$BASE_URL/dist/scripts/$script.js" -o "$target_dir/scripts/$script.js"
    done

    echo "  fetched: $skill/ (SKILL.md + scripts/)"
    installed=$((installed + 1))
  done
fi

echo ""
echo "Done. $installed skill(s) installed, $skipped skipped."
echo "Target: $TARGET_DIR"
