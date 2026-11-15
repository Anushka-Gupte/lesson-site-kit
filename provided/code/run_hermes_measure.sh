#!/usr/bin/env bash
# Measure what Hermes Agent sends to the model before you type anything (no API key, no cost).
# Needs: python 3.11+ and internet for the one-time pip install (a few minutes).
# Tested with hermes-agent 0.19.0 (PyPI) on 13 Nov 2026.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HERE/hermes_demo/home" && cd "$HERE/hermes_demo"
[ -d venv ] || { python3 -m venv venv && ./venv/bin/pip install -q hermes-agent; }
cp "$HERE/hermes_log_server.py" .

# tell Hermes that its model is a "custom" endpoint at localhost:8766
export HERMES_HOME="$HERE/hermes_demo/home"
cat > "$HERMES_HOME/config.yaml" <<'YAML'
model:
  default: scripted
  provider: custom
  base_url: http://127.0.0.1:8766/v1
  api_key: x
YAML

python3 hermes_log_server.py &  SERVER=$!;  sleep 1
echo "== Asking Hermes to say ok (one-shot mode) =="
./venv/bin/hermes -z "say ok"
kill $SERVER 2>/dev/null || true
echo; echo "== What Hermes sent to the model =="; python3 "$HERE/measure_requests.py" hermes_requests.jsonl
echo; echo "== Hermes' own size report =="; ./venv/bin/hermes prompt-size 2>&1 | head -25
