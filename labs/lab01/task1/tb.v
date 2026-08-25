// tb.v
// Testbench for FA_Gate. This file is given -- do not modify it.
// Applies all 8 input combinations, 5 time units apart. Used unchanged for
// both parts (a) and (b) of this task.

module tb;
  reg  t_a, t_b, t_cin;
  wire t_sum, t_cout;

  FA_Gate DUT (
    .a    (t_a),
    .b    (t_b),
    .cin  (t_cin),
    .sum  (t_sum),
    .cout (t_cout)
  );

  // Waveform dump configuration
  string vcd_file;
  initial begin
    if ($value$plusargs("vcd=%s", vcd_file)) begin
      $dumpfile(vcd_file);
      $dumpvars(0, DUT);
    end
  end

  initial begin
    t_a = 0; t_b = 0; t_cin = 0;
    #5 t_a = 0; t_b = 0; t_cin = 1;
    #5 t_a = 0; t_b = 1; t_cin = 0;
    #5 t_a = 0; t_b = 1; t_cin = 1;
    #5 t_a = 1; t_b = 0; t_cin = 0;
    #5 t_a = 1; t_b = 0; t_cin = 1;
    #5 t_a = 1; t_b = 1; t_cin = 0;
    #5 t_a = 1; t_b = 1; t_cin = 1;
    #5 $finish;
  end

  initial
    $monitor($time, " a=%b b=%b cin=%b | sum=%b cout=%b", t_a, t_b, t_cin, t_sum, t_cout);

endmodule
