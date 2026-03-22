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

echo -e "\n${BOLD}spec-driven test suite${RESET} — project: test/todo-app\n"
reset_state

# ── 0. init ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}[0] init${RESET}"

INIT_DIR="$(mktemp -d)"
out=$($CLI init "$INIT_DIR" 2>&1)
assert_contains "creates .spec-driven/"  "Initialized:"  "$out"
[ -f "$INIT_DIR/.spec-driven/config.yaml"    ] && pass "config.yaml exists"  || fail "config.yaml missing"
[ -d "$INIT_DIR/.spec-driven/specs"          ] && pass "specs/ dir exists"   || fail "specs/ dir missing"
[ -d "$INIT_DIR/.spec-driven/changes"        ] && pass "changes/ dir exists" || fail "changes/ dir missing"

assert_exit "duplicate init exits 1" 1 $CLI init "$INIT_DIR"
rm -rf "$INIT_DIR"

# ── 1. propose ────────────────────────────────────────────────────────────────
echo -e "${BOLD}[1] propose${RESET}"

cd "$PROJECT"
out=$($CLI propose "$CHANGE" 2>&1)
assert_contains "creates change directory" "Created change:" "$out"
assert_contains "reports proposal.md" "proposal.md" "$out"
assert_contains "reports specs/ dir"  "specs/"      "$out"
assert_contains "reports design.md"   "design.md"   "$out"
assert_contains "reports tasks.md"    "tasks.md"    "$out"
[ -f ".spec-driven/changes/$CHANGE/proposal.md" ] && pass "proposal.md exists" || fail "proposal.md missing"
[ -d ".spec-driven/changes/$CHANGE/specs"       ] && pass "specs/ dir exists"  || fail "specs/ dir missing"
[ -f ".spec-driven/changes/$CHANGE/design.md"   ] && pass "design.md exists"   || fail "design.md missing"
[ -f ".spec-driven/changes/$CHANGE/tasks.md"    ] && pass "tasks.md exists"    || fail "tasks.md missing"

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

out=$($CLI modify "nonexistent" 2>&1; echo "EXIT:$?") || true
assert_contains "nonexistent change errors" "not found" "$out"

# ── 3. apply ──────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[3] apply${RESET}"

out=$($CLI apply "$CHANGE" 2>&1)
assert_json_field "total > 0"     "total"     "4" "$out"
assert_json_field "complete = 0"  "complete"  "0" "$out"
assert_json_field "remaining = 4" "remaining" "4" "$out"

# Mark 2 tasks complete, re-check counts
TASKS_FILE=".spec-driven/changes/$CHANGE/tasks.md"
sed -i '0,/- \[ \]/s/- \[ \]/- [x]/' "$TASKS_FILE"
sed -i '0,/- \[ \]/s/- \[ \]/- [x]/' "$TASKS_FILE"
out=$($CLI apply "$CHANGE" 2>&1)
assert_json_field "complete = 2 after marking" "complete"  "2" "$out"
assert_json_field "remaining = 2 after marking" "remaining" "2" "$out"

assert_exit "missing change exits 1" 1 $CLI apply "nonexistent"

# ── 4. verify ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[4] verify${RESET}"

out=$($CLI verify "$CHANGE" 2>&1)
assert_json_field "valid=true for seeded change" "valid" "true" "$out"
assert_contains   "warns about placeholders"     "placeholders" "$out"
assert_contains   "warns about incomplete tasks"  "incomplete"   "$out"
assert_contains   "warns about empty specs dir"   "specs/ is empty" "$out"

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
