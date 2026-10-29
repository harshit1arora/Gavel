import { useState } from "react";
import { Code2, Terminal, Webhook, Zap } from "lucide-react";
import { FadeUp } from "./gavel/FadeUp";

const DeveloperSection = () => {
  const [activeTab, setActiveTab] = useState("node");

  const featurePills = ["REST API", "Node.js SDK", "Webhooks", "Sandbox"];
  
  const features = [
    { icon: Code2, title: "REST APIs", desc: "For KYC, scoring, and decisioning" },
    { icon: Terminal, title: "SDKs", desc: "Native libraries for Node.js & Python" },
    { icon: Webhook, title: "Real-time webhooks", desc: "For instant status updates" },
    { icon: Zap, title: "Sandbox environment", desc: "Test integrations safely" },
  ];

  const codeBlocks: Record<string, string> = {
    node: `import Gavel from '@gavel/node';

const client = new Gavel('sk_live_xxxx');

const result = await client.underwriting.analyze({
  applicant: { pan: 'ABCPK1234D' },
  bankStatement: {
    period: '6 months',
    transactions: [...]
  },
  loanRequest: { amount: 200000, tenure: 24 }
});

console.log(result.decision);     // 'APPROVE'
console.log(result.creditLimit);  // 240000
console.log(result.auditId);      // 'gavel_...'
console.log(result.reasons);      // [{ code, weight }]`,
    python: `import gavel

client = gavel.Client(api_key="sk_live_xxxx")

result = client.underwriting.analyze(
    applicant={"pan": "ABCPK1234D"},
    bank_statement={
        "period": "6 months",
        "transactions": [...]
    },
    loan_request={"amount": 200000, "tenure": 24}
)

print(result.decision)       # APPROVE
print(result.credit_limit)   # 240000
print(result.audit_id)       # gavel_...`,
    curl: `curl -X POST https://api.gavel.in/v1/underwriting/analyze  \\
  -H "Authorization: Bearer sk_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicant": { "pan": "ABCPK1234D" },
    "bank_statement": {
      "period": "6 months",
      "transactions": [...]
    },
    "loan_request": {
      "amount": 200000,
      "tenure_months": 24
    }
  }'`
  };

  const highlightCode = (code: string) => {
    return code.split('\n').map((line, i) => {
      // Very basic highlighting for the demo
      let highlighted = line
        .replace(/('.*?'|".*?")/g, '<span style="color: #00FF94">$1</span>')
        .replace(/\b(\d+)\b/g, '<span style="color: #F97316">$1</span>')
        .replace(/(\/\/.*|#.*)/g, '<span style="color: #444455">$1</span>')
        .replace(/\b(import|from|const|await|new|client|result|print|console|log|analyze|underwriting)\b/g, (match) => {
          if (['import', 'from'].includes(match)) return `<span style="color: #888899">${match}</span>`;
          return match;
        });
      
      // Specifically highlight 'APPROVE' in comments
      highlighted = highlighted.replace(/'APPROVE'/g, '<span style="color: #00FF94">\'APPROVE\'</span>');
      highlighted = highlighted.replace(/# APPROVE/g, '<span style="color: #00FF94"># APPROVE</span>');

      return <div key={i} dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />;
    });
  };

  return (
    <section className="bg-surface border-t border-border py-[100px] overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Left Column (42%) */}
          <div className="w-full lg:w-[42%]">
            <FadeUp>
              <div className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-foreground uppercase mb-3">
                BUILT FOR DEVELOPERS
              </div>
              <h2 className="font-['DM_Sans'] font-bold text-[46px] text-foreground mb-4 leading-[1.1]">
                Ship underwriting in days, not months.
              </h2>
              <p className="font-['DM_Sans'] font-normal text-[17px] leading-[1.6] text-muted-foreground">
                API-first architecture. Three lines of code to integrate. No sales call required.
              </p>
            </FadeUp>

            {/* Feature Pills */}
            <FadeUp delay={0.1}>
              <div className="flex flex-wrap gap-[10px] mt-8">
                {featurePills.map((pill) => (
                  <div 
                    key={pill}
                    className="bg-muted border border-border text-muted-foreground px-4 py-[9px] rounded-[6px] font-['DM_Sans'] text-[13px] hover:border-border hover:text-foreground transition-all duration-150 cursor-default"
                  >
                    {pill}
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Feature List */}
            <div className="mt-7">
              {features.map((f, i) => (
                <FadeUp key={i} delay={0.2 + i * 0.1}>
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 bg-[rgba(249,115,22,0.08)] border border-border rounded-[6px] flex items-center justify-center shrink-0">
                      <f.icon size={14} className="text-foreground" />
                    </div>
                    <div>
                      <h4 className="font-['DM_Sans'] font-semibold text-[14px] text-foreground">{f.title}</h4>
                      <p className="font-['DM_Sans'] text-[13px] text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>

          {/* Right Column (58%) */}
          <div className="w-full lg:w-[58%]">
            <FadeUp delay={0.1}>
              <div className="flex border-b border-border">
                {[
                  { id: 'node', label: 'Node.js' },
                  { id: 'python', label: 'Python' },
                  { id: 'curl', label: 'cURL' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-[10px] font-['DM_Sans'] text-[13px] transition-all ${
                      activeTab === tab.id 
                        ? 'text-foreground font-semibold border-b-2 border-[#F97316]' 
                        : 'text-muted-foreground font-normal hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="bg-background border border-border border-top-0 rounded-b-[8px] p-6 overflow-x-auto min-h-[400px]">
                <pre className="font-['JetBrains_Mono'] text-[13px] leading-[1.75] text-foreground">
                  {highlightCode(codeBlocks[activeTab])}
                </pre>
              </div>
            </FadeUp>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DeveloperSection;
