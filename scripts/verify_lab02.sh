#!/usr/bin/env bash
# scripts/verify_lab02.sh
# End-to-end local test runner for Lab 2 tasks.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}           Verilog Lab 02 - Verification Suite        ${NC}"
echo -e "${BLUE}======================================================${NC}"

TOTAL_SCORE=0
MAX_SCORE=100

run_test() {
  local TASK_NAME="$1"
  local POINTS="$2"
  local SETUP_CMD="$3"
  local RUN_CMD="$4"
  local EXPECTED_STR="$5"

  echo -e "\n${YELLOW}▶ Running: ${TASK_NAME} (${POINTS} pts)${NC}"

  # Run setup
  if ! eval "$SETUP_CMD" > /dev/null 2>&1; then
    echo -e "${RED}❌ FAILED (Compilation / Setup Error)${NC}"
    return 1
  fi

  # Run simulation
  OUTPUT=$(eval "$RUN_CMD" 2>&1 || true)

  if echo "$OUTPUT" | grep -q "$EXPECTED_STR"; then
    echo -e "${GREEN}✔ PASSED (+${POINTS} pts)${NC}"
    TOTAL_SCORE=$((TOTAL_SCORE + POINTS))
    return 0
  else
    echo -e "${RED}❌ FAILED (Output did not match expected pattern)${NC}"
    echo -e "   Expected: ${EXPECTED_STR}"
    echo -e "   Output preview: $(echo "$OUTPUT" | head -n 5)"
    return 1
  fi
}

# --- Task 1a: mux_df ---
run_test "Task 1a: 2-to-1 MUX Dataflow (mux_df)" 10 \
  "printf '`timescale 1ns/1ps\nmodule tb;\n  reg t_i0, t_i1, t_s;\n  wire t_y;\n  mux_df DUT (.I0(t_i0), .I1(t_i1), .S(t_s), .Y(t_y));\n  integer i, err = 0;\n  initial begin\n    for (i = 0; i < 8; i = i + 1) begin\n      {t_i0, t_i1, t_s} = i[2:0];\n      #5;\n      if (t_y !== (t_s ? t_i1 : t_i0)) begin\n        $display(\"FAIL: I0=%b I1=%b S=%b got Y=%b\", t_i0, t_i1, t_s, t_y);\n        err = err + 1;\n      end\n    end\n    if (err == 0) $display(\"ALL_MUX_DF_TESTS_PASSED\");\n    $finish;\n  end\nendmodule\n' > labs/lab02/task1/tb_grade_df.v && ./scripts/compile.sh lab02 task1 labs/lab02/task1/tb_grade_df.v" \
  "./scripts/run.sh lab02 task1 labs/lab02/task1/tb_grade_df.v" \
  "ALL_MUX_DF_TESTS_PASSED" || true
rm -f labs/lab02/task1/tb_grade_df.v

# --- Task 1b: mux_beh ---
run_test "Task 1b: 2-to-1 MUX Behavioral (mux_beh)" 10 \
  "printf '`timescale 1ns/1ps\nmodule tb;\n  reg t_i0, t_i1, t_s;\n  wire t_y;\n  mux_beh DUT (.I0(t_i0), .I1(t_i1), .S(t_s), .Y(t_y));\n  integer i, err = 0;\n  initial begin\n    for (i = 0; i < 8; i = i + 1) begin\n      {t_i0, t_i1, t_s} = i[2:0];\n      #5;\n      if (t_y !== (t_s ? t_i1 : t_i0)) begin\n        $display(\"FAIL: I0=%b I1=%b S=%b got Y=%b\", t_i0, t_i1, t_s, t_y);\n        err = err + 1;\n      end\n    end\n    if (err == 0) $display(\"ALL_MUX_BEH_TESTS_PASSED\");\n    $finish;\n  end\nendmodule\n' > labs/lab02/task1/tb_grade_beh.v && ./scripts/compile.sh lab02 task1 labs/lab02/task1/tb_grade_beh.v" \
  "./scripts/run.sh lab02 task1 labs/lab02/task1/tb_grade_beh.v" \
  "ALL_MUX_BEH_TESTS_PASSED" || true
rm -f labs/lab02/task1/tb_grade_beh.v

# --- Task 2: Parameterized ROM (lut) ---
run_test "Task 2: Parameterized ROM (lut)" 20 \
  "printf '`timescale 1ns/1ps\nmodule tb;\n  reg [2:0] sel8; wire [7:0] dout8;\n  lut #(.WIDTH(8), .DEPTH(8)) U8 (.sel(sel8), .dout(dout8));\n  integer i, err = 0;\n  initial begin\n    #1;\n    for (i = 0; i < 8; i = i + 1) begin\n      sel8 = i[2:0];\n      #5;\n      if (dout8 !== (i * i)) begin\n        $display(\"FAIL at sel=%0d: got %0d, expected %0d\", i, dout8, (i*i));\n        err = err + 1;\n      end\n    end\n    if (err == 0) $display(\"ALL_LUT_TESTS_PASSED\");\n    $finish;\n  end\nendmodule\n' > labs/lab02/task2/tb_grade.v && ./scripts/compile.sh lab02 task2 labs/lab02/task2/tb_grade.v" \
  "./scripts/run.sh lab02 task2 labs/lab02/task2/tb_grade.v" \
  "ALL_LUT_TESTS_PASSED" || true
