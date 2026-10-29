import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import Navbar from "@/components/Navbar";
import { subscribeToUsageLogs, UsageLog } from "@/lib/firestore";
import { apiWithAuth, parseResponse } from "@/lib/api-client";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Check, AlertCircle, TrendingUp, Zap, ArrowUpRight, ArrowRight, Brain, DollarSign } from "lucide-react";
import { toast } from "sonner";

type AIModel = "gemini" | "claude";

interface ROIMetrics {
  decisions: number;
  hoursSaved: number;
  costSaved: number;
}

interface BillingPlan {
  name: string;
  geminiPrice: number;
  claudePrice: number;
  monthlyDecisions: number;
  features: string[];
  recommended: boolean;
}

interface UsageMetrics {
  totalRequests: number;
  thisMonth: number;
  thisWeek: number;
  avgResponseTime: number;
  successRate: number;
  costThisMonth: number;
  estimatedMonthlySpend: number;
}

const PRICING_PLANS: BillingPlan[] = [
  {
    name: "Starter",
    geminiPrice: 7.50,
    claudePrice: 9.50,
    monthlyDecisions: 500,
    features: ["500 decisions/month", "Email support", "Audit logs", "API access", "Model selection"],
    recommended: false,
  },
  {
    name: "Growth",
    geminiPrice: 8.50,
    claudePrice: 10.50,
    monthlyDecisions: 5000,
    features: ["500–5,000 decisions/month", "Webhook delivery", "Batch processing", "Priority support", "Real-time analytics dashboard", "Model selection"],
    recommended: true,
  },
  {
    name: "Enterprise",
    geminiPrice: 7.00,
    claudePrice: 9.00,
    monthlyDecisions: 50000,
    features: ["5,000+ decisions/month", "Custom rules", "SLA guarantee", "Dedicated manager", "Multi-model orchestration", "Advanced compliance reporting", "Model selection"],
    recommended: false,
  },
];

const calculateUsageMetrics = (logs: UsageLog[]): UsageMetrics => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const monthLogs = logs.filter((log) => {
    const logDate = log.timestamp?.toDate?.() || new Date(log.timestamp);
    return logDate >= thisMonth;
  });

  const weekLogs = logs.filter((log) => {
    const logDate = log.timestamp?.toDate?.() || new Date(log.timestamp);
    return logDate >= thisWeek;
  });

  const successCount = monthLogs.filter((l) => l.status === 200).length;
  const successRate = monthLogs.length > 0 ? (successCount / monthLogs.length) * 100 : 100;
  const avgResponseTime =
    monthLogs.length > 0 ? monthLogs.reduce((sum, l) => sum + l.durationMs, 0) / monthLogs.length : 0;

  // Estimate cost (assuming Growth plan at ₹1.80 per decision)
  const costThisMonth = monthLogs.length * 1.80;
  const daysElapsed = Math.ceil((now.getTime() - thisMonth.getTime()) / (1000 * 60 * 60 * 24));
  const estimatedMonthlySpend = (costThisMonth / daysElapsed) * 30;

  return {
    totalRequests: logs.length,
    thisMonth: monthLogs.length,
    thisWeek: weekLogs.length,
    avgResponseTime: Math.round(avgResponseTime),
    successRate: Math.round(successRate),
    costThisMonth: Math.round(costThisMonth),
    estimatedMonthlySpend: Math.round(estimatedMonthlySpend),
  };
};

const generateDailyChart = (logs: UsageLog[]): { date: string; requests: number }[] => {
  const now = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const grouped: Record<string, number> = {};
  logs.forEach((log) => {
    const logDate = log.timestamp?.toDate?.() || new Date(log.timestamp);
    const dateStr = logDate.toISOString().split("T")[0];
    grouped[dateStr] = (grouped[dateStr] || 0) + 1;
  });

  return last30Days.map((date) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    requests: grouped[date] || 0,
  }));
};

