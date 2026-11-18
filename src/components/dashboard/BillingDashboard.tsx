import { useState, useEffect } from "react";
import { CreditCard, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiWithAuth, parseResponse } from "@/lib/api-client";

export default function BillingDashboard() {
  const { orgId } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [usageStats, setUsageStats] = useState({
    apiCalls: 0,
    apiLimit: 100 as number | 'Unlimited',
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
          apiLimit: data.tier === 'enterprise' ? 'Unlimited' : data.limit || 100,
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
        key: order.keyId,
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
            setUsageStats(prev => ({ ...prev, currentPlan: 'Enterprise Tier', apiLimit: 'Unlimited' }));
          } catch (err) {
            toast.error("Payment verification failed.");
          }
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

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Billing & Usage</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and track API usage.</p>
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

      <div className="grid gap-6">
         {/* Current Plan */}
         <div className="glass-panel bg-primary/5 border border-primary/20 p-8 rounded-3xl md:col-span-1 flex flex-col justify-between">
            <div>
               <div className="flex items-center gap-2 mb-2">
                 <Zap size={20} className="text-primary" />
                 <h3 className="font-bold uppercase tracking-widest text-xs text-primary">Current Plan</h3>
               </div>
               <div className="text-3xl font-display font-black mb-2">{usageStats.currentPlan}</div>

               
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
         </div>
      </div>
    </div>
  );
}
