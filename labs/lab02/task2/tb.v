// tb.v
// Starter testbench template -- YOU complete this file.

module tb;

  // TODO: declare the inputs and outputs
  reg [1:0] t_sel;
  wire [7:0] t_dout;

  // TODO: instantiate DUT here
  lut DUT(
    .sel(t_sel),
    .dout(t_dout)
  );
  // Waveform dump configuration (DO NOT CHANGE)
  string vcd_file;
  initial begin
    if ($value$plusargs("vcd=%s", vcd_file)) begin
      $dumpfile(vcd_file);
      $dumpvars(0, DUT);
    end
  end

  initial begin
    // TODO: apply different input combinations
    t_sel = 2'b00;
    #10; 
    
    t_sel = 2'b01;
    #10; 
    
    t_sel = 2'b10;
    #10; 
    
    t_sel = 2'b11;
    #10;
  end

  initial
    $monitor($time, " I0=%b I1=%b S=%b | Y=%b", t_i0, t_i1, t_s, t_y); // change as required

endmodule
