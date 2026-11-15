"""Measure your own GPU roofline on a free Colab GPU.  Runtime > Change runtime type > GPU, then paste into a cell.
NOTE: I wrote this to mirror roofline_cpu.py, which I ran. I had no GPU where I wrote it, so THIS file is untested on a GPU.
If something errors, the likely suspects are the sizes (reduce N for a small GPU) or torch.compile (the fusion test is optional)."""
import torch, matplotlib.pyplot as plt, numpy as np
assert torch.cuda.is_available(), "No GPU found: Runtime > Change runtime type > GPU"
dev = "cuda"; print("GPU:", torch.cuda.get_device_name(0))

def bench(fn, iters=20):                       # GPU work is asynchronous, so time it with CUDA events
    for _ in range(3): fn()
    torch.cuda.synchronize()
    s, e = torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True)
    s.record()
    for _ in range(iters): fn()
    e.record(); torch.cuda.synchronize()
    return s.elapsed_time(e) / 1e3 / iters     # seconds per call

# 1. MEMORY ROOF: c = a + b on huge arrays (1 FLOP per 12 bytes: pure memory traffic)
N = 2**27                                      # 134M floats = 0.5 GB per array
a = torch.ones(N, device=dev); b = torch.ones(N, device=dev); c = torch.empty_like(a)
t = bench(lambda: torch.add(a, b, out=c))
bandwidth = 3 * 4 * N / t
print(f"memory bandwidth: {bandwidth/1e9:.0f} GB/s   (add intensity 0.083 -> {N/t/1e12:.3f} TFLOP/s)")
del a, b, c

# 2. COMPUTE ROOF + the matmul sweep (half precision uses the tensor cores)
pts = []
for n in (64, 128, 256, 512, 1024, 2048, 4096, 8192):
    A = torch.randn(n, n, device=dev, dtype=torch.float16); B = torch.randn(n, n, device=dev, dtype=torch.float16)
    t = bench(lambda: A @ B, iters=50 if n < 4096 else 10)
    ai = 2 * n**3 / (3 * n * n * 2)            # FLOPs / bytes, 2 bytes per number = n/3
    pts.append((ai, 2 * n**3 / t)); print(f"N={n:5d}  intensity={ai:7.1f}  {2*n**3/t/1e12:7.2f} TFLOP/s")
peak = max(p for _, p in pts)
print(f"\nmeasured peak ~ {peak/1e12:.0f} TFLOP/s | ridge ~ {peak/bandwidth:.0f} FLOP/byte")

# 3. THE PLOT
xs = np.logspace(-2, 4, 200)
plt.figure(figsize=(8, 5))
plt.loglog(xs, np.minimum(peak, bandwidth * xs), "k-", lw=2, label="roofline (measured)")
plt.loglog(*zip(*pts), "s--", label="fp16 matmul, N = 64 ... 8192")
plt.axvline(peak / bandwidth, color="gray", ls=":", label="ridge")
plt.xlabel("arithmetic intensity (FLOP/byte)"); plt.ylabel("FLOP/s"); plt.legend(); plt.grid(True, which="both", alpha=.3)
plt.title(torch.cuda.get_device_name(0)); plt.show()

# 4. FUSION (optional): four tiny operations, one-at-a-time vs fused into one pass by torch.compile
x = torch.randn(2**26, device=dev)
f = lambda x: ((x * 1.5 + 2.0) * 0.5 + 1.0)
try:
    fc = torch.compile(f)
    t1, t2 = bench(lambda: f(x)), bench(lambda: fc(x))
    print(f"\nfusion: one-at-a-time {t1*1e3:.2f} ms vs fused {t2*1e3:.2f} ms -> {t1/t2:.1f}x (memory traffic predicts ~4x)")
except Exception as err:
    print("torch.compile not available here, skipping the fusion test:", err)
