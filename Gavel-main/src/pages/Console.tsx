import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Globe, Shield, Activity, Database, Users,
  Settings, ChevronRight, LayoutGrid, Box, Cpu, AlertCircle, CheckCircle2,
  Zap, ArrowRight, Sun, Moon, Plus, Copy, MoreVertical,
  Filter, Download, Trash2, Mail, ShieldCheck, UserPlus,
  BarChart3, LineChart, Layers, Webhook, Building2, Link2, RefreshCw, PlusCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToUsageLogs, UsageLog,
  getApiKeys, createApiKey, revokeApiKey, ApiKey,
  getTeamMembers, inviteMember, TeamMember,
  getClusters, DataCluster
} from "@/lib/firestore";
import { useTrafficSimulator } from "@/hooks/useTrafficSimulator";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import BankAccountsView from "@/components/dashboard/BankAccountsView";
import CommTemplatesView from "@/components/dashboard/CommTemplatesView";
import ProductsView from "@/components/dashboard/ProductsView";

type View = 'overview' | 'tokens' | 'logs' | 'webhooks' | 'health' | 'clusters' | 'iam' | 'settings' | 'banking' | 'communications' | 'products';

export default function Console() {
  const { orgId } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState<View>('overview');
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clusters, setClusters] = useState<DataCluster[]>([]);
  const [simulatorEnabled, setSimulatorEnabled] = useState(true);

  // States for modals
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{name: string, key: string} | null>(null);

  // Enable traffic simulator
  useTrafficSimulator(orgId, simulatorEnabled);

  useEffect(() => {
    if (!orgId) return;

    const unsubLogs = subscribeToUsageLogs(orgId, setLogs);
    const unsubKeys = getApiKeys(orgId, setKeys);
    const unsubMembers = getTeamMembers(orgId, setMembers);
    const unsubClusters = getClusters(orgId, setClusters);

    return () => {
      unsubLogs();
      unsubKeys();
      unsubMembers();
      unsubClusters();
    };
  }, [orgId]);

  const handleCreateKey = async () => {
    if (!orgId) return;
    const name = `Token-${keys.length + 1}`;
    try {
      const res = await createApiKey(orgId, name);
      setNewKeyData({ name, key: res.key });
      setShowKeyModal(true);
      toast.success("API key successfully generated.");
    } catch (err) {
      toast.error("Failed to generate key.");
    }
  };

  const menuItems: { id: View, label: string, icon: any }[] = [
    { id: 'overview', label: "Fleet Overview", icon: LayoutGrid },
    { id: 'tokens', label: "Auth Tokens", icon: Shield },
    { id: 'logs', label: "Request Logs", icon: Terminal },
    { id: 'webhooks', label: "Webhooks", icon: Webhook },
    { id: 'health', label: "Health Hub", icon: Activity },
    { id: 'products', label: "Loan Products", icon: Box },
    { id: 'banking', label: "Bank Accounts", icon: Building2 },
    { id: 'communications', label: "Comms Hub", icon: Mail },
    { id: 'clusters', label: "Data Clusters", icon: Database },
    { id: 'iam', label: "Team Access", icon: Users },
    { id: 'settings', label: "Global Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 font-sans">
      <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-center relative z-[60]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center justify-center gap-2">
          <Zap size={12} className="animate-pulse" /> Live Production Infrastructure • 99.98% SLA • RBI Compliant
        </p>
      </div>
      <Navbar />

      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]" />
        <div className="absolute inset-0 bg-noise opacity-[0.015] dark:opacity-[0.025]" />
      </div>

      <div className="flex pt-20 h-screen overflow-hidden relative z-10">

        {/* Navigation Sidebar */}
        <aside className="w-80 border-r border-border/50 bg-card/10 backdrop-blur-3xl hidden xl:flex flex-col p-8">
          <div className="mb-12">
            <div className="flex items-center gap-4 p-5 glass-panel rounded-3xl mb-10 group hover:border-primary/40 transition-all cursor-default">
              <div className="w-12 h-12 rounded-2xl hero-gradient flex items-center justify-center text-foreground shadow-glow group-hover:scale-105 transition-transform">
                <Layers size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] leading-none mb-1.5 italic">Enterprise</div>
                <div className="text-base font-black tracking-tight truncate">Gavel Console</div>
              </div>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden ${activeView === item.id ? 'bg-primary text-white shadow-glow': 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                >
                  <item.icon size={18} className={activeView === item.id ? 'relative z-10': 'group-hover:scale-110 transition-transform relative z-10'} />
                  <span className="relative z-10">{item.label}</span>
                  {activeView === item.id && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 bg-primary z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto space-y-4">
             <div className="p-5 bg-card border border-border rounded-[2rem] shadow-soft relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-[0.2em]">
                    <Zap size={14} /> Engine Sim
                  </div>
                  <button
                    onClick={() => setSimulatorEnabled(!simulatorEnabled)}
                    className={`w-10 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${simulatorEnabled ? 'bg-primary': 'bg-muted'}`}
                  >
                    <motion.div
                      animate={{ x: simulatorEnabled ? 18: 3 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  Injecting synthetic telemetry into regional data nodes.
                </p>
             </div>

             <div className="flex gap-2">
               <button
                 onClick={toggleTheme}
                 className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border border-border bg-card hover:bg-secondary transition-all text-xs font-black uppercase tracking-widest"
               >
                 {theme === 'dark' ? <Sun size={14} className="text-yellow-500" />: <Moon size={14} className="text-primary" />}
                 {theme === 'dark' ? 'Light': 'Dark'}
               </button>
               <button className="p-4 rounded-2xl border border-border bg-card hover:bg-secondary transition-all">
                  <Mail size={14} className="text-muted-foreground" />
               </button>
             </div>
          </div>
        </aside>

        {/* Content Portal */}
        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="max-w-6xl mx-auto"
            >
              {activeView === 'overview' && renderOverview(logs, simulatorEnabled, orgId)}
              {activeView === 'tokens' && renderTokens(keys, handleCreateKey, revokeApiKey)}
              {activeView === 'logs' && renderLogs(logs)}
              {activeView === 'webhooks' && renderWebhooks()}
              {activeView === 'health' && renderHealth(logs)}
              {activeView === 'clusters' && renderClusters(clusters)}
              {activeView === 'iam' && renderIAM(members, orgId)}
              {activeView === 'settings' && renderSettings()}
              {activeView === 'products' && <ProductsView orgId={orgId} />}
              {activeView === 'banking' && <BankAccountsView orgId={orgId} />}
              {activeView === 'communications' && <CommTemplatesView orgId={orgId} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Secret Key Disclosure Modal */}
      <AnimatePresence>
        {showKeyModal && newKeyData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-background/40">
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="glass-panel-heavy p-10 rounded-[3rem] max-w-lg w-full relative overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-full h-2 hero-gradient" />
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Access Token Ready</h3>
                    <p className="text-xs text-muted-foreground">Standard Security Protocol: "Show Once"</p>
                  </div>
                </div>

                <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-3xl mb-8 flex items-start gap-4">
                   <AlertCircle size={20} className="text-destructive mt-1 flex-shrink-0" />
                   <p className="text-xs text-destructive leading-relaxed font-bold">
                     This token will never be displayed again. If lost, you must revoke it and generate a new ingress vector.
                   </p>
                </div>

                <div className="space-y-2 mb-10">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Token Payload ({newKeyData.name})</span>
                   <div className="flex items-center justify-between p-5 bg-card/50 rounded-2xl border border-border group">
                      <code className="text-sm font-mono font-bold text-primary truncate max-w-[280px]">
                        {newKeyData.key}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(newKeyData.key);
                          toast.success("Payload captured.");
                        }}
                        className="p-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all"
                      >
                        <Copy size={16} />
                      </button>
                   </div>
                </div>

                <button
                  onClick={() => setShowKeyModal(false)}
                  className="w-full py-5 bg-foreground text-background rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-elevated hover:opacity-90 transition-all"
                >
                  I've Secured the Token
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-renders for cleanliness
function renderOverview(logs: UsageLog[], simulatorEnabled: boolean, orgId: string | null) {
  const activeCount = logs.length;
  const successCount = logs.filter(l => l.status === 200 || l.status === 201).length;
  const efficiency = logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(1) + "%": "0%";
  const avgLatency = logs.length > 0 ? Math.round(logs.reduce((acc, log) => acc + log.durationMs, 0) / logs.length): 0;
  const failureCount = logs.filter(l => l.status >= 400).length;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-[0.5em] mb-2">
            <span className={`w-2 h-2 rounded-full bg-primary ${simulatorEnabled ? 'animate-ping': ''}`} /> Core Operations Center
          </div>
          <h1 className="text-5xl font-display font-black tracking-tighter">System Pulse</h1>
        </div>
        <div className="flex items-center gap-5">
           <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-4">
              <Globe size={18} className="text-primary" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Region</span>
                <span className="text-sm font-bold">Mumbai (BOM-01)</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Active Requests", val: activeCount, icon: Zap, color: "text-primary" },
           { label: "Approval Rate", val: efficiency, icon: CheckCircle2, color: "text-green-500" },
           { label: "Net Latency", val: `${avgLatency}ms`, icon: Cpu, color: "text-blue-500" },
           { label: "Flagged", val: failureCount, icon: AlertCircle, color: "text-destructive" },
         ].map((stat, i) => (
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: i * 0.1 }}
             key={stat.label}
             className="glass-panel-heavy p-8 rounded-[2.5rem] hover:translate-y-[-4px] transition-all hover:bg-secondary/10 group"
           >
             <div className="flex items-center justify-between mb-4">
               <div className={`p-4 rounded-2xl border border-current/20 bg-current/10 ${stat.color} group-hover:scale-110 transition-transform`}>
                 <stat.icon size={24} />
               </div>
               <span className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded">Live</span>
             </div>
             <div className="text-3xl font-display font-black tracking-tight mb-1">{stat.val}</div>
             <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</div>
           </motion.div>
         ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
         <div className="lg:col-span-3 glass-panel-heavy p-10 rounded-[3rem]">
            <div className="flex items-center justify-between mb-10">
               <div>
                 <h3 className="text-2xl font-black tracking-tight mb-1">Global Traffic Analyzer</h3>
                 <p className="text-xs text-muted-foreground">Ingress load balanced across 12 strategic edge nodes.</p>
               </div>
               <div className="bg-primary/10 px-4 py-2 rounded-xl text-primary font-black uppercase tracking-widest text-[9px]">Live Data Stream</div>
            </div>
            <div className="h-48 flex items-end gap-1.5 px-4 mb-4">
               {logs.slice(0, 40).reverse().map((log, i) => (
                 <motion.div
                   key={log.id || i}
                   initial={{ height: 0 }}
                   animate={{ height: `${Math.max(10, (log.durationMs / 600) * 100)}%` }}
                   className={`flex-1 rounded-t-sm transition-all ${log.status >= 400 ? 'bg-destructive/30': 'bg-primary/30'}`}
                 />
               ))}
               {logs.length === 0 && <div className="w-full h-full border border-dashed border-border rounded-xl flex items-center justify-center font-mono text-xs opacity-30 italic">No telemetry detected...</div>}
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-border">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"><div className="w-2 h-2 rounded-full bg-primary" /> POST Requests</div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"><div className="w-2 h-2 rounded-full bg-destructive" /> Failed Vectors</div>
               </div>
               <div className="text-[10px] font-bold text-muted-foreground">Update: 15ms ago</div>
            </div>
         </div>

         <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-8 rounded-[2.5rem] bg-card relative overflow-hidden h-full">
               <h3 className="text-lg font-black tracking-tight mb-8">Node Security Score</h3>
               <div className="flex flex-col items-center justify-center py-6">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90">
                       <circle cx="80" cy="80" r="70" className="stroke-muted fill-none" strokeWidth="12" />
                       <circle cx="80" cy="80" r="70" className="stroke-primary fill-none" strokeWidth="12" strokeDasharray="440" strokeDashoffset={440 * (1 - 0.98)} strokeLinecap="round" />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-display font-black">98</span>
                        <span className="text-xs font-bold text-muted-foreground">Optimal</span>
                     </div>
                  </div>
               </div>
               <div className="space-y-4">
                  {[
                    { label: "TLS 1.3 Encryption", status: "Enabled" },
                    { label: "IP Filtering (WAF)", status: "Active" },
                    { label: "JWT Integrity", status: "Verified" },
                  ].map(sec => (
                    <div key={sec.label} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">{sec.label}</span>
                       <CheckCircle2 size={12} className="text-primary" />
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function renderTokens(keys: ApiKey[], onCreate: () => void, onRevoke: (id: string) => void) {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-border">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tighter mb-2">Auth Gateways</h1>
          <p className="text-muted-foreground text-sm">Manage the entry vectors for your organization's infrastructure.</p>
        </div>
        <button
          onClick={onCreate}
          className="px-8 py-4 hero-gradient text-foreground rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={18} /> Issue New API Key
        </button>
      </div>

      <div className="grid gap-4">
        {keys.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center opacity-40">
             <Shield size={64} className="mb-6 animate-pulse" />
             <h3 className="text-2xl font-black mb-2">No active tokens found.</h3>
             <p className="text-xs max-w-xs">Your infrastructure is isolated. Generate a token to enable API ingress.</p>
          </div>
        ): (
          keys.map(k => (
            <motion.div
              layout
              key={k.id}
              className="glass-panel p-6 rounded-[2rem] flex items-center justify-between group hover:border-primary/40 transition-all bg-card"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                   <Zap size={24} className={k.isActive ? 'text-primary': ''} />
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-base">{k.name}</h4>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[9px] font-black uppercase">{k.env}</span>
                   </div>
                   <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                      <span>{k.key.substring(0, 12)}••••••••••••••••</span>
                      <div className="w-1 h-1 bg-border rounded-full" />
                      <span>Created {k.createdAt?.toDate ? k.createdAt.toDate().toLocaleDateString(): 'Just now'}</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button
                   onClick={() => onRevoke(k.id!)}
                   className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                 >
                   <Trash2 size={18} />
                 </button>
                 <button className="p-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all">
                   <MoreVertical size={18} />
                 </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function renderLogs(logs: UsageLog[]) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tighter mb-2">Request Sequence</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-black text-[10px] italic">Global ingress stream trace, Raw UTF-8</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-secondary/50 border border-border px-4 py-2 rounded-2xl flex items-center gap-3 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live Listen
           </div>
           <button className="p-3 bg-secondary rounded-xl hover:bg-muted transition-all border border-border"><Filter size={18} /></button>
           <button className="p-3 bg-secondary rounded-xl hover:bg-muted transition-all border border-border"><Download size={18} /></button>
        </div>
      </div>

      <div className="glass-panel-heavy rounded-[3rem] overflow-hidden bg-card/40">
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Endpoint</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Method</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Processing</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px] font-medium italic">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-32 text-center opacity-20">No active ingress detected in pipeline.</td>
                  </tr>
                ): (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20 transition-all group">
                       <td className="p-6 text-muted-foreground/60">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour12: false }): '--:--:--'}</td>
                       <td className="p-6 font-bold text-foreground/80">{log.path}</td>
                       <td className="p-6">
                         <span className={`px-2 py-1 rounded text-[9px] font-bold ${log.method === 'POST' ? 'bg-blue-500/10 text-blue-500': 'bg-orange-500/10 text-orange-500'}`}>{log.method}</span>
                       </td>
                       <td className="p-6">
                         <span className={`font-black ${log.status < 400 ? 'text-green-500': 'text-destructive'}`}>{log.status} {log.status < 400 ? 'OK': 'ERR'}</span>
                       </td>
                       <td className="p-6 text-right">
                         <span className="text-primary font-black">{log.durationMs}ms</span>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}

function renderWebhooks() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-border">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tighter mb-2">Webhooks</h1>
          <p className="text-muted-foreground text-sm">Subscribe to real-time events from the underwriting engine.</p>
        </div>
        <button className="px-8 py-4 bg-primary text-white rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-glow hover:scale-[1.02] transition-all">
          <Plus size={18} /> Add Endpoint
        </button>
      </div>

      <div className="glass-panel p-12 rounded-[3rem] border-dashed flex flex-col items-center justify-center text-center opacity-40">
        <Webhook size={48} className="mb-6" />
        <h3 className="text-xl font-black mb-2">No webhook endpoints configured</h3>
        <p className="text-sm max-w-sm">Receive immutable audit events and decision notifications directly in your system.</p>
      </div>
    </div>
  );
}

function renderHealth(logs: UsageLog[]) {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-display font-black tracking-tighter">Wellness Matrix</h1>
        <div className="flex items-center gap-3 px-5 py-2 glass-panel rounded-2xl text-[10px] font-black uppercase tracking-widest text-green-500">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 99.98% SLA OK
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="glass-panel p-10 rounded-[3rem] space-y-8">
            <h3 className="text-xl font-black mb-6">Service Uptime</h3>
            {[
              { svc: "Deterministic Engine Hub", uptime: "100%", status: "stable" },
              { svc: "Ingress Gateway", uptime: "99.99%", status: "stable" },
              { svc: "Bureau Connector", uptime: "99.8%", status: "degraded" },
              { svc: "Socket Stream", uptime: "100%", status: "stable" },
            ].map(s => (
              <div key={s.svc} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase">{s.svc}</span>
                <div className="flex items-center gap-3">
                   <span className="text-xs font-mono font-black">{s.uptime}</span>
                   <div className={`w-2 h-2 rounded-full ${s.status === 'stable' ? 'bg-green-500 shadow-[0_0_8px_hsl(142_70%_45%/0.4)]': 'bg-yellow-500 shadow-glow'}`} />
                </div>
              </div>
            ))}
         </div>

         <div className="lg:col-span-2 glass-panel-heavy p-10 rounded-[3rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_70%)]" />
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-black italic">Throughput Forecast</h3>
               <LineChart size={20} className="text-muted-foreground" />
            </div>
            <div className="h-48 border-l border-b border-border relative">
               <svg className="w-full h-full overflow-visible">
                 <path d="M0,100 Q100,20 200,80 T400,10 T600,60" className="stroke-primary fill-none" strokeWidth="4" strokeLinecap="round" />
                 <circle cx="100" cy="20" r="4" className="fill-primary" />
                 <circle cx="200" cy="80" r="4" className="fill-primary" />
                 <circle cx="400" cy="10" r="4" className="fill-primary" />
               </svg>
            </div>
            <div className="flex justify-between mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
               <span>00:00</span>
               <span>06:00</span>
               <span>12:00</span>
               <span>18:00</span>
               <span>23:59</span>
            </div>
         </div>
      </div>
    </div>
  );
}

function renderClusters(clusters: DataCluster[]) {
  // Demo clusters if empty
  const demoClusters: DataCluster[] = [
    { name: "Node-BOM-01", region: "India-West", provider: "GCP", status: "active", load: 24, orgId: "demo" },
    { name: "Node-DEL-04", region: "India-South", provider: "AWS", status: "scaling", load: 88, orgId: "demo" },
    { name: "Node-SGP-02", region: "Singapore", provider: "Azure", status: "active", load: 12, orgId: "demo" },
  ];

  const currentClusters = clusters.length > 0 ? clusters: demoClusters;

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-display font-black tracking-tighter">Regional Fabric</h1>
        <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary px-6 py-3 border border-primary/20 rounded-2xl bg-primary/5 shadow-glow">
           Provision Node <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {currentClusters.map((c, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={c.name}
            className="glass-panel p-8 rounded-[3rem] bg-card hover:border-primary/40 transition-all border-border/60"
          >
            <div className="flex items-center justify-between mb-8">
               <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground border border-border italic">
                 {c.provider.substring(0, 1)}
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{c.region}</span>
                  <div className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${c.status === 'active' ? 'text-green-500': 'text-primary animate-pulse'}`}>{c.status}</div>
               </div>
            </div>

            <h3 className="text-xl font-black mb-1">{c.name}</h3>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-8">{c.provider} Edge Node</p>

            <div className="space-y-3">
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Resource Load</span>
                  <span className="text-foreground">{c.load}%</span>
               </div>
               <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.load}%` }}
                    className={`h-full ${c.load > 80 ? 'bg-destructive': 'bg-primary'}`}
                  />
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex gap-2">
               <button className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-secondary rounded-xl transition-all border border-border">Logs</button>
               <button className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-foreground text-background rounded-xl transition-all shadow-soft">Config</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function renderIAM(members: TeamMember[], orgId: string | null) {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-10 border-b border-border">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tighter mb-2">Team Governance</h1>
          <p className="text-sm text-muted-foreground">Regulate access vectors and global permissions.</p>
        </div>
        <button
          onClick={async () => {
            const email = prompt("Search Global Identity Matrix (Enter Email):");
            if(email && orgId) {
              await inviteMember(orgId, email, 'viewer');
              toast.success(`Broadcasting invitation to ${email}`);
            }
          }}
          className="px-8 py-4 bg-primary text-white rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-glow hover:translate-y-[-2px] transition-all"
        >
          <UserPlus size={18} /> Direct Invite
        </button>
      </div>

      <div className="glass-panel-heavy rounded-[3rem] overflow-hidden bg-card/40">
        <div className="p-8 border-b border-border bg-secondary/10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Users size={20} className="text-primary" />
              <h3 className="font-display font-black text-lg">Active Identities</h3>
           </div>
           <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{members.length} Users Found</div>
        </div>

        <div className="divide-y divide-border/50">
           {members.length === 0 ? (
             <div className="p-20 text-center opacity-30 italic font-mono text-sm">Initiating identity sequence...</div>
           ): (
             members.map(m => (
               <div key={m.id} className="p-8 flex items-center justify-between hover:bg-secondary/20 transition-all">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase border border-primary/20 italic">
                        {m.email[0]}
                     </div>
                     <div>
                        <div className="text-sm font-black italic">{m.email}</div>
                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Joined {m.joinedAt?.toDate ? m.joinedAt.toDate().toLocaleDateString(): 'Dec 2026'}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-10">
                     <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Access Level</span>
                        <div className="flex items-center gap-2 text-xs font-black text-primary uppercase italic">
                           {m.role}
                        </div>
                     </div>
                     <button className="p-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all">
                        <MoreVertical size={16} />
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}

function renderSettings() {
  return (
    <div className="space-y-12">
      <h1 className="text-4xl font-display font-black tracking-tighter mb-10">Global Configuration</h1>

      <div className="grid md:grid-cols-2 gap-8">
         {[
           { title: "General Info", desc: "Org branding, profile, and visual identity.", icon: Box },
           { title: "Network Policy", desc: "IP Whitelisting, Custom Domains, and DNS.", icon: Globe },
           { title: "Compliance", desc: "Data residency, Auditing, and ISO logs.", icon: ShieldCheck },
           { title: "Billing & Sub", desc: "Quota management and regional pricing.", icon: BarChart3 },
         ].map(s => (
           <div key={s.title} className="glass-panel p-8 rounded-[3rem] bg-card hover:border-primary/40 transition-all flex items-start gap-6 relative overflow-hidden group cursor-pointer border-border/80 shadow-soft">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-primary/20 transition-all" />
              <div className="w-16 h-16 rounded-[1.5rem] bg-secondary flex items-center justify-center text-primary border border-border shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform">
                 <s.icon size={24} />
              </div>
              <div className="relative z-10 pt-1">
                 <h3 className="text-xl font-black mb-2 italic">{s.title}</h3>
                 <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                 <button className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">Manage Protocol <ChevronRight size={12} /></button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
