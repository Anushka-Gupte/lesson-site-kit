# What Is a Harness? Pi vs Hermes

*A 25-minute lesson for total beginners. Script and reference notes combined.*

**How to read this:** it is written the way you would say it aloud. **\[Run\]** blocks are real code you run live (no API key needed). **Diagram** lines mark where you add a drawing to the board, one step at a time. Everything marked *measured* I ran myself on 13 November 2026, with Pi 1.5.2 and Hermes Agent 0.19.0. Both projects move fast, so re-run before you quote a number.

---

## 1. The brilliant person behind the glass

Start with a picture. Imagine the cleverest engineer you know, locked inside a glass room with a notepad. You can slide notes under the door, and they slide notes back. They are brilliant. But they cannot see your computer, cannot open a single file, cannot run anything, and the moment you walk away they forget you ever came.

That is a language model on its own. Text goes in, text comes out. Nothing else.

Now say to it: *“Fix the bug in my project.”* What would that take? Three things the glass room cannot give. **Hands**, to open files, edit them and run the tests. **A memory**, to know what you did yesterday. And **brakes**, somebody to say “no, not that command.”

All the software that gives the model hands, memory and brakes is called the **harness**. Today we will see what a harness is, build a complete one in 60 lines, and then compare two real ones: **Pi** and **Hermes**.

## 2. From zero: an engine is not a motorcycle

A Royal Enfield engine lying on a workshop table cannot take you to Leh. It needs a frame, handlebars, brakes, a dashboard and a service book. The engine is the model. Everything else is the harness. Engine plus harness is a vehicle you can actually ride.

| Part of the bike | What it does | In the harness |
| --- | --- | --- |
| Handlebars | Lets you act on the road | **Tools**: read a file, edit, run a command, search the web |
| Dashboard | Shows what is happening now | **Context**: everything the model can see this moment |
| Brakes | Stop you doing something dangerous | **Permissions and sandbox** |
| Service book | Remembers history | **Memory and saved sessions** |
| The engine cycle | Repeats again and again | **The loop**: ask, do, look, repeat (next section) |

**Diagram 1, step 1:** draw a box for the engine and label it *Model*. **Step 2:** add the handlebars, *Tools*. **Step 3:** add the dashboard, *Context*. **Step 4:** add the brakes, *Permissions*. **Step 5:** add the service book, *Memory*, then draw one frame around everything and write *Harness*.

Here is the point to land: **swap the harness and the same model behaves like a different product.** Claude Code, Codex, Pi and Hermes are different harnesses, and many of them can use the very same models.

## 3. The loop: build a harness yourself

How does a harness actually work? Think of a mechanic fixing a scooter. He looks, tries something, sees what happened, and decides the next move. He does not plan everything in advance. A harness lets the model work exactly like that:

1. The model decides what to do next (“run the tests”).
2. The harness actually does it.
3. The harness shows the result back to the model.
4. Repeat, until the model says “done.”

**Diagram 2, step 1:** you, saying “fix the bug.” **Step 2:** the harness builds the context (instructions, tool list, history, memory). **Step 3:** the model answers with text or a tool call, such as *run pytest*. **Step 4:** the harness runs the tool. **Step 5:** draw the arrow carrying the result back into the context, make it a loop, and mark the exit: the model says “done.”

Now the proof. Here is a complete harness. There is no API key: the “model” is a script that replays a fixed plan, because I want you to see that **everything that touches the world is harness**, and the model only chooses.

**\[Run\]** Paste this into Colab or any Python:

