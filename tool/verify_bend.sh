#!/bin/sh
# Run from any directory. Missing tools or unproven laws fail the gate.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"
export PATH="$HOME/.bend/bin:$HOME/.elan/bin:$PATH"
export ELAN_TOOLCHAIN=leanprover/lean4:v4.34.0
bend_bin=${BEND_BIN:-bend}
expected="bend 2.0.38"
actual=$("$bend_bin" version)
if [ "$actual" != "$expected" ]; then
  echo "Expected $expected; found $actual. Review and update the pin deliberately." >&2
  exit 1
fi
"$bend_bin" PROOF.bend --verdict
