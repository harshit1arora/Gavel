// Types and mock data for Phase 1: Disbursement Automation

export type DisburseStatus = 'Pending' | 'In Transit' | 'Completed' | 'Failed' | 'Recalled';
export type TrancheStatus = 'Pending' | 'In Transit' | 'Completed' | 'Failed';
export type TransferMethod = 'NEFT' | 'RTGS' | 'UPI' | 'IMPS';
export type CommType = 'SMS' | 'Email' | 'WhatsApp';
export type CommStatus = 'Sent' | 'Delivered' | 'Failed' | 'Pending';
export type AgreementStatus = 'Draft' | 'Generated' | 'Signed' | 'Executed';

export interface Tranche {
  id: string;
  amount: number;
  dueDate: string;
  status: TrancheStatus;
  disbursedDate?: string;
  method: TransferMethod;
  rrn?: string;
  proofNote?: string;
}

export interface Disbursement {
  id: string;
  loanId: string;
  applicationId: string;
  status: DisburseStatus;
  statusUpdatedAt?: string;
  tranches: Tranche[];
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  totalAmount: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  orgId: string;
  createdAt: string;
  purpose: string;
}

export interface BankAccount {
  id: string;
  maskedAccount: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  balance: number;
  lastFetched: string;
  isDefault: boolean;
  isVerified: boolean;
  accountType: 'Current' | 'Savings' | 'Escrow';
}

export interface LoanAgreementRecord {
  id: string;
  applicationId: string;
  borrowerName: string;
  loanAmount: number;
  tenure: string;
  interestRate: string;
  status: AgreementStatus;
  generatedAt?: string;
  borrowerEmail: string;
  purpose: string;
}

export interface CommLog {
  id: string;
  disbursementId: string;
  borrowerName: string;
  type: CommType;
  recipient: string;
  template: string;
  status: CommStatus;
  sentAt: string;
  message: string;
}

export interface CommTemplate {
  id: string;
  name: string;
  type: CommType;
  trigger: 'Approval' | 'Disbursement' | 'Reminder' | 'Rejection' | 'Receipt';
  subject?: string;
  body: string;
  isActive: boolean;
}

// ======================== MOCK DATA ========================

