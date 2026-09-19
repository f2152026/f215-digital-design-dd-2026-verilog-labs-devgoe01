module and_beh_intra(
    input a,
    input b,
    output reg y
);

always @(*) begin
    y=#3 a&b;
end

endmodule