import Navbar from "@/components/Navbar";
import { ArrowRight, Check, X, TrendingUp, Zap, Brain } from "lucide-react";

interface ModelMetric {
  metric: string;
  gemini: string | number;
  claude: string | number;
  winner: "gemini" | "claude" | "tie";
  description: string;
}

const ModelComparison = () => {
  const metrics: ModelMetric[] = [
    {
      metric: "Price per Decision",
      gemini: "₹7.50",
      claude: "₹9.50",
      winner: "gemini",
      description: "Cost-effective underwriting at scale",
    },
    {
      metric: "Inference Speed",
      gemini: "~400ms",
      claude: "~600ms",
      winner: "gemini",
      description: "Faster API response times",
    },
    {
      metric: "Reasoning Depth",
      gemini: "Good",
      claude: "Excellent",
      winner: "claude",
      description: "Better handling of edge cases & complex logic",
    },
    {
      metric: "Explainability",
      gemini: "Adequate",
      claude: "Superior",
      winner: "claude",
      description: "Clearer reasoning for loan decisions (compliance)",
    },
    {
      metric: "Backtested Compliance (Avg)",
      gemini: "94.2%",
      claude: "96.8%",
      winner: "claude",
      description: "Match alignment with standard historical lending rules",
    },
    {
      metric: "Rule Override Rate",
      gemini: "3.8%",
      claude: "2.1%",
      winner: "claude",
      description: "Decisions requiring credit officer override",
    },
    {
      metric: "Throughput Capacity",
      gemini: "10,000 req/sec",
      claude: "5,000 req/sec",
      winner: "gemini",
      description: "Concurrent request handling",
    },
    {
      metric: "Cost per 1000 Decisions",
      gemini: "₹7,500",
      claude: "₹9,500",
      winner: "gemini",
      description: "Monthly cost for high-volume NBFCs",
    },
  ];

  const useCases = [
    {
      title: "Choose Gemini Flash when:",
      cases: [
        "High-volume lending (1000+ decisions/month)",
        "Budget-conscious early-stage NBFC",
        "Straightforward underwriting rules",
        "Low-risk borrower segments",
        "Real-time API requirements (2000+ req/day)",
      ],
      icon: Zap,
      color: "bg-blue-500/10 border-blue-500/30",
    },
    {
      title: "Choose Claude Haiku when:",
      cases: [
        "Complex lending scenarios",
        "Regulatory compliance focus (RBI audit-ready)",
        "Edge cases & unusual borrower profiles",
        "Willing to pay for higher accuracy",
        "Lower volume but higher risk tolerance",
      ],
      icon: Brain,
      color: "bg-purple-500/10 border-purple-500/30",
    },
  ];

  const recommendations = [
    {
      segment: "Micro-NBFCs",
      volume: "< 100 decisions/month",
      recommendation: "Gemini Flash",
      reason: "Cost-optimal, sufficient accuracy",
      savings: "₹200/month vs Claude",
    },
    {
      segment: "Small NBFCs",
      volume: "100-1000 decisions/month",
      recommendation: "Mixed (60% Gemini, 40% Claude)",
      reason: "Use Claude for edge cases, Gemini for standard",
      savings: "₹400-800/month",
    },
    {
      segment: "Growth NBFCs",
      volume: "1000-5000 decisions/month",
      recommendation: "Gemini Flash (Primary)",
      reason: "Volume discounts + speed is critical",
      savings: "₹10-15K/month vs all Claude",
    },
    {
      segment: "Enterprise",
      volume: "5000+ decisions/month",
      recommendation: "Custom Hybrid",
      reason: "Automatic routing based on complexity",
      savings: "Custom pricing",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <Navbar />

      {/* Header */}
      <div className="border-b border-border bg-surface/50">
        <div className="container mx-auto px-6 py-12">
          <h1 className="font-['DM_Sans'] font-bold text-4xl mb-2">Model Comparison</h1>
          <p className="font-['DM_Sans'] text-muted-foreground">
            Choose the right AI engine for your lending operations. Both models are production-ready, fully compliant, and auditable.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Quick Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-blue-400">Gemini Flash</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Fast, cost-efficient underwriting for high-volume lenders
                </p>
                <p className="text-2xl font-bold">₹7.50<span className="text-sm text-muted-foreground font-normal">/decision</span></p>
                <p className="text-xs text-blue-400 mt-2">✓ 400ms latency • ✓ 94.2% backtested accuracy</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-purple-400">Claude Haiku</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Premium reasoning for complex lending decisions
                </p>
                <p className="text-2xl font-bold">₹9.50<span className="text-sm text-muted-foreground font-normal">/decision</span></p>
                <p className="text-xs text-purple-400 mt-2">✓ 600ms latency • ✓ 96.8% backtested accuracy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-foreground/5 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Metric</th>
                  <th className="text-center p-4 font-semibold text-sm">Gemini Flash</th>
                  <th className="text-center p-4 font-semibold text-sm">Claude Haiku</th>
                  <th className="text-left p-4 font-semibold text-sm">Details</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={i} className="border-t border-border hover:bg-foreground/5 transition-colors">
                    <td className="p-4 font-semibold text-sm">{m.metric}</td>
                    <td className={`text-center p-4 text-sm ${m.winner === "gemini" ? "text-green-400 font-semibold" : ""}`}>
                      <div className="flex items-center justify-center gap-2">
                        {m.gemini}
                        {m.winner === "gemini" && <Check className="w-4 h-4 text-green-400" />}
                      </div>
                    </td>
                    <td className={`text-center p-4 text-sm ${m.winner === "claude" ? "text-green-400 font-semibold" : ""}`}>
                      <div className="flex items-center justify-center gap-2">
                        {m.claude}
                        {m.winner === "claude" && <Check className="w-4 h-4 text-green-400" />}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{m.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Use Cases */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {useCases.map((useCase, i) => {
            const Icon = useCase.icon;
            return (
              <div key={i} className={`${useCase.color} border rounded-lg p-8`}>
                <div className="flex items-start gap-3 mb-6">
                  <Icon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <h3 className="font-bold text-lg">{useCase.title}</h3>
                </div>
                <ul className="space-y-3">
                  {useCase.cases.map((caseItem, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                      <span className="text-sm text-muted-foreground">{caseItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Recommendations by NBFC Type */}
        <div className="mb-12">
          <h2 className="font-bold text-2xl mb-6">Recommendations by NBFC Size</h2>
          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-6">
                <div className="grid md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Segment</p>
                    <p className="font-bold">{rec.segment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Volume</p>
                    <p className="font-semibold text-sm">{rec.volume}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Recommended</p>
                    <p className="font-bold text-orange-500">{rec.recommendation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reason</p>
                    <p className="text-sm">{rec.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Est. Savings</p>
                    <p className="text-sm font-semibold text-green-400">{rec.savings}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/30 rounded-lg p-8">
          <h2 className="font-bold text-2xl mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                q: "Can I switch models mid-month?",
                a: "Yes! Switch anytime in your dashboard. The next decision will use your selected model. You're charged for actual usage.",
              },
              {
                q: "Which model is RBI compliant?",
                a: "Both models are fully RBI-compliant. Both generate immutable audit trails, explainable reasoning, and support regulatory reporting.",
              },
              {
                q: "Why is Claude priced higher than Gemini?",
                a: "Claude Haiku has higher per-token API costs from Anthropic compared to Google's Gemini Flash. In practice, Claude's superior reasoning edge is ideal for resolving unstructured document ambiguities, whereas Gemini Flash excels in fast, cost-efficient processing of structured rules.",
              },
              {
                q: "Can I use both models for A/B testing?",
                a: "Yes. Route a subset of applications to both models to compare performance. Dashboard shows side-by-side results.",
              },
              {
                q: "Is latency important for my use case?",
                a: "Not usually. Even at 600ms, Claude is 40x faster than manual underwriting. Use Gemini if you need sub-500ms for real-time APIs.",
              },
              {
                q: "Do you offer custom pricing for high volume?",
                a: "Yes. Contact sales for enterprise volume pricing. We can route automatically based on application complexity.",
              },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h2 className="font-bold text-2xl mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Try both models with 100 free test decisions. Switch anytime, no commitment.
          </p>
          <a
            href="/start-free-trial"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition-all"
          >
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ModelComparison;
