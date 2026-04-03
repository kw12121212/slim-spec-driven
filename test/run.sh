#!/usr/bin/env bash
# Test runner for spec-driven scripts.
# Runs all 5 scripts against test/todo-app, verifies output, then resets state.
# Safe to run repeatedly.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$ROOT/test/todo-app"
CLI="node $ROOT/dist/scripts/spec-driven.js"
SKILL_VALIDATOR="node $ROOT/dist/test/validate-skills.js"
CHANGE="add-delete-command"

# Colors
GREEN="\033[0;32m"; RED="\033[0;31m"; RESET="\033[0m"; BOLD="\033[1m"

passed=0; failed=0

pass() { echo -e "  ${GREEN}✓${RESET} $1"; passed=$((passed + 1)); }
fail() { echo -e "  ${RED}✗${RESET} $1"; failed=$((failed + 1)); }

assert_exit() {
  local label="$1" expected="$2"
  shift 2
  local actual
  actual=$("$@" 2>&1; echo "EXIT:$?") || true
  local code="${actual##*EXIT:}"
  if [ "$code" = "$expected" ]; then pass "$label (exit $code)";
  else fail "$label (expected exit $expected, got $code)"; fi
}

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -qF -- "$needle"; then pass "$label";
  else fail "$label (expected to find: $needle)"; fi
}

assert_json_field() {
  local label="$1" field="$2" expected="$3" json="$4"
  local actual
  actual=$(echo "$json" | grep -m 1 -oP "\"$field\":\s*\K[^\s,}]+") || actual=""
  if [ "$actual" = "$expected" ]; then pass "$label";
  else fail "$label (expected $field=$expected, got $field=$actual)"; fi
}

# ── Reset ──────────────────────────────────────────────────────────────────────
reset_state() {
  rm -rf "$PROJECT/.spec-driven/changes/$CHANGE"
  rm -rf "$PROJECT/.spec-driven/changes/archive"
}

create_skill() {
  local dir="$1" name="$2"
  mkdir -p "$dir/$name"
  printf -- '---\nname: %s\ndescription: migrated\n---\n' "$name" > "$dir/$name/SKILL.md"
}

echo -e "\n${BOLD}spec-driven test suite${RESET} — project: test/todo-app\n"
reset_state

# ── 0. validate-skills ────────────────────────────────────────────────────────
echo -e "${BOLD}[0] validate-skills${RESET}"

