# F215 Digital Design — Lab 2

*Dataflow & Behavioral Modeling, and Writing Testbenches*

### What you'll take away from this lab

- The difference between nets (`wire`) and variables (`reg`), and which one belongs on which side of dataflow vs. behavioral modeling.
- Vectors vs. arrays, and exactly what kind of indexing is legal and illegal on each.
- Using `parameter` to make a module configurable, and overriding parameters at instantiation.
- System tasks (`$display`, `$write`, `$monitor`, `$time`, `$stop`, `$finish`) and how a testbench uses them to actually assert correctness, not just print things.
- Where a delay can be placed in dataflow and in behavioral code, and why those two choices behave very differently.
- How the choice of sensitivity list changes what an `always` block actually does.
- Blocking vs. non-blocking assignment, and why the rule "blocking for combinational, non-blocking for sequential" exists.

---

## Task 1 — Nets vs. Registers: the same mux, two ways

`mux_df.v` and `mux_beh.v` each implement a 2-to-1 multiplexer — one in dataflow style, one in behavioral style — and neither one compiles as given.

- **`mux_df.v`** — *given, buggy — fix it*
- **`mux_beh.v`** — *given, buggy — fix it*
- **`dut.v`** — *given — but you have to select the correct muxmodule to simulate by commenting out the other instantiation*
- **`tb.v`** — *given as a starter template — you have to complete it*

### (a) Complete tb.v

`tb.v` is given as a starter template with the `reg`/`wire` keywords already in place, but the actual declarations, the DUT instantiation, and the input stimulus are left for you to fill in (look for every `TODO`). Apply all 8 combinations of I0, I1, S, 5 time units apart for testing the circuits.

### (b) Compile and fix

Try to compile `mux_df.v` and `mux_beh.v` separately (by instantiating them inside `dut.v`, once your `tb.v` is ready). Both will fail. Identify the semantic error and fix it, then run again.

Before you fix anything, write down (a sentence each is enough): why does dataflow modeling require its output to be a net, and why does behavioral modeling require its output to be a `reg`? What would the simulator actually be confused about if you left the bug in?

---

## Task 2 — Vectors, Arrays, and Parameters: a small ROM

`lut.v` is a parameterized lookup table: it has `DEPTH` lines in it, with each line `WIDTH` bits wide. A line is read out (appears on the output `dout`) combinationally based on the signal applied at the `sel` input.

- **`lut.v`** — *given as a skeleton — two TODOs for you to complete*
- **`tb.v`** — *not provided — you write this yourself*

### A hint on $clog2

The `sel` port is declared as `[$clog2(DEPTH)-1:0]` rather than a fixed width. `$clog2(x)` is a built-in system function that computes ⌈log₂(x)⌉ — the ceiling of log base 2 — which is exactly the number of address bits needed to reach DEPTH distinct locations. The point is that `sel`'s width now tracks DEPTH automatically: if you override DEPTH at instantiation, the address width recalculates itself, and you never have to remember to keep a second width parameter in sync by hand. For example, `$clog2(4) = 2` (2 bits address 4 locations), and `$clog2(8) = 3`.

### (a) Complete lut.v

Two things are left for you:

- Initialize `mem[i] = i×i` for every `i` from 0 to DEPTH-1.
- Make `dout` combinationally reflect `mem[sel]`.

### Why an initial block, here specifically

A ROM's contents need to exist before anything ever reads from it, and they never change during simulation after that. `initial` is the only one of the two procedural blocks that matches this: it runs exactly once, at time 0, before the rest of the simulation gets going. `always` would be the wrong tool here — it only runs again in response to something in its sensitivity list changing, and a fixed set of constants has nothing that ever changes to trigger it. `assign` is also out: it's for driving a net continuously from an expression, not for loading a whole array's worth of individual values. Use a `for` loop inside your `initial` block to set every location without writing DEPTH separate lines by hand.

### (b) Write tb.v and use a parameter override

