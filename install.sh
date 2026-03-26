#!/usr/bin/env bash
set -euo pipefail

REPO="kw12121212/slim-spec-driven"
BRANCH="main"
SKILLS=(
  spec-driven-brainstorm
  spec-driven-propose
  spec-driven-modify
  spec-driven-spec-content
  spec-driven-apply
  spec-driven-verify
  spec-driven-archive
  spec-driven-init
  spec-driven-cancel
  spec-driven-review
  spec-driven-auto
)

# Central agent skills store (skills live here)
GLOBAL_AGENT_DIR="$HOME/.slim-spec-driven/skills"
PROJECT_AGENT_SUBDIR=".agent/skills"

# CLI-specific symlink directories (point into the agent store)
declare -A GLOBAL_CLI_DIRS=(
  [claude]="$HOME/.claude/skills"
  [opencode]="$HOME/.config/opencode/skills"
  [trae]="$HOME/.trae/skills"
  [codex]="$HOME/.agents/skills"
  [gemini]="$HOME/.agents/skills"
)
declare -A PROJECT_CLI_DIRS=(
  [claude]=".claude/skills"
  [opencode]=".opencode/skills"
  [trae]=".trae/skills"
  [codex]=".codex/skills"
  [gemini]=".gemini/skills"
  [agents]=".agents/skills"
)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_SKILLS_DIR="$SCRIPT_DIR/skills"

# Parse flags
CLI="all"
PROJECT_DIR=""
UNINSTALL=false
MIGRATE_OPENSPEC=false

i=1
while [ $i -le $# ]; do
  arg="${!i}"
  case "$arg" in
    --cli)
      i=$((i + 1))
      CLI="${!i}"
      if [[ "$CLI" != "claude" && "$CLI" != "opencode" && "$CLI" != "trae" && "$CLI" != "codex" && "$CLI" != "gemini" && "$CLI" != "all" ]]; then
        echo "Error: unknown --cli value '$CLI'. Valid values: claude, opencode, trae, codex, gemini, all"
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
    --migrate|--migrate-openspec) MIGRATE_OPENSPEC=true ;;
    --uninstall) UNINSTALL=true ;;
  esac
  i=$((i + 1))
done

# Resolve agent dir, CLI symlink dirs, and SKILL_DIR_REF (used in SKILL.md instead of absolute path)
if [ -n "$PROJECT_DIR" ]; then
  AGENT_DIR="$PROJECT_DIR/$PROJECT_AGENT_SUBDIR"
  SKILL_DIR_REF="$PROJECT_AGENT_SUBDIR"   # relative to project root
  if [ "$CLI" = "all" ]; then
    CLI_LINK_DIRS=("$PROJECT_DIR/${PROJECT_CLI_DIRS[claude]}" "$PROJECT_DIR/${PROJECT_CLI_DIRS[opencode]}" "$PROJECT_DIR/${PROJECT_CLI_DIRS[trae]}" "$PROJECT_DIR/${PROJECT_CLI_DIRS[codex]}" "$PROJECT_DIR/${PROJECT_CLI_DIRS[gemini]}" "$PROJECT_DIR/${PROJECT_CLI_DIRS[agents]}")
  else
    CLI_LINK_DIRS=("$PROJECT_DIR/${PROJECT_CLI_DIRS[$CLI]}")
  fi
else
  AGENT_DIR="$GLOBAL_AGENT_DIR"
  SKILL_DIR_REF="~/.slim-spec-driven/skills"  # tilde expands at runtime, works across users
  if [ "$CLI" = "all" ]; then
    CLI_LINK_DIRS=("${GLOBAL_CLI_DIRS[claude]}" "${GLOBAL_CLI_DIRS[opencode]}" "${GLOBAL_CLI_DIRS[trae]}" "${GLOBAL_CLI_DIRS[codex]}" "${GLOBAL_CLI_DIRS[gemini]}")
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
  sed -i "s|{{SKILL_DIR}}|$SKILL_DIR_REF/$skill|g" "$agent_skill_dir/SKILL.md"
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

# Initialize .spec-driven/ in project directory when using --project
if [ -n "$PROJECT_DIR" ]; then
  spec_dir="$PROJECT_DIR/.spec-driven"

  if $MIGRATE_OPENSPEC; then
    echo ""
    echo "Migrating OpenSpec artifacts in: $PROJECT_DIR"
    if node "$AGENT_DIR/spec-driven-init/scripts/spec-driven.js" migrate "$PROJECT_DIR"; then
      echo "OpenSpec migration complete."
    else
      echo "Error: OpenSpec migration failed."
      exit 1
    fi
  fi

  if [ -d "$spec_dir" ]; then
    echo ""
    echo ".spec-driven/ already exists — skipped init"
  else
    echo ""
    if node "$AGENT_DIR/spec-driven-init/scripts/spec-driven.js" init "$PROJECT_DIR" 2>/dev/null; then
      echo "Initialized .spec-driven/ in: $PROJECT_DIR"
    else
      echo "Warning: failed to initialize .spec-driven/ — run '/spec-driven-init' to initialize manually"
    fi
  fi
elif $MIGRATE_OPENSPEC; then
  migrate_dir="$(pwd)"
  echo ""
  echo "Migrating OpenSpec artifacts in: $migrate_dir"
  if node "$AGENT_DIR/spec-driven-init/scripts/spec-driven.js" migrate "$migrate_dir"; then
    echo "OpenSpec migration complete."
  else
    echo "Error: OpenSpec migration failed."
    exit 1
  fi
fi

echo ""
echo "Done. $installed skill(s) installed, $skipped skipped."
echo "Agent store: $AGENT_DIR"
echo "CLI symlinks:$(printf ' %s' "${CLI_LINK_DIRS[@]}")"
