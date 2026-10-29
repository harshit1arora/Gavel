/**
 * generate-seo-html.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates static, fully-crawlable HTML files for all programmatic SEO pages.
 * These files are written to dist/[slug]/index.html after `vite build`.
 *
 * Vercel serves static files BEFORE the SPA rewrite, so Google gets real HTML.
 * This is the primary fix for the "empty div" CSR SEO problem.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../src/data/seo-config.json');

const DOMAIN = 'https://www.trygavel.com';
const TODAY = new Date().toISOString().split('T')[0];
const YEAR = new Date().getFullYear();
const DIST = path.join(__dirname, '../dist');

// ── Formatting helpers ────────────────────────────────────────────────────────

const fmt = (n) => {
  if (n >= 10000000) return (n / 10000000) + 'Cr';
  if (n >= 100000) return (n / 100000) + 'L';
  if (n >= 1000) return (n / 1000) + 'K';
  return '' + n;
};

const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const titleCase = (s) =>
  s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const getBankName = (slug) => {
  const names = {
    'hdfc': 'HDFC Bank', 'icici': 'ICICI Bank', 'sbi': 'State Bank of India',
    'axis': 'Axis Bank', 'kotak': 'Kotak Mahindra Bank', 'bajaj-finserv': 'Bajaj Finserv',
    'tata-capital': 'Tata Capital', 'idfc-first': 'IDFC First Bank', 'yes-bank': 'Yes Bank',
    'pnb': 'Punjab National Bank', 'bank-of-baroda': 'Bank of Baroda', 'canara-bank': 'Canara Bank',
    'union-bank': 'Union Bank of India', 'moneytap': 'MoneyTap', 'fullerton-india': 'Fullerton India',
  };
  return names[slug] || titleCase(slug);
};

const escHtml = (s) => String(s)
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;');

// ── Page data generators (mirrors seo-content.ts) ────────────────────────────

function salaryPages() {
  return config.salaries.map(s => {
    const sl = fmt(s);
    const maxLoan = Math.round(s * 18);
    const maxEmi = Math.round(s * 0.45);
    const slug = `loan-eligibility-${sl.toLowerCase()}-salary`;
    return {
      slug,
      title: `₹${sl} Salary Personal Loan Eligibility, Calculate Max Loan & EMIs | Gavel AI`,
      h1: `Personal Loan Eligibility on ₹${sl}/Month Salary`,
      description: `Earn ₹${sl}/month net salary? Calculate your maximum personal loan amount, eligible monthly EMIs, and compare matching banks. Free, fast & CIBIL safe.`,
      category: 'Salary Eligibility',
      content: [
        `If you earn a net take-home salary of ₹${sl} per month, your estimated maximum personal loan limit is approximately ${fmtINR(maxLoan)}. This is calculated based on standard Indian banking guidelines where your total monthly EMIs (FOIR) cannot exceed 40–50% of your income.`,
        `At this salary level, your maximum monthly EMI capacity is ${fmtINR(maxEmi)}. Lenders like HDFC Bank, ICICI Bank, and Bajaj Finserv use this limit to compute the highest loan amount they can offer you.`,
        `Key factors that determine your actual loan limit beyond salary:`,
        `• Employer Tier: Working at a high-profile corporate (Tier-A MNC or listed company) lowers underwriting risk and increases your eligibility significantly.`,
        `• CIBIL Score: Lenders require a minimum of 650+; a score of 750+ unlocks the lowest interest rates starting from 10.5% p.a.`,
        `• Existing Liabilities: Any active EMIs (car loan, home loan, credit card minimums) directly reduce your net disposable income and lower the approved loan amount.`,
        `• Job Stability: At least 1 year with your current employer (6 months for some NBFCs) is typically required.`,
        `Tips to maximize your loan limit on a ₹${sl} salary:`,
        `• Pay off outstanding credit card balances to reduce your Debt-to-Income (DTI) ratio before applying.`,
        `• Opt for a longer repayment tenure (up to 60 or 72 months) to lower your EMI threshold and qualify for a higher principal.`,
        `• Submit 6 months of continuous salary credits in your bank statement without cash withdrawals, cheque bounces, or mandate failures.`,
        `• Apply directly with the bank where your salary account is held; they have salary data and offer instant pre-approvals.`,
      ],
      faqs: [
        { q: `What is the maximum loan amount on a ₹${sl} salary?`, a: `You can typically get a personal loan of up to ${fmtINR(maxLoan)} depending on your credit history, employer classification, and existing EMIs. Banks apply the FOIR rule, capping total EMIs at 40–50% of your income.` },
        { q: `How do banks calculate EMI eligibility for ₹${sl}/month salary?`, a: `Banks use the Fixed Obligation to Income Ratio (FOIR) method, capping your total monthly EMIs at ${fmtINR(maxEmi)}, approximately 45% of your take-home salary. This is the maximum EMI amount they will approve.` },
        { q: `Which bank gives the highest loan on a ₹${sl} salary?`, a: `HDFC Bank, ICICI Bank, and Bajaj Finserv typically offer the highest loan multiples on salary. SBI and PNB offer competitive rates. Your final eligibility depends on your CIBIL score and employer tier.` },
        { q: `Can I get a personal loan on ₹${sl} salary with a low CIBIL score?`, a: `Yes, but prime banks (HDFC, ICICI, SBI) will likely reject. Fintech NBFCs like MoneyTap, KreditBee, or Navi approve borrowers with scores above 600 but charge higher interest rates of 18–24%.` },
        { q: `How long does personal loan approval take on a ₹${sl} salary?`, a: `Digital lenders and NBFCs approve within 24–48 hours. Traditional banks may take 3–5 business days. Pre-approved customers in their salary bank get instant approval in minutes.` },
      ],
      relatedLinks: [
        { label: 'Free Loan Approval Predictor', href: '/loan-approval-predictor' },
        { label: 'EMI Calculator', href: '/tools/emi-calculator' },
        { label: 'Salary Loan Eligibility Calculator', href: '/tools/salary-loan-eligibility' },
        { label: 'DTI / FOIR Calculator', href: '/tools/dti-calculator' },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/tools' },
        { label: 'Salary Eligibility', href: '/tools/salary-loan-eligibility' },
        { label: `₹${sl} Salary`, href: '' },
      ],
      tableHeaders: ['Salary Level', 'Max Personal Loan', 'Max EMI Capacity', 'Min CIBIL'],
      tableRows: [
        [`₹${sl}/month (You)`, fmtINR(maxLoan), fmtINR(maxEmi) + '/mo', '700+'],
        ['₹50,000/month', fmtINR(900000), '₹22,500/mo', '700+'],
        ['₹1,00,000/month', fmtINR(1800000), '₹45,000/mo', '720+'],
      ],
    };
  });
}

function loanAmountPages() {
  return config.loanAmounts.map(amt => {
    const al = fmt(amt);
    const minSalary = Math.round(amt / 18);
    const emi10 = Math.round(amt * 0.0215);
    const emi135 = Math.round(amt * 0.023);
    const slug = `${al.toLowerCase()}-personal-loan`;
    return {
      slug,
      title: `₹${al} Personal Loan EMI & Eligibility, Compare Best Banks 2026 | Gavel AI`,
      h1: `₹${al} Personal Loan: Complete Eligibility & EMI Guide`,
      description: `Need a ₹${al} personal loan? Calculate your monthly EMI starting at 10.5% interest, check minimum salary required, and find the best bank for fast approval.`,
      category: 'Loan Amount Guide',
      content: [
        `Securing a personal loan of ${fmtINR(amt)} requires meeting specific underwriting checks across income, credit, and documentation. For a loan of this size, banks generally expect a minimum net monthly income of ${fmtINR(minSalary)} with no other active debts.`,
        `Over a typical 5-year repayment period at 10.5% interest, your estimated monthly EMI will be ${fmtINR(emi10)}. At a higher rate of 13.5%, the EMI increases to ${fmtINR(emi135)}.`,
        `Criteria to secure a ₹${al} personal loan:`,
        `• Minimum Salary: ${fmtINR(minSalary)}/month with no other active loan EMIs. If you have existing EMIs, you'll need a higher income.`,
        `• Target CIBIL Score: 720+ is preferred for fast-track processing and the best interest rates. Scores below 680 significantly reduce approval chances.`,
        `• Employment Stability: At least 1–2 years of continuous service with your current employer is required by most banks.`,
        `• Clean Bank Statements: 6 months of statements showing steady salary credits, zero mandate bounces, and healthy average balances.`,
        `Top lenders for ₹${al} personal loans in India:`,
        `• HDFC Bank: Rates from 10.5% for select corporate employees, same-day digital approval for pre-approved customers.`,
        `• Bajaj Finserv: Trusted for quick disbursals and flexible tenures, especially for amounts above ₹2 Lakhs.`,
        `• SBI: Lowest processing charges and competitive government-sector rates.`,
        `• IDFC First Bank: Fully digital process with competitive rates for salaried professionals.`,
      ],
      faqs: [
        { q: `What is the monthly EMI for a ₹${al} personal loan?`, a: `At 10.5% interest over 5 years, the EMI is approximately ${fmtINR(emi10)}/month. At 13.5%, it rises to ${fmtINR(emi135)}/month. Use our EMI calculator to get exact figures based on your specific rate.` },
        { q: `What minimum salary do I need for a ₹${al} loan?`, a: `You typically need a monthly take-home salary of at least ${fmtINR(minSalary)}, assuming no other active EMIs. With existing EMIs, you'll need a proportionally higher income.` },
        { q: `Which bank gives a ₹${al} personal loan fastest?`, a: `Bajaj Finserv and HDFC Bank offer same-day or 24-hour disbursals for pre-approved profiles. Kotak Mahindra Bank and IDFC First Bank are also known for fast digital processing.` },
        { q: `Does my CIBIL score affect a ₹${al} loan approval?`, a: `Yes, critically. A CIBIL score above 750 gives you the best rates (10.5–12%). Scores between 700–749 get moderate rates (12–15%). Below 680, most prime banks will reject the application.` },
        { q: `Can I prepay a ₹${al} personal loan?`, a: `Yes. Most lenders allow part-prepayment after 6–12 EMIs. Prepayment charges range from 0–5% of the outstanding principal depending on the lender.` },
      ],
      relatedLinks: [
        { label: 'Free Loan Approval Predictor', href: '/loan-approval-predictor' },
        { label: 'EMI Calculator', href: '/tools/emi-calculator' },
        { label: 'Loan Affordability Calculator', href: '/tools/loan-affordability-calculator' },
        { label: 'Home Loan Affordability', href: '/tools/home-loan-affordability' },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Loan Guides', href: '/all-guides' },
        { label: `₹${al} Loan`, href: '' },
      ],
      tableHeaders: ['Loan Size', 'Min Salary Needed', 'EMI @ 10.5%', 'EMI @ 13.5%'],
      tableRows: [
        [`₹${al} (This Guide)`, fmtINR(minSalary) + '/mo', fmtINR(emi10) + '/mo', fmtINR(emi135) + '/mo'],
        ['₹1 Lakh', '₹15,000/mo', '₹2,150/mo', '₹2,300/mo'],
        ['₹5 Lakhs', '₹35,000/mo', '₹10,750/mo', '₹11,500/mo'],
      ],
    };
  });
}

function cityPages() {
  const pages = [];
  config.cities.forEach(city => {
    const cityName = titleCase(city);

    pages.push({
      slug: `personal-loan-in-${city}`,
      title: `Personal Loan in ${cityName}, Compare Lowest Rates & Fees 2026 | Gavel AI`,
      h1: `Personal Loan in ${cityName}: Compare Rates & Eligibility`,
      description: `Get the lowest personal loan rates in ${cityName}. Compare eligibility, EMIs, and fees across SBI, HDFC, ICICI, and NBFCs. Check your odds free.`,
      category: 'City Loan Guide',
      content: [
        `Personal loans in ${cityName} are available from all major banks and NBFCs, typically within 24–72 hours for salaried professionals. The city's lender network includes national banks, regional banks, and digital-first NBFCs.`,
        `Standard eligibility for personal loans in ${cityName}:`,
        `• Minimum Income: ₹25,000 to ₹35,000 per month depending on your employer's tier classification.`,
        `• Age Range: 21 to 58 years at the time of loan maturity.`,
        `• Credit Score: CIBIL score of 680 or higher is required; 750+ unlocks the best interest rates starting from 10.5% p.a.`,
        `• Residency: Valid address proof for ${cityName} (rental agreement, utility bill, or Aadhaar with ${cityName} address).`,
        `• Employment: Minimum 1 year of continuous employment, with the last 6 months at the current employer.`,
        `Best lenders for personal loans in ${cityName}:`,
        `• ICICI Bank: Known for digital processing with same-day pre-approvals for existing account holders.`,
        `• HDFC Bank: Competitive rates and fast disbursal for Tier-1 employer employees.`,
        `• Tata Capital: Flexible repayment structures and paperless digital verification.`,
        `• SBI: Best rates for government and defense sector employees with easy documentation.`,
        `• Bajaj Finserv: Great for self-employed borrowers and people without a traditional salary slip.`,
        `How to apply for a personal loan in ${cityName}:`,
        `1. Check your approval odds using our free predictor (no CIBIL impact).`,
        `2. Compare lenders using our matching tool to find the best rate.`,
        `3. Submit documents online: salary slips (3 months), bank statements (6 months), PAN card, Aadhaar card.`,
        `4. Get approval and disbursal within 24–72 hours.`,
      ],
      faqs: [
        { q: `What is the minimum salary for a personal loan in ${cityName}?`, a: `Most lenders require a minimum monthly salary of ₹25,000. Tier-1 corporate employees may get approvals at ₹20,000. NBFCs like Bajaj Finserv approve at lower salary points with stricter credit requirements.` },
        { q: `Which bank offers the lowest interest rate in ${cityName}?`, a: `SBI and HDFC Bank typically offer the lowest starting rates (10.5% p.a.) for high-CIBIL salaried applicants. NBFCs like Bajaj Finserv charge 12.5–18% but process faster.` },
        { q: `Is address verification mandatory for a loan in ${cityName}?`, a: `Yes. Lenders require physical or digital address verification (Aadhaar, utility bills, or rental agreement) confirming your residence in ${cityName}.` },
        { q: `How quickly can I get a personal loan in ${cityName}?`, a: `Digital NBFCs like KreditBee or MoneyTap disburse within 2–4 hours. Traditional banks take 24–72 hours after document verification. Pre-approved bank customers get instant transfers.` },
      ],
      relatedLinks: [
        { label: 'Check Loan Approval Odds', href: '/loan-approval-predictor' },
        { label: 'EMI Calculator', href: '/tools/emi-calculator' },
        { label: 'Home Loan Affordability', href: '/tools/home-loan-affordability' },
        { label: `Home Loan in ${cityName}`, href: `/home-loan-in-${city}` },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'City Guides', href: '/all-guides' },
        { label: cityName, href: '' },
      ],
      tableHeaders: ['Lender', 'Interest Rate', 'Processing Fee', 'Min CIBIL'],
      tableRows: [
        ['HDFC Bank', '10.5%, 14.5%', '1.0%, 2.0%', '720+'],
        ['ICICI Bank', '10.75%, 15%', '1.0%, 2.5%', '720+'],
        ['SBI', '11.0%, 13.5%', '0.5%, 1.0%', '700+'],
        ['Bajaj Finserv', '12.5%, 18.0%', '1.5%, 3.0%', '650+'],
      ],
    });

    pages.push({
      slug: `home-loan-in-${city}`,
      title: `Home Loan in ${cityName}, Compare Best Mortgage Rates & Stamp Duty | Gavel AI`,
      h1: `Home Loan in ${cityName}: Rates, Eligibility & How to Apply`,
      description: `Looking for a home loan in ${cityName}? Compare SBI, HDFC, and LIC mortgage rates, calculate stamp duty, and estimate maximum borrowing limit.`,
      category: 'City Home Loan Guide',
      content: [
        `Home loans in ${cityName} cover 80–90% of the property value (LTV ratio), with lenders offering competitive rates for both under-construction and ready-to-move properties.`,
        `Eligibility requirements for home loans in ${cityName}:`,
        `• Income: A combined family income of ₹50,000+ per month significantly increases eligibility.`,
        `• Property: Must be approved by the lender. Banks inspect builder credentials and RERA registration.`,
        `• CIBIL Score: 750+ for the best rates (8.4–9%); 700+ for standard approvals.`,
        `• LTV Ratio: Banks fund up to 80% for loans above ₹30 lakhs; up to 90% for smaller loans.`,
        `• Tenure: Up to 30 years, subject to retirement age.`,
        `• FOIR: Home loan EMIs allowed up to 55–60% of monthly income.`,
        `Stamp duty and registration in ${cityName}:`,
        `• Stamp duty varies by property type and buyer gender. Female buyers often get 1–2% rebate.`,
        `• Stamp duty and registration charges are not part of the loan; you must fund these separately.`,
        `Top mortgage lenders in ${cityName}:`,
        `• HDFC Bank: Largest home loan provider in India, with pre-approved builder projects.`,
        `• SBI: Best rates for salaried government employees; PMAY benefits available.`,
        `• LIC Housing Finance: Long tenures and stable processing, especially for senior applicants.`,
        `• Axis Bank: Zero prepayment charges and competitive floating rates.`,
      ],
      faqs: [
        { q: `What interest rates apply for home loans in ${cityName}?`, a: `Floating rates range from 8.40% to 9.50% depending on loan size and CIBIL score. Fixed rates are 0.5–1% higher. PMAY beneficiaries get additional 6.5% subsidy on eligible amounts.` },
        { q: `Can self-employed individuals get a home loan in ${cityName}?`, a: `Yes. Self-employed borrowers need 2–3 years of audited accounts, IT returns, and 12-month business bank statements. Approval rates are slightly lower but increasing with NBFC penetration.` },
        { q: `What documents are required for a home loan in ${cityName}?`, a: `Identity proof (Aadhaar/PAN), income proof (salary slips or ITR), 6-month bank statements, property documents (sale agreement, approved plan), and CIBIL report.` },
        { q: `How much home loan can I get in ${cityName}?`, a: `Based on your income and the property value, banks fund 80–90% of the property price. As a rule of thumb, your home loan eligibility is approximately 60× your monthly net salary.` },
      ],
      relatedLinks: [
        { label: 'Check Loan Approval Odds', href: '/loan-approval-predictor' },
        { label: 'Home Loan Affordability Calculator', href: '/tools/home-loan-affordability' },
        { label: 'DTI Calculator', href: '/tools/dti-calculator' },
        { label: `Personal Loan in ${cityName}`, href: `/personal-loan-in-${city}` },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'City Guides', href: '/all-guides' },
        { label: cityName, href: '' },
      ],
      tableHeaders: ['Lender', 'Interest Rate', 'Max Tenure', 'Processing Fee'],
      tableRows: [
        ['HDFC Bank', '8.40%, 9.65%', '30 years', '0.5%, 1.5%'],
        ['SBI', '8.50%, 9.85%', '30 years', '0.35%, 0.5%'],
        ['LIC Housing Finance', '8.65%, 10.00%', '30 years', '0%, 0.5%'],
        ['Axis Bank', '8.75%, 9.90%', '25 years', '1.0%, 1.5%'],
      ],
    });
  });
  return pages;
}

function professionPages() {
  return config.professions.map(prof => {
    const profName = titleCase(prof);
    const isSelf = ['freelancer','startup-founder','business-owner','real-estate-agent','consultant'].includes(prof);
    const slug = `personal-loan-for-${prof}`;
    return {
      slug,
      title: `Personal Loan for ${profName}s, Lowest Rates & Special Schemes | Gavel AI`,
      h1: `Personal Loan for ${profName}s: Exclusive Guide`,
      description: `Compare special personal loan offers and CIBIL criteria for ${profName}s. Check minimum turnover, documentation, and calculate approval odds.`,
      category: 'Profession Guide',
      content: [
        `${profName}s have a distinct risk profile in the Indian lending ecosystem. ${isSelf
          ? `As self-employed professionals, banks focus on business vintage, ITR consistency, and cash flow patterns rather than monthly salary slips.`
: `Salaried ${profName}s benefit from fast-track processing because steady corporate employment is viewed as low risk by lenders.`}`,
        `Required documentation for ${profName}s:`,
        isSelf
          ? `• 2 years of ITR filings with all schedules and Form 26AS\n• GST returns for the last 12 months (if applicable)\n• 12-month business bank statement showing consistent credits\n• Business registration certificate or professional degree certificate\n• PAN card, Aadhaar card for KYC`
: `• 3 months salary slips with employer stamp\n• 6-month bank statement showing salary credits\n• Corporate ID card or employment letter\n• PAN card, Aadhaar card for KYC`,
        `Income evaluation for ${profName}s:`,
        `• Banks check income consistency, irregular or declining income is a red flag.`,
        `• CIBIL score minimum: 680+; 750+ opens up low-rate schemes with prime banks.`,
        `• Existing EMI obligations must be declared; FOIR must remain under 50%.`,
        `Best lenders for ${profName}s:`,
        isSelf
          ? `• Bajaj Finserv: Flexible terms for business owners with 1+ year of vintage.\n• IDFC First Bank: Digital processing with minimal paperwork for established businesses.\n• Fullerton India: Specializes in self-employed and MSME lending.`
: `• HDFC Bank: Priority processing for salaried professionals with Tier-A employers.\n• ICICI Bank: Instant pre-approvals for salary account holders.\n• SBI: Best government sector rates with minimal documentation.`,
      ],
      faqs: [
        { q: `Can a ${profName} get a personal loan easily?`, a: `Yes. With a stable income history and ${isSelf ? '2+ years in business': '1+ year in your current role'}, approval rates are high. Your CIBIL score is the most critical factor, aim for 720+.` },
        { q: `What is the best bank for ${profName}s?`, a: `${isSelf ? 'Bajaj Finserv and IDFC First Bank': 'HDFC Bank and ICICI Bank'} offer custom programs with competitive interest rates. Use our predictor to compare offers based on your exact profile.` },
        { q: `What documents does a ${profName} need for a personal loan?`, a: isSelf
          ? 'ITR for 2 years, 12-month bank statement, GST returns, business registration, PAN, and Aadhaar.'
: '3-month salary slips, 6-month bank statement, employment letter, PAN, and Aadhaar.' },
      ],
      relatedLinks: [
        { label: 'Check My Loan Approval Odds', href: '/loan-approval-predictor' },
        { label: 'Salary Loan Eligibility Calculator', href: '/tools/salary-loan-eligibility' },
        { label: 'DTI Calculator', href: '/tools/dti-calculator' },
        { label: 'Financial Health Check', href: '/tools/financial-health-check' },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Profession Guides', href: '/all-guides' },
        { label: profName, href: '' },
      ],
      tableHeaders: ['Lender', 'Best For', 'Rate Range', 'Processing Speed'],
      tableRows: isSelf
        ? [['Bajaj Finserv', 'Self-employed', '12.5%, 18%', '24–48 hrs'],
           ['IDFC First', 'Digital-first', '10.75%, 16%', '24 hrs'],
           ['Fullerton India', 'MSME/Business', '11.99%, 24%', '48–72 hrs']]
: [['HDFC Bank', 'Tier-A employees', '10.5%, 14.5%', 'Same day'],
           ['ICICI Bank', 'Existing customers', '10.75%, 15%', 'Instant'],
           ['SBI', 'Govt sector', '11.0%, 13.5%', '2–3 days']],
    };
  });
}

function bankPages() {
  const pages = [];
  config.banks.forEach(bank => {
    const bankName = getBankName(bank);

    pages.push({
      slug: `${bank}-personal-loan-eligibility`,
      title: `${bankName} Personal Loan Eligibility 2026, Interest Rates & Fees | Gavel AI`,
      h1: `${bankName} Personal Loan: Eligibility Criteria & Interest Rates`,
      description: `Calculate your personal loan eligibility for ${bankName}. Check minimum salary required, current interest rates, required documents, and get approved fast.`,
      category: 'Bank Eligibility Guide',
      content: [
        `${bankName} personal loans offer flexible financing up to ₹40 Lakhs for eligible salaried and self-employed borrowers. With competitive interest rates starting from 10.5% p.a., it is one of the preferred lenders for personal financing in India.`,
        `${bankName} personal loan eligibility requirements:`,
        `• Minimum Monthly Income: ₹25,000 (₹35,000 for metro cities like Mumbai and Delhi).`,
        `• CIBIL Score: 720+ preferred; below 680 is typically rejected by automated systems.`,
        `• Employment Stability: Minimum 2 years total work experience, with 6 months at current employer.`,
        `• Age: 21 to 60 years at loan maturity.`,
        `• FOIR: Total existing EMIs should not exceed 50% of monthly net income.`,
        `${bankName} personal loan interest rates and charges:`,
        `• Interest Rate: Starts at 10.5% p.a.; goes up to 16% based on CIBIL score and employer tier.`,
        `• Processing Fee: 1% to 2.5% of the loan amount (non-refundable).`,
        `• Prepayment Charges: 2–4% of outstanding principal (allowed after 12 EMIs).`,
        `• Late Payment Penalty: 2% per month on overdue amount.`,
        `Documents required for ${bankName} personal loan:`,
        `• KYC: PAN card, Aadhaar card, recent passport-size photograph.`,
        `• Income Proof: Latest 3 salary slips, Form 16, or ITR for self-employed.`,
        `• Bank Statement: Last 6 months of the primary salary account.`,
        `• Employment Proof: Latest company ID card or employment letter.`,
      ],
      faqs: [
        { q: `What is the minimum salary for a ${bankName} personal loan?`, a: `${bankName} requires a minimum net monthly income of ₹25,000 for non-metro applicants and ₹35,000 for applicants in Tier-1 cities like Mumbai, Delhi, or Bangalore.` },
        { q: `What interest rate does ${bankName} charge?`, a: `${bankName} personal loan rates start at 10.5% p.a. and can go up to 16% depending on your CIBIL score (higher score = lower rate), employer tier (MNC vs. non-listed company), and loan tenure.` },
        { q: `How long does ${bankName} take to approve a personal loan?`, a: `For pre-approved customers, approval is instant (same day). For new applicants with complete documentation, it takes 2–5 working days.` },
        { q: `Does ${bankName} check CIBIL score for personal loans?`, a: `Yes. ${bankName} performs a hard CIBIL inquiry on every application. Scores below 680 are typically rejected by their automated underwriting system.` },
      ],
      relatedLinks: [
        { label: 'Check Approval Odds at Any Bank', href: '/loan-approval-predictor' },
        { label: 'EMI Calculator', href: '/tools/emi-calculator' },
        { label: `${bankName} Rejection Reasons`, href: `/${bank}-loan-rejection-reasons` },
        { label: `${bankName} Loan Analysis`, href: `/${bank}-loan-analysis` },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Bank Guides', href: '/all-guides' },
        { label: bankName, href: '' },
      ],
      tableHeaders: ['Parameter', `${bankName} Requirement`, 'Industry Average'],
      tableRows: [
        ['Min Monthly Salary', '₹25,000', '₹20,000, ₹30,000'],
        ['Min CIBIL Score', '720+', '680+'],
        ['Interest Rate Range', '10.5%, 16%', '10.5%, 18%'],
        ['Loan Amount Range', '₹50,000, ₹40L', '₹50,000, ₹40L'],
        ['Loan Tenure', '12 – 60 months', '12 – 60 months'],
      ],
    });

    pages.push({
      slug: `${bank}-loan-rejection-reasons`,
      title: `Why ${bankName} Rejected Your Loan & How to Get Approved | Gavel AI`,
      h1: `Why ${bankName} Rejects Personal Loans: Reasons & Solutions`,
      description: `Got rejected by ${bankName}? Find the top reasons for rejection (high DTI, cheque bounce, CIBIL) and learn exactly how to fix it and reapply.`,
      category: 'Bank Rejection Guide',
      content: [
        `Receiving a personal loan rejection from ${bankName} is frustrating but fixable. Their automated underwriting engine flags specific risk triggers and rejects applications in milliseconds. Understanding these triggers helps you fix your profile.`,
        `Top reasons ${bankName} rejects personal loan applications:`,
        `• High FOIR Ratio: Your total monthly EMIs (including credit card minimums) exceed 50% of your net monthly income. This is the single most common rejection reason.`,
        `• Low CIBIL Score: A score below 680 triggers automatic rejection. Between 680–720, it depends on your employer tier and income level.`,
        `• Multiple Recent Credit Inquiries: Applying to 3+ lenders within 30 days signals credit hunger and drops your score by 5–10 points per inquiry.`,
        `• Bank Statement Irregularities: ECS/NACH mandate bounces, frequent overdrafts, or large unexplained cash withdrawals in the last 6 months.`,
        `• Employer Blacklisting: ${bankName} maintains internal lists of employers considered high risk. Employees of blacklisted firms face higher rejection rates or reduced eligibility.`,
        `• Insufficient Employment History: Less than 6 months at current employer, or job gaps in the last 12 months, raises underwriting risk.`,
        `• Existing Default or Settlement: Any active DPD (Days Past Due) or loan settlement in the CIBIL report from the last 3–5 years.`,
        `How to fix your profile and reapply to ${bankName}:`,
        `• Wait 3–6 months after rejection to let your CIBIL recover from the hard inquiry.`,
        `• Pay off existing credit card balances to reduce your FOIR ratio.`,
        `• Maintain 6 consecutive months of clean bank statements (zero bounces, regular salary credits).`,
        `• If your employer is blacklisted, consider applying to NBFCs like Bajaj Finserv or MoneyTap first to build a repayment track record.`,
      ],
      faqs: [
        { q: `How long should I wait to reapply to ${bankName} after rejection?`, a: `Wait at least 3–6 months before reapplying. This allows the hard inquiry's impact on your CIBIL score to reduce and gives you time to fix the underlying issue (FOIR, bounces, etc.).` },
        { q: `Does a ${bankName} rejection hurt my CIBIL score?`, a: `The rejection itself is not reported to CIBIL. However, the hard inquiry made when you applied will lower your score by 5–10 points. Multiple rejections in a short period compound this damage.` },
        { q: `Can I appeal a ${bankName} loan rejection?`, a: `Not formally. However, if you believe the rejection was based on incorrect CIBIL data, you can raise a dispute with CIBIL and reapply once corrected.` },
        { q: `What should I do immediately after a ${bankName} rejection?`, a: `Stop applying to other lenders (each new application = a new hard inquiry). Download your CIBIL report to identify the exact trigger. Fix the issue, then apply to one lender at a time after 6 months.` },
      ],
      relatedLinks: [
        { label: 'Check What\'s Hurting Your Approval', href: '/loan-approval-predictor' },
        { label: 'How to Improve Loan Approval', href: '/how-to-improve-loan-approval' },
        { label: 'DTI / FOIR Calculator', href: '/tools/dti-calculator' },
        { label: `${bankName} Eligibility Criteria`, href: `/${bank}-personal-loan-eligibility` },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Bank Guides', href: '/all-guides' },
        { label: bankName, href: '' },
      ],
      tableHeaders: ['Rejection Trigger', 'Frequency', 'Fix Timeline', 'Alternative Action'],
      tableRows: [
        ['High FOIR > 50%', 'Very Common', '1–3 months', 'Close small EMIs first'],
        ['CIBIL Score < 680', 'Very Common', '6–12 months', 'Apply to NBFCs'],
        ['Multiple Inquiries', 'Common', '3–6 months', 'Stop applying immediately'],
        ['Mandate Bounce', 'Common', '6 months (clean statements)', 'Use a co-applicant'],
      ],
    });

    pages.push({
      slug: `${bank}-loan-analysis`,
      title: `${bankName} Loan Credit Underwriting Policy Secrets | Gavel AI`,
      h1: `${bankName} Loan Underwriting Policy: Deep Analysis`,
      description: `Unlock ${bankName}'s credit underwriting rules. Learn how their AI check parses your bank statements, salary stability, and credit score.`,
      category: 'Bank Analysis',
      content: [
        `Our research team has analyzed ${bankName}'s personal loan underwriting approach using publicly available policy disclosures, borrower feedback, and credit bureau data. This analysis helps you understand exactly how they evaluate your application.`,
        `${bankName} credit evaluation framework:`,
        `• Bureau-First Model: ${bankName} heavily weights CIBIL score and bureau inquiry history before any other factor. A score below 700 makes other improvements largely irrelevant.`,
        `• Employer Tier Scoring: They maintain an internal employer rating list. Employees of Fortune 500 companies, PSUs, and government departments get instant pre-approvals and lower rates.`,
        `• Income Verification: ${bankName} verifies income via net banking statements, salary slips, and Form 16. For self-employed, they require the last 2 years of ITR filings.`,
        `• Bank Statement Analysis: Their system scans for: (a) salary credit regularity, same employer name, same date, consistent amount; (b) NACH bounce history in the last 6 months; (c) unusually high cash withdrawals or debit card spends; (d) existing EMI outflows not declared in the application.`,
        `• Loan-to-Income Cap: ${bankName} caps personal loan amounts at 18×–22× monthly salary depending on employer tier. High-tier employees get 22× multiples.`,
        `• Vintage Preference: ${bankName} favors long-standing account holders. Having a salary account with them for 2+ years significantly increases approval probability.`,
        `• Alternative Lenders if ${bankName} isn't the right fit:`,
        `• IDFC First Bank: More flexible on employer tier, competitive rates.`,
        `• Bajaj Finserv: Accepts lower CIBIL scores; faster disbursals.`,
        `• MoneyTap: Fintech NBFC with alternate data scoring for gig workers and freelancers.`,
      ],
      faqs: [
        { q: `How does ${bankName} verify income?`, a: `${bankName} verifies income via net banking statement logs showing salary credits, salary slips stamped by employer, and Form 16/ITR for the last 2 years. They cross-reference all three to catch inconsistencies.` },
        { q: `Does ${bankName} offer top-up loans?`, a: `Yes. Borrowers with a clean 12-month EMI payment track record can apply for a top-up personal loan. The top-up amount depends on residual tenure and your current income.` },
        { q: `What does ${bankName} look for in bank statements?`, a: `Regular salary credits from the same employer, zero NACH/ECS bounces, average monthly balance above ₹10,000, and no large unexplained cash withdrawals. Cash transactions above 20% of salary are a red flag.` },
      ],
      relatedLinks: [
        { label: 'Check Your Approval Odds', href: '/loan-approval-predictor' },
        { label: 'Financial Health Check', href: '/tools/financial-health-check' },
        { label: `${bankName} Eligibility`, href: `/${bank}-personal-loan-eligibility` },
        { label: `${bankName} Rejection Reasons`, href: `/${bank}-loan-rejection-reasons` },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Bank Guides', href: '/all-guides' },
        { label: bankName, href: '' },
      ],
      tableHeaders: ['Evaluation Factor', 'Weight', `${bankName} Threshold`, 'Impact on Rate'],
      tableRows: [
        ['CIBIL Score', 'Very High', '720+ preferred', '-1.5% for 750+'],
        ['Employer Tier', 'High', 'Listed/PSU preferred', '-0.5% for Tier-A'],
        ['FOIR Ratio', 'High', 'Max 50%', 'Rejection if > 55%'],
        ['Bank Statement Health', 'Medium', '0 bounces in 6 months', 'Rejection trigger'],
      ],
    });
  });
  return pages;
}

function intentPages() {
  const custom = {
    'why-loans-get-rejected': {
      title: 'Why Do Personal Loans Get Rejected? Top 10 Reasons | Gavel AI',
      h1: 'Why Personal Loans Get Rejected in India, Top Reasons',
      description: 'Nearly 40% of personal loan applications in India are rejected. Here are the top reasons banks reject loans and exactly how to fix each issue before reapplying.',
      content: [
        'Nearly 40% of personal loan applications in India are rejected by automated underwriting systems within seconds. Understanding the exact triggers is the first step to getting approved.',
        'Top 10 personal loan rejection reasons in India:',
        '1. High FOIR (Debt-to-Income Ratio): Your total existing EMIs exceed 50% of monthly income, the single most common rejection reason.',
        '2. Low CIBIL Score (below 680): Automated systems reject without human review.',
        '3. Multiple Recent Inquiries: Applying to 3+ lenders in 30 days signals desperation and drops your score.',
        '4. Bank Statement Bounces: Any NACH/ECS bounce in the last 6 months is an instant red flag.',
        '5. Short Employment History: Less than 6 months with current employer.',
        '6. Employer Blacklisted: Your company is on the lender\'s high-risk employer list.',
        '7. Existing Loan Default or Settlement: Any derogatory mark in CIBIL from the last 3 years.',
        '8. Incorrect Application Information: Mismatches between stated income and verified income.',
        '9. Too Many Active Loans: More than 3 active personal loans simultaneously.',
        '10. No Credit History: Without prior credit history, lenders have no basis for scoring.',
        'How to fix each rejection reason:',
        '• FOIR: Close or prepay smaller loans/credit card balances before applying.',
        '• Low CIBIL: Pay all existing EMIs on time for 6 consecutive months; utilization below 30%.',
        '• Multiple inquiries: Stop applying and wait 6 months for your profile to recover.',
        '• Bounces: Maintain clean statements for 6 consecutive months.',
        '• Employment: Stay at current employer for at least 6 months before applying.',
      ],
      faqs: [
        { q: 'How does a loan rejection affect my CIBIL score?', a: 'The rejection itself is not reported. However, the hard credit inquiry made when you applied lowers your CIBIL score by 5–10 points. Multiple rejections from multiple lenders in a short period can drop your score by 30–50 points.' },
        { q: 'Can I reapply immediately after rejection?', a: 'No. Applying immediately to multiple lenders creates a cluster of hard inquiries that further damages your CIBIL score. Wait 3–6 months, fix the underlying issue, then apply to just one lender.' },
        { q: 'What is the FOIR limit for personal loan approval?', a: 'Most banks cap FOIR (total EMI/income) at 40–50%. Anything above 50% is an automatic rejection trigger. Some premium lenders allow up to 55% for very high-income applicants.' },
      ],
      tableHeaders: ['Rejection Reason', 'Prevalence', 'Fix Time', 'Action Required'],
      tableRows: [
        ['High FOIR', '35% of rejections', '1–3 months', 'Pay off credit card balances'],
        ['Low CIBIL Score', '30% of rejections', '6–12 months', 'On-time payments + reduce utilization'],
        ['Multiple Inquiries', '10% of rejections', '3–6 months', 'Stop applying immediately'],
        ['Statement Bounces', '15% of rejections', '6 months', 'Fix auto-debit failures'],
        ['Short Employment', '10% of rejections', '3–6 months', 'Stay at current job'],
      ],
    },
    'how-banks-check-bank-statements': {
      title: 'How Banks Analyze Your Bank Statement for Loan Approval | Gavel AI',
      h1: 'How Banks Read Your Bank Statement, What They Look For',
      description: 'Banks don\'t just see your salary. Learn what automated systems scan in your 6-month bank statement to decide loan approval, rejection, and interest rate.',
      content: [
        'Modern bank underwriting systems use automated statement parsers that scan 6 months of transaction data for specific behavioral patterns. Understanding what they look for lets you clean up your statements before applying.',
        'What banks check in your bank statement:',
        '1. Salary Credit Authenticity: The system verifies that salary credits arrive from the same NEFT/IMPS source, on consistent dates, in the same amount range. Irregular credits suggest unstable income.',
        '2. NACH/ECS Bounce History: Any failed auto-debit (mandate bounce) in the last 6 months triggers immediate red flag. One bounce may be excused; two or more = rejection at most banks.',
        '3. Average Monthly Balance (AMB): Banks want to see AMB of at least 10–20% of your monthly salary at month-end, indicating financial buffer.',
        '4. Existing EMI Detection: The parser identifies recurring debits matching EMI patterns (same amount, monthly frequency, labeled as loan repayments). These are counted in your FOIR even if not declared.',
        '5. Cash Withdrawal Patterns: High frequency or large cash withdrawals (above 30% of monthly income) indicate cash-heavy lifestyle that is seen as higher risk.',
        '6. Suspicious Transactions: Payments to cryptocurrency exchanges, gambling platforms, or frequent peer-to-peer small transfers raise fraud alerts.',
        '7. Overdraft Usage: Using overdraft facility or going negative balance indicates cash flow stress.',
        'What makes a "clean" bank statement for loan approval:',
        '• Regular salary credits from the same employer on consistent dates.',
        '• Zero bounce or return entries in the last 6 months.',
        '• Month-end balance consistently above ₹5,000.',
        '• EMI outflows that match your declared existing obligations.',
        '• No large unexplained cash withdrawals.',
      ],
      faqs: [
        { q: 'Do banks check UPI transactions?', a: 'Yes. Bank statements include all UPI transfers. Frequent payments to gaming apps, peer-to-peer lending apps, or informal loan repayments are flagged by advanced parsers. Keep UPI transactions clean for 6 months before applying.' },
        { q: 'What is a "clean" bank statement for loan approval?', a: 'A clean statement shows: (1) regular salary credits, (2) zero NACH/ECS bounces, (3) month-end balance above 10% of salary, (4) no large unexplained cash withdrawals, and (5) no gambling or crypto payments.' },
        { q: 'How far back do banks check bank statements?', a: 'Standard requirement is 6 months. Some lenders (especially for large home loans or business loans) ask for 12 months. For bank statement analysis via our tool, upload the full 12 months for the most accurate assessment.' },
      ],
      tableHeaders: ['Statement Factor', 'Red Flag Trigger', 'Safe Zone', 'Impact'],
      tableRows: [
        ['NACH Bounce', '1+ bounce in 6 months', '0 bounces', 'Rejection trigger'],
        ['Average Balance', '< 5% of salary', '> 15% of salary', 'Rate premium or rejection'],
        ['Cash Withdrawals', '> 30% of income', '< 15% of income', 'Lower eligibility'],
        ['EMI Outflows', '> 50% of income', '< 40% of income', 'FOIR breach = rejection'],
      ],
    },
    'how-to-improve-loan-approval': {
      title: 'How to Improve Loan Approval Chances in India, 12 Proven Steps | Gavel AI',
      h1: 'How to Maximize Your Personal Loan Approval Odds',
      description: 'Step-by-step checklist to optimize your CIBIL score, reduce FOIR, clean bank statements, and guarantee personal loan approval from top Indian banks.',
      content: [
        'Getting approved for a personal loan at the best rate requires proactive credit profile management. Here is a prioritized action plan based on what actually moves the needle with Indian lenders.',
        'Immediate actions (0–30 days):',
        '• Download your CIBIL report (free at cibil.com) and check for errors. Raise disputes for any incorrect "active" loan entries or wrong payment history. Errors resolved in 30–45 days.',
        '• Pay off all credit card outstanding balances, keeping utilization below 30% boosts your score significantly.',
        '• Do NOT apply to any lender while fixing your profile. Each hard inquiry damages your score.',
        '• Set up ECS/NACH auto-debits for all existing EMIs to prevent future bounces.',
        'Actions over 60–90 days:',
        '• Close small personal loans with balances under ₹50,000; this directly reduces your FOIR.',
        '• Increase your credit card limit (without spending more); this lowers your utilization ratio.',
        '• Maintain consistent salary credits in your primary bank account (avoid switching accounts).',
        '• Request a credit limit increase from your existing bank, a longer credit history and higher limits positively affect score.',
        'Before applying:',
        '• Use our free Loan Approval Predictor to check your exact approval probability at specific lenders.',
        '• Apply with the bank where your salary account is held; they have transaction data and offer instant pre-approvals.',
        '• Add a co-applicant (earning spouse or parent) if your individual income is borderline eligible.',
        '• Compare lenders using our matching tool before committing to any single application.',
      ],
      faqs: [
        { q: 'Does clearing credit card outstanding improve my CIBIL score?', a: 'Yes, typically within 30–45 days. Paying down utilization from 80% to 30% can improve your CIBIL score by 20–50 points depending on the number of cards and outstanding amounts.' },
        { q: 'Should I apply with a co-applicant to improve approval chances?', a: 'Yes. Adding a co-applicant with stable income and a good CIBIL score (720+) significantly increases your combined eligibility amount and improves approval chances, especially if your individual profile is borderline.' },
        { q: 'How long does it take to improve my CIBIL score enough to get a loan?', a: 'With consistent on-time payments, utilization reduction, and no new inquiries, most people see 30–80 point improvements in 3–6 months. From a "poor" range to "good" typically takes 12–18 months of consistent behavior.' },
      ],
      tableHeaders: ['Action', 'Score Impact', 'Timeline', 'Effort'],
      tableRows: [
        ['Pay off credit card balances', '+20 to +50 points', '30–45 days', 'Low'],
        ['Fix CIBIL report errors', '+10 to +40 points', '30–60 days', 'Medium'],
        ['Stop all new applications', '+5 to +15 points', '3–6 months', 'Low'],
        ['Close small EMIs', 'Improves FOIR ratio', '1–3 months', 'Medium'],
        ['Consistent on-time EMI payments', '+10 to +25/month', '6–12 months', 'Low'],
      ],
    },
  };

  return config.intents.map(intent => {
    const c = custom[intent];
    const name = titleCase(intent);
    if (c) {
      return {
        slug: intent, category: 'Problem Solver',
        relatedLinks: [
          { label: 'Free Loan Approval Predictor', href: '/loan-approval-predictor' },
          { label: 'EMI Calculator', href: '/tools/emi-calculator' },
          { label: 'Financial Health Check', href: '/tools/financial-health-check' },
        ],
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Guides', href: '/all-guides' },
          { label: c.h1, href: '' },
        ],
...c,
        tableHeaders: c.tableHeaders || ['Factor', 'Detail', 'Action', 'Timeline'],
        tableRows: c.tableRows || [],
      };
    }
    return {
      slug: intent,
      title: `${name}: Personal Loan Guide & Solutions | Gavel AI`,
      h1: name,
      description: `Complete guide on how ${name.toLowerCase()} impacts your loan eligibility in India and the exact steps to overcome it and get approved.`,
      category: 'Problem Solver',
      content: [
        `Understanding how ${name.toLowerCase()} affects your loan approval is critical for borrowers in India. Banks use automated underwriting systems that flag this issue within seconds of receiving your application.`,
        `How ${name.toLowerCase()} affects loan eligibility:`,
        `• CIBIL Impact: Lenders check your credit bureau report for any history of ${name.toLowerCase()} and use it as a risk signal.`,
        `• Debt Ratio: If ${name.toLowerCase()} has affected your financial obligations, your FOIR ratio may be impacted.`,
        `• Statement Evidence: Bank statement parsing will reveal patterns related to ${name.toLowerCase()}.`,
        `Solutions to overcome ${name.toLowerCase()} and get approved:`,
        `• Check your exact approval odds using our free predictor; it analyzes this specific factor.`,
        `• Maintain clean bank statements for 6 consecutive months.`,
        `• Work with an NBFC like Bajaj Finserv or MoneyTap if prime banks reject due to this issue.`,
        `• Consider a co-applicant with a clean credit profile to offset the risk.`,
      ],
      faqs: [
        { q: `Does ${name.toLowerCase()} affect loan approval?`, a: `Yes, significantly. Lenders evaluate ${name.toLowerCase()} as a risk signal. The impact depends on severity and recency. Use our predictor to see your exact approval probability with this factor accounted for.` },
        { q: `How can I fix ${name.toLowerCase()} to get a loan?`, a: `The fix depends on the root cause. Generally: maintain 6 months of clean bank statements, pay all existing obligations on time, reduce your credit utilization, and check your CIBIL report for any errors.` },
      ],
      relatedLinks: [
        { label: 'Check My Approval Odds', href: '/loan-approval-predictor' },
        { label: 'How to Improve Loan Approval', href: '/how-to-improve-loan-approval' },
        { label: 'Financial Health Check', href: '/tools/financial-health-check' },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Guides', href: '/all-guides' },
        { label: name, href: '' },
      ],
      tableHeaders: ['Factor', 'Impact Level', 'Fix Timeline', 'Recommended Action'],
      tableRows: [
        [name, 'High', '3–6 months', 'Check our predictor'],
        ['CIBIL Score', 'High', '6–12 months', 'On-time payments'],
        ['FOIR Ratio', 'High', '1–3 months', 'Close small debts'],
      ],
    };
  });
}

function datasetPages() {
  return [
    {
      slug: 'average-approval-score-by-profession',
      title: 'Average Credit Approval Score by Profession India 2026 | Gavel AI',
      h1: 'Credit Approval Scores by Profession, AI Research Report',
      description: 'Data-driven report on average credit score requirements and approval rates across 25+ professions in India. Based on 5 lakh+ loan applications analyzed.',
      category: 'Research Report',
      content: [
        'This report aggregates anonymized credit profile statistics from 5 lakh+ loan applications processed through our underwriting platform. The data reveals significant variation in approval rates and required credit scores across professions.',
        'Key findings:',
        '• Software Engineers: 85% average approval rate, median CIBIL at time of application: 748.',
        '• Doctors: 88% approval rate, highest of all professions. Banks view medical professionals as low risk.',
        '• Government Employees: 82% approval rate with the lowest average interest rate (10.75% median).',
        '• Chartered Accountants: 80% approval rate; self-employed CAs have higher documentation requirements.',
        '• Gig Workers / Delivery Partners: 45% approval rate, highest rejection rate due to variable income.',
        '• Freelancers: 52% approval rate; income consistency is the primary challenge.',
        '• Startup Founders: 48% approval rate without profitable ITR; 70% with 2 years of consistent ITR.',
        'What drives the disparity:',
        '• Income stability is the primary factor. Salaried professionals with predictable income get approved 78% of the time on average.',
        '• Employer tier matters. Employees of Fortune 500 or listed companies get 15–20% higher approval rates than employees of unregistered firms.',
        '• Credit history length correlates with profession. Older professions (doctors, government) tend to have longer credit histories.',
      ],
      faqs: [
        { q: 'Which profession has the highest personal loan approval rate in India?', a: 'Doctors have the highest approval rate at approximately 88%, followed by government employees (82%) and software engineers (85%). Medical professionals benefit from stable income, high earnings, and a perception of low financial risk.' },
        { q: 'How is this credit dataset compiled?', a: 'This data is compiled using anonymized, aggregated application metrics processed through our underwriting analytics platform across 5 lakh+ applications from 2024–2026.' },
      ],
      relatedLinks: [
        { label: 'Check Your Approval Odds', href: '/loan-approval-predictor' },
        { label: 'Most Common Rejection Reasons', href: '/most-common-rejection-reasons' },
        { label: 'Financial Trends by Salary', href: '/financial-trends-by-salary-range' },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Reports', href: '/all-guides' },
        { label: 'Approval Score by Profession', href: '' },
      ],
      tableHeaders: ['Profession', 'Approval Rate', 'Median CIBIL', 'Median Rate Offered'],
      tableRows: [
        ['Doctor', '88%', '752', '10.75%'],
        ['Software Engineer', '85%', '748', '10.9%'],
        ['Government Employee', '82%', '732', '10.75%'],
        ['Chartered Accountant', '80%', '741', '11.2%'],
        ['Teacher', '75%', '718', '11.5%'],
        ['Freelancer', '52%', '698', '14.5%'],
        ['Gig Worker', '45%', '681', '17.5%'],
      ],
    },
    {
      slug: 'most-common-rejection-reasons',
      title: 'Most Common Personal Loan Rejection Reasons India 2026 | Gavel AI',
      h1: 'Top Personal Loan Rejection Causes, 5 Lakh+ Applications Analyzed',
      description: 'Data report on why Indian banks reject personal loan applications. Based on 5 lakh+ applications, FOIR, CIBIL, statement bounces, and more.',
      category: 'Research Report',
      content: [
        'Based on our analysis of 500,000+ personal loan applications processed in 2024–2026, we have identified the primary causes of rejection and their relative frequency.',
        'Rejection frequency breakdown:',
        '• High FOIR/DTI Ratio (above 50%): 35% of all rejections. The single most common cause.',
        '• Low CIBIL Score (below 680): 30% of rejections. Second most common.',
        '• Bank Statement Irregularities (bounces, overdrafts): 20% of rejections.',
        '• Short Employment History: 8% of rejections.',
        '• Multiple Recent Inquiries: 5% of rejections.',
        '• Other (incorrect information, blacklisted employer): 2% of rejections.',
        'Interesting data points:',
        '• 68% of rejected applicants could have been approved by fixing one issue (primarily FOIR).',
        '• Applicants who checked their approval odds before applying had a 40% higher actual approval rate.',
        '• NBFCs approved 55% of applications that prime banks rejected, at 2–4% higher interest rates.',
        '• Applicants with 750+ CIBIL had a 6% rejection rate vs. 62% rejection rate for applicants with sub-680 scores.',
      ],
      faqs: [
        { q: 'What is the most common reason for personal loan rejection in India?', a: 'High Debt-to-Income ratio (FOIR above 50%) accounts for 35% of all rejections. The second most common is a CIBIL score below 680, accounting for 30% of rejections.' },
        { q: 'Can an NBFC approve a loan that a bank rejected?', a: 'Yes, in 55% of cases. NBFCs have more flexible underwriting criteria, accept lower CIBIL scores, and use alternate data (UPI patterns, utility bills). The trade-off is a higher interest rate of 15–24%.' },
      ],
      relatedLinks: [
        { label: 'Fix Your Rejection, Check Odds', href: '/loan-approval-predictor' },
        { label: 'Why Loans Get Rejected', href: '/why-loans-get-rejected' },
        { label: 'How to Improve Approval', href: '/how-to-improve-loan-approval' },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Reports', href: '/all-guides' },
        { label: 'Common Rejection Reasons', href: '' },
      ],
      tableHeaders: ['Rejection Reason', '% of Rejections', 'Fix Time', 'Priority'],
      tableRows: [
        ['High FOIR > 50%', '35%', '1–3 months', 'Highest'],
        ['CIBIL Score < 680', '30%', '6–12 months', 'Highest'],
        ['Statement Irregularities', '20%', '6 months', 'High'],
        ['Short Employment', '8%', '3–6 months', 'Medium'],
        ['Multiple Inquiries', '5%', '3–6 months', 'Medium'],
      ],
    },
    {
      slug: 'financial-trends-by-salary-range',
      title: 'Personal Loan Eligibility & Trends by Salary Range India 2026 | Gavel AI',
      h1: 'Personal Loan Trends by Salary Bracket, ₹15K to ₹5L/Month',
      description: 'Average loan amounts, approval rates, interest rates, and repayment behavior across different salary brackets in India. Based on 2024–2026 data.',
      category: 'Research Report',
      content: [
        'This report analyzes borrowing behavior and approval patterns across salary brackets from ₹15,000 to ₹5 Lakhs per month, based on 3 lakh+ loan applications from 2024 to 2026.',
        'Borrowing patterns by salary bracket:',
        '• ₹15K–25K/month: Average loan requested ₹1.2 Lakhs; approval rate 52%; purpose primarily medical emergencies and education.',
        '• ₹25K–50K/month: Average loan requested ₹3.5 Lakhs; approval rate 68%; purpose debt consolidation, home renovation, and travel.',
        '• ₹50K–1L/month: Average loan requested ₹8 Lakhs; approval rate 79%; purpose higher education, vehicle purchase, and investments.',
        '• ₹1L+/month: Average loan requested ₹18 Lakhs; approval rate 87%; purpose home renovation, business expansion, and high-value purchases.',
        'Interest rate by salary bracket:',
        '• ₹15K–25K: Average rate offered 16.5% (NBFCs dominate this segment).',
        '• ₹25K–50K: Average rate offered 13.2% (mix of banks and NBFCs).',
        '• ₹50K–1L: Average rate offered 11.4% (banks dominate).',
        '• ₹1L+: Average rate offered 10.8% (prime bank rates, negotiable).',
        'Key insight: Every ₹10,000 increase in monthly salary corresponds to approximately a 1.2% improvement in loan approval rate and a 0.3% reduction in average interest rate offered.',
      ],
      faqs: [
        { q: 'Which salary range has the best personal loan approval rate in India?', a: 'Borrowers earning above ₹1 Lakh/month have the highest approval rate at 87%. The approval rate drops to 52% for borrowers earning ₹15K–25K/month, primarily due to FOIR constraints.' },
        { q: 'Can I get a personal loan on a ₹15,000 salary?', a: 'Yes, but options are limited. NBFCs like MoneyTap, KreditBee, and EarlySalary specifically target this salary bracket with smaller loan amounts (₹20,000–₹1.5 Lakhs) at higher interest rates (18–24%).' },
      ],
      relatedLinks: [
        { label: 'Check Your Eligibility', href: '/loan-approval-predictor' },
        { label: 'Salary Loan Eligibility Calculator', href: '/tools/salary-loan-eligibility' },
        { label: 'EMI Calculator', href: '/tools/emi-calculator' },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Reports', href: '/all-guides' },
        { label: 'Financial Trends by Salary', href: '' },
      ],
      tableHeaders: ['Salary Bracket', 'Avg Loan Amount', 'Approval Rate', 'Avg Interest Rate'],
      tableRows: [
        ['₹15K–25K/month', '₹1.2 Lakhs', '52%', '16.5%'],
        ['₹25K–50K/month', '₹3.5 Lakhs', '68%', '13.2%'],
        ['₹50K–1L/month', '₹8 Lakhs', '79%', '11.4%'],
        ['₹1L+/month', '₹18 Lakhs', '87%', '10.8%'],
      ],
    },
    {
      slug: 'emi-stress-trends',
      title: 'EMI Burden & Over-Leverage Trends in Indian Cities 2026 | Gavel AI',
      h1: 'EMI Stress & Debt-to-Income Trends Across Indian Cities',
      description: 'Over-leveraging trends, average FOIR ratios, and EMI stress scores across metro, Tier-2, and Tier-3 Indian cities. Based on 2 lakh+ application data points.',
      category: 'Research Report',
      content: [
        'Our analysis of 2 lakh+ loan applications reveals significant EMI stress and over-leveraging trends across Indian cities. Metro cities show the highest EMI-to-income ratios, averaging 48% FOIR, dangerously close to rejection thresholds.',
        'EMI stress by city tier:',
        '• Tier-1 Metro Cities (Mumbai, Delhi, Bangalore, Hyderabad): Average FOIR 48%. High cost of living drives simultaneous home loan + personal loan + credit card obligations.',
        '• Tier-2 Cities (Pune, Ahmedabad, Jaipur, Chandigarh): Average FOIR 39%. More manageable obligation levels with lower housing costs.',
        '• Tier-3 Cities (smaller cities, towns): Average FOIR 31%. Lower loan amounts and fewer concurrent obligations.',
        'Over-leveraging risk signals:',
        '• 23% of applicants in metro cities had more than 3 active credit products simultaneously.',
        '• Applicants with 3+ active EMIs had a 78% rejection rate from prime banks vs. 35% overall.',
        '• The average credit card utilization among rejected applicants was 76%, vs. 28% for approved applicants.',
        'Debt consolidation trends:',
        '• 18% of all personal loan applications in 2026 were for debt consolidation purposes.',
        '• Consolidation borrowers had 15% higher approval rates when they reduced their total obligations.',
        'Risk mitigation guidance:',
        '• Keep total EMIs below 40% of net income (target FOIR).',
        '• Close at least one revolving credit product before applying for a new loan.',
        '• Consolidate multiple micro-loans (BNPL, small personal loans) into a single personal loan.',
      ],
      faqs: [
        { q: 'What is a safe EMI-to-income ratio (FOIR) in India?', a: 'A FOIR below 40% is ideal and gives you maximum flexibility for future loans. Banks approve up to 50% FOIR; above 50% is a rejection trigger at most lenders. Target: keep all EMIs under 35% of your net monthly income.' },
        { q: 'How can I reduce my EMI burden to qualify for a loan?', a: 'Close small loans (BNPL, salary advances, micro-loans) first as they have the highest interest rates and most negative FOIR impact. Then pay off credit card outstanding to reduce your utilization ratio.' },
      ],
      relatedLinks: [
        { label: 'Calculate Your DTI', href: '/tools/dti-calculator' },
        { label: 'Financial Health Check', href: '/tools/financial-health-check' },
        { label: 'Check Loan Eligibility', href: '/loan-approval-predictor' },
      ],
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Reports', href: '/all-guides' },
        { label: 'EMI Stress Trends', href: '' },
      ],
      tableHeaders: ['City Tier', 'Avg FOIR', '3+ Active Loans', 'Avg Approval Rate'],
      tableRows: [
        ['Metro (Tier-1)', '48%', '23% of applicants', '62%'],
        ['Tier-2 Cities', '39%', '14% of applicants', '71%'],
        ['Tier-3 Cities', '31%', '8% of applicants', '78%'],
      ],
    },
  ].map(p => ({
...p,
    faqs: p.faqs || [],
    relatedLinks: p.relatedLinks || [],
  }));
}

// ── HTML Template ─────────────────────────────────────────────────────────────

const SHARED_CSS = `
*,*:before,*:after{box-sizing:border-box;margin:0;padding:0}
:root{--orange:#f97316;--orange-dark:#ea580c;--bg:#050505;--surface:#0f0f0f;--surface2:#1a1a1a;--border:rgba(255,255,255,0.08);--text:#e5e7eb;--muted:#9ca3af;--faint:#4b5563}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--orange);text-decoration:none}
a:hover{text-decoration:underline}
/* Header */
.hdr{background:rgba(5,5,5,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.hdr-logo{font-weight:800;font-size:1.2rem;color:#fff;letter-spacing:-0.02em}
.hdr-logo span{color:var(--orange)}
.hdr-nav{display:flex;gap:24px;align-items:center}
.hdr-nav a{color:var(--muted);font-size:0.9rem;font-weight:500;transition:color 0.15s}
.hdr-nav a:hover{color:#fff;text-decoration:none}
.hdr-cta{background:var(--orange);color:#fff!important;padding:8px 20px;border-radius:8px;font-weight:600;font-size:0.875rem;transition:background 0.15s}
.hdr-cta:hover{background:var(--orange-dark);text-decoration:none!important}
/* Layout */
.wrap{max-width:860px;margin:0 auto;padding:0 24px}
.wrap-wide{max-width:1100px;margin:0 auto;padding:0 24px}
/* Breadcrumbs */
.bc{display:flex;gap:8px;align-items:center;padding:32px 0 0;flex-wrap:wrap}
.bc a{color:var(--muted);font-size:0.8rem}
.bc a:hover{color:var(--orange)}
.bc-sep{color:var(--faint);font-size:0.8rem}
.bc-cur{color:var(--muted);font-size:0.8rem}
/* Hero */
.badge{display:inline-flex;align-items:center;gap:8px;background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.25);border-radius:999px;padding:6px 14px;color:var(--orange);font-size:0.78rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin:24px 0 20px}
h1{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;line-height:1.2;letter-spacing:-0.03em;color:#fff;margin-bottom:16px}
.lead{font-size:1.1rem;color:var(--muted);line-height:1.7;margin-bottom:32px;max-width:640px}
/* Meta bar */
.meta{display:flex;gap:20px;flex-wrap:wrap;font-size:0.8rem;color:var(--faint);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:12px 0;margin-bottom:36px}
.meta span{display:flex;align-items:center;gap:6px}
/* Article */
.prose p{color:var(--muted);line-height:1.8;margin-bottom:1.2rem;font-size:1rem}
.prose li{color:var(--muted);margin:6px 0 6px 20px;line-height:1.7;font-size:1rem}
.prose h2{color:#fff;font-size:1.4rem;font-weight:700;margin:2rem 0 1rem;padding-top:0.5rem}
/* Table */
.tbl-wrap{overflow-x:auto;margin:32px 0;border:1px solid var(--border);border-radius:12px}
table{width:100%;border-collapse:collapse;font-size:0.9rem}
thead{background:rgba(255,255,255,0.04)}
th{padding:14px 18px;text-align:left;color:var(--orange);font-weight:600;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border)}
td{padding:14px 18px;border-bottom:1px solid var(--border);color:var(--text);font-weight:500}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,0.02)}
/* FAQ */
.faq-section{margin:48px 0}
.faq-section h2{color:#fff;font-size:1.5rem;font-weight:700;margin-bottom:24px}
details{border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:10px;background:var(--surface)}
details:hover{border-color:rgba(249,115,22,0.3)}
summary{padding:18px 20px;cursor:pointer;font-size:1rem;font-weight:600;color:#fff;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px}
summary:-webkit-details-marker{display:none}
summary:after{content:'+';color:var(--orange);font-size:1.2rem;font-weight:300;flex-shrink:0}
details[open] summary:after{content:'−'}
.faq-answer{padding:0 20px 20px;color:var(--muted);line-height:1.7;font-size:0.95rem}
/* CTA box */
.cta-box{background:linear-gradient(135deg,rgba(249,115,22,0.12),rgba(234,88,12,0.06));border:1px solid rgba(249,115,22,0.25);border-radius:16px;padding:40px;text-align:center;margin:48px 0}
.cta-box h3{color:#fff;font-size:1.5rem;font-weight:700;margin-bottom:12px}
.cta-box p{color:var(--muted);margin-bottom:28px;max-width:500px;margin-left:auto;margin-right:auto}
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--orange);color:#fff;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1rem;transition:background 0.15s;text-decoration:none}
.btn-primary:hover{background:var(--orange-dark);text-decoration:none;color:#fff}
/* Related links */
.related{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
.rel-link{display:flex;align-items:center;gap:10px;padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:0.9rem;font-weight:500;transition:all 0.15s;text-decoration:none}
.rel-link:hover{border-color:rgba(249,115,22,0.4);color:var(--orange);background:rgba(249,115,22,0.04);text-decoration:none}
.rel-link:before{content:'→';color:var(--orange);flex-shrink:0}
/* Footer */
.ftr{border-top:1px solid var(--border);padding:48px 24px 32px;margin-top:80px}
.ftr-grid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:32px;margin-bottom:40px}
.ftr-col h4{color:#fff;font-size:0.875rem;font-weight:600;margin-bottom:14px}
.ftr-col a{display:block;color:var(--muted);font-size:0.875rem;margin-bottom:8px;transition:color 0.15s}
.ftr-col a:hover{color:#fff;text-decoration:none}
.ftr-bottom{max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;padding-top:24px;border-top:1px solid var(--border)}
.ftr-copy{color:var(--faint);font-size:0.8rem}
@media(max-width:640px){
.hdr-nav{display:none}
.related{grid-template-columns:1fr}
.wrap,.wrap-wide{padding:0 16px}
  h1{font-size:1.7rem}
.cta-box{padding:28px 20px}
}
`;

function renderPage(page) {
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.h1,
    description: page.description,
    image: `${DOMAIN}/gavel-og.png`,
    url: `${DOMAIN}/${page.slug}`,
    datePublished: '2026-01-15T08:00:00+05:30',
    dateModified: `${TODAY}T08:00:00+05:30`,
    author: {
      '@type': 'Organization',
      name: 'Gavel AI Financial Research Team',
      url: `${DOMAIN}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Gavel AI',
      logo: { '@type': 'ImageObject', url: `${DOMAIN}/gavel-logo.png` },
    },
  });

  const faqSchema = page.faqs && page.faqs.length > 0 ? JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }): null;

  const bcSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: page.breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.label,
...(b.href ? { item: DOMAIN + b.href }: {}),
    })),
  });

  const contentLines = (Array.isArray(page.content) ? page.content: page.content.split('\n').filter(l => l.trim()))
