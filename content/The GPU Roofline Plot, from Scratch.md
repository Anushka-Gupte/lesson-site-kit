# The GPU Roofline Plot, from Scratch

*A 25-minute lesson for total beginners. Script and reference notes combined.*

**How to read this:** it is written the way you would say it aloud. **\[Run\]** blocks are real code you run live. **Diagram** lines mark where you add a drawing to the board, one step at a time. Everything marked *measured* I ran myself, on a small CPU and on a free Colab Tesla T4 GPU, on 14 November 2026. The numbers for the worked examples are for the AMD Instinct MI300X and come from AMD’s own published specifications, which I cross-checked against other sources.

---

## 1. A kitchen with two bottlenecks

Start with a puzzle. An AMD Instinct MI300X, one of the biggest AI chips made, can do about **1,300 trillion** calculations every second. Ask it to add two lists of numbers, and it manages about **0.9 trillion**. That is under a tenth of one percent of what you paid for. The chip is not broken. It is waiting. What is it waiting for?

Picture a busy dhaba kitchen. The cook is incredibly fast: he can chop a thousand vegetables a minute. But the vegetables live in the sabzi mandi across town, and one helper brings them on a cycle, a few kilos a minute. Now watch two recipes.

- **A salad.** One chop per vegetable. The cook finishes instantly and stands idle, waiting for the next bag. The *helper* is the bottleneck.
- **A slow dum biryani.** Every ingredient is handled again and again for hours. The helper brings everything once and has nothing to do. The *cook* is the bottleneck.

That is the whole idea of the lesson. A GPU is a very fast cook (**compute**) with a helper who fetches from a far-away store (**memory**). Which of the two limits you, depends on the recipe. The roofline plot is a picture that tells you which, at a glance.

**Diagram 1, step 1:** draw a big box on the left, the *Mandi (memory)*. **Step 2:** draw a box on the right, the *Kitchen (compute units)*. **Step 3:** draw the helper's road between them and label it *bandwidth: bytes per second*. **Step 4:** write the cook's speed inside the kitchen: *FLOP per second*. **Step 5:** under the picture write the two recipes, *salad: few chops per kg* and *biryani: many chops per kg*.

## 2. The two limits of a GPU

Every processor has exactly two numbers that matter here.

1. **Peak compute**, measured in FLOP/s: floating-point operations per second. One FLOP is one small calculation, like a multiply or an add.
2. **Memory bandwidth**, measured in bytes/s: how many bytes the chip can pull from its main memory per second.

For the AMD Instinct MI300X, using 16-bit numbers called BF16 on its special matrix units:

| Limit | Value |
| --- | --- |
| Peak compute | about **1,307 TFLOP/s** (1,307 trillion per second) |
| Memory bandwidth | about **5.3 TB/s** (5.3 trillion bytes per second) |

Divide one by the other: 1,307 ÷ 5.3 is about **247**. In the time the helper brings **one byte**, the cook could do about **247 chops**. That single number, 247, is the heart of everything that follows.

Two honest footnotes. First, the 1,307 figure only applies when you use the chip’s special matrix hardware. For ordinary 32-bit arithmetic on its regular vector units, AMD lists about 163 TFLOP/s, eight times lower, so the roof for ordinary code is much lower (a ridge of only about 31). Second, these are *peak* numbers from the spec sheet. Real programs get less.

## 3. Arithmetic intensity: chops per kilo

The hardware is fixed. What *you* control is the recipe. We measure the recipe with one ratio:

> **arithmetic intensity = FLOPs performed ÷ bytes moved**

In kitchen words: how many chops you do for every kilo the helper brings. High intensity means biryani. Low intensity means salad.

Let us compute it for real operations, counting BF16 numbers at 2 bytes each.

**Adding two lists, c = a + b.** For each position you read two numbers and write one: 6 bytes. You do 1 addition. Intensity = 1 ÷ 6 ≈ **0.17**. This is salad.

**Multiplying two big square matrices, N × N.** You read two matrices and write one: 3 × N² numbers, so 6N² bytes. The work is about 2N³ FLOPs, because each of the N² results needs N multiplies and N adds. Intensity = 2N³ ÷ 6N² = **N/3**. For N = 4096 that is about **1,365**. This is biryani, and the bigger the matrix, the richer the biryani. Why? The work grows like N³ but the data grows only like N². Every number gets reused N times once it has arrived.

## 4. Deriving the roofline from scratch

