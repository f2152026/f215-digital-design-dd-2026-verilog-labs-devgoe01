// dut.v
// Wrapper module for the bonus task. Only cla64_hier.v is required to be
// present for this to compile as-is. If you'd like to compare directly
// against your Task 4 implementations, copy rca64.v / cla64_flat.v /
// cla64_blocked.v into this folder too and uncomment the matching option.

module dut(
  input  [63:0] a,
  input  [63:0] b,
  input         cin,
  output [63:0] sum,
  output        cout
);

  // ---- Bonus: hierarchical (O(log n)) 64-bit carry-lookahead adder ----
  cla64_hier U_IMPL (.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));

  // ---- For comparison, copy the required file(s) into this folder and
  //      uncomment ONE of the options below at a time (matching Task 4) ----
  // rca64 U_IMPL (.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));
  // cla64_flat U_IMPL (.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));
  // cla64_blocked U_IMPL (.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));

endmodule
