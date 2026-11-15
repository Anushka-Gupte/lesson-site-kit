"""A scripted stand-in for an LLM, served as an OpenAI-compatible endpoint.
It is NOT intelligent: it replays a fixed plan (read -> run tests -> edit -> run tests -> done).
Its only purpose: let the REAL Pi harness run its REAL loop and tools, and let us log what the harness sends."""
import json, sys, time
from http.server import BaseHTTPRequestHandler, HTTPServer

PLAN = [
  ("read",  {"path": "calc.py"}),
  ("bash",  {"command": "python3 test_calc.py"}),
  ("edit",  {"path": "calc.py", "edits": [{"oldText": "return total / (len(nums) + 1)", "newText": "return total / len(nums)"}]}),
  ("bash",  {"command": "python3 test_calc.py"}),
]
LOG = open("requests.jsonl", "w")

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        msgs = body.get("messages", [])
        LOG.write(json.dumps({"n_messages": len(msgs), "roles": [m["role"] for m in msgs],
                              "tools": [t["function"]["name"] for t in body.get("tools", [])],
                              "body": body}) + "\n"); LOG.flush()
        step = sum(1 for m in msgs if m["role"] == "tool")
        def chunk(delta, finish=None):
            return "data: " + json.dumps({"id":"x","object":"chat.completion.chunk","created":int(time.time()),
                    "model":"scripted","choices":[{"index":0,"delta":delta,"finish_reason":finish}]}) + "\n\n"
        out = []
        if step < len(PLAN):
            name, args = PLAN[step]
            out.append(chunk({"role":"assistant","content":None,"tool_calls":[{"index":0,"id":f"call_{step}","type":"function",
                              "function":{"name":name,"arguments":json.dumps(args)}}]}))
            out.append(chunk({}, "tool_calls"))
        else:
            out.append(chunk({"role":"assistant","content":"Fixed: average() divided by len(nums)+1. Now divides by len(nums); tests pass."}))
            out.append(chunk({}, "stop"))
        out.append("data: [DONE]\n\n")
        self.send_response(200); self.send_header("Content-Type","text/event-stream"); self.end_headers()
        for o in out: self.wfile.write(o.encode()); self.wfile.flush()

HTTPServer(("127.0.0.1", 8765), H).serve_forever()
