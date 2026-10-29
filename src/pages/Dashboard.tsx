import { useEffect, useState } from "react";
import { Joyride, Step } from "react-joyride";
import { subscribeToApplications, LoanApplication, updateApplicationStatus } from "../lib/firestore";
import Navbar from "../components/Navbar";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, AlertTriangle, XCircle, Search, Sparkles, User, 
  LayoutDashboard, ShieldCheck, Terminal, X, ChevronRight, Activity, Zap, FileText, Database, Banknote,
  Settings as SettingsIcon, UserPlus, Users, Link as LinkIcon, Lock 
} from "lucide-react";
import SettingsView from "../components/dashboard/SettingsView";
import OnboardingWizard from "../components/dashboard/OnboardingWizard";
import DeveloperPortal from "../components/dashboard/DeveloperPortal";
import PolicyEditor from "../components/dashboard/PolicyEditor";
import Integrations from "../components/dashboard/Integrations";
import AuditLogs from "../components/dashboard/AuditLogs";
import Analytics from "../components/dashboard/Analytics";
import Sentinel from "../components/dashboard/Sentinel";
import DisbursementQueue from "../components/dashboard/DisbursementQueue";
import LoanPortfolio from "../components/dashboard/LoanPortfolio";
import CollectionsPipeline from "../components/dashboard/CollectionsPipeline";
import MISReports from "../components/dashboard/MISReports";
import BillingDashboard from "../components/dashboard/BillingDashboard";
import ComplianceDashboard from "../components/dashboard/ComplianceDashboard";
import ProductsView from "../components/dashboard/ProductsView";
import BankAccountsView from "../components/dashboard/BankAccountsView";
import CommTemplatesView from "../components/dashboard/CommTemplatesView";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const TAB_IDS = [
  "queue", "portfolio", "products", "disbursement", "banking", "collections",
  "sentinel", "compliance", "reports", "analytics", "audit", "integrations",
  "communications", "billing", "policies", "dev", "settings",
] as const;

export type TabId = (typeof TAB_IDS)[number];

const isTabId = (value: string | null): value is TabId =>
  value !== null && (TAB_IDS as readonly string[]).includes(value);

