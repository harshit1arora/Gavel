import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, Search, DollarSign, Calendar, CheckCircle, Clock,
  AlertCircle, Phone, Mail, FileText, Shield, ArrowRight,
  Download, ChevronRight, Building2, Hash
} from "lucide-react";
import { toast } from "sonner";

interface LoanDetails {
  id: string;
  borrowerName: string;
  loanAmount: number;
  outstandingAmount: number;
  emiAmount: number;
  nextPaymentDate: string;
  lastPaymentDate: string;
  paymentHistory: {
    date: string;
    amount: number;
    mode: string;
    reference: string;
  }[];
  bankName: string;
  accountNumber: string;
  ifscCode: number;
}

const mockLoanData: Record<string, LoanDetails> = {
  "LN20240001": {
    id: "LN20240001",
    borrowerName: "Rajesh Kumar",
    loanAmount: 450000,
    outstandingAmount: 385000,
    emiAmount: 14500,
    nextPaymentDate: "2024-04-15",
    lastPaymentDate: "2024-03-15",
    paymentHistory: [
      { date: "2024-03-15", amount: 14500, mode: "UPI", reference: "UPI7823456789" },
      { date: "2024-02-15", amount: 14500, mode: "Bank Transfer", reference: "NEFT9876543210" },
      { date: "2024-01-15", amount: 14500, mode: "UPI", reference: "UPI6723456789" },
      { date: "2023-12-15", amount: 14500, mode: "Bank Transfer", reference: "NEFT5678901234" },
    ],
    bankName: "HDFC Bank",
    accountNumber: "50200012345678",
    ifscCode: 1234
  },
  "LN20240002": {
    id: "LN20240002",
    borrowerName: "Priya Sharma",
    loanAmount: 280000,
    outstandingAmount: 245000,
    emiAmount: 9200,
    nextPaymentDate: "2024-04-20",
    lastPaymentDate: "2024-03-20",
    paymentHistory: [
      { date: "2024-03-20", amount: 9200, mode: "UPI", reference: "UPI8912345678" },
      { date: "2024-02-20", amount: 9200, mode: "Bank Transfer", reference: "NEFT6789012345" },
      { date: "2024-01-20", amount: 9200, mode: "UPI", reference: "UPI5612345678" },
    ],
    bankName: "ICICI Bank",
    accountNumber: "123456789012",
    ifscCode: 5678
  }
};

export default function BorrowerPayment() {
  const [loanId, setLoanId] = useState("");
  const [loanData, setLoanData] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSearch = () => {
    if (!loanId.trim()) {
      toast.error("Please enter your Loan ID");
      return;
    }
    
    setLoading(true);
    
    setTimeout(() => {
      const data = mockLoanData[loanId.toUpperCase()];
      if (data) {
        setLoanData(data);
        toast.success("Loan found!");
      } else {
        setLoanData(null);
        toast.error("Loan not found. Please check your Loan ID.");
      }
      setLoading(false);
    }, 1000);
  };

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  const handleRazorpayRedirect = () => {
    setShowPaymentModal(false);
    toast.success("Redirecting to Razorpay... (Demo mode)");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-surface/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Gavel AI</h1>
              <p className="text-xs text-muted-foreground">Borrower Portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Need help?</p>
            <p className="text-xs text-muted-foreground">support@gavel.ai • 1800-XXX-XXXX</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Search Section */}
        <div className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/30 rounded-2xl p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="font-bold text-2xl mb-2">Make Your Loan Payment</h2>
            <p className="text-muted-foreground">Enter your Loan ID to view payment details and make a payment</p>
          </div>
          
          <div className="flex items-center gap-4 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Enter Loan ID (e.g., LN20240001)"
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-lg"
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 text-white rounded-lg font-medium flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find Loan
                </>
              )}
            </button>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't know your Loan ID? Contact us at support@gavel.ai or call 1800-XXX-XXXX
          </p>
        </div>

        {/* Loan Details */}
        {loanData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overview Card */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Borrower</p>
                  <p className="text-xl font-bold">{loanData.borrowerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Loan ID</p>
                  <p className="text-xl font-mono font-bold">{loanData.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-foreground/5 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                  <p className="text-2xl font-bold">₹{(loanData.loanAmount / 100000).toFixed(1)}L</p>
                </div>
                <div className="bg-foreground/5 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-400">₹{(loanData.outstandingAmount / 100000).toFixed(1)}L</p>
                </div>
                <div className="bg-foreground/5 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Monthly EMI</p>
                  <p className="text-2xl font-bold">₹{loanData.emiAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Payment Due Card */}
              <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Payment Due</p>
                    <p className="text-3xl font-bold">₹{loanData.emiAmount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due on {new Date(loanData.nextPaymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <button 
                    onClick={handlePayment}
                    className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg flex items-center gap-2"
                  >
                    Pay Now <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Payment History</h3>
              <div className="space-y-3">
                {loanData.paymentHistory.map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-foreground/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{payment.mode} • {payment.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-green-400" />
                <h3 className="font-bold text-lg">Bank Account Details (for NEFT/IMPS)</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-foreground/5 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-bold text-lg">{loanData.bankName}</p>
                </div>
                <div className="bg-foreground/5 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-bold text-lg font-mono">{loanData.accountNumber}</p>
                </div>
                <div className="bg-foreground/5 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">IFSC Code</p>
                  <p className="font-bold text-lg font-mono">GAVEL{loanData.ifscCode}XXXX</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Use your Loan ID ({loanData.id}) as payment reference
              </p>
            </div>

            {/* Help Section */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Need Help?</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Call Us</p>
                    <p className="text-sm text-muted-foreground">1800-XXX-XXXX (9AM-6PM)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@gavel.ai</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* No Loan Found Message */}
        {!loanData && (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Enter your Loan ID above to view payment details</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl w-[450px]">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl">Make Payment</h2>
                <button onClick={() => setShowPaymentModal(false)} className="text-muted-foreground hover:text-foreground text-2xl">
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-foreground/5 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Loan ID</span>
                  <span className="font-mono font-bold">{loanData?.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount to Pay</span>
                  <span className="text-2xl font-bold">₹{loanData?.emiAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <button 
                  onClick={handleRazorpayRedirect}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Pay via Razorpay
                </button>
                <button className="w-full py-4 border border-border rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-foreground/10">
                  <Building2 className="w-5 h-5" />
                  Pay via Bank Transfer (NEFT/IMPS)
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                🔒 Secure payment powered by Razorpay. Your transaction is encrypted and secure.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}