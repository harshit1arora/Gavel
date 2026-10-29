import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Activity, 
  AlertTriangle, CheckCircle, Clock, ArrowUp, ArrowDown,
  Target, PieChart, Calendar, Mail, Phone, FileText,
  ArrowRight, BarChart3, Zap, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Deal {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  stage: 'cold' | 'demo' | 'proposal' | 'negotiating' | 'signed' | 'lost';
  value: number;
  probability: number;
  expectedClose: string;
  daysInStage: number;
  lastContact: string;
  notes: string;
}

interface Customer {
  id: string;
  name: string;
  plan: string;
  mrr: number;
  usage: {
    apiCalls: number;
    applications: number;
    users: number;
  };
  health: 'healthy' | 'at_risk' | 'churning';
  lastLogin: string;
  nps: number;
  supportTickets: number;
  createdAt: string;
}

interface MetricData {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

const STAGE_CONFIG = {
  cold: { label: 'Cold', color: '#6B7280', probability: 10 },
  demo: { label: 'Demo', color: '#F97316', probability: 25 },
  proposal: { label: 'Proposal', color: '#FBBF24', probability: 50 },
  negotiating: { label: 'Negotiating', color: '#8B5CF6', probability: 75 },
  signed: { label: 'Signed', color: '#00FF94', probability: 100 },
  lost: { label: 'Lost', color: '#EF4444', probability: 0 }
};

const FounderDashboard = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'customers' | 'economics' | 'revenue' | 'support'>('pipeline');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Mock data - replace with real API calls
  const [deals, setDeals] = useState<Deal[]>([
    { id: '1', companyName: 'Capital First NBFC', contactName: 'Rajesh Kumar', email: 'rajesh@capitalfirst.in', phone: '+91 98765 43210', stage: 'negotiating', value: 75000, probability: 75, expectedClose: '2025-06-15', daysInStage: 12, lastContact: '2025-05-15', notes: 'CTO wants to integrate within 2 weeks' },
    { id: '2', companyName: 'Trust Finance Ltd', contactName: 'Priya Sharma', email: 'priya@trustfinance.com', phone: '+91 98765 43211', stage: 'demo', value: 50000, probability: 25, expectedClose: '2025-06-30', daysInStage: 5, lastContact: '2025-05-14', notes: 'Demo scheduled for Tuesday' },
    { id: '3', companyName: 'Urban Money NBFC', contactName: 'Amit Singh', email: 'amit@urbanmoney.in', phone: '+91 98765 43212', stage: 'proposal', value: 100000, probability: 50, expectedClose: '2025-06-20', daysInStage: 8, lastContact: '2025-05-12', notes: 'Sent custom pricing proposal' },
    { id: '4', companyName: 'Apex Lending', contactName: 'Sonia Devi', email: 'sonia@apexlending.com', phone: '+91 98765 43213', stage: 'cold', value: 25000, probability: 10, expectedClose: '2025-07-15', daysInStage: 2, lastContact: '2025-05-10', notes: 'Inbound from website' },
    { id: '5', companyName: 'Gold Loan Corp', contactName: 'Vijay Malhotra', email: 'vijay@goldloan.in', phone: '+91 98765 43214', stage: 'signed', value: 75000, probability: 100, expectedClose: '2025-05-01', daysInStage: 0, lastContact: '2025-05-01', notes: 'Contract signed! Starting onboarding' },
    { id: '6', companyName: 'MicroFinance Plus', contactName: 'Sunita Rao', email: 'sunita@mfplus.in', phone: '+91 98765 43215', stage: 'lost', value: 40000, probability: 0, expectedClose: '', daysInStage: 0, lastContact: '2025-04-20', notes: 'Went with competitor - price sensitivity' },
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Gold Loan Corp', plan: 'Growth', mrr: 75000, usage: { apiCalls: 4500, applications: 320, users: 8 }, health: 'healthy', lastLogin: '2025-05-18', nps: 9, supportTickets: 1, createdAt: '2025-03-15' },
    { id: '2', name: 'QuickCash NBFC', plan: 'Starter', mrr: 25000, usage: { apiCalls: 800, applications: 45, users: 3 }, health: 'at_risk', lastLogin: '2025-05-10', nps: 6, supportTickets: 8, createdAt: '2025-04-01' },
    { id: '3', name: 'Shivalik Finance', plan: 'Enterprise', mrr: 200000, usage: { apiCalls: 15000, applications: 1200, users: 25 }, health: 'healthy', lastLogin: '2025-05-18', nps: 10, supportTickets: 0, createdAt: '2025-01-10' },
    { id: '4', name: 'P2P Lending Co', plan: 'Growth', mrr: 50000, usage: { apiCalls: 2100, applications: 150, users: 5 }, health: 'churning', lastLogin: '2025-04-28', nps: 4, supportTickets: 12, createdAt: '2025-02-20' },
  ]);

