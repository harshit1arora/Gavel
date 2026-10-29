import { useCallback, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Download,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { extractPdfText } from "@/lib/engine/pdf";
import { parseStatementText, type ParsedStatement } from "@/lib/engine/statement-parser";
import { analyze, inr } from "@/lib/engine/evaluate";
import { downloadDecisionPdf } from "@/lib/engine/export";
import { SAMPLE_APPLICANTS, sampleStatementText } from "@/lib/engine/samples";
import { extractWithVision, visionConfigured } from "@/lib/engine/vision";
import type { DecisionResult } from "@/lib/engine/types";
import { useT } from "@/i18n/LanguageProvider";

type Stage = "idle" | "reading" | "parsing" | "deciding" | "done" | "error";

const STAGES: { id: Stage; label: string }[] = [
  { id: "reading", label: "Reading the PDF text layer" },
  { id: "parsing", label: "Extracting transactions" },
  { id: "deciding", label: "Scoring against the policy" },
];

const decisionStyle: Record<string, { color: string; bg: string; icon: typeof CheckCircle }> = {
  APPROVE: { color: "#10B981", bg: "rgba(16,185,129,0.1)", icon: CheckCircle },
  REVIEW: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: AlertTriangle },
  REJECT: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: XCircle },
};

export default function TryIt() {
  const t = useT();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedStatement | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [showAllTxns, setShowAllTxns] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [visionBusy, setVisionBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = useCallback(async (text: string, label: string) => {
    setError(null);
    setFileName(label);
    setStage("parsing");

    // Give the UI a frame to paint the progress state, the parse is synchronous.
    await new Promise((r) => setTimeout(r, 60));
    const parsedStatement = parseStatementText(text);
    setParsed(parsedStatement);

    setStage("deciding");
    await new Promise((r) => setTimeout(r, 60));
    const decision = analyze({
      transactions: parsedStatement.transactions,
      period: parsedStatement.period,
    });
    setResult(decision);
    setStage("done");
  }, []);

  const runVision = useCallback(async () => {
    if (!scanFile) return;
    setVisionBusy(true);
    setError(null);
    try {
      const vision = await extractWithVision(scanFile);
      if (!vision.transactions.length) {
        throw new Error(vision.notes || "The AI reader found no transactions on this page.");
      }
      const parsedStatement: ParsedStatement = {
        transactions: vision.transactions.map((t) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          balance: t.balance ?? undefined,
        })),
        bank: vision.bank ?? undefined,
        period: vision.period ?? undefined,
        confidence: vision.confidence,
        lines_scanned: vision.transactions.length,
        warnings: [
          vision.handwritten
            ? "Read from handwriting by Gemini 2.5 Flash. Check the rows below before relying on this."
            : "This statement had no text layer, so it was read by Gemini 2.5 Flash. Check the rows below.",
        ],
      };
      setParsed(parsedStatement);
      setStage("deciding");
      await new Promise((r) => setTimeout(r, 60));
      const decision = analyze({
        transactions: parsedStatement.transactions,
        period: parsedStatement.period,
      });
      setResult(decision);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The AI reader could not process that file.");
      setStage("error");
    } finally {
      setVisionBusy(false);
    }
  }, [scanFile]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!/\.pdf$/i.test(file.name)) {
        setError("Please upload a PDF bank statement.");
        setStage("error");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("That file is larger than 20 MB. Upload a single statement, not a bundle.");
        setStage("error");
        return;
      }
      setStage("reading");
      setError(null);
      setFileName(file.name);
      try {
        const { text } = await extractPdfText(file);
        if (!text.trim()) {
          // No text layer: offer the vision path instead of dead-ending.
          setScanFile(file);
          setStage("idle");
          return;
        }
        const parsedStatement = parseStatementText(text);
        if (!parsedStatement.transactions.length) {
          setScanFile(file);
          setStage("idle");
          return;
        }
        await run(text, file.name);
      } catch (e) {
        setError(e instanceof Error ? e.message: "Could not read that PDF.");
        setStage("error");
      }
    },
    [run],
  );

  const loadSample = useCallback(
    async (index = 0) => {
      const applicant = SAMPLE_APPLICANTS[index];
      await run(sampleStatementText(applicant), `${applicant.name} (sample statement)`);
    },
    [run],
  );

  const reset = () => {
    setStage("idle");
    setParsed(null);
    setResult(null);
    setError(null);
    setFileName("");
    setScanFile(null);
  };

  const busy = stage === "reading" || stage === "parsing" || stage === "deciding";
  const style = result ? decisionStyle[result.decision]: null;
  const DecisionIcon = style?.icon ?? CheckCircle;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Try Gavel, upload a bank statement, get a real credit decision</title>
        <meta
          name="description"
          content="Upload a bank statement PDF and get a deterministic underwriting decision in your browser. Free, open source, no signup, nothing uploaded."
        />
      </Helmet>
      <Navbar />

      <main className="pt-32 pb-24">
        <section className="container mx-auto px-6">
          <div className="max-w-[760px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 mb-5">
              <Lock size={12} className="text-primary" />
              <span className="font-['DM_Sans'] text-[11.5px] text-muted-foreground">
                {t("try.privacy")}
              </span>
            </div>
            <h1 className="font-['DM_Sans'] font-bold text-[38px] md:text-[50px] leading-[1.06] tracking-[-0.02em] text-foreground">
              {t("try.title1")}
              <br />
              {t("try.title2")}
            </h1>
            <p className="font-['DM_Sans'] text-[16px] leading-[1.65] text-muted-foreground mt-5 max-w-[560px]">
              {t("try.sub")}
            </p>
          </div>
        </section>

        {/* ── upload ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-6 mt-10">
          {scanFile && stage === "idle" ? (
            <div className="max-w-[860px] mb-5">
              <div className="g-card p-6 border-l-[3px]" style={{ borderLeftColor: "var(--amber, #F59E0B)" }}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-amber-500">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-['DM_Sans'] font-semibold text-[15px] text-foreground">
                      {t("vision.title")}
                    </div>
                    <p className="font-['DM_Sans'] text-[13px] text-muted-foreground mt-1 leading-relaxed">
                      {t("vision.body")}
                    </p>
                    <p className="font-['DM_Sans'] text-[12px] text-muted-foreground/80 mt-2">
                      {scanFile.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <button
                        onClick={() => void runVision()}
                        disabled={visionBusy || !visionConfigured()}
                        className="g-btn g-btn-primary !h-9 !px-4 !text-[13px]"
                      >
                        {visionBusy ? (
                          <>
                            <Loader2 size={13} className="animate-spin" /> {t("vision.reading")}
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} /> {t("vision.cta")}
                          </>
                        )}
                      </button>
                      <button onClick={reset} className="g-btn g-btn-ghost !h-9 !px-3 !text-[13px]">
                        {t("vision.cancel")}
                      </button>
                      <span className="font-['DM_Sans'] text-[11.5px] text-muted-foreground/70">
                        {t("vision.note")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {stage === "idle" || stage === "error" ? (
            <div className="max-w-[860px]">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleFile(file);
                }}
                className={`rounded-[12px] border-2 border-dashed p-10 text-center transition-colors ${
                  dragging ? "border-primary bg-primary/5": "border-border bg-surface"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Upload size={20} className="text-primary" />
                </div>
                <h2 className="font-['DM_Sans'] font-semibold text-[17px] text-foreground">
                  {t("try.dropTitle")}
                </h2>
                <p className="font-['DM_Sans'] text-[13px] text-muted-foreground mt-1.5 mb-5">
                  {t("try.dropSub")}
                </p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="g-btn g-btn-primary"
                >
                  {t("try.choose")}
                </button>

                {error ? (
                  <div className="mt-5 flex items-start gap-2 text-left max-w-[520px] mx-auto rounded-[6px] border border-destructive/30 bg-destructive/5 px-3 py-2">
                    <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
                    <span className="font-['DM_Sans'] text-[12px] text-foreground/80">{error}</span>
                  </div>
                ): null}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <span className="font-['DM_Sans'] text-[13px] text-muted-foreground">
                  {t("try.noStatement")}
                </span>
                <button
                  onClick={() => void loadSample(0)}
                  className="g-btn g-btn-secondary !h-9 !px-3.5 !text-[13px]"
                >
                  <Sparkles size={13} className="text-primary" /> {t("try.sample")}
                </button>
                <button
                  onClick={() => void loadSample(1)}
                  className="g-btn g-btn-ghost !h-9 !px-3.5 !text-[13px] border border-border"
                >
                  {t("try.sampleRisk")}
                </button>
              </div>
            </div>
          ): null}

          {/* ── progress ─────────────────────────────────────────── */}
          {busy ? (
            <div className="max-w-[860px] g-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Loader2 size={16} className="text-primary animate-spin" />
                <span className="font-['DM_Sans'] text-[14px] text-foreground">{fileName}</span>
              </div>
              <div className="space-y-3">
                {STAGES.map((s) => {
                  const order = STAGES.findIndex((x) => x.id === s.id);
                  const current = STAGES.findIndex((x) => x.id === stage);
                  const done = order < current;
                  const active = order === current;
                  return (
                    <div key={s.id} className="flex items-center gap-2.5">
                      {done ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ): active ? (
                        <Loader2 size={14} className="text-primary animate-spin" />
                      ): (
                        <div className="w-3.5 h-3.5 rounded-full border border-border" />
                      )}
                      <span
                        className={`font-['DM_Sans'] text-[13px] ${
                          done || active ? "text-foreground": "text-muted-foreground/60"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ): null}
        </section>

        {/* ── result ─────────────────────────────────────────────── */}
        {stage === "done" && result && parsed ? (
          <section className="container mx-auto px-6 mt-10">
            <div className="max-w-[1000px] space-y-5">
              {/* headline */}
              <div
                className="g-card overflow-hidden"
                style={{ borderLeft: `3px solid ${style?.color ?? "var(--border)"}` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: style?.bg }}
                    >
                      <DecisionIcon size={22} style={{ color: style?.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-['DM_Sans'] font-bold text-[22px] tracking-tight"
                          style={{ color: style?.color }}
                        >
                          {result.decision}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[12px] text-muted-foreground">
                          risk {result.risk_score}/100
                        </span>
                      </div>
                      <div className="font-['DM_Sans'] text-[13px] text-muted-foreground mt-0.5">
                        {fileName} · {parsed.transactions.length} transactions
                        {parsed.bank ? ` · ${parsed.bank}`: ""}
                        {parsed.period ? ` · ${parsed.period}`: ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-['DM_Sans'] text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Sanction limit
                    </div>
                    <div className="font-['JetBrains_Mono'] tnum font-bold text-[26px] tracking-tight text-foreground">
                      {inr(result.credit_limit)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 px-6 pb-5">
                  <button
                    onClick={() => downloadDecisionPdf(result, { applicant: fileName })}
                    className="g-btn g-btn-primary !h-10 !px-4 !text-[13px]"
                  >
                    <Download size={14} /> {t("try.download")}
                  </button>
                  <button
                    onClick={reset}
                    className="g-btn g-btn-secondary !h-10 !px-4 !text-[13px]"
                  >
                    <RefreshCw size={14} /> {t("try.another")}
                  </button>
                  <Link
                    to="/demo"
                    className="inline-flex items-center gap-2 text-muted-foreground font-['DM_Sans'] font-semibold text-[13px] px-2 py-2.5 hover:text-foreground"
                  >
                    {t("try.seeConsole")} <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {result.error ? (
                <div className="rounded-[8px] border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                  <div className="font-['DM_Sans'] text-[13px] font-semibold text-foreground">
                    {result.error.message}
                  </div>
                  <div className="font-['DM_Sans'] text-[12px] text-muted-foreground mt-1">
                    {result.error.detail}
                  </div>
                </div>
              ): null}

              {parsed.warnings.length > 0 ? (
                <div className="rounded-[8px] border border-border bg-surface px-4 py-3 space-y-1">
                  {parsed.warnings.map((w) => (
                    <div key={w} className="flex items-start gap-2">
                      <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="font-['DM_Sans'] text-[12px] text-muted-foreground">{w}</span>
                    </div>
                  ))}
                </div>
              ): null}

              {/* signals */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t("signal.income"), value: inr(result.signals.monthly_income) },
                  { label: t("signal.emiRatio"), value: `${(result.signals.emi_ratio * 100).toFixed(1)}%` },
                  { label: t("signal.emis"), value: String(result.signals.emi_count) },
                  { label: t("signal.salary"), value: `${result.signals.salary_count} of ${result.signals.months_of_data}` },
                  { label: t("signal.avgBalance"), value: inr(result.signals.avg_residual) },
                  { label: t("signal.minBalance"), value: inr(result.signals.min_balance) },
                  { label: t("signal.savings"), value: `${(result.signals.savings_ratio * 100).toFixed(0)}%` },
                  { label: t("signal.computedIn"), value: `${result.processing_time_ms} ms` },
                ].map((s) => (
                  <div key={s.label} className="g-card !rounded-[10px] px-4 py-3">
                    <div className="font-['DM_Sans'] text-[11px] text-muted-foreground">{s.label}</div>
                    <div className="font-['JetBrains_Mono'] tnum text-[15px] font-bold text-foreground mt-0.5">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* reasons */}
              {result.reasons.length > 0 ? (
                <div className="g-card p-5">
                  <h3 className="font-['DM_Sans'] font-semibold text-[13px] uppercase tracking-[0.1em] text-foreground mb-3">
                    {t("try.why")}
                  </h3>
                  <div className="space-y-2">
                    {result.reasons.map((r) => (
                      <div key={r.code + r.label} className="flex items-start gap-2.5">
                        {r.sentiment === "positive" ? (
                          <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                        ): (
                          <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span className="font-['DM_Sans'] text-[13px] font-semibold text-foreground">
                            {r.label}
                          </span>
                          <span className="font-['DM_Sans'] text-[12.5px] text-muted-foreground">, {r.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ): null}

              {/* rules */}
              <div className="g-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                  <FileText size={14} className="text-primary" />
                  <span className="font-['DM_Sans'] font-semibold text-[13px] text-foreground">
                    {t("try.rules")} · {result.policy_id} v{result.engine_version}
                  </span>
                </div>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
                  {result.rules_fired.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-5 py-2">
                      <span
                        className={`font-['JetBrains_Mono'] text-[9.5px] font-bold px-1.5 py-[2px] rounded-[3px] shrink-0 ${
                          r.skipped
                            ? "bg-muted text-muted-foreground"
: r.result
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
: "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {r.skipped ? "SKIP": r.result ? "PASS": "FAIL"}
                      </span>
                      <span className="font-['DM_Sans'] text-[12.5px] text-foreground truncate">{r.name}</span>
                      <span className="font-['JetBrains_Mono'] text-[11px] text-muted-foreground ml-auto shrink-0">
                        {r.condition}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* transactions */}
              <div className="g-card overflow-hidden">
                <button
                  onClick={() => setShowAllTxns((v) => !v)}
                  className="w-full px-5 py-3 flex items-center justify-between border-b border-border hover:bg-background/50"
                >
                  <span className="font-['DM_Sans'] font-semibold text-[13px] text-foreground">
                    {t("try.txns")} ({parsed.transactions.length})
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-muted-foreground transition-transform ${showAllTxns ? "rotate-180": ""}`}
                  />
                </button>
                {showAllTxns ? (
                  <div className="max-h-[380px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-surface">
                        <tr className="text-left">
                          {["Date", "Description", "Type", "Amount", "Balance"].map((h) => (
                            <th
                              key={h}
                              className="font-['JetBrains_Mono'] text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground px-5 py-2"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.transactions.map((t, i) => (
                          <tr key={`${t.date}-${i}`} className="border-t border-border/50">
                            <td className="font-['JetBrains_Mono'] text-[11.5px] text-muted-foreground px-5 py-1.5 whitespace-nowrap">
                              {t.date}
                            </td>
                            <td className="font-['DM_Sans'] text-[12px] text-foreground px-5 py-1.5 truncate max-w-[280px]">
                              {t.description}
                            </td>
                            <td className="px-5 py-1.5">
                              <span
                                className={`font-['JetBrains_Mono'] text-[10px] uppercase ${
                                  t.type === "credit" ? "text-green-600 dark:text-green-400": "text-muted-foreground"
                                }`}
                              >
                                {t.type}
                              </span>
                            </td>
                            <td className="font-['JetBrains_Mono'] text-[11.5px] text-foreground px-5 py-1.5 text-right">
                              {inr(t.amount)}
                            </td>
                            <td className="font-['JetBrains_Mono'] text-[11.5px] text-muted-foreground px-5 py-1.5 text-right">
                              {t.balance !== undefined ? inr(t.balance): ", "}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ): null}
              </div>

              <p className="font-['DM_Sans'] text-[12px] text-muted-foreground">
                Audit id <span className="font-['JetBrains_Mono']">{result.audit_id}</span>: the same statement and
                policy will always reproduce this exact decision.
              </p>
            </div>
          </section>
        ): null}
      </main>

      <Footer />
    </div>
  );
}