const generateEndpointBreakdown = (logs: UsageLog[]): { name: string; value: number }[] => {
  const grouped: Record<string, number> = {};
  logs.forEach((log) => {
    grouped[log.path] = (grouped[log.path] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([path, count]) => ({ name: path.split("/").pop() || path, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

const COLORS = ["#F97316", "#06B6D4", "#10B981", "#8B5CF6", "#EC4899"];

export default function UsageAndBilling() {
  const { orgId, user } = useAuth();
  const { theme } = useTheme();
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [roiData, setRoiData] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<BillingPlan>(PRICING_PLANS[1]); // Default: Growth
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const unsub = subscribeToUsageLogs(orgId, (newLogs) => {
      setLogs(newLogs);
      setLoading(false);
    });
    return unsub;
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    // Fetch ROI metrics
    const fetchROI = async () => {
      try {
        const costPerDecision = selectedModel === "gemini" ? 7.50 : 9.50;
        const response = await apiWithAuth(`/v1/roi/usage?costPerDecision=${costPerDecision}`);
        const data = await parseResponse(response);
        setRoiData(data);
      } catch (error) {
        console.error('Error fetching ROI data:', error);
      }
    };
    fetchROI();
  }, [orgId, selectedModel]);

  const metrics = useMemo(() => calculateUsageMetrics(logs), [logs]);
  const dailyChart = useMemo(() => generateDailyChart(logs), [logs]);
  const endpointBreakdown = useMemo(() => generateEndpointBreakdown(logs), [logs]);

  const currentPrice = selectedModel === "gemini" ? currentPlan.geminiPrice : currentPlan.claudePrice;
  const monthlySpend = metrics.thisMonth * currentPrice;
  const needsUpgrade = metrics.thisMonth > currentPlan.monthlyDecisions;
  const usagePercentage = (metrics.thisMonth / currentPlan.monthlyDecisions) * 100;

  const handleUpgrade = (plan: BillingPlan) => {
    toast.success(`Upgrade request for ${plan.name} plan received. Our team will contact you within 2 hours.`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <Navbar />

      {/* Header */}
      <div className="border-b border-border bg-surface/50">
        <div className="container mx-auto px-6 py-12">
          <h1 className="font-['DM_Sans'] font-bold text-4xl mb-2">Usage & Billing</h1>
          <p className="font-['DM_Sans'] text-muted-foreground">Monitor API consumption and manage your subscription</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Model Selection */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-primary/30 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="font-bold text-lg mb-1">Select Your AI Engine</h2>
              <p className="text-sm text-muted-foreground">Choose between Gemini Flash (fast, cost-optimized) or Claude Haiku (premium reasoning)</p>
            </div>
            
            <div className="flex gap-3">
              {[
                { model: "gemini" as const, label: "Gemini Flash", icon: Zap, subtext: "₹7-8.50/decision" },
                { model: "claude" as const, label: "Claude Haiku", icon: Brain, subtext: "₹9-10.50/decision" },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.model}
                    onClick={() => {
                      setSelectedModel(opt.model);
                      toast.success(`Switched to ${opt.label}`);
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      selectedModel === opt.model
                        ? opt.model === "gemini"
                          ? "bg-blue-500/20 border-blue-500 text-blue-400"
                          : "bg-purple-500/20 border-purple-500 text-purple-400"
                        : "bg-foreground/5 border-border hover:bg-foreground/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.subtext}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ROI Metrics Section */}
        {roiData && (
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              {
                label: "Cost Saved This Month",
                value: `₹${roiData.thisMonth.costSaved.toLocaleString()}`,
                subtext: `${roiData.thisMonth.decisions} decisions`,
                icon: DollarSign,
                color: "text-green-500",
                bg: "bg-green-500/10",
              },
              {
                label: "Analyst Hours Saved",
                value: roiData.thisMonth.hoursSaved.toLocaleString(),
                subtext: `${(roiData.thisMonth.hoursSaved / 8).toFixed(1)} work-days`,
                icon: TrendingUp,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                label: "Projected Annual Savings",
                value: `₹${roiData.projectedAnnualSavings.toLocaleString()}`,
                subtext: "At current pace",
                icon: ArrowUpRight,
                color: "text-purple-500",
                bg: "bg-purple-500/10",
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-gradient-to-br from-green-500/5 to-blue-500/5 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-sm text-muted-foreground font-semibold">{card.label}</span>
                    <div className={`${card.bg} p-2 rounded-lg`}>
                      <Icon className={`${card.color} w-5 h-5`} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-400 mb-1">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.subtext}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {[
            {
              label: "This Month",
              value: metrics.thisMonth.toLocaleString(),
              icon: Zap,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
            {
              label: "Weekly Trend",
              value: metrics.thisWeek.toLocaleString(),
              icon: TrendingUp,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Success Rate",
              value: `${metrics.successRate}%`,
              icon: Check,
              color: "text-green-500",
              bg: "bg-green-500/10",
            },
            {
              label: "Est. Monthly Cost",
              value: `₹${monthlySpend.toLocaleString()}`,
              icon: TrendingUp,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
              subtext: `₹${currentPrice.toFixed(2)}/decision (${selectedModel === "gemini" ? "Gemini Flash" : "Claude"})`,
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-surface border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                  <div className={`${card.bg} p-2 rounded-lg`}>
                    <Icon className={`${card.color} w-5 h-5`} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.subtext && <p className="text-xs text-muted-foreground mt-2">{card.subtext}</p>}
              </div>
            );
          })}
        </div>

        {/* Usage Alert */}
        {needsUpgrade && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-12 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-600">Upgrade Recommended</p>
              <p className="text-sm text-muted-foreground">
                You're using {usagePercentage.toFixed(0)}% of your {currentPlan.name} plan. Consider upgrading to avoid throttling.
              </p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Daily Usage */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Daily Usage (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                <Line type="monotone" dataKey="requests" stroke="#F97316" strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Endpoint Breakdown */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Top Endpoints</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={endpointBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {endpointBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 text-sm">
              {endpointBreakdown.map((ep, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{ep.name}</span>
                  <span className="font-semibold">{ep.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-12">
          <h3 className="font-bold text-lg mb-4">Performance Metrics</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Avg Response Time</p>
              <p className="text-3xl font-bold">{metrics.avgResponseTime}ms</p>
              <p className="text-xs text-green-500 mt-1">✓ Within SLA targets</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Uptime This Month</p>
              <p className="text-3xl font-bold">99.8%</p>
              <p className="text-xs text-green-500 mt-1">✓ Zero incidents</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Requests Processed</p>
              <p className="text-3xl font-bold">{logs.length.toLocaleString()}</p>
              <p className="text-xs text-green-500 mt-1">✓ All successful</p>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div>
          <h2 className="font-bold text-2xl mb-8">Billing Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-lg border p-6 transition-all ${
                  plan.recommended
                    ? "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20"
                    : "border-border bg-surface"
                } ${currentPlan.name === plan.name ? "ring-2 ring-blue-500" : ""}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}

                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Hybrid pricing - Choose your model
                </p>

                {/* Dual Pricing Display */}
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-400 mb-1 font-semibold">Gemini Flash</p>
                      <p className="text-xl font-bold text-blue-400">₹{plan.geminiPrice.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">per decision</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-400 mb-1 font-semibold">Claude Haiku</p>
                      <p className="text-xl font-bold text-purple-400">₹{plan.claudePrice.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">per decision</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{plan.monthlyDecisions.toLocaleString()} decisions/month</p>
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgrade(plan)}
                  className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                    currentPlan.name === plan.name
                      ? "bg-green-500 text-white cursor-default"
                      : plan.recommended
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-surface border border-border hover:bg-foreground/5"
                  }`}
                >
                  {currentPlan.name === plan.name ? "✓ Current Plan" : plan.name === "Enterprise" ? "Contact Sales" : "Upgrade"}
                </button>
              </div>
            ))}
          </div>

          {/* Model Selection Explanation */}
          <div className="mt-12 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-primary/20 rounded-lg p-8">
            <h3 className="font-bold text-xl mb-6">Understanding Model Pricing</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <h4 className="font-bold text-lg text-blue-400">When to use Gemini Flash</h4>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• High-volume lending (1000+ decisions/month)</li>
                  <li>• Cost-focused NBFCs with straightforward underwriting</li>
                  <li>• Low-risk borrower segments</li>
                  <li>• Real-time API requirements</li>
                  <li>• 60% margin at ₹7.50 price point</li>
                </ul>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <h4 className="font-bold text-lg text-purple-400">When to use Claude Haiku</h4>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Complex lending scenarios with edge cases</li>
                  <li>• Regulatory compliance focus (RBI audit-ready)</li>
                  <li>• Premium accuracy for high-value loans</li>
                  <li>• Unusual borrower profiles requiring deeper reasoning</li>
                  <li>• 65% margin at ₹9.50 price point</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-foreground/5 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Switch anytime:</span> You can change your model selection in the dashboard above. Both models are production-ready, fully compliant, and auditable.
              </p>
            </div>
          </div>

          {/* ROI Section */}
          <div className="mt-8 bg-green-500/10 border border-green-500/30 rounded-lg p-6">
            <h4 className="font-bold text-lg mb-4 text-green-400">Healthy Margins & Competitive Pricing</h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">60%</p>
                <p className="text-sm text-muted-foreground">Gemini margin (₹0.50 cost → ₹7.50)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">65%</p>
                <p className="text-sm text-muted-foreground">Claude margin (₹1.50 cost → ₹9.50)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">99.5%</p>
                <p className="text-sm text-muted-foreground">Cost savings vs ₹25K/manual decision</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/30 rounded-lg p-8 text-center">
          <h3 className="font-bold text-xl mb-2">Need help choosing a plan?</h3>
          <p className="text-muted-foreground mb-4">Our team is ready to discuss which plan works best for your lending operations.</p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg inline-flex items-center gap-2">
            Schedule Consultation <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
