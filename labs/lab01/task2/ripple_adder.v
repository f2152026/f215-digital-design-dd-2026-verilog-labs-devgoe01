// ripple_adder.v
// Structural 4-bit ripple-carry adder, built from four FA_Gate instances.
// (Delays live inside FA_Gate.v -- nothing here needs a delay of its own.)
//
// TODO: instantiate four FA_Gate modules (name them FA0..FA3) and connect
// them into a ripple-carry chain, matching the pattern from lecture:
//
//   FA0: a[0], b[0], cin  -> sum[0], c1
//   FA1: a[1], b[1], c1   -> sum[1], c2
//   FA2: a[2], b[2], c2   -> sum[2], c3
//   FA3: a[3], b[3], c3   -> sum[3], cout
//
// Use named port connections (.a(...), .b(...), etc.), not positional.

module ripple_adder(
  input  [3:0] a,
  input  [3:0] b,
  input        cin,
  output [3:0] sum,
  output       cout
);

  wire c1, c2, c3;

  // TODO: your four FA_Gate instances go here.

endmodule