Now we get to the plot, and we can derive it in four lines. Suppose a job needs F FLOPs and M bytes moved, on a chip with peak compute P and bandwidth B.

- The cook alone needs at least **F ÷ P** seconds.
- The helper alone needs at least **M ÷ B** seconds.
- If the two work at the same time, the job cannot finish faster than the *slower* of them: **time ≥ max(F ÷ P, M ÷ B)**.
- The speed we actually get is FLOPs divided by time, which gives:

```latex
\text{attainable FLOP/s}=\min\!\left(P,\; B\times\frac{F}{M}\right)=\min\!\left(P,\; B\times I\right)
```

In words: *you get the smaller of two numbers: the cook’s top speed, or the helper’s bandwidth multiplied by your intensity I.* Check the units: bytes/s × FLOP/byte = FLOP/s.

The two numbers meet at the **ridge point**, where P = B × I. So the ridge is **I = P ÷ B**. For the MI300X that is 1,307 ÷ 5.3 ≈ **247 FLOP per byte**. Left of the ridge you are waiting on memory. Right of the ridge you are using the whole chip.

**Why log axes, and why is the memory roof a straight diagonal line?** Intensity runs from 0.1 to over 1,000, and speed spans several powers of ten. On normal axes, everything interesting would be squashed into one corner. On log axes, each step of ×10 is the same distance, like the Richter scale for earthquakes. And take the memory side, speed = B × I. Take logs of both sides: log(speed) = log(B) + 1 × log(I). That is a straight line with slope exactly 1. The flat compute roof is just a horizontal line. A diagonal and a flat line, meeting at a corner: that is the “roof”.

An honest caveat on “at the same time”: this assumes perfect overlap between fetching and computing. Real programs sit on or under the roof, never above it.

**Diagram 2, step 1:** draw two log axes: intensity (0.1 to 10,000) across, speed (0.1 to 10,000 TFLOP/s) up. **Step 2:** draw the memory diagonal, *bandwidth × intensity*. **Step 3:** draw the flat compute roof at 1,307. **Step 4:** mark the ridge where they meet, near 247. **Step 5:** plot the four example operations from the next section.

## 5. Real examples on the MI300X

Now we place real work on the picture. Speed = min(1,307, 5.3 × I) in TFLOP/s.

| Operation | Intensity | Speed you can get | Verdict |
| --- | --- | --- | --- |
| Add two lists | 0.17 | 5.3 × 0.17 ≈ **0.88 TFLOP/s**, 0.07% of peak | Memory-bound. Our puzzle is solved. |
| LLM decode, one user | about 1 | 5.3 × 1 ≈ **5.3 TFLOP/s**, 0.4% of peak | Memory-bound |
| LLM decode, 64 users at once | about 64 | 5.3 × 64 ≈ **339 TFLOP/s**, about 26% | Memory-bound, but 64 times better |
| 4096 × 4096 matmul | about 1,365 | **1,307 TFLOP/s**, the roof | Compute-bound. What GPUs are built for. |

**The most important example: why a chatbot types one word at a time.** To produce each new word, a language model must read *all* of its weights from memory. For one user, that is a matrix times a vector: each weight is read once and used once. About 2 FLOPs per 2 bytes: intensity about 1.

Let’s put a real number on it. Take an 8-billion-parameter model in BF16: 8 billion × 2 bytes = **16 GB** of weights. Every token needs all 16 GB. At 5.3 TB/s that takes 16 ÷ 5300 seconds, so the best possible speed is about **330 tokens per second**, no matter how many FLOP/s the chip has. The compute alone could do a token in 16 GFLOPs ÷ 1,307 TFLOP/s, about 82,000 tokens per second. The gap between 330 and 82,000 is that factor of roughly 247 again. The chip has the muscle but is waiting for the helper.

**Batching is the fix.** Think of a BEST bus in Mumbai. The bus makes the same trip whether it carries one passenger or sixty-four. In decode, the “trip” is reading the weights. If 64 users are served in the same pass, the weights are read once but used 64 times: intensity jumps from 1 to about 64 and speed jumps 64 times. Keep adding passengers and you move right along the diagonal until you reach the ridge, around 247 users in this idealised model.

**Why prefill is compute-bound and decode is memory-bound.** When you paste a 2,000-word question, the model processes all of those tokens together in one pass. That is a matrix times a matrix, and the weights are reused for every token: intensity roughly the number of tokens, in the hundreds or thousands. So *prefill* sits right of the ridge. Then the answer is produced one token at a time, back to intensity about 1. So *decode* sits on the left.

