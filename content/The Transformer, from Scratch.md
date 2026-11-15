# The Transformer, from Scratch

*A 25-minute lesson for total beginners. Script and reference notes combined.*

**How to read this:** it is written the way you would say it aloud, in plain words. Read it once, then talk it through in your own voice instead of reciting it. **\[Draw\]** boxes are the extra sketches for the scaling, the mask and the heads. Each of the nine steps in Section 4 ends with a Step N diagram marker, where you add that step to the board as you explain, so the picture grows with the talk. **\[Run\]** blocks are small bits of code to run live in Colab (numpy only), so the class sees real results instead of numbers you quote. No maths or AI background is assumed. The Under the hood boxes hold the real maths for the moments someone asks “but why?”. Skip them for a lay audience, use them for a technical one.

---

## 1. Start with the keyboard in your pocket

Let me start with something every one of you has done today. You open WhatsApp, type “I’ll reach in about ten”, and before you finish, your phone offers a word. Have you ever wondered how it knew?

That small suggestion is the whole story of today’s talk. ChatGPT, Gemini, Claude, Llama: underneath, each of them does exactly one job.

> **Look at the words so far, and guess the next word.**

That’s all. When one of them writes you a poem, it guesses a word, adds it to the text, and guesses the next one. Answering a question works the same way.

Try it yourself. Finish this sentence in your head: *“In the Mumbai monsoon, local trains are often \_\_\_.”*

Most of you thought “late”. Nobody stopped to think about grammar. You used everything you know about Mumbai, trains and rain. A machine has to do the same, and it does it by giving every possible word a score, something like this (made-up numbers, just to show the idea):

| Next word | Chance |
| --- | --- |
| late | 40% |
| delayed | 25% |
| cancelled | 10% |
| crowded | 8% |
| …thousands of others | the rest |

Now here is what makes it hard. Try this one: *“I grew up in Chennai. I studied in Delhi, worked in Bangalore for ten years, and I have eaten in every city in India. But when I talk to my grandmother, I speak \_\_\_.”*

You said Tamil. The clue, *Chennai*, was twenty words back, with Delhi and Bangalore sitting in between to confuse you. So a machine needs a way to **look back across a long stretch of text and pick out the one clue that matters.**

The rest of this talk is the story of how we taught machines to do that: first badly, then a little better, and then brilliantly. By the end, we will have drawn the whole machine on the board together, and you will be able to explain it to someone else.

## 2. How machines read before 2017

Let’s go back in time. If I asked you to build a machine that reads, where would you start?

The first idea people had was simple: look at the last two or three words, and count what usually came next in a huge pile of text. That is how the early phone keyboards worked. It is fine for “thank you very \_\_\_”. But it is hopeless for our Chennai sentence, because to catch that clue the window would have to be twenty words wide, and the number of possible twenty-word combinations is far too large to store. We needed something that could *carry memory forward* as it reads.

### The RNN: one clerk, one notebook page

That idea is the **Recurrent Neural Network**, or RNN. Don’t let the name scare you. An RNN reads a sentence one word at a time, and it keeps a small notebook, a short list of numbers, that summarises everything read so far. For every new word it does the same three things: read the word, look at the notebook, rewrite the notebook. When the sentence ends, it uses the notebook to guess the next word.

Picture a clerk reading a very long ledger, line by line. He is given only *one* page of notes, and after every line he must rub it out and rewrite it. By line twenty, how much of line one is still on that page?

That is the RNN’s first big problem: **it forgets.** Each rewrite blurs the older notes a little. You know this game: a WhatsApp forward. By the fiftieth person, the message barely resembles the original.

But I don’t want you to take my word for it. Let’s measure it.

**\[Run\] How much does the first word still matter, later on?** Paste this into a Colab cell. It builds a random RNN and measures how much the notebook at step 0 can still influence the notebook at step *t*. Think of 1 as “fully remembered” and a tiny number as “gone”. It is seeded, so you will get the same numbers I did.

```python
import numpy as np

def rnn_memory(spectral_radius, H=64, steps=100, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.standard_normal((H, H)) / np.sqrt(H)
    W *= spectral_radius / np.max(np.abs(np.linalg.eigvals(W)))  # set the largest eigenvalue
    h = rng.standard_normal(H)
    J = np.eye(H)                  # running product of Jacobians dh_t / dh_0
    out = {}
    for t in range(1, steps + 1):
        h = np.tanh(W @ h + 0.1 * rng.standard_normal(H))   # h_t = tanh(W h_(t-1) + input)
        J = (np.diag(1 - h**2) @ W) @ J                      # chain rule, one step further back
        if t in (10, 20, 50, 100):
            out[t] = np.linalg.norm(J, 2)
    return out

for rho in (0.8, 1.0, 1.2):
    print(rho, {t: f'{v:.1e}' for t, v in rnn_memory(rho).items()})
```

You should see this (the first column says how strongly the notebook is rewritten each step):

