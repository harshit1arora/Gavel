import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, Phone, MessageSquare, Download, Filter, TrendingUp, 
  TrendingDown, Users, DollarSign, Calendar, Clock, CheckCircle,
  XCircle, RefreshCw, Send, ChevronRight, Search, Eye
} from "lucide-react";
import { toast } from "sonner";
import { apiWithAuth } from "../../lib/api-client";
import { exportToCSV } from "../../lib/exportUtils";

interface CollectionAccount {
  id: string;
  loanId: string;
  borrowerName: string;
  phone: string;
  email: string;
  amountOutstanding: number;
  amountOverdue: number;
  daysOverdue: number;
  bucket: "current" | "overdue" | "high_risk" | "npa";
  lastPaymentDate: string;
  lastContactDate: string;
  nextActionDate: string;
  status: "new" | "contacted" | "promise_to_pay" | "partial_payment" | "recovered" | "written_off";
  assignedAgent: string;
  notes: CollectionNote[];
  paymentSchedule: PaymentRecord[];
  totalPaid: number;
}

interface CollectionNote {
  id: string;
  date: string;
  type: "call" | "sms" | "visit" | "email";
  outcome: string;
  agent: string;
  nextAction: string;
}

interface PaymentRecord {
  date: string;
  amount: number;
  mode: "upi" | "bank_transfer" | "cash" | "cheque";
  reference: string;
}

interface DashboardMetrics {
  totalOverdue: number;
  totalNPA: number;
  recoveryRate: number;
  avgDaysOverdue: number;
  promisesKept: number;
  promisesBroken: number;
  activeAgents: number;
  accountsThisMonth: number;
}

const mockCollections: CollectionAccount[] = [
  {
    id: "1",
    loanId: "LN20240001",
    borrowerName: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@email.com",
    amountOutstanding: 450000,
    amountOverdue: 85000,
    daysOverdue: 45,
    bucket: "overdue",
    lastPaymentDate: "2024-02-15",
    lastContactDate: "2024-04-01",
    nextActionDate: "2024-04-05",
    status: "contacted",
    assignedAgent: "Amit Singh",
    notes: [
      { id: "n1", date: "2024-04-01", type: "call", outcome: "Promise to pay by April 10", agent: "Amit Singh", nextAction: "Follow up April 5" }
    ],
    paymentSchedule: [
      { date: "2024-03-15", amount: 15000, mode: "upi", reference: "UPI123" }
    ],
    totalPaid: 125000
  },
  {
    id: "2",
    loanId: "LN20240002",
    borrowerName: "Priya Sharma",
    phone: "+91 98765 43211",
    email: "priya.sharma@email.com",
    amountOutstanding: 280000,
    amountOverdue: 280000,
    daysOverdue: 95,
    bucket: "npa",
    lastPaymentDate: "2024-01-10",
    lastContactDate: "2024-04-02",
    nextActionDate: "2024-04-07",
    status: "promise_to_pay",
    assignedAgent: "Sunita Devi",
    notes: [
      { id: "n2", date: "2024-04-02", type: "sms", outcome: "Sent reminder SMS", agent: "Sunita Devi", nextAction: "Call April 7" }
    ],
    paymentSchedule: [],
    totalPaid: 45000
  },
  {
    id: "3",
    loanId: "LN20240003",
    borrowerName: "Mahendra Singh",
    phone: "+91 98765 43212",
    email: "mahendra.s@email.com",
    amountOutstanding: 125000,
    amountOverdue: 35000,
    daysOverdue: 22,
    bucket: "current",
    lastPaymentDate: "2024-03-28",
    lastContactDate: "2024-04-01",
    nextActionDate: "2024-04-08",
    status: "new",
    assignedAgent: "Ramesh Kumar",
    notes: [],
    paymentSchedule: [
      { date: "2024-03-28", amount: 8500, mode: "bank_transfer", reference: "NEFT456" }
    ],
    totalPaid: 45000
  },
  {
    id: "4",
    loanId: "LN20240004",
    borrowerName: "Anita Devi",
    phone: "+91 98765 43213",
    email: "anita.devi@email.com",
    amountOutstanding: 680000,
    amountOverdue: 125000,
    daysOverdue: 67,
    bucket: "high_risk",
    lastPaymentDate: "2024-02-01",
    lastContactDate: "2024-04-03",
    nextActionDate: "2024-04-05",
    status: "partial_payment",
    assignedAgent: "Vikram Singh",
    notes: [
      { id: "n3", date: "2024-04-03", type: "visit", outcome: "Home visit - borrower not home", agent: "Vikram Singh", nextAction: "Visit again April 5" }
    ],
    paymentSchedule: [
      { date: "2024-03-15", amount: 25000, mode: "upi", reference: "UPI789" }
    ],
    totalPaid: 180000
  },
  {
    id: "5",
    loanId: "LN20240005",
    borrowerName: "Suresh Patel",
    phone: "+91 98765 43214",
    email: "suresh.patel@email.com",
    amountOutstanding: 920000,
    amountOverdue: 920000,
    daysOverdue: 120,
    bucket: "npa",
    lastPaymentDate: "2023-12-15",
    lastContactDate: "2024-04-01",
    nextActionDate: "2024-04-10",
    status: "written_off",
    assignedAgent: "Admin",
    notes: [
      { id: "n4", date: "2024-04-01", type: "email", outcome: "Legal notice sent", agent: "Admin", nextAction: "Legal review" }
    ],
    paymentSchedule: [],
    totalPaid: 85000
  }
];

