#!/usr/bin/env bash
set -euo pipefail

REPO="kw12121212/slim-spec-driven"
BRANCH="main"
SKILLS=(
  spec-driven-propose
  spec-driven-modify
  spec-driven-apply
  spec-driven-verify
  spec-driven-archive
  spec-driven-init
  spec-driven-cancel
)

# Central agent skills store (skills live here)
GLOBAL_AGENT_DIR="$HOME/.agent/skills"
PROJECT_AGENT_SUBDIR=".agent/skills"

# CLI-specific symlink directories (point into the agent store)
declare -A GLOBAL_CLI_DIRS=(
  [claude]="$HOME/.claude/skills"
  [opencode]="$HOME/.config/opencode/skills"
)
declare -A PROJECT_CLI_DIRS=(
  [claude]=".claude/skills"
  [opencode]=".opencode/skills"
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
      if [[ "$CLI" != "claude" && "$CLI" != "opencode" && "$CLI" != "all" ]]; then
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

# Resolve agent dir and CLI symlink dirs
if [ -n "$PROJECT_DIR" ]; then
  AGENT_DIR="$PROJECT_DIR/$PROJECT_AGENT_SUBDIR"
  if [ "$CLI" = "all" ]; then
    CLI_LINK_DIRS=("$PROJECT_DIR/${PROJECT_CLI_DIRS[claude]}" "$PROJECT_DIR/${PROJECT_CLI_DIRS[opencode]}")
  else
    CLI_LINK_DIRS=("$PROJECT_DIR/${PROJECT_CLI_DIRS[$CLI]}")
  fi
else
  AGENT_DIR="$GLOBAL_AGENT_DIR"
  if [ "$CLI" = "all" ]; then
    CLI_LINK_DIRS=("${GLOBAL_CLI_DIRS[claude]}" "${GLOBAL_CLI_DIRS[opencode]}")
  else
    CLI_LINK_DIRS=("${GLOBAL_CLI_DIRS[$CLI]}")
  fi
fi

# Uninstall: remove CLI symlinks, then remove from agent store if it was curl-installed
if $UNINSTALL; then
  echo "Uninstalling skills..."
  removed=0
  skipped=0

  # Remove CLI symlinks first
  for link_dir in "${CLI_LINK_DIRS[@]}"; do
    for skill in "${SKILLS[@]}"; do
      link="$link_dir/$skill"
      if [ -L "$link" ]; then
        rm "$link"
        echo "  removed symlink: $link_dir/$skill"
        removed=$((removed + 1))
      fi
    done
  done

  # Remove from agent store (always a plain directory — never a symlink)
  for skill in "${SKILLS[@]}"; do
    target="$AGENT_DIR/$skill"
    if [ -d "$target" ]; then
      extra=$(ls -A "$target" | grep -v '^SKILL\.md$' | grep -v '^scripts$') || true
      if [ -z "$extra" ]; then
        rm -rf "$target"
        echo "  removed: $AGENT_DIR/$skill"
        removed=$((removed + 1))
      else
        echo "  skipped: $AGENT_DIR/$skill (contains unexpected files, remove manually)"
        skipped=$((skipped + 1))
      fi
    else
      echo "  skipped: $skill (not in agent store)"
      skipped=$((skipped + 1))
    fi
  done

  echo ""
  echo "Done. $removed item(s) removed, $skipped skipped."
  echo "Agent store: $AGENT_DIR"
  exit 0
fi

echo "Installing skills to: $AGENT_DIR"
echo "CLI symlinks:$(printf ' %s' "${CLI_LINK_DIRS[@]}")"
mkdir -p "$AGENT_DIR"
for link_dir in "${CLI_LINK_DIRS[@]}"; do
  mkdir -p "$link_dir"
done

installed=0
skipped=0

# copy_skill_to_agent_store: always copies files (never symlinks) into AGENT_DIR
copy_skill_to_agent_store() {
  local skill="$1"
  local skill_dir="$2"        # source skill directory (SKILL.md lives here)
  local scripts_src="$3"      # source scripts directory

  local agent_skill_dir="$AGENT_DIR/$skill"
  rm -rf "$agent_skill_dir/scripts"
  mkdir -p "$agent_skill_dir/scripts"

  cp "$skill_dir/SKILL.md" "$agent_skill_dir/SKILL.md"
  sed -i "s|{{SKILL_DIR}}|$agent_skill_dir|g" "$agent_skill_dir/SKILL.md"
  cp "$scripts_src/spec-driven.js" "$agent_skill_dir/scripts/spec-driven.js"
}

# link_cli_dirs: create symlinks from each CLI dir into AGENT_DIR
link_cli_dirs() {
  local skill="$1"
  local agent_skill_dir="$AGENT_DIR/$skill"

  for link_dir in "${CLI_LINK_DIRS[@]}"; do
    local cli_link="$link_dir/$skill"
    if [ -L "$cli_link" ]; then
      ln -sfn "$agent_skill_dir" "$cli_link"
    elif [ -e "$cli_link" ]; then
      echo "  skipped CLI link: $cli_link (non-symlink already exists)"
    else
      ln -s "$agent_skill_dir" "$cli_link"
    fi
  done
}

if [ -d "$LOCAL_SKILLS_DIR" ]; then
  # Running from a local clone — ensure dist/ is built
  if [ ! -d "$SCRIPT_DIR/dist/scripts" ]; then
    echo "Building scripts (dist/ not found)..."
    (cd "$SCRIPT_DIR" && npm run build) || {
      echo "Error: build failed. Run 'npm run build' manually."
      exit 1
    }
  fi

  for skill in "${SKILLS[@]}"; do
    skill_dir="$LOCAL_SKILLS_DIR/$skill"
    [ -d "$skill_dir" ] || { echo "  missing: $skill/ (skipped)"; skipped=$((skipped + 1)); continue; }

    copy_skill_to_agent_store "$skill" "$skill_dir" "$SCRIPT_DIR/dist/scripts"
    echo "  copied: $skill/"
    link_cli_dirs "$skill"
    installed=$((installed + 1))
  done
else
  # Running via curl — download files into agent store
  if ! command -v curl &>/dev/null; then
    echo "Error: curl is required for remote install"
    exit 1
  fi

  BASE_URL="https://raw.githubusercontent.com/$REPO/$BRANCH"

  # Download into a temp dir then copy into agent store
  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  # Download the single shared script
  tmp_scripts_dir="$tmp_dir/scripts"
  mkdir -p "$tmp_scripts_dir"
  curl -fsSL "$BASE_URL/dist/scripts/spec-driven.js" -o "$tmp_scripts_dir/spec-driven.js"

  for skill in "${SKILLS[@]}"; do
    tmp_skill_dir="$tmp_dir/$skill"
    mkdir -p "$tmp_skill_dir"

    curl -fsSL "$BASE_URL/skills/$skill/SKILL.md" -o "$tmp_skill_dir/SKILL.md"
    copy_skill_to_agent_store "$skill" "$tmp_skill_dir" "$tmp_scripts_dir"
    echo "  fetched: $skill/"
    link_cli_dirs "$skill"
    installed=$((installed + 1))
  done
fi

echo ""
echo "Done. $installed skill(s) installed, $skipped skipped."
echo "Agent store: $AGENT_DIR"
echo "CLI symlinks:$(printf ' %s' "${CLI_LINK_DIRS[@]}")"