| Notebook rewrite strength | after 10 words | after 20 | after 50 | after 100 |
| --- | --- | --- | --- | --- |
| 0.8 (fades things) | 1.1e-1 | 9.5e-3 | 6.2e-6 | 2.8e-11 |
| 1.0 (balanced) | 5.6e-1 | 3.2e-1 | 5.2e-2 | 3.2e-3 |
| 1.2 (boosts things) | 1.5 | 1.9 | 2.5 | 1.6 |

How to say it: *“Look at the first row. After a hundred words, the first word’s influence is about 0.00000000003. That is not memory, that is a rumour. Even the balanced setting fades by more than a hundred times. Only when we boost the signal does it survive, and that is a knife-edge: the machine has to be tuned just right, and nothing forces it to stay there.”*

One honest note. This is a random, untrained network, so it shows the *mechanism*, not a benchmark. Researchers found the same trouble in trained networks in the 1990s (Bengio and colleagues, 1994).

There is a second problem, and it is about speed. To read word 100, the RNN must have finished word 99, and before that word 98. You cannot hand different words to different processors. It is a single-lane road: it doesn’t matter that you own a thousand cars.

### The LSTM: a notebook that works like a passbook

In 1997 two researchers, Hochreiter and Schmidhuber, asked a good question: *what if the memory didn’t have to be rewritten at every step?*

Think of your bank passbook. Your balance is not rewritten from scratch every day. Yesterday’s balance carries forward, and only two things happen to it: some money leaves, and some money arrives. And when you ask for a mini-statement, the bank shows only the part you are allowed to see.

An LSTM (long short-term memory) keeps its memory exactly like that. The memory is the balance, and three dials, each between “shut” and “fully open”, control it:

- the **forget dial** decides what fraction of yesterday’s balance survives,
- the **input dial** decides how much of today’s news gets deposited,
- the **output dial** decides how much of the balance to reveal right now.

Where the passbook idea breaks: a real bank doesn’t shrink your balance by a fraction every day, and an LSTM’s dials aren’t fixed rules. It *learns* them from the word it just read, so it decides what is worth keeping based on what is going on.

The clever part is the simple “carry forward and add” structure. Because the memory is mostly carried, not rewritten, the old signal survives much longer. LSTMs powered Google Translate and Siri for years.

But they still read one word at a time, so they were still slow. And in practice, memory still faded after a few hundred words.

### The suitcase problem

There was one more trouble, and it shows up clearly in translation. In 2014, teams at Google and elsewhere built translators like this: one LSTM reads the English sentence and squeezes everything into its final notebook. A second LSTM then writes the Hindi using *only* that notebook.

That is like packing three months of travel into a single cabin bag. For a short trip it works. For a long sentence, things start falling out. Researchers measured it: the longer the sentence, the worse the translation. (A funny hack from that time: reverse the English sentence before feeding it in, so the first words sit closest to where the Hindi starts being written.)

So what would *you* do? Think about it for a moment before the next section.

## 3. The idea of looking back

The fix, when it came, was almost embarrassingly natural. Don’t pack one bag. **Keep all the notes on the table, and let the writer flip back to whichever page matters, at the moment it matters.**

You already know the difference. A closed-book exam forces you to compress everything into your head. An open-book exam lets you look things up, but only if you know *where* to look.

In 2014, Bahdanau, Cho and Bengio gave the translator exactly that. While writing each Hindi word, the machine looks back over *all* the English words and gives each one a score for how useful it is right now. The scores add up to 100%, and the machine takes a blend of the English words, weighted by those scores.

Say it is about to write the Hindi word for “friend” in *“How are you doing today, my friend”*. The scores might look like this:

| How | are | you | doing | today | my | friend |
| --- | --- | --- | --- | --- | --- | --- |
| 2% | 1% | 3% | 2% | 4% | 8% | **80%** |

It looks almost entirely at “friend”, glances at “my”, and ignores the rest. The nice thing is that you can *see* it: researchers could draw these scores as a picture and watch the machine line up English words with their Hindi partners. This idea is called **attention**.

But notice what was still true. Attention was a helper bolted onto the side of an RNN. The slow, one-word-at-a-time reading was still there.

### The 2017 leap

Then a team at Google asked a bold question. If attention can look at *any* word in one jump, why do we need the slow reading at all? Their paper, *“Attention Is All You Need”*, answered: we don’t. **Throw the RNN away. Let every word look at every other word, all at the same time.**

Think of the Indian Railways map. The RNN is a passenger train that must stop at every single station, in order, to get from the first city to the last. Attention is a direct flight between every pair of cities. Each route costs more, as we’ll see, but nothing stops along the way.

That gave two big wins:

- **Distance became one hop.** In our Chennai sentence, the blank at the end can look *straight* at “Chennai”. Nothing sits in between to blur it.
- **Everything runs in parallel.** All the words are processed at once, as big blocks of arithmetic, which is exactly what graphics cards are good at. The base model in the paper trained in about 12 hours on 8 GPUs, far cheaper than earlier systems.

So now we know *what* the 2017 team did. Let’s build the machine, step by step, on the board.

