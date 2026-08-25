// tb.v
// Testbench for ripple_adder. This file is given -- do not modify it.
// Time gaps are wide enough to let signals settle even with delays
// present (used for both part (a) and part (b) of this task). The second
// stimulus vector (7+1) deliberately makes the carry ripple through all
// three internal carry wires (c1, c2, c3) -- and once delays are in the
// picture, you can watch that ripple happen bit by bit in the waveform.

module tb;
  reg  [3:0] t_a, t_b;
  reg        t_cin;
  wire [3:0] t_sum;
  wire       t_cout;

  ripple_adder DUT (
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
    #20 t_a = 4'b0111; t_b = 4'b0001; t_cin = 0;   // carry ripples through c1,c2,c3
    #20 t_a = 4'b1111; t_b = 4'b0001; t_cin = 0;   // sum=0000, cout=1
    #20 t_a = 4'b0101; t_b = 4'b0011; t_cin = 1;
    #20 t_a = 4'b1010; t_b = 4'b0101; t_cin = 0;
    #20 $finish;
  end

  initial
    $monitor($time, " a=%b b=%b cin=%b | sum=%b cout=%b", t_a, t_b, t_cin, t_sum, t_cout);

endmodule
