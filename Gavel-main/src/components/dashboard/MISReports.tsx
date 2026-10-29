import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, BarChart3, PieChart, RefreshCw, Activity } from "lucide-react";
import { toast } from "sonner";
import { apiWithAuth } from "../../lib/api-client";

export default function MISReports({ orgId }: { orgId: string | null }) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetchReport = async () => {
      try {
        const res = await apiWithAuth('/v1/analytics/mis?type=monthly');
        if (res.ok) {
          const data = await res.json();
          setReportData(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [orgId]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">MIS & Compliance Reports</h1>
          <p className="text-muted-foreground mt-1">One-click regulatory and management reporting.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 border border-border rounded-xl bg-background text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-secondary transition-all">
             <Download size={14} /> Export CSV
           </button>
           <button className="px-4 py-2 hero-gradient text-foreground rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-glow">
             <FileText size={14} /> Generate PDF
           </button>
        </div>
      </div>

      {loading || !reportData ? (
        <div className="p-20 text-center opacity-40">Loading reports...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="glass-panel bg-secondary/10 border border-white/5 p-8 rounded-3xl group">
               <div className="flex items-center gap-3 text-muted-foreground mb-4">
                 <BarChart3 size={20} className="text-primary" />
                 <span className="text-xs font-bold uppercase tracking-widest">Portfolio Summary</span>
               </div>
               <div className="space-y-4">
                 <div>
                   <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Active Loans</div>
                   <div className="text-2xl font-bold">{reportData.portfolioSummary?.totalActiveLoans || 0}</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Disbursed YTD</div>
                   <div className="text-2xl font-bold">₹{(reportData.portfolioSummary?.totalDisbursedYTD || 0).toLocaleString()}</div>
                 </div>
               </div>
            </div>

            <div className="glass-panel bg-secondary/10 border border-white/5 p-8 rounded-3xl group">
               <div className="flex items-center gap-3 text-muted-foreground mb-4">
                 <PieChart size={20} className="text-blue-500" />
                 <span className="text-xs font-bold uppercase tracking-widest">Approval Metrics</span>
               </div>
               <div className="space-y-4">
                 <div>
                   <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Overall Approval Rate</div>
                   <div className="text-2xl font-bold">{reportData.approvalMetrics?.approvalRate || 0}%</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Average TTD</div>
                   <div className="text-2xl font-bold text-green-500">{reportData.approvalMetrics?.averageTTD || '0 days'}</div>
                 </div>
               </div>
            </div>

            <div className="glass-panel bg-secondary/10 border border-white/5 p-8 rounded-3xl group">
               <div className="flex items-center gap-3 text-muted-foreground mb-4">
                 <Activity size={20} className="text-red-500" />
                 <span className="text-xs font-bold uppercase tracking-widest">Risk & Collections</span>
               </div>
               <div className="space-y-4">
                 <div>
                   <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Current NPA Rate</div>
                   <div className="text-2xl font-bold text-red-500">{reportData.npaTrend?.currentNPA || 0}%</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Collection Efficiency</div>
                   <div className="text-2xl font-bold text-green-500">{reportData.collectionEfficiency || 0}%</div>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="glass-panel bg-background/40 border border-border p-8 rounded-3xl">
            <h3 className="text-lg font-bold mb-6">Scheduled Reports</h3>
            <div className="space-y-4">
              {['Daily Disbursal Summary', 'Weekly NPA Trend Tracker', 'Monthly RBI Compliance (Format A)'].map(rep => (
                <div key={rep} className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <FileText size={20} className="text-muted-foreground" />
                    <span className="font-bold text-sm">{rep}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-muted-foreground">Next run: Tomorrow 09:00 AM</span>
                    <button className="text-primary hover:underline">Edit Schedule</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
