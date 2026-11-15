"""A fake OpenAI-compatible 'model' that just logs every request it receives and answers 'ok'.
Hermes talks to it, and we then measure what Hermes sent."""
import json, time
from http.server import BaseHTTPRequestHandler, HTTPServer
LOG = open("hermes_requests.jsonl", "w")

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        LOG.write(json.dumps(body) + "\n"); LOG.flush()
        chunk = lambda d, f=None: "data: " + json.dumps({"id": "x", "object": "chat.completion.chunk",
            "created": int(time.time()), "model": "scripted",
            "choices": [{"index": 0, "delta": d, "finish_reason": f}]}) + "\n\n"
        if not body.get("stream"):                           # small non-streaming probe calls
            resp = {"id": "x", "object": "chat.completion", "created": int(time.time()), "model": "scripted",
                    "choices": [{"index": 0, "message": {"role": "assistant", "content": "ok"}, "finish_reason": "stop"}],
                    "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2}}
            b = json.dumps(resp).encode()
            self.send_response(200); self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b); return
        self.send_response(200); self.send_header("Content-Type", "text/event-stream"); self.end_headers()
        for o in (chunk({"role": "assistant", "content": "ok"}), chunk({}, "stop"), "data: [DONE]\n\n"):
            self.wfile.write(o.encode()); self.wfile.flush()

HTTPServer(("127.0.0.1", 8766), H).serve_forever()
