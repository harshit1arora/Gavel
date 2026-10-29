import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Building } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Contact Gavel AI: Get in Touch</title>
        <meta name="description" content="Get in touch with Gavel AI. Reach out for partnerships, support, or general inquiries." />
        <link rel="canonical" href="https://www.trygavel.com/contact" />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-32 pb-20">

        <section className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground">
              Whether you're looking for a custom enterprise deployment or need technical support, our team is ready to help integrate Gavel into your pipeline.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-12 lg:gap-24">

            {/* Form Section */}
            <div className="lg:col-span-3">
              <div className="bg-card border border-border/60 p-8 rounded-3xl shadow-soft">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">First Name</label>
                      <input type="text" className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Ravi" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Last Name</label>
                      <input type="text" className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Kumar" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Work Email</label>
                    <input type="email" className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="name@company.com" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Company</label>
                    <input type="text" className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Acme Finance Ltd." />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Monthly Application Volume</label>
                    <select className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer">
                      <option>&lt; 10,000</option>
                      <option>10,000 - 50,000</option>
                      <option>50,000 - 100,000</option>
                      <option>100,000+</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">How can we help?</label>
                    <textarea rows={4} className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" placeholder="Tell us about your lending use-case and what you're looking to automate..."></textarea>
                  </div>

                  <button type="button" className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity">
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* Direct Contact & Offices */}
            <div className="lg:col-span-2 space-y-12 flex flex-col justify-center">

              <div>
                <h3 className="text-2xl font-display font-bold mb-6">Direct Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center border border-border/50 group-hover:border-primary/50 transition-colors">
                      <Mail className="text-foreground" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">General Enquiries</p>
                      <p className="font-semibold text-foreground">hello@trygavel.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center border border-border/50 group-hover:border-primary/50 transition-colors">
                      <Phone className="text-foreground" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sales Priority Line</p>
                      <p className="font-semibold text-foreground">+91 80 1234 5678</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-display font-bold mb-6">Offices</h3>
                <div className="space-y-6">
                  <div className="relative p-6 border border-border/50 bg-secondary/10 rounded-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Building size={64} /></div>
                    <div className="flex items-start gap-3 relative z-10">
                      <MapPin className="text-primary mt-1 shrink-0" size={20} />
                      <div>
                        <h4 className="font-bold text-foreground mb-1 text-lg">Gurugram (HQ)</h4>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                          Cyber City, DLF Phase 2<br/>
                          Sector 24<br/>
                          Gurugram 122002<br/>
                          Haryana, India
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Contact;