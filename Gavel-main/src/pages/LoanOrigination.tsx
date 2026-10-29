import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Upload, FileSpreadsheet, Users, CreditCard, CheckCircle, Clock, 
  XCircle, AlertCircle, Search, Filter, Download, Send, Eye,
  Plus, Trash2, Edit, RefreshCw, Building2, Shield, Zap, FileText,
  ChevronRight, ChevronDown, Settings, Database, Play, Pause
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { apiWithAuth } from "@/lib/api-client";
import { exportToCSV } from "@/lib/exportUtils";

interface LoanApplication {
  id: string;
  referenceId: string;
  applicantName: string;
  phone: string;
  email: string;
  aadhaar: string;
  pan: string;
  dob: string;
  gender: string;
  employmentType: string;
  employerName: string;
  monthlyIncome: number;
  loanAmount: number;
  tenure: number;
  purpose: string;
  pincode: string;
  city: string;
  state: string;
  status: "pending" | "processing" | "approved" | "rejected" | "kyc_pending" | "kyc_verified" | "documents_pending" | "documents_verified";
  score: number | null;
  decision: "approved" | "rejected" | "pending" | "review";
  decisionReason: string;
  submittedAt: string;
  processedAt: string | null;
  riskFlags: string[];
  bankStatements: boolean;
  idProof: boolean;
  addressProof: boolean;
  incomeProof: boolean;
  agentId: string;
  agentName: string;
}

interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "email" | "phone" | "file";
  required: boolean;
  category: "personal" | "employment" | "loan" | "address" | "documents";
  options?: string[];
  placeholder?: string;
  validation?: string;
}

