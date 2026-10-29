import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Privacy Policy: Gavel AI</title>
        <meta name="description" content="Read the official Privacy Policy of Gavel AI. Learn how we handle personal data and comply with DPDP Act and RBI guidelines." />
        <link rel="canonical" href="https://www.trygavel.com/privacy-policy" />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-32 pb-20">
        <section className="container mx-auto px-6 max-w-4xl">
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground font-mono text-sm">Last updated: April 14, 2026</p>
          </div>

          <div className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">
            <p className="lead text-xl text-muted-foreground mb-12">
              At Gavel AI Technologies Pvt. Ltd., we respect your privacy and are committed to protecting the personal data we process. This policy explains how we collect, use, and safeguard data in the course of providing our API infrastructure.
            </p>

            <h2 className="text-2xl mt-12 mb-6 text-foreground border-b border-border/50 pb-4">1. Data Processor Relationship</h2>
            <p className="text-muted-foreground leading-relaxed">
              In almost all instances, Gavel AI acts as a <strong>Data Processor</strong> under the Digital Personal Data Protection (DPDP) Act, 2023. We process data completely on behalf of our enterprise clients (NBFCs, Banks, FinTechs), who act as the <strong>Data Fiduciaries</strong>. The Fiduciaries are responsible for obtaining explicit, informed consent from the end-user (Data Principal) before transmitting data to the Gavel API.
            </p>

            <h2 className="text-2xl mt-12 mb-6 text-foreground border-b border-border/50 pb-4">2. Types of Data We Process</h2>
            <p className="text-muted-foreground leading-relaxed">
              When our clients invoke our API services, we may process:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
              <li><strong>Identity verified elements:</strong> Cryptographic hashes of Aadhaar, PAN numbers, Voter ID, Passport MRZs.</li>
              <li><strong>Financial telemetry:</strong> Bank statement transaction histories, Account Aggregator (AA) payloads, Bureau scores.</li>
              <li><strong>Alternative digital signals:</strong> Geolocation metadata, device identifiers (derived during Video KYC/Liveness checks).</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-6 text-foreground border-b border-border/50 pb-4">3. Data Localization & Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Gavel AI strictly conforms to RBI's data localization circulars. <strong>100% of the data processed by Gavel AI resides on servers geographically located within the Republic of India.</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We employ a strict ephemeral processing model. By default, Personally Identifiable Information (PII) is securely wiped from our hot-storage instances within 72 hours of a final underwriting decision being transmitted back via webhook, unless specific audit-logging retention relies on cryptographic hashing devoid of raw identifiers.
            </p>

            <h2 className="text-2xl mt-12 mb-6 text-foreground border-b border-border/50 pb-4">4. Third-Party Sub-processors</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may utilize specific approved subcontractors for infrastructure hosting (e.g., AWS India, GCP Mumbai) and specialized OCR fallback mechanisms. All sub-processors are bound by identical security covenants and DPDP Act compliance riders.
            </p>

            <div className="mt-16 p-8 bg-secondary/30 rounded-2xl border border-border/60">
              <h3 className="text-lg font-bold mb-2">Contact our Data Protection Officer</h3>
              <p className="text-sm text-muted-foreground mb-4">For any inquiries regarding data rights, compliance, or this policy, our DPO can be reached directly.</p>
              <a href="mailto:dpo@trygavel.com" className="font-mono text-primary hover:underline">dpo@trygavel.com</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;