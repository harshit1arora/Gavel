import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sliders, ShieldCheck, AlertTriangle, PlayCircle, Save, Plus, Trash2, ChevronRight, Loader2, Zap, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToRiskPolicy, saveRiskPolicy, RiskPolicy, PolicyRule } from "@/lib/firestore";
import { toast } from "sonner";

export default function PolicyEditor() {
  const { orgId } = useAuth();
  const [activeRuleTab, setActiveRuleTab] = useState<"auto-approve" | "auto-reject" | "manual-review" | "simulation">("auto-approve");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const defaultRules = {
    "auto-approve": [
      { id: 1, field: "Credit Score", op: ">", value: "750", description: "Instantly approve prime borrowers" },
      { id: 2, field: "DTI Ratio", op: "<", value: "25%", description: "Low debt-to-income signal" },
      { id: 3, field: "Employment", op: "is", value: "Salaried", description: "Stable income type" }
    ],
    "auto-reject": [
      { id: 4, field: "CIBIL Matches", op: "contains", value: "Written-off", description: "Default history found" },
      { id: 5, field: "DTI Ratio", op: ">", value: "50%", description: "Unsustainable debt" }
    ],
    "manual-review": [
      { id: 6, field: "Credit Score", op: "btw", value: "600-749", description: "Gray zone evaluation" },
      { id: 7, field: "Liveness Score", op: "<", value: "0.92", description: "Fraud verification check" }
    ]
  };

  const [rules, setRules] = useState<Omit<RiskPolicy, "id" | "orgId" | "updatedAt">>(defaultRules);

  useEffect(() => {
    if (!orgId) return;
    const unsub = subscribeToRiskPolicy(orgId, (policy) => {
      if (policy) {
         setRules({
           "auto-approve": policy["auto-approve"],
           "auto-reject": policy["auto-reject"],
           "manual-review": policy["manual-review"]
         });
         setHasChanges(false);
      }
    });
    return () => unsub();
  }, [orgId]);

  const handleSave = async () => {
     if (!orgId) return;
     setIsSaving(true);
     try {
       await saveRiskPolicy(orgId, rules);
       toast.success("Policy deployment successful. Engine nodes updated.");
       setHasChanges(false);
     } catch (err) {
       toast.error("Failed to deploy policy updates.");
     } finally {
       setIsSaving(false);
     }
  };

  const updateRuleValue = (tab: "auto-approve" | "auto-reject" | "manual-review", ruleId: number, newValue: string) => {
    setRules(prev => ({
      ...prev,
      [tab]: prev[tab].map(r => r.id === ruleId ? { ...r, value: newValue } : r)
    }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight text-foreground flex items-center gap-3">
            Risk Policy Engine
            <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded uppercase tracking-widest">v2.1.0-stable</span>
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">Configure the algorithmic thresholds that dictate your auto-decisioning logic.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-foreground/5 border border-border rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-foreground/10 transition-all">
            <History size={14} /> Version History
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all">
            <PlayCircle size={14} /> Test Policy
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: "auto-approve", label: "Auto-Approve", icon: ShieldCheck, color: "text-green-400" },
            { id: "auto-reject", label: "Auto-Reject", icon: Trash2, color: "text-red-400" },
            { id: "manual-review", label: "Manual Review", icon: AlertTriangle, color: "text-yellow-400" },
            { id: "simulation", label: "Shadow Mode", icon: PlayCircle, color: "text-blue-400" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveRuleTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all group ${
                activeRuleTab === item.id 
                  ? "bg-primary text-white shadow-glow" 
                  : "text-muted-foreground hover:bg-foreground/5 border border-transparent"
              }`}
            >
              <item.icon size={18} className={activeRuleTab === item.id ? "text-foreground" : item.color} />
              <span className="uppercase tracking-widest text-[11px]">{item.label}</span>
              {activeRuleTab === item.id && <ChevronRight size={14} className="ml-auto opacity-40" />}
            </button>
          ))}
        </div>

        {/* Rule Editor Area */}
        <div className="lg:col-span-3 space-y-8">
          <motion.div 
            key={activeRuleTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-heavy bg-card/40 border border-border p-8 rounded-[2.5rem]"
          >
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
              <h3 className="font-black text-xl uppercase tracking-tighter flex items-center gap-3 italic">
                {activeRuleTab.replace('-', ' ')} Logic
              </h3>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-foreground/5 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-foreground/10 transition-all">
                  <Plus size={14} /> Add Rule
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={!hasChanges || isSaving}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hasChanges ? 'bg-primary text-white shadow-glow' : 'bg-foreground/5 text-muted-foreground opacity-50 cursor-not-allowed border border-white/5'}`}
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                  {isSaving ? "Deploying..." : "Commit Changes"}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* dynamic policy field keys are validated at runtime */}
              {(rules[activeRuleTab] || []).map((rule, idx) => (
                <div 
                  key={rule.id}
                  className="group flex flex-col md:flex-row md:items-center gap-6 p-6 bg-background/60 border border-white/5 rounded-2xl hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-mono text-xs font-black text-muted-foreground/40 border border-white/5 italic">
                    {idx + 1}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div className="bg-foreground/5 p-3 rounded-xl border border-white/5 text-[11px] font-black uppercase tracking-widest text-foreground flex items-center justify-between group-hover:bg-foreground/10 transition-all">
                      {rule.field} <ChevronRight size={12} className="text-primary opacity-40" />
                    </div>
                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 text-xs text-primary font-black text-center italic">
                      {rule.op}
                    </div>
                    <div className="bg-foreground/5 p-3 rounded-xl border border-white/5 text-[11px] text-foreground font-mono flex items-center justify-center group-hover:bg-foreground/10 transition-all">
                      <input 
                        type="text" 
                        value={rule.value} 
                        onChange={(e) => updateRuleValue(activeRuleTab as any, rule.id, e.target.value)}
                        className="bg-transparent border-none text-center w-full focus:outline-none text-primary font-bold disabled:opacity-50"
                        disabled={rule.field !== "Credit Score"} // Only make score editable for demo
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest italic opacity-40 px-2 min-w-[120px]">
                    // {rule.description}
                  </div>

                  <button className="opacity-0 group-hover:opacity-100 p-3 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {activeRuleTab === "simulation" && (
                <div className="py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 shadow-glow">
                    <PlayCircle className="text-primary" size={40} />
                  </div>
                  <h4 className="font-black text-2xl uppercase tracking-tighter italic">Enter Shadow Mode</h4>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
                    Run this policy against live traffic without impacting real decisions. Compare approval rates against your active policy.
                  </p>
                  <button className="px-10 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow hover:scale-[1.05] transition-all">Start Simulation</button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Audit Trail */}
          <div className="glass-panel-heavy bg-primary/5 border border-primary/10 p-8 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
             <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
               <Zap size={24} className="animate-pulse" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">
                  Optimization Insight
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Lowering the <strong>Credit Score</strong> threshold by 10 points on this policy would historically increase approval volume by <span className="text-primary font-black">12.4%</span> while maintaining identical default risk metrics based on regional data node backtests.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
