// dut.v
// Top-level wrapper so the same tb.v can test either implementation.
// Exactly ONE of the two instantiations below should be uncommented at a
// time. Comment out the other one, save, and re-run the simulation.

module DUT (
  input  I0,
  input  I1,
  input  S,
  output Y
);

  // ---- Option 1: dataflow version ----
  // mux_df U1 (
  //   .I0 (I0),
  //   .I1 (I1),
  //   .S  (S),
  //   .Y  (Y)
  // );

  // ---- Option 2: behavioral version ----
  mux_beh U1 (
    .I0 (I0),
    .I1 (I1),
    .S  (S),
    .Y  (Y)
  );

endmodule
