"""A complete agent harness in ~50 lines. No API key needed: the 'model' is a scripted stand-in.
The point: the loop, the tools and the brake are the HARNESS. The model only decides what to do next."""
import subprocess, pathlib, tempfile, os

# ---------- 1. TOOLS: what the model is allowed to do ----------
def read(path):            return pathlib.Path(path).read_text()
def write(path, text):     pathlib.Path(path).write_text(text); return "written"
def bash(command):
    r = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=20)
    return (r.stdout + r.stderr).strip() or "(no output)"
TOOLS = {"read": read, "write": write, "bash": bash}

# ---------- 2. BRAKE: a permission check that runs BEFORE any tool ----------
def allowed(tool, args):
    if tool == "bash" and "rm -rf" in args.get("command", ""):
        return False
    return True

# ---------- 3. THE LOOP ----------
def run_agent(model, task, brake=True, max_turns=10):
    messages = [{"role": "user", "content": task}]           # the context
    for turn in range(max_turns):
        decision = model(messages)                           # model: text in -> action out
        if "text" in decision:                               # model says "done"
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

# ---------- A scripted stand-in for the model (NOT intelligent) ----------
def make_model(plan):
    def model(messages):
        step = sum(1 for m in messages if m["role"] == "tool")
        return plan[step] if step < len(plan) else {"text": "finished"}
    return model

if __name__ == "__main__":
    d = tempfile.mkdtemp(); os.chdir(d)
    pathlib.Path("calc.py").write_text("def average(n):\n    return sum(n) / (len(n) + 1)\n")
    pathlib.Path("test.py").write_text("from calc import average\nassert average([2,4,6]) == 4\nprint('PASS')\n")

    print("RUN 1: fix a bug (same loop, any model plugs in)")
    fix = [{"tool": "bash", "args": {"command": "python3 test.py"}},
           {"tool": "write", "args": {"path": "calc.py", "text": "def average(n):\n    return sum(n) / len(n)\n"}},
           {"tool": "bash", "args": {"command": "python3 test.py"}}]
    run_agent(make_model(fix), "make test.py pass")

    print("\nRUN 2: a reckless model, brake OFF vs ON")
    os.makedirs("precious"); pathlib.Path("precious/data.txt").write_text("my thesis")
    bad = [{"tool": "bash", "args": {"command": "rm -rf precious"}}]
    run_agent(make_model(bad), "tidy up", brake=False); print("  precious folder exists?", os.path.exists("precious"))
    os.makedirs("precious"); pathlib.Path("precious/data.txt").write_text("my thesis")
    run_agent(make_model(bad), "tidy up", brake=True);  print("  precious folder exists?", os.path.exists("precious"))
