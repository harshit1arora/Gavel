import React from 'react';
import { Shield, FileText, CheckCircle, AlertCircle, Building2, Scale, Eye, Lock } from 'lucide-react';

const RBICompliancePage = () => {
  const regulations = [
    { name: 'RBI Master Direction on Digital Lending', status: 'compliant', description: 'Our AI underwriting follows all RBI guidelines for digital lending platforms.' },
    { name: 'Lending without underlying loan license', status: 'compliant', description: 'We are a technology provider, not a lender. NBFC partners hold all necessary licenses.' },
    { name: 'Data localization (RBI Guidelines)', status: 'compliant', description: 'All customer data stored in India on AWS Mumbai servers.' },
    { name: 'KYC/AML Compliance', status: 'compliant', description: 'Integrated UIDAI verification for Aadhaar-based KYC.' },
    { name: 'Fair Practices Code', status: 'compliant', description: 'All AI decisions include human override capability.' },
    { name: 'Interest Rate Transparency', status: 'compliant', description: 'Full disclosure of all fees and charges in loan agreements.' },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(0,255,148,0.1)] mb-4">
            <Shield size={32} className="text-[#00FF94]" />
          </div>
          <h1 className="font-['DM_Sans'] text-4xl font-bold text-foreground mb-2">RBI Compliance</h1>
          <p className="font-['DM_Sans'] text-lg text-foreground/60">Built for Indian NBFC regulations</p>
        </div>

        <div className="bg-[rgba(0,255,148,0.05)] border border-[rgba(0,255,148,0.2)] rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-[#00FF94]" />
            <div>
              <p className="font-['DM_Sans'] text-lg font-semibold text-foreground">100% Compliant</p>
              <p className="font-['DM_Sans'] text-sm text-foreground/60">All regulatory requirements met</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="font-['DM_Sans'] text-xl font-bold text-foreground">Regulatory Framework</h2>
          {regulations.map((reg, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-['DM_Sans'] text-sm font-semibold text-foreground">{reg.name}</span>
                    <span className="bg-[rgba(0,255,148,0.1)] text-[#00FF94] font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded">
                      {reg.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-['DM_Sans'] text-sm text-foreground/60">{reg.description}</p>
                </div>
                <CheckCircle size={20} className="text-[#00FF94]" />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="font-['DM_Sans'] text-lg font-bold text-foreground mb-4">AI + Human Oversight</h2>
          <p className="font-['DM_Sans'] text-sm text-foreground/70 mb-4">
            Our architecture ensures AI never makes the final decision. All AI recommendations are reviewed by human credit officers before any loan is approved.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded">
              <p className="font-['JetBrains_Mono'] text-2xl text-[#F97316]">AI</p>
              <p className="font-['DM_Sans'] text-xs text-foreground/50">Analyzes & Recommends</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded">
              <p className="font-['JetBrains_Mono'] text-2xl text-foreground">→</p>
              <p className="font-['DM_Sans'] text-xs text-foreground/50">Human Review</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded">
              <p className="font-['JetBrains_Mono'] text-2xl text-[#00FF94]">✓</p>
              <p className="font-['DM_Sans'] text-xs text-foreground/50">Final Decision</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-['DM_Sans'] text-lg font-bold text-foreground mb-4">Audit Readiness</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-foreground/50" />
              <span className="font-['DM_Sans'] text-sm text-foreground/70">Complete audit trails</span>
            </div>
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-foreground/50" />
              <span className="font-['DM_Sans'] text-sm text-foreground/70">RBI inspection ready</span>
            </div>
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-foreground/50" />
              <span className="font-['DM_Sans'] text-sm text-foreground/70">Data encryption at rest</span>
            </div>
            <div className="flex items-center gap-3">
              <Scale size={20} className="text-foreground/50" />
              <span className="font-['DM_Sans'] text-sm text-foreground/70">Fair lending practices</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBICompliancePage;