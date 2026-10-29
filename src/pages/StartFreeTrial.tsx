import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const StartFreeTrial = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    industry: "",
    useCase: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Trial signup submitted:", formData);
    alert(
      "Welcome to Gavel! Check your email for account setup instructions."
    );
    setStep(4);
  };

  const industries = [
    "NBFC",
    "Bank",
    "Fintech",
    "Lending Platform",
    "Other",
  ];

  const useCases = [
    "KYC Automation",
    "Credit Scoring",
    "Risk Assessment",
    "Loan Origination",
    "Portfolio Management",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-['DM_Sans'] font-bold text-[48px] text-foreground mb-3">
                Start Your Free Trial
              </h1>
              <p className="font-['DM_Sans'] font-normal text-[18px] text-muted-foreground">
                Get 100 free analyses to explore the power of deterministic
                underwriting.
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-12">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-['DM_Sans'] font-semibold text-[14px] ${
                      s <= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface border border-border text-muted-foreground"
                    }`}
                  >
                    {s < step ? <Check size={20} /> : s}
                  </div>
                  <span className="font-['DM_Sans'] text-[12px] text-muted-foreground uppercase">
                    {s === 1 && "Account"}
                    {s === 2 && "Company"}
                    {s === 3 && "Use Case"}
                  </span>
                  {s < 3 && (
                    <div
                      className={`w-8 h-1 -mx-2 ${
                        s < step ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {step === 4 ? (
              // Success Screen
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="font-['DM_Sans'] font-bold text-[32px] text-foreground mb-3">
                  Welcome to Gavel!
                </h2>
                <p className="font-['DM_Sans'] font-normal text-[16px] text-muted-foreground mb-8 max-w-[400px] mx-auto">
                  Check your email for setup instructions and API documentation. Your 100 free analyses are ready to use.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    to="/"
                    className="bg-primary text-primary-foreground font-['DM_Sans'] font-semibold text-[14px] px-6 py-3 rounded-lg hover:brightness-[1.08] transition-all"
                  >
                    Back to Home
                  </Link>
                  <a
                    href="/playground"
                    className="bg-surface border border-border text-foreground font-['DM_Sans'] font-semibold text-[14px] px-6 py-3 rounded-lg hover:bg-foreground/5 transition-all"
                  >
                    Try Sandbox
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Step 1: Account Details */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="font-['DM_Sans'] font-bold text-[24px] text-foreground">
                      Account Details
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-['DM_Sans'] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-['DM_Sans'] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="Enter last name"
                        />
                      </div>
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
                  </div>
                )}

                {/* Step 2: Company Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-['DM_Sans'] font-bold text-[24px] text-foreground">
                      Company Details
                    </h2>

                    <div>
                      <label className="block font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-2">
                        Company Name *
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
                      <label className="block font-['DM_Sans'] font-semibold text-[14px] text-foreground mb-3">
                        Industry *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {industries.map((ind) => (
                          <button
                            key={ind}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, industry: ind })
                            }
                            className={`px-4 py-2 rounded-lg border font-['DM_Sans'] text-[13px] transition-all ${
                              formData.industry === ind
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-surface border-border text-foreground hover:border-primary/50"
                            }`}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Use Case */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="font-['DM_Sans'] font-bold text-[24px] text-foreground">
                      What's Your Primary Use Case?
                    </h2>

                    <div className="grid gap-3">
                      {useCases.map((uc) => (
                        <button
                          key={uc}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, useCase: uc })
                          }
                          className={`p-4 rounded-lg border font-['DM_Sans'] text-[14px] text-left transition-all flex items-center justify-between ${
                            formData.useCase === uc
                              ? "bg-primary/10 border-primary text-foreground"
                              : "bg-surface border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          <span>{uc}</span>
                          {formData.useCase === uc && (
                            <Check size={20} className="text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-8 border-t border-border">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={step === 1}
                    className="px-6 py-3 rounded-lg border border-border text-foreground font-['DM_Sans'] font-semibold text-[14px] hover:bg-foreground/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="ml-auto px-6 py-3 rounded-lg bg-primary text-primary-foreground font-['DM_Sans'] font-semibold text-[14px] hover:brightness-[1.08] transition-all flex items-center gap-2"
                    >
                      Next
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="ml-auto px-6 py-3 rounded-lg bg-primary text-primary-foreground font-['DM_Sans'] font-semibold text-[14px] hover:brightness-[1.08] transition-all flex items-center gap-2"
                    >
                      Create Account
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StartFreeTrial;
