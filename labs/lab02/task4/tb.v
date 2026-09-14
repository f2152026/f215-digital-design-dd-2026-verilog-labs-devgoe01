// tb.v
// Given -- do not modify.
//
// Instantiates all three of your AND-gate implementations side by side and
// drives them with the SAME fast-toggling stimulus, so you can compare all
// three waveforms in one view and see directly which implementation(s)
// respond correctly to inputs that change faster than the delay.

module tb;

  reg  t_a, t_b;
  wire y_df, y_before, y_intra;

  and_df         U_DF     (.a(t_a), .b(t_b), .y(y_df));
  and_beh_before U_BEFORE (.a(t_a), .b(t_b), .y(y_before));
  and_beh_intra  U_INTRA  (.a(t_a), .b(t_b), .y(y_intra));

  // Waveform dump configuration
  string vcd_file;
  initial begin
    if ($value$plusargs("vcd=%s", vcd_file)) begin
      $dumpfile(vcd_file);
      $dumpvars(0, tb);
    end
  end

  // Each gate has a #5 delay somewhere in its own implementation. Toggle
  // the inputs every 2 time units -- faster than that 5-unit delay -- so
  // that any implementation using stale values will show it.
  initial begin
    t_a = 0; t_b = 0;
    #2 t_a = 1; t_b = 0;
    #2 t_a = 1; t_b = 1;
    #2 t_a = 0; t_b = 1;
    #2 t_a = 1; t_b = 1;
    #2 t_a = 0; t_b = 0;
    #2 t_a = 1; t_b = 1;
    #2 t_a = 0; t_b = 0;
    #10 $finish;
  end

  initial
    $monitor($time, " a=%b b=%b | df=%b  before=%b  intra=%b",
             t_a, t_b, y_df, y_before, y_intra);

endmodule
