module myalu(
    input [3:0] a,
    input [3:0] b,
    input op,
    output reg [3:0] result
);

reg [3:0] onecp,twocp;

always @(*) begin
    case(op)
        1'b0:
        begin
            result=a+b;
        end
        1'b1:
        begin
            onecp=~b;
            twocp=onecp+1;
            result=a+twocp;
        end
    endcase
end

endmodule