rm -f labs/lab02/task2/tb_grade.v

# --- Task 3: 2-bit Comparator (comp2) ---
run_test "Task 3: 2-bit Comparator (comp2)" 20 \
  "printf '`timescale 1ns/1ps\nmodule tb;\n  reg [1:0] A, B;\n  wire GT, LT, EQ;\n  comp2 DUT (.A(A), .B(B), .GT(GT), .LT(LT), .EQ(EQ));\n  integer i, j, err = 0;\n  reg exp_gt, exp_lt, exp_eq;\n  initial begin\n    for (i = 0; i < 4; i = i + 1) begin\n      for (j = 0; j < 4; j = j + 1) begin\n        A = i[1:0]; B = j[1:0];\n        exp_gt = (i > j);\n        exp_lt = (i < j);\n        exp_eq = (i == j);\n        #5;\n        if ({GT, LT, EQ} !== {exp_gt, exp_lt, exp_eq}) begin\n          $display(\"FAIL: A=%0d B=%0d got GT=%b LT=%b EQ=%b expected GT=%b LT=%b EQ=%b\", i, j, GT, LT, EQ, exp_gt, exp_lt, exp_eq);\n          err = err + 1;\n        end\n      end\n    end\n    if (err == 0) $display(\"ALL_COMP2_TESTS_PASSED\");\n    $finish;\n  end\nendmodule\n' > labs/lab02/task3/tb_grade.v && ./scripts/compile.sh lab02 task3 labs/lab02/task3/tb_grade.v" \
  "./scripts/run.sh lab02 task3 labs/lab02/task3/tb_grade.v" \
  "ALL_COMP2_TESTS_PASSED" || true
rm -f labs/lab02/task3/tb_grade.v

# --- Task 4: Delay Placement (and_df, and_beh_before, and_beh_intra) ---
run_test "Task 4: Delay Placement Modules" 20 \
  "./scripts/compile.sh lab02 task4 labs/lab02/task4/tb.v" \
  "./scripts/run.sh lab02 task4 labs/lab02/task4/tb.v" \
  "Simulation complete:" || true

# --- Task 5: Capstone ALU (alu) ---
run_test "Task 5: Capstone ALU (alu)" 20 \
  "printf '`timescale 1ns/1ps\nmodule tb;\n  reg [3:0] a, b;\n  reg op;\n  wire [3:0] result;\n  alu DUT (.a(a), .b(b), .op(op), .result(result));\n  integer err = 0;\n  reg [3:0] exp_res;\n  initial begin\n    // Test 1: Addition\n    a = 4'\''d5; b = 4'\''d3; op = 1'\''b0;\n    #5; exp_res = (a + b) & 4'\''hF;\n    if (result !== exp_res) begin $display(\"FAIL Add 5+3: got %0d expected %0d\", result, exp_res); err = err + 1; end\n    // Test 2: Sensitivity list check (toggle op only)\n    op = 1'\''b1;\n    #5; exp_res = (a - b) & 4'\''hF;\n    if (result !== exp_res) begin $display(\"FAIL Sub 5-3 (op toggle): got %0d expected %0d\", result, exp_res); err = err + 1; end\n    // Test 3: Subtraction back-to-back dependency chain check\n    a = 4'\''d8; b = 4'\''d2; op = 1'\''b1;\n    #5; exp_res = (a - b) & 4'\''hF;\n    if (result !== exp_res) begin $display(\"FAIL Sub 8-2: got %0d expected %0d\", result, exp_res); err = err + 1; end\n    // Test 4: Subtraction negative result (modulo 16)\n    a = 4'\''d3; b = 4'\''d7; op = 1'\''b1;\n    #5; exp_res = (a - b) & 4'\''hF;\n    if (result !== exp_res) begin $display(\"FAIL Sub 3-7: got %0d expected %0d\", result, exp_res); err = err + 1; end\n    if (err == 0) $display(\"ALL_ALU_TESTS_PASSED\");\n    $finish;\n  end\nendmodule\n' > labs/lab02/task5/tb_grade.v && ./scripts/compile.sh lab02 task5 labs/lab02/task5/tb_grade.v" \
  "./scripts/run.sh lab02 task5 labs/lab02/task5/tb_grade.v" \
  "ALL_ALU_TESTS_PASSED" || true
rm -f labs/lab02/task5/tb_grade.v

echo -e "\n${BLUE}======================================================${NC}"
echo -e "${BLUE}  Total Lab 02 Score: ${TOTAL_SCORE} / ${MAX_SCORE} points${NC}"
echo -e "${BLUE}======================================================${NC}"
