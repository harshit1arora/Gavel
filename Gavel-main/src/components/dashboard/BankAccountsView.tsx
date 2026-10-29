import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, RefreshCw, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { getAuth } from "firebase/auth";

export default function BankAccountsView({ orgId }: { orgId: string | null }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!orgId) return;
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/v1/bank-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      toast.error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [orgId]);

  const handleConnectBank = async () => {
    if (!orgId) return;
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/v1/bank-accounts`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bankName: "HDFC Bank",
          accountNumber: "50100" + Math.floor(Math.random()*10000000),
          ifscCode: "HDFC0001234",
          accountHolderName: "Gavel Enterprise"
        })
      });
      if (res.ok) {
        toast.success("Bank account linked successfully");
        fetchAccounts();
      }
    } catch (error) {
      toast.error("Failed to link bank account");
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-border">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tighter mb-2">Treasury & Banking</h1>
          <p className="text-muted-foreground text-sm">Link current accounts to automate disbursements and reconciliation.</p>
        </div>
        <button 
          onClick={handleConnectBank}
          className="px-8 py-4 hero-gradient text-foreground rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-glow hover:scale-[1.02] transition-all"
        >
          <Link2 size={18} /> Connect Bank
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center opacity-40">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="glass-panel p-12 rounded-[3rem] border-dashed flex flex-col items-center justify-center text-center opacity-40">
          <Building2 size={48} className="mb-6" />
          <h3 className="text-xl font-black mb-2">No Connected Accounts</h3>
          <p className="text-sm max-w-sm">Connect an operational bank account to start automating fund movement.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {accounts.map((acc, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={acc.id}
              className="glass-panel p-8 rounded-[2.5rem] bg-card flex flex-col gap-4 border-border/60 hover:border-primary/40 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary border border-border">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{acc.bankName}</h3>
                    <p className="text-xs text-muted-foreground font-mono">Acct: {acc.accountNumber}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-all"><RefreshCw size={16}/></button>
                  <button className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="mt-4 p-4 bg-secondary/30 rounded-2xl border border-border">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Available Balance</div>
                <div className="text-3xl font-display font-black">₹{(acc.balance || 0).toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">Live from Core Banking</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
