import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, ShieldCheck, X, FileText, Database, Server } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AaConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentSuccess: () => void;
}

export default function AaConsentModal({ isOpen, onClose, onConsentSuccess }: AaConsentModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleConsent = async () => {
    setLoading(true);
    // Simulate real AA consent handshake
    setTimeout(() => {
      setLoading(false);
      toast.success("RBI AA Mandate Verified. Secure pipeline established.");
      onConsentSuccess();
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-background border border-border rounded-[2rem] shadow-2xl z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-foreground/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <ShieldCheck size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Sahamati AA Consent</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Financial Information User (FIU)</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors"
                disabled={loading}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-sm text-foreground/80 mb-8">
                    <Database className="text-muted-foreground" size={24} />
                    <div className="flex-1 h-px bg-foreground/10 relative">
                       <motion.div 
                         animate={{ x: ["0%", "100%"] }} 
                         transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                         className="absolute top-0 left-0 h-full w-10 bg-primary/50 blur-sm"
                       />
                    </div>
                    <Server className="text-primary" size={24} />
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You are enabling a real-time data pipe to RBI-regulated Account Aggregators (AAs). Gavel AI operates as an authorized FIU node.
                  </p>
                  
                  <div className="bg-foreground/5 border border-border p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Data Scopes Requested</h4>
                    {[
                      "Deposit Accounts (6 Months History)",
                      "Term Deposits & Mutual Funds",
                      "GST Returns (Optional)"
                    ].map((scope, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle size={14} className="text-green-500" />
                        <span className="text-xs text-foreground/80 font-mono">{scope}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setStep(2)}
                    className="w-full py-4 mt-4 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Review Legal Mandate
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-40 overflow-y-auto custom-scrollbar bg-background/40 p-4 rounded-xl border border-white/5 text-[10px] text-muted-foreground font-mono leading-relaxed">
                    <p className="mb-2">1. DATA MINIMIZATION: Gavel AI engine will only extract transactional risk vectors. Raw strings are scrubbed instantly.</p>
                    <p className="mb-2">2. REVOCATION: The user holds irrevocable rights to pause the pipeline via their Sahamati app interfaces.</p>
                    <p className="mb-2">3. PURPOSE: Primary risk alignment. Data will strictly NOT be used for marketing cross-sells.</p>
                    <p className="mb-8">By proceeding, you attest to owning the DPDP-compliant consent workflows before routing your applicants to this vector.</p>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 py-4 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-xl font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={handleConsent}
                      disabled={loading}
                      className="flex-1 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-glow disabled:opacity-80 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Approve & Connect"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
