import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Download, CheckCircle, Zap, Activity, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiWithAuth, parseResponse } from "@/lib/api-client";

export default function BillingDashboard() {
  const { orgId } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [usageStats, setUsageStats] = useState({
    apiCalls: 0,
    apiLimit: 100,
    activeLoans: 124,
    disbursedVolume: 12500000,
    nextBillingDate: "2026-06-01",
    currentPlan: "Startup Tier",
  });

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await apiWithAuth('/v1/billing/usage');
        const data = await parseResponse(res);
        setUsageStats(prev => ({
          ...prev,
          apiCalls: data.apiCalls || 0,
          apiLimit: data.limit || 100,
          currentPlan: data.tier === 'enterprise' ? 'Enterprise Tier' : 'Startup Tier'
        }));
      } catch (err) {
        console.error("Failed to fetch usage stats", err);
      }
    };
    fetchUsage();
  }, [orgId]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    const res = await loadRazorpay();
    
    if (!res) {
      toast.error("Razorpay SDK failed to load.");
      setIsUpgrading(false);
      return;
    }

    try {
      // 1. Create order on backend
      const orderRes = await apiWithAuth('/v1/billing/create-order', { method: 'POST' });
      const order = await parseResponse(orderRes);

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockkey12345',
        amount: order.amount,
        currency: order.currency,
        name: "Gavel AI Enterprise",
        description: "Unlimited AI Analysis Calls & Priority Support",
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            const verifyRes = await apiWithAuth('/v1/billing/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            await parseResponse(verifyRes);
            toast.success("Successfully upgraded to Enterprise Tier!");
            setUsageStats(prev => ({ ...prev, currentPlan: 'Enterprise Tier', apiLimit: 'Unlimited' as any }));
          } catch (err) {
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: "NBFC Admin",
          email: "admin@nbfc.com",
        },
        theme: {
          color: "#000000",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate payment");
    } finally {
      setIsUpgrading(false);
    }
  };

  const invoices = [
    { id: "INV-2026-04", date: "May 1, 2026", amount: 25000, status: "Paid" },
    { id: "INV-2026-03", date: "Apr 1, 2026", amount: 22500, status: "Paid" },
    { id: "INV-2026-02", date: "Mar 1, 2026", amount: 18000, status: "Paid" },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Billing & Usage</h1>
          <p className="text-muted-foreground mt-1">Manage your SaaS subscription, track API usage, and view invoices.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleUpgrade}
             disabled={isUpgrading || usageStats.currentPlan === 'Enterprise Tier'}
             className="px-6 py-3 hero-gradient text-foreground rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-glow disabled:opacity-50"
           >
             {isUpgrading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} 
             {usageStats.currentPlan === 'Enterprise Tier' ? 'Enterprise Active' : 'Upgrade to Enterprise'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Current Plan */}
         <div className="glass-panel bg-primary/5 border border-primary/20 p-8 rounded-3xl md:col-span-1 flex flex-col justify-between">
            <div>
               <div className="flex items-center gap-2 mb-2">
                 <Zap size={20} className="text-primary" />
                 <h3 className="font-bold uppercase tracking-widest text-xs text-primary">Current Plan</h3>
               </div>
               <div className="text-3xl font-display font-black mb-2">{usageStats.currentPlan}</div>
               <p className="text-sm text-muted-foreground mb-6">₹0.10 per API call + 0.1% AUM</p>
               
               <div className="space-y-4 mb-6">
                 <div>
                   <div className="flex justify-between text-xs mb-1">
                     <span className="text-muted-foreground font-bold uppercase tracking-wider">API Usage</span>
                     <span>{usageStats.apiCalls.toLocaleString()} / {usageStats.apiLimit}</span>
                   </div>
                   <div className="h-2 bg-background rounded-full overflow-hidden border border-white/5">
                     <div className="h-full bg-primary transition-all duration-1000" style={{ width: typeof usageStats.apiLimit === 'number' ? `${(usageStats.apiCalls/usageStats.apiLimit)*100}%` : '100%' }} />
                   </div>
                 </div>
               </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Next billing cycle starts on {usageStats.nextBillingDate}</p>
         </div>

         {/* Usage Stats */}
         <div className="glass-panel bg-secondary/10 border border-white/5 p-8 rounded-3xl md:col-span-2 grid grid-cols-2 gap-8">
            <div className="flex flex-col justify-center">
               <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2"><Activity size={14} className="text-blue-500"/> Disbursed Volume (YTD)</div>
               <div className="text-4xl font-display font-bold">₹{(usageStats.disbursedVolume / 10000000).toFixed(2)} Cr</div>
               <div className="text-xs text-green-500 mt-2 flex items-center gap-1"><CheckCircle size={12}/> +15% from last month</div>
            </div>
            <div className="flex flex-col justify-center">
               <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Active Loan Contracts</div>
               <div className="text-4xl font-display font-bold">{usageStats.activeLoans}</div>
               <div className="text-xs text-green-500 mt-2 flex items-center gap-1"><CheckCircle size={12}/> Healthy Portfolio</div>
            </div>
         </div>
      </div>

      {/* Invoices */}
      <div className="glass-panel bg-background/40 border border-border p-8 rounded-3xl">
        <h3 className="text-lg font-bold mb-6">Recent Invoices</h3>
        <div className="space-y-4">
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground">
                  <CreditCard size={18} />
                </div>
                <div>
                  <div className="font-bold text-sm">{inv.id}</div>
                  <div className="text-xs text-muted-foreground">{inv.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="font-bold">₹{inv.amount.toLocaleString()}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-green-500">{inv.status}</div>
                </div>
                <button className="text-muted-foreground hover:text-primary transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