Write your own testbench. Instantiate `lut` with a parameter override that's different from the module's own defaults — for example:

```
lut #(.WIDTH(8), .DEPTH(8)) U1 (
  .sel  (t_sel),
  .dout (t_dout)
);
```

This is the correct way to configure a module's parameters from outside — note that you cannot just assign to `WIDTH` or `DEPTH` like an ordinary variable from inside the testbench; parameters are set only at instantiation, using this `#(...)` override syntax. Because `sel`'s width comes from `$clog2(DEPTH)`, `t_sel` should be declared wide enough for the largest DEPTH you plan to test with (3 bits comfortably covers both DEPTH=4 and DEPTH=8 above).

Loop `sel` through every valid address and check `t_dout` against the `i×i` value you expect at that address — you already know exactly what should come back, since you (and the module) both used the same formula.

---

## Task 3 — System Tasks: writing a testbench that actually checks itself

So far your testbenches have applied stimulus and let you eyeball the waveform. This task is about writing a testbench that decides pass or fail on its own.

- **`comp2.v`** — *given*
- **`tb.v`** — *not provided — write this yourself*

`comp2.v` is a 2-bit magnitude comparator: given A and B, exactly one of GT, LT, EQ should be 1 for any input pair. It has a bug. Write your testbench first, before you look at the module's source — a good self-checking testbench should find the bug for you without you needing to read the design at all.

### How a testbench asserts correctness

