/**
 * Translation source of truth.
 *
 * The English strings double as the keys: `t("nav.try")` looks the key up in
 * the active language and falls back to the English value if a translation is
 * missing. Adding a language means adding one JSON file, nothing else.
 */

export const EN = {
  // Navigation
  "nav.platform": "Platform",
  "nav.lenders": "For lenders",
  "nav.borrowers": "For borrowers",
  "nav.demo": "Demo",
  "nav.tools": "Tools",
  "nav.pricing": "Pricing",
  "nav.opensource": "Open source",
  "nav.tryFree": "Try it free",
  "nav.liveDemo": "Live demo",
  "nav.language": "Language",

  // Hero
  "hero.badge": "RBI Compliant",
  "hero.badgeSub": "Digital Lending Guidelines 2022",
  "hero.title1": "The AI Underwriting",
  "hero.title2": "Layer for Lenders",
  "hero.title3": "with",
  "hero.sub":
    "Drop a bank statement, get a deterministic credit decision in under a second, with every rule that fired attached.",
  "hero.cta1": "Try it with your statement",
  "hero.cta2": "See live demo",
  "hero.trust1": "RBI Compliant Setup",
  "hero.trust2": "Deterministic Decisions",
  "hero.trust3": "Zero Data Lock-in",

  // Try
  "try.title1": "Upload a statement.",
  "try.title2": "Get a real decision.",
  "try.privacy": "Runs entirely in your browser. The PDF never leaves this tab.",
  "try.sub":
    "This is the same deterministic engine that powers the platform: it reads the transactions, derives the signals, runs the policy rules and shows you exactly why it decided what it decided.",
  "try.dropTitle": "Drop your bank statement PDF here",
  "try.dropSub": "6 months is ideal. HDFC, ICICI, SBI, Axis, Kotak, IDFC and most Indian formats.",
  "try.choose": "Choose a PDF",
  "try.noStatement": "No statement handy?",
  "vision.title": "This statement has no text layer",
  "vision.body": "It is a scan or a photograph, so the browser cannot read it directly. Gemini 2.5 Flash can read the page, including handwriting, and hand the transactions to the same engine. It takes about ten seconds.",
  "vision.cta": "Read it with AI",
  "vision.reading": "Reading the page",
  "vision.cancel": "Use a different file",
  "vision.note": "The file goes to the decision service for this step only.",
  "try.sample": "Run a sample statement",
  "try.sampleRisk": "Try a risky applicant",
  "try.stage1": "Reading the PDF text layer",
  "try.stage2": "Extracting transactions",
  "try.stage3": "Scoring against the policy",
  "try.limit": "Sanction limit",
  "try.why": "Why",
  "try.rules": "Policy rules",
  "try.txns": "Extracted transactions",
  "try.download": "Download decision record (PDF)",
  "try.another": "Try another statement",
  "try.seeConsole": "See this in the console",
  "try.audit": "Audit id",
  "try.auditNote": "The same statement and policy will always reproduce this exact decision.",

  // Signals
  "signal.income": "Monthly income",
  "signal.emiRatio": "EMI ratio",
  "signal.emis": "Active EMIs",
  "signal.salary": "Salary credits",
  "signal.avgBalance": "Avg balance",
  "signal.minBalance": "Min balance",
  "signal.savings": "Savings ratio",
  "signal.computedIn": "Computed in",

  // Demo
  "demo.ribbon": "Demo console: synthetic applicants, real engine, nothing saved.",
  "demo.reset": "Reset queue",
  "demo.tryOwn": "Try your own statement",
  "demo.title": "Underwriting queue",
  "demo.sub": "Six applicants, scored live by the engine. Open a file to see the decision trace.",
  "demo.live": "ENGINE v2.1.0 LIVE",
  "demo.inQueue": "In queue",
  "demo.approved": "Approved",
  "demo.review": "Manual review",
  "demo.rejected": "Rejected",
  "demo.sanctioned": "Sanctioned",
  "demo.search": "Search applicant or ID",
  "demo.all": "All",
  "demo.pending": "Pending",
  "demo.requested": "Requested",
  "demo.riskScore": "Risk score",
  "demo.signals": "Signals",
  "demo.trace": "Decision trace",
  "demo.approve": "Approve",
  "demo.decline": "Decline",
  "demo.rerun": "Re-run engine",
  "demo.pdf": "Decision PDF",
  "demo.overridden": "Overridden by",
  "demo.overriddenNote": "in the real console this writes an audit log entry.",
  "demo.cta1": "Run your own bank statement",
  "demo.cta2": "Tour the other seven modules",
  "demo.empty": "No applications match that filter.",

  // Platform
  "platform.eyebrow": "The Platform",
  "platform.title1": "Eight modules.",
  "platform.title2": "One ledger underneath.",
  "platform.modules": "Modules",
  "platform.capabilities": "What the operator can do",
  "platform.backedBy": "Backed by",
  "platform.replaces": "What this replaces",
  "platform.next": "Next",
  "platform.cta1": "Try it with your own statement",
  "platform.cta2": "Try the sandbox",

  // Footer
  "footer.product": "Product",
  "footer.tools": "Tools",
  "footer.company": "Company",
  "footer.legal": "Legal",
  "footer.rights": "All rights reserved.",

  // Common
  "common.free": "Free",
  "common.english": "English",
} as const;

export type TranslationKey = keyof typeof EN;