export default function CollectionsPipeline({ orgId }: { orgId: string | null }) {
  const [collections, setCollections] = useState<CollectionAccount[]>(mockCollections);
  const [loading, setLoading] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<CollectionAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!orgId) return;
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const res = await apiWithAuth('/v1/collections');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCollections(data);
          }
        }
      } catch (e) {
        // Use mock data
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, [orgId]);

  const metrics: DashboardMetrics = useMemo(() => {
    const overdue = collections.filter(c => c.bucket === "overdue" || c.bucket === "high_risk");
    const npa = collections.filter(c => c.bucket === "npa");
    const promises = collections.filter(c => c.status === "promise_to_pay");
    const kept = promises.filter(c => new Date(c.nextActionDate) >= new Date()).length;
    
    return {
      totalOverdue: overdue.reduce((sum, c) => sum + c.amountOverdue, 0),
      totalNPA: npa.reduce((sum, c) => sum + c.amountOverdue, 0),
      recoveryRate: collections.length > 0 ? 
        ((collections.filter(c => c.status === "recovered").length / collections.length) * 100) : 0,
      avgDaysOverdue: collections.length > 0 
        ? Math.round(collections.reduce((sum, c) => sum + c.daysOverdue, 0) / collections.length) : 0,
      promisesKept: kept,
      promisesBroken: promises.length - kept,
      activeAgents: [...new Set(collections.map(c => c.assignedAgent))].length,
      accountsThisMonth: collections.filter(c => c.daysOverdue <= 30).length
    };
  }, [collections]);

  const filteredCollections = collections.filter(c => {
    const matchesBucket = selectedBucket === "all" || c.bucket === selectedBucket;
    const matchesSearch = searchQuery === "" || 
      c.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.loanId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    return matchesBucket && matchesSearch;
  });

  const bucketCounts = {
    current: collections.filter(c => c.daysOverdue <= 30).length,
    overdue: collections.filter(c => c.daysOverdue > 30 && c.daysOverdue <= 60).length,
    high_risk: collections.filter(c => c.daysOverdue > 60 && c.daysOverdue <= 90).length,
    npa: collections.filter(c => c.daysOverdue > 90).length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500/20 text-blue-400";
      case "contacted": return "bg-yellow-500/20 text-yellow-400";
      case "promise_to_pay": return "bg-green-500/20 text-green-400";
      case "partial_payment": return "bg-purple-500/20 text-purple-400";
      case "recovered": return "bg-emerald-500/20 text-emerald-400";
      case "written_off": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case "current": return "text-green-400 bg-green-500/10 border-green-500/30";
      case "overdue": return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "high_risk": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "npa": return "text-red-600 bg-red-600/10 border-red-600/30";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Collections Pipeline</h1>
          <p className="text-muted-foreground mt-1">Data-driven recovery tracking and NPA management.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportToCSV('collections.csv', collections)}
            className="px-4 py-2 border border-border rounded-xl bg-background hover:bg-foreground/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Overdue</span>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">₹{(metrics.totalOverdue / 100000).toFixed(1)}L</p>
          <p className="text-xs text-muted-foreground mt-1">Across {collections.filter(c => c.daysOverdue > 30).length} accounts</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">NPA Portfolio</span>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-400">₹{(metrics.totalNPA / 100000).toFixed(1)}L</p>
          <p className="text-xs text-muted-foreground mt-1">{bucketCounts.npa} accounts 90+ DPD</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Recovery Rate</span>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-400">{(metrics.recoveryRate).toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Promise kept: {metrics.promisesKept}/{metrics.promisesKept + metrics.promisesBroken}</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Active Agents</span>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{metrics.activeAgents}</p>
          <p className="text-xs text-muted-foreground mt-1">Avg. {Math.round(filteredCollections.length / metrics.activeAgents)} accounts/agent</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by name, loan ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm w-64"
            />
          </div>
          
          <div className="flex gap-1 bg-background border border-border rounded-lg p-1">
            {[
              { key: "all", label: "All" },
              { key: "current", label: "0-30 DPD" },
              { key: "overdue", label: "31-60 DPD" },
              { key: "high_risk", label: "61-90 DPD" },
              { key: "npa", label: "90+ DPD" }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedBucket(filter.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  selectedBucket === filter.key 
                    ? "bg-orange-500 text-white" 
                    : "text-muted-foreground hover:bg-foreground/10"
                }`}
              >
                {filter.label}
                {filter.key !== "all" && (
                  <span className="ml-1 opacity-60">
                    ({bucketCounts[filter.key as keyof typeof bucketCounts]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing {filteredCollections.length} accounts</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Collections List */}
        <div className="col-span-2 space-y-3">
          {filteredCollections.map(account => (
            <motion.div 
              key={account.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSelectedAccount(account)}
              className={`bg-surface border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/40 ${
                selectedAccount?.id === account.id ? "border-orange-500 ring-1 ring-orange-500/20" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center font-bold text-sm">
                    {account.borrowerName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold">{account.borrowerName}</p>
                    <p className="text-xs text-muted-foreground">{account.loanId} • {account.phone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold">₹{(account.amountOverdue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">{account.daysOverdue} DPD</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getBucketColor(account.bucket)}`}>
                    {account.bucket === "high_risk" ? "61-90 DPD" : account.bucket === "npa" ? "90+ DPD" : `${account.daysOverdue} DPD`}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(account.status)}`}>
                    {account.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Next: {new Date(account.nextActionDate).toLocaleDateString()}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}

          {filteredCollections.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No accounts found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-surface border border-border rounded-xl p-6">
          {selectedAccount ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-foreground/10 rounded-full flex items-center justify-center font-bold">
                    {selectedAccount.borrowerName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-bold">{selectedAccount.borrowerName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAccount.loanId}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-foreground/5 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="font-bold">₹{(selectedAccount.amountOutstanding / 100000).toFixed(2)}L</p>
                  </div>
                  <div className="bg-foreground/5 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Overdue</p>
                    <p className="font-bold text-orange-400">₹{(selectedAccount.amountOverdue / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Call
                  </button>
                  <button className="py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" /> SMS
                  </button>
                  <button className="py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Promise
                  </button>
                  <button className="py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Notice
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-sm font-semibold mb-3">Activity Timeline</p>
                <div className="space-y-3">
                  {selectedAccount.notes.length > 0 ? (
                    selectedAccount.notes.map(note => (
                      <div key={note.id} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium capitalize">{note.type}</span>
                            <span className="text-xs text-muted-foreground">{note.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{note.outcome}</p>
                          <p className="text-xs text-muted-foreground mt-1">by {note.agent}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Agent Info */}
              <div className="bg-foreground/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="font-medium">{selectedAccount.assignedAgent}</p>
                  </div>
                  <button className="p-2 hover:bg-foreground/10 rounded-lg">
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select an account to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}