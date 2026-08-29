// cla4.v
// Gate-level 4-bit carry-lookahead adder, matching the lecture circuit.
// Every gate needs an explicit delay (constant is fine here, e.g. #(2)) --
// this is the default from Task 2 onward, not a special step.
//
// TODO -- Step 1: generate/propagate signals (one xor + one and per bit)
//   p[i] = a[i] ^ b[i]
//   g[i] = a[i] & b[i]
//
// TODO -- Step 2: direct (non-recursive) carry equations. Verilog's and/or
// primitives accept more than 2 inputs directly, e.g.:
//   and #(2) (t2, p1, p0, g0);
// so you do not need to manually chain 2-input gates.
//   c1 = g0 + p0.cin
//   c2 = g1 + p1.g0 + p1.p0.cin
//   c3 = g2 + p2.g1 + p2.p1.g0 + p2.p1.p0.cin
//   c4 = g3 + p3.g2 + p3.p2.g1 + p3.p2.p1.g0 + p3.p2.p1.p0.cin
//
// TODO -- Step 3: sum bits
//   sum[i] = p[i] ^ c[i]     (c0 = cin)

module cla4(
  input  [3:0] a,
  input  [3:0] b,
  input        cin,
  output [3:0] sum,
  output       cout
);

  wire p0, p1, p2, p3;
  wire g0, g1, g2, g3;
  wire c1, c2, c3;

  xor #(2) (p0, a[0], b[0]);
  xor #(2) (p1, a[1], b[1]);
  xor #(2) (p2, a[2], b[2]);
  xor #(2) (p3, a[3], b[3]);

  and #(2) (g0, a[0], b[0]);
  and #(2) (g1, a[1], b[1]);
  and #(2) (g2, a[2], b[2]);
  and #(2) (g3, a[3], b[3]);

  wire t10;
  and #(2) (t10, p0, cin);
  or  #(2) (c1, g0, t10);

  wire t21, t20;
  and #(2) (t21, p1, g0);
  and #(2) (t20, p1, p0, cin);
  or  #(2) (c2, g1, t21, t20);

  wire t32, t31, t30;
  and #(2) (t32, p2, g1);
  and #(2) (t31, p2, p1, g0);
  and #(2) (t30, p2, p1, p0, cin);
  or  #(2) (c3, g2, t32, t31, t30);

  wire t43, t42, t41, t40;
  and #(2) (t43, p3, g2);
  and #(2) (t42, p3, p2, g1);
  and #(2) (t41, p3, p2, p1, g0);
  and #(2) (t40, p3, p2, p1, p0, cin);
  or  #(2) (cout, g3, t43, t42, t41, t40);

  xor #(2) (sum[0], p0, cin);
  xor #(2) (sum[1], p1, c1);
  xor #(2) (sum[2], p2, c2);
  xor #(2) (sum[3], p3, c3);

endmodule
