"""Run inside the decision container. The release fixture arrives on stdin."""
import json
import os
import sys
import urllib.request

def verify(base_url, fixture):
    payload = {"transactions": fixture["transactions"], "period": f"{fixture['months']} months"}
    request = urllib.request.Request(
        base_url + "/v1/underwriting/evaluate",
        json.dumps(payload).encode(),
        {"Content-Type":"application/json", "X-API-Key":os.environ.get("GAVEL_API_KEY","")},
    )
    with urllib.request.urlopen(request,timeout=15) as response:
        decision = json.load(response)
    expected = fixture["expected"]
    for field in ("decision","risk_score","credit_limit"):
        if decision.get(field) != expected[field]:
            raise ValueError(f"Decision probe mismatch for {field}: expected {expected[field]}, received {decision.get(field)}")

if __name__ == "__main__":
    verify("http://127.0.0.1:8090", json.load(sys.stdin))
