#!/usr/bin/env bash
# Test runner for spec-driven scripts.
# Runs all 5 scripts against test/todo-app, verifies output, then resets state.
# Safe to run repeatedly.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$ROOT/test/todo-app"
SCRIPTS="$ROOT/dist/scripts"
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

# ── 1. propose ────────────────────────────────────────────────────────────────
echo -e "${BOLD}[1] propose${RESET}"

cd "$PROJECT"
out=$(node "$SCRIPTS/propose.js" "$CHANGE" 2>&1)
assert_contains "creates change directory" "Created change:" "$out"
assert_contains "reports proposal.md" "proposal.md" "$out"
assert_contains "reports design.md"   "design.md"   "$out"
assert_contains "reports tasks.md"    "tasks.md"    "$out"
[ -f ".spec-driven/changes/$CHANGE/proposal.md" ] && pass "proposal.md exists" || fail "proposal.md missing"
[ -f ".spec-driven/changes/$CHANGE/design.md"   ] && pass "design.md exists"   || fail "design.md missing"
[ -f ".spec-driven/changes/$CHANGE/tasks.md"    ] && pass "tasks.md exists"    || fail "tasks.md missing"

# duplicate propose should fail
assert_exit "duplicate propose exits 1" 1 node "$SCRIPTS/propose.js" "$CHANGE"

# invalid name should fail
assert_exit "invalid name exits 1" 1 node "$SCRIPTS/propose.js" "Bad_Name"

# ── 2. modify ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[2] modify${RESET}"

out=$(node "$SCRIPTS/modify.js" 2>&1)
assert_contains "lists active changes" "$CHANGE" "$out"

out=$(node "$SCRIPTS/modify.js" "$CHANGE" 2>&1)
assert_contains "shows proposal.md path" "proposal.md" "$out"
assert_contains "shows design.md path"   "design.md"   "$out"
assert_contains "shows tasks.md path"    "tasks.md"    "$out"

out=$(node "$SCRIPTS/modify.js" "nonexistent" 2>&1; echo "EXIT:$?") || true
assert_contains "nonexistent change errors" "not found" "$out"

# ── 3. apply ──────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[3] apply${RESET}"

out=$(node "$SCRIPTS/apply.js" "$CHANGE" 2>&1)
assert_json_field "total > 0"     "total"     "5" "$out"
assert_json_field "complete = 0"  "complete"  "0" "$out"
assert_json_field "remaining = 5" "remaining" "5" "$out"

# Mark 2 tasks complete, re-check counts
TASKS_FILE=".spec-driven/changes/$CHANGE/tasks.md"
sed -i '0,/- \[ \]/s/- \[ \]/- [x]/' "$TASKS_FILE"
sed -i '0,/- \[ \]/s/- \[ \]/- [x]/' "$TASKS_FILE"
out=$(node "$SCRIPTS/apply.js" "$CHANGE" 2>&1)
assert_json_field "complete = 2 after marking" "complete"  "2" "$out"
assert_json_field "remaining = 3 after marking" "remaining" "3" "$out"

assert_exit "missing change exits 1" 1 node "$SCRIPTS/apply.js" "nonexistent"

# ── 4. verify ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[4] verify${RESET}"

out=$(node "$SCRIPTS/verify.js" "$CHANGE" 2>&1)
assert_json_field "valid=true for seeded change" "valid" "true" "$out"
assert_contains   "warns about placeholders"  "placeholders" "$out"
assert_contains   "warns about incomplete tasks" "incomplete" "$out"

# Empty artifact → errors
echo "" > "$TASKS_FILE"
out=$(node "$SCRIPTS/verify.js" "$CHANGE" 2>&1)
assert_json_field "empty tasks.md → invalid" "valid" "false" "$out"

# Restore tasks
cd "$ROOT" && node "$SCRIPTS/propose.js" "/tmp/dummy-$$" 2>/dev/null || true
cd "$PROJECT"
cp ".spec-driven/changes/$CHANGE/proposal.md" "/tmp/proposal-$$.bak"
node "$SCRIPTS/propose.js" "${CHANGE}-fresh" &>/dev/null || true
cp ".spec-driven/changes/${CHANGE}-fresh/tasks.md" "$TASKS_FILE"
rm -rf ".spec-driven/changes/${CHANGE}-fresh"

out=$(node "$SCRIPTS/verify.js" "$CHANGE" 2>&1)
assert_json_field "valid=true after restore" "valid" "true" "$out"

assert_exit "nonexistent change exits 0 with errors" 0 node "$SCRIPTS/verify.js" "nonexistent"

# ── 5. archive ────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[5] archive${RESET}"

out=$(node "$SCRIPTS/archive.js" "$CHANGE" 2>&1)
assert_contains "reports archived path" "Archived:" "$out"
assert_contains "includes date prefix"  "$(date +%Y-%m-%d)" "$out"

TODAY="$(date +%Y-%m-%d)"
[ -d ".spec-driven/changes/archive/${TODAY}-${CHANGE}" ] && pass "archive dir exists" || fail "archive dir missing"
[ ! -d ".spec-driven/changes/$CHANGE" ]                  && pass "source dir removed" || fail "source dir still exists"

assert_exit "archive nonexistent exits 1" 1 node "$SCRIPTS/archive.js" "nonexistent"
assert_exit "duplicate archive exits 1"   1 node "$SCRIPTS/archive.js" "$CHANGE"

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
