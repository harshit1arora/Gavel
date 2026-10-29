/**
 * The single source of truth for what Gavel actually ships.
 *
 * Every entry here maps 1:1 to a real surface inside the product (a tab in the
 * Enterprise Console) and to real backend routers in `backend/src/routes`.
 * The public product tour (`/platform`), the homepage showcase and the navbar
 * all read from this file, so adding a module in one place shows it everywhere.
 *
 * Rule: no module goes in here unless it has a route in the app AND an API.
 * Marketing cannot invent a product that the console does not render.
 */

export type ModuleId =
  | "underwriting"
  | "portfolio"
  | "disbursement"
  | "collections"
  | "sentinel"
  | "compliance"
  | "analytics"
  | "developer";

export interface PlatformModule {
  id: ModuleId;
  slug: string;
  /** Full product name, used in headings. */
  name: string;
  /** Two-to-three word label for rails and nav menus. */
  railLabel: string;
  /** One line, used in the rail and on cards. */
  oneLiner: string;
  /** Eyebrow above the module headline. */
  eyebrow: string;
  /** The claim the module makes. */
  headline: string;
  /** Two sentences of substance for the module page. */
  summary: string;
  /** What the operator can actually do in the screen. */
  capabilities: string[];
  /** Product facts, not vanity metrics. */
  facts: { value: string; label: string }[];
  /** Real endpoints backing this surface. */
  endpoints: { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string }[];
  /** The spreadsheet / vendor / manual process this replaces. */
  replaces: string;
  /** Console tab this maps to, for internal cross-reference. */
  consoleTab: string;
}

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: "underwriting",
    slug: "underwriting",
    name: "Underwriting & Decisioning",
    railLabel: "Underwriting",
    oneLiner: "Score every file against your policy, with the reasoning attached.",
    eyebrow: "MODULE 01",
    headline: "Every decision, and the exact reason behind it.",
    summary:
      "Applications stream into a single queue, get parsed, scored and routed by your policy, auto-approve, manual review or decline. Each outcome carries the full decision trace: which rule fired, what the bank statement showed, which bureau field moved the score.",
    capabilities: [
      "Live underwriting queue with risk score, FOIR and bureau pull on one row",
      "Decision trace per file, every rule fire, pass, warn and hard reject",
      "Policy editor with versioned thresholds and per-product overrides",
      "Bank statement parsing into a cash-flow picture the engine can score",
      "AI copilot that drafts the credit note from the trace, not from vibes",
    ],
    facts: [
      { value: "1.24s", label: "Median decision time" },
      { value: "40+", label: "Signals per file" },
      { value: "100%", label: "Decisions with a trace" },
    ],
    endpoints: [
      { method: "POST", path: "/v1/underwriting/evaluate" },
      { method: "POST", path: "/v1/parse/bank-statement" },
      { method: "POST", path: "/v1/copilot/credit-note" },
    ],
    replaces: "A spreadsheet, a WhatsApp group and one credit manager's memory.",
    consoleTab: "Queue",
  },
  {
    id: "portfolio",
    slug: "portfolio",
    name: "Portfolio & Servicing",
    railLabel: "Portfolio",
    oneLiner: "One book of record for every rupee you have disbursed.",
    eyebrow: "MODULE 02",
    headline: "The whole book, on one screen.",
    summary:
      "Loans move through sanction, disbursement, active and closed with their repayment schedules attached. Portfolio view rolls it up: AUM, outstanding, NPA ratio, stage funnel and average ticket, computed from the ledger, not re-keyed monthly.",
    capabilities: [
      "Loan-level ledger with stage, DPD and outstanding balance",
      "Portfolio roll-ups: AUM, NPA %, active vs closed, average ticket",
      "Stage funnel showing where files stall and for how long",
      "CSV export of any filtered view for the credit committee",
      "Full loan drill-down from portfolio total to single EMI",
    ],
    facts: [
      { value: "Loan-level", label: "Ledger granularity" },
      { value: "Live", label: "AUM recompute" },
      { value: "1 click", label: "Committee export" },
    ],
    endpoints: [
      { method: "GET", path: "/v1/loans" },
      { method: "GET", path: "/v1/portfolio/metrics" },
      { method: "GET", path: "/v1/repayments/schedule" },
    ],
    replaces: "A month-end reconciliation between the LMS and a finance workbook.",
    consoleTab: "Loan Portfolio",
  },
  {
    id: "disbursement",
    slug: "disbursements",
    name: "Disbursements & Banking Rails",
    railLabel: "Disbursements",
    oneLiner: "Money out, reconciled: Razorpay, Setu and NEFT in one queue.",
    eyebrow: "MODULE 03",
    headline: "Payouts that fail loudly, not silently.",
    summary:
      "Approved loans enter a disbursement queue with the beneficiary account verified, the rail selected and a UTR assigned on success. Failures land back in the queue with the bank's reason code instead of disappearing into an ops inbox.",
    capabilities: [
      "Payout queue with rail, beneficiary, UTR and live status",
      "Penny-drop account verification before money moves",
      "Failure reasons surfaced with one-click retry",
      "Daily reconciliation against the banking partner's settlement file",
      "Every payout written to the immutable audit log",
    ],
    facts: [
      { value: "3 rails", label: "Razorpay · Setu · NEFT" },
      { value: "UTR-level", label: "Reconciliation" },
      { value: "0", label: "Unlogged payouts" },
    ],
    endpoints: [
      { method: "POST", path: "/v1/disbursement/initiate" },
      { method: "GET", path: "/v1/disbursements/queue" },
      { method: "POST", path: "/v1/bank-accounts/verify" },
    ],
    replaces: "A banking portal, a maker-checker sheet and a UTR column in Excel.",
    consoleTab: "Disbursements",
  },
  {
    id: "collections",
    slug: "collections",
    name: "Collections & Repayment",
    railLabel: "Collections",
    oneLiner: "Bucket-wise recovery worklists that update the moment money lands.",
    eyebrow: "MODULE 04",
    headline: "Chase the right account, before it ages.",
    summary:
      "Every active loan sits in a DPD bucket that recomputes nightly. The worklist tells an agent who to call today, what is owed and what the last contact was, and a successful payment clears the row without anyone updating a tracker.",
    capabilities: [
      "DPD buckets 0–30 / 31–60 / 61–90 / 90+ with exposure per bucket",
      "Agent worklists with next action, owner and last contact",
      "Payment posting that marks the EMI paid and re-buckets the loan",
      "Automated reminders over SMS and email, template-driven",
      "NPA alerts to Slack the day an account crosses the line",
    ],
    facts: [
      { value: "4", label: "Live DPD buckets" },
      { value: "Auto", label: "Re-bucketing on payment" },
      { value: "Same-day", label: "NPA escalation" },
    ],
    endpoints: [
      { method: "GET", path: "/v1/collections/worklist" },
      { method: "POST", path: "/v1/payments/record" },
      { method: "POST", path: "/v1/communications/send" },
    ],
    replaces: "A collections telecaller list rebuilt by hand every Monday.",
    consoleTab: "Collections",
  },
  {
    id: "sentinel",
    slug: "sentinel",
    name: "Sentinel Early Warning",
    railLabel: "Sentinel EWS",
    oneLiner: "Signals that fire before a loan turns NPA.",
    eyebrow: "MODULE 05",
    headline: "The warning arrives before the bounce.",
    summary:
      "Sentinel watches the accounts you have already disbursed: salary credits that stop, bureau enquiries that spike, GST filings that slip, cheque bounces that repeat. Each signal is scored, attributed to a loan and given a recommended action.",
    capabilities: [
      "Continuous monitoring of disbursed accounts, not just applicants",
      "Signal feed with severity, loan attribution and evidence",
      "Composite early-warning score per borrower",
      "Recommended action routed to the collections owner",
      "Signal history that feeds back into underwriting thresholds",
    ],
    facts: [
      { value: "12", label: "Signal types" },
      { value: "Daily", label: "Re-scan cadence" },
      { value: "Loan-level", label: "Attribution" },
    ],
    endpoints: [
      { method: "GET", path: "/v1/sentinel/signals" },
      { method: "GET", path: "/v1/sentinel/score/:loanId" },
      { method: "POST", path: "/v1/slack/alert" },
    ],
    replaces: "Finding out at 90 DPD that the salary stopped in month two.",
    consoleTab: "Sentinel EWS",
  },
  {
    id: "compliance",
    slug: "compliance",
    name: "RBI Compliance Engine",
    railLabel: "RBI Compliance",
    oneLiner: "SMA/NPA classification, provisioning and LAR, computed, not copy-pasted.",
    eyebrow: "MODULE 06",
    headline: "The regulatory report is a query, not a quarter.",
    summary:
      "Classification runs off the same ledger the ops team works in, so SMA-0/1/2 and NPA sub-buckets always agree with the book. Provisioning is applied per bucket, and the LAR export is generated with the timestamp and the operator attached.",
    capabilities: [
      "SMA-0 / SMA-1 / SMA-2 and NPA sub-bucket classification",
      "Bucket-wise provisioning at your policy rates",
      "LAR and MIS exports with generation stamp and operator trail",
      "Fair-practice checks on notices, charges and recovery messaging",
      "Immutable audit log for every classification change",
    ],
    facts: [
      { value: "SMA + NPA", label: "Full classification" },
      { value: "Audit-stamped", label: "Every export" },
      { value: "Ledger-derived", label: "No re-keying" },
    ],
    endpoints: [
      { method: "GET", path: "/v1/rbi/classification" },
      { method: "POST", path: "/v1/rbi/provisioning" },
      { method: "GET", path: "/v1/reports/lar" },
    ],
    replaces: "A quarterly scramble to reconcile four versions of the same number.",
    consoleTab: "RBI Compliance",
  },
  {
    id: "analytics",
    slug: "analytics",
    name: "MIS, Analytics & ROI",
    railLabel: "MIS & ROI",
    oneLiner: "Board-ready numbers from the ledger your ops team works in.",
    eyebrow: "MODULE 07",
    headline: "From application to rupee, without a second spreadsheet.",
    summary:
      "Turnaround time, approval rate, funnel conversion, cost per file and ROI per product, all derived from the same events that drive the queue. What the board sees and what the credit team sees cannot drift apart.",
    capabilities: [
      "TAT and approval-rate trends by product and by underwriter",
      "Funnel conversion from application to disbursement",
      "Cost per file and ROI per product line",
      "MIS packs exportable to CSV and PDF",
      "API usage and quota analytics per org",
    ],
    facts: [
      { value: "TAT", label: "By product & user" },
      { value: "ROI", label: "Per product line" },
      { value: "1 source", label: "Of truth" },
    ],
    endpoints: [
      { method: "GET", path: "/v1/reports/mis" },
      { method: "GET", path: "/v1/roi/summary" },
      { method: "GET", path: "/v1/analytics/usage" },
    ],
    replaces: "Three analysts rebuilding the same dashboard every month.",
    consoleTab: "MIS Reports",
  },
  {
    id: "developer",
    slug: "developer",
    name: "API Gateway & Developer Console",
    railLabel: "Developer API",
    oneLiner: "The whole platform, addressable over REST.",
    eyebrow: "MODULE 08",
    headline: "Everything on screen is an endpoint first.",
    summary:
      "The console is a client of the same API you get. Keys are scoped per org, quota is enforced per key, and every webhook is HMAC-signed with exponential-backoff retry, so the platform slots into an existing LMS instead of replacing it.",
    capabilities: [
      "Per-org API keys with quota meters and rotation",
      "HMAC-signed webhooks with exponential-backoff retry queue",
      "Idempotency keys on every mutating endpoint",
      "OpenAPI reference, sandbox keys and copy-paste snippets",
      "Per-key usage analytics and error breakdown",
    ],
    facts: [
      { value: "60+", label: "REST endpoints" },
      { value: "HMAC", label: "Signed webhooks" },
      { value: "Per-key", label: "Quota enforcement" },
    ],
    endpoints: [
      { method: "POST", path: "/v1/apikeys" },
      { method: "GET", path: "/v1/analytics/usage" },
      { method: "POST", path: "/v1/webhooks/razorpay" },
    ],
    replaces: "A vendor that only integrates by email and a quarterly release.",
    consoleTab: "Developers",
  },
];

export const getModuleBySlug = (slug?: string): PlatformModule =>
  PLATFORM_MODULES.find((m) => m.slug === slug) ?? PLATFORM_MODULES[0];