## 4. Building the transformer on the board

Grab a marker, or open a blank slide. We will draw the machine from the bottom up, in nine steps, in the exact order a sentence travels through it, and we will follow one example all the way: *“Local trains are often …”*. It is our sentence from the opening, trimmed to its last four words so the board stays small, and the machine’s job is to guess the next word. Each step ends with a diagram marker (**Step 1 diagram**, **Step 2 diagram** and so on) where you add that step to the board. The token IDs and percentages in the diagrams are made up for illustration.

### Step 1: Start with the text

We have four words and one job: guess the fifth. Everything we are about to draw above this box exists only to make that one guess good. So at the very bottom of the board, draw one box and write our text in it.

**Step 1 diagram**

### Step 2: Chop it into tokens

A computer cannot read “trains”. It only understands numbers. So the first job is to chop the text into pieces called **tokens**. A token is usually a common chunk of a word: “unbelievable” might become *un · believ · able*. Why not whole words? There would be endless words to store (every name, every spelling mistake). Why not single letters? Sentences would become five times longer, and, as we will see, longer text costs a lot. Tokens are the sensible middle.

Each token gets an ID number. But an ID is like a roll number: it tells you nothing about the student. “Roll no. 3797” doesn’t say whether the student is good at maths.

In our example, the four tokens *Local · trains · are · often* get the IDs 8021, 11279, 389 and 1690. (Made up for illustration; a real tokenizer gives different numbers.) On the board, add a box above the input text and write the four IDs in it.

**Step 2 diagram**

### Step 3: Give each token a profile card

So each token also gets a long **profile card**, a list of a few hundred numbers (768 in GPT-2) that describe it. This is called an *embedding*. Think of it as GPS coordinates on a map of meaning. “Chai” and “coffee” land near each other, and “tyre” lands far away. The beautiful part is that nobody writes these coordinates. They start random, and the machine learns them by reading text.

Technically an embedding is just a lookup table: give it the ID, it hands back the card.

In our example, the four IDs fetch four cards, x1 to x4. “Trains” sits near “buses” on the map of meaning, and far from “mangoes”. On the board, add a box above the IDs: four words, each a card of about 768 numbers.

**Step 3 diagram**

### Step 4: Add the seat numbers

Here is a surprise. The machine we are building has no sense of order. It treats a sentence like a bag of words. To it, “Ram loves Sita” and “Sita loves Ram” look identical, and they mean very different things.

The fix is simple: attach a **position tag** to every word, like the seat number on a train ticket. The passenger is the same, and the seat number says where they sit. The original paper made these tags from waves of different speeds. Think of a clock: the second hand moves fast, the minute hand slower, the hour hand slowest. Look at all three hands together and you know the exact time. Look at all the waves together and you know the exact position.

In our example, *Local* gets the tag for seat 1 and *often* the tag for seat 4. We add each tag to its card, and the merged row of four vectors, “what I mean plus where I sit”, is what enters the block. On the board, add the position tags beside the embedding box, and a small plus circle where the two meet.

**Step 4 diagram**

**Under the hood: the position waves.** The original paper builds the tag for position *pos*, using one (sine, cosine) pair per clock hand *i*:

```latex
PE_{(pos,\,2i)}=\sin\!\left(\frac{pos}{10000^{2i/d}}\right),\qquad PE_{(pos,\,2i+1)}=\cos\!\left(\frac{pos}{10000^{2i/d}}\right)
```

Each pair spins at its own speed ω = 1/10000^(2i/d). The first pairs are fast (one lap every 2π ≈ 6 words), and the last are very slow (one lap every ≈ 63,000 words). Two things make this work. First, every position gets a different combination of angles, so positions never collide. Second, **moving k steps is the same rotation everywhere.** From sin(a+b) = sin a cos b + cos a sin b and the matching cosine rule:

```latex
\begin{pmatrix}\sin((pos+k)\omega)\\ \cos((pos+k)\omega)\end{pmatrix}=\begin{pmatrix}\cos k\omega & \sin k\omega\\ -\sin k\omega & \cos k\omega\end{pmatrix}\begin{pmatrix}\sin(pos\,\omega)\\ \cos(pos\,\omega)\end{pmatrix}
```

The matrix depends only on k, not on *pos*. So “the word 3 steps back” is one fixed linear operation, which a network can learn once and reuse at every position. (Modern models use RoPE, which rotates the query and key vectors by these same kinds of angles instead of adding a tag.)

### Step 5: Talk: masked attention, with a bypass

This step adds four things to the board: a layer norm (a tidy-up), the attention box, an add circle above it, and a dashed bypass that goes around both. We will open them one at a time, starting with the star of the show.

**Step 5 diagram**

Now the main event. Imagine walking into Crawford Market with a need. You shout, “something sour, for chutney!” Every stall has a signboard: *raw mangoes*, *tomatoes*, *bananas*. Behind each signboard is the actual stock. You compare your need with each signboard, and then you buy more from the stalls that match best: maybe 70% mangoes, 20% tomatoes, a little of the rest. You walk out with a *blend*.

