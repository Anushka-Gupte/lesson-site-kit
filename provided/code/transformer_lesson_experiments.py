"""
Experiments for the lesson "The Transformer, from Scratch".
Run:  pip install numpy  &&  python transformer_lesson_experiments.py
Every number quoted in the lesson comes from this file (seeded, so you get the same output).
"""
import numpy as np

def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()

# ---------------------------------------------------------------
# EXPERIMENT 1 (Section 1.2): does an RNN forget?
# We build a random RNN, and measure how much the hidden state at
# step t still "feels" the hidden state at step 0.
# That sensitivity is the norm of the product of Jacobians dh_t/dh_0.
# ---------------------------------------------------------------
def rnn_memory(spectral_radius, H=64, steps=100, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.standard_normal((H, H)) / np.sqrt(H)
    W *= spectral_radius / np.max(np.abs(np.linalg.eigvals(W)))   # set largest eigenvalue
    h = rng.standard_normal(H)
    J = np.eye(H)                                  # running product of Jacobians
    out = {}
    for t in range(1, steps + 1):
        h = np.tanh(W @ h + 0.1 * rng.standard_normal(H))   # h_t = tanh(W h_{t-1} + noise-as-input)
        J = (np.diag(1 - h**2) @ W) @ J            # d h_t / d h_{t-1} = diag(1-h^2) W
        if t in (10, 20, 50, 100):
            out[t] = np.linalg.norm(J, 2)          # biggest amount any change at step 0 can be amplified
    return out

print("EXPERIMENT 1: influence of step 0 on step t (RNN, 64 hidden units)")
print(f"{'largest eigenvalue':>20} | " + " | ".join(f"t={t:<3}" .rjust(9) for t in (10, 20, 50, 100)))
for rho in (0.8, 1.0, 1.2):
    r = rnn_memory(rho)
    print(f"{rho:>20} | " + " | ".join(f"{r[t]:9.1e}" for t in (10, 20, 50, 100)))

# ---------------------------------------------------------------
# EXPERIMENT 2 (Section 3.5): why divide by sqrt(d_k)?
# Random queries/keys with mean 0, variance 1. 10 keys. 2000 trials.
# ---------------------------------------------------------------
print("\nEXPERIMENT 2: attention scaling")
print(f"{'d_k':>5} {'std(q.k)':>9} {'maxw unscaled':>14} {'maxw scaled':>12} {'grad unscaled':>14} {'grad scaled':>12}")
rng = np.random.default_rng(0)
def jac_norm(p):                       # softmax Jacobian = diag(p) - p p^T
    return np.linalg.norm(np.diag(p) - np.outer(p, p))
for d in (4, 16, 64, 256, 1024):
    std, mu, ms, gu, gs = [], [], [], [], []
    for _ in range(2000):
        q, K = rng.standard_normal(d), rng.standard_normal((10, d))
        s = K @ q
        pu, ps = softmax(s), softmax(s / np.sqrt(d))
        std.append(s.std()); mu.append(pu.max()); ms.append(ps.max())
        gu.append(jac_norm(pu)); gs.append(jac_norm(ps))
    print(f"{d:5d} {np.mean(std):9.2f} {np.mean(mu):14.3f} {np.mean(ms):12.3f} {np.mean(gu):14.3f} {np.mean(gs):12.3f}")

# ---------------------------------------------------------------
# EXPERIMENT 3 (Section 3.4): check the hand-worked attention example
# ---------------------------------------------------------------
print("\nEXPERIMENT 3: worked example (token 'it' attends to The, cat, sat)")
q = np.array([1.0, 1.0])
K = np.array([[0, 0.2], [2, 1], [0.5, 0.5]])
V = np.array([[1, 0], [0, 2], [1, 1]])
scores = K @ q
w = softmax(scores / np.sqrt(2))
print("scores :", scores)
print("weights:", w.round(2), " (sum =", w.sum().round(3), ")")
print("output :", (w @ V).round(2))

# ---------------------------------------------------------------
# EXPERIMENT 4 (Section 3.6): the causal mask
# ---------------------------------------------------------------
print("\nEXPERIMENT 4: causal mask on random scores, 5 tokens")
n = 5
S = np.random.default_rng(1).standard_normal((n, n))
S[np.triu_indices(n, k=1)] = -np.inf               # future positions -> -inf
W = np.array([softmax(row) for row in S])
print(W.round(2))
print("row sums:", W.sum(axis=1).round(2))
