import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Mail, MessageSquare, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getAuth } from "firebase/auth";

export default function CommTemplatesView({ orgId }: { orgId: string | null }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    if (!orgId) return;
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/v1/communications/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [orgId]);

  const handleCreateTemplate = async () => {
    if (!orgId) return;
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/v1/communications/templates`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Disbursal Confirmation",
          type: "SMS",
          subject: "",
          body: "Dear {borrowerName}, your loan of INR {amount} has been successfully disbursed to your bank account ending in {accountSuffix}.",
          variables: ["borrowerName", "amount", "accountSuffix"]
        })
      });
      if (res.ok) {
        toast.success("Template created");
        fetchTemplates();
      }
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-border">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tighter mb-2">Comms Hub</h1>
          <p className="text-muted-foreground text-sm">Manage automated SMS and Email templates for the loan lifecycle.</p>
        </div>
        <button 
          onClick={handleCreateTemplate}
          className="px-8 py-4 hero-gradient text-foreground rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-glow hover:scale-[1.02] transition-all"
        >
          <Plus size={18} /> New Template
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center opacity-40">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="glass-panel p-12 rounded-[3rem] border-dashed flex flex-col items-center justify-center text-center opacity-40">
          <Mail size={48} className="mb-6" />
          <h3 className="text-xl font-black mb-2">No Templates Found</h3>
          <p className="text-sm max-w-sm">Create templates to automate borrower notifications.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {templates.map((tpl, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={tpl.id}
              className="glass-panel p-8 rounded-[2.5rem] bg-card flex flex-col gap-4 border-border/60 hover:border-primary/40 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${tpl.type === 'SMS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                    {tpl.type === 'SMS' ? <MessageSquare size={24} /> : <Mail size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{tpl.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{tpl.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-all"><Edit2 size={16}/></button>
                  <button className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="mt-4 p-4 bg-secondary/30 rounded-2xl border border-border">
                <div className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">{tpl.body}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
