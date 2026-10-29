import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  FileText,
  ShieldCheck,
  Terminal,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import type { ModuleId } from "@/data/platform-modules";

/**
 * Rendered previews of the real console surfaces.
 *
 * These are not screenshots and they are not marketing illustrations, each
 * screen mirrors the layout of the corresponding tab in `src/pages/Dashboard.tsx`
 * (same columns, same states, same vocabulary) and is driven by representative
 * data. That way the tour cannot drift away from the product, and the same
 * component can later be pointed at a live read-only demo org.
 */

const C = {
  shell: "#0C0C12",
  panel: "#13131B",
  raised: "#191922",
  line: "rgba(255,255,255,0.07)",
  lineSoft: "rgba(255,255,255,0.04)",
  text: "#EDEDF2",
  dim: "#8A8A9E",
  faint: "#5A5A6E",
  orange: "#F97316",
  green: "#00E58A",
  red: "#FF5C5C",
  amber: "#F5A524",
  blue: "#5B9BFF",
};

type Tone = "ok" | "warn" | "bad" | "info" | "neutral";

const toneColor: Record<Tone, string> = {
  ok: C.green,
  warn: C.amber,
  bad: C.red,
  info: C.blue,
  neutral: C.dim,
};

const Chip = ({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) => (
  <span
    className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-[2px] font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.06em] whitespace-nowrap"
    style={{
      color: toneColor[tone],
      background: `${toneColor[tone]}14`,
      border: `1px solid ${toneColor[tone]}33`,
    }}
  >
    {children}
  </span>
);

const Num = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <span className="font-['JetBrains_Mono'] tabular-nums" style={style}>
    {children}
  </span>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <span
    className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.12em]"
    style={{ color: C.faint }}
  >
    {children}
  </span>
);

const Panel = ({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`rounded-[8px] ${className}`}
    style={{ background: C.panel, border: `1px solid ${C.line}`,...style }}
  >
    {children}
  </div>
);

const Stat = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
}) => (
  <Panel className="px-3.5 py-3">
    <div className="font-['DM_Sans'] text-[10.5px]" style={{ color: C.dim }}>
      {label}
    </div>
    <div
      className="font-['JetBrains_Mono'] text-[19px] font-bold leading-tight mt-0.5"
      style={{ color: tone ? toneColor[tone]: C.text }}
    >
      {value}
    </div>
    {sub ? (
      <div className="font-['DM_Sans'] text-[10px] mt-0.5" style={{ color: C.faint }}>
        {sub}
      </div>
    ): null}
  </Panel>
);

const Header = ({
  cols,
  children,
}: {
  cols: string;
  children: React.ReactNode;
}) => (
  <div
    className="grid items-center gap-3 px-4 py-2"
    style={{ gridTemplateColumns: cols, borderBottom: `1px solid ${C.line}`, background: C.raised }}
  >
    {React.Children.map(children, (child) => (
      <Label>{child}</Label>
    ))}
  </div>
);

const Row = ({
  cols,
  children,
  last,
  highlight,
}: {
  cols: string;
  children: React.ReactNode;
  last?: boolean;
  highlight?: boolean;
}) => (
  <div
    className="grid items-center gap-3 px-4 py-[9px] transition-colors hover:bg-white/[0.03]"
    style={{
      gridTemplateColumns: cols,
      borderBottom: last ? "none": `1px solid ${C.lineSoft}`,
      background: highlight ? "rgba(249,115,22,0.06)": undefined,
    }}
  >
    {children}
  </div>
);

const Cell = ({
  children,
  mono,
  strong,
  dim,
}: {
  children: React.ReactNode;
  mono?: boolean;
  strong?: boolean;
  dim?: boolean;
}) => (
  <span
    className={`${mono ? "font-['JetBrains_Mono'] tabular-nums": "font-['DM_Sans']"} text-[11.5px] truncate`}
    style={{ color: dim ? C.dim: C.text, fontWeight: strong ? 600: 400 }}
  >
    {children}
  </span>
);

