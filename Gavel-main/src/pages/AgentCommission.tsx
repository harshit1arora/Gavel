import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Users, DollarSign, TrendingUp, Trophy, Award, Star, Calendar,
  Download, Search, Filter, ChevronDown, Phone, Mail, MapPin,
  Clock, CheckCircle, XCircle, AlertCircle, FileText, CreditCard,
  Building2, Target, Activity, Gift, Wallet
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinedDate: string;
  status: "active" | "inactive" | "suspended";
  totalLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  disbursedAmount: number;
  totalCommission: number;
  pendingPayout: number;
  disbursedPayout: number;
  approvalRate: number;
  avgTicketSize: number;
  rank: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  kycStatus: "verified" | "pending" | "rejected";
  documents: {
    aadhaar: boolean;
    pan: boolean;
    bankAccount: boolean;
    photo: boolean;
  };
  monthlyPerformance: {
    month: string;
    loans: number;
    approved: number;
    commission: number;
  }[];
}

const generateAgents = (): Agent[] => {
  const names = [
    "Raj Kumar", "Priya Singh", "Vikram Singh", "Anita Devi", "Suresh Patel",
    "Amit Sharma", "Sunita Rani", "Ramesh Gupta", "Kavita Devi", "Mahesh Joshi",
    "Rohit Verma", "Pooja Sharma", "Ajay Kumar", "Neha Singh", "Vijay Malhotra"
  ];
  
  const locations = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"];
  const tiers: Agent["tier"][] = ["bronze", "silver", "gold", "platinum"];
  const statuses: Agent["status"][] = ["active", "active", "active", "inactive"];
  
  return names.map((name, idx) => {
    const totalLoans = Math.floor(Math.random() * 50) + 10;
    const approvedLoans = Math.floor(totalLoans * (0.5 + Math.random() * 0.3));
    const disbursedAmount = approvedLoans * (50000 + Math.floor(Math.random() * 200000));
    const commission = Math.round(disbursedAmount * 0.02);
    const pendingPayout = Math.round(commission * (0.2 + Math.random() * 0.3));
    const approvalRate = Math.round((approvedLoans / totalLoans) * 100);
    
    return {
      id: `AGT-${String(idx + 1).padStart(4, "0")}`,
      name,
      email: `${name.toLowerCase().replace(" ", ".")}@email.com`,
      phone: `+91 98765 ${String(Math.floor(Math.random() * 90000) + 10000)}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      joinedDate: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      totalLoans,
      approvedLoans,
      rejectedLoans: totalLoans - approvedLoans,
      disbursedAmount,
      totalCommission: commission,
      pendingPayout,
      disbursedPayout: commission - pendingPayout,
      approvalRate,
      avgTicketSize: Math.round(disbursedAmount / approvedLoans),
      rank: idx + 1,
      tier: tiers[Math.min(Math.floor(idx / 4), 3)],
      kycStatus: Math.random() > 0.1 ? "verified" : "pending",
      documents: {
        aadhaar: Math.random() > 0.1,
        pan: Math.random() > 0.1,
        bankAccount: Math.random() > 0.2,
        photo: Math.random() > 0.3
      },
      monthlyPerformance: [
        { month: "Nov", loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
        { month: "Dec", loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
        { month: "Jan", loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
        { month: "Feb", loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
        { month: "Mar", loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
      ]
    };
  });
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case "platinum": return "bg-gradient-to-r from-slate-400 to-slate-600 text-white";
    case "gold": return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    case "silver": return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    case "bronze": return "bg-gradient-to-r from-orange-300 to-orange-500 text-white";
    default: return "bg-gray-500 text-white";
  }
};

const getTierBenefits = (tier: string) => {
  switch (tier) {
    case "platinum": return { commission: "4%", bonus: "₹50,000", access: "All features" };
    case "gold": return { commission: "3%", bonus: "₹25,000", access: "Priority support" };
    case "silver": return { commission: "2.5%", bonus: "₹10,000", access: "Standard support" };
    case "bronze": return { commission: "2%", bonus: "₹5,000", access: "Basic support" };
    default: return { commission: "2%", bonus: "₹0", access: "Basic support" };
  }
};

export default function AgentCommission() {
  const { orgId, user } = useAuth();
  const [agents] = useState<Agent[]>(generateAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddAgent, setShowAddAgent] = useState(false);

  const metrics = useMemo(() => {
    const activeAgents = agents.filter(a => a.status === "active");
    const totalLoans = agents.reduce((sum, a) => sum + a.totalLoans, 0);
    const approvedLoans = agents.reduce((sum, a) => sum + a.approvedLoans, 0);
    const totalCommission = agents.reduce((sum, a) => sum + a.totalCommission, 0);
    const pendingPayout = agents.reduce((sum, a) => sum + a.pendingPayout, 0);
    
    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalLoans,
      approvedLoans,
      approvalRate: totalLoans > 0 ? Math.round((approvedLoans / totalLoans) * 100) : 0,
      totalCommission,
      pendingPayout,
      topPerformer: agents.sort((a, b) => b.totalCommission - a.totalCommission)[0]
    };
  }, [agents]);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = searchQuery === "" || 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.phone.includes(searchQuery) ||
      agent.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const leaderboard = [...agents].sort((a, b) => b.totalCommission - a.totalCommission).slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="border-b border-border bg-surface/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-['DM_Sans'] font-bold text-3xl">Agent & DSA Commission</h1>
              <p className="font-['DM_Sans'] text-muted-foreground mt-1">
                Manage agents, track performance, and process commissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-border rounded-lg flex items-center gap-2 hover:bg-foreground/10">
                <Download className="w-4 h-4" /> Export
              </button>
              <button 
                onClick={() => setShowAddAgent(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Add Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Agents</span>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.totalAgents}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.activeAgents} active</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Loans Processed</span>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.totalLoans}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.approvalRate}% approval rate</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Commission</span>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-400">₹{(metrics.totalCommission / 100000).toFixed(1)}L</p>
            <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Pending Payouts</span>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Wallet className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-400">₹{(metrics.pendingPayout / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting release</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Top Performer</span>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
            <p className="text-lg font-bold">{metrics.topPerformer?.name || "-"}</p>
            <p className="text-xs text-muted-foreground mt-1">₹{(metrics.topPerformer?.totalCommission || 0).toLocaleString()} earned</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="font-bold text-xl">Top Performers Leaderboard</h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {leaderboard.map((agent, idx) => (
              <div 
                key={agent.id}
                className={`text-center p-4 rounded-lg ${idx === 0 ? "bg-yellow-500/20" : "bg-foreground/5"}`}
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-foreground/20 flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <p className="font-semibold text-sm">{agent.name}</p>
                <p className="text-xs text-muted-foreground">{agent.totalLoans} loans</p>
                <p className="text-lg font-bold text-green-400 mt-1">₹{(agent.totalCommission / 1000).toFixed(0)}K</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs mt-2 ${getTierColor(agent.tier)}`}>
                  {agent.tier}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter & Search */}
        <div className="bg-surface border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search by name, phone, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm w-64"
                />
              </div>
              
              <div className="flex gap-1 bg-background border border-border rounded-lg p-1">
                {[
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "inactive", label: "Inactive" },
                  { key: "suspended", label: "Suspended" }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      statusFilter === filter.key 
                        ? "bg-orange-500 text-white" 
                        : "text-muted-foreground hover:bg-foreground/10"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-sm text-muted-foreground">{filteredAgents.length} agents</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="col-span-2 space-y-3 max-h-[600px] overflow-y-auto">
            {filteredAgents.map(agent => (
              <motion.div 
                key={agent.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedAgent(agent)}
                className={`bg-surface border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/40 ${
                  selectedAgent?.id === agent.id ? "border-orange-500 ring-1 ring-orange-500/20" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-foreground/10 rounded-full flex items-center justify-center font-bold text-lg">
                      {agent.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{agent.name}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${getTierColor(agent.tier)}`}>
                          {agent.tier}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{agent.location} • {agent.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">₹{(agent.totalCommission / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">Total earned</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Loans:</span> {agent.totalLoans}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Approved:</span> <span className="text-green-400">{agent.approvedLoans}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate:</span> {agent.approvalRate}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      agent.status === "active" ? "bg-green-500/20 text-green-400" :
                      agent.status === "inactive" ? "bg-gray-500/20 text-gray-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {agent.status}
                    </span>
                    {agent.kycStatus === "verified" && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Agent Detail Panel */}
          <div className="bg-surface border border-border rounded-xl p-6 max-h-[600px] overflow-y-auto">
            {selectedAgent ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-foreground/10 rounded-full flex items-center justify-center font-bold text-2xl">
                    {selectedAgent.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h3 className="font-bold text-xl">{selectedAgent.name}</h3>
                  <span className={`inline-block px-3 py-1 rounded text-sm mt-2 ${getTierColor(selectedAgent.tier)}`}>
                    {selectedAgent.tier.toUpperCase()} Tier
                  </span>
                </div>

                {/* Commission Summary */}
                <div className="bg-foreground/5 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">Commission Summary</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-green-400">₹{(selectedAgent.totalCommission / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">Total Earned</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-orange-400">₹{(selectedAgent.pendingPayout / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>

                {/* Tier Benefits */}
                <div className={`rounded-lg p-4 ${getTierColor(selectedAgent.tier).replace("text-white", "text").split(" ")[0]} bg-opacity-10 border border-current`}>
                  <h4 className="font-semibold text-sm mb-3">Tier Benefits</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-70">Commission Rate</span>
                      <span className="font-semibold">{getTierBenefits(selectedAgent.tier).commission}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Quarterly Bonus</span>
                      <span className="font-semibold">{getTierBenefits(selectedAgent.tier).bonus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Support Level</span>
                      <span className="font-semibold">{getTierBenefits(selectedAgent.tier).access}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-foreground/5 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">Monthly Performance</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={selectedAgent.monthlyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#888" fontSize={10} />
                      <YAxis stroke="#888" fontSize={10} />
                      <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                      <Bar dataKey="loans" fill="#3B82F6" name="Total" />
                      <Bar dataKey="approved" fill="#22C55E" name="Approved" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* KYC Status */}
                <div className="bg-foreground/5 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">KYC Documents</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Aadhaar", status: selectedAgent.documents.aadhaar },
                      { label: "PAN Card", status: selectedAgent.documents.pan },
                      { label: "Bank Account", status: selectedAgent.documents.bankAccount },
                      { label: "Photo", status: selectedAgent.documents.photo }
                    ].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{doc.label}</span>
                        {doc.status ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Call
                  </button>
                  <button className="py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </button>
                </div>

                {/* Payout Actions */}
                <button className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" /> Process Payout
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Select an agent to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-[500px]">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl">Add New Agent</h2>
                <button onClick={() => setShowAddAgent(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name *</label>
                  <input type="text" className="w-full p-2 bg-background border border-border rounded-lg text-sm" placeholder="Enter full name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone *</label>
                  <input type="tel" className="w-full p-2 bg-background border border-border rounded-lg text-sm" placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <input type="email" className="w-full p-2 bg-background border border-border rounded-lg text-sm" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Location *</label>
                  <select className="w-full p-2 bg-background border border-border rounded-lg text-sm">
                    <option>Select city...</option>
                    <option>Delhi</option>
                    <option>Mumbai</option>
                    <option>Bangalore</option>
                    <option>Chennai</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowAddAgent(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-foreground/10">
                Cancel
              </button>
              <button onClick={() => { setShowAddAgent(false); toast.success("Agent added successfully"); }} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
                Add Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}