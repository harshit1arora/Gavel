import { useState, useEffect } from "react";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion } from "framer-motion";

export default function OnboardingWizard() {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    rbiLicenseNumber: "",
    contactPerson: "",
    contactEmail: "",
  });

  useEffect(() => {
    if (!orgId) return;
    const checkSetup = async () => {
      try {
        const docRef = doc(db, "organizations", orgId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().isSetupComplete) {
          setNeedsSetup(false);
        } else {
          setNeedsSetup(true);
        }
      } catch (err) {
        console.error("Failed to check setup status", err);
      } finally {
        setLoading(false);
      }
    };
    checkSetup();
  }, [orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    try {
      const docRef = doc(db, "organizations", orgId);
      await setDoc(docRef, {
        ...form,
        createdAt: new Date().toISOString(),
        isSetupComplete: true,
      }, { merge: true });
      toast.success("Welcome to Gavel AI!");
      setNeedsSetup(false);
    } catch (err) {
      console.error("Failed to save org details", err);
      toast.error("Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !needsSetup) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-3xl p-10 max-w-2xl w-full shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Building2 size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold">Welcome to Gavel</h2>
            <p className="text-muted-foreground">Let's set up your NBFC workspace.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Company Name (NBFC) *</label>
              <input required value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none" placeholder="Acme Finance Ltd." />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">RBI License Number *</label>
              <input required value={form.rbiLicenseNumber} onChange={e => setForm({...form, rbiLicenseNumber: e.target.value})} className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none" placeholder="B-XX.XXXXX" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Primary Contact Person *</label>
              <input required value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none" placeholder="Rahul Sharma" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Contact Email *</label>
              <input required type="email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none" placeholder="rahul@acmefinance.com" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all disabled:opacity-50 mt-4">
            {saving ? 'Creating Workspace...' : 'Complete Setup →'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
