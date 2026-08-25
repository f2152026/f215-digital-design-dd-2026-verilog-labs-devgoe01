#!/usr/bin/env bash
set -e

LAB="$1"
TASK="$2"
TB="$3"

if [ -z "$LAB" ] || [ -z "$TASK" ] || [ -z "$TB" ]; then
  echo "Usage: run.sh <lab> <task> <testbench>"
  echo "Example: run.sh lab1 task2 tb_fa.v"
  exit 1
fi

ARTEFACT_DIR="artefacts/${LAB}"
TB_BASE=$(basename "$TB")
SIM_FILE="${ARTEFACT_DIR}/${TASK}_${TB_BASE%.v}.sim"
VCD_FILE="${ARTEFACT_DIR}/${TASK}_${TB_BASE%.v}.vcd"

if [ ! -f "$SIM_FILE" ]; then
  echo "Error: simulation binary not found:"
  echo "  $SIM_FILE"
  echo "Did you run compile first?"
  exit 1
fi

vvp "$SIM_FILE" +vcd="$VCD_FILE"

echo "✔ Simulation complete:"
echo "  $VCD_FILE"
