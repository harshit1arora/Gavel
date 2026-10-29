import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Target, Globe, Award } from "lucide-react";
import { Helmet } from "react-helmet-async";

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>About Gavel AI: Our Mission and Vision</title>
        <meta name="description" content="Discover the mission, values, and team behind Gavel AI, a consumer-first AI financial intelligence platform." />
        <link rel="canonical" href="https://www.trygavel.com/about" />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-32 pb-20">

        {/* Hero */}
        <section className="container mx-auto px-6 mb-24 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-8">
            Rebuilding the foundation of <span className="text-gradient">Indian credit</span>.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Credit is the engine of economic growth. Yet, for millions of Indians and thousands of small businesses, accessing fair credit is still hindered by outdated infrastructure, manual processes, and fragmented data. We're changing that.
          </p>
        </section>

        {/* Our Values */}
        <section className="container mx-auto px-6 mt-12 mb-24 max-w-5xl">
          <h2 className="text-3xl font-display font-bold mb-12 text-center text-foreground">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Target, title: "Speed as a Feature", desc: "We believe latency is the enemy of conversion. Our infrastructure is engineered to deliver deep financial analysis and deterministic credit decisions in milliseconds." },
              { icon: Globe, title: "Deterministic by Design", desc: "We reject opaque, black-box AI for underwriting. Our decision engine ensures every outcome is fully explainable, transparent, and audit-ready for regulatory compliance." },
              { icon: Users, title: "Lender-Centric Infrastructure", desc: "We are a technology partner, not a competitor. We arm NBFCs and banks with cutting-edge tools to aggressively win their markets without building teams from scratch." },
              { icon: Award, title: "Uncompromising Security", desc: "We treat financial data with bank-grade encryption. Information privacy and strict adherence to RBI DPDP guidelines form the absolute bedrock of our systems." }
            ].map((v, i) => (
              <div key={i} className="flex gap-6 p-6 border border-border/50 bg-secondary/10 hover:border-primary/30 hover:bg-primary/5 rounded-2xl transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <v.icon className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{v.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default About;