import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { ArrowRight, Briefcase, Heart, Cpu, MapPin } from "lucide-react";

const Careers = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-20">
        
        {/* Hero */}
        <section className="container mx-auto px-6 mb-24 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <Briefcase size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary">We're Hiring</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
            Build the brain of Indian lending
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Join a small, high-density talent pool of engineers, data scientists, and risk experts tackling some of the hardest algorithmic scale problems in fin-tech.
          </p>
        </section>

        {/* Benefits */}
        <section className="container mx-auto px-6 mb-24 max-w-5xl">
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="p-6 bg-secondary/30 rounded-2xl border border-border/50 text-center">
               <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-4"><Heart className="text-primary" /></div>
               <h3 className="font-bold text-lg mb-2">Comprehensive Health</h3>
               <p className="text-sm text-muted-foreground">Top-tier health, dental, and vision coverage for you and dependents.</p>
            </div>
            <div className="p-6 bg-secondary/30 rounded-2xl border border-border/50 text-center">
               <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-4"><MapPin className="text-primary" /></div>
               <h3 className="font-bold text-lg mb-2">Remote-First Culture</h3>
               <p className="text-sm text-muted-foreground">Work from anywhere in India, or join us at our HQ in Gurugram.</p>
            </div>
            <div className="p-6 bg-secondary/30 rounded-2xl border border-border/50 text-center">
               <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-4"><Cpu className="text-primary" /></div>
               <h3 className="font-bold text-lg mb-2">Latest Gear</h3>
               <p className="text-sm text-muted-foreground">Top-spec Apple Silicon MacBooks and a generous home office stipend.</p>
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="container mx-auto px-6 mb-24 max-w-4xl">
          <h2 className="text-3xl font-display font-bold mb-8">Open Positions</h2>
          
          <div className="p-12 border border-border/60 bg-card rounded-2xl text-center">
            <h3 className="text-xl font-bold text-foreground mb-3">No Current Openings</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              We aren't actively hiring for any specific roles at the moment. Check back later for updates as we continue to grow our team!
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Careers;