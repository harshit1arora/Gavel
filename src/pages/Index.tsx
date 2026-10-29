import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LogoTickerSection from "@/components/LogoTickerSection";
import MetricsSection from "@/components/MetricsSection";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ProductSurfacesSection from "@/components/ProductSurfacesSection";
import ComparisonSection from "@/components/ComparisonSection";
import DeveloperSection from "@/components/DeveloperSection";
import PricingSection from "@/components/PricingSection";
import ValidationSection from "@/components/WhyGavelSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import BlogSection from "@/components/BlogSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Gavel AI: Loan Approval Predictor &amp; Financial Intelligence Platform</title>
      <meta name="description" content="Check your loan approval chances instantly with Gavel AI. Our consumer-first financial intelligence platform analyzes your eligibility, EMI capacity, and matches you with top lenders." />
      <link rel="canonical" href="https://www.trygavel.com" />
    </Helmet>
    <Navbar />
    <HeroSection />
    <LogoTickerSection />
    <MetricsSection />
    <ProblemSection />
    <SolutionSection />
    <HowItWorksSection />
    <ProductSurfacesSection />
    <ComparisonSection />
    <DeveloperSection />
    <PricingSection />
    <ValidationSection />
    <FAQSection />
    <BlogSection />
    <CTASection />
    <Footer />
  </div>
);

export default Index;