#!/usr/bin/env bash
# Test runner for spec-driven scripts.
# Runs all 5 scripts against test/todo-app, verifies output, then resets state.
# Safe to run repeatedly.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$ROOT/test/todo-app"
CLI="node $ROOT/dist/scripts/spec-driven.js"
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
  if echo "$haystack" | grep -qF "$needle"; then pass "$label";
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

# ── 0. init ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}[0] init${RESET}"

INIT_DIR="$(mktemp -d)"
out=$($CLI init "$INIT_DIR" 2>&1)
assert_contains "creates .spec-driven/"  "Initialized:"  "$out"
[ -f "$INIT_DIR/.spec-driven/config.yaml"          ] && pass "config.yaml exists"  || fail "config.yaml missing"
[ -f "$INIT_DIR/.spec-driven/specs/INDEX.md"       ] && pass "INDEX.md exists"    || fail "INDEX.md missing"
[ -d "$INIT_DIR/.spec-driven/specs"                ] && pass "specs/ dir exists"   || fail "specs/ dir missing"
[ -d "$INIT_DIR/.spec-driven/changes"              ] && pass "changes/ dir exists" || fail "changes/ dir missing"

out2=$($CLI init "$INIT_DIR" 2>&1)
assert_contains "duplicate init exits 0 (idempotent)" "Initialized:" "$out2"
assert_contains "duplicate init reports index regeneration" "INDEX.md" "$out2"
[ -f "$INIT_DIR/.spec-driven/config.yaml" ] && pass "duplicate init preserves config.yaml" || fail "duplicate init removed config.yaml"
rm -rf "$INIT_DIR"

# ── 0b. migrate ───────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[0b] migrate${RESET}"

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
[ -d "$MIGRATE_DIR/.claude/skills/spec-driven-propose" ] && pass "migrate adds claude spec-driven skill" || fail "migrate missing claude spec-driven skill"
[ ! -d "$MIGRATE_DIR/.claude/skills/openspec-propose" ] && pass "migrate removes claude openspec skill" || fail "migrate left claude openspec skill"
[ ! -e "$MIGRATE_DIR/.claude/commands/opsx" ] && pass "migrate removes claude commands" || fail "migrate left claude commands"
[ -d "$MIGRATE_DIR/.opencode/skills/spec-driven-apply" ] && pass "migrate adds opencode spec-driven skill" || fail "migrate missing opencode spec-driven skill"
[ ! -d "$MIGRATE_DIR/.opencode/skills/openspec-apply-change" ] && pass "migrate removes opencode openspec skill" || fail "migrate left opencode openspec skill"
[ -d "$MIGRATE_DIR/.cursor/skills/openspec-propose" ] && pass "migrate preserves unsupported tool skill" || fail "migrate changed unsupported tool skill"

mkdir -p "$MIGRATE_DIR/openspec"
out=$($CLI migrate "$MIGRATE_DIR" 2>&1)
assert_contains "migrate skips rename when spec-driven exists" "Skipped openspec/ rename" "$out"
rm -rf "$MIGRATE_DIR"

# ── 1. propose ────────────────────────────────────────────────────────────────
echo -e "${BOLD}[1] propose${RESET}"

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

# ── 2. modify ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[2] modify${RESET}"

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

# ── 2b. list ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[2b] list${RESET}"

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

# ── 3. apply ──────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[3] apply${RESET}"

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

# ── 4. verify ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[4] verify${RESET}"

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

# ── 5. archive ────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[5] archive${RESET}"

out=$($CLI archive "$CHANGE" 2>&1)
assert_contains "reports archived path" "Archived:" "$out"
assert_contains "includes date prefix"  "$(date +%Y-%m-%d)" "$out"

TODAY="$(date +%Y-%m-%d)"
[ -d ".spec-driven/changes/archive/${TODAY}-${CHANGE}" ] && pass "archive dir exists" || fail "archive dir missing"
[ ! -d ".spec-driven/changes/$CHANGE" ]                  && pass "source dir removed" || fail "source dir still exists"

assert_exit "archive nonexistent exits 1" 1 $CLI archive "nonexistent"
assert_exit "duplicate archive exits 1"   1 $CLI archive "$CHANGE"

# ── 6. cancel ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[6] cancel${RESET}"

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
