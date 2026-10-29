import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Terminal, Code, Key, Webhook, FileJson, 
  ChevronRight, Copy, Check, Shield, AlertCircle, 
  Clock, Zap, Globe, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Language = 'curl' | 'nodejs' | 'python';

const ApiDocs = () => {
  const [activeLang, setActiveLang] = useState<Language>('nodejs');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.gavel.in/v1/underwriting/analyze \\
  -H "Authorization: Bearer sk_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicant_id": "cust_9921",
    "product_id": "unsecured_personal_v2",
    "bank_statement_id": "stmt_0041"
  }'`,
    nodejs: `const Gavel = require('@gavel/sdk');
const client = new Gavel('sk_live_xxxx');

const result = await client.underwriting.analyze({
  applicant_id: 'cust_9921',
  product_id: 'unsecured_personal_v2',
  bank_statement_id: 'stmt_0041'
});

console.log(result.decision); // 'APPROVE'`,
    python: `import gavel

client = gavel.Client(api_key="sk_live_xxxx")

analysis = client.underwriting.analyze(
    applicant_id="cust_9921",
    product_id="unsecured_personal_v2",
    bank_statement_id="stmt_0041"
)

print(analysis.decision) # 'APPROVE'`
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      
      <div className="pt-16 flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 hidden xl:block p-8 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
           <div className="space-y-8">
             <div>
               <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Core Concepts</h4>
               <ul className="space-y-3">
                 <li><a href="#auth" className="text-sm font-bold text-orange-700 dark:text-primary flex items-center gap-2"><Key size={14} /> Authentication</a></li>
                 <li><a href="#idempotency" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"><Clock size={14} /> Idempotency</a></li>
                 <li><a href="#errors" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"><AlertCircle size={14} /> Error Codes</a></li>
               </ul>
             </div>
             <div>
               <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Endpoints</h4>
               <ul className="space-y-3">
                 <li><a href="#analyze" className="text-sm font-medium text-foreground flex items-center gap-2"><Zap size={14} /> Run Analysis</a></li>
                 <li><a href="#webhooks" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"><Webhook size={14} /> Webhooks</a></li>
               </ul>
             </div>
           </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* Documentation Text */}
          <div className="flex-1 p-8 lg:p-16 max-w-3xl border-r border-white/5">
            <header className="mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-primary">API v2.1.0 (Stable)</span>
              </div>
              <h1 className="text-5xl font-display font-black tracking-tighter mb-6">API Reference</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Integrate Gavel's deterministic underwriting engine into your existing loan origination system (LOS) in minutes.
              </p>
            </header>

            <section id="auth" className="mb-24 scroll-mt-24">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Key className="text-primary" /> Authentication
              </h2>
              <div className="prose dark:prose-invert prose-sm max-w-none text-muted-foreground space-y-4">
                <p>
                  The Gavel API uses Secret Keys to authenticate requests. You can manage your keys in the <a href="/console" className="text-orange-700 dark:text-primary hover:underline">Console</a>.
                </p>
                <p>
                  Your API keys carry significant privileges. Keep them secure and never expose them in client-side code or public repositories.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-4 items-start">
                  <Shield size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed">
                    <strong>Security Note:</strong> All API requests must be made over HTTPS. Plain HTTP requests will be rejected by our gateway.
                  </p>
                </div>
              </div>
            </section>

            <section id="analyze" className="mb-24 scroll-mt-24">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Zap className="text-primary" /> Run Analysis
              </h2>
              <p className="text-muted-foreground mb-8">
                The core endpoint for Gavel. Submit an applicant's ID and bank statement to receive a deterministic underwriting decision in &lt;2 seconds.
              </p>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/60 mb-4">Request Parameters</h4>
                  <div className="space-y-4 border-t border-white/5 pt-4">
                    {[
                      { name: 'applicant_id', type: 'string', desc: 'The unique identifier for the customer.' },
                      { name: 'product_id', type: 'string', desc: 'The underwriting policy ID from your Rules Engine.' },
                      { name: 'bank_statement_id', type: 'string', desc: 'ID of the pre-processed bank statement.' }
                    ].map(param => (
                      <div key={param.name} className="flex gap-4">
                        <code className="text-orange-700 dark:text-primary text-xs font-bold shrink-0 w-32">{param.name}</code>
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-foreground/60 uppercase mr-2">{param.type}</span>
                          <p className="text-sm text-muted-foreground mt-1">{param.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section id="errors" className="mb-24 scroll-mt-24">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <AlertCircle className="text-primary" /> Error Codes
              </h2>
              <div className="overflow-hidden border border-white/5 rounded-2xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-foreground/5">
                    <tr>
                      <th className="p-4 font-black uppercase tracking-widest text-[10px] text-foreground/60">Code</th>
                      <th className="p-4 font-black uppercase tracking-widest text-[10px] text-foreground/60">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { code: 'E001', desc: 'Insufficient transaction history (min 3 months)' },
                      { code: 'E002', desc: 'Invalid bank statement format' },
                      { code: 'E003', desc: 'PAN/Aadhaar verification failed' },
                      { code: 'E004', desc: 'Policy threshold not met' }
                    ].map(err => (
                      <tr key={err.code}>
                        <td className="p-4 font-mono text-xs text-orange-700 dark:text-primary font-bold">{err.code}</td>
                        <td className="p-4 text-muted-foreground">{err.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Code Samples (Sticky Right) */}
          <div className="lg:w-[450px] xl:w-[550px] bg-background p-8 lg:p-12 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex bg-foreground/5 p-1 rounded-lg">
                  {(['curl', 'nodejs', 'python'] as Language[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeLang === lang ? 'bg-primary text-white shadow-glow' : 'text-foreground/50 hover:text-foreground'}`}
                    >
                      {lang === 'nodejs' ? 'Node.js' : lang}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => copyToClipboard(codeSnippets[activeLang])}
                  className="p-2 text-foreground/60 hover:text-foreground transition-colors"
                >
                  {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                </button>
              </div>

              <div className="rounded-2xl bg-background/40 border border-white/5 p-6 font-mono text-[13px] leading-relaxed relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                <pre className="text-foreground/80 whitespace-pre-wrap break-all">
                  {codeSnippets[activeLang]}
                </pre>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Response Example</h4>
              <div className="rounded-2xl bg-background/40 border border-white/5 p-6 font-mono text-[13px] leading-relaxed text-primary/80">
                <pre>{`{
  "decision": "APPROVE",
  "credit_limit": 240000,
  "risk_score": 74,
  "confidence": 0.98,
  "audit_id": "gavel_1714...x"
}`}</pre>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ApiDocs;
