# End-to-end tests

Two suites, both runnable locally and in CI. They exercise the **built** app and
the **running** services, not the source in isolation.

```bash
npm run build # the browser suite drives dist/, so build first

npm run test:e2e # 53 browser checks (headless Chromium)
npm run test:e2e:services # 24 service checks (boots FastAPI + Express)
```

## Browser suite, `browser-suite.cjs`

Serves `dist/` over HTTP and drives it with Puppeteer.

| Suite | Checks |
|---|---|
| `routes` | 19 public routes render, no console errors |
| `try` | real PDF → decision · signals · 24-rule trace · transaction table · decision PDF (asserted as a real `%PDF` blob) · reset · sample statement · non-PDF rejected · scanned PDF explained · corrupt PDF fails gracefully |
| `demo` | 6 applicants · KPIs · row selection · decision trace · approve/decline updates the KPI · re-run · decision PDF · filter · search · reset |
| `nav` | navbar CTAs route correctly · Platform dropdown lists 9 modules · dropdown navigates |
| `auth` | protected route redirects to `/platform` · `/dashboard` renders without credentials |
| `tools` | all 20 calculators render and produce output |
| `mobile` | no horizontal overflow at 390×844 on `/`, `/try`, `/demo`, `/platform` |

Environment:

| Variable | Default | Purpose |
|---|---|---|
| `E2E_ROOT` | `../dist` | build directory to serve |
| `E2E_PORT` | `4300` | port for the static server |
| `CHROME_PATH` | Puppeteer default | browser binary |
| `E2E_REPORT` | `e2e/e2e-report.json` | JSON report path |

Fixtures in `e2e/fixtures/`:

- `statement-valid.pdf`, 8 transactions, HDFC-style, with Cr/Dr and a running balance
- `statement-scan.pdf`, image only, no text layer (the OCR gap)
- `statement-corrupt.pdf`, 37 bytes of junk
- `not-a-statement.txt`, wrong file type

## Service suite, `service-suite.py`

Boots both backends as real HTTP servers and shuts them down.

**FastAPI decision service** (`engine-py/`, port 8098): boots · `/health` · `/readyz`
cache backend · `/metrics` · OpenAPI · policy endpoint · evaluate · `E001` on short
history · parse · AI explain · idempotent replay · `409` on key reuse with a new body ·
`422` on invalid payload.

**Express gateway** (`backend/`, port 8099): boots without Firebase credentials · `/health` ·
Swagger at `/docs` · auth enforced on 5 protected routes · `404` JSON · public route
reachable.

> The Express gateway boots without Firebase but any route that touches Firestore
> will fail until credentials are supplied. The suite asserts the perimeter
> (auth gates, routing, 404s), which is what can be verified without a project.

## CI

`.github/workflows/ci.yml` runs both suites in the `e2e` job, using the runner's
preinstalled Chrome via `CHROME_PATH=/usr/bin/google-chrome`, and uploads
`e2e/e2e-report.json` as an artefact.