That is attention. Every word plays three roles at once:

- a **Query**: what am I looking for? (your shout)
- a **Key**: what do I advertise? (the signboard)
- a **Value**: what do I hand over if you pick me? (the stock)

Why separate the signboard from the stock? Because what helps you get *found* need not be what you *give*. A word like “they” can advertise “I am a plural pronoun looking for who I mean”, but what it takes away is the meaning of that thing.

See it in this sentence: *“Meena kept the mangoes in the fridge because they were ripe.”* When the machine reaches “they”, it has to work out who “they” are. The fridge? Meena? The word “they” sends out its query, compares it with the keys of earlier words, and finds the best match is “mangoes”. So it pulls in mostly the *content* of “mangoes”. After this step, the word “they” no longer means just “they”. It carries “the ripe mangoes” inside it. **Every word has absorbed meaning from the words around it.**

Now back to our board sentence. The word *often* is the one we care about. It sends out its question and looks back at *Local*, *trains* and *are*. It finds that *trains* is what the sentence is about and *Local* is which kind of train, and it takes a weighted blend of what they hold.

The whole recipe, in words: *score my question against every earlier label; turn the scores into percentages that add to 100; take that percentage-weighted blend of the contents.* For the curious, this is exactly how the paper writes it. Each symbol is something we just did in words:

```latex
\text{Attention}(Q,K,V)=\text{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
```

**\[Run\]** Don’t trust board arithmetic. Here is “they” choosing among three earlier words, with made-up two-number labels. Paste and run:

```python
import numpy as np
softmax = lambda x: np.exp(x - x.max()) / np.exp(x - x.max()).sum()
q = np.array([1.0, 1.0])                          # the question asked by "they"
K = np.array([[0, 0.2], [2, 1], [0.5, 0.5]])      # labels of: kept, mangoes, fridge
V = np.array([[1, 0], [0, 2], [1, 1]])            # contents of: kept, mangoes, fridge
w = softmax(K @ q / np.sqrt(2))
print(w.round(2), (w @ V).round(2))               # -> [0.1 0.72 0.18] [0.28 1.62]
```

Read the output as: *kept 10%, mangoes 72%, fridge 18%*, and the blended result leans heavily towards the “mangoes” content.

**Under the hood: the formula with its shapes.** Stack the n word-vectors into a table X with n rows and d columns. Three learned matrices turn it into queries, keys and values:

```latex
Q=XW_Q,\quad K=XW_K,\quad V=XW_V\qquad (W_Q,W_K\in\mathbb{R}^{d\times d_k},\;W_V\in\mathbb{R}^{d\times d_v})
```

Then, entry by entry:

```latex
S_{ij}=\frac{q_i\cdot k_j}{\sqrt{d_k}},\qquad A_{ij}=\frac{e^{S_{ij}}}{\sum_{m}e^{S_{im}}},\qquad o_i=\sum_{j}A_{ij}\,v_j
```

S is an n × n table: row i says how much word i likes each word j. The softmax turns each row into percentages (all positive, summing to 1). The output o\_i is literally a weighted average of the value vectors. That n × n table is where the *n²* cost comes from.

#### Two small details that have ordinary reasons

**Detail one: why shrink the scores?** In the formula you saw a square root of d\_k. Here is the plain reason. A score is made by multiplying and adding up a few hundred small numbers. The more numbers you add, the bigger and wilder the total gets: think of adding marks across 4 subjects versus across 100 subjects. Wild scores turn into extreme percentages: one word gets 99% and everyone else gets 0%. That makes the machine stubborn, and worse, learning stops, because when the answer is already 99/0, nudging anything changes almost nothing. So we divide the scores by a number that cancels the growth. (For the curious: adding d independent numbers of spread 1 gives a spread of √d, so dividing by √d puts the spread back to 1.)

**\[Run\]** Let’s check that claim instead of trusting it. This tries 10 random words, 2,000 times, for different label sizes d, with and without the shrinking:

```python
import numpy as np
softmax = lambda x: np.exp(x - x.max()) / np.exp(x - x.max()).sum()
jac = lambda p: np.linalg.norm(np.diag(p) - np.outer(p, p))   # how much learning signal is left
rng = np.random.default_rng(0)

for d in (4, 16, 64, 256, 1024):
    std, mu, ms, gu, gs = [], [], [], [], []
    for _ in range(2000):
        q, K = rng.standard_normal(d), rng.standard_normal((10, d))   # 10 random keys
        s = K @ q
        pu, ps = softmax(s), softmax(s / np.sqrt(d))                  # unscaled vs scaled
        std.append(s.std()); mu.append(pu.max()); ms.append(ps.max())
        gu.append(jac(pu)); gs.append(jac(ps))
    print(d, *[round(float(np.mean(v)), 3) for v in (std, mu, ms, gu, gs)])
```

