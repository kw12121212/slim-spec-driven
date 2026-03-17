# Install Behavior

## Global install (default)

- Skills are installed to `~/.agents/skills/<name>/`
- Each skill directory contains `SKILL.md` and a `scripts/` directory

## Local clone mode

- Detected when `$SCRIPT_DIR/skills/` exists
- Creates directory symlinks: `~/.agents/skills/<name>` → `repo/skills/<name>/`
- The `scripts/` inside each skill symlinks to `repo/dist/scripts/`
- Editing skill files in the repo takes effect immediately without reinstalling

## Curl mode

- Detected when `$SCRIPT_DIR/skills/` does not exist
- Downloads `SKILL.md` and all compiled scripts into `~/.agents/skills/<name>/`
- Updates require re-running the curl command

## CLI targets

- `--cli all` (default): `~/.agents/skills/`
- `--cli claude`: `~/.claude/skills/`
- `--cli opencode`: `~/.config/opencode/skills/`
- `--project [path]`: installs to `.agents/skills/` under the given path (or CWD)

## Uninstall

- Removes symlinks directly
- Removes curl-installed directories only if they contain no unexpected files