const Bar = ({ pct, tone = "info" }: { pct: number; tone?: Tone }) => (
  <div className="h-[4px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
    <div
      className="h-full rounded-full"
      style={{ width: `${Math.min(100, Math.max(2, pct))}%`, background: toneColor[tone] }}
    />
  </div>
);

/* ─────────────────────────── screens ─────────────────────────── */

const UnderwritingScreen = () => {
  const rows = [
    ["GVL-4821", "Rohit Mehra", "4.5L", "742", "APPROVED", "1.10s", "ok"],
    ["GVL-4822", "Anjali Nair", "12.0L", "698", "MANUAL", "1.42s", "warn"],
    ["GVL-4823", "Sharma Textiles", "25.0L", "651", "DECLINED", "0.94s", "bad"],
    ["GVL-4824", "Imran Qureshi", "8.0L", "715", "APPROVED", "1.18s", "ok"],
    ["GVL-4825", "Kavya Reddy", "3.2L", "676", "MANUAL", "1.31s", "warn"],
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3">
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
            Underwriting queue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.green }} />
            <Label>live</Label>
          </span>
        </div>
        <Header cols="0.9fr 1.25fr 0.7fr 0.55fr 0.95fr 0.6fr">
          <span>App</span>
          <span>Borrower</span>
          <span>Amount</span>
          <span>Bureau</span>
          <span>Decision</span>
          <span>TAT</span>
        </Header>
        {rows.map(([id, name, amt, bureau, decision, tat, tone], i) => (
          <Row
            key={id}
            cols="0.9fr 1.25fr 0.7fr 0.55fr 0.95fr 0.6fr"
            last={i === rows.length - 1}
            highlight={id === "GVL-4822"}
          >
            <Num style={{ color: C.dim, fontSize: 11 }}>{id}</Num>
            <Cell strong>{name}</Cell>
            <Cell mono>₹{amt}</Cell>
            <Cell mono>{bureau}</Cell>
            <span>
              <Chip tone={tone as Tone}>{decision}</Chip>
            </span>
            <Cell mono dim>
              {tat}
            </Cell>
          </Row>
        ))}
      </Panel>

      <Panel className="p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
            Decision trace · GVL-4822
          </span>
          <Chip tone="warn">manual</Chip>
        </div>
        <div className="space-y-2">
          {[
            ["Bureau pull", "698 · CIBIL", "ok"],
            ["FOIR", "41% of policy 45%", "warn"],
            ["Salary credits", "3 of 3 months", "ok"],
            ["Cheque bounces", "2 in 6 months", "bad"],
            ["Vintage", "4y 2m employed", "ok"],
          ].map(([k, v, tone]) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <span className="font-['DM_Sans'] text-[11px]" style={{ color: C.dim }}>
                {k}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-['JetBrains_Mono'] text-[10.5px]" style={{ color: C.text }}>
                  {v}
                </span>
                {tone === "ok" ? (
                  <CheckCircle size={11} style={{ color: C.green }} />
                ): tone === "warn" ? (
                  <AlertTriangle size={11} style={{ color: C.amber }} />
                ): (
                  <XCircle size={11} style={{ color: C.red }} />
                )}
              </span>
            </div>
          ))}
        </div>
        <div
          className="mt-3 rounded-[6px] p-2.5"
          style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.22)" }}
        >
          <Label>rule fired</Label>
          <p className="font-['DM_Sans'] text-[10.5px] mt-1 leading-[1.5]" style={{ color: C.text }}>
            <Num style={{ color: C.orange }}>POL-14</Num>, two bounces with FOIR above 40% routes to a credit
            officer instead of auto-decline.
          </p>
        </div>
      </Panel>
    </div>
  );
};

