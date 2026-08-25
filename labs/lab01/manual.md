# F215 Digital Design Lab 
## Verilog Lab

This is your first hands-on Verilog lab. 

Each task has its own folder (`task1/`, `task2/`, ...) containing exactly
one testbench, always named `tb.v`.


---

## Task 1 -  Simulate a full adder, then see if gate order matters, and observe the waveforms on adding delays in the gates

**Folder:** `task1/`
**Files:** `FA_Gate.v` (**edit in place**), `tb.v` (given)

**(a)** Compile and simulate the provided gate-level full adder against
`tb.v`, and view the resulting waveform. Confirm `sum` and `cout` match the
full-adder truth table you already know, at every one of the 8 input
combinations the testbench applies.

**(b)** Now reorder the five gate instantiations inside `FA_Gate.v` into any
different sequence (e.g. move the final `or` to the top, the first `xor` to
the bottom). Re-simulate with the same `tb.v`.

**(c)** Add a constant delay to every gate in `FA_Gate.v` (e.g. `xor #(2) (ps, a, b);`).

**Question:** Does the waveform change in task 1(b) or 1(c) when compared with task 1(a)? Explain your answer in terms of how Verilog gate-level statements actually execute

---

## Task 2 - Structural 4-bit ripple-carry adder

**Folder:** `task2/`
**Files:** `FA_Gate.v` (**edit in place**), `ripple_adder.v` (**skeleton — complete this**), `tb.v` (given)

This task introduces gate delays, then uses them immediately to build a
4-bit ripple-carry adder from four `FA_Gate` instances.

Complete `ripple_adder.v` by
instantiating four `FA_Gate` modules and wiring them into a ripple-carry
chain, following the `TODO` comments and the named port-connection pattern
from lecture. Simulate against `tb.v`.

**Questions:**
1. Confirm every result in the waveform is arithmetically correct.
2. The testbench includes the input pair 7+1. Find this transition in the
   waveform and identify the internal carry wire(s) that change as a
   result. With delays now present, you should be able to see each carry
   settle a little later than the one before it — this is the ripple,
   now visible rather than just asserted in lecture.


---

## Task 3 — Three ways to build a 4-bit adder

**Folder:** `task3/`
**Files:** `rca.v`, `cla4.v`, `cla4_dataflow.v` (**all skeletons — complete these**), `dut.v` (**wrapper — edit which option is active**), `tb.v` (given)
**Required:** copy your completed `FA_Gate.v` from Task 2 into this folder.

This task builds three different 4-bit adders and compares them through the
same testbench, by swapping which one is wired into `dut.v`.

**(a) A delayed ripple-carry adder.** Complete `rca.v` — it has the exact
same structure as Task 2's `ripple_adder`, reusing your already-delayed
`FA_Gate`. Make sure `dut.v` has Option 1 (`rca`) active, then simulate.

**(b) A gate-level carry-lookahead adder.** Complete `cla4.v` at the gate
level, following the P/G-signal and direct-carry-equation comments
(matching the lecture circuit and Tutorial 3 exactly), with an explicit
delay on every gate. Switch `dut.v` to Option 2 (`cla4`) and re-simulate
with the same `tb.v`.

*Reflection (no code):* would this hand-instantiated, gate-by-gate approach
still be reasonable if you needed a 64-bit CLA? Concretely, how many
literals would the AND term feeding the final carry need?

**(c) The same circuit, with `assign`.** Complete `cla4_dataflow.v` —
the identical 4-bit CLA, rewritten using dataflow modeling (`assign`
statements, each with its own delay) instead of gate primitives. Switch
`dut.v` to Option 3 and re-simulate.

*Reflection:* compare `cla4.v` and `cla4_dataflow.v` side by side — line
count, readability, how directly each line maps to the Boolean equation it
implements. Which would you rather maintain or debug six months from now?

**Question (all three):** with all three options tested, compare how
quickly each one's final `sum`/`cout` settle in the waveform on the same
7+1 test vector.

---

## Task 4 — Three ways to build a 64-bit adder

**Folder:** `task4/`
**Files:** `rca64.v`, `cla64_flat.v`, `cla64_blocked.v` (**skeletons — complete these**), `dut.v` (**wrapper**), `tb.v` (given)
**Required:** copy your completed `FA_Gate.v` (Task 2) and `cla4.v` (Task 3) into this folder.

Same idea as Task 3, scaled up to 64 bits.

**(a) A flat 64-bit CLA.** Open `cla64_flat.v`. Its P/G generate/propagate
logic is already written for you as a worked example, using a
`generate`-`for` loop — read the comments carefully, since this is the
first time you've seen `generate` in this lab, and it's genuinely the right
tool for this part (uniform logic at every one of the 64 bit positions).

The 64 carry equations are a different story: each one has a different,
growing number of terms, so a simple loop can't produce them directly.
Follow the in-file instructions to use an AI coding assistant to generate
these 64 `assign` statements from your own C1–C4 equations (from `cla4.v`)
as the pattern — **and then verify the result yourself** before trusting
it: confirm C1–C4 match your own derivation exactly, then re-derive at
least one later equation (e.g. C10 or C32) by hand and confirm it matches.

Set `dut.v` to Option 2 (`cla64_flat`) and simulate.

*Reflection:* open your own `c[64]` line and count the literals in its
largest product term. Given that real logic gates rarely exceed 4–8 inputs,
is this circuit realistically buildable in hardware — even though it just
simulated correctly?

**(b) A practical 64-bit CLA.** Complete `cla64_blocked.v` by instantiating
sixteen of your `cla4.v` blocks and chaining their carries block-to-block —
same instantiate-and-chain pattern as Task 2's ripple adder. Set `dut.v` to
Option 3 and simulate.

**(c) A 64-bit ripple-carry adder, for comparison.** Complete `rca64.v` —
64 chained `FA_Gate` instances (a `generate`-`for` loop is a reasonable way
to write this one too, since every stage is structurally identical —
unlike part (a)'s carry equations). Set `dut.v` to Option 1 and simulate.

**Questions (all three):**
1. Run `tb.v` once per option and compare how much earlier the two
   CLA-based adders' final sums settle, compared to `rca64`.
2. Does the speedup roughly match Tutorial 3's predicted numbers?
3. `cla64_flat` and `cla64_blocked` should perform similarly *in this
   simulation*. Given that, why would a real chip still use the (b) design
   over the (a) design?

---

## Task 5 (Bonus, not required for submission) — The O(log n) adder

**Folder:** `task5/`
**Files:** `cla64_hier.v` (**open-ended — no detailed skeleton**), `dut.v` (given, pre-wired to `cla64_hier`), `tb.v` (given, same as Task 4's)
**Required:** copy your completed `cla4.v` from Task 4 into this folder.

Apply the same generate/propagate trick to the 16 blocks from Task 4(b)
*themselves*, building a second-level lookahead unit that computes each
block's carry-in directly, instead of rippling block to block — the scheme
from Tutorial 3, Q4(d). See the comments in `cla64_hier.v` for a starting
point; the rest of the design is up to you.

**Question:** simulate against `tb.v` and compare your final delay to Task
4(b)'s `cla64_blocked`. If you'd like a direct side-by-side, copy your
Task 4 files into this folder too and use `dut.v`'s commented-out options.