| Label size d | Spread of scores | Biggest share one word grabs, without shrinking | …with shrinking | Learning signal, without | …with |
| --- | --- | --- | --- | --- | --- |
| 4 | 1.73 | 49% | 31% | 0.34 | 0.34 |
| 16 | 3.64 | 73% | 32% | 0.26 | 0.35 |
| 64 | 7.33 | 87% | 32% | 0.16 | 0.35 |
| 256 | 14.7 | 93% | 32% | 0.09 | 0.35 |
| 1024 | 29.7 | **97%** | 32% | **0.05** | 0.35 |

How to say it: *“Watch the last rows. Without shrinking, one word grabs 97% of the attention on pure random noise, and the learning signal drops by a factor of seven. With shrinking, it stays calm and healthy no matter how big d gets. That’s all the square root is: a calming dial.”*

**Under the hood: why exactly √d\_k.** Assume (as the paper does) that the numbers in a query q and a key k are independent, with average 0 and variance 1. A score is a sum of d\_k products:

```latex
q\cdot k=\sum_{i=1}^{d_k}q_ik_i,\qquad \mathbb{E}[q_ik_i]=0,\qquad \mathrm{Var}(q_ik_i)=\mathbb{E}[q_i^2]\,\mathbb{E}[k_i^2]=1
```

Variances of independent terms add, so:

```latex
\mathrm{Var}(q\cdot k)=d_k\;\Rightarrow\;\mathrm{std}(q\cdot k)=\sqrt{d_k},\qquad \mathrm{Var}\!\left(\frac{q\cdot k}{\sqrt{d_k}}\right)=\frac{d_k}{d_k}=1
```

The “Spread of scores” column in our table is this prediction, measured. It sits close to √d\_k (about 7 to 13% under, because each spread is measured over only 10 keys). Now why big scores hurt. For percentages p = softmax(s), the slope of each percentage with respect to each score is:

```latex
\frac{\partial p_i}{\partial s_j}=p_i\,(\delta_{ij}-p_j)
```

If one score leads by 20, then p ≈ 1 − 2·10⁻⁸ for the leader and almost 0 for the rest. Then p\_i(1 − p\_i) ≈ 0 and p\_j ≈ 0, so *every* slope is about zero. The gradient that carries the learning signal back through the softmax vanishes, which is the same disease the RNN had. Dividing by √d\_k keeps the scores at spread 1, where the softmax is soft and its slopes are healthy.

**\[Draw\]** Write this inside the attention box and circle the dividing part: *scores ÷ √d*.

**Detail two: why block the future?** Our machine is trained by hiding the next word and asking it to guess. If the word “late” is allowed to look at itself while we ask it to predict “late”, it simply copies. That is not predicting, that is reading. Think of a cricket commentator guessing the next ball while the scorecard of the *future* sits on his screen.

So we put up a screen. While scoring, every word is only allowed to look at the words *before* it. The way to do that is to set the future scores to “minus infinity”, which turns into 0% after the percentages step.

There is a lovely side effect. Because of the screen, one sentence of 10 words gives 10 practice questions at once (“Local” → “trains”, “Local trains” → “are”, and so on), all in a single pass. The old RNN needed 10 sequential steps for the same lesson. This is a big reason transformers train fast.

**\[Run\]** See the screen working. Look for zeros above the diagonal, and rows that still add up to 1:

```python
import numpy as np
softmax = lambda x: np.exp(x - x.max()) / np.exp(x - x.max()).sum()
n = 5
S = np.random.default_rng(1).standard_normal((n, n))   # random attention scores
S[np.triu_indices(n, k=1)] = -np.inf                    # future positions -> minus infinity
W = np.array([softmax(row) for row in S])
print(W.round(2)); print(W.sum(axis=1))                 # lower-triangular, every row sums to 1
```

**\[Draw\]** A small grid beside the attention box, with the upper triangle shaded out:

```
■ □ □ □          ■ = may look back
■ ■ □ □          □ = blocked (the future)
■ ■ ■ □
■ ■ ■ ■
```

**Under the hood: the mask, exactly.** Add a matrix M to the scores before the softmax, where M has 0 for allowed places and −∞ for the future:

```latex
A=\mathrm{softmax}(S+M),\qquad M_{ij}=\begin{cases}0 & j\le i\\ -\infty & j>i\end{cases}
```

Since e^(−∞) = 0, the forbidden entries vanish from the sum in the denominator, and the allowed ones renormalise on their own:

```latex
A_{ij}=\frac{e^{S_{ij}}}{\sum_{m\le i}e^{S_{im}}}\ \ (j\le i),\qquad A_{ij}=0\ \ (j>i)
```

Why −∞ before the softmax, and not zeroing the weights afterwards? Because zeroing afterwards leaves rows that no longer sum to 1, so you would have to renormalise anyway. The −∞ does both jobs in one step. Why it matters for training: the loss adds up one guess per position,

```latex
\mathcal{L}=-\sum_{i=1}^{n-1}\log p\,(w_{i+1}\mid w_1,\dots,w_i)
```