One more honest caveat. Real decode is a little worse than this: besides the weights, the model also re-reads a growing memory of the conversation (the KV cache) for every user. That adds bytes, so real systems hit the memory wall even earlier than the idealised numbers.

**A bonus: every chip has its own ridge.** The MI300X’s ridge is about 247 FLOP per byte. Its ordinary vector units, with a roof of about 163 TFLOP/s, have a ridge of only about 31. And my little CPU, which we measure in Section 7, has a ridge of about 13. A higher ridge means more chops are needed per byte to keep the chip busy, so it is harder to use. Now imagine doubling a chip’s memory bandwidth without touching its compute: the ridge halves, and every memory-bound job runs twice as fast, without a single extra FLOP. That is why chip makers fight over memory as hard as over calculators.

## 6. Why fusion and FlashAttention help so much

Suppose you run four small steps on a big list: multiply, add, multiply, add. Running them one at a time means, for each step, the helper brings the whole list to the kitchen and takes the whole result back to the mandi. That is four round trips for a tiny amount of cooking. **Fusion** means cooking all four steps in one pass: one trip there, one trip back. The maths is identical. The trips are one quarter.

In roofline language, you did the same FLOPs but moved fewer bytes, so intensity went *up*, and you slide right along the diagonal. FlashAttention uses the same idea for the attention step of a transformer: instead of writing a huge intermediate table out to main memory and reading it back, it keeps pieces of it in the tiny, fast memory next to the compute units. Fewer trips to the mandi, same answer. (I explain the idea; I did not re-derive FlashAttention here.)

## 7. I measured my own roofline

The brief asks: can you measure it? Yes, and I did it twice. First on a small CPU (one core of an Intel Xeon at 2.1 GHz), because the roofline idea is not specific to GPUs: **any** processor has a peak compute and a memory bandwidth. Then I ran the same experiment on a real GPU, a free Colab Tesla T4.

**\[Run\] Your own roofline on any laptop (about 2 minutes).** You need Python 3.9 or newer.

```bash
pip install numpy numba matplotlib
python3 roofline_cpu.py
```

The file `roofline_cpu.py` (shared with this doc) does five things, in this order:

1. **Measures bandwidth** with `c = a + b` on arrays far bigger than the cache.
2. **Measures peak compute** with a big matrix multiply (a highly tuned routine).
3. **Dials the intensity**: for every number it loads, it does *k* multiply-adds in the fast cache, with *k* from 1 to 256, and only one trip to memory. This is the “salad to biryani” knob.
4. **Sweeps matmul size** from 16 × 16 to 2048 × 2048, the experiment suggested in the brief.
5. **Tests fusion**: four operations one at a time versus one fused pass.

The heart of step 3, the “dial”, is just this:

```python
@njit(fastmath=True)
def kernel(x, out, k, tmp):
    for s in range(0, x.shape[0], 2048):          # work on small chunks that live in the fast cache
        for i in range(2048): tmp[i] = x[s + i]   # read each number from memory ONCE
        for _ in range(k):                        # ...then do k multiply-adds on it
            for i in range(2048): tmp[i] = tmp[i] * 1.0000001 + 1e-7
        for i in range(2048): out[s + i] = tmp[i] # write each number back ONCE
```

Bytes moved per number stay fixed at 8. FLOPs per number are 2k. So the intensity is exactly k ÷ 4, and we choose it. **What I measured** (your numbers will differ with your machine, and vary a little from run to run):

| Step | Result |
| --- | --- |
| Memory bandwidth (`c = a + b`) | about **11.7 GB/s** |
| Peak compute (2048 × 2048 matmul) | about **140 to 153 GFLOP/s** |
| This machine’s ridge point | peak ÷ bandwidth, about **13 FLOP per byte** |
| Dial from k = 1 to 256 | speed climbs from **1.4** to about **25 GFLOP/s**, then flattens |
| Matmul N = 16, 32, 64, 256, 2048 | **8**, **41**, **117**, **142**, **150 GFLOP/s** |
| Fusion: 4 operations, one at a time vs fused | about **167 ms vs 46 ms: 3.7 times faster** |

The figure `my_roofline_cpu.png` (shared with this doc) is the plot of exactly this table.

**Three things I did not expect, and what they teach:**

