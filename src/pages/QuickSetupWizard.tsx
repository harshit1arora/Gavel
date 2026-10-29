import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Check, ArrowRight, Building2, Zap, BarChart3, Settings, Code } from "lucide-react";
import { toast } from "sonner";

interface SetupStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  action: () => void;
}

export default function QuickSetupWizard() {
  const navigate = useNavigate();
  const { user, orgId } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: 1,
      title: "Create Your Organization",
      description: "Set up your lending company profile and basic information",
      icon: Building2,
      completed: Boolean(orgId),
      action: () => {
        toast.success("Organization already created!");
        setSetupSteps((prev) =>
          prev.map((s) => (s.id === 1 ? { ...s, completed: true } : s))
        );
        setCurrentStep(1);
      },
    },
    {
      id: 2,
      title: "Configure Your First Loan Product",
      description: "Define loan types, interest rates, and eligibility criteria",
      icon: Zap,
      completed: false,
      action: () => {
        navigate("/console?view=products");
        toast.success("Redirecting to product configuration...");
      },
    },
    {
      id: 3,
      title: "Generate API Keys",
      description: "Create sandbox and live API keys for integration",
      icon: Code,
      completed: false,
      action: () => {
        navigate("/console?view=tokens");
        toast.success("Redirecting to API token management...");
      },
    },
    {
      id: 4,
      title: "Test Your First Underwriting Decision",
      description: "Submit a test application to verify API integration",
      icon: Zap,
      completed: false,
      action: () => {
        navigate("/playground");
        toast.success("Redirecting to API playground...");
      },
    },
    {
      id: 5,
      title: "View Your Metrics Dashboard",
      description: "Monitor underwriting performance and ROI",
      icon: BarChart3,
      completed: false,
      action: () => {
        navigate("/metrics-roi");
        toast.success("Redirecting to metrics dashboard...");
      },
    },
    {
      id: 6,
      title: "Set Up Webhooks",
      description: "Configure real-time notifications for loan decisions",
      icon: Settings,
      completed: false,
      action: () => {
        navigate("/console?view=webhooks");
        toast.success("Redirecting to webhook configuration...");
      },
    },
  ]);

  const handleCompleteStep = (stepId: number) => {
    const step = setupSteps.find((s) => s.id === stepId);
    if (step) {
      step.action();
      setSetupSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, completed: true } : s))
      );
    }
  };

  const completedCount = setupSteps.filter((s) => s.completed).length;
  const progressPercentage = (completedCount / setupSteps.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <Navbar />

      {/* Header */}
      <div className="border-b border-border bg-surface/50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-['DM_Sans'] font-bold text-4xl mb-2">
                Welcome, {user?.displayName || "Lender"}! 👋
              </h1>
              <p className="font-['DM_Sans'] text-muted-foreground">
                Let's get your NBFC up and running in under 15 minutes
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Setup Progress</p>
              <p className="text-3xl font-bold text-orange-500">{completedCount}/6</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Timeline */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Steps */}
          <div className="space-y-4">
            {setupSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isPassed = index < currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setCurrentStep(index);
                    if (step.completed) handleCompleteStep(step.id);
                  }}
                  className={`w-full text-left p-6 rounded-lg border transition-all group ${
                    isActive
                      ? "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20"
                      : step.completed
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border bg-surface hover:bg-foreground/5"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Step Number */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-orange-500 text-white"
                          : "bg-border text-muted-foreground"
                      }`}
                    >
                      {step.completed ? <Check className="w-5 h-5" /> : step.id}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-lg mb-1 ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>

                      {/* CTA Button */}
                      {!step.completed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteStep(step.id);
                          }}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-all"
                        >
                          {step.id === 1 ? "Verify" : step.id === 2 ? "Configure" : "Go"} <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Details Panel */}
          <div className="lg:sticky lg:top-20 h-fit">
            <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/30 rounded-lg p-8">
              <h2 className="font-bold text-2xl mb-6">Current Step</h2>

              {setupSteps[currentStep] && (
                <>
                  <div className="mb-6">
                    {(() => {
                      const Icon = setupSteps[currentStep].icon;
                      return (
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                      );
                    })()}
                    <h3 className="font-bold text-xl mb-2">{setupSteps[currentStep].title}</h3>
                    <p className="text-muted-foreground mb-6">
                      {setupSteps[currentStep].description}
                    </p>
                  </div>

                  {/* Step-specific Info */}
                  {currentStep === 0 && (
                    <div className="bg-surface border border-border rounded-lg p-4 space-y-3 mb-6">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Organization ID</p>
                        <code className="font-mono text-sm bg-foreground/5 px-2 py-1 rounded">{orgId}</code>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Admin Email</p>
                        <p className="text-sm">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Status</p>
                        <p className="text-sm text-green-500 font-semibold">✓ Active</p>
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="bg-surface border border-border rounded-lg p-4 space-y-3 mb-6">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">Define loan parameters</p>
                          <p className="text-xs text-muted-foreground">Tenure, interest rates, eligibility criteria</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">Set risk policies</p>
                          <p className="text-xs text-muted-foreground">Auto-approve, auto-reject rules</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">Test with sample data</p>
                          <p className="text-xs text-muted-foreground">Validate rules work as expected</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="bg-surface border border-border rounded-lg p-4 space-y-3 mb-6">
                      <p className="text-sm text-muted-foreground mb-3">Your API keys will be:</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Rate-limited per plan</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Regenerable for security</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Monitored in real-time</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="bg-surface border border-border rounded-lg p-4 mb-6">
                      <p className="text-sm text-muted-foreground mb-3">Test with this sample applicant:</p>
                      <code className="font-mono text-xs bg-foreground/5 px-2 py-1 rounded block mb-2 text-wrap">
                        {`"pan": "ABCPK1234D", "income": ₹75,000/month`}
                      </code>
                      <p className="text-xs text-muted-foreground">
                        This will trigger your first underwriting decision and verify your integration.
                      </p>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="bg-surface border border-border rounded-lg p-4 space-y-2 mb-6">
                      <p className="text-sm text-muted-foreground">Track metrics like:</p>
                      <ul className="space-y-1">
                        <li className="text-sm">• Approval rate trends</li>
                        <li className="text-sm">• Cost per decision</li>
                        <li className="text-sm">• Processing time</li>
                        <li className="text-sm">• Monthly spend & projections</li>
                      </ul>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="bg-surface border border-border rounded-lg p-4 space-y-3 mb-6">
                      <p className="text-sm text-muted-foreground">Webhooks enable real-time:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Loan decision notifications</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Payment status updates</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Risk alerts</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {!setupSteps[currentStep].completed && (
                    <button
                      onClick={() => handleCompleteStep(setupSteps[currentStep].id)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Help Card */}
            <div className="mt-6 bg-surface border border-border rounded-lg p-6">
              <h3 className="font-bold mb-3">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our setup wizard is designed to get you running in minutes. If you get stuck:
              </p>
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-primary hover:underline">
                  → Read the setup guide
                </button>
                <button className="w-full text-left text-sm text-primary hover:underline">
                  → Watch video tutorials
                </button>
                <button className="w-full text-left text-sm text-primary hover:underline">
                  → Chat with our team
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