```python
import subprocess, pathlib, tempfile, os

# 1. TOOLS: what the model is allowed to do
def read(path):            return pathlib.Path(path).read_text()
def write(path, text):     pathlib.Path(path).write_text(text); return "written"
def bash(command):
    r = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=20)
    return (r.stdout + r.stderr).strip() or "(no output)"
TOOLS = {"read": read, "write": write, "bash": bash}

# 2. BRAKE: a permission check that runs BEFORE any tool
def allowed(tool, args):
    if tool == "bash" and "rm -rf" in args.get("command", ""):
        return False
    return True

# 3. THE LOOP
def run_agent(model, task, brake=True, max_turns=10):
    messages = [{"role": "user", "content": task}]           # the context
    for turn in range(max_turns):
        decision = model(messages)                           # model: text in -> action out
        if "text" in decision:                               # model says done
            print(f"  turn {turn}: DONE -> {decision['text']}")
            return messages
        tool, args = decision["tool"], decision["args"]
        if brake and not allowed(tool, args):
            result = "BLOCKED by harness: this command needs human approval."
        else:
            result = TOOLS[tool](**args)                     # the harness actually does it
        print(f"  turn {turn}: {tool}({args}) -> {result[:60]!r}")
        messages.append({"role": "assistant", "content": decision})
        messages.append({"role": "tool", "content": result}) # feed the result back
    return messages

# A scripted stand-in for the model (NOT intelligent)
def make_model(plan):
    def model(messages):
        step = sum(1 for m in messages if m["role"] == "tool")
        return plan[step] if step < len(plan) else {"text": "finished"}
    return model

d = tempfile.mkdtemp(); os.chdir(d)
pathlib.Path("calc.py").write_text("def average(n):\n    return sum(n) / (len(n) + 1)\n")
pathlib.Path("test.py").write_text("from calc import average\nassert average([2,4,6]) == 4\nprint('PASS')\n")

print("RUN 1: fix a bug")
fix = [{"tool": "bash",  "args": {"command": "python3 test.py"}},
       {"tool": "write", "args": {"path": "calc.py", "text": "def average(n):\n    return sum(n) / len(n)\n"}},
       {"tool": "bash",  "args": {"command": "python3 test.py"}}]
run_agent(make_model(fix), "make test.py pass")

print("\nRUN 2: a reckless model, brake OFF then ON")
bad = [{"tool": "bash", "args": {"command": "rm -rf precious"}}]
for brake in (False, True):
    os.makedirs("precious", exist_ok=True); pathlib.Path("precious/data.txt").write_text("my thesis")
    run_agent(make_model(bad), "tidy up", brake=brake)
    print("  brake", "ON " if brake else "OFF", "-> precious folder exists?", os.path.exists("precious"))
```

What you should see (the same file, `mini_harness.py`, is shared with this doc):

```
RUN 1: fix a bug
  turn 0: bash({'command': 'python3 test.py'}) -> 'Traceback (most recent call last): ...'
  turn 1: write({'path': 'calc.py', 'text': '...len(n)...'}) -> 'written'
  turn 2: bash({'command': 'python3 test.py'}) -> 'PASS'
  turn 3: DONE -> finished

RUN 2: a reckless model, brake OFF then ON
  turn 0: bash({'command': 'rm -rf precious'}) -> '(no output)'
  brake OFF -> precious folder exists? False
  turn 0: bash({'command': 'rm -rf precious'}) -> 'BLOCKED by harness: ...'
  brake ON  -> precious folder exists? True
```

How to say it: *“Look at the three parts. Tools are the hands. The brake is one if-statement that runs before any hand moves. The loop is a for-loop. That is it. In Run 2 the model was equally reckless both times. The only thing that saved the thesis was the harness.”*

An honest note: the stand-in model is not intelligent, it just replays a plan. A real model decides for itself. But the part you ran, the hands, the brake and the loop, is exactly what real harnesses are made of.

## 4. Why the design choices matter

The loop is the same in every harness. The differences are in five choices, and these are the questions to ask of any agent product:

1. **What goes into the system prompt?** Every turn, the model re-reads everything. Context is a budget: it costs money, it costs time, and a crowded context can distract the model.
2. **Which tools, and how many?** Every tool’s description is re-sent on every turn. More tools mean more reading, and more ways to pick the wrong one.
3. **What when the conversation gets too long?** The usual answer is *compaction*: summarise the old pages, like making exam notes before a long revision.
4. **Does it remember across sessions?** Think of a shift handover register in a hospital. Anthropic’s engineers describe long-running agents exactly this way: engineers working in shifts, each arriving with no memory of the last shift. Their fix is a progress file, a feature list and the git history, so the next shift can get up to speed. A progress note *is* memory.
5. **Who approves a dangerous command?** A human, another model, a sandbox, or nobody.

Pi and Hermes answer these five questions in very different ways. That is the whole lesson.

## 5. Pi: the mechanic’s toolbox

Pi comes from Mario Zechner. It is written in TypeScript, MIT licensed, and the repository is a toolkit: a layer that talks to many model providers, the agent loop, a terminal interface, and the coding agent itself. You can use it in a terminal, in a one-shot mode, over RPC, or inside your own program through its SDK.