- **A second, lower roof appeared.** My plain loop climbs with intensity and then flattens at about 25 GFLOP/s, six times below the 150 the matrix routine reaches. Both are “compute-bound”, but the ceiling you can reach depends on how well your code uses the special hardware (wide vector units, careful blocking). This is exactly the MI300X story: 1,307 TFLOP/s needs the matrix cores, and ordinary vector code tops out near 163. The original roofline paper calls these lower lines **ceilings**.
- **Tiny matmuls fell off the diagonal for a different reason.** At N = 16 the speed was only 8 GFLOP/s, below even the slope. The data fits in the cache, so memory was not the problem. The time went to the *overhead* of just calling the routine. Roofline explains two of the three possible limits, and overhead is the third one hiding.
- **Fusion predicted 4 times and gave 3.7 times.** Four operations, four round trips versus one, and the clock agreed to within about 10%.

**\[Run\] The same experiment on a real GPU: a free Colab Tesla T4.** Open a Colab notebook, choose *Runtime, Change runtime type, GPU*, paste the file `roofline_gpu_colab.py`, and run it. It measures your GPU’s bandwidth, sweeps half-precision matmul from 64 to 8192, plots the roofline, and times fusion with `torch.compile`. This is exactly what I got:

```
GPU: Tesla T4
memory bandwidth: 247 GB/s   (add intensity 0.083 -> 0.021 TFLOP/s)
N=   64  intensity=   21.3     0.00 TFLOP/s
N=  128  intensity=   42.7     0.17 TFLOP/s
N=  256  intensity=   85.3     1.30 TFLOP/s
N=  512  intensity=  170.7     8.76 TFLOP/s
N= 1024  intensity=  341.3    29.49 TFLOP/s
N= 2048  intensity=  682.7    36.26 TFLOP/s
N= 4096  intensity= 1365.3    23.66 TFLOP/s
N= 8192  intensity= 2730.7    24.67 TFLOP/s

measured peak ~ 36 TFLOP/s | ridge ~ 147 FLOP/byte

fusion: one-at-a-time 8.98 ms vs fused 2.13 ms -> 4.2x (memory traffic predicts ~4x)
```

The script also draws the plot, titled *Tesla T4*: the black roofline, and the matmul points climbing towards it.

**Spec sheet versus reality.** The T4 is a 70-watt inference card. Its published spec sheet lists about 320 GB/s of memory bandwidth and 65 TFLOP/s of half-precision matrix maths. What I measured:

|  | Spec sheet | Measured | Reached |
| --- | --- | --- | --- |
| Memory bandwidth | about 320 GB/s | **247 GB/s** | 77% |
| Peak compute (half-precision matmul) | about 65 TFLOP/s | **36 TFLOP/s** | 56% |
| Ridge point (peak ÷ bandwidth) | about 203 FLOP/byte | **about 147** |  |

The measured ridge is lower than the spec-sheet ridge because the chip got further towards its bandwidth (77%) than towards its compute peak (56%).

**How the matmul sweep sat against the roof.** At each size, the roof is the smaller of 36 TFLOP/s and 0.247 TFLOP/s × intensity:

| N | Intensity | Measured | Roof at that intensity | Share of roof |
| --- | --- | --- | --- | --- |
| 64 | 21 | 0.004 TFLOP/s | 5.3 TFLOP/s | 0.07% |
| 128 | 43 | 0.17 | 10.5 | 1.6% |
| 256 | 85 | 1.30 | 21 | 6% |
| 512 | 171 | 8.76 | 36 | 24% |
| 1024 | 341 | 29.5 | 36 | 81% |
| 2048 | 683 | 36.3 | 36 | 100% (this sets our peak) |
| 4096 | 1,365 | 23.7 | 36 | 65% |
| 8192 | 2,731 | 24.7 | 36 | 68% |

**What the T4 teaches, in four points:**