const PortfolioScreen = () => {
  const stages = [
    ["Sanctioned", 412, 100, "info"],
    ["Disbursed", 366, 89, "ok"],
    ["Active", 3184, 74, "ok"],
    ["Closed", 912, 41, "neutral"],
  ] as const;

  const loans = [
    ["LN-90214", "Rohit Mehra", "₹4,50,000", "12 / 24", "0", "Active", "ok"],
    ["LN-90215", "Imran Qureshi", "₹8,00,000", "3 / 36", "18", "Overdue", "warn"],
    ["LN-90216", "Sharma Textiles", "₹25,00,000", "28 / 36", "64", "SMA-1", "warn"],
    ["LN-90217", "Kavya Reddy", "₹3,20,000", "6 / 18", "96", "NPA", "bad"],
  ] as const;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="AUM" value="₹42.6 Cr" sub="+₹3.1 Cr this month" />
        <Stat label="Active loans" value="3,184" sub="1,042 borrowers" />
        <Stat label="NPA ratio" value="2.1%" sub="policy cap 3.0%" tone="ok" />
        <Stat label="Avg ticket" value="₹1.34 L" sub="across 6 products" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-3">
        <Panel className="p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <Database size={12} style={{ color: C.orange }} />
            <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
              Stage funnel
            </span>
          </div>
          <div className="space-y-2.5">
            {stages.map(([name, count, pct, tone]) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-['DM_Sans'] text-[10.5px]" style={{ color: C.dim }}>
                    {name}
                  </span>
                  <Num style={{ color: C.text, fontSize: 10.5 }}>{count.toLocaleString("en-IN")}</Num>
                </div>
                <Bar pct={pct} tone={tone as Tone} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
            <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
              Recently disbursed
            </span>
          </div>
          <Header cols="0.9fr 1.2fr 0.95fr 0.65fr 0.5fr 0.7fr">
            <span>Loan</span>
            <span>Borrower</span>
            <span>Principal</span>
            <span>EMI</span>
            <span>DPD</span>
            <span>State</span>
          </Header>
          {loans.map(([id, name, amt, emi, dpd, state, tone], i) => (
            <Row key={id} cols="0.9fr 1.2fr 0.95fr 0.65fr 0.5fr 0.7fr" last={i === loans.length - 1}>
              <Num style={{ color: C.dim, fontSize: 10.5 }}>{id}</Num>
              <Cell strong>{name}</Cell>
              <Cell mono>{amt}</Cell>
              <Cell mono dim>
                {emi}
              </Cell>
              <Num style={{ color: Number(dpd) > 30 ? C.red: C.text, fontSize: 11 }}>{dpd}</Num>
              <span>
                <Chip tone={tone as Tone}>{state}</Chip>
              </span>
            </Row>
          ))}
        </Panel>
      </div>
    </div>
  );
};

const DisbursementScreen = () => {
  const rows = [
    ["DSB-3391", "Rohit Mehra", "HDFC ••4471", "Razorpay", "₹4,50,000", "PAID", "UTR 4429183", "ok"],
    ["DSB-3392", "Imran Qureshi", "ICICI ••8820", "Setu", "₹8,00,000", "PROCESSING", "queued", "info"],
    ["DSB-3393", "Kavya Reddy", "SBI ••1902", "NEFT", "₹3,20,000", "FAILED", "AC01 invalid", "bad"],
    ["DSB-3394", "Anjali Nair", "Axis ••6640", "Razorpay", "₹12,00,000", "PAID", "UTR 4429201", "ok"],
  ] as const;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Today" value="14 payouts" sub="₹1.86 Cr out" />
        <Stat label="Settled" value="11" sub="UTR captured" tone="ok" />
        <Stat label="Needs action" value="3" sub="1 failed · 2 in flight" tone="warn" />
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
            Disbursement queue
          </span>
          <span className="flex items-center gap-1.5">
            <Banknote size={12} style={{ color: C.orange }} />
            <Label>maker-checker on</Label>
          </span>
        </div>
        <Header cols="0.85fr 1.15fr 1.05fr 0.75fr 0.95fr 0.95fr 0.85fr">
          <span>Ref</span>
          <span>Beneficiary</span>
          <span>Account</span>
          <span>Rail</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Reference</span>
        </Header>
        {rows.map(([ref, name, acct, rail, amt, status, meta, tone], i) => (
          <Row key={ref} cols="0.85fr 1.15fr 1.05fr 0.75fr 0.95fr 0.95fr 0.85fr" last={i === rows.length - 1}>
            <Num style={{ color: C.dim, fontSize: 10.5 }}>{ref}</Num>
            <Cell strong>{name}</Cell>
            <Cell mono dim>
              {acct}
            </Cell>
            <Cell>{rail}</Cell>
            <Cell mono>{amt}</Cell>
            <span>
              <Chip tone={tone as Tone}>{status}</Chip>
            </span>
            <Cell mono dim>
              {meta}
            </Cell>
          </Row>
        ))}
      </Panel>

      <div
        className="flex items-center gap-2 rounded-[6px] px-3 py-2"
        style={{ background: "rgba(255,92,92,0.08)", border: "1px solid rgba(255,92,92,0.25)" }}
      >
        <AlertTriangle size={12} style={{ color: C.red }} />
        <span className="font-['DM_Sans'] text-[10.5px]" style={{ color: C.text }}>
          DSB-3393 failed at the beneficiary bank, account closed. Retry after re-verifying the account.
        </span>
      </div>
    </div>
  );
};

