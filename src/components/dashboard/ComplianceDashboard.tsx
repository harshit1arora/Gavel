import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, FileText, 
  TrendingUp, TrendingDown, RefreshCw, Download, PieChart,
  Activity, DollarSign, Clock, Target, BarChart3, Building2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiWithAuth } from "@/lib/api-client";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell
} from "recharts";

interface PortfolioSummary {
  total: number;
  standard: number;
  sma0: number;
  sma1: number;
  sma2: number;
  npa: number;
  npaByCategory: { Substandard: number; Doubtful: number; 'Loss Asset': number };
  totalOutstanding: number;
  totalOverdue: number;
  totalProvisioning: number;
  npaRatio: number;
  provisionCoverage: number;
  averageDPD: number;
}

interface ProvisioningReport {
  totalExposure: number;
  totalECL: number;
  totalProvisioning: number;
  provisionCoverage: number;
  stageWiseProvisioning: Record<string, number>;
  assetClassificationSummary: Record<string, { count: number; amount: number; provision: number }>;
  recommendedProvisions: Array<{
    loanId: string;
    borrowerName: string;
    classification: string;
    outstanding: number;
    provision: number;
    reason: string;
  }>;
}

interface SMATracking {
  summary: {
    sma0Count: number;
    sma1Count: number;
    sma2Count: number;
    npaCount: number;
    totalAtRisk: number;
    totalOverdueAmount: number;
    totalProvisioningRequired: number;
    provisionedAmount: number;
  };
  loans: Array<{
    loanId: string;
    classification: string;
    daysOverdue: number;
    overdueAmount: number;
    totalOutstanding: number;
    overdueEMICount: number;
    provisioned: boolean;
  }>;
}

