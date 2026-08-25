// dut.v
// Wrapper module: pick exactly ONE of the three implementations below by
// leaving it uncommented, with the other two commented out. Compile and
// run tb.v, then switch to a different implementation and repeat -- this
// lets you compare rca64.v, cla64_flat.v, and cla64_blocked.v using the
// exact same testbench and stimulus each time.

module dut(
  input  [63:0] a,
  input  [63:0] b,
  input         cin,
  output [63:0] sum,
  output        cout
);

  // ---- Option 1: 64-bit ripple-carry adder ----
  rca64 U_IMPL (.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));

  // ---- Option 2: flat (unblocked) 64-bit carry-lookahead adder ----
  // cla64_flat U_IMPL (.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));

  // ---- Option 3: blocked 64-bit carry-lookahead adder ----
  // cla64_blocked U_IMPL (.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));

endmodule