export default function Dashboard() {
  const { orgId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabId>(isTabId(tabFromUrl) ? tabFromUrl : "queue");

  // Deep-link support: /dashboard?tab=collections. Keeps the console addressable
  // so sales, alerts and the product tour can link straight to a surface.
  useEffect(() => {
    if (isTabId(tabFromUrl) && tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!orgId) return;
    const unsubscribe = subscribeToApplications(orgId, (apps) => {
      setApplications(apps);
    });
    return () => unsubscribe();
  }, [orgId]);

  const [runTour, setRunTour] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setRunTour(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const tourSteps: Step[] = [
    {
      target: '.tour-live-pulse',
      // @ts-expect-error -- react-joyride step objects carry extra keys the v3 types omit
      disableBeacon: true,
      content: 'Welcome to the Gavel Engine. Everything you see here streams in real-time without page reloads. Watch for pipeline updates instantly.',
      title: 'Real-Time Telemetry'
    },
    {
      target: '.tour-kpis',
      // @ts-expect-error -- react-joyride step objects carry extra keys the v3 types omit
      disableBeacon: true,
      content: 'This is your Live Operations Hub. We aggregate your application volume, auto-decisioning metrics, and risk flags for instant oversight.',
      title: 'Real-Time Insights'
    },
    {
      target: '.tour-search',
      // @ts-expect-error -- react-joyride step objects carry extra keys the v3 types omit
      disableBeacon: true,
      content: 'Bank-grade compliance requires deep auditing. Use this unified search bar to instantly query any PAN, applicant ID, or risk logic.',
      title: 'Global Auditing'
    },
    {
      target: '.tour-queue',
      // @ts-expect-error -- react-joyride step objects carry extra keys the v3 types omit
      disableBeacon: true,
      content: 'Your Underwriting Queue. Each incoming application is instantly risk-scored using 40+ external signals. Click "Review" on any case to see the AI reasoning.',
      title: 'Intelligent Decisioning'
    },
    {
      target: '.tour-tabs',
      // @ts-expect-error -- react-joyride step objects carry extra keys the v3 types omit
      disableBeacon: true,
      content: 'Total Control. Adjust the Machine Learning auto-approve thresholds in "Risk Policies", or grab your API keys in the "Developer Hub".',
      title: 'Infrastructure & Policies'
    }
  ];

  const kpis = {
    total: applications.length,
    approved: applications.filter(a => a.status === "Approved").length,
    pending: applications.filter(a => a.status === "Pending").length,
    rejected: applications.filter(a => a.status === "Rejected").length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved": return <CheckCircle className="text-green-500" size={16} />;
      case "Manual Review": return <AlertTriangle className="text-yellow-500" size={16} />;
      case "Rejected": return <XCircle className="text-red-500" size={16} />;
      default: return <Sparkles className="text-primary animate-pulse" size={16} />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "Manual Review": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "Rejected": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30 text-foreground">
      <OnboardingWizard />
      <Navbar />
      
      {/* Background gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
      />

      <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Enterprise Console</h1>
            <p className="text-muted-foreground text-sm">Manage underwriting, disbursements, and risk operations.</p>
          </div>
          <Link to="/apply" className="px-6 py-3 hero-gradient text-foreground rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-glow w-full md:w-auto">
             <Sparkles size={16} /> Simulate Application
          </Link>
        </div>

          <div className="overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-2xl border border-white/5 w-max mb-12 backdrop-blur-md">
{[
                 { id: "queue", label: "Queue", icon: LayoutDashboard },
                 { id: "portfolio", label: "Loan Portfolio", icon: Database },
                 { id: "products", label: "Products", icon: FileText },
                 { id: "disbursement", label: "Disbursements", icon: Banknote },
                 { id: "banking", label: "Bank Accounts", icon: Banknote },
                 { id: "collections", label: "Collections", icon: ShieldCheck },
                 { id: "sentinel", label: "Sentinel EWS", icon: ShieldCheck },
                 { id: "compliance", label: "RBI Compliance", icon: ShieldCheck },
                 { id: "reports", label: "MIS Reports", icon: Activity },
                 { id: "analytics", label: "Analytics", icon: Activity },
                 { id: "audit", label: "Audit Logs", icon: ShieldCheck },
                 { id: "integrations", label: "Data Pipes", icon: Database },
                 { id: "communications", label: "Templates", icon: FileText },
                 { id: "billing", label: "Billing", icon: Banknote },
                 { id: "policies", label: "Risk Policies", icon: ShieldCheck },
                 { id: "dev", label: "Developers", icon: Terminal },
                 { id: "settings", label: "Settings", icon: SettingsIcon },
               ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id as TabId)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? "bg-foreground/10 text-foreground shadow-lg border border-border" 
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  <tab.icon size={16} className={activeTab === tab.id ? "text-primary" : ""} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

        <div className="min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === "products" && (
              <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ProductsView orgId={orgId ?? null} />
              </motion.div>
            )}

            {activeTab === "banking" && (
              <motion.div key="banking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <BankAccountsView orgId={orgId ?? null} />
              </motion.div>
            )}

            {activeTab === "communications" && (
              <motion.div key="communications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <CommTemplatesView orgId={orgId ?? null} />
              </motion.div>
            )}

            {activeTab === "queue" && (
              <motion.div 
                key="queue"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h1 className="text-3xl font-display font-bold">Operations Hub</h1>
                    <p className="text-muted-foreground mt-1">Real-time status of the Gavel underwriting pipeline.</p>
                  </div>
                  <div className="tour-live-pulse flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-white/5 rounded-xl text-xs font-bold text-primary">
                    <Activity size={14} className="animate-pulse" /> LIVE STREAMING
                  </div>
                </div>

                {/* KPIs */}
                <div className="tour-kpis grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Volume", value: kpis.total, change: "Live", icon: LayoutDashboard },
                    { label: "Auto-Approved", value: kpis.approved, change: `${kpis.total ? ((kpis.approved/kpis.total)*100).toFixed(0) : 0}%`, icon: CheckCircle },
                    { label: "Manual Review", value: kpis.pending + applications.filter(a=>a.status==="Manual Review").length, change: "Need Action", icon: AlertTriangle },
                    { label: "Rejected", value: kpis.rejected, change: "High Risk", icon: XCircle },
                  ].map((kpi, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={kpi.label} 
                      className="glass-panel bg-secondary/10 border border-white/5 p-6 rounded-3xl relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <kpi.icon size={48} />
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{kpi.label}</div>
                      <div className="text-3xl font-display font-bold">{kpi.value}</div>
                      <div className="text-[10px] font-bold text-primary mt-2 bg-primary/10 w-max px-2 py-0.5 rounded uppercase">{kpi.change}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Data Table */}
                <div className="tour-queue glass-panel bg-background/40 border border-border rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-border/40 bg-foreground/5 flex items-center justify-between">
                    <div className="tour-search relative w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search applicants by ID or Name..." 
                        className="w-full bg-background/20 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-foreground/5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                          <th className="p-5">Applicant Profile</th>
                          <th className="p-5">Requested</th>
                          <th className="p-5 text-center">Risk Vector Score</th>
                          <th className="p-5">Status</th>
                          <th className="p-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {applications.filter(app => 
                            app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.id?.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length === 0 ? (
                           <tr>
                             <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                               <Zap size={24} className="mx-auto mb-4 opacity-20" />
                               No applications matched your search.
                             </td>
                           </tr>
                        ) : applications.filter(app => 
                            app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.id?.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((app) => (
                          <tr key={app.id} className="hover:bg-foreground/5 transition-colors group cursor-default">
                            <td className="p-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-secondary border border-white/5 flex items-center justify-center font-bold text-sm text-foreground shadow-inner">
                                  {app.applicantName.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-bold text-sm text-foreground">{app.applicantName}</div>
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                    <span>ID: {app.id.substring(0,8)}</span>
                                    <span>•</span>
                                    <span>{new Date().toLocaleTimeString()}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 font-bold text-sm">₹{app.loanAmount.toLocaleString()}</td>
                            <td className="p-5">
                              {app.aiScore ? (
                                <div className="flex flex-col items-center gap-1.5">
                                   <div className="w-full bg-foreground/5 rounded-full h-1 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${app.aiScore >= 700 ? 'bg-green-400' : app.aiScore >= 600 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                        style={{ width: `${(app.aiScore / 850) * 100}%` }}
                                      />
                                   </div>
                                   <span className={`font-mono text-xs font-bold ${app.aiScore >= 700 ? 'text-green-400' : app.aiScore >= 600 ? 'text-yellow-400' : 'text-red-400'}`}>
                                     {app.aiScore} pts
                                   </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2 text-primary">
                                  <Sparkles size={14} className="animate-pulse" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Orchestrating</span>
                                </div>
                              )}
                            </td>
                            <td className="p-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold border tracking-wider uppercase ${getStatusStyle(app.status)}`}>
                                {getStatusIcon(app.status)} {app.status}
                              </span>
                            </td>
                            <td className="p-5 text-right">
                              <button 
                                 onClick={() => setSelectedApp(app)}
                                 className="inline-flex items-center gap-1.5 text-[10px] font-bold px-4 py-2 rounded-xl border border-border bg-foreground/5 hover:bg-foreground/10 transition-all uppercase tracking-widest text-foreground active:scale-95"
                              >
                                Review <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

{activeTab === "policies" && <PolicyEditor />}
             {activeTab === "dev" && <DeveloperPortal />}
             {activeTab === "billing" && <BillingDashboard />}
             {activeTab === "integrations" && <Integrations />}
             {activeTab === "audit" && <AuditLogs />}
             {activeTab === "analytics" && <Analytics />}
             {activeTab === "sentinel" && <Sentinel />}
             {activeTab === "disbursement" && <DisbursementQueue />}
             {activeTab === "portfolio" && <LoanPortfolio orgId={orgId} />}
             {activeTab === "collections" && <CollectionsPipeline orgId={orgId} />}
             {activeTab === "reports" && <MISReports orgId={orgId} />}
              {activeTab === "compliance" && <ComplianceDashboard orgId={orgId} />}
             {activeTab === "settings" && <SettingsView />}
           </AnimatePresence>
        </div>
      </main>

      {/* Existing Drawer View for Application Details */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="absolute inset-0 bg-background/90 backdrop-blur-md"
               onClick={() => setSelectedApp(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-background border border-border rounded-[2rem] shadow-2xl z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-foreground/5 backdrop-blur-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <ShieldCheck size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">Case Review: {selectedApp.id.substring(0,8)}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">System Identification Sequence</p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-8 space-y-10">
                 <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                       <div className="w-16 h-16 rounded-[1.5rem] bg-secondary border border-white/5 flex items-center justify-center text-3xl font-bold font-display shadow-lg">
                         {selectedApp.applicantName.charAt(0)}
                       </div>
                       <div>
                         <h2 className="text-3xl font-display font-bold mb-1">{selectedApp.applicantName}</h2>
                         <div className="flex items-center gap-3">
                           <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono"><User size={12}/> Verified Identity</span>
                           <span className="w-1 h-1 bg-foreground/10 rounded-full" />
                           <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono"><FileText size={12}/> PAN: ••••••{selectedApp.id.slice(-4)}</span>
                         </div>
                       </div>
                    </div>
                    <div className={`px-6 py-3 rounded-2xl border flex flex-col items-end shadow-sm ${getStatusStyle(selectedApp.status)}`}>
                      <span className="text-[10px] uppercase tracking-widest font-black mb-1 opacity-70">Resolution</span>
                      <div className="flex items-center gap-2 font-bold text-lg">{getStatusIcon(selectedApp.status)} {selectedApp.status}</div>
                    </div>
                 </div>

                 {/* Gavel AI Block */}
                 <div className="relative group">
                    <div className="absolute -inset-0.5 hero-gradient rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative rounded-3xl border border-border bg-background p-8 overflow-hidden">
                       <div className="flex items-center gap-3 mb-6">
                          <Sparkles size={20} className="text-primary animate-pulse" />
                          <h4 className="font-mono text-sm text-primary font-bold tracking-widest uppercase">Explainable AI (XAI) Vectors</h4>
                          <div className="ml-auto flex items-center gap-2 font-mono bg-background/50 px-3 py-1 rounded-lg text-sm border border-border">
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="text-foreground font-bold">98.4%</span>
                          </div>
                       </div>
                       
                       {selectedApp.aiReasoning ? (
                         <div className="space-y-6">
                            <p className="text-base text-foreground/90 leading-relaxed font-mono bg-foreground/5 p-4 rounded-xl border border-white/5">
                              {selectedApp.aiReasoning}
                            </p>
                            
                            <div className="space-y-3 pt-2">
                               <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-4">Positive / Negative Signal Weights (SHAP Values)</div>
                               {(() => {
                                 const signals = [];
                                 if (!selectedApp.aiReasoning) return [];
                                 
                                 if (selectedApp.aiReasoning.includes("DTI High: Yes")) {
                                   signals.push({ label: "High DTI Ratio", weight: -85, length: "85%", color: "bg-red-500" });
                                 } else {
                                   signals.push({ label: "Low DTI Ratio", weight: 35, length: "35%", color: "bg-green-500" });
                                 }
                                 
                                 if (selectedApp.aiReasoning.includes("Stable History: Yes")) {
                                   signals.push({ label: "Bureau Hit Stable", weight: 40, length: "40%", color: "bg-green-500" });
                                 } else {
                                   signals.push({ label: "Thin File / No History", weight: -40, length: "40%", color: "bg-red-500" });
                                 }
                                 
                                 if (selectedApp.aiReasoning.includes("Income Verified: Yes")) {
                                   signals.push({ label: "Income Verified", weight: 60, length: "60%", color: "bg-green-500" });
                                 } else {
                                   signals.push({ label: "Unverified Income", weight: -55, length: "55%", color: "bg-red-500" });
                                 }
                                 
                                 if (selectedApp.aiScore && selectedApp.aiScore < 650) {
                                   signals.push({ label: "Low Bureau Score", weight: -65, length: "65%", color: "bg-red-500" });
                                 }
                                 
                                 return signals;
                               })().map((signal, idx) => (
                                  <div key={signal.label + idx} className="grid grid-cols-[120px_1fr_40px] items-center gap-4 text-xs font-mono">
                                    <div className="text-right text-muted-foreground">{signal.label}</div>
                                    <div className="h-2 bg-foreground/5 rounded-full relative">
                                       <div className={`absolute top-0 bottom-0 rounded-full ${signal.color}`} style={{ width: signal.length, right: signal.weight < 0 ? '50%' : 'auto', left: signal.weight > 0 ? '50%' : 'auto' }} />
                                       <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-foreground/20" />
                                    </div>
                                    <div className="text-right font-bold">{signal.weight > 0 ? '+' : ''}{signal.weight}</div>
                                  </div>
                               ))}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5 overflow-x-auto pb-2">
                               {["KYC_PASSED", "FRAUD_SCAN_CLEAN", "BUREAU_HIT_STABLE", "GEO_MATCH"].map(tag => (
                                 <span key={tag} className="px-3 py-1 bg-foreground/5 border border-border rounded-lg text-[9px] font-mono text-muted-foreground tracking-widest uppercase">{tag}</span>
                               ))}
                            </div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center py-12 gap-4">
                           <Sparkles size={32} className="animate-spin text-primary" />
                           <span className="text-sm font-mono text-muted-foreground">Synthesize risk vector from 42 external signals...</span>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-6">
                    <div className="bg-foreground/5 rounded-2xl p-5 border border-white/5 group hover:border-border transition-all">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Annual Income</div>
                      <div className="text-xl font-display font-bold">₹{selectedApp.annualIncome.toLocaleString()}</div>
                    </div>
                    <div className="bg-foreground/5 rounded-2xl p-5 border border-white/5 group hover:border-border transition-all">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Requested</div>
                      <div className="text-xl font-display font-bold">₹{selectedApp.loanAmount.toLocaleString()}</div>
                    </div>
                    <div className="bg-foreground/5 rounded-2xl p-5 border border-white/5 group hover:border-border transition-all">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Liability Pool</div>
                      <div className="text-xl font-display font-bold text-red-500">₹{selectedApp.creditDebt.toLocaleString()}</div>
                    </div>
                 </div>

                 {selectedApp.status === "Manual Review" && (
                   <div className="pt-6 border-t border-border flex gap-4">
                     <button
                       onClick={() => {
                         updateApplicationStatus(selectedApp.id!, "Approved");
                         setSelectedApp({...selectedApp, status: "Approved"});
                         toast.success("Override successful. Webhook Fired: application.approved");
                       }}
                       className="flex-1 py-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                     >
                       <CheckCircle size={16} /> Approve Override
                     </button>
                     <button
                       onClick={() => {
                         updateApplicationStatus(selectedApp.id!, "Rejected");
                         setSelectedApp({...selectedApp, status: "Rejected"});
                         toast.error("Override applied. Webhook Fired: application.declined");
                       }}
                       className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                     >
                       <XCircle size={16} /> Reject Application
                     </button>
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

