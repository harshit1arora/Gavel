"""
Service-level end-to-end checks.

Boots both backends as real HTTP servers (subprocess), exercises their public
surface, and shuts them down. Prints PASS/FAIL per check and a summary.
"""

import json
import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request

REPO = os.environ.get("E2E_REPO", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NODE_PORT = int(os.environ.get("E2E_NODE_PORT", 8099))
PY_PORT = int(os.environ.get("E2E_PY_PORT", 8098))
results = []


def record(suite, name, ok, detail=""):
    results.append((suite, name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'} [{suite}] {name}{', ' + detail if detail else ''}")


def http(url, method="GET", body=None, headers=None, timeout=15):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={"Content-Type": "application/json", **(headers or {})},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            try:
                return r.status, json.loads(raw)
            except Exception:
                return r.status, raw[:200].decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw[:200].decode("utf-8", "ignore")
    except Exception as e:
        return 0, str(e)


def wait_for(url, seconds=90):
    deadline = time.time() + seconds
    while time.time() < deadline:
        status, _ = http(url, timeout=3)
        if status == 200:
            return True
        time.sleep(1.5)
    return False


# ─────────────────────────── FastAPI decision service ───────────────────────────
def test_python_service():
    env = {
        **os.environ,
        "GAVEL_API_KEY": "",
        "REDIS_URL": "",
        "PYTHONPATH": f"{REPO}/engine-py",
    }
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1",
         "--port", str(PY_PORT), "--log-level", "error"],
        cwd=f"{REPO}/engine-py", env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    base = f"http://127.0.0.1:{PY_PORT}"
    try:
        if not wait_for(f"{base}/health"):
            record("py", "service boots", False, "no /health after 90s")
            return
        record("py", "service boots", True, base)

        status, body = http(f"{base}/health")
        record("py", "/health", status == 200 and body.get("status") == "ok", str(body)[:60])

        status, body = http(f"{base}/readyz")
        record("py", "/readyz reports cache backend", status == 200 and body.get("ready") is True,
               f"cache={body.get('cache')}")

        status, body = http(f"{base}/metrics")
        record("py", "/metrics exposes counters", status == 200 and "gavel_evaluations_total" in str(body))

        status, body = http(f"{base}/openapi.json")
        record("py", "OpenAPI published", status == 200 and len(body.get("paths", {})) >= 8,
               f"{len(body.get('paths', {}))} paths")

        status, body = http(f"{base}/v1/policies/current")
        record("py", "policy endpoint returns the pilot policy",
               status == 200 and body.get("policy_id") == "pilot-acme",
               f"{body.get('policy_id')} v{body.get('version')}")

        txns = [
            {"date": "2026-05-03", "description": "SALARY CREDIT - INFOSYS LTD", "amount": 44800, "type": "credit", "balance": 86762},
            {"date": "2026-05-07", "description": "EMI BAJAJ FINANCE", "amount": 8500, "type": "debit", "balance": 78262},
            {"date": "2026-06-03", "description": "SALARY CREDIT - INFOSYS LTD", "amount": 44900, "type": "credit", "balance": 114662},
            {"date": "2026-06-07", "description": "EMI BAJAJ FINANCE", "amount": 8500, "type": "debit", "balance": 106162},
            {"date": "2026-07-03", "description": "SALARY CREDIT - INFOSYS LTD", "amount": 44750, "type": "credit", "balance": 150412},
            {"date": "2026-07-07", "description": "EMI BAJAJ FINANCE", "amount": 8500, "type": "debit", "balance": 141912},
        ]
        status, body = http(f"{base}/v1/underwriting/evaluate", "POST",
                            {"transactions": txns, "period": "3 months"})
        ok = status == 200 and body.get("decision") in ("APPROVE", "REVIEW", "REJECT")
        record("py", "evaluate returns a decision", ok,
               f"{body.get('decision')} risk={body.get('risk_score')} limit={body.get('credit_limit')}")

        status, body = http(f"{base}/v1/underwriting/evaluate", "POST", {"transactions": txns[:1]})
        record("py", "short history → E001", body.get("error", {}).get("code") == "E001")

        status, body = http(f"{base}/v1/underwriting/evaluate", "POST", {"transactions": []})
        record("py", "empty transactions handled", status in (200, 422),
               f"status={status} decision={body.get('decision') if isinstance(body, dict) else ''}")

        status, body = http(f"{base}/v1/parse/statement", "POST",
                            {"text": "03/05/2026 SALARY CREDIT - INFOSYS LTD 44,762.00 86,762.00 Cr"})
        record("py", "parse endpoint", status == 200 and len(body.get("transactions", [])) == 1)

        status, body = http(f"{base}/v1/ai/explain", "POST",
                            {"transactions": txns, "period": "3 months", "applicant_id": "Rajesh"})
        record("py", "AI explain returns a note", status == 200 and len(body.get("note", "")) > 40,
               f"source={body.get('source')}")

        # idempotency
        h = {"Idempotency-Key": "e2e-key-1"}
        s1, b1 = http(f"{base}/v1/underwriting/evaluate", "POST",
                      {"transactions": txns, "period": "3 months"}, h)
        s2, b2 = http(f"{base}/v1/underwriting/evaluate", "POST",
                      {"transactions": txns, "period": "3 months"}, h)
        record("py", "idempotent replay returns the same audit id",
               b1.get("audit_id") == b2.get("audit_id"))
        s3, _ = http(f"{base}/v1/underwriting/evaluate", "POST",
                     {"transactions": txns[:2], "period": "1 months"}, h)
        record("py", "idempotency key reuse with new body → 409", s3 == 409, f"status={s3}")

        status, _ = http(f"{base}/v1/underwriting/evaluate", "POST", {"transactions": "nope"})
        record("py", "invalid payload → 422", status == 422, f"status={status}")
    finally:
        proc.send_signal(signal.SIGTERM)
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()


# ─────────────────────────── Node API gateway ───────────────────────────
def test_node_gateway():
    env = {
        **os.environ,
        "PORT": str(NODE_PORT),
        "NODE_ENV": "test",
        "JWT_SECRET": "test-secret-at-least-32-characters-long",
        "WEBHOOK_SIGNING_SECRET": "test-webhook-secret-at-least-32-characters",
        "ALLOWED_ORIGINS": "http://localhost:5173",
    }
    proc = subprocess.Popen(
        ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"],
        cwd=f"{REPO}/backend", env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    base = f"http://127.0.0.1:{NODE_PORT}"
    try:
        if not wait_for(f"{base}/health", seconds=120):
            record("node", "gateway boots", False, "no /health after 120s")
            return
        record("node", "gateway boots", True, base)

        status, body = http(f"{base}/health")
        record("node", "/health", status == 200)

        status, _ = http(f"{base}/docs")
        record("node", "Swagger UI served at /docs", status == 200)

        # auth gates
        for path in ["/v1/underwriting/evaluate", "/v1/payments", "/v1/parse/bank-statement",
                     "/v1/loans", "/v1/collections/worklist"]:
            status, _ = http(f"{base}{path}", "POST" if "evaluate" in path else "GET", {})
            record("node", f"{path} requires auth", status in (401, 403), f"status={status}")

        status, body = http(f"{base}/v1/does-not-exist")
        record("node", "unknown route → 404 JSON", status == 404, f"status={status}")

        # public prediction endpoint should be reachable without a key
        status, body = http(f"{base}/v1/public/predict", "POST", {})
        record("node", "public prediction route reachable without auth",
               status not in (401, 403), f"status={status}")
    finally:
        proc.send_signal(signal.SIGTERM)
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    test_python_service()
    test_node_gateway()
    failed = [r for r in results if not r[2]]
    print(f"\n==== {len(results) - len(failed)}/{len(results)} service checks passed ====")
    for s, n, _, d in failed:
        print(f" - [{s}] {n}: {d}")
    sys.exit(1 if failed else 0)
