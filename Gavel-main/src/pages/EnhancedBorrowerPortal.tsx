import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/contexts/ThemeContext";
import {
  FileText, Download, CheckCircle2, Clock, AlertCircle, TrendingDown,
  DollarSign, Calendar, Building2, Phone, Mail, ArrowRight,
  ChevronDown, RefreshCw, Heart, Share2, Copy, Check
} from "lucide-react";
import { toast } from "sonner";

interface LoanDetails {
  loanId: string;
  applicantName: string;
  loanAmount: number;
  disbursedAmount: number;
  remainingAmount: number;
  status: "Active" | "Closed" | "Default" | "Overdue" | "Pending Disbursal";
  interestRate: number;
  tenure: number; // in months
  startDate: string;
  endDate: string;
  emiAmount: number;
  nextEmiDate: string;
  emisCompleted: number;
  emisPending: number;
  lenderName: string;
  lenderPhone: string;
  lenderEmail: string;
  documents: {
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }[];
  paymentHistory: {
    date: string;
    amount: number;
    status: "Completed" | "Pending" | "Overdue";
  }[];
}

// Mock data - replace with actual API call
const getMockLoanData = (): LoanDetails => ({
  loanId: "LOAN-2024-001234",
  applicantName: "Rajesh Kumar",
  loanAmount: 500000,
  disbursedAmount: 500000,
  remainingAmount: 380000,
  status: "Active",
  interestRate: 12.5,
  tenure: 36,
  startDate: "2024-03-15",
  endDate: "2027-03-15",
  emiAmount: 16154,
  nextEmiDate: "2026-06-15",
  emisCompleted: 14,
  emisPending: 22,
  lenderName: "Gavel Finance",
  lenderPhone: "+91 9876543210",
  lenderEmail: "support@gavelfinance.com",
  documents: [
    { name: "Loan Agreement", type: "PDF", url: "#", uploadedAt: "2024-03-15" },
    { name: "Sanction Letter", type: "PDF", url: "#", uploadedAt: "2024-03-15" },
  ],
  paymentHistory: [
    { date: "2026-05-15", amount: 16154, status: "Completed" },
    { date: "2026-04-15", amount: 16154, status: "Completed" },
    { date: "2026-03-15", amount: 16154, status: "Completed" },
  ],
});

