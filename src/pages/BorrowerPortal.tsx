import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, ArrowRight, ShieldCheck, Download, CreditCard, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { LogoStatic } from "@/components/LogoStatic";

export default function BorrowerPortal() {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return toast.error("Enter a valid phone number");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/borrower/send-otp`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        setOtpSent(true);
        toast.success("OTP sent to " + phone);
      } else {
        toast.error("Failed to send OTP");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return toast.error("Enter valid OTP");
    setLoading(true);
    
    try {
      // 1. Login to get JWT
      const loginRes = await fetch(`${API_BASE}/v1/borrower/login`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      
      if (!loginRes.ok) throw new Error("Invalid OTP");
      const { token: jwtToken } = await loginRes.json();
      setToken(jwtToken);
      
      // 2. Fetch loans with JWT
      const res = await fetch(`${API_BASE}/v1/borrower/me/loans`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
        setAuthenticated(true);
      } else {
      toast.error("Failed to fetch account details");
      }
    } catch (err: any) {
      toast.error(err.message || "Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrepay = async (loanId: string) => {
    const amount = prompt("Enter amount to prepay (₹):");
    if (!amount) return;
    
    try {
      const res = await fetch(`${API_BASE}/v1/borrower/me/loans/${loanId}/prepay`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: Number(amount) })
      });
      
      if (res.ok) {
        toast.success("Prepayment request logged successfully. Our team will contact you.");
      } else {
        toast.error("Failed to log request");
      }
    } catch (err) {
      toast.error("Error processing request");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-10 left-10"><LogoStatic /></div>
        
        <div className="w-full max-w-md glass-panel p-10 rounded-[3rem] border border-border/60 relative z-10 shadow-2xl">
          <div className="text-center mb-10">
             <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
               <ShieldCheck size={32} />
             </div>
             <h1 className="text-3xl font-display font-black tracking-tight mb-2">Borrower Portal</h1>
             <p className="text-muted-foreground text-sm">Secure access to your loan accounts.</p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-4 font-mono focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full hero-gradient text-foreground py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-glow"
              >
                {loading ? "Sending..." : "Send Secure OTP"} <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="0000"
                  maxLength={6}
                  className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 font-mono text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-primary/50 transition-all"
                />
                <p className="text-xs text-muted-foreground text-center mt-2">Sent to {phone}</p>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full hero-gradient text-foreground py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-glow"
              >
                {loading ? "Verifying..." : "Verify & Login"} <ShieldCheck size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
         <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <LogoStatic />
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono bg-secondary px-3 py-1.5 rounded-full border border-border">{phone}</span>
              <button onClick={() => { setAuthenticated(false); setToken(null); }} className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">Logout</button>
            </div>
         </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-display font-black tracking-tight mb-2">Welcome Back</h1>
        <p className="text-muted-foreground mb-12">Manage your active loans, view schedules, and make payments.</p>

        {loans.length === 0 ? (
          <div className="glass-panel p-16 rounded-[3rem] text-center border-dashed">
             <h3 className="text-xl font-bold mb-2">No Active Loans Found</h3>
             <p className="text-muted-foreground mb-6">We couldn't find any loans associated with {phone}.</p>
             <Link to="/apply" className="inline-flex hero-gradient px-8 py-4 rounded-2xl text-foreground font-black uppercase tracking-widest text-xs">Apply for a Loan</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {loans.map((loan, i) => {
              const schedule = loan.schedule || [];
              const nextEmi = schedule.find((s: any) => s.status === 'Pending');
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={loan.id} 
                  className="glass-panel rounded-[3rem] border border-border overflow-hidden bg-card"
                >
                  <div className="p-8 border-b border-border bg-secondary/20">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded mb-3 inline-block">
                          {loan.status}
                        </span>
                        <h2 className="text-3xl font-display font-black">₹{loan.loanAmount.toLocaleString()}</h2>
                        <p className="text-sm text-muted-foreground mt-1">Personal Loan • {loan.tenor} months @ {loan.rate}%</p>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loan ID</div>
                         <div className="font-mono text-sm">{loan.id.substring(0,8)}</div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button className="flex-1 bg-background border border-border hover:border-primary/50 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all">
                        <Download size={14} /> Agreement PDF
                      </button>
                      <button className="flex-1 bg-background border border-border hover:border-primary/50 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all">
                        <Download size={14} /> NOC Letter
                      </button>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {nextEmi ? (
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
                         <div>
                           <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Next EMI Due</div>
                           <div className="text-2xl font-display font-bold">₹{nextEmi.amount.toLocaleString()}</div>
                           <div className="text-xs text-muted-foreground mt-1">Due by {new Date(nextEmi.dueDate).toLocaleDateString()}</div>
                         </div>
                         <button className="hero-gradient text-foreground px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-glow hover:scale-105 transition-all">
                           <CreditCard size={14}/> Pay Now
                         </button>
                      </div>
                    ) : (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl p-6 text-center font-bold">
                         All EMIs Paid Successfully!
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold">Repayment Schedule</h3>
                        <button onClick={() => handlePrepay(loan.id)} className="text-xs text-primary font-bold hover:underline">Request Prepayment</button>
                      </div>
                      
                      <div className="space-y-3">
                         {schedule.slice(0, 3).map((emi: any, idx: number) => (
                           <div key={idx} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-white/5">
                             <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-bold">{emi.emiNo}</div>
                               <div>
                                 <div className="font-bold text-sm">₹{emi.amount.toLocaleString()}</div>
                                 <div className="text-[10px] text-muted-foreground">{new Date(emi.dueDate).toLocaleDateString()}</div>
                               </div>
                             </div>
                             <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${emi.status === 'Paid' ? 'bg-green-500/20 text-green-500' : 'bg-foreground/10 text-muted-foreground'}`}>
                               {emi.status}
                             </div>
                           </div>
                         ))}
                         {schedule.length > 3 && (
                           <button className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                             View All {schedule.length} EMIs <ChevronRight size={14}/>
                           </button>
                         )}
                         {schedule.length === 0 && (
                           <div className="text-center text-sm text-muted-foreground py-4 italic">No schedule generated yet.</div>
                         )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
