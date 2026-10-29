import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, ShieldAlert, TrendingDown, TrendingUp, Search, 
  ChevronRight, Map, PieChart, FileText, Bell, Filter, Download,
  Zap, AlertTriangle, CheckCircle, Clock, MapPin, Building2, Bot
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RePie, Pie, Cell 
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToSentinelBorrowers, MonitoredBorrower } from "@/lib/firestore";
import { toast } from "sonner";
import { UnderwritingCopilot } from "./UnderwritingCopilot";

export default function Sentinel() {
  const { orgId } = useAuth();
  const [borrowers, setBorrowers] = useState<MonitoredBorrower[]>([]);
  const [selectedBorrower, setSelectedBorrower] = useState<MonitoredBorrower | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!orgId) return;
    const unsubscribe = subscribeToSentinelBorrowers(orgId, (data) => {
      setBorrowers(data);
    });
    return () => unsubscribe();
  }, [orgId]);

  const filteredBorrowers = borrowers.filter(b => 
    b.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: borrowers.length,
    red: borrowers.filter(b => b.riskCategory === "Red").length,
    amber: borrowers.filter(b => b.riskCategory === "Amber").length,
    green: borrowers.filter(b => b.riskCategory === "Green").length,
  };

  const pieData = [
    { name: "High Risk", value: stats.red, color: "#ef4444" },
    { name: "Watch List", value: stats.amber, color: "#f59e0b" },
    { name: "Healthy", value: stats.green, color: "#10b981" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Sentinel: Portfolio EWS</h2>
          <p className="text-muted-foreground mt-1 text-sm">Continuous AI surveillance of live disbursements across Indian credit nodes.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-[10px] font-black text-green-500 flex items-center gap-2 uppercase tracking-widest">
            <Activity size={14} className="animate-pulse" /> Data In Sync
          </div>
          <button className="px-4 py-2 glass-panel border border-border rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-foreground/5 transition-all">
            <Download size={14} /> Export CRILC Master
          </button>
        </div>
      </div>

      {/* Top Stats & Heatmap */}
      <div className="grid lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 glass-panel bg-secondary/10 border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center justify-center text-center"
        >
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Risk Distribution</div>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePie>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            {pieData.map(d => d.value > 0 && (
              <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-bold">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3 glass-panel bg-secondary/10 border border-white/5 p-6 rounded-[2.5rem]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Map size={14} /> Regional Stress Concentration
            </div>
            <div className="flex gap-2">
               <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase">Mumbai (High)</span>
               <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">Bangalore (Stable)</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            {[
              { label: "Critical Alerts", value: stats.red, color: "text-red-500", desc: "Require Immediate Action" },
              { label: "Portfolio Health", value: "84.2%", color: "text-primary", desc: "Overall Sentinel Score" },
              { label: "Predicted NPAs", value: "2", color: "text-yellow-500", desc: "Next 90-day Forecast" },
              { label: "Compliance Rate", value: "100%", color: "text-green-500", desc: "RBI Return Status" },
            ].map((stat, i) => (
              <div key={i} className="bg-background/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">{stat.label}</div>
                <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground mt-2">{stat.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Main Table / List */}
      <div className="glass-panel bg-background/40 border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Filter portolio by name, GSTIN, or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-foreground/5 border border-border rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-xl text-muted-foreground transition-colors"><Filter size={18}/></button>
            <button className="p-3 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-xl text-muted-foreground transition-colors"><Bell size={18}/></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/5 border-b border-white/5">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Borrower Identity</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Exposure</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sentinel Score</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Trend (30D)</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right font-black tracking-widest text-[#10b981]">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBorrowers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground italic">
                    <Activity size={32} className="mx-auto mb-4 opacity-10 animate-pulse" />
                    No monitored borrowers found. Active disbursements will stream here.
                  </td>
                </tr>
              ) : filteredBorrowers.map((b) => (
                <tr key={b.id} className="hover:bg-foreground/5 transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-secondary border flex items-center justify-center font-bold text-lg shadow-lg ${b.riskCategory === 'Red' ? 'border-red-500/30 text-red-400' : 'border-white/5 text-foreground'}`}>
                        {b.applicantName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-base mb-0.5">{b.applicantName}</div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                           <MapPin size={10} /> {b.location} <span className="opacity-30">•</span> <Building2 size={10} /> {b.sector}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 font-display font-medium text-foreground">₹{(b.loanAmount / 100000).toFixed(1)}L</td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-foreground/5 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${b.currentScore >= 700 ? 'bg-green-500' : b.currentScore >= 500 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${(b.currentScore / 900) * 100}%` }}
                        />
                      </div>
                      <span className={`font-mono font-bold text-sm ${b.currentScore >= 700 ? 'text-green-400' : b.currentScore >= 500 ? 'text-yellow-500' : 'text-red-400'}`}>
                        {b.currentScore}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                     {b.history.length > 1 ? (
                       b.currentScore >= b.history[b.history.length-2].score ? (
                         <div className="flex items-center justify-center gap-1 text-green-500">
                           <TrendingUp size={16} />
                           <span className="text-[10px] font-bold">+{b.currentScore - b.history[b.history.length-2].score}</span>
                         </div>
                       ) : (
                         <div className="flex items-center justify-center gap-1 text-red-500">
                           <TrendingDown size={16} />
                           <span className="text-[10px] font-bold">-{b.history[b.history.length-2].score - b.currentScore}</span>
                         </div>
                       )
                     ) : <span className="text-muted-foreground text-[10px]">NEW</span>}
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      b.riskCategory === 'Red' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)]' :
                      b.riskCategory === 'Amber' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      'bg-green-500/10 text-green-500 border-green-500/20'
                    }`}>
                      {b.riskCategory === 'Red' ? '🚨 Intervention' : b.riskCategory === 'Amber' ? '⚠️ Watchlist' : '✅ Healthy'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => setSelectedBorrower(b)}
                      className="px-6 py-2.5 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground transition-all flex items-center gap-2 ml-auto hover:gap-3"
                    >
                      SURVEILLANCE <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              )
            )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase opacity-50">
        RBI Regulatory Tech Layer v4.2 • Secured via AES-256 Distributed Ledger
      </p>

      {/* Drill-down Modal */}
      <AnimatePresence>
        {selectedBorrower && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-background/95 backdrop-blur-2xl"
               onClick={() => setSelectedBorrower(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-5xl bg-background border border-border rounded-[3rem] shadow-3xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${selectedBorrower.riskCategory === 'Red' ? 'bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'}`}>
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold">{selectedBorrower.applicantName}</h3>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sentinel Pulse ID: {selectedBorrower.id?.slice(-12)}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedBorrower(null)} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors border border-white/5">
                   <AlertTriangle size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-8 space-y-10">
                {/* Score Chart */}
                <div className="bg-background/60 border border-white/5 p-8 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h4 className="text-sm font-bold mb-1">Health Trajectory</h4>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Historical Sentinel Vector Analysis</p>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="text-right">
                           <div className="text-xs text-muted-foreground font-bold italic">Current Score</div>
                           <div className={`text-4xl font-display font-bold ${selectedBorrower.riskCategory === 'Red' ? 'text-red-500' : 'text-primary'}`}>{selectedBorrower.currentScore}</div>
                        </div>
                     </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedBorrower.history}>
                        <defs>
                          <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={selectedBorrower.riskCategory === 'Red' ? '#ef4444' : '#3b82f6'} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={selectedBorrower.riskCategory === 'Red' ? '#ef4444' : '#3b82f6'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} stroke="#444" fontSize={10} />
                        <YAxis domain={[300, 900]} stroke="#444" fontSize={10} />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0a0a0c', border: '1px solid #333', borderRadius: '12px'}}
                          itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke={selectedBorrower.riskCategory === 'Red' ? '#ef4444' : '#3b82f6'} 
                          strokeWidth={3}
                          fill="url(#scoreGlow)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Digital Signals */}
                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                       <Zap size={14} className="text-yellow-400" /> Live Infrastructure Signals
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "GST Turnunder", value: `₹${(selectedBorrower.signals.gstTurnover / 100000).toFixed(1)}L`, icon: FileText, sub: "Monthly Filing" },
                        { label: "UPI Inflows", value: `₹${(selectedBorrower.signals.upiInflows / 100000).toFixed(1)}L`, icon: Activity, sub: "Digital Cashflow" },
                        { label: "Bureau Sync", value: selectedBorrower.signals.bureauScore, icon: PieChart, sub: "Experian Hunter" },
                        { label: "GST Status", value: "Compliant", icon: CheckCircle, sub: "Auto-verified" },
                      ].map((sig, i) => (
                        <div key={i} className="bg-foreground/5 border border-border p-5 rounded-3xl flex flex-col items-center text-center">
                           <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center mb-3">
                              <sig.icon size={18} className="text-primary" />
                           </div>
                           <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{sig.label}</div>
                           <div className="text-lg font-bold">{sig.value}</div>
                           <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">{sig.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit Timeline */}
                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                       <Clock size={14} className="text-blue-400" /> Evidence Timeline
                    </h5>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {selectedBorrower.history.slice().reverse().map((h, i) => (
                        <div key={i} className="relative pl-8 pb-4 last:pb-0 border-l border-white/5">
                           <div className={`absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full ${h.category === 'Red' ? 'bg-red-500' : h.category === 'Amber' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-black text-foreground uppercase">{new Date(h.date).toLocaleDateString()}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${h.category === 'Red' ? 'bg-red-500/10 text-red-500' : 'bg-foreground/5 text-muted-foreground'}`}>SCORE: {h.score}</span>
                           </div>
                           <p className="text-xs text-muted-foreground italic leading-relaxed">{h.reason}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-white/5">
                       <button className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-glow">
                          Invoke Intervention Protocol
                       </button>
                    </div>
                  </div>

                  {/* Underwriting Copilot */}
                  <div className="space-y-6 h-full flex flex-col">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                       <Bot size={14} className="text-primary" /> Analyst Copilot
                    </h5>
                    <div className="flex-1 min-h-[400px]">
                      <UnderwritingCopilot borrower={selectedBorrower} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
