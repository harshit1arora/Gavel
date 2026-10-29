import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { analyze, inr } from "@/lib/engine/evaluate";
import { downloadDecisionPdf } from "@/lib/engine/export";
import { SAMPLE_APPLICANTS, type SampleApplicant } from "@/lib/engine/samples";
import type { DecisionResult } from "@/lib/engine/types";
import { useT } from "@/i18n/LanguageProvider";

/**
 * Live demo console.
 *
 * Every number on this page is computed by the real engine at render time,
 * there is no fixture file behind it. The queue is seeded from synthetic
 * statements, the verdicts fall out of the policy, and an operator can override
 * a decision the way a credit officer would.
 */

type Status = "Pending" | "Approved" | "Rejected" | "Manual Review";

interface QueueItem {
  applicant: SampleApplicant;
  result: DecisionResult;
  status: Status;
  reviewedBy?: string;
}

const statusFor = (result: DecisionResult): Status =>
  result.decision === "APPROVE" ? "Approved": result.decision === "REVIEW" ? "Manual Review": "Rejected";

const seedQueue = (): QueueItem[] =>
  SAMPLE_APPLICANTS.map((applicant) => {
    const result = analyze({ transactions: applicant.transactions, period: `${applicant.months} months` });
    return { applicant, result, status: statusFor(result) };
  });