The mask is applied in *every* layer, so information only ever flows from earlier positions to later ones. That guarantees the output at position i depends only on w₁ … w\_i, which makes all n terms of the loss valid at once, in one parallel pass. Remove the mask and position i could read w\_(i+1) and drive that term of the loss to zero by copying.

#### Not one pair of eyes, but many

One attention box gives each word one blend. But a word usually needs several different kinds of help at once. Back to *“…because they were ripe”*: “they” needs to know who it refers to (the mangoes), what verb form fits (“were”, plural), and what is being said about it (“ripe”).

Think of an IPL broadcast. One commentator can’t cover everything, so there is a panel: a bowling analyst, a batting expert, a pitch reporter. They all watch the same ball, but each notices something different. Then the anchor stitches their views together.

Transformers do exactly this. Instead of one big attention box, we use a dozen small ones side by side, called **heads**. Each head learns its own way of looking. The results are glued together and mixed by one more step. And it costs no extra work, because each head is smaller. (Researchers have found some heads that track the previous word, some that copy a phrase seen earlier, some that follow grammar. An honest caution: many heads look redundant, and the neat stories are true only for some.)

**\[Draw\]** Erase your single attention box and redraw it as several side-by-side boxes:

```
[ head 1 ]  [ head 2 ]  [ head 3 ]  ...  [ head 12 ]     each looks in its own way
     └──────────┴───────────┴────────────────┘
                    glue together and mix
```

**Under the hood: many heads, exactly.** With h heads, each head works in a smaller space of size d/h:

```latex
\mathrm{head}_j=\mathrm{softmax}\!\left(\frac{XW_Q^{j}\,(XW_K^{j})^{\top}}{\sqrt{d_k}}\right)XW_V^{j},\qquad d_k=d_v=\frac{d}{h}
```

```latex
\mathrm{MultiHead}(X)=\mathrm{Concat}(\mathrm{head}_1,\dots,\mathrm{head}_h)\,W_O,\qquad W_O\in\mathbb{R}^{d\times d}
```

Cost check: the parameters are 3·h·d·(d/h) + d² = 4d² for *any* h, and the score arithmetic is h·n²·(d/h) = n²·d for any h. So heads are free. The real question is why they help. Three reasons:

- **One head means one blend.** A head gives each word one row of weights that sums to 1. If “they” needs the noun “mangoes” far back *and* the verb right next to it, one softmax has to split its 100% between them, then average two different contents into one blurred vector. Separate heads can each put nearly 100% on a different place.
- **Each head has its own idea of “match”.** The match score between words i and j in head m is x\_i · W\_Q^m (W\_K^m)ᵀ · x\_j, a separate learned similarity. One head only gets one.
- **But there is a price.** Each head’s space is only d/h wide, so too many heads make each one too thin. The paper’s own ablation reports that a single head was about one BLEU point worse than 8 to 16 heads, and that 32 heads dipped slightly again. So the number is a tuned compromise, not “more is better”.

#### Keep the original, and keep the numbers tidy

Now look again at what surrounds the attention box on your board: a layer norm below it, and a dashed line that goes around it into the plus circle above it. These are two small tricks that make deep stacks possible.

**Trick one: never rewrite, only add corrections.** Picture a teacher marking your answer sheet. She does not throw it away and write a fresh answer. She adds corrections in red pen on top of your original. The dashed bypass does exactly that: whatever came in is carried around the box, and the box’s output is *added* on top. Nothing is ever fully overwritten.

**Trick two: keep the scale fair.** After many additions, numbers can drift to very large or very small. So before each box, we rescale each word’s numbers to a standard range. This is called *normalisation*. It is like converting marks from CBSE, ICSE and a state board onto a common scale before comparing students. Same students, fair ruler. (The maths for both tricks is in the box under Step 7.)

### Step 6: Think alone: the MLP, with a second bypass

On the board, add a second layer norm, the MLP box and a second add circle with its own bypass, in the same pattern as before.

**Step 6 diagram**

Attention is a group discussion: words exchange information. But after the discussion, each word needs time to *digest* what it heard. So above the attention box, every word goes through a small private thinking step, called the **MLP**. Each word is processed on its own. There is no talking between words here.

Think of a study group: the discussion is attention, and each student going home to think it over alone is the MLP.

Inside, it first spreads the word’s numbers out into a wider layer, four times as wide, then squeezes them back. The wide middle gives room to work out many small features, and a bend in the middle (a non-linear step) lets it do more than draw straight lines. Researchers suspect this is where a lot of the machine’s *facts* are stored, things like “the capital of France is Paris”. About two thirds of all the numbers in the model live in these thinking steps.

On our board, *often* has just heard from the attention step that the subject is local trains. Now, alone, it processes that. The second bypass adds the original back again, exactly like the first, and that completes one block.

**Under the hood: the thinking step.**

```latex
\mathrm{MLP}(x)=W_2\,\mathrm{GELU}(W_1x+b_1)+b_2,\qquad W_1\in\mathbb{R}^{4d\times d},\;W_2\in\mathbb{R}^{d\times 4d}
```