Its philosophy is the Indian word **jugaad** in the best sense: give the user a small, sharp kit and let them build what they need. In his write-up, Mario argues that today’s models already know how to behave as coding agents, so a huge instruction manual is not needed. So Pi hands the model **four tools**: `read`, `write`, `edit` and `bash`. It deliberately leaves out things other harnesses build in, such as sub-agents and a plan mode. If you want them, you add them with extensions and skills.

Pi’s answers to our five questions:

1. **Prompt:** small, with a short list of tools and a few rules.
2. **Tools:** four.
3. **Long conversations:** compaction exists. Sessions are saved as files that you can branch, like a tree of attempts.
4. **Memory:** instruction files such as `AGENTS.md`, plus the saved sessions. Skills are loaded only when needed.
5. **Brakes:** none built in. Pi runs what the model asks, and the docs recommend you run it in a sandbox.

A caution that is itself a lesson: Mario’s 2025 post said Pi had no MCP support, and the repository now ships an MCP package. Projects move. Always read the current docs.

**\[Run\] Run the real Pi yourself (about 3 minutes).** I wanted to see what a real harness does without paying for a model. So I installed Pi from npm, wrote a tiny fake “model” server that replays a fixed plan (the same trick as in Section 3), and pointed Pi at it. Then I asked Pi to fix a bug in `calc.py`.

**What you need:** a laptop with Node 20 or newer and Python 3, plus internet for a one-time install (about 15 seconds here). No account, no API key, no cost.

**What to do:**

1. Put three files in one folder: `fake_model_server.py`, `measure_requests.py` and `run_real_pi.sh` (shared with this doc).
2. Open a terminal in that folder and run one command:

```bash
bash run_real_pi.sh
```

3. That is all. The script installs Pi, creates a buggy `calc.py` with a failing test, starts the fake model on your own machine, runs the real Pi on the task, and prints what Pi sent.

**In plain words, so you can explain it:** the script gives Pi a settings file saying “there is a model provider called *fake* at localhost port 8765.” The fake server answers Pi with a fixed plan: read the file, run the test, edit the file, run the test, say done. Pi performs every one of those actions for real. **Tip for class:** do the install beforehand, so live you only run the last step, which takes a few seconds.

**What you should see:**

```
== BEFORE: the test fails ==
AssertionError: expected 4, got 3.0

== Running the real Pi ==
Fixed: average() divided by len(nums)+1. Now divides by len(nums); tests pass.

== AFTER: calc.py was really edited ==
    return total / len(nums)
PASS

== What Pi sent to the model ==
model requests received : 5
  request 1:  2 messages | system prompt  2,295 chars | tool definitions  2,956 chars (4 tools)
  ...
  request 5: 10 messages | system prompt  2,295 chars | tool definitions  2,956 chars (4 tools)

Fixed cost before you type a word: 5,251 chars  (~1,312 tokens, rough = chars/4)
tools sent: read, bash, edit, write
```

Here is what that tells us:

- Pi made **5 requests** to the “model” and, in between, **really read the file, ran the tests, edited the file and ran the tests again**. The test went from failing to `PASS`, and `calc.py` was really changed on disk.
- Every request carried the same **4 tools**: read, write, edit, bash.
- The system prompt Pi sent was about **2.3 thousand characters** (it includes your folder path, so it varies a little). The four tool definitions were **2,956 characters**. About **5.2 thousand characters**, roughly 1,300 tokens, before you type a word (a rough estimate: characters divided by four).
- The conversation grew by two messages each turn: the model’s tool call, then the tool’s result (2, 4, 6, 8, 10 messages). That growth is why compaction exists.

How to say it: *“I never gave Pi a real brain. I gave it a script. And Pi still did everything a coding agent does, because all of that was harness.”* The script to repeat this, `run_real_pi.sh`, is shared with this doc.

## 6. Hermes: the house-help who learns your home

Hermes Agent comes from Nous Research. It is written in Python, MIT licensed, and describes itself as the agent that grows with you. If Pi is the mechanic’s toolbox, Hermes is the trusted house-help who has been in the family for years. In the first month she asks how you take your chai. By the sixth, she knows, and she has even written down how your father likes the newspaper folded.

What Hermes builds around the model:

- **A large tool shelf.** The docs say 40+ tools, grouped in toolsets: web, terminal, browser, media, memory and scheduling.
- **Memory that persists.** It keeps notes about its work and about you in files that are loaded into the prompt at the start of each session, can search past sessions, and has a persona file.
- **Skills it writes itself.** After a hard task, Hermes can save the method as a *skill*, a written how-to, and improve it next time. This is the “learning loop.” Nothing is retrained: it is the service book at work, not the engine.
- **Reach.** A gateway lets you talk to it from Telegram, Discord, Slack, WhatsApp, Signal or email, and a built-in scheduler lets it do jobs on its own, such as a morning report.
- **Brakes.** Dangerous commands go through an approval step, with three modes: manual, smart (a second model judges the command) and off. It can also run its commands inside containers.

**\[Run\] Measure Hermes yourself (about 5 minutes, mostly the install).** I installed Hermes and pointed it at a fake “model” that does nothing except log whatever it receives and answer “ok”. That lets us read exactly what Hermes sends before you type anything.

**What you need:** Python 3.11 or newer, plus internet for a one-time install of Hermes (about 30 seconds here, a few minutes on a slow connection). No account, no API key, no cost.

**What to do:**

1. Put three files in one folder (the same folder as before is fine): `hermes_log_server.py`, `measure_requests.py` and `run_hermes_measure.sh`.
2. Run one command:

```bash
bash run_hermes_measure.sh
```

3. The script makes a private Python environment and installs Hermes inside it, writes a settings file saying “your model is a custom endpoint at localhost port 8766”, starts the logging server, runs Hermes once in one-shot mode (`hermes -z "say ok"`), and prints the measurement. It ends by running Hermes’ own `prompt-size` command, so you can compare my measurement with Hermes’ own report. Do the install before class here too.

**What you should see:**

```
== Asking Hermes to say ok (one-shot mode) ==
ok

== What Hermes sent to the model ==
model requests received : 1
  request 1:  2 messages | system prompt  6,634 chars | tool definitions 47,080 chars (27 tools)

Fixed cost before you type a word: 53,714 chars  (~13,428 tokens, rough = chars/4)
tools sent: browser_back, browser_click, ... terminal, ... write_file

== Hermes' own size report ==
  System prompt total :    6,649 B  (6.5 KB)
  Tool schemas        :   46,876 B  (45.8 KB, 27 tools)
```

Here is what that tells us:

- About **6.6 thousand characters** of system prompt and about **47 thousand characters** of tool definitions for **27 tools**. In total about **54 thousand characters**, roughly 13,000 tokens, before you say anything. Hermes’ own `prompt-size` command agrees: about 6.5 KB of prompt and 45.8 KB of tools across the same 27 tools.
- That is **about ten times** Pi’s 5.2 thousand characters.

How to say it: *“Hermes pays for its abilities up front, every single turn. Pi pays only for what you choose to add. Neither is wrong. It is a trade between a ready-made house-help and a toolbox you shape yourself.”*

This was the default command-line setup, with no skills installed and no memory yet. Your numbers will move as you add things.

## 7. Pi and Hermes, side by side

|  | **Pi** | **Hermes Agent** |
| --- | --- | --- |
| **Idea** | A minimal toolbox you shape yourself | A house-help that remembers and learns |
| **Language, licence** | TypeScript, MIT | Python, MIT |
| **Tools the model sees** | 4 (measured) | 27 by default (measured), 40+ in the docs |
| **Fixed cost per request** (measured) | about 5.2k characters | about 54k characters |
| **Memory** | Branching session files, instruction files | Persistent memory, past-session search, user model |
| **Skills** | Loaded on demand | Written and improved by the agent |
| **Where you reach it** | Terminal, RPC, SDK | Terminal plus Telegram, Discord, Slack, WhatsApp, Signal, email, and a scheduler |
| **Brakes** | None built in; use a sandbox | Approval modes and container isolation |

One careful point about “minimal.” Pi is minimal in **what it hands the model**, not in the size of its repository: the whole Pi monorepo is hundreds of thousands of lines, though its core agent loop is under three thousand. Hermes is a very large Python codebase, over a million lines excluding tests. Counts are rough, from my own count of the cloned repositories.

**The brake test (measured, and it surprised me).** I sent the same reckless command, `rm -rf ~/victim`, through both harnesses. Pi ran it at once, exactly as designed. I expected Hermes to stop. In its default one-shot mode (`-z`), it **also ran it**. Its approval step is described for interactive use and I tested only the one-shot path, so I cannot tell you Hermes would have blocked it in a normal chat. What I can tell you is the lesson: **a brake you have not tested is only a hope.** Test yours.

