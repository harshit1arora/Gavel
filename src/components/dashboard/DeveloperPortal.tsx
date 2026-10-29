import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, Copy, Check, RefreshCw, Globe, Shield, Terminal, Zap,
  Eye, EyeOff, AlertCircle, Trash2, X, Lock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiKeys, createApiKey, revokeApiKey, ApiKey } from "@/lib/firestore";
import { apiWithAuth, parseResponse } from "@/lib/api-client";
import { toast } from "sonner";

export default function DeveloperPortal() {
  const { orgId } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{key: string; name: string} | null>(null);

  useEffect(() => {
    if (!orgId) return;
    const unsubscribe = getApiKeys(orgId, (fetchedKeys) => {
      setKeys(fetchedKeys);
    });
    return () => unsubscribe();
  }, [orgId]);

  // Load existing webhook URL
  useEffect(() => {
    if (!orgId) return;
    apiWithAuth("/v1/webhooks").then(res => res.json()).then(data => {
      if (data.targetUrl) setWebhookUrl(data.targetUrl);
    }).catch(() => {});
  }, [orgId]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Key copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = async () => {
    if (!orgId) return;
    setIsGenerating(true);
    try {
      const name = `Key ${keys.length + 1}`;
      const result = await createApiKey(orgId, name, "live");
      setNewKeyData({ key: result.key, name });
      toast.success("New API key generated");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (confirm("Are you sure you want to revoke this key? It will immediately stop working.")) {
      try {
        await revokeApiKey(id);
        toast.success("Key revoked");
      } catch (error: any) {
        toast.error(error.message || "Failed to revoke key");
      }
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header Area */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Developer Settings</h2>
          <p className="text-muted-foreground mt-1">Manage your infrastructure access tokens and integration endpoints.</p>
        </div>
        <button
          onClick={handleCreateKey}
          disabled={isGenerating}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? <RefreshCw size={14} className="animate-spin" />: <Key size={14} />}
          Generate New Secret Key
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: API Keys */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel bg-secondary/10 border border-white/5 p-6 rounded-3xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield size={18} className="text-primary" />
              </div>
              <h3 className="font-bold text-lg">Active Secret Keys</h3>
            </div>

            <div className="space-y-3">
              {keys.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border rounded-2xl opacity-50">
                  <Lock size={24} className="mx-auto mb-2" />
                  <p className="text-xs">No active keys. Generate one to get started.</p>
                </div>
              ): (
                keys.map((k) => (
                  <div key={k.id} className="group p-4 bg-background/40 border border-white/5 hover:border-border rounded-2xl transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-primary">
                        <Key size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold flex items-center gap-2">
                          {k.name}
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded leading-none uppercase font-black">Live</span>
                        </div>
                        <code className="text-[10px] font-mono text-muted-foreground mt-1 block">
                          {(k as any).keyPrefix || k.key?.substring(0, 12) || 'sk_live_••••'}••••••••••••
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <button
                         onClick={() => handleRevoke(k.id!)}
                         className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                         title="Revoke Key"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/20">
              <AlertCircle size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-primary">Security:</span> Keys are hashed with SHA-256 and stored securely. The plaintext is shown once at creation and cannot be retrieved. If lost, revoke and regenerate.
              </p>
            </div>
          </motion.div>

          {/* Webhooks Config */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel bg-secondary/10 border border-white/5 p-6 rounded-3xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Globe size={18} className="text-blue-400" />
                </div>
                <h3 className="font-bold text-lg">Webhook Postbacks</h3>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Gavel AI pushes HMAC-signed JSON payloads to this URL on every verified decision event.</p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 bg-background/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  placeholder="https://your-api.com/webhooks/gavel"
                />
                <button
                  onClick={async () => {
                    try {
                      const res = await apiWithAuth("/v1/webhooks", {
                        method: "POST",
                        body: JSON.stringify({ targetUrl: webhookUrl })
                      });
                      const data = await parseResponse(res);
                      toast.success("Webhook configured. Signing secret displayed once, save it now.");
                      if (data.signingSecret) {
                        toast(`Signing Secret: ${data.signingSecret}`, { duration: 15000 });
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Failed to commit webhook.");
                    }
                  }}
                  className="px-6 py-3 bg-foreground/5 hover:bg-foreground/10 border border-white/5 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Save Endpoint
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Listening: application.evaluated, ping.test
              </div>

              {/* Sandbox Simulator */}
              <div className="mt-8 pt-6 border-t border-white/5">
                 <h4 className="font-bold text-sm mb-3">Live Developer Sandbox</h4>
                 <p className="text-[10px] text-muted-foreground mb-4">Fire an artificial 'ping.test' event to your webhook endpoint.</p>
                 <button
                   onClick={async () => {
                     const loadToast = toast.loading("Dispatching signed test payload...");
                     try {
                        const res = await apiWithAuth("/v1/webhooks/test", { method: "POST" });
                        toast.dismiss(loadToast);
                        if (res.ok) toast.success("Test Webhook 200 OK. Check your server logs.");
                        else toast.error("Server responded with an error.");
                     } catch(err) {
                        toast.dismiss(loadToast);
                        toast.error("Failed to dispatch webhook.");
                     }
                   }}
                   className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-glow"
                 >
                   <Zap size={14} /> Transmit Test Webhook
                 </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Quick Start Guide */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Terminal size={18} className="text-blue-400" />
              <h3 className="font-bold text-sm">Integration Snippet</h3>
            </div>

            <div className="bg-background/60 rounded-2xl p-4 font-mono text-[10px] leading-relaxed border border-white/5 overflow-x-auto custom-scrollbar">
              <div className="text-blue-400"># Install SDK</div>
              <div className="text-foreground">npm install @gavel/sdk</div>
              <div className="text-blue-400 mt-3"># Execute Underwriting</div>
              <div className="text-foreground">
                <span className="text-pink-400">const</span> gavel = <span className="text-yellow-400">require</span>(<span className="text-green-400">'@gavel/sdk'</span>);<br/>
                <span className="text-pink-400">const</span> client = <span className="text-pink-400">new</span> gavel.Client(<span className="text-green-400">'sk_live_••••••'</span>);<br/>
                <br/>
                <span className="text-pink-400">const</span> res = <span className="text-pink-400">await</span> client.underwrite({'{'}<br/>
                &nbsp;&nbsp;pan: <span className="text-green-400">'ABCDE1234F'</span>,<br/>
                &nbsp;&nbsp;loanAmount: <span className="text-yellow-400">500000</span><br/>
                {'}'});
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel bg-primary/5 border border-primary/20 p-6 rounded-3xl text-center"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Zap size={20} className="text-primary" />
            </div>
            <h4 className="font-bold text-sm mb-2">Need a custom feature?</h4>
            <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed">Enterprise partners get dedicated support and private data cluster deployment.</p>
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-glow">
              Contact Support
            </button>
          </motion.div>
        </div>
      </div>

      {/* Interactive API Docs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel bg-secondary/10 border border-white/5 rounded-3xl overflow-hidden mt-8 flex flex-col h-[800px]"
      >
        <div className="p-6 border-b border-white/5 bg-background/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg">
               <Terminal size={18} className="text-primary" />
             </div>
             <div>
               <h3 className="font-bold text-lg">Interactive API Explorer</h3>
               <p className="text-xs text-muted-foreground">Test endpoints live directly from your browser.</p>
             </div>
          </div>
          <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/docs`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open in new tab</a>
        </div>
        <iframe
          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/docs`}
          className="w-full flex-1 bg-white"
          title="Swagger API Docs"
        />
      </motion.div>

      {/* Secret Key Modal (Show Once) */}
      <AnimatePresence>
        {newKeyData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-background/90 backdrop-blur-xl"
               onClick={() => setNewKeyData(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-background border border-border rounded-[2.5rem] shadow-3xl overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400 border border-green-500/20">
                <Shield size={32} />
              </div>

              <h3 className="text-2xl font-display font-bold mb-2">Your Secret API Key</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Copy this key now. It is <span className="text-red-400 font-bold">hashed and stored securely</span>; you will never see it again.
              </p>

              <div className="p-4 bg-foreground/5 border border-border rounded-2xl flex items-center gap-4 mb-8">
                <code className="text-sm font-mono text-primary flex-1 break-all text-left">
                  {newKeyData.key}
                </code>
                <button
                  onClick={() => copyToClipboard(newKeyData.key, "new-modal")}
                  className="p-3 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors text-primary"
                >
                  {copiedKey === "new-modal" ? <Check size={20} />: <Copy size={20} />}
                </button>
              </div>

              <button
                onClick={() => setNewKeyData(null)}
                className="w-full py-4 bg-foreground/5 hover:bg-foreground/10 rounded-2xl text-sm font-bold border border-border transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                I've stored this key safely
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