const CollectionsScreen = () => {
  const buckets = [
    ["0–30 DPD", "₹68.4 L", 412, "ok"],
    ["31–60 DPD", "₹24.1 L", 148, "warn"],
    ["61–90 DPD", "₹11.6 L", 63, "warn"],
    ["90+ DPD", "₹8.9 L", 34, "bad"],
  ] as const;

  const worklist = [
    ["LN-90217", "Kavya Reddy", "96", "₹2,84,000", "Field visit", "P. Menon", "bad"],
    ["LN-90216", "Sharma Textiles", "64", "₹19,40,000", "Restructure offer", "A. Bose", "warn"],
    ["LN-90215", "Imran Qureshi", "18", "₹7,62,000", "Call · PTP 04 Nov", "S. Kaur", "warn"],
    ["LN-90221", "Vikram Shah", "6", "₹4,10,000", "Reminder sent", "auto", "ok"],
  ] as const;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {buckets.map(([label, amt, count, tone]) => (
          <Panel key={label} className="px-3.5 py-3">
            <div className="flex items-center justify-between">
              <Label>{label}</Label>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: toneColor[tone as Tone] }} />
            </div>
            <div className="font-['JetBrains_Mono'] text-[17px] font-bold mt-1" style={{ color: C.text }}>
              {amt}
            </div>
            <div className="font-['DM_Sans'] text-[10px] mt-0.5" style={{ color: C.faint }}>
              {count} accounts
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
            Today&apos;s worklist
          </span>
          <Chip tone="warn">3 crossed 90 DPD → NPA</Chip>
        </div>
        <Header cols="0.85fr 1.15fr 0.5fr 0.95fr 1.15fr 0.65fr">
          <span>Loan</span>
          <span>Borrower</span>
          <span>DPD</span>
          <span>Outstanding</span>
          <span>Next action</span>
          <span>Owner</span>
        </Header>
        {worklist.map(([id, name, dpd, amt, action, owner, tone], i) => (
          <Row key={id} cols="0.85fr 1.15fr 0.5fr 0.95fr 1.15fr 0.65fr" last={i === worklist.length - 1}>
            <Num style={{ color: C.dim, fontSize: 10.5 }}>{id}</Num>
            <Cell strong>{name}</Cell>
            <Num style={{ color: toneColor[tone as Tone], fontSize: 11 }}>{dpd}</Num>
            <Cell mono>{amt}</Cell>
            <Cell>{action}</Cell>
            <Cell dim>{owner}</Cell>
          </Row>
        ))}
      </Panel>
    </div>
  );
};

