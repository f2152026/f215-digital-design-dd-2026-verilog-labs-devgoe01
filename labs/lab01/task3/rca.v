// rca.v
// Identical structure to Task 2's ripple_adder -- reuse your wiring
// pattern directly.
//
// Required file: copy your completed FA_Gate.v from Task 2 (the version
// with delays already added, from part (a) or (b)) into this folder.
// No separate "delay" variant is needed -- Task 2's FA_Gate already has
// delays built in, and every gate/module from here on should too.
//
// TODO: instantiate four FA_Gate instances, same chaining pattern as
// Task 2 (FA0..FA3, carry chain c1,c2,c3).

module rca(
  input  [3:0] a,
  input  [3:0] b,
  input        cin,
  output [3:0] sum,
  output       cout
);

  wire c1, c2, c3;

  FA_Gate FA0 (.a(a[0]), .b(b[0]), .cin(cin), .sum(sum[0]), .cout(c1));
  FA_Gate FA1 (.a(a[1]), .b(b[1]), .cin(c1), .sum(sum[1]), .cout(c2));
  FA_Gate FA2 (.a(a[2]), .b(b[2]), .cin(c2), .sum(sum[2]), .cout(c3));
  FA_Gate FA3 (.a(a[3]), .b(b[3]), .cin(c3), .sum(sum[3]), .cout(cout));

endmodule