const generateMockApplications = (): LoanApplication[] => {
  const names = [
    "Rajesh Kumar", "Priya Sharma", "Mahendra Singh", "Anita Devi", "Suresh Patel",
    "Vijay Malhotra", "Sunita Rani", "Arun Joshi", "Kavita Devi", "Rajendra Prasad",
    "Geeta Sharma", "Mohan Lal", "Pushpa Devi", "Ajay Kumar", "Meena Kumari",
    "Vikram Singh", "Anil Kumar", "Ramesh Gupta", "Sanjay Sharma", "Vijay Kumar"
  ];
  
  const statuses: LoanApplication["status"][] = [
    "pending", "processing", "approved", "rejected", "kyc_pending", 
    "kyc_verified", "documents_pending", "documents_verified"
  ];
  
  const purposes = ["Home Loan", "Personal Loan", "Business Loan", "Vehicle Loan", "Education Loan"];
  const employmentTypes = ["Salaried", "Self-Employed", "Business Owner", "Freelancer", "Retired"];
  const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"];
  const states = ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal", "Telangana", "Maharashtra"];
  
  return names.map((name, idx) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isApproved = status === "approved" || status === "documents_verified" || status === "kyc_verified";
    const isRejected = status === "rejected";
    
    return {
      id: `APP-${String(idx + 1).padStart(5, "0")}`,
      referenceId: `REF${Date.now().toString().slice(-8)}${idx}`,
      applicantName: name,
      phone: `+91 98765 ${String(Math.floor(Math.random() * 90000) + 10000)}`,
      email: `${name.toLowerCase().replace(" ", ".")}@email.com`,
      aadhaar: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
      pan: `ABCDE${String(Math.floor(Math.random() * 1000000)).padStart(5, "0")}F`,
      dob: `${Math.floor(Math.random() * 28) + 1}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 30) + 1975}`,
      gender: Math.random() > 0.5 ? "Male" : "Female",
      employmentType: employmentTypes[Math.floor(Math.random() * employmentTypes.length)],
      employerName: `${name.split(" ")[0]} Industries`,
      monthlyIncome: Math.floor(Math.random() * 80000) + 15000,
      loanAmount: Math.floor(Math.random() * 900000) + 50000,
      tenure: Math.floor(Math.random() * 36) + 6,
      purpose: purposes[Math.floor(Math.random() * purposes.length)],
      pincode: String(Math.floor(Math.random() * 90000) + 10000),
      city: cities[Math.floor(Math.random() * cities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      status,
      score: isApproved ? Math.floor(Math.random() * 30) + 70 : isRejected ? Math.floor(Math.random() * 40) + 20 : null,
      decision: isApproved ? "approved" : isRejected ? "rejected" : status === "processing" ? "review" : "pending",
      decisionReason: isApproved ? "Income meets criteria, good credit history" : isRejected ? "Credit score below threshold" : "",
      submittedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
      processedAt: isApproved || isRejected ? new Date().toISOString() : null,
      riskFlags: Math.random() > 0.7 ? ["High debt-to-income ratio", "Multiple inquiries"] : [],
      bankStatements: Math.random() > 0.2,
      idProof: Math.random() > 0.1,
      addressProof: Math.random() > 0.3,
      incomeProof: Math.random() > 0.25,
      agentId: `AGT-${Math.floor(Math.random() * 10) + 1}`,
      agentName: ["Raj Kumar", "Priya Singh", "Vikram Singh", "Anita Devi", "Suresh Patel"][Math.floor(Math.random() * 5)]
    };
  });
};

const defaultFormFields: FormField[] = [
  { id: "applicantName", label: "Full Name", type: "text", required: true, category: "personal", placeholder: "Enter full name as per ID" },
  { id: "phone", label: "Phone Number", type: "phone", required: true, category: "personal", placeholder: "+91 XXXXX XXXXX" },
  { id: "email", label: "Email Address", type: "email", required: true, category: "personal", placeholder: "email@example.com" },
  { id: "dob", label: "Date of Birth", type: "date", required: true, category: "personal" },
  { id: "gender", label: "Gender", type: "select", required: true, category: "personal", options: ["Male", "Female", "Other"] },
  { id: "aadhaar", label: "Aadhaar Number", type: "number", required: true, category: "personal", placeholder: "12-digit Aadhaar" },
  { id: "pan", label: "PAN Number", type: "text", required: true, category: "personal", placeholder: "ABCDE1234F" },
  { id: "employmentType", label: "Employment Type", type: "select", required: true, category: "employment", options: ["Salaried", "Self-Employed", "Business Owner", "Freelancer"] },
  { id: "employerName", label: "Employer/Business Name", type: "text", required: true, category: "employment", placeholder: "Company or business name" },
  { id: "monthlyIncome", label: "Monthly Income (₹)", type: "number", required: true, category: "employment", placeholder: "Enter monthly income" },
  { id: "loanAmount", label: "Requested Loan Amount (₹)", type: "number", required: true, category: "loan", placeholder: "50000 - 5000000" },
  { id: "tenure", label: "Preferred Tenure (months)", type: "select", required: true, category: "loan", options: ["6", "12", "18", "24", "36", "48", "60"] },
  { id: "purpose", label: "Loan Purpose", type: "select", required: true, category: "loan", options: ["Personal", "Home", "Business", "Vehicle", "Education", "Medical"] },
  { id: "pincode", label: "Pincode", type: "number", required: true, category: "address", placeholder: "6-digit pincode" },
  { id: "city", label: "City", type: "text", required: true, category: "address" },
  { id: "state", label: "State", type: "select", required: true, category: "address", options: ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal", "Telangana", "Gujarat", "Rajasthan"] },
];

export default function LoanOrigination() {
  const { orgId, user } = useAuth();
  const [applications, setApplications] = useState<LoanApplication[]>(generateMockApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [showNewAppForm, setShowNewAppForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>(defaultFormFields);
  const [processing, setProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);

  const metrics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === "pending").length;
    const approved = applications.filter(a => a.decision === "approved").length;
    const rejected = applications.filter(a => a.decision === "rejected").length;
    const kycPending = applications.filter(a => a.status === "kyc_pending").length;
    const docsPending = applications.filter(a => a.status === "documents_pending").length;
    
    return {
      total,
      pending,
      approved,
      rejected,
      kycPending,
      docsPending,
      approvalRate: total > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0,
      avgProcessingTime: "2.4 mins",
      kycVerificationRate: total > 0 ? Math.round(((total - kycPending) / total) * 100) : 0
    };
  }, [applications]);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === "" || 
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "processing": case "review": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "kyc_pending": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "kyc_verified": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "documents_pending": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "documents_verified": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "approved": return { bg: "bg-green-500", text: "Approved" };
      case "rejected": return { bg: "bg-red-500", text: "Rejected" };
      case "review": return { bg: "bg-orange-500", text: "Review" };
      default: return { bg: "bg-gray-500", text: "Pending" };
    }
  };

  const handleBulkProcess = () => {
    setProcessing(true);
    setProcessingCount(0);
    
    const interval = setInterval(() => {
      setProcessingCount(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          toast.success(`Processed ${applications.filter(a => a.status === "pending").length} applications`);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleKYCFetch = (appId: string) => {
    toast.success("KYC data fetched from UIDAI");
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: "kyc_verified" as const } : a));
  };

  const handleApprove = (appId: string) => {
    toast.success("Application approved");
    setApplications(prev => prev.map(a => a.id === appId ? { 
      ...a, 
      status: "approved" as const,
      decision: "approved" as const,
      score: Math.floor(Math.random() * 30) + 70,
      processedAt: new Date().toISOString()
    } : a));
  };

  const handleReject = (appId: string) => {
    toast.error("Application rejected");
    setApplications(prev => prev.map(a => a.id === appId ? { 
      ...a, 
      status: "rejected" as const,
      decision: "rejected" as const,
      score: Math.floor(Math.random() * 40) + 10,
      processedAt: new Date().toISOString()
    } : a));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="border-b border-border bg-surface/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-['DM_Sans'] font-bold text-3xl">Loan Origination</h1>
              <p className="font-['DM_Sans'] text-muted-foreground mt-1">
                Application intake, KYC verification, and batch processing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 border border-border rounded-lg flex items-center gap-2 hover:bg-foreground/10"
              >
                <FileSpreadsheet className="w-4 h-4" /> Bulk Upload CSV
              </button>
              <button 
                onClick={() => setShowNewAppForm(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Application
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
              <span className="text-sm text-muted-foreground">Total Applications</span>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.total}</p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Pending Review</span>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-400">{metrics.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting decision</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Approval Rate</span>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-400">{metrics.approvalRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.approved} approved</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">KYC Pending</span>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-400">{metrics.kycPending}</p>
            <p className="text-xs text-muted-foreground mt-1">Verification needed</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Avg. Processing</span>
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.avgProcessingTime}</p>
            <p className="text-xs text-muted-foreground mt-1">Per application</p>
          </div>
        </div>

        {/* Processing Progress */}
        {processing && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Batch Processing</span>
              <span className="text-sm">{processingCount}%</span>
            </div>
            <div className="w-full bg-foreground/20 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${processingCount}%` }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Processing {applications.filter(a => a.status === "pending").length} applications...
            </p>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-surface border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search by name, reference, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm w-64"
                />
              </div>
              
              <div className="flex gap-1 bg-background border border-border rounded-lg p-1">
                {[
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "processing", label: "Processing" },
                  { key: "kyc_pending", label: "KYC" },
                  { key: "documents_pending", label: "Docs" },
                  { key: "approved", label: "Approved" },
                  { key: "rejected", label: "Rejected" }
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

            <div className="flex items-center gap-2">
              <button 
                onClick={handleBulkProcess}
                disabled={processing}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg flex items-center gap-2 text-sm"
              >
                <Play className="w-4 h-4" /> Process All Pending
              </button>
              <button 
                onClick={() => exportToCSV('applications.csv', applications)}
                className="px-4 py-2 border border-border rounded-lg flex items-center gap-2 text-sm hover:bg-foreground/10"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="col-span-2 space-y-3 max-h-[600px] overflow-y-auto">
            {filteredApplications.map(app => (
              <motion.div 
                key={app.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedApp(app)}
                className={`bg-surface border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/40 ${
                  selectedApp?.id === app.id ? "border-orange-500 ring-1 ring-orange-500/20" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center font-bold text-sm">
                      {app.applicantName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold">{app.applicantName}</p>
                      <p className="text-xs text-muted-foreground">{app.referenceId} • {app.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold">₹{(app.loanAmount / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground">{app.tenure} months</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(app.status)}`}>
                      {app.status.replace("_", " ")}
                    </span>
                    {app.decision !== "pending" && (
                      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getDecisionBadge(app.decision).bg}`}>
                        {getDecisionBadge(app.decision).text}
                      </span>
                    )}
                    {app.score && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        app.score >= 70 ? "bg-green-500/20 text-green-400" :
                        app.score >= 50 ? "bg-orange-500/20 text-orange-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        Score: {app.score}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredApplications.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No applications found.</p>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="bg-surface border border-border rounded-xl p-6 max-h-[600px] overflow-y-auto">
            {selectedApp ? (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-foreground/10 rounded-full flex items-center justify-center font-bold">
                      {selectedApp.applicantName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold">{selectedApp.applicantName}</h3>
                      <p className="text-sm text-muted-foreground">{selectedApp.referenceId}</p>
                    </div>
                  </div>
                  
                  {/* Status Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-foreground/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Loan Amount</p>
                      <p className="font-bold text-lg">₹{(selectedApp.loanAmount / 100000).toFixed(1)}L</p>
                    </div>
                    <div className="bg-foreground/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Monthly Income</p>
                      <p className="font-bold text-lg">₹{selectedApp.monthlyIncome.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* KYC Section */}
                <div className="bg-foreground/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">KYC Verification</h4>
                    {selectedApp.status === "kyc_pending" && (
                      <button 
                        onClick={() => handleKYCFetch(selectedApp.id)}
                        className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                      >
                        Fetch from UIDAI
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Aadhaar</span>
                      <span className={selectedApp.aadhaar ? "text-green-400" : "text-red-400"}>
                        {selectedApp.aadhaar ? "✓ Verified" : "✗ Missing"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">PAN</span>
                      <span className={selectedApp.pan ? "text-green-400" : "text-red-400"}>
                        {selectedApp.pan ? "✓ Verified" : "✗ Missing"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(selectedApp.status)}`}>
                        {selectedApp.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-foreground/5 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3">Documents</h4>
                  <div className="space-y-2">
                    {[
                      { label: "ID Proof", doc: selectedApp.idProof },
                      { label: "Address Proof", doc: selectedApp.addressProof },
                      { label: "Income Proof", doc: selectedApp.incomeProof },
                      { label: "Bank Statements", doc: selectedApp.bankStatements }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={item.doc ? "text-green-400" : "text-orange-400"}>
                          {item.doc ? "✓ Uploaded" : "⏳ Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision */}
                {selectedApp.decision !== "pending" && (
                  <div className={`rounded-lg p-4 ${selectedApp.decision === "approved" ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedApp.decision === "approved" ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className={`font-bold ${selectedApp.decision === "approved" ? "text-green-400" : "text-red-400"}`}>
                        {selectedApp.decision === "approved" ? "Approved" : "Rejected"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedApp.decisionReason}</p>
                    {selectedApp.score && (
                      <p className="text-sm mt-2">Credit Score: <span className="font-bold">{selectedApp.score}</span></p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {selectedApp.decision === "pending" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleApprove(selectedApp.id)}
                      className="py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleReject(selectedApp.id)}
                      className="py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}

                {/* Agent Info */}
                <div className="bg-foreground/5 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted by</p>
                      <p className="text-sm font-medium">{selectedApp.agentName}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Select an application to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Application Modal */}
      {showNewAppForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-[800px] max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl">New Loan Application</h2>
                <button onClick={() => setShowNewAppForm(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {formFields.filter(f => f.category === "personal").map(field => (
                  <div key={field.id}>
                    <label className="text-sm font-medium mb-1 block">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select className="w-full p-2 bg-background border border-border rounded-lg text-sm">
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type={field.type} 
                        placeholder={field.placeholder}
                        className="w-full p-2 bg-background border border-border rounded-lg text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button 
                onClick={() => setShowNewAppForm(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-foreground/10"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowNewAppForm(false);
                  toast.success("Application submitted for processing");
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-[500px]">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl">Bulk Upload Applications</h2>
                <button onClick={() => setShowBulkUpload(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-2">Drag & drop CSV file here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
                  Choose File
                </button>
              </div>
              <div className="mt-4 p-4 bg-foreground/5 rounded-lg">
                <p className="text-sm font-medium mb-2">CSV Format Requirements:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Required columns: applicantName, phone, email, aadhaar, pan, monthlyIncome, loanAmount</li>
                  <li>• Max 1000 rows per upload</li>
                  <li>• File size: Max 5MB</li>
                </ul>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button 
                onClick={() => setShowBulkUpload(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-foreground/10"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowBulkUpload(false);
                  toast.success("CSV uploaded. Processing 20 applications...");
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
              >
                Upload & Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}