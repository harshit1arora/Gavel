import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, ExternalLink, MessageCircle } from "lucide-react";
import { useState } from "react";

const ContactSales = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Thank you! Our sales team will contact you soon.");
    setFormData({ name: "", email: "", company: "", phone: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="font-['DM_Sans'] font-bold text-[52px] text-foreground mb-4">
                Contact Our Sales Team
              </h1>
              <p className="font-['DM_Sans'] font-normal text-[18px] text-muted-foreground max-w-[600px] mx-auto">
                Let's discuss how Gavel can transform your lending operations with deterministic underwriting.
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              {/* Contact Information */}
              <div>
                <h2 className="font-['DM_Sans'] font-bold text-[24px] text-foreground mb-8">
                  Get in Touch
                </h2>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Mail className="w-6 h-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h3 className="font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-1">
                        Email
                      </h3>
                      <a
                        href="mailto:sales@gavel.ai"
                        className="font-['DM_Sans'] text-[14px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        sales@gavel.ai
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Phone className="w-6 h-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h3 className="font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-1">
                        Phone
                      </h3>
                      <a
                        href="tel:+91-11-4159-8888"
                        className="font-['DM_Sans'] text-[14px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        +91-11-4159-8888
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h3 className="font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-1">
                        Address
                      </h3>
                      <p className="font-['DM_Sans'] text-[14px] text-muted-foreground">
                        New Delhi, India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-border my-8"></div>

                <div>
                  <h3 className="font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-4">
                    Follow Us
                  </h3>
                  <div className="flex gap-4">
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-all"
                    >
                      <ExternalLink className="w-5 h-5 text-muted-foreground hover:text-primary" />
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-all"
                    >
                      <MessageCircle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-['DM_Sans'] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-['DM_Sans'] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="your@company.com"
                    />
                  </div>

                  <div>
                    <label className="block font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-['DM_Sans'] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="block font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-['DM_Sans'] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="+91-XXXX-XXXX-XX"
                    />
                  </div>

                  <div>
                    <label className="block font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-['DM_Sans'] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                      placeholder="Tell us about your lending business and requirements"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-['DM_Sans'] font-semibold text-[14px] px-6 py-3 rounded-lg hover:brightness-[1.08] transition-all duration-200 shadow-md shadow-primary/20"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-surface border border-border rounded-lg p-12">
              <h2 className="font-['DM_Sans'] font-bold text-[28px] text-foreground mb-8">
                Enterprise Solutions
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-2">
                    Custom Deployment
                  </h3>
                  <p className="font-['DM_Sans'] text-[14px] text-muted-foreground">
                    On-premise deployment options available for large-scale operations requiring full data residency.
                  </p>
                </div>
                <div>
                  <h3 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-2">
                    Dedicated Support
                  </h3>
                  <p className="font-['DM_Sans'] text-[14px] text-muted-foreground">
                    24/7 phone and Slack support with a dedicated account manager for your team.
                  </p>
                </div>
                <div>
                  <h3 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-2">
                    SLA Guarantee
                  </h3>
                  <p className="font-['DM_Sans'] text-[14px] text-muted-foreground">
                    99.9% uptime SLA with guaranteed response times and priority issue resolution.
                  </p>
                </div>
                <div>
                  <h3 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-2">
                    Custom Rules
                  </h3>
                  <p className="font-['DM_Sans'] text-[14px] text-muted-foreground">
                    Build custom underwriting rules tailored to your specific lending requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactSales;