Without the bend (GELU), W₂(W₁x) = (W₂W₁)x is just one matrix, so any number of stacked linear layers collapse into a single straight-line map. The bend is what gives depth its power. Counting numbers: attention holds 4d² (W\_Q, W\_K, W\_V, W\_O) and the MLP holds 8d², so a block has 12d², two thirds of it in the MLP. For GPT-2 small (d = 768, 12 blocks): 12 × 12 × 768² ≈ 85 million, plus the word table 50,257 × 768 ≈ 39 million, giving about 124 million in total.

### Step 7: Repeat the block N times

Draw a dashed frame around everything we just built (both layer norms, attention, the MLP and both bypasses) and write **× N** next to it. It means: stack this whole block again and again, each copy with its own learned numbers. N is 12 in the small GPT-2 and around a hundred in very big models.

After the first block, the word *often* has absorbed a little context. After the second, it can build on that, and so on. Early layers tend to pick up simpler patterns and later layers more abstract ones (that is what researchers believe, not something we can guarantee).

This is where the red pen earns its place. In a hundred-layer stack, a message has a long way to travel. With the bypass, the message has an express lane all the way up, and so does the learning signal coming back down. If this sounds familiar, it is the same idea as the passbook: carry forward and add. A nice way to picture it: the vector is a shared whiteboard, and every attention box and thinking step reads from it and writes small additions onto it.

**Step 7 diagram**

**Under the hood: why the red pen helps, and what “tidy” does.** A residual layer computes y = x + F(x). Its slope with respect to x is:

```latex
\frac{\partial y}{\partial x}=I+\frac{\partial F}{\partial x}
```

Stack L layers and the slope from the top back to the bottom becomes a product:

```latex
\frac{\partial x_L}{\partial x_0}=\prod_{l=1}^{L}\bigl(I+J_l\bigr)=I+\sum_l J_l+\cdots
```

That expanded form always contains the identity I, an express lane that does not shrink however deep the stack. Without residuals the slope is the bare product ΠJ\_l, and if each J\_l is a little smaller than 1, it dies exactly like the RNN table we ran. Layer normalisation then rescales each word’s vector to average 0 and spread 1, with two learned dials γ and β:

```latex
\mu=\frac1d\sum_i x_i,\quad \sigma^2=\frac1d\sum_i(x_i-\mu)^2,\qquad \mathrm{LN}(x)=\gamma\odot\frac{x-\mu}{\sqrt{\sigma^2+\varepsilon}}+\beta
```

The “tidy before each box” layout is called pre-norm: x\_(l+1) = x\_l + F(LN(x\_l)). It is used because it trains more stably than tidying after the addition.

### Step 8: Turn the last word into scores

After the last block we take only the vector of the final word, *often*. Because of the mask, it is the one word that has been allowed to look back at the whole sentence, so it is the right place to guess what comes next. One last tidy (the final layer norm), then a linear step gives every word in the vocabulary a score, about 50,000 scores in all.

**Step 8 diagram**

### Step 9: Scores become probabilities

Softmax turns those scores into percentages that add up to 100. For our board sentence it might look like this (the same illustrative table as in the opening, where the monsoon was part of the sentence):

```
late 40%   delayed 25%   cancelled 10%   crowded 8%   ...   (adds up to 100%)
```

**Step 9 diagram**

**How does it learn?** We show it a huge amount of text with the next word hidden. It guesses, and we compare with the real word. If it gave the true word 40%, that is a small penalty. If it gave it 1%, that is a big penalty. Then every number in the machine gets nudged by a tiny amount in the direction that would have helped. Repeat this trillions of times, and the guesses get good.

**How does it write?** It picks a word from the percentages (a dial called *temperature* makes it bolder or safer), adds that word to the text, and does the whole thing again. That loop is ChatGPT.

**Under the hood: from vector to word, and how it learns.** Multiply the last word’s final vector by the word table (the same one used at the start, flipped), then soften with a temperature T:

```latex
z=h_{\text{last}}E^{\top}\in\mathbb{R}^{V},\qquad p_i=\frac{e^{z_i/T}}{\sum_j e^{z_j/T}}
```

If the true next word is y, the penalty is the cross-entropy, and its slope with respect to the scores is wonderfully simple (at T = 1):

```latex
\mathcal{L}=-\log p_y,\qquad \frac{\partial\mathcal{L}}{\partial z_i}=p_i-\mathbb{1}[i=y]
```

So the push on each word’s score is “what you said minus what was true”. If the model gave the true word 40%, the penalty is −ln 0.40 ≈ 0.92. If it gave 1%, the penalty is −ln 0.01 ≈ 4.6, and the push on that word’s score is about −0.99, a strong shove upward. If it was already right at 99%, the push is nearly zero. That one formula, repeated over trillions of words, is the whole of training.

