import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCcw, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiWithAuth, parseResponse } from "@/lib/api-client";
import { toast } from "sonner";

export default function Analytics() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['portfolio-analytics'],
    queryFn: async () => {
      const res = await apiWithAuth("/v1/analytics/portfolio");
      return parseResponse(res);
    }
  });

  if (isLoading) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center gap-4 text-muted-foreground font-mono">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="text-[10px] uppercase tracking-widest">Aggregating real-time portfolio data...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center gap-4 text-red-400 font-mono">
        <AlertCircle size={32} />
        <span className="text-sm">Failed to sync with analytics engine.</span>
        <button onClick={() => refetch()} className="text-[10px] underline uppercase tracking-widest">Retry Connection</button>
      </div>
    );
  }

  const { volume30Days, riskDistribution, npaRatio, totalDisbursalYtd, healthMetrics } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Portfolio Analysis</h2>
          <p className="text-muted-foreground mt-1 text-sm">Macro-level predictive modeling & real-time aggregated risk profiles.</p>
        </div>
        <button 
          onClick={() => {
            const load = toast.loading("Syncing with data clusters...");
            refetch().then(() => toast.dismiss(load));
          }}
          className="flex items-center gap-2 px-4 py-2 border border-border bg-foreground/5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Real Volume Graph */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-panel border p-8 rounded-[2rem] bg-background/40 flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg">Application Volume (Last 6 Months)</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-foreground/20" />
                 <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest text-foreground/50">Attempts</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-primary" />
                 <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest text-primary">Approved</span>
               </div>
            </div>
          </div>
          
          <div className="flex-1 flex items-end gap-3 h-full pb-8">
             {volume30Days.length === 0 ? (
               <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase italic border border-dashed border-white/5 rounded-2xl">
                 Insufficient historical data for volume plotting
               </div>
             ) : volume30Days.map((v: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full group">
                   <div className="flex-1 w-full bg-foreground/5 rounded-t-lg relative flex flex-col justify-end overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(v.applications / Math.max(...volume30Days.map((x:any)=>x.applications), 1)) * 100}%` }}
                        className="w-full bg-foreground/10 absolute bottom-0"
                      />
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(v.approved / Math.max(...volume30Days.map((x:any)=>x.applications), 1)) * 100}%` }}
                        className="w-full bg-primary shadow-glow absolute bottom-0"
                      />
                   </div>
                   <span className="text-[10px] font-bold text-muted-foreground mt-4 group-hover:text-foreground transition-colors uppercase">{v.month}</span>
                </div>
             ))}
          </div>
        </motion.div>

        {/* NPA Ratio */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel border border-red-500/20 bg-red-500/5 p-8 rounded-[2rem] flex flex-col justify-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 opacity-10"><AlertCircle size={64}/></div>
           <div className="text-[10px] font-black tracking-widest uppercase text-red-500 mb-2 font-mono">EWS Signal: Red Ratio</div>
           <div className="text-7xl font-display font-black text-foreground mb-4">{npaRatio}<span className="text-3xl">%</span></div>
           <div className="flex items-center justify-center gap-2 text-[10px] text-foreground font-bold bg-foreground/10 w-max mx-auto px-4 py-1.5 rounded-full uppercase tracking-widest">
             Real-time Portfolio Stress
           </div>
           <p className="text-xs text-muted-foreground mt-8 leading-relaxed font-mono">
              Aggregated from live GST/UPI signals. Borrowers in "High Risk" category across entire monitored book.
           </p>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-panel border p-8 rounded-[2rem] bg-secondary/10">
           <h3 className="font-bold text-sm mb-6 flex items-center gap-2"><Activity size={16} className="text-primary"/> Scoring Vector Distribution</h3>
           <div className="space-y-6">
             {riskDistribution.map((r: any) => (
               <div key={r.range}>
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                   <span className="text-muted-foreground">Range: {r.range}</span>
                   <span className="text-foreground">{r.count} Cases</span>
                 </div>
                 <div className="w-full h-1.5 bg-background/40 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.count / Math.max(...riskDistribution.map((x:any)=>x.count), 1)) * 100}%` }}
                      className={`h-full rounded-full ${parseInt(r.range) < 600 ? 'bg-red-400' : 'bg-primary'}`}
                    />
                 </div>
               </div>
             ))}
           </div>
        </motion.div>
        
        {/* Disbursal Volume */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass-panel border p-10 rounded-[3rem] bg-primary/5 border-primary/10 flex items-center justify-between group">
           <div>
             <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-3 font-mono">Total Capital Deployed (Live)</div>
             <div className="text-5xl font-display font-black text-foreground">₹{(totalDisbursalYtd / 10000000).toFixed(2)} Cr</div>
             <div className="flex items-center gap-3 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span className="text-green-400">Approval Rate: {healthMetrics.approvalRate.toFixed(1)}%</span>
                <span className="w-1 h-1 bg-foreground/20 rounded-full" />
                <span>Avg Decision: {healthMetrics.avgDecisionTimeMs > 0 ? `${(healthMetrics.avgDecisionTimeMs / 1000).toFixed(1)}s` : 'N/A'}</span>
             </div>
           </div>
           <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-glow">
             <TrendingUp size={48} className="text-primary" />
           </div>
        </motion.div>
      </div>
    </div>
  );
}