  const metrics = {
    mrr: { value: 350000, change: 12.5, trend: 'up' as const },
    arr: { value: 4200000, change: 15.2, trend: 'up' as const },
    customers: { value: 4, change: 1, trend: 'up' as const },
    churn: { value: 0, change: 0, trend: 'stable' as const },
    cac: { value: 45000, change: -8.3, trend: 'down' as const },
    ltv: { value: 1800000, change: 22.1, trend: 'up' as const },
    ltvCacRatio: { value: 40, change: 33, trend: 'up' as const },
    grossMargin: { value: 78, change: 2.5, trend: 'up' as const },
  };

  const pipelineMetrics = {
    totalDeals: deals.filter(d => d.stage !== 'lost').length,
    pipelineValue: deals.filter(d => d.stage !== 'lost').reduce((sum, d) => sum + d.value, 0),
    weightedValue: deals.filter(d => d.stage !== 'lost').reduce((sum, d) => sum + (d.value * d.probability / 100), 0),
    avgDealSize: deals.filter(d => d.stage !== 'lost').reduce((sum, d) => sum + d.value, 0) / deals.filter(d => d.stage !== 'lost').length,
    conversionRate: 33,
    avgSalesCycle: 28,
  };

  const getHealthColor = (health: string) => {
    switch(health) {
      case 'healthy': return '#00FF94';
      case 'at_risk': return '#FBBF24';
      case 'churning': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderPipeline = () => (
    <div className="space-y-6">
      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Pipeline Value</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">₹{pipelineMetrics.pipelineValue.toLocaleString()}</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50 mt-1">{pipelineMetrics.totalDeals} deals</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Weighted Value</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-[#00FF94]">₹{Math.round(pipelineMetrics.weightedValue).toLocaleString()}</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50 mt-1">Probability adjusted</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Avg Deal Size</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">₹{Math.round(pipelineMetrics.avgDealSize).toLocaleString()}</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50 mt-1">{pipelineMetrics.avgSalesCycle} days avg</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">This Month</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-[#F97316]">₹75,000</p>
            <p className="font-['JetBrains_Mono'] text-xs text-[#00FF94] mt-1">+1 signed this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Deal Pipeline Kanban */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STAGE_CONFIG).filter(([key]) => key !== 'lost').map(([stage, config]) => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
          
          return (
            <div key={stage} className="bg-card/30 border border-border rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <span className="font-['DM_Sans'] text-xs font-semibold" style={{ color: config.color }}>{config.label}</span>
                <span className="font-['JetBrains_Mono'] text-xs text-foreground/50">{stageDeals.length}</span>
              </div>
              <div className="space-y-2">
                {stageDeals.map(deal => (
                  <div key={deal.id} className="bg-muted/50 border border-border rounded p-2 cursor-pointer hover:bg-muted transition-colors">
                    <p className="font-['DM_Sans'] text-xs font-medium text-foreground truncate">{deal.companyName}</p>
                    <p className="font-['JetBrains_Mono'] text-xs text-foreground/60 mt-1">₹{deal.value.toLocaleString()}</p>
                    <p className="font-['JetBrains_Mono'] text-[10px] text-foreground/40 mt-1">{deal.daysInStage}d in stage</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-border">
                <p className="font-['JetBrains_Mono'] text-xs text-foreground/50">₹{stageValue.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal List */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-['DM_Sans'] text-sm font-semibold text-foreground">Active Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-['DM_Sans'] text-xs text-foreground/50 py-2">Company</th>
                  <th className="text-left font-['DM_Sans'] text-xs text-foreground/50 py-2">Contact</th>
                  <th className="text-left font-['DM_Sans'] text-xs text-foreground/50 py-2">Stage</th>
                  <th className="text-right font-['DM_Sans'] text-xs text-foreground/50 py-2">Value</th>
                  <th className="text-right font-['DM_Sans'] text-xs text-foreground/50 py-2">Probability</th>
                  <th className="text-right font-['DM_Sans'] text-xs text-foreground/50 py-2">Expected</th>
                  <th className="text-center font-['DM_Sans'] text-xs text-foreground/50 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.filter(d => d.stage !== 'lost' && d.stage !== 'signed').map(deal => (
                  <tr key={deal.id} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="py-2">
                      <p className="font-['DM_Sans'] text-xs font-medium text-foreground">{deal.companyName}</p>
                    </td>
                    <td className="py-2">
                      <p className="font-['DM_Sans'] text-xs text-foreground/70">{deal.contactName}</p>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-foreground/40">{deal.email}</p>
                    </td>
                    <td className="py-2">
                      <span className="font-['DM_Sans'] text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${STAGE_CONFIG[deal.stage as keyof typeof STAGE_CONFIG].color}20`, color: STAGE_CONFIG[deal.stage as keyof typeof STAGE_CONFIG].color }}>
                        {STAGE_CONFIG[deal.stage as keyof typeof STAGE_CONFIG].label}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <span className="font-['JetBrains_Mono'] text-xs text-foreground">₹{deal.value.toLocaleString()}</span>
                    </td>
                    <td className="py-2 text-right">
                      <span className="font-['JetBrains_Mono'] text-xs text-foreground/70">{deal.probability}%</span>
                    </td>
                    <td className="py-2 text-right">
                      <span className="font-['JetBrains_Mono'] text-xs text-foreground/50">{deal.expectedClose}</span>
                    </td>
                    <td className="py-2 text-center">
                      <button className="text-foreground/50 hover:text-foreground text-xs font-['DM_Sans']">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-[#00FF94]" />
              <span className="font-['DM_Sans'] text-xs text-foreground/50">Total Customers</span>
            </div>
            <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">{customers.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-[#00FF94]" />
              <span className="font-['DM_Sans'] text-xs text-foreground/50">Healthy</span>
            </div>
            <p className="font-['DM_Sans'] text-2xl font-bold text-[#00FF94]">{customers.filter(c => c.health === 'healthy').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-[#FBBF24]" />
              <span className="font-['DM_Sans'] text-xs text-foreground/50">At Risk</span>
            </div>
            <p className="font-['DM_Sans'] text-2xl font-bold text-[#FBBF24]">{customers.filter(c => c.health === 'at_risk').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-[#EF4444]" />
              <span className="font-['DM_Sans'] text-xs text-foreground/50">Churning</span>
            </div>
            <p className="font-['DM_Sans'] text-2xl font-bold text-[#EF4444]">{customers.filter(c => c.health === 'churning').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customers.map(customer => (
          <Card key={customer.id} className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-['DM_Sans'] text-sm font-semibold text-foreground">{customer.name}</h3>
                  <p className="font-['JetBrains_Mono'] text-xs text-foreground/50">{customer.plan} Plan</p>
                </div>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getHealthColor(customer.health) }}
                  title={customer.health}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="font-['DM_Sans'] text-xs text-foreground/50">MRR</p>
                  <p className="font-['JetBrains_Mono'] text-sm text-foreground">₹{customer.mrr.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-['DM_Sans'] text-xs text-foreground/50">API Calls</p>
                  <p className="font-['JetBrains_Mono'] text-sm text-foreground">{customer.usage.apiCalls.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-['DM_Sans'] text-xs text-foreground/50">NPS</p>
                  <p className={`font-['JetBrains_Mono'] text-sm ${customer.nps >= 7 ? 'text-[#00FF94]' : customer.nps >= 5 ? 'text-[#FBBF24]' : 'text-[#EF4444]'}`}>{customer.nps}/10</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <div>
                  <p className="font-['JetBrains_Mono'] text-[10px] text-foreground/40">Last login: {customer.lastLogin}</p>
                  <p className="font-['JetBrains_Mono'] text-[10px] text-foreground/40">{customer.supportTickets} support tickets</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    <Mail size={12} className="mr-1" /> Email
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    <Phone size={12} className="mr-1" /> Call
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderEconomics = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">CAC</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">₹{metrics.cac.value.toLocaleString()}</p>
            <p className="font-['JetBrains_Mono'] text-xs text-[#00FF94] mt-1">
              <ArrowDown size={12} className="inline" /> {Math.abs(metrics.cac.change)}% vs last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">LTV</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">₹{(metrics.ltv.value / 100000).toFixed(1)}L</p>
            <p className="font-['JetBrains_Mono'] text-xs text-[#00FF94] mt-1">
              <ArrowUp size={12} className="inline" /> {metrics.ltv.change}% vs last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">LTV:CAC Ratio</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-[#00FF94]">{metrics.ltvCacRatio.value}x</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50 mt-1">Target: 3x+</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Gross Margin</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">{metrics.grossMargin.value}%</p>
            <p className="font-['JetBrains_Mono'] text-xs text-[#00FF94] mt-1">
              <ArrowUp size={12} className="inline" /> {metrics.grossMargin.change}% vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unit Economics Breakdown */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-['DM_Sans'] text-sm font-semibold text-foreground">Unit Economics Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <span className="font-['DM_Sans'] text-sm text-foreground/70">Average Revenue per User (ARPU)</span>
                <span className="font-['JetBrains_Mono'] text-sm text-foreground">₹87,500/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <span className="font-['DM_Sans'] text-sm text-foreground/70">Cost to Serve (per customer)</span>
                <span className="font-['JetBrains_Mono'] text-sm text-foreground">₹19,250/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <span className="font-['DM_Sans'] text-sm text-foreground/70">Gross Profit per Customer</span>
                <span className="font-['JetBrains_Mono'] text-sm text-[#00FF94]">₹68,250/mo</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <span className="font-['DM_Sans'] text-sm text-foreground/70">Expected Customer Lifespan</span>
                <span className="font-['JetBrains_Mono'] text-sm text-foreground">24 months</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <span className="font-['DM_Sans'] text-sm text-foreground/70">Payback Period</span>
                <span className="font-['JetBrains_Mono'] text-sm text-foreground">0.66 months</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <span className="font-['DM_Sans'] text-sm text-foreground/70">Net Revenue Retention</span>
                <span className="font-['JetBrains_Mono'] text-sm text-[#00FF94]">115%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Chart Placeholder */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-['DM_Sans'] text-sm font-semibold text-foreground">MRR Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between gap-2 px-4">
            {[
              { month: 'Jan', value: 150000 },
              { month: 'Feb', value: 180000 },
              { month: 'Mar', value: 220000 },
              { month: 'Apr', value: 280000 },
              { month: 'May', value: 350000 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-[#F97316] rounded-t"
                  style={{ height: `${(d.value / 400000) * 100}%` }}
                />
                <span className="font-['JetBrains_Mono'] text-[10px] text-foreground/50">{d.month}</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-foreground">₹{d.value / 1000}k</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Current MRR</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">₹{metrics.mrr.value.toLocaleString()}</p>
            <p className="font-['JetBrains_Mono'] text-xs text-[#00FF94] mt-1">
              <ArrowUp size={12} className="inline" /> {metrics.mrr.change}% MoM
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">ARR</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">₹{(metrics.arr.value / 100000).toFixed(1)}L</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50 mt-1">Annualized</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Next Month Forecast</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-[#F97316]">₹425,000</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50 mt-1">Based on pipeline</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Breakeven</p>
            <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">8 months</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50 mt-1">Q1 2026</p>
          </CardContent>
        </Card>
      </div>

      {/* 6 Month Forecast */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-['DM_Sans'] text-sm font-semibold text-foreground">6-Month Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { month: 'May 2025', actual: 350000, forecast: false },
              { month: 'Jun 2025', actual: 425000, forecast: true },
              { month: 'Jul 2025', actual: 520000, forecast: true },
              { month: 'Aug 2025', actual: 650000, forecast: true },
              { month: 'Sep 2025', actual: 800000, forecast: true },
              { month: 'Oct 2025', actual: 950000, forecast: true },
            ].map((d, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-24 font-['DM_Sans'] text-sm text-foreground/70">{d.month}</span>
                <div className="flex-1 h-8 bg-muted/30 rounded overflow-hidden relative">
                  <div 
                    className={`h-full rounded ${d.forecast ? 'bg-[rgba(249,115,22,0.3)] border border-dashed border-[#F97316]' : 'bg-[#00FF94]'}`}
                    style={{ width: `${(d.actual / 1000000) * 100}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 font-['JetBrains_Mono'] text-xs text-foreground">
                    ₹{d.actual.toLocaleString()}
                  </span>
                </div>
                {d.forecast && (
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#F97316]">Forecast</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 text-center">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-2">Starter</p>
            <p className="font-['DM_Sans'] text-xl font-bold text-foreground">₹25,000</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50">1 customer</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 text-center">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-2">Growth</p>
            <p className="font-['DM_Sans'] text-xl font-bold text-foreground">₹125,000</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50">2 customers</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 text-center">
            <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-2">Enterprise</p>
            <p className="font-['DM_Sans'] text-xl font-bold text-foreground">₹200,000</p>
            <p className="font-['JetBrains_Mono'] text-xs text-foreground/50">1 customer</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSupport = () => {
    const tickets = [
      { id: '1', customer: 'QuickCash NBFC', subject: 'API rate limiting issue', status: 'open', priority: 'high', created: '2025-05-18', responseTime: '2h 15m' },
      { id: '2', customer: 'P2P Lending Co', subject: 'Want to export data', status: 'open', priority: 'medium', created: '2025-05-17', responseTime: '4h 30m' },
      { id: '3', customer: 'Gold Loan Corp', subject: 'How to add new user?', status: 'resolved', priority: 'low', created: '2025-05-15', responseTime: '1h' },
    ];

    return (
      <div className="space-y-6">
        {/* Support Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Open Tickets</p>
              <p className="font-['DM_Sans'] text-2xl font-bold text-[#F97316]">5</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Avg Response Time</p>
              <p className="font-['DM_Sans'] text-2xl font-bold text-foreground">2.5h</p>
              <p className="font-['JetBrains_Mono'] text-xs text-[#00FF94] mt-1">Target: &lt;4h</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Resolution Rate</p>
              <p className="font-['DM_Sans'] text-2xl font-bold text-[#00FF94]">92%</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">SLA Compliance</p>
              <p className="font-['DM_Sans'] text-2xl font-bold text-[#00FF94]">100%</p>
            </CardContent>
          </Card>
        </div>

        {/* Ticket List */}
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-['DM_Sans'] text-sm font-semibold text-foreground">Recent Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-[#F97316]' : 'bg-[#00FF94]'}`} />
                      <span className="font-['DM_Sans'] text-xs font-medium text-foreground">{ticket.customer}</span>
                      <span className={`font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded ${
                        ticket.priority === 'high' ? 'bg-[rgba(239,68,68,0.2)] text-[#EF4444]' :
                        ticket.priority === 'medium' ? 'bg-[rgba(251,191,36,0.2)] text-[#FBBF24]' :
                        'bg-[rgba(255,255,255,0.1)] text-foreground/50'
                      }`}>{ticket.priority}</span>
                    </div>
                    <p className="font-['DM_Sans'] text-sm text-foreground/70">{ticket.subject}</p>
                    <p className="font-['JetBrains_Mono'] text-[10px] text-foreground/40 mt-1">{ticket.created} · Response: {ticket.responseTime}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7">Respond</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-['DM_Sans'] text-3xl font-bold text-foreground">Founder Dashboard</h1>
          <p className="font-['DM_Sans'] text-sm text-foreground/50 mt-1">Your business metrics at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-['JetBrains_Mono'] text-xs text-foreground/50">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLastRefresh(new Date())}
          >
            <RefreshCw size={14} className="mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">MRR</p>
          <p className="font-['DM_Sans'] text-xl font-bold text-foreground">₹3.5L</p>
          <p className="font-['JetBrains_Mono'] text-xs text-[#00FF94]">+12.5%</p>
        </div>
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">ARR</p>
          <p className="font-['DM_Sans'] text-xl font-bold text-foreground">₹42L</p>
          <p className="font-['JetBrains_Mono'] text-xs text-[#00FF94]">+15.2%</p>
        </div>
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Customers</p>
          <p className="font-['DM_Sans'] text-xl font-bold text-foreground">4</p>
          <p className="font-['JetBrains_Mono'] text-xs text-[#00FF94]">+1 this month</p>
        </div>
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Churn</p>
          <p className="font-['DM_Sans'] text-xl font-bold text-foreground">0%</p>
          <p className="font-['JetBrains_Mono'] text-xs text-foreground/50">Target: &lt;3%</p>
        </div>
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">LTV:CAC</p>
          <p className="font-['DM_Sans'] text-xl font-bold text-[#00FF94]">40x</p>
          <p className="font-['JetBrains_Mono'] text-xs text-foreground/50">Target: 3x+</p>
        </div>
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <p className="font-['DM_Sans'] text-xs text-foreground/50 mb-1">Pipeline</p>
          <p className="font-['DM_Sans'] text-xl font-bold text-[#F97316]">₹2.5L</p>
          <p className="font-['JetBrains_Mono'] text-xs text-foreground/50">6 deals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        {[
          { id: 'pipeline', label: 'Sales Pipeline', icon: TrendingUp },
          { id: 'customers', label: 'Customer Health', icon: Users },
          { id: 'economics', label: 'Unit Economics', icon: PieChart },
          { id: 'revenue', label: 'Revenue', icon: DollarSign },
          { id: 'support', label: 'Support', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-['DM_Sans'] text-sm transition-colors ${
              activeTab === tab.id 
                ? 'bg-[rgba(249,115,22,0.1)] text-[#F97316] border-b-2 border-[#F97316]' 
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === 'pipeline' && renderPipeline()}
        {activeTab === 'customers' && renderCustomers()}
        {activeTab === 'economics' && renderEconomics()}
        {activeTab === 'revenue' && renderRevenue()}
        {activeTab === 'support' && renderSupport()}
      </motion.div>
    </div>
  );
};

export default FounderDashboard;