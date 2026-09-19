module tb;

reg [1:0] t_A,t_B;
wire t_GA,t_LA,t_EA,t_GG,t_LG,t_EG;

comp2 DUT(
    .A(t_A),
    .B(t_B),
    .GT(t_GG),
    .EQ(t_EG),
    .LT(t_LG)
);

mycomp ADUT(
    .A(t_A),
    .B(t_B),
    .GT(t_GA),
    .EQ(t_EA),
    .LT(t_LA)
);

integer error=0;
integer i,j;

initial 
begin
    for(i=0;i<4;i++)
    begin
        t_A=i;
        for(j=0;j<4;j++)
        begin
            t_B=j;
            #1;
            if({t_EA,t_LA,t_GA}!=={t_EG,t_LG,t_GG})
            begin
                 $write("FAIL at time %0t: A=%0d B=%0d expected GT=%b LT=%b EQ=%b got GT=%b LT=%b EQ=%b\n",
                       $time, t_A, t_B,
                       t_GA, t_LA, t_EA,
                       t_GG, t_LG, t_EG);
                error++;
            end  
        end
    end  
    $write("ERRORS:%0d",error);
    $finish;
end

endmodule