// lut.v
// A small parameterized ROM (lookup table): DEPTH words, each WIDTH bits
// wide. dout continuously reflects mem[sel].
//
// YOU complete the two TODOs below. Everything else is given.

module lut #(
  parameter WIDTH = 8,
  parameter DEPTH = 4
) (
  input      [$clog2(DEPTH)-1:0] sel,
  output reg [WIDTH-1:0]         dout
);

  reg [WIDTH-1:0] mem [0:DEPTH-1];

  integer i;

  // TODO: initialize mem[i] = i*i for every i from 0 to DEPTH-1.
  initial begin
    for( i = 0;i <DEPTH; i = i + 1)
    begin
      mem[i] = i * i;
    end
  end
  // Use an initial block with a for loop -- this is the only place a ROM's
  // contents should be set up. (See the lab manual for why.)
  

  // TODO: make dout continuously reflect mem[sel]. This is a combinational
  // read -- pick the right procedural block and sensitivity list.
  always @(*) begin
    dout = mem[sel];
  end



endmodule
