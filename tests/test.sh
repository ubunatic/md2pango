#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o errtrace

fail() { echo -e "[FAIL] $*"; exit 1; }
ok()   { echo -e "[OK] $*\n";         }

test_md2pango() {
    set -e
    node src/md2pango.js tests/test.md > tests/result.pango
    diff "tests/result.pango" "tests/expected.pango" ||
    fail "tests/result.pango does not match tests/expected.pango"
    ok   "Output looks good!"
}

test_lint() {
    reuse lint ||
    fail "reuse test failed, please check (.reuse/dep5)"
    ok   "reuse spec is OK"
}

test_all() {
    test_md2pango
    test_lint    
}

test_demo() {
    demos/gtk4-app.js
}

if test $# -eq 0
then targets=all
else targets="$*"
fi

echo "running tests: $targets"
for t in $targets; do "test_$t"; done
