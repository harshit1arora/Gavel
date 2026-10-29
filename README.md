# Gavel AI

**Open-source lending infrastructure.** A deterministic underwriting engine, a bank-statement
parser that runs in your browser, and a full lending console covering origination,
disbursement, collections, early warning and RBI reporting.

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20+-blue.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-blue.svg)](https://www.typescriptlang.org)

**Free. No signup. No sales call.** There is nothing to buy. See [Licence](#licence).

- **Try it with your own statement →** `/try`, drop a bank statement PDF, get a real decision
- **Open the demo console →** `/demo`, six applicants scored live by the engine
- **Tour the platform →** `/platform`, all eight modules

---

## Why this exists

Most lending software is a black box you rent. Gavel is the opposite: the decision logic is a
pure function over transactions and a JSON policy, so anyone can read it, run it, and reproduce
a past decision exactly.

```
transactions ──▶ deriveSignals() ──▶ policy rules ──▶ decision + reasons + audit id
                (pure, testable) (JSON, editable) (reproducible)
                                          │
                                   AI credit note (explains, never decides)
```

Three implementations of the same engine, kept in lockstep by a parity test:

| Where | Language | Used by |
|---|---|---|
| `src/lib/engine/` | TypeScript | the browser (`/try`, `/demo`) and the React app |
| `backend/src/services/underwriting-engine.ts` | TypeScript (Node) | the REST gateway |
| `engine-py/` | **Python + FastAPI** | the decision microservice |

`engine-py/tests/test_parity.py` runs the same fixtures through both engines and
asserts identical decisions, risk scores, credit limits, signals and rule traces.

The same inputs and the same policy always produce the same decision and the same audit id.
That is the property a credit team actually needs when a regulator asks why a loan was declined
in March.

## What works today

| Surface | Route | State |
|---|---|---|
| Statement upload → decision, in the browser | `/try` | **Real**, pdf.js + engine, nothing uploaded |
| Demo console with live decisions | `/demo` | **Real**, same engine, synthetic applicants |
| Product tour (8 modules) | `/platform` | Real screens |
| 20 financial calculators | `/tools` | Real, client-side |
| Underwriting API | `backend/` | Real, 65 tests |
| Collections / compliance / disbursement / sentinel | console tabs | Real, API-backed |

## Services

| Service | Stack | Port | Health |
|---|---|---|---|
| Frontend | React + Vite | 5173 |, |
| API gateway | Express + TypeScript | 8080 | `/health` |
| **Decision service** | **Python + FastAPI** | 8090 | `/health`, `/readyz`, `/metrics` |

The decision service is a thin, fast HTTP surface over the same engine:
`POST /v1/underwriting/evaluate`, `POST /v1/parse/statement`,
`POST /v1/ai/explain`, `GET /v1/policies/current`. It publishes its own OpenAPI
spec at `/openapi.json`, caches policies and idempotency keys in Redis (falling
back to an in-process LRU), and never lets the LLM touch the decision.

```bash
cd engine-py
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8090 # → http://localhost:8090/docs
pytest # 22 tests incl. TS↔Python parity
```

## Quick start

```bash
git clone https://github.com/gavel-ai/gavel-ai.git
cd gavel-ai

# frontend (the demo and /try need nothing else)
npm install
npm run dev # → http://localhost:5173/try

# backend (only if you want the API + console persistence)
cd backend
npm install
cp../.env.example.env # add your Firebase service account
npm run dev # → http://localhost:8080
```

The browser tools (`/try`, `/demo`, `/tools`) run with **no backend and no credentials**. You
only need Firebase for the authenticated console and the REST API.

### Self-hosting

```bash
docker compose up --build
```

See `.env.example` for the full list of variables. Nothing is required except a Firebase
project if you want persistence; the engine and the browser demo work without it.

## The engine

`src/lib/engine/`, shared by the UI, and mirrored by `backend/src/services/underwriting-engine.ts`:

| File | What it does |
|---|---|
| `types.ts` | Contract shared with the API |
| `signals.ts` | Derives income, EMI ratio, volatility, savings ratio from raw transactions |
| `evaluate.ts` | Runs the policy: hard rejects → weighted score → decision band → credit limit |
| `statement-parser.ts` | Bank-statement text → transactions (date/amount/balance, Cr/Dr) |
| `pdf.ts` | PDF text extraction via pdf.js, in the browser |
| `samples.ts` | Synthetic applicants used by `/demo` |
| `export.ts` | One-page decision record PDF |

Policies are data, not code: `src/data/policies/pilot-acme.json` (and
`backend/src/config/policies/*.json`). Change a threshold, restart, and every decision changes
accordingly, with the same audit trail.

### Try the engine directly

```ts
import { analyze, DEFAULT_POLICY } from "@/lib/engine/evaluate";

const result = analyze({
  transactions: [
    { date: "2026-05-03", description: "SALARY CREDIT - INFOSYS LTD", amount: 44800, type: "credit", balance: 86762 },
    { date: "2026-05-07", description: "EMI BAJAJ FINANCE", amount: 8500, type: "debit", balance: 78262 },
  ],
  period: "6 months",
});

console.log(result.decision, result.risk_score, result.reasons);
```

## Privacy

`/try` parses the PDF in the tab. There is no upload endpoint involved, no analytics event
carrying the contents, and no server-side copy. Close the tab and the statement is gone. The
self-hosted deployment only talks to the Firebase project you configure.

## Testing

```bash
npm test # frontend: 18 tests (engine, parser, catalogue)
cd backend && npm test # backend: 65 tests (underwriting, routes, audit PDF)
cd engine-py && pytest # Python: 22 tests (incl. TS↔Python parity)
npm run lint # eslint, 0 errors
npx tsc --noEmit -p tsconfig.app.json
```

105 tests across three runtimes.

## Project layout

```
src/
  lib/engine/ deterministic underwriting engine + statement parser
  components/platform/ console screens used by the public tour
  pages/ routes (TryIt, Demo, Platform, tools/*)
  components/dashboard/ the real console tabs
backend/
  src/routes/ 43 REST routers, 238 handlers
  src/services/ underwriting engine, audit PDF, bureau, banking
  tests/ 65 tests
engine-py/ FastAPI decision service
  app/engine/ Python port of the same engine
  app/main.py HTTP surface, Redis cache, AI explain endpoint
  tests/ 22 tests incl. parity with the TypeScript engine
```

## Contributing

Issues and PRs welcome. The most useful contributions right now:

1. **Statement layouts**, more bank formats in `statement-parser.ts`, with a fixture.
2. **Policies**, real-world policy JSONs with the reasoning behind each threshold.
3. **OCR**, scanned statements are the one gap in `/try` today.
4. **Translations**: the UI is English-only.

Run `npm test` before opening a PR; CI runs lint, type-check, tests and build.

## Licence

MIT, see [LICENSE](LICENSE). Fork it, rebrand it, run it commercially. No attribution required
beyond keeping the licence file.

> **Not financial advice.** The engine is decision-support software. Lending decisions,
> regulatory obligations and the accuracy of any parsed statement remain the responsibility of
> the operator.
