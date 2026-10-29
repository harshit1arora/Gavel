import { useState, useEffect } from "react";
import { Settings, Save, Building2, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function SettingsView() {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    rbiLicenseNumber: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    logoUrl: "",
    webhookUrl: "",
    webhookSecret: "",
  });

  useEffect(() => {
    if (!orgId) return;
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "organizations", orgId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setForm(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    try {
      const docRef = doc(db, "organizations", orgId);
      await setDoc(docRef, {
        ...form,
        updatedAt: new Date().toISOString(),
        isSetupComplete: true
      }, { merge: true });
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse flex items-center justify-center h-64">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-display font-bold flex items-center gap-2">
          <Settings size={28} className="text-primary" /> Organization Settings
        </h2>
        <p className="text-muted-foreground mt-1">Manage your NBFC profile and API configurations.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-foreground/5 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-primary" /> Profile Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Company Name (NBFC)</label>
              <input
                required
                value={form.companyName}
                onChange={e => setForm({...form, companyName: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none"
                placeholder="Acme Finance Ltd."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">RBI License Number</label>
              <input
                required
                value={form.rbiLicenseNumber}
                onChange={e => setForm({...form, rbiLicenseNumber: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none"
                placeholder="B-XX.XXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Primary Contact Person</label>
              <input
                required
                value={form.contactPerson}
                onChange={e => setForm({...form, contactPerson: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none"
                placeholder="Rahul Sharma"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Contact Email</label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={e => setForm({...form, contactEmail: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none"
                placeholder="rahul@acmefinance.com"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