const badge: Record<string, string> = {
  APPROVE: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-600/25",
  REVIEW: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  REJECT: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export default function Demo() {
  const t = useT();
  const [queue, setQueue] = useState<QueueItem[]>(seedQueue);
  const [selectedId, setSelectedId] = useState<string | null>(SAMPLE_APPLICANTS[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "review" | "rejected">("all");

  const selected = queue.find((q) => q.applicant.id === selectedId) ?? queue[0];

  const kpis = useMemo(() => {
    const total = queue.length;
    const approved = queue.filter((q) => q.status === "Approved").length;
    const review = queue.filter((q) => q.status === "Manual Review").length;
    const rejected = queue.filter((q) => q.status === "Rejected").length;
    const avgTat = queue.reduce((s, q) => s + q.result.processing_time_ms, 0) / Math.max(total, 1);
    const exposure = queue.filter((q) => q.status === "Approved").reduce((s, q) => s + q.result.credit_limit, 0);
    return { total, approved, review, rejected, avgTat, exposure };
  }, [queue]);

  const visible = queue.filter((q) => {
    const matchesQuery =
      !query ||
      q.applicant.name.toLowerCase().includes(query.toLowerCase()) ||
      q.applicant.id.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && q.status === "Pending") ||
      (filter === "review" && q.status === "Manual Review") ||
      (filter === "rejected" && q.status === "Rejected");
    return matchesQuery && matchesFilter;
  });

  const override = (id: string, status: Status) => {
    setQueue((q) => q.map((item) => (item.applicant.id === id ? {...item, status, reviewedBy: "you" }: item)));
  };

  const rerun = (id: string) => {
    setQueue((q) =>
      q.map((item) => {
        if (item.applicant.id !== id) return item;
        const result = analyze({
          transactions: item.applicant.transactions,
          period: `${item.applicant.months} months`,
        });
        return {...item, result, status: statusFor(result) };
      }),
    );
  };

  const reset = () => {
    setQueue(seedQueue());
    setFilter("all");
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Gavel Demo Console: a working lending system, no signup</title>
        <meta
          name="description"
          content="A live, clickable lending console. Every decision is computed in your browser by the open-source Gavel engine."
        />
      </Helmet>
      <Navbar />

      <main className="pt-28 pb-20">
        {/* demo ribbon */}
        <div className="bg-primary/10 border-y border-primary/20">
          <div className="container mx-auto px-6 py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-['DM_Sans'] text-[12px] text-foreground">
              {t("demo.ribbon")}
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 font-['DM_Sans'] text-[12px] font-semibold text-foreground hover:text-primary"
              >
                <RefreshCw size={12} /> {t("demo.reset")}
              </button>
              <Link
                to="/try"
                className="inline-flex items-center gap-1.5 font-['DM_Sans'] text-[12px] font-semibold text-primary hover:brightness-110"
              >
                {t("demo.tryOwn")} <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="font-['DM_Sans'] font-bold text-[30px] leading-tight text-foreground tracking-[-0.01em]">
                {t("demo.title")}
              </h1>
              <p className="font-['DM_Sans'] text-[13.5px] text-muted-foreground mt-1">
                {t("demo.sub")}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-border bg-surface">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-['JetBrains_Mono'] text-[10.5px] text-muted-foreground">ENGINE v2.1.0 · LIVE</span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: t("demo.inQueue"), value: String(kpis.total) },
              { label: t("demo.approved"), value: String(kpis.approved) },
              { label: t("demo.review"), value: String(kpis.review) },
              { label: t("demo.rejected"), value: String(kpis.rejected) },
              { label: t("demo.sanctioned"), value: inr(kpis.exposure) },
            ].map((k) => (
              <div key={k.label} className="g-card !rounded-[12px] px-4 py-3.5">
                <div className="font-['DM_Sans'] text-[11px] text-muted-foreground">{k.label}</div>
                <div className="font-['JetBrains_Mono'] tnum text-[20px] font-bold tracking-tight text-foreground mt-1">{k.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-5">
            {/* queue */}
            <div className="g-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("demo.search")}
                    className="w-full bg-background border border-border rounded-[6px] pl-8 pr-3 py-1.5 font-['DM_Sans'] text-[12.5px] text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-1">
                  {(
                    [
                      ["all", t("demo.all")],
                      ["pending", t("demo.pending")],
                      ["review", t("demo.review")],
                      ["rejected", t("demo.rejected")],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setFilter(id)}
                      className={`px-2.5 py-1.5 rounded-[5px] font-['DM_Sans'] text-[11.5px] transition-colors ${
                        filter === id
                          ? "bg-primary/10 text-primary font-semibold"
: "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-border">
                {visible.map((item) => {
                  const isActive = item.applicant.id === selected?.applicant.id;
                  return (
                    <button
                      key={item.applicant.id}
                      onClick={() => setSelectedId(item.applicant.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        isActive ? "bg-primary/5": "hover:bg-background/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-['DM_Sans'] text-[13.5px] font-semibold text-foreground truncate">
                            {item.applicant.name}
                          </span>
                          <span className="font-['JetBrains_Mono'] text-[10px] text-muted-foreground">
                            {item.applicant.id}
                          </span>
                        </div>
                        <div className="font-['DM_Sans'] text-[11.5px] text-muted-foreground mt-0.5">
                          {inr(item.applicant.loanAmount)} · {item.applicant.purpose}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block font-['JetBrains_Mono'] text-[9.5px] uppercase tracking-[0.06em] px-1.5 py-[2px] rounded-[3px] border ${badge[item.result.decision]}`}
                        >
                          {item.status}
                        </span>
                        <div className="font-['JetBrains_Mono'] text-[10.5px] text-muted-foreground mt-1">
                          risk {item.result.risk_score}
                        </div>
                      </div>
                      <ChevronRight size={14} className={isActive ? "text-primary": "text-muted-foreground/50"} />
                    </button>
                  );
                })}
                {visible.length === 0 ? (
                  <div className="px-4 py-10 text-center font-['DM_Sans'] text-[13px] text-muted-foreground">
                    {t("demo.empty")}
                  </div>
                ): null}
              </div>
            </div>

            {/* detail */}
            {selected ? (
              <div className="g-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-['DM_Sans'] font-bold text-[17px] text-foreground">
                        {selected.applicant.name}
                      </h2>
                      <div className="font-['DM_Sans'] text-[12px] text-muted-foreground mt-0.5">
                        {selected.applicant.employer} · PAN ******
                        {selected.applicant.pan.slice(-4)}
                      </div>
                    </div>
                    <div
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border ${badge[selected.result.decision]}`}
                    >
                      {selected.result.decision === "APPROVE" ? (
                        <CheckCircle size={13} />
                      ): selected.result.decision === "REVIEW" ? (
                        <AlertTriangle size={13} />
                      ): (
                        <XCircle size={13} />
                      )}
                      <span className="font-['DM_Sans'] text-[12px] font-bold">{selected.result.decision}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                  {[
                    { label: t("demo.requested"), value: inr(selected.applicant.loanAmount) },
                    { label: t("demo.sanctioned"), value: inr(selected.result.credit_limit) },
                    { label: t("demo.riskScore"), value: `${selected.result.risk_score}/100` },
                  ].map((s) => (
                    <div key={s.label} className="px-4 py-3">
                      <div className="font-['DM_Sans'] text-[10.5px] text-muted-foreground">{s.label}</div>
                      <div className="font-['JetBrains_Mono'] tnum text-[15px] font-bold text-foreground mt-0.5">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4">
                  <h3 className="font-['DM_Sans'] font-semibold text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-2.5">
                    {t("demo.signals")}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {[
                      ["Monthly income", inr(selected.result.signals.monthly_income)],
                      ["Income type", selected.result.signals.income_type],
                      ["EMI ratio", `${(selected.result.signals.emi_ratio * 100).toFixed(1)}%`],
                      ["Active EMIs", String(selected.result.signals.emi_count)],
                      ["Salary credits", `${selected.result.signals.salary_count}`],
                      ["Avg balance", inr(selected.result.signals.avg_residual)],
                      ["Min balance", inr(selected.result.signals.min_balance)],
                      ["Months of data", String(selected.result.signals.months_of_data)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="font-['DM_Sans'] text-[12px] text-muted-foreground">{k}</span>
                        <span className="font-['JetBrains_Mono'] text-[11.5px] text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 pb-4">
                  <h3 className="font-['DM_Sans'] font-semibold text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-2">
                    {t("demo.trace")}
                  </h3>
                  <div className="max-h-[190px] overflow-y-auto rounded-[6px] border border-border divide-y divide-border">
                    {selected.result.rules_fired.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 px-3 py-1.5">
                        <span
                          className={`font-['JetBrains_Mono'] text-[9px] font-bold px-1 py-[1px] rounded-[2px] ${
                            r.skipped
                              ? "bg-muted text-muted-foreground"
: r.result
                                ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
: "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {r.skipped ? "SKIP": r.result ? "PASS": "FAIL"}
                        </span>
                        <span className="font-['DM_Sans'] text-[11.5px] text-foreground truncate">{r.name}</span>
                        <span className="font-['JetBrains_Mono'] text-[10px] text-muted-foreground ml-auto shrink-0">
                          {r.condition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 pb-5 flex flex-wrap gap-2">
                  {selected.status !== "Approved" ? (
                    <button
                      onClick={() => override(selected.applicant.id, "Approved")}
                      className="g-btn !h-9 !px-3.5 !text-[12.5px] bg-emerald-600 text-white hover:brightness-110"
                    >
                      <ShieldCheck size={13} /> {t("demo.approve")}
                    </button>
                  ): null}
                  {selected.status !== "Rejected" ? (
                    <button
                      onClick={() => override(selected.applicant.id, "Rejected")}
                      className="g-btn g-btn-secondary !h-9 !px-3.5 !text-[12.5px]"
                    >
                      <XCircle size={13} /> {t("demo.decline")}
                    </button>
                  ): null}
                  <button
                    onClick={() => rerun(selected.applicant.id)}
                    className="g-btn g-btn-secondary !h-9 !px-3.5 !text-[12.5px]"
                  >
                    <Zap size={13} /> {t("demo.rerun")}
                  </button>
                  <button
                    onClick={() =>
                      downloadDecisionPdf(selected.result, {
                        applicant: selected.applicant.name,
                        pan: selected.applicant.pan,
                      })
                    }
                    className="g-btn g-btn-secondary !h-9 !px-3.5 !text-[12.5px]"
                  >
                    <Download size={13} /> {t("demo.pdf")}
                  </button>
                </div>

                {selected.reviewedBy ? (
                  <div className="px-5 pb-4 -mt-1">
                    <span className="font-['DM_Sans'] text-[11px] text-muted-foreground">
                      Overridden by {selected.reviewedBy}, in the real console this writes an audit log entry.
                    </span>
                  </div>
                ): null}
              </div>
            ): null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/try"
              className="g-btn g-btn-primary"
            >
              {t("demo.cta1")} <ArrowRight size={14} />
            </Link>
            <Link
              to="/platform"
              className="g-btn g-btn-secondary"
            >
              {t("demo.cta2")}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
