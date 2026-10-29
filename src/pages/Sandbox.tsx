import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from "@/components/Navbar";
import {
  PERSONAS,
  PAYLOADS,
  runAnalysis,
  AnalysisResult,
  TERMINAL_LINES,
  PROCESSING_LINES
} from '@/lib/mock-engine';
import { underwritingApi } from '@/lib/api-client';
import { generateAnalysisPDF } from '@/lib/pdf-generator';

/**
 * Run the analysis against the live /v1/underwriting/analyze endpoint, with a
 * graceful fallback to the local mock engine. The Sandbox is a public page, so
 * an unauthenticated visitor (or an unreachable backend) transparently sees the
 * deterministic mock; a signed-in CRO in a white-glove session watches their
 * own tuned rules decide a real statement live.
 */
async function runAnalysisLiveOrMock(
  personaId: string,
): Promise<{ result: AnalysisResult; live: boolean }> {
  const payload = PAYLOADS[personaId as keyof typeof PAYLOADS];
  try {
    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
: `${personaId}-${Date.now()}`;
    const res = await underwritingApi.analyze(payload, idempotencyKey);
    if (!res.ok) throw new Error(`Live endpoint returned ${res.status}`);
    const data = (await res.json()) as AnalysisResult;
    return { result: data, live: true };
  } catch {
    // Not signed in / backend unreachable → deterministic local demo.
    const data = await runAnalysis(personaId);
    return { result: data, live: false };
  }
}
import {
  Play,
  Copy,
  FileText,
  Loader2,
  CheckCircle2,
  Download,
  Code,
  AlertTriangle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const Sandbox = () => {
  const [selectedPersona, setSelectedPersona] = useState<string>('strong');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [processingLines, setProcessingLines] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'statement' | 'details'>('statement');
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [copied, setCopied] = useState<'curl' | 'json' | 'result' | null>(null);
  const [source, setSource] = useState<'live' | 'demo' | null>(null);

  // Terminal typewriter effect on mount
  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < TERMINAL_LINES.length) {
        const lineToAppend = TERMINAL_LINES[currentLine];
        setTerminalLines(prev => [...prev, lineToAppend]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const handlePersonaSelect = (id: string) => {
    setSelectedPersona(id);
    setResult(null);
    setStatus('idle');
    setProcessingLines([]);
    setSource(null);
  };

  const handleRunAnalysis = async () => {
    setStatus('loading');
    setResult(null);
    setProcessingLines([]);
    setSource(null);

    // Stagger processing lines
    let currentLine = 0;
    const lineInterval = setInterval(() => {
      if (currentLine < PROCESSING_LINES.length) {
        const lineToAppend = PROCESSING_LINES[currentLine];
        setProcessingLines(prev => [...prev, lineToAppend]);
        currentLine++;
      } else {
        clearInterval(lineInterval);
      }
    }, 400);

    try {
      const { result: data, live } = await runAnalysisLiveOrMock(selectedPersona);
      const totalLinesTime = PROCESSING_LINES.length * 400;
      setTimeout(() => {
        clearInterval(lineInterval);
        setResult(data);
        setSource(live ? 'live': 'demo');
        setStatus('done');
      }, totalLinesTime + 400);
    } catch (error) {
      console.error('Analysis failed', error);
      clearInterval(lineInterval);
      setStatus('idle');
    }
  };

  const copyJson = () => {
    const payload = PAYLOADS[selectedPersona as keyof typeof PAYLOADS];
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied('json');
    setTimeout(() => setCopied(null), 2000);
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied('result');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const downloadPDF = async () => {
    if (!result) return;
    // For a live decision, download the authoritative server-rendered audit PDF
    // (full 24-rule ledger + tamper-evident footer). Fall back to the local
    // client PDF for the demo / unauthenticated path.
    if (source === 'live' && result.audit_id) {
      try {
        const res = await underwritingApi.auditPdf(result.audit_id);
        if (!res.ok) throw new Error(`Audit PDF endpoint returned ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gavel-audit-${result.audit_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      } catch (err) {
        console.error('Live audit PDF download failed, using local fallback', err);
      }
    }
    generateAnalysisPDF(result);
  };

  const persona = PERSONAS.find(p => p.id === selectedPersona);
  const payload = PAYLOADS[selectedPersona as keyof typeof PAYLOADS] as any;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <section className="container mx-auto px-6 max-w-7xl">

          {/* HEADER */}
          <div className="mb-8 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Sandbox Underwriting Engine
            </h1>
            <p className="text-lg text-muted-foreground">
              Experience instant credit decisions powered by our AI-driven underwriting engine.
              Select a borrower profile and watch real-time evaluation with transparent reasoning.
            </p>
          </div>

          {/* MAIN LAYOUT */}
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 h-[calc(100vh-300px)]">

            {/* LEFT PANEL - REQUEST & PERSONAS */}
            <div className="flex flex-col gap-4">

              {/* TERMINAL BOOT SEQUENCE */}
              <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col h-[140px]">
                <div className="h-[36px] border-b border-border flex items-center px-3 shrink-0 bg-foreground/5">
                  <span className="font-['JetBrains_Mono'] text-[11px] text-foreground/70">Gavel Sandbox v2.1.0</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 font-['JetBrains_Mono'] text-[11px]">
                  {terminalLines.map((line, i) => (
                    <div key={i} className="text-foreground/60 whitespace-nowrap">
                      {line}
                    </div>
                  ))}
                  {terminalLines.length === TERMINAL_LINES.length && (
                    <span className="inline-block w-1.5 h-3 bg-foreground/60 ml-1 animate-[blink_1.2s_step-end_infinite]">_</span>
                  )}
                </div>
              </div>

              {/* PERSONA SELECTOR */}
              <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col flex-1">
                <div className="h-[40px] border-b border-border flex items-center px-4 shrink-0 bg-foreground/5">
                  <span className="font-['DM_Sans'] font-semibold text-[12px] text-foreground/70 uppercase tracking-wider">Sample Personas</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePersonaSelect(p.id)}
                      className={`w-full text-left bg-muted border rounded-lg p-3 transition-all ${
                        selectedPersona === p.id
                          ? p.expected === 'APPROVE'
                            ? 'border-[#00FF94] border-l-4 border-l-[#00FF94] bg-[rgba(0,255,148,0.05)]'
: p.expected === 'REJECT'
                              ? 'border-[#FF4444] border-l-4 border-l-[#FF4444] bg-[rgba(255,68,68,0.05)]'
: 'border-[#F59E0B] border-l-4 border-l-[#F59E0B] bg-[rgba(245,158,11,0.05)]'
: 'border-border hover:border-foreground/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-['DM_Sans'] font-semibold text-[13px] text-foreground">{p.name}</div>
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          p.expected === 'APPROVE' ? 'bg-[rgba(0,255,148,0.1)] text-[#00FF94]':
                          p.expected === 'REJECT' ? 'bg-[rgba(255,68,68,0.1)] text-[#FF4444]':
                          'bg-[rgba(245,158,11,0.1)] text-[#F59E0B]'
                        }`}>
                          {p.expected}
                        </div>
                      </div>
                      <div className="font-['DM_Sans'] text-[12px] text-foreground/70 mb-1">{p.description}</div>
                      <div className="font-['JetBrains_Mono'] text-[11px] text-foreground/70">
                        ₹{p.income.toLocaleString('en-IN')}/month
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* RUN BUTTON */}
              <button
                onClick={handleRunAnalysis}
                disabled={status === 'loading'}
                className={`h-[56px] rounded-lg border font-['DM_Sans'] font-bold text-[14px] flex items-center justify-center gap-2 transition-all ${
                  status === 'loading'
                    ? 'bg-[rgba(249,115,22,0.6)] border-border cursor-not-allowed'
: status === 'done'
                      ? 'bg-[rgba(0,255,148,0.15)] border-border text-[#00FF94]'
: 'bg-[#F97316] text-black border-border hover:opacity-90 active:scale-95'
                }`}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ): status === 'done' && result ? (
                  <>
                    <CheckCircle2 size={18} className="text-[#00FF94]" />
                    Complete, {result.processing_time_ms}ms
                  </>
                ): (
                  <>
                    <Play size={18} />
                    RUN ANALYSIS
                  </>
                )}
              </button>
            </div>

            {/* RIGHT PANEL - RESPONSE & DETAILS */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">

              {/* HEADER BAR */}
              <div className="h-[48px] border-b border-border flex items-center justify-between px-4 shrink-0 bg-foreground/5">
                <span className="font-['JetBrains_Mono'] font-bold text-[12px] text-foreground/70">
                  POST /v1/underwriting/analyze
                </span>

                {status === 'done' && result && (
                  <div className="flex items-center gap-2">
                    {source === 'live' ? (
                      <div className="flex items-center gap-1 bg-[rgba(0,255,148,0.1)] border border-border text-[#00FF94] font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded-[4px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF94] animate-pulse" />
                        LIVE
                      </div>
                    ): (
                      <div className="bg-[rgba(245,158,11,0.1)] border border-border text-[#F59E0B] font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded-[4px]">
                        DEMO
                      </div>
                    )}
                    <div className="bg-[rgba(0,255,148,0.1)] border border-border text-[#00FF94] font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded-[4px]">
                      200 OK
                    </div>
                    <button onClick={copyResult} className="text-foreground/70 hover:text-foreground p-1 transition-colors">
                      <Copy size={14} />
                    </button>
                    <button onClick={downloadPDF} className="text-foreground/70 hover:text-foreground p-1 transition-colors">
                      <Download size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 overflow-y-auto flex flex-col">
                <AnimatePresence mode="wait">

                  {status === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6 font-['JetBrains_Mono'] text-[12px] text-foreground/60 space-y-1"
                    >
                      {terminalLines.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                      <div className="text-foreground/40 mt-4">
                        {">"} Select a persona and click RUN ANALYSIS to evaluate...
                      </div>
                    </motion.div>
                  )}

                  {status === 'loading' && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6 font-['JetBrains_Mono'] text-[12px] space-y-1"
                    >
                      {processingLines.map((line, i) => (
                        <div key={i} className={
                          (line && line.includes('Decision ready')) ? 'text-[#00FF94]':
                          (line && line.includes('policy rules')) ? 'text-[#F97316]':
                          'text-foreground/60'
                        }>
                          {line}
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {status === 'done' && result && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 space-y-4 pb-6"
                    >
                      {/* ERROR STATE */}
                      {result.error ? (
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-[rgba(255,68,68,0.08)] border border-border rounded-lg p-4"
                        >
                          <div className="flex gap-2.5 items-start">
                            <AlertTriangle size={18} className="text-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-['JetBrains_Mono'] font-bold text-[13px] text-foreground block">
                                {result.error.code}, {result.error.message}
                              </span>
                              <p className="mt-1 font-['DM_Sans'] font-normal text-[12px] text-foreground/70">
                                {result.error.detail}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ): (
                        <>
                          {/* DECISION BANNER */}
                          <motion.div
                            initial={{ y: -12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.35 }}
                            className={`rounded-lg p-4 flex justify-between items-center ${
                              result.decision === 'APPROVE' ? 'bg-[rgba(0,255,148,0.08)] border border-border':
                              result.decision === 'REJECT' ? 'bg-[rgba(255,68,68,0.08)] border border-border':
                              'bg-[rgba(245,158,11,0.08)] border border-border'
                            }`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2.5">
                                {result.decision === 'APPROVE' && <CheckCircle2 size={24} className="text-[#00FF94]" />}
                                {result.decision === 'REJECT' && <XCircle size={24} className="text-foreground" />}
                                {result.decision === 'REVIEW' && <AlertCircle size={24} className="text-foreground" />}
                                <span className={`font-['DM_Sans'] font-extrabold text-[20px] ${
                                  result.decision === 'APPROVE' ? 'text-[#00FF94]':
                                  result.decision === 'REJECT' ? 'text-foreground':
                                  'text-foreground'
                                }`}>
                                  {result.decision === 'APPROVE' ? 'APPROVED': result.decision === 'REJECT' ? 'REJECTED': 'REVIEW REQUIRED'}
                                </span>
                              </div>
                              {(result.decision === 'APPROVE' || result.decision === 'REVIEW') && (
                                <span className="mt-1 font-['DM_Sans'] font-semibold text-[13px] text-foreground/70">
                                  Credit Limit: ₹{result.credit_limit.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="relative w-16 h-16">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="transparent" />
                                  <circle
                                    cx="32" cy="32" r="28"
                                    stroke={result.risk_score > 65 ? '#00FF94': result.risk_score > 40 ? '#F59E0B': '#FF4444'}
                                    strokeWidth="3"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 28}
                                    strokeDashoffset={2 * Math.PI * 28 * (1 - (result.risk_score / 100) * 0.75)}
                                    className="transition-all duration-1000 ease-out"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="font-['JetBrains_Mono'] font-bold text-[16px] text-foreground">{result.risk_score}</span>
                                </div>
                              </div>
                              <span className="mt-1 font-['JetBrains_Mono'] text-[10px] text-foreground/70">
                                {(result.confidence * 100).toFixed(0)}% conf
                              </span>
                            </div>
                          </motion.div>

                          {/* TABS */}
                          <div className="flex gap-1 border-b border-border">
                            <button
                              onClick={() => setActiveTab('statement')}
                              className={`px-3 py-2 text-[12px] font-['DM_Sans'] font-semibold border-b-2 transition-colors ${
                                activeTab === 'statement'
                                  ? 'border-[#F97316] text-foreground'
: 'border-transparent text-foreground/70 hover:text-foreground'
                              }`}
                            >
                              Bank Statement
                            </button>
                            <button
                              onClick={() => setActiveTab('details')}
                              className={`px-3 py-2 text-[12px] font-['DM_Sans'] font-semibold border-b-2 transition-colors ${
                                activeTab === 'details'
                                  ? 'border-[#F97316] text-foreground'
: 'border-transparent text-foreground/70 hover:text-foreground'
                              }`}
                            >
                              Analysis
                            </button>
                          </div>

                          {/* BANK STATEMENT TAB */}
                          {activeTab === 'statement' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-3"
                            >
                              <div className="bg-muted border border-border rounded-lg p-3">
                                <div className="text-[11px] font-['JetBrains_Mono'] text-foreground/70 space-y-1">
                                  <div><span className="text-foreground/50">Account:</span> <span className="text-foreground">{payload.bank_statement.account_number}</span></div>
                                  <div><span className="text-foreground/50">Bank:</span> <span className="text-foreground">{payload.bank_statement.bank}</span></div>
                                  <div><span className="text-foreground/50">Period:</span> <span className="text-foreground">{payload.bank_statement.period}</span></div>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="text-[11px] font-['DM_Sans'] font-semibold text-foreground/70 uppercase">Transactions</div>
                                {payload.bank_statement.transactions.map((tx: any, i: number) => (
                                  <div key={i} className="bg-muted border border-border rounded-lg p-2 font-['JetBrains_Mono'] text-[11px]">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="text-foreground/70">{tx.date}</div>
                                      <div className={tx.type === 'credit' ? 'text-[#00FF94]': 'text-[#FF4444]'}>
                                        {tx.type === 'credit' ? '+': ''} ₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                      </div>
                                    </div>
                                    <div className="text-foreground/60">{tx.description}</div>
                                    <div className="text-foreground/50 mt-1">Balance: ₹{tx.balance.toLocaleString('en-IN')}</div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* ANALYSIS TAB */}
                          {activeTab === 'details' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-4"
                            >
                              {/* DECISION FACTORS */}
                              {result.reasons?.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-[12px] font-['DM_Sans'] font-semibold text-foreground/70">Decision Factors</div>
                                  <div className="space-y-2">
                                    {result.reasons?.map((reason, i) => (
                                      <motion.div
                                        key={reason.code}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.08 }}
                                        className="bg-muted border border-border rounded-lg p-2.5"
                                      >
                                        <div className="flex justify-between mb-1">
                                          <span className="font-['DM_Sans'] text-[12px] font-semibold text-foreground">{reason.label}</span>
                                          <span className="font-['JetBrains_Mono'] text-[11px] text-foreground/70">{(reason.weight * 100).toFixed(0)}%</span>
                                        </div>
                                        <p className="font-['DM_Sans'] text-[11px] text-foreground/70 mb-1.5">{reason.detail}</p>
                                        <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${reason.weight * 100}%` }}
                                            transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
                                            className={`h-full ${
                                              reason.sentiment === 'positive' ? 'bg-[#10B981]':
                                              reason.sentiment === 'negative' ? 'bg-[#FF4444]':
                                              'bg-[#F59E0B]'
                                            }`}
                                          />
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* RULES EVALUATED */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="text-[12px] font-['DM_Sans'] font-semibold text-foreground/70">Rules Evaluated</div>
                                  <div className={`font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded ${
                                    result.rules_fired?.filter(r => r.result).length > 2 ? 'text-[#00FF94] bg-[rgba(0,255,148,0.1)]': 'text-foreground bg-[rgba(255,68,68,0.1)]'
                                  }`}>
                                    {result.rules_fired?.filter(r => !r.skipped).length}/{result.rules_fired?.length}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {result.rules_fired?.map((rule) => (
                                    <div key={rule.id} className="flex items-center gap-2 bg-muted border border-border rounded-lg p-1.5 font-['JetBrains_Mono'] text-[11px]">
                                      <div className="shrink-0">
                                        {rule.skipped ? (
                                          <span className="text-foreground/50">, </span>
                                        ): rule.result ? (
                                          <CheckCircle2 size={14} className="text-[#00FF94]" />
                                        ): (
                                          <XCircle size={14} className="text-foreground" />
                                        )}
                                      </div>
                                      <span className="text-foreground/70 min-w-[40px]">{rule.id}</span>
                                      <span className="text-foreground/70 flex-1">{rule.name}</span>
                                      <span className="text-foreground/50">{rule.condition}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* RAW JSON */}
                              <div className="border-t border-border pt-3">
                                <button
                                  onClick={() => setJsonExpanded(!jsonExpanded)}
                                  className="flex justify-between items-center w-full cursor-pointer group"
                                >
                                  <span className="text-[12px] font-['DM_Sans'] font-semibold text-foreground/70">Raw Response</span>
                                  <ChevronDown size={14} className={`text-foreground/70 transition-transform ${jsonExpanded ? 'rotate-180': ''}`} />
                                </button>

                                <AnimatePresence>
                                  {jsonExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden mt-2"
                                    >
                                      <pre className="bg-muted border border-border rounded-lg p-3 font-['JetBrains_Mono'] text-[10px] text-foreground/70 max-h-[240px] overflow-y-auto whitespace-pre-wrap word-break-all">
                                        {JSON.stringify(result, null, 2)}
                                      </pre>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Sandbox;