const EMICalculator = ({
  principal,
  rate,
  months,
}: {
  principal: number;
  rate: number;
  months: number;
}) => {
  const monthlyRate = rate / 100 / 12;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  const totalAmount = emi * months;
  const totalInterest = totalAmount - principal;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Monthly EMI:</span>
        <span className="font-semibold">₹{Math.round(emi).toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total Interest:</span>
        <span className="font-semibold">₹{Math.round(totalInterest).toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total Amount:</span>
        <span className="font-semibold">₹{Math.round(totalAmount).toLocaleString()}</span>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
    Active: { bg: "bg-green-500/10", text: "text-green-600", icon: CheckCircle2 },
    Closed: { bg: "bg-blue-500/10", text: "text-blue-600", icon: CheckCircle2 },
    Default: { bg: "bg-red-500/10", text: "text-red-600", icon: AlertCircle },
    Overdue: { bg: "bg-orange-500/10", text: "text-orange-600", icon: AlertCircle },
    "Pending Disbursal": { bg: "bg-yellow-500/10", text: "text-yellow-600", icon: Clock },
  };

  const config = statusConfig[status] || statusConfig.Active;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 w-fit`}>
      <Icon className="w-4 h-4" />
      {status}
    </div>
  );
};

export default function BorrowerPortal() {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // In production, fetch actual loan data using loanId
    setLoan(getMockLoanData());
  }, [loanId]);

  if (!loan) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const progressPercentage = (loan.emisCompleted / (loan.emisCompleted + loan.emisPending)) * 100;
  const hasOverduePayment = loan.paymentHistory.some((p) => p.status === "Overdue");

  const handleDownloadDocument = (docName: string) => {
    toast.success(`Downloading ${docName}...`);
  };

  const handleCopyLoanId = () => {
    navigator.clipboard.writeText(loan.loanId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <Navbar />

      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Loan Account</p>
              <h1 className="font-['DM_Sans'] font-bold text-4xl mb-4">Welcome back, {loan.applicantName}!</h1>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm bg-surface px-3 py-1 rounded border border-border">
                  {loan.loanId}
                </code>
                <button
                  onClick={handleCopyLoanId}
                  className="p-1 hover:bg-surface rounded transition-colors"
                  title="Copy Loan ID"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <StatusBadge status={loan.status} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Alert Banner */}
        {hasOverduePayment && (
          <div className="mb-8 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-600 mb-1">Payment Overdue</p>
              <p className="text-sm text-muted-foreground">
                You have an overdue payment. Please contact your lender immediately to avoid penalties.
              </p>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Loan Amount",
              value: `₹${loan.loanAmount.toLocaleString()}`,
              icon: DollarSign,
              color: "text-blue-500",
            },
            {
              label: "Monthly EMI",
              value: `₹${loan.emiAmount.toLocaleString()}`,
              icon: Calendar,
              color: "text-green-500",
            },
            {
              label: "Remaining",
              value: `₹${loan.remainingAmount.toLocaleString()}`,
              icon: TrendingDown,
              color: "text-orange-500",
            },
            {
              label: "EMI Status",
              value: `${loan.emisCompleted}/${loan.emisCompleted + loan.emisPending}`,
              icon: Clock,
              color: "text-purple-500",
            },
          ].map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={i} className="bg-surface border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <Icon className={`${metric.color} w-5 h-5`} />
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
            );
          })}
        </div>

        {/* EMI Progress */}
        <div className="bg-surface border border-border rounded-lg p-8 mb-8">
          <h2 className="font-bold text-lg mb-6">Loan Repayment Progress</h2>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-muted-foreground">
                {loan.emisCompleted} of {loan.emisCompleted + loan.emisPending} EMIs completed
              </span>
              <span className="text-sm font-semibold">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Loan Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-semibold">{new Date(loan.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maturity Date:</span>
                  <span className="font-semibold">{new Date(loan.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Rate:</span>
                  <span className="font-semibold">{loan.interestRate}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next EMI Date:</span>
                  <span className="font-semibold text-green-500">{new Date(loan.nextEmiDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">EMI Breakdown</p>
              <EMICalculator principal={loan.loanAmount} rate={loan.interestRate} months={loan.tenure} />
            </div>
          </div>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {/* Payment History */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "payments" ? null : "payments")}
              className="w-full p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">Payment History</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  expandedSection === "payments" ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedSection === "payments" && (
              <div className="border-t border-border px-6 py-4">
                <div className="space-y-3">
                  {loan.paymentHistory.map((payment, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-foreground/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            payment.status === "Completed"
                              ? "bg-green-500"
                              : payment.status === "Overdue"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <p className="font-semibold">{new Date(payment.date).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{payment.status}</p>
                        </div>
                      </div>
                      <span className="font-bold">₹{payment.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "documents" ? null : "documents")}
              className="w-full p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">Loan Documents</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  expandedSection === "documents" ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedSection === "documents" && (
              <div className="border-t border-border px-6 py-4">
                <div className="space-y-2">
                  {loan.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-foreground/5 rounded-lg hover:bg-foreground/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-semibold text-sm">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">Uploaded {doc.uploadedAt}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadDocument(doc.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-5 h-5 text-primary hover:text-orange-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Support */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "support" ? null : "support")}
              className="w-full p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">Lender Contact</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  expandedSection === "support" ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedSection === "support" && (
              <div className="border-t border-border px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lender Name</p>
                    <p className="font-semibold">{loan.lenderName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <a href={`tel:${loan.lenderPhone}`} className="font-semibold text-primary hover:underline">
                      {loan.lenderPhone}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <a href={`mailto:${loan.lenderEmail}`} className="font-semibold text-primary hover:underline">
                      {loan.lenderEmail}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/30 rounded-lg p-8 text-center">
          <h3 className="font-bold text-xl mb-2">Need help with your loan?</h3>
          <p className="text-muted-foreground mb-6">
            Contact our support team or check out resources to manage your account better.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg">
              Chat Support
            </button>
            <button className="border border-border hover:bg-foreground/5 text-foreground font-semibold px-6 py-2 rounded-lg">
              View FAQs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
