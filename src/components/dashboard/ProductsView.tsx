import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Box, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiWithAuth } from "../../lib/api-client";

export default function ProductsView({ orgId }: { orgId: string | null }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!orgId) return;
    try {
      const res = await apiWithAuth('/v1/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [orgId]);

  const handleCreateDemoProduct = async () => {
    if (!orgId) return;
    try {
      const res = await apiWithAuth('/v1/products', {
        method: "POST",
        body: JSON.stringify({
          name: "Micro Finance " + Math.floor(Math.random()*1000),
          segment: "Micro",
          minAmount: 10000,
          maxAmount: 50000,
          maxTenor: 24,
          rateType: "variable",
          rate: 18,
          customFields: [
            { name: "businessRegistrationType", type: "string", required: true },
            { name: "yearsInBusiness", type: "number", required: true }
          ]
        })
      });
      if (res.ok) {
        toast.success("Product created");
        fetchProducts();
      }
    } catch (error) {
      toast.error("Error creating product");
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-border">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tighter mb-2">Product Engine</h1>
          <p className="text-muted-foreground text-sm">Define and manage loan products across segments.</p>
        </div>
        <button 
          onClick={handleCreateDemoProduct}
          className="px-8 py-4 hero-gradient text-foreground rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-glow hover:scale-[1.02] transition-all"
        >
          <Plus size={18} /> New Product
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center opacity-40">Loading...</div>
      ) : products.length === 0 ? (
        <div className="glass-panel p-12 rounded-[3rem] border-dashed flex flex-col items-center justify-center text-center opacity-40">
          <Box size={48} className="mb-6 text-primary" />
          <h3 className="text-xl font-black mb-2">No Products Configured</h3>
          <p className="text-sm max-w-sm">Create a loan product to enable origination.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {products.map((p, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={p.id}
              className="glass-panel p-8 rounded-[2.5rem] bg-card flex flex-col gap-4 border-border/60 hover:border-primary/40 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-black uppercase mb-2 inline-block">{p.segment}</span>
                  <h3 className="text-2xl font-black mb-1">{p.name}</h3>
                  <div className="text-xs text-muted-foreground font-mono">ID: {p.id}</div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-all"><Edit2 size={16}/></button>
                  <button className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 bg-secondary/20 p-4 rounded-2xl border border-border">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Limits</div>
                  <div className="text-sm font-bold font-mono mt-1">₹{p.minAmount} - ₹{p.maxAmount}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenor</div>
                  <div className="text-sm font-bold font-mono mt-1">{p.minTenor} - {p.maxTenor} months</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Interest</div>
                  <div className="text-sm font-bold font-mono mt-1">{p.rate}% {p.rateType}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</div>
                  <div className="text-sm font-bold mt-1 text-green-500">Active</div>
                </div>
              </div>

              {p.customFields && p.customFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex justify-between items-center">
                    Custom Fields (Dynamic UI)
                    <button className="text-primary hover:underline">Edit UI Schema</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.customFields.map((cf: any, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-foreground/5 text-foreground rounded text-[10px] border border-border font-mono">
                        {cf.name} <span className="opacity-50">({cf.type})</span> {cf.required && '*'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
