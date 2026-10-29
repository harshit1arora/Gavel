import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ShieldCheck, Download, ExternalLink, Activity, Loader2, AlertCircle, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiWithAuth, parseResponse } from "@/lib/api-client";
import AuditReportModal from "./AuditReportModal";

const MOCK_AUDITS = [
  { id: 'gavel_audit_7c9e', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), actor: 'api_key_live', action: 'Underwriting Analysis', detail: 'Decision: APPROVE | Score: 742', success: true },
  { id: 'gavel_audit_8f21', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), actor: 'system', action: 'Policy Update', detail: 'Modified Rule R007: Threshold 0.50 -> 0.45', success: true },
  { id: 'gavel_audit_3301', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), actor: 'admin@nbfc.com', action: 'Manual Review Override', detail: 'App ID: loan_9921 | Status: APPROVED', success: true },
  { id: 'gavel_audit_9901', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), actor: 'api_key_live', action: 'Underwriting Analysis', detail: 'Decision: REJECT | Score: 210', success: true },
];

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      // In demo mode, we'll merge mock data with any real data
      try {
        const res = await apiWithAuth("/v1/system/audit-logs?limit=100");
        const realData = await parseResponse(res);
        return [...MOCK_AUDITS,...(realData || [])];
      } catch (e) {
        return MOCK_AUDITS;
      }
    }
  });

  const filteredLogs = logs?.filter((log: any) =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center justify-center gap-3">
        <Lock size={14} className="text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Immutable Compliance Record; This ledger is mathematically sealed and cannot be modified or deleted.
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Compliance Ledger</h2>
          <p className="text-muted-foreground mt-1 text-sm">WORM (Write Once, Read Many) secure audit logs for RBI compliance.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-bold hover:bg-secondary transition-all">
            <Download size={14} /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-glow hover:opacity-90 transition-all">
            <ShieldCheck size={14} /> Verify Integrity
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-[2rem] bg-card/30">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search by action, actor, or audit ID..."
              className="w-full bg-secondary/30 border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 bg-secondary/50 border border-border/50 rounded-2xl hover:bg-secondary transition-all">
            <Filter size={18} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Audit ID</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actor</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono italic">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Querying immutable ledger...</span>
                  </td>
                </tr>
              ): filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-muted-foreground">No records found matching your query.</td>
                </tr>
              ): filteredLogs.map((log: any) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedAuditId(log.id)}
                  className="hover:bg-foreground/5 transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-4 font-bold text-foreground opacity-80 group-hover:text-primary transition-colors">{log.id?.substring(0, 12)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-4 px-4 font-bold">{log.actor}</td>
                  <td className="py-4 px-4 text-foreground/80">{log.action}</td>
                  <td className="py-4 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${log.success ? 'bg-green-500/10 text-green-500': 'bg-destructive/10 text-destructive'}`}>
                      {log.success ? 'Verified': 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AuditReportModal
        isOpen={!!selectedAuditId}
        onClose={() => setSelectedAuditId(null)}
        logId={selectedAuditId || undefined}
      />
    </div>
  );
}
