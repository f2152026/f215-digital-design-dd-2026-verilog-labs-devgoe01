module tb;

reg [3:0] t_a,t_b;
reg t_op;
wire [3:0] t_resulte,t_resultg;

alu DUT(
    .a(t_a),
    .b(t_b),
    .op(t_op),
    .result(t_resultg)
);

myalu ADUT(
    .a(t_a),
    .b(t_b),
    .op(t_op),
    .result(t_resulte)    
);

integer i,j,k;
integer error=0;

initial 
begin
        for(i=0;i<16;i++) begin
            t_a=i;
            for(j=0;j<16;j++) begin
                t_b=j;
                for(k=1;k<3;k++) begin
                    t_op=k;
                    #1;
                    if(t_resulte!==t_resultg)
                    begin
                        $display("ERROR:OP=%0d,A=%0d,B=%0d,Expected=%0d,Got=%0d",t_op,t_a,t_b,t_resulte,t_resultg);
                        error++;
                    end
                end
            end
        end
        $display("Errors:%0d",error);
        $finish;
end
endmodule
    

