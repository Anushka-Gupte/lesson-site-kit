"""Measure YOUR OWN roofline, on any laptop CPU. Needs: numpy, numba, matplotlib.  Run: python3 roofline_cpu.py
The roofline idea is not specific to GPUs. Any processor has (1) a peak compute rate and (2) a memory bandwidth."""
import time, numpy as np
from numba import njit
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt

def best_time(fn, repeats=5):
    fn()                                              # warm-up
    ts = []
    for _ in range(repeats):
        t = time.perf_counter(); fn(); ts.append(time.perf_counter() - t)
    return min(ts)

# ---------- 1. THE MEMORY ROOF: how many bytes per second can we move? ----------
N = 2**26                                              # 67 million floats = 268 MB per array (bigger than the cache)
a = np.ones(N, np.float32); b = np.ones(N, np.float32); c = np.empty(N, np.float32)
t = best_time(lambda: np.add(a, b, out=c))
bandwidth = 3 * 4 * N / t                              # read a, read b, write c; 4 bytes each
print(f"1) c = a + b   : {bandwidth/1e9:6.1f} GB/s   (AI = 1 FLOP / 12 bytes = 0.083)  -> achieved {N/t/1e9:.2f} GFLOP/s")

# ---------- 2. THE COMPUTE ROOF: how many FLOPs per second can we do? ----------
M = 2048
A = np.random.rand(M, M).astype(np.float32); B = np.random.rand(M, M).astype(np.float32)
t = best_time(lambda: A @ B, repeats=3)
peak = 2 * M**3 / t
print(f"2) {M}x{M} matmul: {peak/1e9:6.1f} GFLOP/s  (AI = N/6 = {M/6:.0f})")

# ---------- 3. DIAL THE INTENSITY: k multiply-adds on every number we load ----------
@njit(fastmath=True, cache=True)
def kernel(x, out, k, tmp):
    CH = tmp.shape[0]                                  # work on small chunks that live in the fast cache
    for s in range(0, x.shape[0], CH):
        for i in range(CH): tmp[i] = x[s + i]          # read each number from memory ONCE
        for _ in range(k):
            for i in range(CH): tmp[i] = tmp[i] * np.float32(1.0000001) + np.float32(1e-7)
        for i in range(CH): out[s + i] = tmp[i]        # write each number to memory ONCE

x = np.random.rand(N).astype(np.float32); out = np.empty_like(x); tmp = np.empty(2048, np.float32)
kernel(x, out, 1, tmp)                                 # compile
points = []
print("\n3) k multiply-adds per number loaded (bytes moved per number stays 8):")
for k in (1, 2, 4, 8, 16, 32, 64, 128, 256):
    reps = 3 if k <= 64 else 1
    t = best_time(lambda: kernel(x, out, k, tmp), repeats=reps)
    flops, bytes_ = 2 * k * N, 8 * N
    points.append((flops / bytes_, flops / t))
    print(f"   k={k:4d}  intensity={flops/bytes_:7.2f} FLOP/byte   {flops/t/1e9:6.2f} GFLOP/s   {bytes_/t/1e9:6.2f} GB/s")

# ---------- 4. MATMUL AT GROWING SIZES (the experiment the brief suggests) ----------
mm = []
print("\n4) matmul, growing size N (intensity = N/6 for float32):")
for n in (16, 32, 64, 128, 256, 512, 1024, 2048):
    P = np.random.rand(n, n).astype(np.float32); Q = np.random.rand(n, n).astype(np.float32)
    t = best_time(lambda: P @ Q, repeats=5 if n >= 128 else 200)
    mm.append((n / 6, 2 * n**3 / t))
    print(f"   N={n:5d}  intensity={n/6:7.2f}   {2*n**3/t/1e9:7.2f} GFLOP/s")

# ---------- 5. FUSION: three steps, three trips to memory vs one trip ----------
@njit(fastmath=True, cache=True)
def fused(x, out):
    for i in range(x.shape[0]):
        out[i] = ((x[i] * np.float32(1.5) + np.float32(2.0)) * np.float32(0.5) + np.float32(1.0))
fused(x, out)
tmp1 = np.empty_like(x); tmp2 = np.empty_like(x)
def eager():                                           # like running one operation at a time
    np.multiply(x, np.float32(1.5), out=tmp1); np.add(tmp1, np.float32(2.0), out=tmp1)
    np.multiply(tmp1, np.float32(0.5), out=tmp2); np.add(tmp2, np.float32(1.0), out=out)
t_eager = best_time(eager); t_fused = best_time(lambda: fused(x, out))
print(f"\n5) same maths, 4 operations: one-at-a-time {t_eager*1e3:.0f} ms  vs fused {t_fused*1e3:.0f} ms  -> {t_eager/t_fused:.1f}x faster")
print(f"   (memory traffic: one-at-a-time = 4 x (read+write) = 32 bytes/number, fused = 8 bytes/number -> 4x less)")

# ---------- THE PLOT ----------
peak_all = max([peak] + [p for _, p in mm])            # the best we ever reached: the real compute roof
ceiling = max(p for _, p in points)                    # what our plain loop reaches: a lower "ceiling"
xs = np.logspace(-2, 3, 200)
plt.figure(figsize=(8, 5.2))
plt.loglog(xs, np.minimum(peak_all, bandwidth * xs), "k-", lw=2, label=f"roofline: {bandwidth/1e9:.0f} GB/s and {peak_all/1e9:.0f} GFLOP/s")
plt.loglog(xs, np.minimum(ceiling, bandwidth * xs), color="tab:orange", ls="--", label=f"ceiling of a plain loop: {ceiling/1e9:.0f} GFLOP/s")
plt.loglog([p[0] for p in points], [p[1] for p in points], "o-", color="tab:blue", label="k multiply-adds per number")
plt.loglog([p[0] for p in mm], [p[1] for p in mm], "s--", color="tab:green", label="matmul, N = 16 ... 2048")
plt.axvline(peak_all / bandwidth, color="gray", ls=":", label=f"ridge = {peak_all/bandwidth:.0f} FLOP/byte")
plt.xlabel("arithmetic intensity (FLOP per byte moved)"); plt.ylabel("GFLOP/s achieved (log scale)")
plt.gca().yaxis.set_major_formatter(lambda v, _: f"{v/1e9:g}")
plt.grid(True, which="both", alpha=0.3); plt.legend(fontsize=8); plt.title("My own roofline, measured on this CPU")
plt.savefig("my_roofline_cpu.png", dpi=130, bbox_inches="tight"); print("\nsaved my_roofline_cpu.png")
print(f"RIDGE POINT of this machine = peak / bandwidth = {peak_all/1e9:.0f} GFLOP/s / {bandwidth/1e9:.1f} GB/s = {peak_all/bandwidth:.1f} FLOP/byte")
