"""Print how big each request was that a harness sent to the (fake) model.
Usage: python3 measure_requests.py requests.jsonl"""
import json, sys

def text_of(m):
    c = m.get("content")
    return c if isinstance(c, str) else json.dumps(c)

rows = []
for line in open(sys.argv[1]):
    obj = json.loads(line)
    body = obj.get("body", obj)              # Pi's log wraps the request; Hermes' log is the request itself
    if "messages" not in body:               # skip small probe calls
        continue
    system = "".join(text_of(m) for m in body["messages"] if m["role"] in ("system", "developer"))
    tools = body.get("tools", [])
    rows.append((len(body["messages"]), len(system), len(json.dumps(tools)), tools))

print(f"model requests received : {len(rows)}")
for i, (n, s, t, tools) in enumerate(rows, 1):
    print(f"  request {i}: {n:2d} messages | system prompt {s:>6,} chars | tool definitions {t:>6,} chars ({len(tools)} tools)")
n, s, t, tools = rows[0]
names = [x.get("function", {}).get("name") or x.get("name") for x in tools]
print(f"\nFixed cost before you type a word: {s + t:,} chars  (~{(s + t)//4:,} tokens, rough = chars/4)")
print("tools sent:", ", ".join(map(str, names)))