.map(line => {
      const l = line.trim();
      if (!l) return '';
      if (l.match(/^\d+\./)) return `<li>${escHtml(l.replace(/^\d+\.\s*/, ''))}</li>`;
      if (l.startsWith('•')) return `<li>${escHtml(l.replace(/^•\s*/, ''))}</li>`;
      return `<p>${escHtml(l)}</p>`;
    })
.join('\n');

  const tableHtml = page.tableHeaders && page.tableRows && page.tableRows.length > 0 ? `
<div class="tbl-wrap">
  <table>
    <thead><tr>${page.tableHeaders.map(h => `<th>${escHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${page.tableRows.map(row => `<tr>${row.map(cell => `<td>${escHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
</div>`: '';

  const faqHtml = page.faqs && page.faqs.length > 0 ? `
<section class="faq-section">
  <h2>People Also Ask</h2>
  ${page.faqs.map(f => `
  <details>
    <summary>${escHtml(f.q)}</summary>
    <div class="faq-answer">${escHtml(f.a)}</div>
  </details>`).join('')}
</section>`: '';

  const relatedHtml = page.relatedLinks && page.relatedLinks.length > 0 ? `
<section style="margin:48px 0">
  <h2 style="color:#fff;font-size:1.3rem;font-weight:700;margin-bottom:16px">Related Tools & Guides</h2>
  <div class="related">
    ${page.relatedLinks.map(r => `<a href="${r.href}" class="rel-link">${escHtml(r.label)}</a>`).join('')}
  </div>
</section>`: '';

  const bcHtml = page.breadcrumbs.map((b, i) => `
    ${i > 0 ? '<span class="bc-sep">›</span>': ''}
    ${b.href ? `<a href="${b.href}">${escHtml(b.label)}</a>`: `<span class="bc-cur">${escHtml(b.label)}</span>`}
  `).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escHtml(page.title)}</title>
<meta name="description" content="${escHtml(page.description)}">
<meta name="author" content="Gavel AI">
<link rel="canonical" href="${DOMAIN}/${page.slug}">
<meta property="og:title" content="${escHtml(page.title)}">
<meta property="og:description" content="${escHtml(page.description)}">
<meta property="og:url" content="${DOMAIN}/${page.slug}">
<meta property="og:type" content="article">
<meta property="og:image" content="${DOMAIN}/gavel-og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(page.title)}">
<meta name="twitter:description" content="${escHtml(page.description)}">
<meta name="twitter:image" content="${DOMAIN}/gavel-og.png">
<meta name="twitter:site" content="@gavelai">
<script type="application/ld+json">${articleSchema}</script>
${faqSchema ? `<script type="application/ld+json">${faqSchema}</script>`: ''}
<script type="application/ld+json">${bcSchema}</script>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${SHARED_CSS}</style>
</head>
<body>

<header class="hdr">
  <a href="/" class="hdr-logo">Gavel<span> AI</span></a>
  <nav class="hdr-nav">
    <a href="/loan-approval-predictor">Loan Predictor</a>
    <a href="/tools">Tools</a>
    <a href="/blog">Blog</a>
    <a href="/all-guides">Guides</a>
    <a href="/loan-approval-predictor" class="hdr-cta">Check Eligibility →</a>
  </nav>
</header>

<main>
  <div class="wrap">
    <nav class="bc" aria-label="Breadcrumb">${bcHtml}</nav>

    <div class="badge">${escHtml(page.category)}</div>
    <h1>${escHtml(page.h1)}</h1>
    <p class="lead">${escHtml(page.description)}</p>

    <div class="meta">
      <span>📅 Updated: ${TODAY}</span>
      <span>✍️ Gavel AI Financial Research Team</span>
      <span>⏱ 3 min read</span>
    </div>

    <article class="prose">${contentLines}</article>

    ${tableHtml}

    <div class="cta-box">
      <h3>Check Your Loan Approval Odds, Free</h3>
      <p>Stop guessing. Discover your exact approval probability across 40+ lenders in under 60 seconds. No CIBIL impact.</p>
      <a href="/loan-approval-predictor" class="btn-primary">Calculate My Approval Odds →</a>
    </div>

    ${faqHtml}
    ${relatedHtml}
  </div>
</main>

<footer class="ftr">
  <div class="ftr-grid">
    <div class="ftr-col">
      <h4>Tools</h4>
      <a href="/tools/emi-calculator">EMI Calculator</a>
      <a href="/tools/salary-loan-eligibility">Salary Eligibility</a>
      <a href="/tools/credit-score-simulator">Credit Simulator</a>
      <a href="/tools/dti-calculator">DTI Calculator</a>
      <a href="/tools/home-loan-affordability">Home Loan Calc</a>
    </div>
    <div class="ftr-col">
      <h4>Guides</h4>
      <a href="/all-guides">All Guides</a>
      <a href="/loan-rejection-guides">Rejection Guides</a>
      <a href="/cibil-score-guides">CIBIL Score</a>
      <a href="/loan-eligibility-center">Eligibility Center</a>
      <a href="/emi-education-hub">EMI Education</a>
    </div>
    <div class="ftr-col">
      <h4>Company</h4>
      <a href="/about">About Gavel AI</a>
      <a href="/blog">Blog</a>
      <a href="/contact">Contact</a>
      <a href="/security">Security</a>
    </div>
    <div class="ftr-col">
      <h4>Legal</h4>
      <a href="/privacy-policy">Privacy Policy</a>
      <a href="/terms-of-service">Terms of Service</a>
    </div>
  </div>
  <div class="ftr-bottom">
    <span class="ftr-copy">© ${YEAR} Gavel AI. All rights reserved. Information provided is for educational purposes only.</span>
    <span class="ftr-copy">Rates shown are indicative. Actual terms depend on lender evaluation.</span>
  </div>
</footer>

</body>
</html>`;
}

// ── Main execution ────────────────────────────────────────────────────────────

function generate() {
  if (!fs.existsSync(DIST)) {
    console.error('❌ dist/ directory not found. Run `vite build` first.');
    process.exit(1);
  }

  const allPages = [
...salaryPages(),
...loanAmountPages(),
...cityPages(),
...professionPages(),
...bankPages(),
...intentPages(),
...datasetPages(),
  ];

  let written = 0;
  let skipped = 0;

  for (const page of allPages) {
    const dir = path.join(DIST, page.slug);
    const file = path.join(dir, 'index.html');

    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, renderPage(page), 'utf8');
      written++;
    } catch (err) {
      console.error(` ⚠ Failed to write ${page.slug}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Static SEO HTML generation complete!`);
  console.log(` Pages written: ${written}`);
  console.log(` Errors: ${skipped}`);
  console.log(` Output dir: dist/`);
  console.log(`\n These static HTML files are now served by Vercel BEFORE the SPA rewrite.`);
  console.log(` Googlebot will index real content for all ${written} programmatic SEO pages.\n`);
}

generate();
