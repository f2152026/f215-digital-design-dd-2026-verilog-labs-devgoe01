// tb.v
// Starter testbench template -- YOU complete this file.
//
// Goal: apply all 8 combinations of I0, I1, S (5 time units apart) to DUT
// and observe the output. Fill in every TODO below.

module tb;

  // TODO: declare the three DUT inputs as the appropriate variable type.
  // Use exactly these names: t_i0, t_i1, t_s (needed by $monitor below).
  reg   ________________________;
  // TODO: declare the DUT output as the appropriate net type.
  // Use exactly this name: t_y (needed by $monitor below).
  wire  ________________________;

  // TODO: instantiate DUT here, connecting t_i0, t_i1, t_s, t_y to its ports


  // Waveform dump configuration
  string vcd_file;
  initial begin
    if ($value$plusargs("vcd=%s", vcd_file)) begin
      $dumpfile(vcd_file);
      $dumpvars(0, DUT);
    end
  end

  initial begin
    // TODO: apply all 8 combinations of t_i0, t_i1, t_s, 5 time units apart,
    // then $finish. (Same pattern you used in Lab 1's tb.v.)

  end

  initial
    $monitor($time, " I0=%b I1=%b S=%b | Y=%b", t_i0, t_i1, t_s, t_y);

endmodule
