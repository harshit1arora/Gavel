# Gavel operations

## Promote a release

The GitHub Actions workflow **Promote verified Gavel release** runs on manual dispatch from main. It pushes three Linux amd64 images to GHCR, records their digests and the Redis digest in release.json, and deploys to staging. Production consumes the same workflow artifact after staging verification succeeds. The worker uses the gateway digest. GitHub environments can require a reviewer for the production job.

Configure separate Linux deployment hosts with self-hosted runner labels `gavel-staging` and `gavel-production`, Docker Engine with Compose v2.24.4 or newer, Python 3.10+, and a sandbox-capable Chrome installation for the runner user. Grant the workflow GHCR package access. Each GitHub environment needs these variables:

| Variable | Value |
| --- | --- |
| GAVEL_ENV_FILE | Absolute path on the host to its protected Compose environment file |
| GAVEL_RELEASE_STATE | Persistent, writable directory outside the checkout, unique to the deployment |
| GAVEL_PUBLIC_URL | HTTPS origin serving this deployment |
| CHROME_PATH | Absolute path to the Chrome executable |

Use separate Firebase projects and provider credentials for each environment. Set the six VITE_FIREBASE_* public web settings and Firebase Admin credentials in each host's environment file. The gateway serves the frontend settings at runtime. Route the public origin to the Compose frontend. Configure its origin in ALLOWED_ORIGINS. The gateway and decision service must share GAVEL_API_KEY when private engine access is enabled. Worker verification requires Firestore access. Set up real provider credentials only on the intended host.

The first deployment expects an unused Compose project and available application ports. For an existing unmanaged installation, stage a separate host, verify the new release and plan the traffic cutover. The default Compose project name is gavel. First releases have no predecessor. A failed first release stops the new stack and preserves volumes.

The deployer serializes changes under a host lock, persists a pending marker, checks all running image references, worker readiness and a golden decision through FastAPI, then uploads the bundled synthetic PDF at the public /try page. The page must report APPROVE, eight transactions and monthly income of ₹44,803. Both the public gateway and frontend must report the expected Git revision. current.json records the verified revision and predecessor. history.jsonl records recovery and verification outcomes. A failed check restores and verifies the previous bundle. A failed restoration leaves the pending marker in place for recovery. A subsequent deployment resolves pending work first.

For an explicit rollback, set the same host variables, use the release checkout with npm dependencies installed, and run `python3 release/deploy.py --rollback`. Keep previous GHCR digests and the host state directory available. Rollback restores application images and Compose configuration. Firestore records, Redis data, secrets and other external state retain their current values.

## Settlement review

Open **Dashboard → Settlement Review** with a Firebase identity carrying the signed `billingAdmin: true` claim. Choose a Razorpay settlement date. The gateway pages through the combined settlement report and checks settled payment and refund rows attributable to that organization. It uses gross amounts in paise, separate from provider fees and taxes. The page shows discrepancies between settlement evidence, the local payment/refund ledger and the gross installment allocation. Unsettled rows, unsupported transaction types and rows without verifiable tenant ownership are excluded.

Each discrepancy has a stable ID, so rescanning the date updates its queue entry. **Apply ledger repair** records the provider reference, actor, reason and discrepancies in the audit log. If a capture lacks an identifiable installment, inspect the loan and enter the matching installment number. A previously paid legacy row can be linked when its amount matches. Conflicting allocations, multiple candidate schedules, currency conflicts and refunds without a usable capture remain open for investigation. The repair changes local records only. It never submits a provider refund or moves money.

## Background jobs

Compose starts a separate worker. For Kubernetes, deploy k8s/base/worker.yaml with the same published image as the gateway. Disable the prior gateway version's in-process timers before bringing the new workers online during an upgrade. All worker replicas for one environment must share the same Firestore project.

Firestore transactions claim one active slot per job. Collection checks run on six-hour UTC boundaries, portfolio classification at 06:00 UTC, and webhooks poll in thirty-second slots. Initial startup processes the most recent due slot. After downtime each job runs one current-state pass. The run record stores the earliest due slot it covers. This avoids sending reminders repeatedly for the same current loan state.

Inspect active tokens and execution results with `docker compose exec worker node dist/worker.js status`. A failure records needs_review. An abrupt process exit can leave a running claim. Both hold subsequent executions of that job because an external notification might already have been sent. Stop the original worker, inspect external effects, then use another worker or a one-off container:

```sh
docker compose run --rm worker node dist/worker.js recover collections TOKEN complete "Verified the collection notifications"
```

Use retry in place of complete only after determining that retrying the work is appropriate. Recovery checks the exact active token and appends a durable recovery record. Monitor job_state and its runs subcollections for failures or old running claims.

## Policy replay

Open **Dashboard → Policy Replay**, load the pilot policy, edit the candidate JSON and select **Replay historical decisions**. The gateway runs the candidate through the same decision engine used for live gateway underwriting using each tenant audit record's stored signals. It compares the result to the original recorded verdict, score, limit and rule trace. Approved exposure sums limits for APPROVE decisions only. Expand an audit ID to inspect the changed rules, weights, actions and configuration. Replay is read-only and never charges quota or publishes the draft.

New underwriting audits include the policy snapshot. Older records can use the bundled baseline when its hash matches. Otherwise, replay still compares recorded outcomes and rule traces, with unavailable historical policy settings marked unknown. Records without sufficient stored signals or results are counted as skipped. Changes to signal extraction itself require a separate analysis using the original transactions.

## Repeat the tests

Run npm test in the repository root and backend. Set FIRESTORE_EMULATOR_HOST to a loopback Firestore emulator address and FIREBASE_PROJECT_ID to a disposable demo project for the gateway integration tests. CI starts the pinned emulator automatically. The integration tests exercise worker contention, recovery, accounting transactions, tenant isolation, report ingestion and operator HTTP routes. Run `python3 -m unittest discover -s release -p 'test_*.py'` for rollback and interrupted deployment tests. The browser and service suites are described in e2e/README.md.