export const MOCK_DISBURSEMENTS: Disbursement[] = [
  {
    id: "D-4821",
    loanId: "L-7421",
    applicationId: "APP-88210",
    status: "In Transit",
    totalAmount: 500000,
    borrowerName: "Ramesh Kumar Sharma",
    borrowerPhone: "+91-98765-43210",
    borrowerEmail: "ramesh.sharma@gmail.com",
    bankName: "HDFC Bank",
    accountNumber: "XXXXX4521",
    ifscCode: "HDFC0001234",
    orgId: "public-demo-bank",
    createdAt: "2026-04-28T10:30:00Z",
    purpose: "Working Capital",
    tranches: [
      { id: "T1", amount: 200000, dueDate: "2026-04-29", status: "Completed", disbursedDate: "2026-04-29", method: "RTGS", rrn: "RRN-2042901" },
      { id: "T2", amount: 200000, dueDate: "2026-05-05", status: "In Transit", method: "NEFT", rrn: "RRN-2050501" },
      { id: "T3", amount: 100000, dueDate: "2026-05-15", status: "Pending", method: "NEFT" },
    ],
  },
  {
    id: "D-4822",
    loanId: "L-7422",
    applicationId: "APP-88211",
    status: "Pending",
    totalAmount: 250000,
    borrowerName: "Priya Agarwal",
    borrowerPhone: "+91-99887-76655",
    borrowerEmail: "priya.agarwal@outlook.com",
    bankName: "State Bank of India",
    accountNumber: "XXXXX8821",
    ifscCode: "SBIN0001234",
    orgId: "public-demo-bank",
    createdAt: "2026-05-01T14:00:00Z",
    purpose: "Business Expansion",
    tranches: [
      { id: "T1", amount: 125000, dueDate: "2026-05-07", status: "Pending", method: "IMPS" },
      { id: "T2", amount: 125000, dueDate: "2026-05-21", status: "Pending", method: "IMPS" },
    ],
  },
  {
    id: "D-4823",
    loanId: "L-7423",
    applicationId: "APP-88212",
    status: "Completed",
    totalAmount: 750000,
    borrowerName: "Mohammed Ali Khan",
    borrowerPhone: "+91-88776-54321",
    borrowerEmail: "mali.khan@businessmail.in",
    bankName: "Axis Bank",
    accountNumber: "XXXXX2211",
    ifscCode: "UTIB0001234",
    orgId: "public-demo-bank",
    createdAt: "2026-04-15T09:00:00Z",
    purpose: "Equipment Purchase",
    tranches: [
      { id: "T1", amount: 375000, dueDate: "2026-04-16", status: "Completed", disbursedDate: "2026-04-16", method: "RTGS", rrn: "RRN-1604001" },
      { id: "T2", amount: 375000, dueDate: "2026-04-30", status: "Completed", disbursedDate: "2026-04-30", method: "RTGS", rrn: "RRN-3004001" },
    ],
  },
  {
    id: "D-4824",
    loanId: "L-7424",
    applicationId: "APP-88213",
    status: "Failed",
    totalAmount: 150000,
    borrowerName: "Sunita Devi Verma",
    borrowerPhone: "+91-77665-44332",
    borrowerEmail: "sunita.verma@gmail.com",
    bankName: "ICICI Bank",
    accountNumber: "XXXXX6611",
    ifscCode: "ICIC0001234",
    orgId: "public-demo-bank",
    createdAt: "2026-05-02T11:00:00Z",
    purpose: "Medical Emergency",
    tranches: [
      { id: "T1", amount: 150000, dueDate: "2026-05-03", status: "Failed", method: "UPI", proofNote: "Account validation failed - IFSC mismatch" },
    ],
  },
  {
    id: "D-4825",
    loanId: "L-7425",
    applicationId: "APP-88214",
    status: "Pending",
    totalAmount: 1000000,
    borrowerName: "Arjun Mehta & Co.",
    borrowerPhone: "+91-99001-22334",
    borrowerEmail: "arjun.mehta@mehta-textiles.com",
    bankName: "Kotak Mahindra Bank",
    accountNumber: "XXXXX9900",
    ifscCode: "KKBK0001234",
    orgId: "public-demo-bank",
    createdAt: "2026-05-04T16:30:00Z",
    purpose: "Textile Inventory",
    tranches: [
      { id: "T1", amount: 300000, dueDate: "2026-05-08", status: "Pending", method: "RTGS" },
      { id: "T2", amount: 400000, dueDate: "2026-05-22", status: "Pending", method: "RTGS" },
      { id: "T3", amount: 300000, dueDate: "2026-06-05", status: "Pending", method: "RTGS" },
    ],
  },
];

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "BA-001",
    maskedAccount: "••••4521",
    ifscCode: "HDFC0001234",
    bankName: "HDFC Bank",
    accountHolderName: "Gavel Financial Services Pvt. Ltd.",
    balance: 42568320,
    lastFetched: "2 min ago",
    isDefault: true,
    isVerified: true,
    accountType: "Current",
  },
  {
    id: "BA-002",
    maskedAccount: "••••8821",
    ifscCode: "SBIN0004321",
    bankName: "State Bank of India",
    accountHolderName: "Gavel Financial Services Pvt. Ltd.",
    balance: 15234000,
    lastFetched: "5 min ago",
    isDefault: false,
    isVerified: true,
    accountType: "Escrow",
  },
  {
    id: "BA-003",
    maskedAccount: "••••2200",
    ifscCode: "ICIC0002134",
    bankName: "ICICI Bank",
    accountHolderName: "Gavel Financial Services Pvt. Ltd.",
    balance: 5680000,
    lastFetched: "12 min ago",
    isDefault: false,
    isVerified: false,
    accountType: "Savings",
  },
];

export const MOCK_AGREEMENTS: LoanAgreementRecord[] = [
  { id: "AGR-001", applicationId: "APP-88210", borrowerName: "Ramesh Kumar Sharma", loanAmount: 500000, tenure: "24 months", interestRate: "14.5%", status: "Signed", generatedAt: "2026-04-28T11:00:00Z", borrowerEmail: "ramesh.sharma@gmail.com", purpose: "Working Capital" },
  { id: "AGR-002", applicationId: "APP-88211", borrowerName: "Priya Agarwal", loanAmount: 250000, tenure: "12 months", interestRate: "16.0%", status: "Generated", generatedAt: "2026-05-01T14:30:00Z", borrowerEmail: "priya.agarwal@outlook.com", purpose: "Business Expansion" },
  { id: "AGR-003", applicationId: "APP-88212", borrowerName: "Mohammed Ali Khan", loanAmount: 750000, tenure: "36 months", interestRate: "13.5%", status: "Executed", generatedAt: "2026-04-15T09:30:00Z", borrowerEmail: "mali.khan@businessmail.in", purpose: "Equipment Purchase" },
  { id: "AGR-004", applicationId: "APP-88213", borrowerName: "Sunita Devi Verma", loanAmount: 150000, tenure: "6 months", interestRate: "18.0%", status: "Draft", borrowerEmail: "sunita.verma@gmail.com", purpose: "Medical Emergency" },
  { id: "AGR-005", applicationId: "APP-88214", borrowerName: "Arjun Mehta & Co.", loanAmount: 1000000, tenure: "48 months", interestRate: "12.5%", status: "Draft", borrowerEmail: "arjun.mehta@mehta-textiles.com", purpose: "Textile Inventory" },
];