export default function ComplianceDashboard({ orgId }: { orgId: string | null }) {
  const [loading, setLoading] = useState(true);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [provisioningReport, setProvisioningReport] = useState<ProvisioningReport | null>(null);
  const [smaTracking, setSmaTracking] = useState<SMATracking | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'npa' | 'provisioning' | 'sma' | 'reports'>('overview');
  const [isRunningClassification, setIsRunningClassification] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [portfolioRes, provisioningRes, smaRes] = await Promise.all([
        apiWithAuth('/v1/rbi/portfolio-classification'),
        apiWithAuth('/v1/rbi/provisioning-report'),
        apiWithAuth('/v1/rbi/sma-tracking'),
      ]);
      
      if (portfolioRes.ok) setPortfolioSummary(await portfolioRes.json());
      if (provisioningRes.ok) setProvisioningReport(await provisioningRes.json());
      if (smaRes.ok) setSmaTracking(await smaRes.json());
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const handleRunClassification = async () => {
    setIsRunningClassification(true);
    try {
      const response = await apiWithAuth('/v1/rbi/run-classification', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        toast.success(`Portfolio classification complete: ${result.processed} loans processed`);
        setLastRun(new Date().toLocaleString());
        await fetchData();
      }
    } catch (error) {
      toast.error('Failed to run classification');
    }
    setIsRunningClassification(false);
  };

  const classificationData = portfolioSummary ? [
    { name: 'Standard', value: portfolioSummary.standard, color: '#22C55E' },
    { name: 'SMA-0 (1-30)', value: portfolioSummary.sma0, color: '#EAB308' },
    { name: 'SMA-1 (31-60)', value: portfolioSummary.sma1, color: '#F97316' },
    { name: 'SMA-2 (61-90)', value: portfolioSummary.sma2, color: '#EF4444' },
    { name: 'NPA (90+)', value: portfolioSummary.npa, color: '#991B1B' },
  ] : [];

  const npaByCategory = portfolioSummary ? [
    { name: 'Substandard', value: portfolioSummary.npaByCategory.Substandard, color: '#F97316' },
    { name: 'Doubtful', value: portfolioSummary.npaByCategory.Doubtful, color: '#EF4444' },
    { name: 'Loss Asset', value: portfolioSummary.npaByCategory['Loss Asset'], color: '#991B1B' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">RBI Compliance Engine</h1>
          <p className="text-muted-foreground text-sm">Asset classification, NPA tracking & provisioning</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRun && (
            <span className="text-xs text-muted-foreground">Last run: {lastRun}</span>
          )}
          <button
            onClick={handleRunClassification}
            disabled={isRunningClassification}
            className="px-4 py-2 bg-orange-500/20 border border-orange-500 text-orange-400 rounded-lg flex items-center gap-2 hover:bg-orange-500/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunningClassification ? 'animate-spin' : ''}`} />
            {isRunningClassification ? 'Running...' : 'Run Classification'}
          </button>
          <button className="px-4 py-2 bg-green-500/20 border border-green-500 text-green-400 rounded-lg flex items-center gap-2 hover:bg-green-500/30">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-foreground/5 p-1 rounded-xl w-max">
        {[
          { key: 'overview', label: 'Portfolio Overview' },
          { key: 'npa', label: 'NPA Management' },
          { key: 'provisioning', label: 'Provisioning' },
          { key: 'sma', label: 'SMA Tracking' },
          { key: 'reports', label: 'RBI Reports' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTab === tab.key 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {portfolioSummary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Loans</span>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold">{portfolioSummary.total}</p>
            <p className="text-xs text-muted-foreground mt-1">₹{(portfolioSummary.totalOutstanding / 100000).toFixed(1)}L total exposure</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">NPA Ratio</span>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <p className={`text-2xl font-bold ${portfolioSummary.npaRatio > 5 ? 'text-red-400' : portfolioSummary.npaRatio > 2 ? 'text-orange-400' : 'text-green-400'}`}>
              {portfolioSummary.npaRatio.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{portfolioSummary.npa} NPAs in portfolio</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Provision Required</span>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <DollarSign className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-400">₹{(portfolioSummary.totalProvisioning / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground mt-1">{portfolioSummary.provisionCoverage.toFixed(1)}% coverage</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">At Risk (SMA)</span>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Activity className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {portfolioSummary.sma0 + portfolioSummary.sma1 + portfolioSummary.sma2}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Avg DPD: {portfolioSummary.averageDPD} days</p>
          </div>
        </div>
      )}

      {selectedTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-surface border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-4">Asset Classification Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classificationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                  <Bar dataKey="value" fill="#667eea" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-4">Classification Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie data={classificationData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {classificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {classificationData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: item.color }}></div>
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-bold text-sm mb-4">RBI Compliance Checklist</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'SMA-0/1/2 Classification', status: portfolioSummary && portfolioSummary.sma0 + portfolioSummary.sma1 + portfolioSummary.sma2 > 0, desc: 'Accounts 1-90 DPD tracked' },
                { label: 'NPA Classification (90+ DPD)', status: portfolioSummary && portfolioSummary.npa > 0, desc: 'Automatic NPA flagging' },
                { label: 'Provisioning Adequate', status: portfolioSummary && portfolioSummary.provisionCoverage >= 70, desc: 'Coverage ratio check' },
                { label: 'Audit Trail Enabled', status: true, desc: 'All actions logged' },
                { label: 'Daily Classification Run', status: lastRun !== null, desc: 'Automated scheduling' },
                { label: 'BNK Report Available', status: true, desc: 'RBI banking report' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-foreground/5 rounded-lg">
                  {item.status ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'npa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-2">Substandard (0-12 mo)</p>
              <p className="text-3xl font-bold text-red-400">{portfolioSummary?.npaByCategory.Substandard || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">10% provision required</p>
            </div>
            <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-2">Doubtful (12-24 mo)</p>
              <p className="text-3xl font-bold text-red-500">{portfolioSummary?.npaByCategory.Doubtful || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">100% provision required</p>
            </div>
            <div className="bg-red-700/10 border border-red-700/30 rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-2">Loss Asset (24+ mo)</p>
              <p className="text-3xl font-bold text-red-600">{portfolioSummary?.npaByCategory['Loss Asset'] || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">100% provision + write-off</p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-bold text-sm mb-4">NPA Loans</h3>
            {smaTracking && smaTracking.loans.filter(l => l.classification === 'NPA').length > 0 ? (
              <div className="space-y-2">
                {smaTracking.loans.filter(l => l.classification === 'NPA').slice(0, 10).map((loan, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-foreground/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <div>
                        <p className="text-sm font-medium">{loan.loanId.substring(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">{loan.daysOverdue} DPD • {loan.overdueEMICount} EMI(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-400">₹{(loan.overdueAmount / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">₹{(loan.totalOutstanding / 100000).toFixed(1)}L outstanding</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p>No NPA accounts</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'provisioning' && provisioningReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Total Exposure</p>
              <p className="text-2xl font-bold">₹{(provisioningReport.totalExposure / 100000).toFixed(1)}L</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Expected Credit Loss</p>
              <p className="text-2xl font-bold text-yellow-400">₹{(provisioningReport.totalECL / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Total Provisions</p>
              <p className="text-2xl font-bold text-orange-400">₹{(provisioningReport.totalProvisioning / 1000).toFixed(0)}K</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-4">Provisioning by Stage</h3>
              <div className="space-y-3">
                {Object.entries(provisioningReport.stageWiseProvisioning).map(([stage, amount]) => (
                  <div key={stage} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{stage}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-foreground/10 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-orange-500"
                          style={{ width: `${Math.min(100, (amount / (provisioningReport.totalProvisioning || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-20 text-right">₹{(amount / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-4">Recommendations</h3>
              {provisioningReport.recommendedProvisions.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {provisioningReport.recommendedProvisions.slice(0, 10).map((rec, i) => (
                    <div key={i} className="p-3 bg-foreground/5 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{rec.borrowerName}</span>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">{rec.classification}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.reason}</p>
                      <p className="text-sm font-bold text-orange-400 mt-1">Provision: ₹{(rec.provision / 1000).toFixed(0)}K</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p>All provisions adequate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'sma' && smaTracking && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">{smaTracking.summary.sma0Count}</p>
              <p className="text-xs text-muted-foreground">SMA-0 (1-30 DPD)</p>
              <p className="text-xs text-yellow-400 mt-1">0.5% provision</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-400">{smaTracking.summary.sma1Count}</p>
              <p className="text-xs text-muted-foreground">SMA-1 (31-60 DPD)</p>
              <p className="text-xs text-orange-400 mt-1">1% provision</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-400">{smaTracking.summary.sma2Count}</p>
              <p className="text-xs text-muted-foreground">SMA-2 (61-90 DPD)</p>
              <p className="text-xs text-red-400 mt-1">5% provision</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{smaTracking.summary.totalAtRisk}</p>
              <p className="text-xs text-muted-foreground">Total At Risk</p>
              <p className="text-xs font-bold text-orange-400 mt-1">₹{(smaTracking.summary.totalOverdueAmount / 1000).toFixed(0)}K overdue</p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-bold text-sm mb-4">SMA Loans</h3>
            <div className="space-y-2">
              {smaTracking.loans.filter(l => l.classification.startsWith('SMA')).slice(0, 15).map((loan, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-foreground/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${
                      loan.classification === 'SMA-0' ? 'bg-yellow-400' :
                      loan.classification === 'SMA-1' ? 'bg-orange-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{loan.loanId.substring(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">{loan.daysOverdue} DPD • {loan.overdueEMICount} EMI(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{(loan.overdueAmount / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">overdue</p>
                    </div>
                    {loan.provisioned ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Provisioned</span>
                    ) : (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'reports' && (
        <div className="grid grid-cols-2 gap-6">
          {[
            { type: 'bnk', name: 'BNK Report', desc: 'Banking supervision report for RBI', icon: BarChart3 },
            { type: 'npa', name: 'NPA Management', desc: 'NPA classification & provisioning', icon: AlertTriangle },
            { type: 'alm', name: 'ALM Report', desc: 'Asset Liability Management', icon: PieChart },
            { type: 'compliance-summary', name: 'Compliance Summary', desc: 'Full RBI compliance status', icon: Shield },
          ].map((report, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface border border-border rounded-xl p-6 cursor-pointer hover:border-primary/40 transition-all"
              onClick={async () => {
                try {
                  const response = await apiWithAuth(`/v1/rbi/rbi-report/${report.type}`);
                  if (response.ok) {
                    const data = await response.json();
                    toast.success(`${report.name} generated`);
                    console.log('Report data:', data);
                  }
                } catch {
                  toast.error('Failed to generate report');
                }
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <report.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">{report.name}</h3>
                  <p className="text-xs text-muted-foreground">{report.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary">
                <FileText className="w-4 h-4" />
                Generate Report
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}