The pattern: for every input combination, compute the expected outputs independently in the testbench (not by copying the design's logic — that would just repeat the same bug if there is one), then compare. Use `!==` rather than `!=` for the comparison.

```verilog
if ({t_gt, t_lt, t_eq} !== {exp_gt, exp_lt, exp_eq}) begin
  $display("FAIL at time %0t: A=%b B=%b  got GT=%b LT=%b EQ=%b  expected GT=%b LT=%b EQ=%b",
           $time, t_a, t_b, t_gt, t_lt, t_eq, exp_gt, exp_lt, exp_eq);
  errors = errors + 1;
end
```

Keep a running error count (an integer, incremented on every mismatch) instead of stopping at the very first failure — that way one run tells you how many of the 16 input combinations are affected, not just that "something" is wrong. At the very end, `$display` a one-line summary (how many passed out of how many total) and `$finish`. This is also a natural place to use `$write` instead of `$display` for building that summary line piece by piece without an unwanted newline in the middle of it, and `$monitor` is still useful during development for watching every signal change live while you're getting the testbench itself working.

`$stop` is different from the other five: it doesn't fail or pass anything, it just pauses the simulator into an interactive debug prompt so you can inspect signals by hand. It's a development-time convenience for you while you're debugging your own testbench — it shouldn't appear in the version you finally submit, since it would just hang an automated run.

### (a) Find the bug

Run your self-checking testbench against `comp2.v` as given. It should report failures on some (not all) of the 16 input combinations. Note which combinations fail and what pattern you notice among them — that pattern is a big clue to where the bug is.

### (b) Fix it and re-confirm

Fix `comp2.v`, and re-run the exact same testbench, unchanged. Confirm your summary line now reports all 16 combinations passing.

---

## Task 4 — Delays: where you put them changes what they mean

You will write three tiny modules, all implementing the same 2-input AND gate, differing only in where and how long of a delay is placed:

- **`and_df.v`** — *not provided — you write this*
- **`and_beh_before.v`** — *not provided — you write this*
- **`and_beh_intra.v`** — *not provided — you write this*
- **`tb.v`** — *given — instantiates all three together, do not modify*

`tb.v` is given and instantiates `and_df`, `and_beh_before`, and `and_beh_intra` side by side, driven by the same fast-toggling stimulus, so all three outputs land in one waveform view.

### Where a delay can go

There are exactly two places to put a delay in a single procedural assignment, and they are not the same thing:

- Delay before the assignment: `#5 y = a & b;` — the statement waits 5 time units, then evaluates `a & b` using whatever `a` and `b` happen to be at that later moment.
- Intra-assignment delay: `y = #5 a & b;` — `a & b` is evaluated immediately, right now, using the current values; only the write of that already-computed result into `y` is delayed by 5 units.

A continuous assignment can carry a delay too: `assign #5 y = a & b;` — this is dataflow's own version, and behaves like a third, independent case (more on this below).

### (a) add 1 time step delays to all three modules

- `and_df.v` — dataflow, `assign #1 y = a & b;`
- `and_beh_before.v` — behavioral, `always @(*)` with the delay placed before the assignment
- `and_beh_intra.v` — behavioral, `always @(*)` with an intra-assignment delay

Compare the output of the three implementations (all are in the single output waveform). Which implementationsgive the correct expected results?

### (b) add 2 time step delays to all three modules

- `and_df.v` — dataflow, `assign #2 y = a & b;`
- `and_beh_before.v` — behavioral, `always @(*)` with the delay placed before the assignment
- `and_beh_intra.v` — behavioral, `always @(*)` with an intra-assignment delay

Compare the output of the three implementations (all are in the single output waveform). Which implementationsgive the correct expected results?

### (c) add 3 time step delays to all three modules

- `and_df.v` — dataflow, `assign #3 y = a & b;`
- `and_beh_before.v` — behavioral, `always @(*)` with the delay placed before the assignment
- `and_beh_intra.v` — behavioral, `always @(*)` with an intra-assignment delay

Compare the output of the three implementations (all are in the single output waveform). Which implementationsgive the correct expected results?

### (d) Explain your observations across the 9 cases above (3 implementations x 3 delays)

### (e) What do you learn from this regarding running simulations with delays?

---

## Task 5 — Sensitivity Lists and Blocking vs. Non-Blocking

`alu.v` is a 1-bit-opcode ALU (op=0: add, op=1: sub) operating on two 4-bit vectors. Subtraction is implemented the way real hardware actually does it: negate b (one's complement, then +1 for two's complement) and add the result to a. It's given to you complete but broken — there are two separate bugs, and you're expected to find both purely by simulating it, not by reading the source codeof the module.

- **`alu.v`** — *given, buggy — do not read the internals until your testbench has told you something is wrong*
- **`tb.v`** — *not provided — you write this yourself*

Write a testbench for `alu.v` (a self-checking one, using what you built in Task 3, is strongly recommended — it will find both bugs for you far faster than eyeballing a waveform will). Test at least: both operations, with the same operand pair held fixed while you switch `op`; and both operations again with the operands changing.

### What you're looking for

1. The sensitivity-list bug: test the same operand pair with both values of `op`, and watch for `result` simply failing to respond when you'd expect it to. Fix this bug by adding only specific signals to the sensitivity list **(not *)**.

2. The blocking/non-blocking bug is in the subtract path, which computes its result over three dependent steps — `b_inv`, then `b_twos` (which needs `b_inv`), then `result` (which needs `b_twos`). Test subtraction with a few different operand pairs and check every result against a-b computed by hand or in your testbench. If the assignment types in that three-step chain aren't all consistent, each step ends up using the value its input had before this evaluation, rather than the value just computed earlier in the same block — so the whole chain runs one step behind. You should be able to catch this on essentially any subtraction test, including the very first one you try; you don't need any special timing trick to expose it. Once you see it, look directly at the three statements in the sub branch and check whether they're all using the same assignment operator.

This is exactly the kind of situation the blocking-for-combinational rule is meant to prevent: whenever one procedural statement's result feeds directly into the next one in the same block, non-blocking assignment breaks that chain, because none of the new values become visible to each other until the whole block has finished executing.

### Fix and submit

Once you've found and fixed both bugs, re-run your testbench and confirm a clean pass across every input combination you test. Submit your corrected `alu.v` (this is the file our autograder will run against) together with the testbench you used to find and confirm the fixes.
