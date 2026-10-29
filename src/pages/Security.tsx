import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { ShieldCheck, FileKey, Database, Server, Key, LockKeyhole } from "lucide-react";

const Security = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-20">
        
        {/* Header */}
        <section className="container mx-auto px-6 mb-20 text-center max-w-4xl">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
            Institutional-Grade Security
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We operate at the core of the financial system, processing highly sensitive PII and financial records. Our infrastructure is designed from the silicon up to exceed stringent RBI InfoSec mandates.
          </p>
        </section>

        {/* Certifications Grid */}
        <section className="container mx-auto px-6 mb-24">
          <h2 className="text-2xl font-display font-bold mb-8 text-center">Compliance & Certifications</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-8 bg-secondary/20 border border-border/50 rounded-2xl text-center hover:border-primary/50 transition">
              <div className="text-5xl mb-4 font-mono font-bold text-transparent bg-clip-text bg-gradient-to-br from-gray-200 to-gray-500">SOC 2</div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Type II Certified</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Independently audited for Security, Availability, and Confidentiality trust service criteria over a 12-month observation period.</p>
            </div>
            <div className="p-8 bg-secondary/20 border border-border/50 rounded-2xl text-center hover:border-primary/50 transition">
              <div className="text-5xl mb-4 font-mono font-bold text-transparent bg-clip-text bg-gradient-to-br from-gray-200 to-gray-500">ISO</div>
              <h3 className="font-bold text-lg mb-2 text-foreground">27001:2022</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Rigorous Information Security Management System (ISMS) implementation governing all internal employee access and asset management.</p>
            </div>
            <div className="p-8 bg-secondary/20 border border-border/50 rounded-2xl text-center hover:border-primary/50 transition">
              <div className="text-5xl mb-4 font-mono font-bold text-transparent bg-clip-text bg-gradient-to-br from-gray-200 to-gray-500">RBI</div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Localization</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Strict adherence to RBI data localization circulars. No request payload or response telemetry ever leaves Indian sovereign borders.</p>
            </div>
          </div>
        </section>

        {/* Deep Dive Pillars */}
        <section className="container mx-auto px-6 mb-24 max-w-5xl">
          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-6 p-8 border border-border/60 rounded-3xl bg-card">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl shrink-0 flex flex-col items-center justify-center">
                <LockKeyhole className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Encryption Architecture</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Data in transit is secured via strict TLS 1.3, dropping support for legacy cipher suites. Data at rest is encrypted via AES-256 Block-Level encryption. We utilize AWS KMS backed by FIPS 140-2 Level 3 HSMs for cryptographic key lifecycle management.
                </p>
                <div className="flex gap-3 mt-4">
                  <span className="px-3 py-1 bg-secondary text-xs font-mono rounded text-muted-foreground">TLS 1.3</span>
                  <span className="px-3 py-1 bg-secondary text-xs font-mono rounded text-muted-foreground">AES-256</span>
                  <span className="px-3 py-1 bg-secondary text-xs font-mono rounded text-muted-foreground">FIPS 140-2</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 p-8 border border-border/60 rounded-3xl bg-card">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl shrink-0 flex flex-col items-center justify-center">
                <Server className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Ephemeral Processing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We deploy an ephemeral microservices architecture. Webhook payloads containing PII are processed in memory and immediately flushed post-transmission. Long-term analytics data used for model tuning undergoes immediate one-way cryptographic hashing (salt + SHA-256).
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 p-8 border border-border/60 rounded-3xl bg-card">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl shrink-0 flex flex-col items-center justify-center">
                <FileKey className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Penetration Testing & Bug Bounty</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Gavel undergoes continuous external penetration testing by accredited CERT-In empaneled security firms. We also operate a private Bug Bounty program on HackerOne for continuous vulnerability disclosure.
                </p>
                <a href="mailto:security@gavel.ai" className="inline-block mt-4 text-sm font-semibold text-primary hover:underline">Report a vulnerability &rarr;</a>
              </div>
            </div>

          </div>
        </section>

      </main>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Security;