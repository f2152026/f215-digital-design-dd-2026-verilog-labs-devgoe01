// alu.v
// 1-bit-opcode ALU: op=0 -> add, op=1 -> sub. 4-bit operands.
// Subtraction is implemented the way real hardware does it: negate b (one's
// complement, then +1 for two's complement) and add.
//
// This module has TWO separate bugs for you to find by simulating it with
// your own testbench -- not by reading the code:
//   1. A sensitivity-list bug (combinational output not updating on every
//      relevant input change).
//   2. A blocking/non-blocking bug in the subtract path.
//
// Write your own tb.v, use it to find both problems, then fix this file
// and re-test before submitting.

module alu (
  input      [3:0] a,
  input      [3:0] b,
  input             op,      // 0 = add, 1 = sub
  output reg [3:0] result
);

  reg [3:0] b_inv;
  reg [3:0] b_twos;

  always @(a, b) begin
    case (op)
      1'b0: begin
        result = a + b;                 // add
      end
      1'b1: begin
        b_inv  <= ~b;                   // sub, via two's complement
        b_twos <= b_inv + 1;
        result <= a + b_twos;
      end
    endcase
  end

endmodule

