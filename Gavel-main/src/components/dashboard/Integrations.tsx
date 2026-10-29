import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Server, Shield, Database, Power, AlertTriangle, Fingerprint, Activity, Loader2 } from "lucide-react";
import AaConsentModal from "./AaConsentModal";
import { useQuery } from "@tanstack/react-query";
import { apiWithAuth, parseResponse } from "@/lib/api-client";

export default function Integrations() {
  const [showConsent, setShowConsent] = useState(false);
  const [localIntegrations, setLocalIntegrations] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['system-integrations'],
    queryFn: async () => {
      const res = await apiWithAuth("/v1/system/integrations");
      return parseResponse(res);
    }
  });

  useEffect(() => {
    if (data) setLocalIntegrations(data);
  }, [data]);

  const toggleStatus = (id: string) => {
    const integration = localIntegrations.find(i => i.id === id);
    if (!integration) return;

    if (id === "sahamati" && integration.status === "disconnected") {
      setShowConsent(true);
      return;
    }

    setLocalIntegrations(localIntegrations.map(i => {
      if (i.id === id) {
        return { 
          ...i, 
          status: i.status === "connected" ? "disconnected" : "connected", 
          latency: i.status === "connected" ? "-" : Math.floor(Math.random() * 100 + 40) + "ms" 
        };
      }
      return i;
    }));
  };

  const handleAaConsentSuccess = () => {
    setLocalIntegrations(localIntegrations.map(i => {
      if (i.id === "sahamati") {
        return { ...i, status: "connected", latency: Math.floor(Math.random() * 120 + 80) + "ms" };
      }
      return i;
    }));
  };

  if (isLoading) {
     return (
       <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-[10px] uppercase tracking-widest font-black">Syncing Integration Fabric...</span>
       </div>
     );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Integration Fabric</h2>
          <p className="text-muted-foreground mt-1 text-sm">Direct, zero-latency pipes to Indian Credit Bureaus, Central KYC, and Account Aggregators.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-xs font-bold text-green-500">
          <Activity size={14} className="animate-pulse" /> SYSTEM HEALTH: OPTIMAL
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {localIntegrations.map((integration, i) => (
          <motion.div 
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-panel border p-6 rounded-[2rem] relative overflow-hidden transition-all duration-300 ${integration.status === 'connected' ? 'bg-primary/5 border-primary/20' : 'bg-background/40 border-white/5 opacity-70'}`}
          >
            <div className="flex items-start justify-between mb-8">
              <div className={`p-3 rounded-2xl ${integration.status === 'connected' ? 'bg-primary/20 text-primary' : 'bg-foreground/10 text-muted-foreground'}`}>
                {integration.type === "Bureau" ? <Database size={24} /> : integration.type === "Identity" ? <Fingerprint size={24} /> : integration.type === "Fraud" ? <Shield size={24} /> : <Server size={24} />}
              </div>
              
              <button 
                onClick={() => toggleStatus(integration.id)}
                className={`p-2 rounded-full border transition-all shadow-md ${integration.status === 'connected' ? 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30' : 'bg-foreground/5 border-border text-muted-foreground hover:text-foreground'}`}
              >
                <Power size={16} />
              </button>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{integration.type}</div>
              <h3 className="text-lg font-bold mb-4">{integration.name}</h3>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {integration.status === "connected" ? (
                    <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/><span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Connected</span></>
                  ) : (
                    <><div className="w-2 h-2 rounded-full bg-gray-500"/><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Isolated</span></>
                  )}
                </div>
                <div className="text-[10px] font-mono font-bold text-foreground opacity-70">{integration.latency !== "-" ? `Ping: ${integration.latency}` : ""}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-6 glass-panel border border-white/5 rounded-3xl bg-secondary/20 flex gap-4 items-start">
        <AlertTriangle size={24} className="text-yellow-500 shrink-0" />
        <div>
          <h4 className="font-bold text-foreground mb-1">RBI Account Aggregator Mandate</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connecting to Sahamati AA requires explicit user consent architecture. Ensure your frontend application triggers the Gavel Consent UI flow before requesting alternative data pulls.
          </p>
        </div>
      </div>

      <AaConsentModal 
        isOpen={showConsent} 
        onClose={() => setShowConsent(false)} 
        onConsentSuccess={handleAaConsentSuccess} 
      />
    </div>
  );
}