for skill in "$ROOT"/skills/*/SKILL.md; do
  out=$($SKILL_VALIDATOR "$skill" 2>&1) && code=0 || code=$?
  if [ "$code" = "0" ]; then
    pass "skill schema valid: $(basename "$(dirname "$skill")")"
  else
    fail "skill schema invalid: $(basename "$(dirname "$skill")")"
    echo "$out"
  fi
done

# ── 1. init ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}[1] init${RESET}"

INIT_DIR="$(mktemp -d)"
out=$($CLI init "$INIT_DIR" 2>&1)
assert_contains "creates .spec-driven/"  "Initialized:"  "$out"
[ -f "$INIT_DIR/.spec-driven/config.yaml"          ] && pass "config.yaml exists"  || fail "config.yaml missing"
[ -f "$INIT_DIR/.spec-driven/roadmap/INDEX.md"     ] && pass "roadmap INDEX.md exists" || fail "roadmap INDEX.md missing"
[ -d "$INIT_DIR/.spec-driven/roadmap/milestones"   ] && pass "roadmap milestones/ dir exists" || fail "roadmap milestones/ dir missing"
[ -f "$INIT_DIR/.spec-driven/specs/INDEX.md"       ] && pass "INDEX.md exists"    || fail "INDEX.md missing"
[ -d "$INIT_DIR/.spec-driven/specs"                ] && pass "specs/ dir exists"   || fail "specs/ dir missing"
[ -d "$INIT_DIR/.spec-driven/changes"              ] && pass "changes/ dir exists" || fail "changes/ dir missing"

printf '# custom roadmap\n' > "$INIT_DIR/.spec-driven/roadmap/INDEX.md"

out2=$($CLI init "$INIT_DIR" 2>&1)
assert_contains "duplicate init exits 0 (idempotent)" "Initialized:" "$out2"
assert_contains "duplicate init reports index regeneration" "INDEX.md" "$out2"
[ -f "$INIT_DIR/.spec-driven/config.yaml" ] && pass "duplicate init preserves config.yaml" || fail "duplicate init removed config.yaml"
assert_contains "duplicate init repairs roadmap index heading" "# Roadmap Index" "$(cat "$INIT_DIR/.spec-driven/roadmap/INDEX.md")"
assert_contains "duplicate init repairs roadmap milestones section" "## Milestones" "$(cat "$INIT_DIR/.spec-driven/roadmap/INDEX.md")"
rm -rf "$INIT_DIR"

# ── 1a. verify-roadmap ────────────────────────────────────────────────────────
echo -e "\n${BOLD}[1a] verify-roadmap${RESET}"

ROADMAP_DIR="$(mktemp -d)"
$CLI init "$ROADMAP_DIR" >/dev/null
cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/INDEX.md"
# Roadmap Index

## Milestones
- [m1-foundation.md](milestones/m1-foundation.md) - m1-foundation - active
EOF
cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/milestones/m1-foundation.md"
# m1-foundation

## Goal
Ship the first roadmap milestone

## In Scope
- establish the first roadmap milestone structure
- add validation and status reporting for roadmap milestones

## Out of Scope
- broader roadmap automation beyond validation and status reporting

## Done Criteria
- Roadmap scaffold exists
- Validation exists

## Planned Changes
- `add-roadmap-milestones` - create the milestone-based roadmap scaffold that establishes milestone files.
- `add-roadmap-size-validation` - validate milestone structure and bounded size so oversized milestones are rejected before roadmap work drifts.

## Dependencies
- roadmap must stay separate from changes

## Risks
- roadmap validation should stay easy to interpret for maintainers

## Status
- Declared: active

## Notes
- This milestone should stay small enough to validate the roadmap workflow itself.
EOF

out=$($CLI verify-roadmap "$ROADMAP_DIR" 2>&1)
assert_json_field "verify-roadmap valid=true for bounded milestone" "valid" "true" "$out"
assert_contains "verify-roadmap reports milestone summary" "\"plannedChanges\": 2" "$out"

mkdir -p "$ROADMAP_DIR/.spec-driven/changes/add-roadmap-size-validation"
mkdir -p "$ROADMAP_DIR/.spec-driven/changes/archive/$(date +%Y-%m-%d)-add-roadmap-milestones"
out=$($CLI roadmap-status "$ROADMAP_DIR" 2>&1)
assert_json_field "roadmap-status valid=true for bounded milestone" "valid" "true" "$out"
assert_contains "roadmap-status reports archived planned change" '"name": "add-roadmap-milestones"' "$out"
assert_contains "roadmap-status reports archived state" '"state": "archived"' "$out"
assert_contains "roadmap-status reports active state" '"state": "active"' "$out"
assert_contains "roadmap-status derives active milestone state" '"derivedStatus": "active"' "$out"

cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/INDEX.md"
# Roadmap Index

## Milestones
- [m1-foundation.md](milestones/m1-foundation.md) - m1-foundation - active
- [m3-missing.md](milestones/m3-missing.md) - m3-missing - complete
EOF
cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/milestones/m3-missing.md"
# m3-missing

## Goal
Detect missing change references

## In Scope
- detect planned changes that do not exist in active or archived change state

## Out of Scope
- automatically creating missing changes

## Done Criteria
- status command exists

## Planned Changes
- `nonexistent-change` - exercise mismatch reporting when the change is missing from both active and archived change state.

## Dependencies
- planned change names must stay aligned with real change directories

## Risks
- names can drift

## Status
- Declared: complete

## Notes
- The declared status is intentionally stale for mismatch coverage.
EOF

out=$($CLI roadmap-status "$ROADMAP_DIR" 2>&1)
assert_contains "roadmap-status reports missing planned change" '"state": "missing"' "$out"
assert_contains "roadmap-status reports status mismatch" "does not match derived status" "$out"

cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/milestones/m6-multiline.md"
# m6-multiline

## Goal
Reject multiline planned change details

## In Scope
- verify that indented detail lines under a valid planned change entry are rejected

## Out of Scope
- accepting multiline planned change prose after a canonical first line

## Done Criteria
- roadmap validation rejects multiline planned change entries

## Planned Changes
- `multiline-change` - keep a parseable first line while allowing extra context
  Scope: cover why this planned change exists and what the next step should focus on.
  Notes: the CLI should still resolve the change by `multiline-change` only.

## Dependencies
- top-level planned change parsing must stay deterministic

## Risks
- multiline details could be mistaken for separate planned changes if indentation is ignored

## Status
- Declared: proposed

## Notes
- This fixture verifies multiline planned change detail rejection.
EOF

cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/INDEX.md"
# Roadmap Index

## Milestones
- [m6-multiline.md](milestones/m6-multiline.md) - m6-multiline - proposed
EOF

out=$($CLI verify-roadmap "$ROADMAP_DIR" 2>&1)
assert_json_field "verify-roadmap rejects multiline planned change details" "valid" "false" "$out"
assert_contains "verify-roadmap reports multiline single-line guidance" "single line" "$out"

out=$($CLI roadmap-status "$ROADMAP_DIR" 2>&1)
assert_json_field "roadmap-status rejects multiline planned change details" "valid" "false" "$out"
assert_contains "roadmap-status reports multiline planned change format guidance" "single line" "$out"

rm "$ROADMAP_DIR/.spec-driven/roadmap/milestones/m6-multiline.md"

cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/milestones/m2-too-large.md"
# m2-too-large

## Goal
Too much work in one stage

## In Scope
- show what happens when one milestone grows too large

## Out of Scope
- automatically splitting the milestone

## Done Criteria
- Everything ships

## Planned Changes
- `change-1` - first oversized planned change
- `change-2` - second oversized planned change
- `change-3` - third oversized planned change
- `change-4` - fourth oversized planned change
- `change-5` - fifth oversized planned change
- `change-6` - sixth oversized planned change

## Dependencies
- the oversized milestone still follows the required heading structure

## Risks
- too much scope

## Status
- Declared: proposed

## Notes
- This milestone is intentionally invalid because it exceeds the size limit.
EOF

out=$($CLI verify-roadmap "$ROADMAP_DIR" 2>&1)
assert_json_field "verify-roadmap valid=false for oversized milestone" "valid" "false" "$out"
assert_contains "verify-roadmap reports split guidance" "split it into smaller milestones" "$out"

cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/INDEX.md"
# Roadmap Index

## Milestones
- [m1-foundation.md](milestones/m1-foundation.md) - m1-foundation - active
- [m2-too-large.md](milestones/m2-too-large.md) - m2-too-large - proposed
- [m3-missing.md](milestones/m3-missing.md) - m3-missing - complete
EOF

cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/milestones/m4-bad-status.md"
# m4-bad-status

## Goal
Use invalid status shape

## In Scope
- verify that invalid declared statuses are rejected

## Out of Scope
- testing mismatch behavior for otherwise valid statuses

## Done Criteria
- Validation rejects it

## Planned Changes
- `change-1` - provide one valid planned change entry while status stays invalid

## Dependencies
- the milestone should stay structurally valid aside from status

## Risks
- malformed markdown can hide the real validation error

## Status
- Declared: someday

## Notes
- This fixture isolates the invalid status case.
EOF

cat <<'EOF' > "$ROADMAP_DIR/.spec-driven/roadmap/milestones/m5-bad-planned-change.md"
# m5-bad-planned-change

## Goal
Reject malformed planned change entries

## In Scope
- verify planned change entry format validation

## Out of Scope
- status mismatch reporting

## Done Criteria
- malformed planned change entries fail validation

## Planned Changes
- malformed-change-entry

## Dependencies
- the rest of the milestone shape stays valid

## Risks
- malformed change entries could break roadmap status parsing

## Status
- Declared: proposed

## Notes
- This fixture intentionally omits the required summary format.
EOF

out=$($CLI verify-roadmap "$ROADMAP_DIR" 2>&1)
assert_json_field "verify-roadmap rejects malformed planned change entry" "valid" "false" "$out"
assert_contains "verify-roadmap reports planned change format guidance" "invalid planned change entries" "$out"

rm "$ROADMAP_DIR/.spec-driven/roadmap/milestones/m5-bad-planned-change.md"

out=$($CLI verify-roadmap "$ROADMAP_DIR" 2>&1)
assert_json_field "verify-roadmap rejects invalid declared status" "valid" "false" "$out"
assert_contains "verify-roadmap reports invalid milestone status" "invalid status" "$out"

ARCHIVE_ROADMAP_DIR="$(mktemp -d)"
$CLI init "$ARCHIVE_ROADMAP_DIR" >/dev/null
mkdir -p "$ARCHIVE_ROADMAP_DIR/.spec-driven/changes/archive"
cat <<'EOF' > "$ARCHIVE_ROADMAP_DIR/.spec-driven/roadmap/milestones/m1-archive-sync.md"
# m1-archive-sync

## Goal
Complete a roadmap milestone via archive

## In Scope
- verify archive-driven roadmap reconciliation

## Out of Scope
- broader roadmap sync flows beyond archive closeout

## Done Criteria
- All planned changes are archived

## Planned Changes
- `archive-sync-change` - archive the last remaining planned change in this milestone

## Dependencies
- archive must update roadmap

## Risks
- archive reconciliation could leave roadmap status stale

## Status
- Declared: active

## Notes
- Archiving the only listed change should complete the milestone.
EOF
cat <<'EOF' > "$ARCHIVE_ROADMAP_DIR/.spec-driven/roadmap/INDEX.md"
# Roadmap Index

## Milestones
- [m1-archive-sync.md](milestones/m1-archive-sync.md) - m1-archive-sync - active
EOF

(
  cd "$ARCHIVE_ROADMAP_DIR"
  $CLI propose archive-sync-change >/dev/null
  $CLI archive archive-sync-change >/dev/null
)

assert_contains "archive reconciles milestone declared status" "- Declared: complete" "$(cat "$ARCHIVE_ROADMAP_DIR/.spec-driven/roadmap/milestones/m1-archive-sync.md")"
assert_contains "archive reconciles roadmap index status" "m1-archive-sync - complete" "$(cat "$ARCHIVE_ROADMAP_DIR/.spec-driven/roadmap/INDEX.md")"
rm -rf "$ARCHIVE_ROADMAP_DIR"
rm -rf "$ROADMAP_DIR"

# ── 1b. install ───────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[1b] install${RESET}"

INSTALL_HOME="$(mktemp -d)"
out=$(HOME="$INSTALL_HOME" bash "$ROOT/install.sh" --cli codex 2>&1)
assert_contains "install reports brainstorm skill copy" "copied: spec-driven-brainstorm/" "$out"
[ -f "$INSTALL_HOME/.auto-spec-driven/skills/spec-driven-brainstorm/SKILL.md" ] && pass "install copies brainstorm skill into agent store" || fail "install missing brainstorm skill in agent store"
[ -L "$INSTALL_HOME/.agents/skills/spec-driven-brainstorm" ] && pass "install links brainstorm skill for codex" || fail "install missing brainstorm symlink for codex"
assert_contains "install reports maintenance skill copy" "copied: spec-driven-maintenance/" "$out"
[ -f "$INSTALL_HOME/.auto-spec-driven/skills/spec-driven-maintenance/SKILL.md" ] && pass "install copies maintenance skill into agent store" || fail "install missing maintenance skill in agent store"
[ -L "$INSTALL_HOME/.agents/skills/spec-driven-maintenance" ] && pass "install links maintenance skill for codex" || fail "install missing maintenance symlink for codex"
assert_contains "install reports spec-edit skill copy" "copied: spec-driven-spec-edit/" "$out"
[ -f "$INSTALL_HOME/.auto-spec-driven/skills/spec-driven-spec-edit/SKILL.md" ] && pass "install copies spec-edit skill into agent store" || fail "install missing spec-edit skill in agent store"
[ -L "$INSTALL_HOME/.agents/skills/spec-driven-spec-edit" ] && pass "install links spec-edit skill for codex" || fail "install missing spec-edit symlink for codex"
assert_contains "install reports sync-specs skill copy" "copied: spec-driven-sync-specs/" "$out"
[ -f "$INSTALL_HOME/.auto-spec-driven/skills/spec-driven-sync-specs/SKILL.md" ] && pass "install copies sync-specs skill into agent store" || fail "install missing sync-specs skill in agent store"
[ -L "$INSTALL_HOME/.agents/skills/spec-driven-sync-specs" ] && pass "install links sync-specs skill for codex" || fail "install missing sync-specs symlink for codex"
assert_contains "install reports roadmap-plan skill copy" "copied: roadmap-plan/" "$out"
[ -f "$INSTALL_HOME/.auto-spec-driven/skills/roadmap-plan/SKILL.md" ] && pass "install copies roadmap-plan skill into agent store" || fail "install missing roadmap-plan skill in agent store"
[ -L "$INSTALL_HOME/.agents/skills/roadmap-plan" ] && pass "install links roadmap-plan skill for codex" || fail "install missing roadmap-plan symlink for codex"
assert_contains "install reports roadmap-milestone skill copy" "copied: roadmap-milestone/" "$out"
[ -f "$INSTALL_HOME/.auto-spec-driven/skills/roadmap-milestone/SKILL.md" ] && pass "install copies roadmap-milestone skill into agent store" || fail "install missing roadmap-milestone skill in agent store"
[ -L "$INSTALL_HOME/.agents/skills/roadmap-milestone" ] && pass "install links roadmap-milestone skill for codex" || fail "install missing roadmap-milestone symlink for codex"
assert_contains "install reports roadmap-recommend skill copy" "copied: roadmap-recommend/" "$out"
[ -f "$INSTALL_HOME/.auto-spec-driven/skills/roadmap-recommend/SKILL.md" ] && pass "install copies roadmap-recommend skill into agent store" || fail "install missing roadmap-recommend skill in agent store"
[ -L "$INSTALL_HOME/.agents/skills/roadmap-recommend" ] && pass "install links roadmap-recommend skill for codex" || fail "install missing roadmap-recommend symlink for codex"
assert_contains "install reports roadmap-propose skill copy" "copied: roadmap-propose/" "$out"
[ -f "$INSTALL_HOME/.auto-spec-driven/skills/roadmap-propose/SKILL.md" ] && pass "install copies roadmap-propose skill into agent store" || fail "install missing roadmap-propose skill in agent store"
[ -L "$INSTALL_HOME/.agents/skills/roadmap-propose" ] && pass "install links roadmap-propose skill for codex" || fail "install missing roadmap-propose symlink for codex"
assert_contains "install reports roadmap-sync skill copy" "copied: roadmap-sync/" "$out"
[ -f "$INSTALL_HOME/.auto-spec-driven/skills/roadmap-sync/SKILL.md" ] && pass "install copies roadmap-sync skill into agent store" || fail "install missing roadmap-sync skill in agent store"
[ -L "$INSTALL_HOME/.agents/skills/roadmap-sync" ] && pass "install links roadmap-sync skill for codex" || fail "install missing roadmap-sync symlink for codex"
rm -rf "$INSTALL_HOME"

# ── 1c. migrate ───────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[1c] migrate${RESET}"

MIGRATE_DIR="$(mktemp -d)"
mkdir -p "$MIGRATE_DIR/openspec/specs"
mkdir -p "$MIGRATE_DIR/.claude/skills" "$MIGRATE_DIR/.claude/commands/opsx"
mkdir -p "$MIGRATE_DIR/.opencode/skills" "$MIGRATE_DIR/.opencode/commands"
mkdir -p "$MIGRATE_DIR/.cursor/skills" "$MIGRATE_DIR/.cursor/commands"
printf '# legacy spec\n' > "$MIGRATE_DIR/openspec/specs/legacy.md"
create_skill "$MIGRATE_DIR/.claude/skills" "openspec-propose"
create_skill "$MIGRATE_DIR/.opencode/skills" "openspec-apply-change"
create_skill "$MIGRATE_DIR/.cursor/skills" "openspec-propose"
printf 'legacy command\n' > "$MIGRATE_DIR/.claude/commands/opsx/propose.md"
printf 'legacy command\n' > "$MIGRATE_DIR/.opencode/commands/opsx-apply.md"
printf 'legacy command\n' > "$MIGRATE_DIR/.cursor/commands/opsx-propose.md"

out=$($CLI migrate "$MIGRATE_DIR" 2>&1)
assert_contains "migrate renames openspec dir" "Moved openspec/ -> .spec-driven/" "$out"
assert_contains "migrate installs claude skills" "Migrated claude tool config:" "$out"
assert_contains "migrate installs opencode skills" "Migrated opencode tool config:" "$out"
assert_contains "migrate skips unsupported tools" "Skipped unsupported AI tool: .cursor" "$out"
[ -d "$MIGRATE_DIR/.spec-driven" ] && pass "migrate creates .spec-driven dir" || fail "migrate missing .spec-driven dir"
[ ! -d "$MIGRATE_DIR/openspec" ] && pass "migrate removes openspec dir" || fail "migrate left openspec dir"
[ -f "$MIGRATE_DIR/.spec-driven/config.yaml" ] && pass "migrate adds config.yaml" || fail "migrate missing config.yaml"
[ -d "$MIGRATE_DIR/.claude/skills/spec-driven-brainstorm" ] && pass "migrate adds claude brainstorm skill" || fail "migrate missing claude brainstorm skill"
[ -d "$MIGRATE_DIR/.claude/skills/spec-driven-propose" ] && pass "migrate adds claude spec-driven skill" || fail "migrate missing claude spec-driven skill"
[ ! -d "$MIGRATE_DIR/.claude/skills/openspec-propose" ] && pass "migrate removes claude openspec skill" || fail "migrate left claude openspec skill"
[ ! -e "$MIGRATE_DIR/.claude/commands/opsx" ] && pass "migrate removes claude commands" || fail "migrate left claude commands"
[ -d "$MIGRATE_DIR/.opencode/skills/spec-driven-brainstorm" ] && pass "migrate adds opencode brainstorm skill" || fail "migrate missing opencode brainstorm skill"
[ -d "$MIGRATE_DIR/.opencode/skills/spec-driven-apply" ] && pass "migrate adds opencode spec-driven skill" || fail "migrate missing opencode spec-driven skill"
[ ! -d "$MIGRATE_DIR/.opencode/skills/openspec-apply-change" ] && pass "migrate removes opencode openspec skill" || fail "migrate left opencode openspec skill"
[ -d "$MIGRATE_DIR/.cursor/skills/openspec-propose" ] && pass "migrate preserves unsupported tool skill" || fail "migrate changed unsupported tool skill"

mkdir -p "$MIGRATE_DIR/openspec"
out=$($CLI migrate "$MIGRATE_DIR" 2>&1)
assert_contains "migrate skips rename when spec-driven exists" "Skipped openspec/ rename" "$out"
rm -rf "$MIGRATE_DIR"

# ── 1d. maintenance ───────────────────────────────────────────────────────────
echo -e "\n${BOLD}[1d] maintenance${RESET}"

MAINT_DIR="$(mktemp -d)"
$CLI init "$MAINT_DIR" >/dev/null
mkdir -p "$MAINT_DIR/scripts"
printf '{\n  "name": "maintenance-fixture",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n' > "$MAINT_DIR/package.json"
mkdir -p "$MAINT_DIR/.spec-driven/maintenance"
printf '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n' > "$MAINT_DIR/.spec-driven/maintenance/config.json"
printf 'import fs from "fs";\nconst status = fs.readFileSync("status.txt", "utf-8").trim();\nif (status !== "fixed") {\n  console.error("status is not fixed");\n  process.exit(1);\n}\nconsole.log("status ok");\n' > "$MAINT_DIR/scripts/check-status.js"
printf 'import fs from "fs";\nfs.writeFileSync("status.txt", "fixed\\n");\nconsole.log("fixed");\n' > "$MAINT_DIR/scripts/fix-status.js"
printf 'broken\n' > "$MAINT_DIR/status.txt"
git -C "$MAINT_DIR" init >/dev/null
git -C "$MAINT_DIR" config user.email "spec-driven@example.com"
git -C "$MAINT_DIR" config user.name "spec-driven"
git -C "$MAINT_DIR" add .
git -C "$MAINT_DIR" commit -m "initial maintenance fixture" >/dev/null
BASE_BRANCH="$(git -C "$MAINT_DIR" branch --show-current)"

out=$($CLI run-maintenance "$MAINT_DIR" 2>&1)
assert_contains "run-maintenance reports repaired status" "\"status\": \"repaired\"" "$out"
assert_contains "run-maintenance reports fixed lint check" "\"fixedChecks\": [" "$out"
maintenance_branch="$(echo "$out" | grep -m 1 -oP '"branch":\s*"\K[^"]+')"
maintenance_change="$(echo "$out" | grep -m 1 -oP '"change":\s*"\K[^"]+')"
status_content="$(git -C "$MAINT_DIR" show "$maintenance_branch:status.txt")"
assert_contains "run-maintenance applies fix command on maintenance branch" "fixed" "$status_content"
archive_tasks="$(git -C "$MAINT_DIR" show "$maintenance_branch:.spec-driven/changes/archive/$(date +%Y-%m-%d)-$maintenance_change/tasks.md")"
assert_contains "run-maintenance archives successful change on maintenance branch" "- [x] Verify the maintenance change is valid and archive it" "$archive_tasks"
current_branch="$(git -C "$MAINT_DIR" branch --show-current)"
if [ "$current_branch" = "$BASE_BRANCH" ]; then pass "run-maintenance restores original branch"; else fail "run-maintenance did not restore original branch"; fi
last_commit="$(git -C "$MAINT_DIR" log --oneline -1 "$maintenance_branch")"
assert_contains "run-maintenance creates maintenance commit" "chore: maintenance" "$last_commit"

out=$(cd "$MAINT_DIR" && $CLI propose "maintenance-pending" 2>&1)
assert_contains "creates active maintenance change for duplicate test" "Created change:" "$out"
out=$($CLI run-maintenance "$MAINT_DIR" 2>&1)
assert_contains "run-maintenance skips when active maintenance change exists" "\"reason\": \"active-maintenance-change\"" "$out"
rm -rf "$MAINT_DIR"

MISSING_CONFIG_DIR="$(mktemp -d)"
$CLI init "$MISSING_CONFIG_DIR" >/dev/null
git -C "$MISSING_CONFIG_DIR" init >/dev/null
git -C "$MISSING_CONFIG_DIR" config user.email "spec-driven@example.com"
git -C "$MISSING_CONFIG_DIR" config user.name "spec-driven"
out=$($CLI run-maintenance "$MISSING_CONFIG_DIR" 2>&1; true)
assert_contains "run-maintenance errors when config missing" '"status": "error"' "$out"
assert_contains "run-maintenance reports config hint" 'Create .spec-driven/maintenance/config.json' "$out"
rm -rf "$MISSING_CONFIG_DIR"

NO_CHECKS_DIR="$(mktemp -d)"
$CLI init "$NO_CHECKS_DIR" >/dev/null
mkdir -p "$NO_CHECKS_DIR/.spec-driven/maintenance"
printf '{\n  "checks": []\n}\n' > "$NO_CHECKS_DIR/.spec-driven/maintenance/config.json"
git -C "$NO_CHECKS_DIR" init >/dev/null
git -C "$NO_CHECKS_DIR" config user.email "spec-driven@example.com"
git -C "$NO_CHECKS_DIR" config user.name "spec-driven"
out=$($CLI run-maintenance "$NO_CHECKS_DIR" 2>&1)
assert_contains "run-maintenance skips with no configured checks" '"reason": "no-configured-checks"' "$out"
rm -rf "$NO_CHECKS_DIR"

CLEAN_DIR="$(mktemp -d)"
$CLI init "$CLEAN_DIR" >/dev/null
mkdir -p "$CLEAN_DIR/scripts" "$CLEAN_DIR/.spec-driven/maintenance"
printf '{\n  "name": "maintenance-clean",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js"\n  }\n}\n' > "$CLEAN_DIR/package.json"
printf 'console.log("status ok");\n' > "$CLEAN_DIR/scripts/check-status.js"
printf '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint"\n    }\n  ]\n}\n' > "$CLEAN_DIR/.spec-driven/maintenance/config.json"
git -C "$CLEAN_DIR" init >/dev/null
git -C "$CLEAN_DIR" config user.email "spec-driven@example.com"
git -C "$CLEAN_DIR" config user.name "spec-driven"
git -C "$CLEAN_DIR" add .
git -C "$CLEAN_DIR" commit -m "initial clean fixture" >/dev/null
out=$($CLI run-maintenance "$CLEAN_DIR" 2>&1)
assert_contains "run-maintenance reports clean status" '"status": "clean"' "$out"
rm -rf "$CLEAN_DIR"

DIRTY_DIR="$(mktemp -d)"
$CLI init "$DIRTY_DIR" >/dev/null
mkdir -p "$DIRTY_DIR/scripts" "$DIRTY_DIR/.spec-driven/maintenance"
printf '{\n  "name": "maintenance-dirty",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n' > "$DIRTY_DIR/package.json"
printf 'process.exit(1);\n' > "$DIRTY_DIR/scripts/check-status.js"
printf 'process.exit(0);\n' > "$DIRTY_DIR/scripts/fix-status.js"
printf '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n' > "$DIRTY_DIR/.spec-driven/maintenance/config.json"
git -C "$DIRTY_DIR" init >/dev/null
git -C "$DIRTY_DIR" config user.email "spec-driven@example.com"
git -C "$DIRTY_DIR" config user.name "spec-driven"
git -C "$DIRTY_DIR" add .
git -C "$DIRTY_DIR" commit -m "initial dirty fixture" >/dev/null
printf 'uncommitted\n' >> "$DIRTY_DIR/package.json"
out=$($CLI run-maintenance "$DIRTY_DIR" 2>&1)
assert_contains "run-maintenance skips dirty working tree" '"reason": "dirty-working-tree"' "$out"
rm -rf "$DIRTY_DIR"

UNFIXABLE_DIR="$(mktemp -d)"
$CLI init "$UNFIXABLE_DIR" >/dev/null
mkdir -p "$UNFIXABLE_DIR/scripts"
mkdir -p "$UNFIXABLE_DIR/.spec-driven/maintenance"
printf '{\n  "name": "maintenance-unfixable",\n  "type": "module",\n  "scripts": {\n    "test": "node scripts/fail.js"\n  }\n}\n' > "$UNFIXABLE_DIR/package.json"
printf '{\n  "checks": [\n    {\n      "name": "test",\n      "command": "npm test"\n    }\n  ]\n}\n' > "$UNFIXABLE_DIR/.spec-driven/maintenance/config.json"
printf 'console.error("still failing");\nprocess.exit(1);\n' > "$UNFIXABLE_DIR/scripts/fail.js"
git -C "$UNFIXABLE_DIR" init >/dev/null
git -C "$UNFIXABLE_DIR" config user.email "spec-driven@example.com"
git -C "$UNFIXABLE_DIR" config user.name "spec-driven"
git -C "$UNFIXABLE_DIR" add .
git -C "$UNFIXABLE_DIR" commit -m "initial unfixable fixture" >/dev/null
out=$($CLI run-maintenance "$UNFIXABLE_DIR" 2>&1)
assert_contains "run-maintenance reports unfixable status" "\"status\": \"unfixable\"" "$out"
assert_contains "run-maintenance identifies unfixable check" "\"unfixableChecks\": [" "$out"
[ -z "$(find "$UNFIXABLE_DIR/.spec-driven/changes" -maxdepth 1 -mindepth 1 -type d -name 'maintenance-*' | head -n 1)" ] && pass "run-maintenance does not create unfixable change directory" || fail "run-maintenance created unexpected unfixable change directory"
rm -rf "$UNFIXABLE_DIR"

COMMIT_FAIL_DIR="$(mktemp -d)"
$CLI init "$COMMIT_FAIL_DIR" >/dev/null
mkdir -p "$COMMIT_FAIL_DIR/scripts" "$COMMIT_FAIL_DIR/.git/hooks"
mkdir -p "$COMMIT_FAIL_DIR/.spec-driven/maintenance"
printf '{\n  "name": "maintenance-commit-fail",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n' > "$COMMIT_FAIL_DIR/package.json"
printf '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n' > "$COMMIT_FAIL_DIR/.spec-driven/maintenance/config.json"
printf 'import fs from "fs";\nconst status = fs.readFileSync("status.txt", "utf-8").trim();\nif (status !== "fixed") {\n  console.error("status is not fixed");\n  process.exit(1);\n}\n' > "$COMMIT_FAIL_DIR/scripts/check-status.js"
printf 'import fs from "fs";\nfs.writeFileSync("status.txt", "fixed\\n");\n' > "$COMMIT_FAIL_DIR/scripts/fix-status.js"
printf 'broken\n' > "$COMMIT_FAIL_DIR/status.txt"
git -C "$COMMIT_FAIL_DIR" init >/dev/null
git -C "$COMMIT_FAIL_DIR" config user.email "spec-driven@example.com"
git -C "$COMMIT_FAIL_DIR" config user.name "spec-driven"
git -C "$COMMIT_FAIL_DIR" add .
git -C "$COMMIT_FAIL_DIR" commit -m "initial commit failure fixture" >/dev/null
printf '#!/usr/bin/env bash\necho "blocked by pre-commit" >&2\nexit 1\n' > "$COMMIT_FAIL_DIR/.git/hooks/pre-commit"
chmod +x "$COMMIT_FAIL_DIR/.git/hooks/pre-commit"
out=$($CLI run-maintenance "$COMMIT_FAIL_DIR" 2>&1)
assert_contains "run-maintenance reports blocked commit failure" '"reason": "git-commit-failed"' "$out"
assert_contains "run-maintenance reports pre-commit stderr" 'blocked by pre-commit' "$out"
rm -rf "$COMMIT_FAIL_DIR"

RESTORE_FAIL_DIR="$(mktemp -d)"
$CLI init "$RESTORE_FAIL_DIR" >/dev/null
mkdir -p "$RESTORE_FAIL_DIR/scripts"
mkdir -p "$RESTORE_FAIL_DIR/.spec-driven/maintenance"
printf '{\n  "name": "maintenance-restore-fail",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n' > "$RESTORE_FAIL_DIR/package.json"
printf '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n' > "$RESTORE_FAIL_DIR/.spec-driven/maintenance/config.json"
printf 'import fs from "fs";\nconst status = fs.readFileSync("status.txt", "utf-8").trim();\nif (status !== "fixed") {\n  console.error("status is not fixed");\n  process.exit(1);\n}\n' > "$RESTORE_FAIL_DIR/scripts/check-status.js"
printf 'import fs from "fs";\nfs.writeFileSync("status.txt", "fixed\\n");\n' > "$RESTORE_FAIL_DIR/scripts/fix-status.js"
printf 'broken\n' > "$RESTORE_FAIL_DIR/status.txt"
git -C "$RESTORE_FAIL_DIR" init >/dev/null
git -C "$RESTORE_FAIL_DIR" config user.email "spec-driven@example.com"
git -C "$RESTORE_FAIL_DIR" config user.name "spec-driven"
git -C "$RESTORE_FAIL_DIR" add .
git -C "$RESTORE_FAIL_DIR" commit -m "initial restore failure fixture" >/dev/null
RESTORE_BASE_BRANCH="$(git -C "$RESTORE_FAIL_DIR" branch --show-current)"
printf '#!/usr/bin/env bash\ngit branch -D %s >/dev/null 2>&1 || true\n' "$RESTORE_BASE_BRANCH" > "$RESTORE_FAIL_DIR/.git/hooks/post-commit"
chmod +x "$RESTORE_FAIL_DIR/.git/hooks/post-commit"
out=$($CLI run-maintenance "$RESTORE_FAIL_DIR" 2>&1)
assert_contains "run-maintenance reports blocked restore failure" '"reason": "restore-branch-failed"' "$out"
assert_contains "run-maintenance keeps maintenance branch in blocked output" '"branch": "maintenance-' "$out"
rm -rf "$RESTORE_FAIL_DIR"

ARCHIVE_FAIL_DIR="$(mktemp -d)"
$CLI init "$ARCHIVE_FAIL_DIR" >/dev/null
mkdir -p "$ARCHIVE_FAIL_DIR/scripts" "$ARCHIVE_FAIL_DIR/.spec-driven/maintenance"
printf '{\n  "name": "maintenance-archive-fail",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n' > "$ARCHIVE_FAIL_DIR/package.json"
printf '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n' > "$ARCHIVE_FAIL_DIR/.spec-driven/maintenance/config.json"
printf 'import fs from "fs";\nconst status = fs.readFileSync("status.txt", "utf-8").trim();\nif (status !== "fixed") process.exit(1);\n' > "$ARCHIVE_FAIL_DIR/scripts/check-status.js"
printf 'import fs from "fs";\nfs.writeFileSync("status.txt", "fixed\\n");\n' > "$ARCHIVE_FAIL_DIR/scripts/fix-status.js"
printf 'broken\n' > "$ARCHIVE_FAIL_DIR/status.txt"
git -C "$ARCHIVE_FAIL_DIR" init >/dev/null
git -C "$ARCHIVE_FAIL_DIR" config user.email "spec-driven@example.com"
git -C "$ARCHIVE_FAIL_DIR" config user.name "spec-driven"
git -C "$ARCHIVE_FAIL_DIR" add .
git -C "$ARCHIVE_FAIL_DIR" commit -m "initial archive failure fixture" >/dev/null
rm -rf "$ARCHIVE_FAIL_DIR/.spec-driven/changes/archive"
printf 'not-a-directory\n' > "$ARCHIVE_FAIL_DIR/.spec-driven/changes/archive"
git -C "$ARCHIVE_FAIL_DIR" add .spec-driven/changes/archive
git -C "$ARCHIVE_FAIL_DIR" commit -m "add archive blocker" >/dev/null
out=$($CLI run-maintenance "$ARCHIVE_FAIL_DIR" 2>&1)
assert_contains "run-maintenance reports blocked archive failure" '"reason": "archive-failed"' "$out"
rm -rf "$ARCHIVE_FAIL_DIR"

# ── 2. propose ────────────────────────────────────────────────────────────────
echo -e "${BOLD}[2] propose${RESET}"

cd "$PROJECT"
out=$($CLI propose "$CHANGE" 2>&1)
assert_contains "creates change directory" "Created change:" "$out"
assert_contains "reports proposal.md" "proposal.md" "$out"
assert_contains "reports specs/ dir"  "specs/"      "$out"
assert_contains "reports design.md"   "design.md"   "$out"
assert_contains "reports tasks.md"    "tasks.md"    "$out"
assert_contains "reports questions.md" "questions.md" "$out"
[ -f ".spec-driven/changes/$CHANGE/proposal.md" ] && pass "proposal.md exists" || fail "proposal.md missing"
[ -d ".spec-driven/changes/$CHANGE/specs"       ] && pass "specs/ dir exists"  || fail "specs/ dir missing"
[ -f ".spec-driven/changes/$CHANGE/design.md"   ] && pass "design.md exists"   || fail "design.md missing"
[ -f ".spec-driven/changes/$CHANGE/tasks.md"    ] && pass "tasks.md exists"    || fail "tasks.md missing"
[ -f ".spec-driven/changes/$CHANGE/questions.md" ] && pass "questions.md exists" || fail "questions.md missing"

# duplicate propose should fail
assert_exit "duplicate propose exits 1" 1 $CLI propose "$CHANGE"

# invalid name should fail
assert_exit "invalid name exits 1" 1 $CLI propose "Bad_Name"

# ── 3. modify ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[3] modify${RESET}"

out=$($CLI modify 2>&1)
assert_contains "lists active changes" "$CHANGE" "$out"

out=$($CLI modify "$CHANGE" 2>&1)
assert_contains "shows proposal.md path" "proposal.md" "$out"
assert_contains "shows specs/ dir"       "specs/"      "$out"
assert_contains "shows design.md path"   "design.md"   "$out"
assert_contains "shows tasks.md path"    "tasks.md"    "$out"
assert_contains "shows questions.md path" "questions.md" "$out"

out=$($CLI modify "nonexistent" 2>&1; echo "EXIT:$?") || true
assert_contains "nonexistent change errors" "not found" "$out"

# ── 3b. list ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[3b] list${RESET}"

out=$($CLI list 2>&1)
assert_contains "list shows active changes" "$CHANGE" "$out"
assert_contains "list shows proposed status" "proposed" "$out"

# Mark a task to get in-progress status
TASKS_FILE=".spec-driven/changes/$CHANGE/tasks.md"
sed -i '0,/- \[ \]/s/- \[ \]/- [x]/' "$TASKS_FILE"
out=$($CLI list 2>&1)
assert_contains "list shows in-progress status" "in-progress" "$out"

# Restore task
sed -i '0,/- \[x\]/s/- \[x\]/- [ ]/' "$TASKS_FILE"

# Add open question to questions.md → blocked status
QUESTIONS_FILE=".spec-driven/changes/$CHANGE/questions.md"
printf '# Questions: %s\n\n## Open\n\n- [ ] Q: Is this correct?\n  Context: depends on this\n\n## Resolved\n' "$CHANGE" > "$QUESTIONS_FILE"
out=$($CLI list 2>&1)
assert_contains "list shows blocked status on open questions" "blocked" "$out"

# Restore questions.md
printf '# Questions: %s\n\n## Open\n\n## Resolved\n' "$CHANGE" > "$QUESTIONS_FILE"

# ── 4. apply ──────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[4] apply${RESET}"

out=$($CLI apply "$CHANGE" 2>&1)
assert_json_field "total > 0"     "total"     "6" "$out"
assert_json_field "complete = 0"  "complete"  "0" "$out"
assert_json_field "remaining = 6" "remaining" "6" "$out"

# Mark 2 tasks complete, re-check counts
TASKS_FILE=".spec-driven/changes/$CHANGE/tasks.md"
sed -i '0,/- \[ \]/s/- \[ \]/- [x]/' "$TASKS_FILE"
sed -i '0,/- \[ \]/s/- \[ \]/- [x]/' "$TASKS_FILE"
out=$($CLI apply "$CHANGE" 2>&1)
assert_json_field "complete = 2 after marking" "complete"  "2" "$out"
assert_json_field "remaining = 4 after marking" "remaining" "4" "$out"

assert_exit "missing change exits 1" 1 $CLI apply "nonexistent"

# ── 5. verify ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[5] verify${RESET}"

out=$($CLI verify "$CHANGE" 2>&1)
assert_json_field "valid=true for seeded change" "valid" "true" "$out"
assert_contains   "warns about placeholders"     "placeholders" "$out"
assert_contains   "warns about incomplete tasks"  "incomplete"   "$out"
assert_contains   "warns about empty specs dir"   "specs/ is empty" "$out"

# Missing ## Testing section
echo -e "# Tasks\n\n## Implementation\n\n- [ ] Task 1\n\n## Verification\n\n- [ ] Verify\n" > "$TASKS_FILE"
out=$($CLI verify "$CHANGE" 2>&1)
assert_contains   "warns about missing testing section" "Testing" "$out"

# Empty artifact → errors
echo "" > "$TASKS_FILE"
out=$($CLI verify "$CHANGE" 2>&1)
assert_json_field "empty tasks.md → invalid" "valid" "false" "$out"

# Restore tasks
cd "$ROOT" && $CLI propose "/tmp/dummy-$$" 2>/dev/null || true
cd "$PROJECT"
cp ".spec-driven/changes/$CHANGE/proposal.md" "/tmp/proposal-$$.bak"
$CLI propose "${CHANGE}-fresh" &>/dev/null || true
cp ".spec-driven/changes/${CHANGE}-fresh/tasks.md" "$TASKS_FILE"
rm -rf ".spec-driven/changes/${CHANGE}-fresh"

out=$($CLI verify "$CHANGE" 2>&1)
assert_json_field "valid=true after restore" "valid" "true" "$out"

assert_exit "nonexistent change exits 0 with errors" 0 $CLI verify "nonexistent"

# verify errors on open questions in questions.md
QUESTIONS_FILE=".spec-driven/changes/$CHANGE/questions.md"
printf '# Questions\n\n## Open\n\n- [ ] Q: What should happen here?\n  Context: unclear\n\n## Resolved\n' > "$QUESTIONS_FILE"
out=$($CLI verify "$CHANGE" 2>&1)
assert_json_field "verify errors on open questions" "valid" "false" "$out"
assert_contains   "verify reports open questions message" "open" "$out"

# verify passes when all questions resolved
printf '# Questions\n\n## Open\n\n## Resolved\n\n- [x] Q: What should happen here?\n  Context: unclear\n  A: Do the right thing\n' > "$QUESTIONS_FILE"
out=$($CLI verify "$CHANGE" 2>&1)
assert_json_field "verify passes when questions resolved" "valid" "true" "$out"

# Restore questions.md
printf '# Questions: %s\n\n## Open\n\n## Resolved\n' "$CHANGE" > "$QUESTIONS_FILE"

# ── 6. archive ────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[6] archive${RESET}"

out=$($CLI archive "$CHANGE" 2>&1)
assert_contains "reports archived path" "Archived:" "$out"
assert_contains "includes date prefix"  "$(date +%Y-%m-%d)" "$out"

TODAY="$(date +%Y-%m-%d)"
[ -d ".spec-driven/changes/archive/${TODAY}-${CHANGE}" ] && pass "archive dir exists" || fail "archive dir missing"
[ ! -d ".spec-driven/changes/$CHANGE" ]                  && pass "source dir removed" || fail "source dir still exists"

assert_exit "archive nonexistent exits 1" 1 $CLI archive "nonexistent"
assert_exit "duplicate archive exits 1"   1 $CLI archive "$CHANGE"

# ── 7. cancel ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[7] cancel${RESET}"

cd "$PROJECT"
$CLI propose "to-cancel" &>/dev/null
[ -d ".spec-driven/changes/to-cancel" ] && pass "change exists before cancel" || fail "change missing before cancel"

out=$($CLI cancel "to-cancel" 2>&1)
assert_contains "reports cancelled path" "Cancelled:" "$out"
[ ! -d ".spec-driven/changes/to-cancel" ] && pass "change removed after cancel" || fail "change still exists after cancel"

assert_exit "cancel nonexistent exits 1" 1 $CLI cancel "nonexistent"

# ── Reset (leave repo clean) ──────────────────────────────────────────────────
reset_state

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
total=$((passed + failed))
if [ "$failed" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}All $total tests passed.${RESET}"
else
  echo -e "${RED}${BOLD}$failed/$total tests failed.${RESET}"
  exit 1
fi
