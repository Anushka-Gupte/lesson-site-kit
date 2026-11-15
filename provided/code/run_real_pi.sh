#!/usr/bin/env bash
# Run the REAL Pi harness against a scripted stand-in "model" (no API key, no cost).
# Needs: node 20+, python3, internet for the one-time npm install (about 1 minute).
# Tested with Pi 1.5.2 (npm: @earendil-works/pi-coding-agent) on 13 Nov 2026.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HERE/pi_demo/work" "$HERE/pi_demo/agent" && cd "$HERE/pi_demo"
[ -d node_modules/@earendil-works ] || npm install --ignore-scripts @earendil-works/pi-coding-agent
cp "$HERE/fake_model_server.py" .

cat > work/calc.py <<'PY'
def average(nums):
    total = sum(nums)
    return total / (len(nums) + 1)
PY
cat > work/test_calc.py <<'PY'
from calc import average
assert average([2, 4, 6]) == 4, f"expected 4, got {average([2,4,6])}"
print("PASS")
PY
# tell Pi that a provider called "fake" lives at localhost:8765
cat > agent/models.json <<'JSON'
{ "providers": { "fake": { "baseUrl": "http://127.0.0.1:8765/v1", "api": "openai-completions",
  "apiKey": "x", "models": [ { "id": "scripted" } ] } } }
JSON

echo "== BEFORE: the test fails =="; (cd work && python3 test_calc.py 2>&1 | tail -1 || true)
python3 fake_model_server.py &  SERVER=$!;  sleep 1
echo; echo "== Running the real Pi =="
( cd work && PI_CODING_AGENT_DIR="$HERE/pi_demo/agent" ../node_modules/.bin/pi \
    --provider fake --model scripted --no-session -p "Fix the bug in calc.py so test_calc.py passes" )
kill $SERVER 2>/dev/null || true
echo; echo "== AFTER: calc.py was really edited =="; cat work/calc.py; (cd work && python3 test_calc.py)
echo; echo "== What Pi sent to the model =="; python3 "$HERE/measure_requests.py" requests.jsonl