Now step back from the board. You drew it a piece at a time, and every piece exists because the previous design had a problem. Say the machine picks *late*. The text becomes **“Local trains are often late”**, five words, and the whole machine runs again from the bottom to guess word six. That loop, repeated, is how a long answer gets written.

## 5. The whole thing in plain words

If someone asks you at dinner, “so what actually *is* a transformer?”, here is the answer you can give without a board:

1. It chops text into pieces and gives each piece a card of numbers that stands for its meaning.
2. It stamps each card with its position, because otherwise it wouldn’t know the order.
3. Then it lets the words **talk to each other**. Every word looks back at the earlier words, decides which ones matter, and absorbs some of their meaning. That is attention.
4. Then each word **thinks alone** for a moment. That is the MLP.
5. It repeats steps 3 and 4 many times, always *adding* to what is already there instead of overwriting it.
6. At the top, it turns the last word’s card into a percentage for every possible next word.
7. It learned all of this by guessing hidden next words, trillions of times, and being nudged each time it was wrong.

Nothing in there is magic. It is a talking step, a thinking step, and a habit of keeping the original, stacked many times and trained on a lot of text.

### The honest costs

Attention is wonderful, but it is not free. Every word looks at every earlier word. Imagine a wedding with 100 guests where everyone must greet everyone else: that is roughly 5,000 greetings. Double the guests to 200 and it is not twice the greetings, it is four times. So when text gets twice as long, attention costs about four times as much. A lot of today’s research (FlashAttention, sparse attention, newer designs like Mamba) is about softening that cost. The 2017 design has survived remarkably well, with small upgrades.

And one more honest point: the machine does not “understand” the way you do. It is extremely good at predicting what words come next, and it turns out that to do that well on enough text, it has to pick up a surprising amount about the world. How far that goes is an open and interesting debate.

That is the story: a clerk with one notebook page, a passbook that carries memory forward, an open-book exam, and finally a market where every word shops for context from every other word.

## 6. Questions to ask the room

Ask them out loud, wait, and then use the one-line answer to close the loop.

| Ask | One-line answer |
| --- | --- |
| Why can’t an RNN use a thousand processors on one sentence? | Word 100 needs word 99 first, so the work is a single-lane road. |
| Without position tags, how would “Ram loves Sita” differ from “Sita loves Ram”? | It wouldn’t: attention alone sees a bag of words. |
| Why keep the signboard (key) separate from the stock (value)? | What helps you get found isn’t always what you should hand over. |
| What goes wrong if the scores get too big? | One word grabs nearly 100% and learning almost stops. |
| Why must the machine not see future words in training? | Otherwise it just copies the answer instead of predicting it. |
| If the text doubles in length, how much more attention work? | About four times as much. |
| Why is “add a correction” easier than “rewrite from scratch” in a very deep stack? | The original has an express lane through every layer, so nothing gets lost. |

## 7. Timing, running the code, references

**A comfortable 25 minutes**

| Minutes | What you cover |
| --- | --- |
| 0–2 | The keyboard, the Chennai sentence (Section 1) |
| 2–9 | RNN, the RNN experiment, LSTM passbook, the suitcase problem (Section 2) |
| 9–11 | Looking back: attention and the 2017 leap (Section 3) |
| 11–14 | Steps 1 to 4: the text, tokens, profile cards, seat numbers |
| 14–20 | Step 5: attention, the shrink, the mask, many heads, the bypass |
| 20–23 | Steps 6 to 8: thinking alone, repeating the block, the last word’s scores |
| 23–25 | Step 9 and Section 5: probabilities, learning, the plain-words recap |

**Running the code.** Every **\[Run\]** block above is complete on its own, so you can paste each into a separate Colab cell and run it at the moment you reach it in the talk. All four experiments are also bundled in one file, `transformer_lesson_experiments.py`, shared in chat with this doc:

```bash
pip install numpy
python transformer_lesson_experiments.py
```

If a number on screen differs from the table in this doc, trust the screen and tell the class. A real, slightly different result is a better lesson than a perfect one.

**Where this came from**

- Vaswani et al., *Attention Is All You Need* (2017). arxiv.org/abs/1706.03762
- Bahdanau, Cho, Bengio, *Neural Machine Translation by Jointly Learning to Align and Translate* (2014)
- Sutskever, Vinyals, Le, *Sequence to Sequence Learning with Neural Networks* (2014)
- Cho et al., *On the Properties of Neural Machine Translation: Encoder-Decoder Approaches* (2014)
- Hochreiter and Schmidhuber, *Long Short-Term Memory* (1997)
- Bengio, Simard, Frasconi, *Learning Long-Term Dependencies with Gradient Descent is Difficult* (1994)
- Geva et al., *Transformer Feed-Forward Layers Are Key-Value Memories* (2021)
- Elhage et al., *A Mathematical Framework for Transformer Circuits* (Anthropic, 2021)
- Jay Alammar, *The Illustrated Transformer*; Harvard NLP, *The Annotated Transformer*; Lilian Weng, *The Transformer Family v2*; Andrej Karpathy, *nanoGPT* and his “Let’s build GPT” video
