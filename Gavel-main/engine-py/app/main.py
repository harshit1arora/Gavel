"""Gavel decision service: FastAPI.

A thin, fast HTTP surface over the deterministic engine. The Node gateway and
the React app call the same policy and the same rules, and a parity test asserts
they agree, so a decision is identical whichever service produced it.

Run: uvicorn app.main:app --reload --port 8090
Docs: http://localhost:8090/docs (OpenAPI JSON at /openapi.json)
"""

from __future__ import annotations

import hashlib
import json
import os
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from. import ai, cache
from. import keys as key_module
from. import vision
key_store = key_module.store
from.engine import DEFAULT_POLICY, analyze, load_policy, parse_statement_text
from.schemas import (
    DecisionResult,
    EvaluateRequest,
    ParsedStatement,
    ParseRequest,
    PolicyConfig,
)

STARTED_AT = time.time()
METRICS: dict[str, float] = {
    "evaluations_total": 0,
    "evaluations_errors_total": 0,
    "parse_total": 0,
    "explain_total": 0,
    "evaluate_ms_sum": 0.0,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await cache.store.connect()
    yield
    await cache.store.close()


app = FastAPI(
    title="Gavel Decision Service",
    version="2.1.0",
    description=(
        "Deterministic, explainable credit decisioning. Converts normalised bank-statement "
        "transactions into APPROVE / REVIEW / REJECT with a full rule trace and an audit id. "
        "The same inputs and policy always produce the same decision."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # "*" with credentials is rejected by browsers, so credentials stay off:
    # auth is a bearer token, never a cookie.
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _authorise(
    authorization: Optional[str],
    api_key: Optional[str],
    scope: str = "decisions:write",
) -> str:
    """Authenticate a request and return the org id used for idempotency.

    Three modes, in order:
      1. `GAVEL_API_KEY` set: one shared secret, for simple deployments.
      2. A key file with issued keys: the key must exist, be active and hold the
         scope. This is the multi-tenant path.
      3. Neither configured: open, so a local `uvicorn` run needs no setup.
    """
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    elif api_key:
        token = api_key

    shared = os.environ.get("GAVEL_API_KEY")
    if shared:
        if token != shared:
            raise HTTPException(status_code=401, detail="Invalid or missing API key")
        return hashlib.sha256(token.encode()).hexdigest()[:16]

    if key_store.has_keys():
        if not token:
            raise HTTPException(status_code=401, detail="Missing API key")
        record = key_store.verify(token, required_scope=scope)
        if record is None:
            raise HTTPException(status_code=401, detail="Invalid, revoked or unauthorised key")
        return record["org_id"]

    return "public"


@app.get("/health", tags=["ops"])
async def health() -> dict:
    return {
        "status": "ok",
        "service": "gavel-decision",
        "version": app.version,
        "uptime_s": round(time.time() - STARTED_AT, 1),
    }


@app.get("/readyz", tags=["ops"])
async def readyz() -> dict:
    cache_ok = await cache.store.ping()
    return {"ready": True, "cache": cache.store.backend, "cache_ok": cache_ok}


@app.get("/metrics", tags=["ops"])
async def metrics() -> Response:
    lines = [
        f"gavel_evaluations_total {int(METRICS['evaluations_total'])}",
        f"gavel_evaluation_errors_total {int(METRICS['evaluations_errors_total'])}",
        f"gavel_parse_total {int(METRICS['parse_total'])}",
        f"gavel_explain_total {int(METRICS['explain_total'])}",
        f"gavel_evaluate_ms_sum {METRICS['evaluate_ms_sum']:.3f}",
        f"gavel_uptime_seconds {time.time() - STARTED_AT:.0f}",
    ]
    return Response("\n".join(lines) + "\n", media_type="text/plain; version=0.0.4")


@app.get("/v1/policies/current", response_model=PolicyConfig, tags=["policy"])
async def current_policy(authorization: Optional[str] = Header(None)) -> PolicyConfig:
    _authorise(authorization, None)
    # Policies change rarely; serve from Redis when available.
    key = cache.policy_cache_key(DEFAULT_POLICY.policy_id, DEFAULT_POLICY.version)
    cached = await cache.store.get_json(key)
    if cached:
        return PolicyConfig(**cached)
    await cache.store.set_json(key, DEFAULT_POLICY.model_dump(mode="json"), ttl=3600)
    return DEFAULT_POLICY


@app.post("/v1/underwriting/evaluate", response_model=DecisionResult, tags=["underwriting"])
async def evaluate(
    payload: EvaluateRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
) -> DecisionResult:
    org = _authorise(authorization, x_api_key, scope="decisions:write")
    body_hash = hashlib.sha256(
        json.dumps(payload.model_dump(), sort_keys=True, default=str).encode()
    ).hexdigest()[:32]

    if idempotency_key:
        stored = await cache.store.get_json(cache.idempotency_key(org, idempotency_key))
        if stored:
            if stored.get("requestHash") != body_hash:
                raise HTTPException(
                    status_code=409,
                    detail="Idempotency-Key was reused with a different request body",
                )
            return DecisionResult(**stored["result"])

    try:
        policy = load_policy() if not payload.policy_id else DEFAULT_POLICY
        result = analyze(payload.transactions, payload.period, policy)
    except Exception as exc: # pragma: no cover - defensive
        METRICS["evaluations_errors_total"] += 1
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    METRICS["evaluations_total"] += 1
    METRICS["evaluate_ms_sum"] += result.processing_time_ms

    if idempotency_key:
        await cache.store.set_json(
            cache.idempotency_key(org, idempotency_key),
            {"requestHash": body_hash, "result": result.model_dump(mode="json")},
            ttl=24 * 3600,
        )

    return result


@app.post("/v1/parse/statement", response_model=ParsedStatement, tags=["parsing"])
async def parse(
    payload: ParseRequest,
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> ParsedStatement:
    _authorise(authorization, x_api_key, scope="statements:write")
    METRICS["parse_total"] += 1
    return parse_statement_text(payload.text)


@app.post("/v1/parse/vision")
async def parse_vision(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> dict:
    """Read a scanned or handwritten statement with Gemini 2.5 Flash.

    Use this when the PDF has no text layer. The model only reads the page; the
    decision is still made by the deterministic engine.
    """
    _authorise(authorization, x_api_key, scope="statements:write")

    if not vision.available():
        raise HTTPException(
            status_code=503,
            detail="Vision parsing is not configured on this deployment (GEMINI_API_KEY missing)",
        )

    form = await request.form()
    upload = form.get("file")
    if upload is None or not hasattr(upload, "read"):
        raise HTTPException(status_code=422, detail="Expected a multipart field named 'file'")

    content = await upload.read()
    if not content:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is larger than 20 MB")

    mime = upload.content_type or "application/pdf"
    if mime not in {"application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic"}:
        raise HTTPException(status_code=415, detail=f"Unsupported content type: {mime}")

    started = time.perf_counter()
    try:
        result = await vision.extract_transactions(content, mime)
    except RuntimeError as exc:
        METRICS["vision_errors"] = METRICS.get("vision_errors", 0) + 1
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    METRICS["vision_total"] = METRICS.get("vision_total", 0) + 1

    return {
        "transactions": [t.model_dump() for t in result.transactions],
        "bank": result.bank,
        "period": result.period,
        "confidence": result.confidence,
        "handwritten": result.handwritten,
        "notes": result.notes,
        "method": result.method,
        "rejected_rows": len(result.rejected_rows),
        "processing_ms": round((time.perf_counter() - started) * 1000, 1),
    }


@app.post("/v1/ai/explain", tags=["ai"])
async def explain_endpoint(
    payload: EvaluateRequest,
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> dict:
    """Credit note for a decision. LLM when configured, template otherwise."""
    _authorise(authorization, x_api_key)
    METRICS["explain_total"] += 1
    result = analyze(payload.transactions, payload.period)
    note = await ai.explain(result, payload.applicant_id)
    return {
        **note,
        "decision": result.decision,
        "risk_score": result.risk_score,
        "audit_id": result.audit_id,
    }


@app.get("/v1/engine/info", tags=["underwriting"])
async def engine_info() -> dict:
    return {
        "engine_version": DEFAULT_POLICY.version,
        "policy_id": DEFAULT_POLICY.policy_id,
        "rules": len(DEFAULT_POLICY.rules),
        "bands": DEFAULT_POLICY.bands.model_dump(),
        "deterministic": True,
        "ai_role": "explanation-only",
    }
