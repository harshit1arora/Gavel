import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  PERSONAS,
  PAYLOADS,
  runAnalysis,
  AnalysisResult,
  Persona,
  TERMINAL_LINES,
  PROCESSING_LINES
} from '@/lib/mock-engine';
import { generateAnalysisPDF } from '@/lib/pdf-generator';
import {
  Play,
  Copy,
  Terminal as TerminalIcon,
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
  ArrowLeft
} from 'lucide-react';

const Playground = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'json' | 'personas' | 'pdf'>('personas');
  const [selectedPersona, setSelectedPersona] = useState<string>('strong');
  const [jsonValue, setJsonValue] = useState(JSON.stringify(PAYLOADS['strong'], null, 2));
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [processingLines, setProcessingLines] = useState<string[]>([]);
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [copied, setCopied] = useState<'curl' | 'json' | 'result' | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parseStatus, setParseStatus] = useState<'idle' | 'uploading' | 'parsing' | 'done' | 'error'>('idle');
  const [parseResult, setParseResult] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const PARSE_STEPS = [
    { id: 1, label: 'Reading PDF file...' },
    { id: 2, label: 'Extracting text content...' },
    { id: 3, label: 'Detecting bank format...' },
    { id: 4, label: 'Identifying transactions...' },
    { id: 5, label: 'Normalizing amounts and dates...' },
    { id: 6, label: 'Categorizing transactions...' },
    { id: 7, label: 'Validating extracted data...' },
    { id: 8, label: 'Ready for underwriting engine.' },
  ];

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const handlePdfUpload = async (file: File) => {
    setPdfFile(file);
    setParseStatus('uploading');
    setParseError(null);
    setCompletedSteps([]);

    const stepInterval = setInterval(() => {
      setCompletedSteps(prev => {
        if (prev.length >= 7) {
          clearInterval(stepInterval);
          return prev;
        }
        return [...prev, prev.length + 1];
      });
    }, 400);

    try {
      setParseStatus('parsing');

      const formData = new FormData();
      formData.append('statement', file);

      const response = await fetch(`${API_BASE}/v1/parse/bank-statement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk_test_demo`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.detail || data.error?.message || 'Parsing failed');
      }

      clearInterval(stepInterval);
      setCompletedSteps([1, 2, 3, 4, 5, 6, 7, 8]);
      setParseResult(data);
      setParseStatus('done');

      const payload = {
        applicant: {
          name: data.data.account_holder || 'Applicant',
          pan: 'AUTO_DETECTED',
          monthly_income_declared: null
        },
        bank_statement: data.data,
        loan_request: {
          amount: 200000,
          tenure_months: 24,
          purpose: 'general'
        }
      };

      setJsonValue(JSON.stringify(payload, null, 2));
      toast.success('PDF parsed! Switch to JSON tab or run analysis.');

    } catch (err: any) {
      clearInterval(stepInterval);
      setParseError(err.message);
      setParseStatus('error');
      toast.error(err.message);
    }
  };

  // Terminal typewriter effect on mount
  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < TERMINAL_LINES.length) {
        setTerminalLines(prev => [...prev, TERMINAL_LINES[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400); // Slightly slower for readability
    return () => clearInterval(interval);
  }, []);

  const handlePersonaSelect = (id: string) => {
    setSelectedPersona(id);
    setJsonValue(JSON.stringify(PAYLOADS[id], null, 2));
    setActiveTab('json');
    setResult(null);
    setStatus('idle');
    setProcessingLines([]);
  };

  const handleRunAnalysis = async () => {
    setStatus('loading');
    setResult(null);
    setProcessingLines([]);

    // Stagger processing lines for "Stripe-like" heavy-duty feel
    let currentLine = 0;
    const lineInterval = setInterval(() => {
      if (currentLine < PROCESSING_LINES.length) {
        setProcessingLines(prev => [...prev, PROCESSING_LINES[currentLine]]);
        currentLine++;
      }
    }, 400);

    try {
      const data = await runAnalysis(selectedPersona);
      // Wait for all lines to show before showing result
      const totalLinesTime = PROCESSING_LINES.length * 400;
      setTimeout(() => {
        clearInterval(lineInterval);
        setResult(data);
        setStatus('done');
      }, totalLinesTime + 400);
    } catch (error) {
      console.error('Analysis failed', error);
      setStatus('idle');
    }
  };

  const copyCurl = () => {
    const curl = `curl -X POST https://api.gavel.in/v1/underwriting/analyze \\
  -H "Authorization: Bearer sk_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '${jsonValue}'`;
    navigator.clipboard.writeText(curl);
    setCopied('curl');
    setTimeout(() => setCopied(null), 2000);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(jsonValue);
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

  const downloadPDF = () => {
    if (result) {
      generateAnalysisPDF(result);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background overflow-hidden">
      {/* BACK BUTTON HEADER */}
      <div className="h-[56px] border-b border-border flex items-center px-4 shrink-0 bg-background/50 backdrop-blur-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all duration-200 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-['DM_Sans'] text-[14px] font-medium">Back to Home</span>
        </button>
      </div>

      {/* PLAYGROUND CONTENT */}
      <div className="flex flex-1 bg-background overflow-hidden">
      {/* LEFT PANEL (55%) */}
      <div className="w-[55%] bg-surface border-r border-border flex flex-col h-full">
        {/* HEADER BAR */}
        <div className="h-[48px] border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-[rgba(0,255,148,0.1)] border border-border text-[#00FF94] font-['JetBrains_Mono'] font-bold text-[10px] px-[7px] py-[2px] rounded-[4px]">POST</span>
            <span className="font-['JetBrains_Mono'] text-[13px] text-foreground/70">/v1/underwriting/analyze</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyCurl}
              className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[11px] text-foreground/70 border border-border px-[10px] py-[4px] rounded-[4px] hover:text-foreground hover:border-border transition-all relative"
            >
              <TerminalIcon size={12} /> {copied === 'curl' ? 'Copied!': '▷ cURL'}
            </button>
            <button
              onClick={copyJson}
              className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[11px] text-foreground/70 border border-border px-[10px] py-[4px] rounded-[4px] hover:text-foreground hover:border-border transition-all relative"
            >
              <Copy size={12} /> {copied === 'json' ? 'Copied!': '⧉ Copy'}
            </button>
          </div>
        </div>

        {/* TAB BAR */}
        <div className="h-[40px] border-b border-border flex items-center px-4 gap-1 shrink-0">
          {[
            { id: 'json', label: 'JSON Input' },
            { id: 'personas', label: 'Sample Personas' },
            { id: 'pdf', label: 'Upload PDF' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 h-full font-['DM_Sans'] text-[13px] transition-all relative ${
                activeTab === tab.id
                  ? 'text-foreground border-b-2 border-[#F97316]'
: 'text-foreground/70 hover:text-foreground/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-y-auto relative flex flex-col">
          {activeTab === 'json' && (
            <>
              <textarea
                value={jsonValue}
                onChange={(e) => setJsonValue(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-background border-none outline-none p-6 font-['JetBrains_Mono'] text-[13px] leading-[1.7] text-muted-foreground resize-none"
              />
              <div className="h-[24px] border-t border-border px-4 flex items-center justify-between shrink-0">
                <div className="flex gap-4">
                  <span className="font-['JetBrains_Mono'] text-[11px] text-foreground/70">JSON</span>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-foreground/70">UTF-8</span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[11px] text-foreground/70">Ready</span>
              </div>
            </>
          )}

          {activeTab === 'personas' && (
            <div className="p-4 space-y-2.5">
              {PERSONAS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handlePersonaSelect(p.id)}
                  className={`bg-muted border rounded-[6px] p-[14px_16px] cursor-pointer flex items-center gap-3 transition-all ${
                    selectedPersona === p.id
                      ? p.expected === 'APPROVE'
                        ? 'border-border border-l-[3px] border-l-[#00FF94]'
: p.expected === 'REJECT'
                          ? 'border-border border-l-[3px] border-l-[#FF4444]'
: 'border-border border-l-[3px] border-l-[#F59E0B]'
: 'border-border'
                  }`}
                >
                  <div className={`px-2 py-0.5 rounded-[4px] font-['DM_Sans'] font-bold text-[11px] shrink-0 ${
                    p.expected === 'APPROVE' ? 'bg-[rgba(0,255,148,0.1)] text-[#00FF94]':
                    p.expected === 'REJECT' ? 'bg-[rgba(255,68,68,0.1)] text-foreground':
                    'bg-[rgba(245,158,11,0.1)] text-foreground'
                  }`}>
                    {p.expected}
                  </div>
                  <div className="flex-1">
                    <div className="font-['DM_Sans'] font-semibold text-[14px] text-foreground leading-none mb-1">{p.name}</div>
                    <div className="font-['DM_Sans'] font-normal text-[12px] text-foreground/70">{p.description}</div>
                  </div>
                  <div className={`font-['JetBrains_Mono'] text-[12px] shrink-0 ${
                    p.income > 0
                      ? p.expected === 'REJECT' ? 'text-foreground': 'text-[#00FF94]'
: 'text-foreground/70'
                  }`}>
                    {p.income > 0 ? `₹${p.income.toLocaleString('en-IN')}/mo`: 'No data'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="p-6">
              {parseStatus === 'idle' && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file?.type === 'application/pdf') { handlePdfUpload(file); }
                  }}
                  onClick={() => document.getElementById('pdf-input')?.click()}
                  className={`border-2 border-dashed rounded-[8px] p-[48px_24px] text-center cursor-pointer transition-all ${
                    dragOver ? 'border-[rgba(249,115,22,0.5)] bg-[rgba(249,115,22,0.04)]': 'border-border bg-border/30 hover:bg-border/50'
                  }`}
                >
                  <input
                    id="pdf-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePdfUpload(file); }}
                  />
                  <FileText size={32} className="mx-auto mb-4 text-foreground/30" />
                  <div className="font-['DM_Sans'] font-semibold text-[14px] text-foreground/60 mb-1">Drop bank statement PDF here</div>
                  <div className="font-['DM_Sans'] font-normal text-[12px] text-foreground/30 mt-1">HDFC · SBI · ICICI · Axis · PNB · Kotak</div>
                  <div className="mt-5 inline-flex items-center gap-2 bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.2)] rounded-[4px] px-3 py-1.5">
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#F97316]">Parsed by AI · Decided by rules</span>
                  </div>
                </div>
              )}

              {(parseStatus === 'uploading' || parseStatus === 'parsing') && (
                <div className="p-6">
                  <p className="font-['JetBrains_Mono'] text-[12px] text-foreground/40 mb-5">Parsing {pdfFile?.name}...</p>
                  {PARSE_STEPS.map((step) => (
                    <div key={step.id} className={`flex items-center gap-2.5 mb-2.5 transition-opacity ${completedSteps.includes(step.id) ? 'opacity-100': 'opacity-30'}`}>
                      <span className={`${completedSteps.includes(step.id) ? 'text-[#00FF94]': 'text-foreground/20'} font-['JetBrains_Mono'] text-[14px] w-4`}>
                        {completedSteps.includes(step.id) ? '✓': '○'}
                      </span>
                      <span className={`font-['JetBrains_Mono'] text-[12px] ${completedSteps.includes(step.id) ? 'text-foreground/70': 'text-foreground/25'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {parseStatus === 'done' && parseResult && (
                <div className="p-4">
                  <div className="bg-[rgba(0,255,148,0.08)] border border-[rgba(0,255,148,0.2)] rounded-[6px] p-3.5 mb-4 flex justify-between items-center">
                    <div>
                      <p className="font-['JetBrains_Mono'] text-[12px] text-[#00FF94]">✓ Parsed successfully</p>
                      <p className="font-['DM_Sans'] text-[13px] text-foreground/60 mt-1">{parseResult.bank_detected} · {parseResult.transactions_found} transactions · {(parseResult.confidence * 100).toFixed(0)}% confidence</p>
                    </div>
                    <span className="font-['JetBrains_Mono'] text-[11px] text-foreground/30">{parseResult.period_detected}</span>
                  </div>

                  <p className="font-['DM_Sans'] text-[12px] text-foreground/30 mb-2">Showing first 5 of {parseResult.transactions_found} transactions</p>

                  {parseResult.data.transactions.slice(0, 5).map((t: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-foreground/5">
                      <div>
                        <p className="font-['DM_Sans'] text-[12px] text-foreground/70">{t.description.substring(0, 35)}{t.description.length > 35 ? '...': ''}</p>
                        <p className="font-['JetBrains_Mono'] text-[11px] text-foreground/30 mt-0.5">{t.date} · {t.category}</p>
                      </div>
                      <span className={`font-['JetBrains_Mono'] text-[13px] ${t.amount > 0 ? 'text-[#00FF94]': 'text-[#FF4444]'}`}>
                        {t.amount > 0 ? '+': ''}₹{Math.abs(t.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}

                  <div className="mt-4 bg-[rgba(249,115,22,0.06)] border border-[rgba(249,115,22,0.15)] rounded-[6px] p-3">
                    <p className="font-['JetBrains_Mono'] text-[11px] text-[#F97316]">→ JSON tab auto-populated. Switch to JSON tab or click RUN ANALYSIS.</p>
                  </div>

                  <button
                    onClick={() => { setPdfFile(null); setParseStatus('idle'); setParseResult(null); setCompletedSteps([]); }}
                    className="mt-3 font-['DM_Sans'] text-[12px] text-foreground/30 bg-transparent border-none cursor-pointer underline"
                  >
                    Upload a different PDF
                  </button>
                </div>
              )}

              {parseStatus === 'error' && (
                <div className="m-4 bg-[rgba(255,68,68,0.08)] border border-[rgba(255,68,68,0.2)] rounded-[6px] p-4">
                  <p className="font-['JetBrains_Mono'] text-[12px] text-[#FF4444] mb-2">✗ Parse failed</p>
                  <p className="font-['DM_Sans'] text-[13px] text-foreground/50">{parseError}</p>
                  <button
                    onClick={() => { setPdfFile(null); setParseStatus('idle'); setParseError(null); }}
                    className="mt-3 font-['DM_Sans'] text-[12px] text-[#F97316] bg-transparent border border-[rgba(249,115,22,0.3)] rounded-[4px] px-3 py-1.5 cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RUN ANALYSIS BUTTON */}
        <button
          onClick={handleRunAnalysis}
          disabled={status === 'loading'}
          className={`h-[56px] w-full border-t flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
            status === 'loading'
              ? 'bg-[rgba(249,115,22,0.6)] border-border cursor-not-allowed'
: status === 'done'
                ? 'bg-[rgba(0,255,148,0.15)] border-border text-[#00FF94]'
: 'bg-[#F97316] text-black border-border animate-[pulseGlow_2.5s_ease-in-out_infinite]'
          }`}
        >
          {status === 'loading' ? (
            <div className="flex items-center gap-2 font-['DM_Sans'] font-bold text-[14px] uppercase">
              <Loader2 size={18} className="animate-spin" /> Processing...
            </div>
          ): status === 'done' && result ? (
            <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[13px]">
              <CheckCircle2 size={16} /> Analysis Complete, {result.processing_time_ms}ms
            </div>
          ): (
            <span className="font-['DM_Sans'] font-bold text-[14px] uppercase tracking-wider">
              ▶ RUN ANALYSIS
            </span>
          )}
        </button>
      </div>

      {/* RIGHT PANEL (45%) */}
      <div className="w-[45%] bg-background flex flex-col h-full overflow-hidden">
        {/* HEADER BAR */}
        <div className="h-[48px] border-b border-border flex items-center justify-between px-4 shrink-0">
          <span className="font-['DM_Sans'] font-semibold text-[13px] text-foreground">Response</span>

          {status === 'done' && result && (
            <div className="flex items-center gap-2">
              <div className="bg-[rgba(0,255,148,0.1)] border border-border text-[#00FF94] font-['JetBrains_Mono'] text-[11px] px-2 py-0.5 rounded-[4px]">
                200 OK
              </div>
              <div className="bg-[rgba(245,158,11,0.1)] text-foreground font-['JetBrains_Mono'] text-[11px] px-2 py-0.5 rounded-[4px]">
                {result.processing_time_ms}ms
              </div>
              <button onClick={copyResult} className="text-foreground/70 hover:text-foreground p-1 transition-colors relative group">
                <Copy size={14} />
                {copied === 'result' && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded">Copied!</span>}
              </button>
              <button onClick={downloadPDF} className="text-foreground/70 hover:text-foreground p-1 transition-colors">
                <Download size={14} />
              </button>
            </div>
          )}
        </div>

        {/* RESPONSE CONTENT */}
        <div className="flex-1 overflow-y-auto p-0 flex flex-col">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-7 font-['JetBrains_Mono'] text-[13px] line-height-[1.8]"
              >
                {terminalLines.map((line, i) => (
                  <div key={i} style={{
                    color: (line && typeof line === 'string' && line.includes('RBI')) ? '#F59E0B':
                           (line && typeof line === 'string' && line.includes('initialized')) ? 'rgba(255,255,255,0.5)':
                           (line && typeof line === 'string' && line.includes('policies')) ? 'rgba(255,255,255,0.4)':
                           (line && typeof line === 'string' && line.includes('Sandbox')) ? 'rgba(255,255,255,0.3)':
                           'rgba(255,255,255,0.2)'
                  }}>
                    {line}
                  </div>
                ))}
                {terminalLines.length === TERMINAL_LINES.length && (
                  <span className="inline-block w-2 h-4 bg-background ml-1 animate-[blink_1.2s_step-end_infinite]">_</span>
                )}
              </motion.div>
            )}

            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-7 font-['JetBrains_Mono'] text-[13px] space-y-1"
              >
                {processingLines.map((line, i) => (
                  <div key={i} style={{
                    color: (line && typeof line === 'string' && line.includes('Decision ready')) ? '#00FF94':
                           (line && typeof line === 'string' && line.includes('policy rules')) ? '#F97316':
                           'rgba(255,255,255,0.6)'
                  }}>
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
                className="p-4 space-y-4 pb-10"
              >
                {/* ERROR STATE */}
                {result.error ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[rgba(255,68,68,0.08)] border border-border rounded-[8px] p-[20px_24px] mx-0 mt-4"
                  >
                    <div className="flex gap-2.5 items-center">
                      <AlertTriangle size={18} className="text-foreground" />
                      <span className="font-['JetBrains_Mono'] font-bold text-[14px] text-foreground">
                        {result.error.code}, {result.error.message}
                      </span>
                    </div>
                    <p className="mt-2 font-['DM_Sans'] font-normal text-[14px] text-foreground/70 leading-[1.6]">
                      {result.error.detail}
                    </p>
                    <div className="mt-3 flex gap-4 font-['JetBrains_Mono'] text-[12px]">
                      <span className="text-foreground/70">Minimum required: 3 months</span>
                      <span className="text-foreground">Detected: 1 month</span>
                    </div>
                  </motion.div>
                ): (
                  <>
                    {/* BLOCK 1: Decision Banner */}
                    <motion.div
                      initial={{ y: -12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.35 }}
                      className={`rounded-[8px] p-[20px_24px] flex justify-between items-center ${
                        result.decision === 'APPROVE' ? 'bg-[rgba(0,255,148,0.08)] border border-border':
                        result.decision === 'REJECT' ? 'bg-[rgba(255,68,68,0.08)] border border-border':
                        'bg-[rgba(245,158,11,0.08)] border border-border'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          {result.decision === 'APPROVE' && <CheckCircle2 size={24} className="text-[#00FF94]" />}
                          {result.decision === 'REJECT' && <XCircle size={24} className="text-foreground" />}
                          {result.decision === 'REVIEW' && <AlertCircle size={24} className="text-foreground" />}
                          <span className={`font-['DM_Sans'] font-extrabold text-[24px] ${
                            result.decision === 'APPROVE' ? 'text-[#00FF94]':
                            result.decision === 'REJECT' ? 'text-foreground':
                            'text-foreground'
                          }`}>
                            {result.decision === 'APPROVE' ? 'APPROVED': result.decision === 'REJECT' ? 'REJECTED': 'REVIEW REQUIRED'}
                          </span>
                        </div>
                        {(result.decision === 'APPROVE' || result.decision === 'REVIEW') && (
                          <span className="mt-1 font-['DM_Sans'] font-semibold text-[14px] text-foreground/70">
                            Credit Limit: ₹{result.credit_limit.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="relative w-[72px] h-[72px]">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="36" cy="36" r="32"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="4"
                              fill="transparent"
                            />
                            <circle
                              cx="36" cy="36" r="32"
                              stroke={result.risk_score > 65 ? '#00FF94': result.risk_score > 40 ? '#F59E0B': '#FF4444'}
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 32}
                              strokeDashoffset={2 * Math.PI * 32 * (1 - (result.risk_score / 100) * 0.75)}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-['JetBrains_Mono'] font-bold text-[18px] text-foreground">{result.risk_score}</span>
                          </div>
                        </div>
                        <span className="mt-1 font-['JetBrains_Mono'] text-[11px] text-foreground/70">
                          Confidence: {(result.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </motion.div>

                    {/* BLOCK 2: Decision Factors */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center px-1">
                        <span className="font-['DM_Sans'] font-semibold text-[13px] text-foreground/70">Decision Factors</span>
                        <span className="font-['JetBrains_Mono'] text-[11px] text-foreground/70">
                          {result.audit_id.slice(0, 24)}...
                        </span>
                      </div>

                      <div className="space-y-3">
                        {result.reasons.map((reason, i) => (
                          <motion.div
                            key={reason.code}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                          >
                            <div className="flex justify-between mb-0.5">
                              <span className="font-['DM_Sans'] font-semibold text-[13px] text-foreground">{reason.label}</span>
                              <span className="font-['JetBrains_Mono'] text-[13px] text-foreground/70">{(reason.weight * 100).toFixed(0)}%</span>
                            </div>
                            <p className="font-['DM_Sans'] font-normal text-[12px] text-foreground/70 mb-1.5">
                              {reason.detail}
                            </p>
                            <div className="h-[5px] bg-foreground/5 rounded-[3px] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${reason.weight * 100}%` }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 + i * 0.08 }}
                                className={`h-full rounded-[3px] ${
                                  reason.sentiment === 'positive' ? 'bg-[#10B981]':
                                  reason.sentiment === 'negative' ? 'bg-[#FF4444]':
                                  'bg-[#F59E0B]'
                                }`}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* BLOCK 3: Rules Fired */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-3"
                    >
                      <div className="flex justify-between items-center px-1">
                        <span className="font-['DM_Sans'] font-semibold text-[13px] text-foreground/70">Rules Evaluated</span>
                        <div className={`font-['JetBrains_Mono'] text-[11px] px-2 py-0.5 rounded-[4px] ${
                          result.rules_fired.filter(r => r.result).length > 2 ? 'text-[#00FF94] bg-[rgba(0,255,148,0.1)]': 'text-foreground bg-[rgba(255,68,68,0.1)]'
                        }`}>
                          {result.rules_fired.filter(r => !r.skipped).length}/{result.rules_fired.length} triggered
                        </div>
                      </div>

                      <div className="space-y-2">
                        {result.rules_fired.map((rule, i) => (
                          <motion.div
                            key={rule.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 + i * 0.05 }}
                            className="flex items-center gap-2.5 px-1"
                          >
                            <div className="shrink-0">
                              {rule.skipped ? (
                                <span className="text-foreground/70 font-bold">, </span>
                              ): rule.result ? (
                                <CheckCircle2 size={16} className="text-[#00FF94]" />
                              ): (
                                <XCircle size={16} className="text-foreground" />
                              )}
                            </div>
                            <span className="font-['JetBrains_Mono'] text-[11px] text-foreground/70 min-w-[40px]">{rule.id}</span>
                            <span className="font-['DM_Sans'] text-[13px] text-foreground/70">{rule.name}</span>
                            <span className="flex-1 text-right font-['JetBrains_Mono'] text-[11px] text-foreground/70">{rule.condition}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* BLOCK 4: Raw JSON */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.75 }}
                      className="border-t border-border pt-4"
                    >
                      <div
                        onClick={() => setJsonExpanded(!jsonExpanded)}
                        className="flex justify-between items-center cursor-pointer px-1 group"
                      >
                        <span className="font-['DM_Sans'] font-semibold text-[13px] text-foreground/70 group-hover:text-foreground/70 transition-colors">Raw Response</span>
                        <div className="flex items-center gap-1.5 font-['DM_Sans'] text-[12px] text-foreground/70 group-hover:text-foreground/70">
                          {jsonExpanded ? '[Collapse ▴]': '[Expand ▾]'}
                        </div>
                      </div>

                      <AnimatePresence>
                        {jsonExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3"
                          >
                            <pre className="bg-muted border border-border rounded-[6px] p-4 font-['JetBrains_Mono'] text-[12px] text-foreground/70 max-height-[240px] overflow-y-auto whitespace-pre word-break-all">
                              {JSON.stringify(result, null, 2)}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0px rgba(249,115,22,0); }
          50% { box-shadow: 0 0 24px rgba(249,115,22,0.5); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
.line-height-1-8 { line-height: 1.8; }
      `}</style>
    </div>
  );
};

export default Playground;