What is the same in both: they are open source, they work with many different models, and underneath each is the same loop you built in Section 3.

## 8. Where you would use each

- **Pi** when you want to *understand and shape* your agent. It is small enough to read, so it is a fine way to learn how agents work. Use it for your own terminal coding setup, for embedding an agent in your own product through the SDK, or for locked-down pipelines where the model should get only the tools you choose. *Example:* a college runs a coding-practice agent that has only read-only tools plus one custom check for that week’s assignment.
- **Hermes** when you want an assistant that *lives with you and improves*. *Example:* a freelancer in Mumbai asks it, from Telegram, “every morning at 8, send me five lines on unpaid invoices and today’s meetings.” It remembers her client names, writes a skill for her invoice format, and nudges her on WhatsApp.
- **Both** can write code. The real lesson is that choosing a harness matters as much as choosing a model.

## 9. The whole thing in plain words

If someone asks you at dinner, “what is a harness?”:

1. An AI model on its own only reads and writes text. It is a brilliant person behind glass.
2. The harness is everything around it: hands (tools), a dashboard (what it can see), brakes (permissions) and a service book (memory).
3. It works in a loop: the model decides, the harness acts, the result goes back, and it repeats until done.
4. Pi is a tiny toolbox you shape. Hermes is a house-help that remembers, learns and reaches you on your phone.
5. The same model in a different harness is a different product.

## 10. Questions to ask the room

| Ask | One-line answer |
| --- | --- |
| Why can’t a model alone fix a bug in your project? | It cannot open files, run code, remember, or be stopped. Those come from the harness. |
| In our 60-line harness, what stopped the deletion? | One check running before the tool, not the model. |
| Why does it matter how many tools there are? | Every tool description is re-read on every turn. |
| Why do agents need compaction? | The context grows every turn and has a limit. |
| Why did Hermes cost about ten times more per request than Pi? | It sends many more tool definitions and a larger prompt up front. |
| I tested a brake and it did not stop the command. What do I learn? | Test your safety, never assume it. |

## 11. Timing, running the code, references

| Minutes | Section |
| --- | --- |
| 0–3 | The glass room, the engine and the bike (Sections 1 and 2) |
| 3–10 | The loop, and running the 60-line harness (Section 3) |
| 10–13 | The five design questions (Section 4) |
| 13–17 | Pi and the real run (Section 5) |
| 17–21 | Hermes and the measurement (Section 6) |
| 21–24 | Side by side, the brake test, uses (Sections 7 and 8) |
| 24–25 | Plain-words recap (Section 9) |

**Running the code.** The 60-line harness runs anywhere with Python. The real-Pi experiment needs Node 20+ and Python:

```bash
python3 mini_harness.py        # Section 3: the 60-line harness
bash run_real_pi.sh            # Section 5: installs Pi, runs it on a buggy file, prints what it sent
bash run_hermes_measure.sh     # Section 6: installs Hermes, measures what it sends
```

All six files are shared in chat with this doc, and they must sit in one folder: `mini_harness.py`, `fake_model_server.py`, `hermes_log_server.py`, `measure_requests.py`, `run_real_pi.sh` and `run_hermes_measure.sh`. Run the scripts with `bash`, exactly as shown, so you do not need to change any file permissions. If a number on screen differs from this doc, trust the screen and tell the class.

**What I checked, and what I did not.** *Checked:* the Pi and Hermes repositories and their READMEs, the Pi system prompt and tool list as actually sent, Hermes’ first request, and the brake test in one-shot mode. *Not checked:* Hermes’ interactive approval prompt, the quality of either harness with a real model, and any claim in the linked blog posts I did not open.

**References**

- Pi: github.com/earendil-works/pi and pi.dev/docs/latest
- Hermes Agent: github.com/NousResearch/hermes-agent and hermes-agent.nousresearch.com/docs
- Mario Zechner, *What I learned building an opinionated and minimal coding agent* (mariozechner.at)
- Anthropic, *Effective harnesses for long-running agents* (the shift-worker idea and the progress-file fix)
- Anthropic, *Building effective agents*; LangChain, *The anatomy of an agent harness*; Addy Osmani, *Agent harness engineering* (starting points, linked in the brief)
