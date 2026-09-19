// mux_df.v
// 2-to-1 multiplexer, DATAFLOW style.
//
// This file does not compile as-is. Find the bug and fix it before moving on.
// Hint: think carefully about which port should be a net and which should be
// a variable in dataflow modeling.

module mux_df (
  input      I0,
  input      I1,
  input      S,
  output wire Y
);

  assign Y = (S & I0) | ((~S) & I1);

endmodule
