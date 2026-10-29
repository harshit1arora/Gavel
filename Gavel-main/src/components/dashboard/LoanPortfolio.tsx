import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock,
  BarChart3, PieChart, ArrowRight, Filter, Download, Eye, X, ArrowRightLeft
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { apiWithAuth } from "../../lib/api-client";
import { exportToCSV } from "../../lib/exportUtils";

interface Loan {
  id: string;
  applicationId: string;
  borrowerName: string;
  loanAmount: number;
  status: string;
  currentStage: string;
  createdAt: string;
  disbursedAt?: string;
  interestRate: number;
  tenor: number;
  daysOverdue?: number;
}

interface PortfolioMetrics {
  totalLoans: number;
  totalDisbursed: number;
  totalRepaid: number;
  outstandingAmount: number;
  npaRatio: number;
  avgLoanSize: number;
  activeLoans: number;
  closedLoans: number;
}

interface StageFlow {
  stage: string;
  count: number;
  percentage: number;
}

export default function LoanPortfolio({ orgId }: { orgId: string | null }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetchLoans();
    fetchMetrics();
  }, [orgId, filter]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      try {
        const response = await apiWithAuth(`/v1/loans${filter !== 'all' ? `?status=${filter}` : ''}`);

        if (response.ok) {
          const data = await response.json();
          setLoans(data);
          return;
        }
      } catch (apiError) {
        console.warn('API unavailable:', apiError);
      }
      
      // Mock data fallback
      setLoans([
        { id: 'L001', applicationId: 'A001', borrowerName: 'Rajesh Kumar', loanAmount: 500000, status: 'Active', currentStage: 'active', createdAt: '2026-01-15', disbursedAt: '2026-02-01', interestRate: 12, tenor: 36, daysOverdue: 0 },
        { id: 'L002', applicationId: 'A002', borrowerName: 'Priya Singh', loanAmount: 300000, status: 'Active', currentStage: 'active', createdAt: '2026-01-20', disbursedAt: '2026-02-05', interestRate: 11, tenor: 24, daysOverdue: 0 },
        { id: 'L003', applicationId: 'A003', borrowerName: 'Amit Patel', loanAmount: 700000, status: 'NPA', currentStage: 'npa', createdAt: '2025-06-10', disbursedAt: '2025-07-01', interestRate: 13, tenor: 48, daysOverdue: 95 },
        { id: 'L004', applicationId: 'A004', borrowerName: 'Neha Gupta', loanAmount: 450000, status: 'Closed', currentStage: 'closed', createdAt: '2025-01-05', disbursedAt: '2025-02-01', interestRate: 12, tenor: 36, daysOverdue: 0 },
      ]);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      try {
        const response = await apiWithAuth('/v1/loans/metrics/portfolio');

        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
          return;
        }
      } catch (apiError) {
        console.warn('API unavailable');
      }
      
      // Mock metrics
      setMetrics({
        totalLoans: 4,
        totalDisbursed: 1950000,
        totalRepaid: 850000,
        outstandingAmount: 1100000,
        npaRatio: 25,
        avgLoanSize: 487500,
        activeLoans: 2,
        closedLoans: 1,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Closed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'NPA': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Prepaid': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <TrendingUp size={16} />;
      case 'Closed': return <CheckCircle2 size={16} />;
      case 'NPA': return <AlertTriangle size={16} />;
      case 'Prepaid': return <CheckCircle2 size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const stageFlow: StageFlow[] = [
    { stage: 'Application', count: 150, percentage: 100 },
    { stage: 'Approved', count: 140, percentage: 93 },
    { stage: 'Disbursed', count: 135, percentage: 90 },
    { stage: 'Active', count: 125, percentage: 83 },
    { stage: 'Closed', count: 10, percentage: 7 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading loans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Loan Portfolio</h1>
        <p className="text-muted-foreground mt-1">Track all loans from application to closure</p>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-foreground/5 rounded-2xl p-6 border border-white/5"
          >
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Total Loans</div>
            <div className="text-3xl font-display font-bold">{metrics.totalLoans}</div>
            <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> {metrics.activeLoans} Active
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-foreground/5 rounded-2xl p-6 border border-white/5"
          >
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Outstanding</div>
            <div className="text-3xl font-display font-bold">₹{(metrics.outstandingAmount / 100000).toFixed(1)}L</div>
            <div className="text-xs text-yellow-400 mt-2">
              {((metrics.outstandingAmount / metrics.totalDisbursed) * 100).toFixed(1)}% of Disbursed
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-foreground/5 rounded-2xl p-6 border border-white/5"
          >
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">NPA Ratio</div>
            <div className="text-3xl font-display font-bold">{metrics.npaRatio.toFixed(1)}%</div>
            <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Watch
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-foreground/5 rounded-2xl p-6 border border-white/5"
          >
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Avg Loan Size</div>
            <div className="text-3xl font-display font-bold">₹{(metrics.avgLoanSize / 100000).toFixed(1)}L</div>
            <div className="text-xs text-muted-foreground mt-2">
              {metrics.totalLoans} Total
            </div>
          </motion.div>
        </div>
      )}

      {/* Sankey Flow Diagram */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-foreground/5 rounded-3xl p-8 border border-white/5"
      >
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <BarChart3 size={20} /> Loan Lifecycle Flow
        </h2>
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
          {stageFlow.map((stage, index) => (
            <div key={stage.stage} className="flex-1 px-2 flex flex-col items-center">
              <div className="relative mb-4 w-full">
                <div className={`rounded-2xl p-4 text-center border ${
                  index === 0 ? 'bg-primary/20 border-primary' : 'bg-foreground/10 border-border'
                }`}>
                  <div className="text-2xl font-bold">{stage.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stage.stage}</div>
                  <div className="text-xs text-primary mt-1 font-bold">{stage.percentage}%</div>
                </div>
              </div>
              {index < stageFlow.length - 1 && (
                <div className="flex items-center justify-center mb-4">
                  <ArrowRight size={20} className="text-primary/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={16} className="text-muted-foreground" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'Active', 'NPA', 'Closed', 'Prepaid'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filter === status
                  ? 'bg-primary text-background'
                  : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
              }`}
            >
              {status === 'all' ? 'All Loans' : status}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportToCSV('loan_portfolio.csv', loans)}
          className="ml-auto flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-foreground/10 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Loans Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl overflow-hidden border border-white/5"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-foreground/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Borrower</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Days Overdue</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Interest Rate</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Tenor</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-sm">{loan.borrowerName}</div>
                      <div className="text-xs text-muted-foreground">{loan.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold">₹{(loan.loanAmount / 100000).toFixed(1)}L</td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(loan.status)}`}>
                      {getStatusIcon(loan.status)}
                      <span className="text-xs font-bold">{loan.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {loan.daysOverdue && loan.daysOverdue > 0 ? (
                      <span className="text-red-400 font-bold">{loan.daysOverdue} days</span>
                    ) : (
                      <span className="text-green-400">Current</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold">{loan.interestRate}%</td>
                  <td className="px-6 py-4">{loan.tenor} months</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="p-2 hover:bg-foreground/20 rounded-xl transition-colors"
                    >
                      <Eye size={16} className="text-primary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Loan Detail Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-background/40">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel-heavy p-10 rounded-[3rem] max-w-lg w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">{selectedLoan.borrowerName}</h3>
                <p className="text-xs text-muted-foreground mt-1">{selectedLoan.id}</p>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="text-foreground/40 hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-4 bg-foreground/5 rounded-xl">
                <span className="text-sm text-muted-foreground">Loan Amount</span>
                <span className="font-bold">₹{(selectedLoan.loanAmount / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-foreground/5 rounded-xl">
                <span className="text-sm text-muted-foreground">Interest Rate</span>
                <span className="font-bold">{selectedLoan.interestRate}% p.a.</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-foreground/5 rounded-xl">
                <span className="text-sm text-muted-foreground">Tenor</span>
                <span className="font-bold">{selectedLoan.tenor} months</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-foreground/5 rounded-xl">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(selectedLoan.status)}`}>
                  {getStatusIcon(selectedLoan.status)}
                  <span className="text-xs font-bold">{selectedLoan.status}</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedLoan(null)}
              className="w-full py-4 bg-primary text-background rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