const SentinelScreen = () => {
  const signals = [
    ["Salary credit missing", "LN-90215 · Imran Qureshi", "Oct salary not credited by day 7", "HIGH", "bad"],
    ["Bureau enquiry spike", "LN-90216 · Sharma Textiles", "4 new enquiries in 30 days", "HIGH", "bad"],
    ["GST filing delay", "LN-90216 · Sharma Textiles", "GSTR-3B pending for Sep", "MED", "warn"],
    ["Cheque bounce", "LN-90217 · Kavya Reddy", "2nd bounce this quarter", "HIGH", "bad"],
    ["Utility payment gap", "LN-90221 · Vikram Shah", "One missed cycle", "LOW", "info"],
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-3">
      <Panel className="p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={12} style={{ color: C.orange }} />
          <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
            Book risk score
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-['JetBrains_Mono'] text-[34px] font-bold leading-none" style={{ color: C.amber }}>
            61
          </span>
          <span className="font-['DM_Sans'] text-[10.5px] pb-1" style={{ color: C.dim }}>
            / 100 · watch
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {[
            ["Deteriorating accounts", 24, "warn"],
            ["Stable", 128, "ok"],
            ["Already NPA", 34, "bad"],
          ].map(([label, val, tone]) => (
            <div key={label as string}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-['DM_Sans'] text-[10.5px]" style={{ color: C.dim }}>
                  {label}
                </span>
                <Num style={{ color: C.text, fontSize: 10.5 }}>{val}</Num>
              </div>
              <Bar pct={(val as number) / 2} tone={tone as Tone} />
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <Label>last scan</Label>
          <div className="font-['DM_Sans'] text-[10.5px] mt-0.5" style={{ color: C.dim }}>
            04:10 IST · 3,184 accounts · 12 signal types
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
            Signal feed
          </span>
          <span className="flex items-center gap-1.5">
            <Activity size={11} style={{ color: C.green }} />
            <Label>auto-routed to owner</Label>
          </span>
        </div>
        {signals.map(([title, who, detail, sev, tone], i) => (
          <div
            key={title + who}
            className="px-4 py-2.5"
            style={{ borderBottom: i === signals.length - 1 ? "none": `1px solid ${C.lineSoft}` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
                    {title}
                  </span>
                  <Chip tone={tone as Tone}>{sev}</Chip>
                </div>
                <div className="font-['JetBrains_Mono'] text-[10px] mt-0.5" style={{ color: C.faint }}>
                  {who}
                </div>
              </div>
              <ArrowRight size={12} style={{ color: C.faint }} />
            </div>
            <div className="font-['DM_Sans'] text-[10.5px] mt-1" style={{ color: C.dim }}>
              {detail}
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
};

const ComplianceScreen = () => {
  const rows = [
    ["SMA-0", "18", "₹1.42 Cr", "0.4%", "₹5.7 L", "ok"],
    ["SMA-1", "11", "₹96.4 L", "1.0%", "₹9.6 L", "warn"],
    ["SMA-2", "7", "₹62.8 L", "2.0%", "₹12.6 L", "warn"],
    ["NPA · sub-standard", "21", "₹74.2 L", "15%", "₹1.11 Cr", "bad"],
    ["NPA · doubtful", "13", "₹14.7 L", "40%", "₹58.8 L", "bad"],
  ] as const;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Classification as of" value="31 Oct 26" sub="auto · 04:10 IST" />
        <Stat label="Provision held" value="₹1.98 Cr" sub="policy rates applied" tone="ok" />
        <Stat label="Open exceptions" value="2" sub="fair-practice notices" tone="warn" />
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
            RBI asset classification
          </span>
          <span className="flex items-center gap-1.5">
            <FileText size={11} style={{ color: C.orange }} />
            <Label>LAR export ready</Label>
          </span>
        </div>
        <Header cols="1.2fr 0.55fr 0.85fr 0.7fr 0.85fr 0.5fr">
          <span>Bucket</span>
          <span>Accts</span>
          <span>Exposure</span>
          <span>Prov %</span>
          <span>Provision</span>
          <span>State</span>
        </Header>
        {rows.map(([bucket, accts, exp, prov, amount, tone], i) => (
          <Row key={bucket} cols="1.2fr 0.55fr 0.85fr 0.7fr 0.85fr 0.5fr" last={i === rows.length - 1}>
            <Cell strong>{bucket}</Cell>
            <Cell mono>{accts}</Cell>
            <Cell mono>{exp}</Cell>
            <Cell mono dim>
              {prov}
            </Cell>
            <Cell mono>{amount}</Cell>
            <span>
              <Chip tone={tone as Tone}>{tone === "ok" ? "ok": tone === "warn" ? "watch": "action"}</Chip>
            </span>
          </Row>
        ))}
      </Panel>

      <div className="flex items-center justify-between rounded-[6px] px-3 py-2" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <span className="flex items-center gap-2">
          <ShieldCheck size={12} style={{ color: C.green }} />
          <span className="font-['DM_Sans'] text-[10.5px]" style={{ color: C.dim }}>
            LAR · Q2 FY27 generated by ops@gavel · audit hash{" "}
            <Num style={{ color: C.faint }}>9f2c…41ab</Num>
          </span>
        </span>
        <Chip tone="ok">immutable</Chip>
      </div>
    </div>
  );
};

const AnalyticsScreen = () => {
  const points = [38, 34, 41, 29, 26, 31, 24, 22, 25, 19, 18, 21, 16, 15];
  const max = Math.max(...points);
  const w = 320;
  const h = 90;
  const path = points
.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (p / max) * (h - 8);
      return `${i === 0 ? "M": "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
.join(" ");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Approval rate" value="81.4%" sub="+6.2 pts vs Q1" tone="ok" />
        <Stat label="Median TAT" value="3.4 hrs" sub="policy SLA 6 hrs" tone="ok" />
        <Stat label="Cost per file" value="₹214" sub="API + bureau + ops" />
        <Stat label="Portfolio ROI" value="18.7%" sub="6 products blended" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
        <Panel className="p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
              Turnaround time · hours
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={11} style={{ color: C.green }} />
              <span className="font-['JetBrains_Mono'] text-[10px]" style={{ color: C.green }}>
                −58% YoY
              </span>
            </span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[90px]" preserveAspectRatio="none">
            <defs>
              <linearGradient id="tatFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.orange} stopOpacity="0.28" />
                <stop offset="100%" stopColor={C.orange} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} L${w},${h} L0,${h} Z`} fill="url(#tatFill)" />
            <path d={path} fill="none" stroke={C.orange} strokeWidth="1.6" />
          </svg>
          <div className="flex justify-between mt-1">
            {["Nov", "Jan", "Mar", "May", "Jul", "Sep"].map((m) => (
              <span key={m} className="font-['JetBrains_Mono'] text-[9px]" style={{ color: C.faint }}>
                {m}
              </span>
            ))}
          </div>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={12} style={{ color: C.orange }} />
            <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
              Funnel · this month
            </span>
          </div>
          <div className="space-y-2.5">
            {[
              ["Applications", 100, "2,148"],
              ["Auto-scored", 96, "2,062"],
              ["Approved", 81, "1,748"],
              ["Disbursed", 74, "1,592"],
              ["Repaying", 68, "1,462"],
            ].map(([label, pct, val], i) => (
              <div key={label as string}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-['DM_Sans'] text-[10.5px]" style={{ color: C.dim }}>
                    {label}
                  </span>
                  <Num style={{ color: C.text, fontSize: 10.5 }}>{val}</Num>
                </div>
                <Bar pct={pct as number} tone={i > 2 ? "ok": "info"} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

const DeveloperScreen = () => {
  const keys = [
    ["prod_live_9f2c", "Live", 78, "34,120 / 50,000", "ok"],
    ["staging_41ab", "Test", 22, "1,904 / 10,000", "info"],
  ] as const;

  const hooks = [
    ["loan.disbursed", "200", "84ms", "ok"],
    ["repayment.posted", "200", "112ms", "ok"],
    ["sentinel.signal", "500", "retry 3/5", "bad"],
    ["kyc.verified", "200", "67ms", "ok"],
  ] as const;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-3">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
            <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
              API keys &amp; quota
            </span>
            <Terminal size={11} style={{ color: C.orange }} />
          </div>
          <div className="p-3.5 space-y-3">
            {keys.map(([prefix, env, pct, usage, tone]) => (
              <div key={prefix}>
                <div className="flex items-center justify-between mb-1">
                  <Num style={{ color: C.text, fontSize: 10.5 }}>{prefix}••••</Num>
                  <Chip tone={tone as Tone}>{env}</Chip>
                </div>
                <Bar pct={pct as number} tone={pct as number > 70 ? "warn": "ok"} />
                <div className="font-['JetBrains_Mono'] text-[9.5px] mt-1" style={{ color: C.faint }}>
                  {usage} calls this month
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
            <span className="font-['DM_Sans'] text-[11.5px] font-semibold" style={{ color: C.text }}>
              Webhook deliveries
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={11} style={{ color: C.amber }} />
              <Label>hmac-signed</Label>
            </span>
          </div>
          {hooks.map(([event, code, meta, tone], i) => (
            <div
              key={event}
              className="grid items-center gap-3 px-4 py-[9px]"
              style={{
                gridTemplateColumns: "1.4fr 0.5fr 0.9fr",
                borderBottom: i === hooks.length - 1 ? "none": `1px solid ${C.lineSoft}`,
              }}
            >
              <Num style={{ color: C.text, fontSize: 10.5 }}>{event}</Num>
              <Chip tone={tone as Tone}>{code}</Chip>
              <Cell mono dim>
                {meta}
              </Cell>
            </div>
          ))}
        </Panel>
      </div>

      <Panel className="p-3.5" style={{ background: C.shell }}>
        <div className="flex items-center justify-between mb-2">
          <Label>evaluate a file</Label>
          <Chip tone="neutral">POST /v1/underwriting/evaluate</Chip>
        </div>
        <pre className="font-['JetBrains_Mono'] text-[10.5px] leading-[1.65] overflow-x-auto m-0" style={{ color: C.dim }}>
          <span style={{ color: C.orange }}>curl</span> -X POST https://api.trygavel.com/v1/underwriting/evaluate \{"\n"}
          {" "}-H <span style={{ color: C.green }}>&quot;Authorization: Bearer sk_live_…&quot;</span> \{"\n"}
          {" "}-H <span style={{ color: C.green }}>&quot;Idempotency-Key: 8f21c&quot;</span> \{"\n"}
          {" "}-d <span style={{ color: C.blue }}>{`'{"applicantId":"APL-9931","amount":450000,"product":"personal"}'`}</span>
        </pre>
      </Panel>
    </div>
  );
};

const SCREENS: Record<ModuleId, () => React.ReactElement> = {
  underwriting: UnderwritingScreen,
  portfolio: PortfolioScreen,
  disbursement: DisbursementScreen,
  collections: CollectionsScreen,
  sentinel: SentinelScreen,
  compliance: ComplianceScreen,
  analytics: AnalyticsScreen,
  developer: DeveloperScreen,
};

export const ModulePreview = ({
  moduleId,
  title,
  className = "",
}: {
  moduleId: ModuleId;
  title?: string;
  className?: string;
}) => {
  const Screen = SCREENS[moduleId];

  return (
    <div
      className={`rounded-[10px] overflow-hidden shadow-2xl ${className}`}
      style={{ background: C.shell, border: `1px solid ${C.line}` }}
    >
      {/* window chrome */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <span key={c} className="w-[7px] h-[7px] rounded-full" style={{ background: c, opacity: 0.55 }} />
            ))}
          </div>
          <span className="font-['DM_Sans'] text-[11px] font-medium" style={{ color: C.dim }}>
            {title ?? "Gavel Console"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={10} style={{ color: C.faint }} />
          <span className="font-['JetBrains_Mono'] text-[9.5px]" style={{ color: C.faint }}>
            04:12 IST
          </span>
        </div>
      </div>

      <div className="p-3">
        <Screen />
      </div>
    </div>
  );
};

export default ModulePreview;