- **Fusion is the cleanest result.** Four small steps took 8.98 ms one at a time and 2.13 ms fused: **4.2 times faster**, against a prediction of 4. Even better, the two times agree with the bandwidth we measured separately. The one-at-a-time version moves 32 bytes per number and the fused version moves 8, on 67 million numbers. That works out to about **239 GB/s** and **252 GB/s**, both within 5% of the 247 GB/s from the addition test. Both versions were running right on the memory roof. The fused one simply had a quarter of the bytes to move. That is the roofline working as a prediction: time is bytes divided by bandwidth.
- **Small matmuls fell far below the diagonal, for the same reason as on the CPU.** At N = 64 the GPU reached 0.07% of its roof, and even N = 256 reached only 6%. Memory was not the problem. These matrices are too small to keep thousands of GPU cores busy, and the time goes to launching the work. It is the same hidden third limit, overhead, that showed up at N = 16 on the CPU.
- **Being right of the ridge is not the same as being on the roof.** N = 512 is already right of the ridge (171 against 147) but reaches only 24%. The roof is an upper bound, and you get close to it only when the problem is big enough and well shaped for the hardware.
- **The biggest matmuls got slower, from 36 to about 24 TFLOP/s.** I did not expect that, and I did not test the cause. My hypothesis: the T4 is a 70-watt card and slows its clock speed when it works hard for long, and the larger runs are heavier and longer. To check it, repeat N = 2048 for a minute and see whether it drops, or log the GPU’s clock speed and power draw during the run. If I am wrong, that is a better story.

## 8. The whole thing in plain words

1. A chip has two limits: how fast it can calculate, and how fast it can fetch.
2. Arithmetic intensity is how much calculating you do per byte you fetch: chops per kilo.
3. Speed = the smaller of the two: peak compute, or bandwidth times intensity.
4. Below the ridge point (about 247 on an MI300X), you wait on memory. Above it, you use the whole chip.
5. Chatbots type slowly because decoding reads the whole model for a single word. Batching fixes it, like a bus filling up.
6. Fusion and FlashAttention help because they cut trips to memory.
7. I measured all of this on a small CPU and on a real GPU: the picture is the same shape.

## 9. Questions to ask the room

| Ask | One-line answer |
| --- | --- |
| Why can a 1,307 TFLOP/s GPU run an addition at under 1 TFLOP/s? | Adding does 1 operation per 6 bytes fetched, so it waits on memory. |
| What is the ridge point, and what does it mean? | Peak compute divided by bandwidth: the intensity where the cook and helper are equally busy. |
| Why is the memory roof a straight line on log axes? | Speed = B × I, so log speed = log B + log I: a slope-1 line. |
| Why does batching speed up decoding? | Weights are read once but used for many users, so intensity rises. |
| Why is prefill compute-bound but decode memory-bound? | Prefill reuses weights across thousands of tokens; decode uses them for one. |
| Why would a chip with faster memory help a job that is memory-bound? | It moves the memory roof up, so every memory-bound job speeds up. |

## 10. Timing, running the code, references

| Minutes | Section |
| --- | --- |
| 0–4 | The kitchen and the puzzle (Section 1) |
| 4–7 | The two limits (Section 2) |
| 7–10 | Arithmetic intensity (Section 3) |
| 10–15 | Deriving the roofline and Diagram 2 (Section 4) |
| 15–20 | Real examples, decode, batching, prefill (Section 5) |
| 20–23 | Fusion and the experiment (Sections 6 and 7) |
| 23–25 | Recap in plain words (Section 8) |

The three files `roofline_cpu.py`, `roofline_gpu_colab.py` and `my_roofline_cpu.png` are shared in chat with this doc. If a number on your screen differs from this doc, trust the screen and say so.

**What I measured and what I reasoned.** *Measured:* everything in Section 7, on one CPU core and on a Colab Tesla T4. *From spec sheets, cross-checked:* the MI300X peak (1,307 TFLOP/s BF16 matrix, about 163 TFLOP/s for 32-bit vector arithmetic, 5.3 TB/s memory bandwidth), from AMD’s own documentation, and the T4 figures (about 65 TFLOP/s half precision, about 320 GB/s, 70 W). *Reasoned, not measured:* all the MI300X speeds in Section 5, the 330 tokens-per-second figure, and the prefill and decode argument. They are roofline upper bounds, not benchmarks. *Not done:* any run on an MI300X or other data-centre GPU, and finding out why the largest matmuls slowed down on the T4.

**References**

- Williams, Waterman, Patterson, *Roofline: An Insightful Visual Performance Model* (Berkeley tech report EECS-2008-134), the origin of the model and of “ceilings”
- Horace He, *Making Deep Learning Go Brrrr From First Principles* (horace.io/brrr\_intro.html): the same experiment as my dial, and the factory picture
- AMD, MI300 series microarchitecture (ROCm documentation): the source of the MI300X numbers. Other starting points from the brief: the Modal GPU glossary page on the roofline model, and the JAX *Scaling Book* chapter on rooflines
