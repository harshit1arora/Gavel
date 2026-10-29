import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AnalysisResult } from './mock-engine';

export interface LoanAgreementData {
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  loanAmount: number;
  tenor: number;
  rate: number;
  emiAmount: number;
  startDate: string;
  endDate: string;
  purpose?: string;
  disbursalMethod?: string;
  securityDetails?: string;
}

export async function generateAnalysisPDF(result: AnalysisResult) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header with logo and company info
  doc.setFontSize(24);
  doc.setTextColor(249, 115, 22); // Primary orange color
  doc.text('GAVEL', 20, yPosition);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Underwriting Infrastructure for Indian NBFCs', 20, yPosition + 8);

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.line(20, yPosition + 12, pageWidth - 20, yPosition + 12);

  yPosition += 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Underwriting Analysis Report', 20, yPosition);

  yPosition += 12;

  // Decision banner
  const decisionColors = {
    APPROVE: { bg: [0, 255, 148], text: 'APPROVED' },
    REJECT: { bg: [255, 68, 68], text: 'REJECTED' },
    REVIEW: { bg: [245, 158, 11], text: 'REVIEW REQUIRED' },
  };

  const decision = decisionColors[result.decision];
  doc.setFillColor(decision.bg[0], decision.bg[1], decision.bg[2]);
  doc.rect(20, yPosition, pageWidth - 40, 18, 'F');

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(decision.text, 25, yPosition + 12);

  // Credit limit on the right if approved/review
  if ((result.decision === 'APPROVE' || result.decision === 'REVIEW') && result.credit_limit > 0) {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const creditText = `Credit Limit: ₹${result.credit_limit.toLocaleString('en-IN')}`;
    const creditWidth = doc.getTextWidth(creditText);
    doc.text(creditText, pageWidth - 25 - creditWidth, yPosition + 12);
  }

  yPosition += 25;

  // Key metrics
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Risk Score: ${result.risk_score} | Confidence: ${(result.confidence * 100).toFixed(0)}%`, 20, yPosition);
  doc.text(`Processing Time: ${result.processing_time_ms}ms`, 20, yPosition + 6);
  doc.text(`Audit ID: ${result.audit_id}`, 20, yPosition + 12);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 20, yPosition + 18);

  yPosition += 28;

  // Decision Factors
  if (result.reasons && result.reasons.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Decision Factors', 20, yPosition);

    yPosition += 8;

    doc.setFontSize(9);
    result.reasons.forEach((reason) => {
      doc.setTextColor(0, 0, 0);
      doc.text(`${reason.label}`, 20, yPosition);

      doc.setTextColor(100, 100, 100);
      doc.text(`Weight: ${(reason.weight * 100).toFixed(0)}%`, 20, yPosition + 4);
      doc.text(reason.detail, 20, yPosition + 8, { maxWidth: pageWidth - 40 });

      yPosition += 14;

      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
    });

    yPosition += 5;
  }

  // Rules Evaluated
  if (result.rules_fired && result.rules_fired.length > 0) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Rules Evaluated', 20, yPosition);

    const triggered = result.rules_fired.filter(r => !r.skipped).length;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${triggered}/${result.rules_fired.length} triggered`, 20, yPosition + 6);

    yPosition += 12;

    doc.setFontSize(8);
    result.rules_fired.slice(0, 10).forEach((rule) => {
      const status = rule.skipped ? ', ': rule.result ? '✓': '✗';
      const statusColor = rule.skipped ? [180, 180, 180]: rule.result ? [0, 255, 148]: [255, 68, 68];

      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(status, 20, yPosition);

      doc.setTextColor(100, 100, 100);
      doc.text(`${rule.id}: ${rule.name}`, 25, yPosition);
      doc.text(`${rule.condition}`, 25, yPosition + 3, { maxWidth: pageWidth - 50 });

      yPosition += 7;

      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
    });
  }

  // Error section if present
  if (result.error) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(255, 68, 68);
    doc.setDrawColor(255, 68, 68);
    doc.rect(20, yPosition, pageWidth - 40, 2, 'F');

    yPosition += 8;

    doc.setFontSize(11);
    doc.setTextColor(255, 68, 68);
    doc.text(`${result.error.code}, ${result.error.message}`, 20, yPosition);

    yPosition += 6;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(result.error.detail, 20, yPosition, { maxWidth: pageWidth - 40 });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(
    `This report was automatically generated by Gavel AI. For verification and audit trails, visit your console.`,
    20,
    pageHeight - 15
  );

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Gavel_Analysis_${timestamp}_${result.audit_id.slice(-6)}.pdf`;

  // Save PDF
  doc.save(filename);
}

export async function generateLoanAgreement(data: LoanAgreementData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(249, 115, 22);
  doc.text('GAVEL', 20, yPosition);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Loan Agreement', 20, yPosition + 8);

  doc.setDrawColor(220, 220, 220);
  doc.line(20, yPosition + 12, pageWidth - 20, yPosition + 12);

  yPosition += 20;

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('LOAN AGREEMENT', 20, yPosition);

  yPosition += 12;

  // Agreement details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const details = [
    { label: 'Borrower Name:', value: data.borrowerName },
    { label: 'Phone:', value: data.borrowerPhone },
    { label: 'Email:', value: data.borrowerEmail },
    { label: 'Loan Amount:', value: `₹${data.loanAmount.toLocaleString('en-IN')}` },
    { label: 'Tenure:', value: `${data.tenor} months` },
    { label: 'Interest Rate:', value: `${data.rate}% p.a.` },
    { label: 'Monthly EMI:', value: `₹${data.emiAmount.toLocaleString('en-IN')}` },
    { label: 'Loan Start Date:', value: data.startDate },
    { label: 'Loan End Date:', value: data.endDate },
...(data.purpose ? [{ label: 'Purpose:', value: data.purpose }]: []),
...(data.disbursalMethod ? [{ label: 'Disbursal Method:', value: data.disbursalMethod }]: []),
  ];

  details.forEach((detail, index) => {
    doc.setTextColor(0, 0, 0);
    doc.text(`${detail.label}`, 20, yPosition);

    doc.setTextColor(100, 100, 100);
    doc.text(detail.value, 80, yPosition);

    yPosition += 6;
  });

  yPosition += 10;

  // Terms and Conditions
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Terms and Conditions', 20, yPosition);

  yPosition += 8;

  const terms = [
    '1. Payment: The borrower agrees to pay the monthly EMI as per the schedule provided.',
    '2. Default: In case of default exceeding 90 days, the lender may initiate recovery proceedings.',
    '3. Prepayment: Prepayment is allowed without penalty. Interest shall be calculated till actual payment date.',
    '4. Confidentiality: Both parties agree to maintain confidentiality of this agreement.',
    '5. Governing Law: This agreement shall be governed by the laws of India.',
    '6. Dispute Resolution: Any disputes shall be resolved through arbitration as per Indian Arbitration Act.',
  ];

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  terms.forEach((term) => {
    const wrapped = doc.splitTextToSize(term, pageWidth - 40);
    wrapped.forEach((line: string) => {
      doc.text(line, 20, yPosition);
      yPosition += 4;
    });
    yPosition += 2;

    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
  });

  yPosition += 10;

  // Signature section
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Authorized by:', 20, yPosition);

  yPosition += 15;

  doc.line(20, yPosition, 60, yPosition);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Borrower Signature', 20, yPosition + 3);

  doc.line(pageWidth - 60, yPosition, pageWidth - 20, yPosition);
  doc.text('Lender Authorized', pageWidth - 60, yPosition + 3);

  yPosition += 15;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, yPosition);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(
    'This agreement was generated by Gavel AI. Please keep a copy for your records.',
    20,
    pageHeight - 15
  );

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedName = data.borrowerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `Loan_Agreement_${sanitizedName}_${timestamp}.pdf`;

  return {
    doc,
    filename,
    generateAndSave: () => doc.save(filename),
  };
}

export function generateLoanAgreementDataURL(data: LoanAgreementData): Promise<string> {
  return generateLoanAgreement(data).then((result) => result.doc.output('dataurlstring'));
}
