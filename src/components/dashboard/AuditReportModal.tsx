import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Printer, ShieldCheck,
  Clock, Database, Fingerprint, ExternalLink,
  ChevronRight, FileText, CheckCircle2, Lock
} from 'lucide-react';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logId?: string;
}

const AuditReportModal: React.FC<AuditReportModalProps> = ({ isOpen, onClose, logId }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl h-[90vh] bg-surface border border-border rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-foreground/5 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg tracking-tight">Audit Verification</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID: {logId || "AUD-9921"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-3 hover:bg-foreground/5 rounded-xl text-muted-foreground transition-all">
                  <Printer size={18} />
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-glow hover:opacity-90 transition-all">
                  <Download size={16} /> Export PDF
                </button>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-foreground/5 rounded-xl text-muted-foreground transition-all ml-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Report Content */}
            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-white text-black font-mono">
              {/* Report Header Logo/Metadata */}
              <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
                <div>
                   <h1 className="text-3xl font-black uppercase tracking-tighter mb-1 font-sans">GAVEL ENGINE</h1>
                   <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Regulator Export Generator (RBI Sub-Clause 11B)</p>
                </div>
                <div className="text-right text-xs">
                   <p><strong>Export Hash:</strong> 8F92-XA1B-44LL-0001</p>
                   <p><strong>Generation DB Time:</strong> {new Date().toISOString()}</p>
                   <p><strong>Record Status:</strong> <span className="bg-background text-foreground px-2 py-0.5 rounded ml-1">IMMUTABLE / SEALED</span></p>
                </div>
              </div>

              {/* Core Snapshot */}
              <h2 className="text-sm font-black uppercase tracking-widest border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                 <Database size={16} /> Trace Record: {logId || "AUD-9921"}
              </h2>

              <div className="grid grid-cols-2 gap-8 mb-10 text-sm font-sans">
                 <div>
                    <p className="mb-2"><span className="text-muted-foreground w-32 inline-block">Execute Engine:</span> System Deterministic Node</p>
                    <p className="mb-2"><span className="text-muted-foreground w-32 inline-block">Trigger Source:</span> API.Ingress.v1</p>
                    <p className="mb-2"><span className="text-muted-foreground w-32 inline-block">Execution Policy:</span> risk_policy_v2_1.json</p>
                 </div>
                 <div>
                    <p className="mb-2"><span className="text-muted-foreground w-32 inline-block">Decision:</span> <strong className="text-green-700">APPROVED</strong></p>
                    <p className="mb-2"><span className="text-muted-foreground w-32 inline-block">Compute Time:</span> 42ms</p>
                    <p className="mb-2"><span className="text-muted-foreground w-32 inline-block">Compliance:</span> VERIFIED (Level 1)</p>
                 </div>
              </div>

              {/* Logic Chain */}
              <h2 className="text-sm font-black uppercase tracking-widest border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                 <Fingerprint size={16} /> Cryptographic Proof of Logic
              </h2>

              <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
                <div className="space-y-4">
                  {[
                    { rule: "R-001", name: "MIN_TENURE_CHECK", result: "PASS", evidence: "Detected: 24mo | Req: 6mo" },
                    { rule: "R-004", name: "STABLE_INCOME_VERIFY", result: "PASS", evidence: "Mean: ₹84,200 | Variance: <5%" },
                    { rule: "R-007", name: "FRAUD_PATTERN_SCAN", result: "PASS", evidence: "No circular transaction loops detected" },
                    { rule: "R-012", name: "BUREAU_HARD_PULL", result: "PASS", evidence: "Experian: 782 | Equifax: 774" },
                  ].map(step => (
                    <div key={step.rule} className="flex items-start justify-between text-xs border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span className="text-muted-foreground">{step.rule}</span> {step.name}
                        </div>
                        <div className="text-muted-foreground mt-1">{step.evidence}</div>
                      </div>
                      <div className="font-black text-green-700">{step.result}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immutable Hash Footnote */}
              <div className="mt-auto pt-10 border-t border-dashed border-gray-300">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-gray-100 rounded">
                    <div className="w-16 h-16 bg-white border border-gray-300 flex items-center justify-center">
                       <div className="w-12 h-12 bg-background/5 flex flex-wrap gap-1 p-1">
                          {Array.from({length: 16}).map((_, i) => <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-background': 'bg-gray-300'}`} />)}
                       </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">SHA-256 Ledger Verification</p>
                    <code className="text-[10px] break-all text-gray-600 block leading-relaxed">
                      0x8f92xa1b44ll0001c9e782f59e0bc9e782f59e0bc9e782f59e0bc9e782f59e0b
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Ambient) */}
            <div className="p-6 bg-foreground/5 border-t border-white/5 flex items-center justify-center gap-3">
              <Lock size={12} className="text-muted-foreground" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">End of Compliance Record, Gavel Deterministic Engine v2.1.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuditReportModal;
