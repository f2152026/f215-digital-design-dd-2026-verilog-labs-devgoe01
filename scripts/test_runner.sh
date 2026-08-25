#!/usr/bin/env bash
# Usage: ./scripts/test_runner.sh <lab> <task> <testbench>
# Example: ./scripts/test_runner.sh lab01 task1 tb_fa.v

set -e

LAB="$1"
TASK="$2"
TB="$3"

if [ -z "$LAB" ] || [ -z "$TASK" ] || [ -z "$TB" ]; then
  echo "Usage: test_runner.sh <lab> <task> <testbench>"
  exit 1
fi

# Run compilation
./scripts/compile.sh "$LAB" "$TASK" "$TB"

# Run simulation and capture output
# We disable 'set -e' temporarily so we can check the run output even if it fails
set +e
SIM_OUTPUT=$(./scripts/run.sh "$LAB" "$TASK" "$TB" 2>&1)
RUN_CODE=$?
set -e

echo "=== Simulation Output ==="
echo "$SIM_OUTPUT"
echo "========================="

if [ $RUN_CODE -ne 0 ]; then
  echo "❌ Error: Simulation execution failed."
  exit 1
fi

if echo "$SIM_OUTPUT" | grep -q "All test cases PASSED."; then
  echo "✔ Test case PASSED successfully!"
  exit 0
else
  echo "❌ Test case FAILED: Expected output containing 'All test cases PASSED.'"
  exit 1
fi
