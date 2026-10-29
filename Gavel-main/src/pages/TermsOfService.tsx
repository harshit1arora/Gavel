import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Terms of Service: Gavel AI</title>
        <meta name="description" content="Review the Terms of Service for Gavel AI. Learn about API usage restrictions, SLA, and customer obligations." />
        <link rel="canonical" href="https://www.trygavel.com/terms-of-service" />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-32 pb-20">
        <section className="container mx-auto px-6 max-w-4xl">
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground font-mono text-sm">Effective as of: January 01, 2026</p>
          </div>

          <div className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold">
            <p className="lead text-xl text-muted-foreground mb-12">
              These Terms of Service ("Terms") govern your access to and use of the Gavel AI APIs, Dashboard, and SDKs. Please read them carefully before integrating our infrastructure.
            </p>

            <h2 className="text-2xl mt-12 mb-6 text-foreground border-b border-border/50 pb-4">1. License & Usage Restrictions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Subject to these Terms, Gavel AI grants you a limited, non-exclusive, non-transferable right to integrate the Gavel API into your software applications for the purpose of underwriting and identity verification. You shall not:
            </p>
            <ul className="list-decimal pl-6 text-muted-foreground space-y-2 mb-8 mt-4">
              <li>Reverse engineer, decompile, or attempt to extract the source code or machine learning models from the API.</li>
              <li>Resell, sublicense, or expose the Gavel API directly to any third parties without an active "White-label Enterprise" agreement.</li>
              <li>Use the API to build a competitive product.</li>
              <li>Transmit any malicious code, viruses, or actively attempt to bypass Gavel's rate limits (DoDD).</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-6 text-foreground border-b border-border/50 pb-4">2. SLA & Uptime Guarantees</h2>
            <p className="text-muted-foreground leading-relaxed">
              Gavel AI provides a **99.9% Uptime Service Level Agreement (SLA)** for all core endpoints on the `api.trygavel.com` domain for enterprise tier customers. If uptime falls below 99.9% in a given billing calendar month, you may be eligible for Service Credits proportional to the downtime.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Downtime caused by downstream third-party registries (such as UIDAI, NSDL, or specific credit bureaus going offline independently of Gavel) is explicitly excluded from the SLA calculation, though our cache layer attempts to mitigate these where legally permissible.
            </p>

            <h2 className="text-2xl mt-12 mb-6 text-foreground border-b border-border/50 pb-4">3. Customer Obligations & Compliance</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Customer represents and warrants that they operate in strict compliance with the Reserve Bank of India (RBI) guidelines and all applicable laws (DPDP Act). The Customer is solely responsible for:
            </p>
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-8 text-sm">
              <strong className="text-destructive block mb-2">Liability Warning</strong>
              <p className="text-muted-foreground">Gavel AI relies strictly on the consent assertions transmitted dynamically in your API headers. You indemnify Gavel against any regulatory penalties arising from your failure to capture explicit user consent prior to hitting our Bureau Fetch or Account Aggregator endpoints.</p>
            </div>

            <h2 className="text-2xl mt-12 mb-6 text-foreground border-b border-border/50 pb-4">4. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              While our Machine Learning models achieve industry-leading accuracy, Gavel AI provides predictive analytics, not financial guarantees. Gavel AI shall not be held liable for defaults, non-performing assets (NPAs), or credit losses incurred by your institution resulting from loans approved utilizing our algorithmic suggestions. Final credit disbursements are executed at the sole discretion of the utilizing NBFC.
            </p>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;