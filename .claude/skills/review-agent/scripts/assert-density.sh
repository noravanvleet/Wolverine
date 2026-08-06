#!/usr/bin/env bash
# Compares total test-assertion count to total production source LOC, project-wide.
# Usage:
#   assert-density.sh            # scan the whole project (repo root, or $(pwd) if not a git repo)
#   assert-density.sh <root>     # scope both counts to files under <root>
# Env:
#   THRESHOLD=0.05   # asserts-per-source-LOC ratio below which the project is flagged
set -euo pipefail

THRESHOLD="${THRESHOLD:-0.05}"
ASSERT_PATTERN='\b(assert[A-Z][A-Za-z0-9]*|assertThat|verify)\s*\('
TEST_NAME_PATTERN='(Test|Tests|IT)\.java$'
TEST_PATH_PATTERN='/test/'
PRUNE_DIRS='.git|target|build|out|node_modules'

root="${1:-.}"
if [ "$#" -eq 0 ]; then
  git_root=$(git -C "$root" rev-parse --show-toplevel 2>/dev/null || true)
  [ -n "$git_root" ] && root="$git_root"
fi

is_test_file() {
  case "$1" in
    *"$TEST_PATH_PATTERN"*) return 0 ;;
  esac
  echo "$1" | grep -qE "$TEST_NAME_PATTERN"
}

count_loc() {
  grep -cve '^[[:space:]]*$' -e '^[[:space:]]*//' -e '^[[:space:]]*\*' -e '^[[:space:]]*/\*' "$1" 2>/dev/null || true
}

count_asserts() {
  grep -Eo "$ASSERT_PATTERN" "$1" 2>/dev/null | wc -l | tr -d ' ' || true
}

source_loc=0
test_asserts=0
source_files=0
test_files=0

while IFS= read -r file; do
  [ -f "$file" ] || continue
  if is_test_file "$file"; then
    test_files=$((test_files + 1))
    n=$(count_asserts "$file")
    test_asserts=$((test_asserts + ${n:-0}))
  else
    source_files=$((source_files + 1))
    n=$(count_loc "$file")
    source_loc=$((source_loc + ${n:-0}))
  fi
done < <(find "$root" -type f -name '*.java' | grep -Ev "/($PRUNE_DIRS)/")

if [ "$source_files" -eq 0 ] && [ "$test_files" -eq 0 ]; then
  echo "No Java files found under '$root'."
  exit 0
fi

ratio=$(awk -v a="$test_asserts" -v l="$source_loc" 'BEGIN{ if (l>0) printf "%.3f", a/l; else print "0.000" }')
below=$(awk -v r="$ratio" -v t="$THRESHOLD" 'BEGIN{ print (r+0 < t+0) ? 1 : 0 }')

if [ "$below" -eq 1 ]; then
  echo "FLAG  project assertion density below threshold"
fi

printf 'TOTAL source_files=%d source_loc=%d test_files=%d asserts=%d ratio=%s threshold=%s\n' \
  "$source_files" "$source_loc" "$test_files" "$test_asserts" "$ratio" "$THRESHOLD"
