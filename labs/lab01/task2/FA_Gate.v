// FA_Gate.v
// Gate-level model of a 1-bit full adder, now with explicit gate delays.
// From this task onward, every gate/assign you write in this lab should
// have an explicit delay -- it's the default way we'll be writing Verilog
// from here on, not a special add-on.
//
// Part (a): add a CONSTANT delay to every gate below, e.g.:
//   xor #(2) (ps, a, b);
// Do this for all five gates, then complete ripple_adder.v (this folder)
// using this full adder, and simulate against tb.v.
//
// Part (b): after completing (a), change every gate's delay from a single
// constant value to a RISE/FALL pair instead, e.g.:
//   xor #(2,3) (ps, a, b);   // rise delay = 2, fall delay = 3
// This tells the simulator to use a different delay depending on whether
// the gate's output is transitioning 0->1 (rise) or 1->0 (fall) -- real
// gates are rarely symmetric this way. Re-simulate with the SAME
// ripple_adder.v and tb.v; nothing else needs to change.

module FA_Gate(
  input  a,
  input  b,
  input  cin,
  output sum,
  output cout
);
  wire ps, pc1, pc2;

  xor (ps,  a,   b);
  and (pc1, a,   b);
  xor (sum, cin, ps);
  and (pc2, cin, ps);
  or  (cout, pc1, pc2);

endmodule