export const MOCK_COMM_LOGS: CommLog[] = [
  { id: "COM-001", disbursementId: "D-4821", borrowerName: "Ramesh Kumar Sharma", type: "SMS", recipient: "+91-98765-43210", template: "Disbursement Alert", status: "Delivered", sentAt: "2026-04-29T10:31:00Z", message: "Dear Ramesh, Rs.2,00,000 (Tranche 1) has been disbursed to your HDFC account. Ref: RRN-2042901." },
  { id: "COM-002", disbursementId: "D-4821", borrowerName: "Ramesh Kumar Sharma", type: "Email", recipient: "ramesh.sharma@gmail.com", template: "Agreement Ready", status: "Sent", sentAt: "2026-04-28T10:32:00Z", message: "Your loan agreement for Rs.5,00,000 is ready for signature. Please review within 48 hours." },
  { id: "COM-003", disbursementId: "D-4823", borrowerName: "Mohammed Ali Khan", type: "WhatsApp", recipient: "+91-88776-54321", template: "Disbursal Receipt", status: "Delivered", sentAt: "2026-04-30T14:00:00Z", message: "Hi Mohammed! Your payment receipt for Rs.3,75,000 is ready. Download via app." },
  { id: "COM-004", disbursementId: "D-4822", borrowerName: "Priya Agarwal", type: "SMS", recipient: "+91-99887-76655", template: "EMI Reminder", status: "Pending", sentAt: "2026-05-06T09:00:00Z", message: "Reminder: Your disbursement of Rs.1,25,000 is scheduled for tomorrow. Ensure account details are updated." },
  { id: "COM-005", disbursementId: "D-4824", borrowerName: "Sunita Devi Verma", type: "Email", recipient: "sunita.verma@gmail.com", template: "Rejection Notice", status: "Failed", sentAt: "2026-05-03T11:05:00Z", message: "We were unable to process your transfer. Please contact support at support@gavel.ai." },
];

export const MOCK_COMM_TEMPLATES: CommTemplate[] = [
  { id: "TPL-001", name: "Loan Approval", type: "SMS", trigger: "Approval", body: "Dear {name}, your loan of Rs.{amount} (Ref: {loanId}) has been approved by Gavel Financial. Agreement document sent to your email.", isActive: true },
  { id: "TPL-002", name: "Disbursement Alert", type: "SMS", trigger: "Disbursement", body: "Dear {name}, Rs.{amount} (Tranche {tranche}) has been disbursed to your {bankName} account ending {last4}. Ref: {rrn}.", isActive: true },
  { id: "TPL-003", name: "EMI Reminder", type: "SMS", trigger: "Reminder", body: "Reminder: Your EMI of Rs.{emi} for loan {loanId} is due on {dueDate}. Pay via UPI: gavel@upi", isActive: true },
  { id: "TPL-004", name: "Agreement Ready", type: "Email", trigger: "Approval", subject: "Your Loan Agreement - {loanId}", body: "Dear {name},\n\nYour loan agreement for Rs.{amount} is ready for your signature. Please review and sign the attached document within 48 hours.\n\nBest regards,\nGavel Financial Services", isActive: true },
  { id: "TPL-005", name: "Disbursal Receipt", type: "WhatsApp", trigger: "Receipt", body: "Hi {name}! Your official payment receipt for Rs.{amount} is ready. Download: {link}", isActive: true },
  { id: "TPL-006", name: "Rejection Notice", type: "Email", trigger: "Rejection", subject: "Loan Application Update - {applicationId}", body: "Dear {name},\n\nWe regret to inform that your loan application {applicationId} could not be processed at this time.\n\nYou may reapply after 90 days.\n\nGavel Financial Services", isActive: false },
  { id: "TPL-007", name: "Proof of Disbursement", type: "SMS", trigger: "Disbursement", body: "Dear {borrowerName}, Rs.{amount} has been disbursed to your account. Ref: {referenceNumber}. Download proof: {link}", isActive: true },
];
