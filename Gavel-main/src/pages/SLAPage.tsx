import React from 'react';
import { Shield, Clock, CheckCircle, BarChart3, AlertTriangle, Server, Lock, Globe } from 'lucide-react';

const SLAPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-['DM_Sans'] text-4xl font-bold text-foreground mb-4">Service Level Agreement</h1>
        <p className="font-['DM_Sans'] text-lg text-foreground/60 mb-8">Our commitment to reliability and uptime</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[rgba(0,255,148,0.1)] flex items-center justify-center">
                <Server size={24} className="text-[#00FF94]" />
              </div>
              <div>
                <p className="font-['DM_Sans'] text-lg font-bold text-foreground">99.9%</p>
                <p className="font-['DM_Sans'] text-xs text-foreground/50">Enterprise</p>
              </div>
            </div>
            <p className="font-['DM_Sans'] text-sm text-foreground/70">Uptime guarantee for Enterprise customers</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[rgba(249,115,22,0.1)] flex items-center justify-center">
                <Clock size={24} className="text-[#F97316]" />
              </div>
              <div>
                <p className="font-['DM_Sans'] text-lg font-bold text-foreground">99.5%</p>
                <p className="font-['DM_Sans'] text-xs text-foreground/50">Growth</p>
              </div>
            </div>
            <p className="font-['DM_Sans'] text-sm text-foreground/70">Uptime guarantee for Growth customers</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                <Globe size={24} className="text-foreground/50" />
              </div>
              <div>
                <p className="font-['DM_Sans'] text-lg font-bold text-foreground">95%</p>
                <p className="font-['DM_Sans'] text-xs text-foreground/50">Starter</p>
              </div>
            </div>
            <p className="font-['DM_Sans'] text-sm text-foreground/70">Uptime guarantee for Starter customers</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="font-['DM_Sans'] text-xl font-bold text-foreground mb-4">Uptime History</h2>
          <div className="flex items-end gap-1 h-32">
            {[99.9, 99.8, 100, 99.9, 99.7, 100, 99.9, 99.8, 100, 99.9, 100, 99.9].map((u, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-[#00FF94] rounded-t" style={{ height: `${u}%` }} />
                <span className="font-['JetBrains_Mono'] text-[8px] text-foreground/40 mt-1">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
              </div>
            ))}
          </div>
          <p className="font-['JetBrains_Mono'] text-xs text-foreground/50 mt-4">Last 12 months average: 99.87%</p>
        </div>

        <div className="space-y-4">
          <h2 className="font-['DM_Sans'] text-xl font-bold text-foreground">Service Credits</h2>
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <p className="font-['DM_Sans'] text-sm text-foreground/70">If we fall below our SLA, you'll receive service credits:</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2 font-['DM_Sans'] text-sm text-foreground"><CheckCircle size={14} className="text-[#00FF94]" /> 99.0-99.9%: 10% monthly credit</li>
              <li className="flex items-center gap-2 font-['DM_Sans'] text-sm text-foreground"><CheckCircle size={14} className="text-[#00FF94]" /> 95.0-99.0%: 25% monthly credit</li>
              <li className="flex items-center gap-2 font-['DM_Sans'] text-sm text-foreground"><CheckCircle size={14} className="text-[#00FF94]" /> Below 95%: 50% monthly credit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SLAPage;