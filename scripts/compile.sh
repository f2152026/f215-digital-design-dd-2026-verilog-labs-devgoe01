#!/usr/bin/env bash
set -e

LAB="$1"
TASK="$2"
TB="$3"

if [ -z "$LAB" ] || [ -z "$TASK" ] || [ -z "$TB" ]; then
  echo "Usage: compile.sh <lab> <task> <testbench>"
  exit 1
fi

LAB_DIR="labs/${LAB}"
TASK_DIR="${LAB_DIR}/${TASK}"
TB_FILE="$TB"
DUT_FILE="${TASK_DIR}/dut.v"
ARTEFACT_DIR="artefacts/${LAB}"

# Sanity checks
[ -d "$LAB_DIR" ] || { echo "Error: lab not found"; exit 1; }
[ -d "$TASK_DIR" ] || { echo "Error: task not found"; exit 1; }
[ -f "$TB_FILE" ] || { echo "Error: testbench not found: $TB_FILE"; exit 1; }

mkdir -p "$ARTEFACT_DIR"

TB_BASE=$(basename "$TB")
OUT_SIM="${ARTEFACT_DIR}/${TASK}_${TB_BASE%.v}.sim"

# Collect Verilog files from task directory, excluding testbenches to prevent duplication errors
TASK_FILES=()
for f in "$TASK_DIR"/*.v; do
  if [ -e "$f" ]; then
    f_base=$(basename "$f")
    if [ "$f" != "$TB_FILE" ] && [ "$f_base" != "tb.v" ]; then
      TASK_FILES+=("$f")
    fi
  fi
done

if [ ${#TASK_FILES[@]} -eq 0 ]; then
  echo "Error: No Verilog design files found in $TASK_DIR"
  exit 1
fi

# Collect shared files *only if they exist*
SHARED_FILES=()
if [ -d "shared" ]; then
  for f in shared/*.v; do
    [ -e "$f" ] && SHARED_FILES+=("$f")
  done
fi

iverilog -g2012 -Wall \
  -o "$OUT_SIM" \
  "${SHARED_FILES[@]}" \
  "${TASK_FILES[@]}" \
  "$TB_FILE"

echo "✔ Compiled: $OUT_SIM"
