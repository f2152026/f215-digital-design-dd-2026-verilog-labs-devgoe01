// tb.v
// Testbench for dut.v. This file is given -- do not modify it.
// Works unchanged regardless of which implementation is currently active
// inside dut.v.

module tb;
  reg  [3:0] t_a, t_b;
  reg        t_cin;
  wire [3:0] t_sum;
  wire       t_cout;

  dut DUT (
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
    t_a = 4'b0000; t_b = 4'b0000; t_cin = 0;
    #20 t_a = 4'b0111; t_b = 4'b0001; t_cin = 0;   // worst-case ripple: carry crosses all 4 stages
    #20 t_a = 4'b1111; t_b = 4'b0001; t_cin = 0;
    #20 t_a = 4'b0101; t_b = 4'b0011; t_cin = 1;
    #20 t_a = 4'b1010; t_b = 4'b0101; t_cin = 0;
    #20 $finish;
  end

  initial
    $monitor($time, " a=%b b=%b cin=%b | sum=%b cout=%b", t_a, t_b, t_cin, t_sum, t_cout);

endmodule
