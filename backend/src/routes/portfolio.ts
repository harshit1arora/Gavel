import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// In-memory storage for demo
const loans: any[] = [];
const loanIdCounter = 1;

// Initialize with demo data
const initializeLoans = () => {
  if (loans.length === 0) {
    const names = [
      "Rajesh Kumar", "Priya Sharma", "Mahendra Singh", "Anita Devi", "Suresh Patel",
      "Vijay Malhotra", "Sunita Rani", "Arun Joshi", "Kavita Devi", "Rajendra Prasad",
      "Geeta Sharma", "Mohan Lal", "Pushpa Devi", "Ajay Kumar", "Meena Kumari",
      "Vikram Singh", "Anil Kumar", "Ramesh Gupta", "Sanjay Sharma", "Vijay Kumar",
      "Deepak Sharma", "Poonam Devi", "Sanjeev Kapoor", "Rekha Singh", "Gaurav Mishra"
    ];
    
    const purposes = ["Personal", "Home", "Business", "Vehicle", "Education"];
    const employmentTypes = ["Salaried", "Self-Employed", "Business Owner", "Freelancer"];
    const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"];
    const statuses = ["active", "active", "active", "active", "repaid", "NPA"];
    const emiStatuses = ["current", "current", "current", "0-30", "30-60", "60-90"];
    const collaterals = ["None", "Property", "Vehicle", "Gold", "FD"];
    
    names.forEach((name, idx) => {
      const loanAmount = Math.floor(Math.random() * 900000) + 50000;
      const tenure = Math.floor(Math.random() * 36) + 6;
      const monthsElapsed = Math.floor(Math.random() * tenure);
      const interestRate = 10 + Math.floor(Math.random() * 8);
      const emiAmount = Math.round(loanAmount / tenure);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const emiStatus = emiStatuses[Math.floor(Math.random() * emiStatuses.length)];
      
      loans.push({
        id: `LN${String(idx + 1).padStart(5, '0')}`,
        borrowerName: name,
        loanAmount,
        disbursedAmount: loanAmount,
        outstandingAmount: status === "repaid" ? 0 : Math.round(loanAmount * (1 - monthsElapsed/tenure)),
        emiAmount,
        tenure,
        tenureRemaining: Math.max(0, tenure - monthsElapsed),
        interestRate,
        status,
        emiStatus,
        startDate: new Date(Date.now() - monthsElapsed * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextPaymentDate: new Date(Date.now() + Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastPaymentDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        creditScore: 500 + Math.floor(Math.random() * 250),
        employmentType: employmentTypes[Math.floor(Math.random() * employmentTypes.length)],
        city: cities[Math.floor(Math.random() * cities.length)],
        purpose: purposes[Math.floor(Math.random() * purposes.length)],
        collateral: collaterals[Math.floor(Math.random() * collaterals.length)],
        interestEarned: Math.round(loanAmount * interestRate * (monthsElapsed / 1200)),
        profit: Math.round(loanAmount * interestRate * (monthsElapsed / 1200) * 0.7)
      });
    });
  }
};

initializeLoans();

// Get all loans
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    
    let filtered = [...loans];
    
    if (status && status !== 'all') {
      filtered = filtered.filter(loan => loan.status === status);
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(loan => 
        loan.borrowerName.toLowerCase().includes(searchLower) ||
        loan.id.toLowerCase().includes(searchLower) ||
        loan.city.toLowerCase().includes(searchLower)
      );
    }
    
    res.status(200).json(filtered);
  } catch (error) {
    console.error('Error listing loans:', error);
    res.status(500).json({ error: 'Failed to list loans' });
  }
});

// Get loan by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loan = loans.find(l => l.id === req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.status(200).json(loan);
  } catch (error) {
    console.error('Error getting loan:', error);
    res.status(500).json({ error: 'Failed to get loan' });
  }
});

// Get portfolio metrics
router.get('/metrics/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activeLoans = loans.filter(l => l.status === 'active');
    const totalAUM = activeLoans.reduce((sum, l) => sum + l.outstandingAmount, 0);
    const disbursed = loans.reduce((sum, l) => sum + l.disbursedAmount, 0);
    const repaid = loans.filter(l => l.status === 'repaid').reduce((sum, l) => sum + l.disbursedAmount, 0);
    const totalInterest = loans.reduce((sum, l) => sum + l.interestEarned, 0);
    const npaLoans = loans.filter(l => l.status === 'NPA');
    const overdueLoans = loans.filter(l => l.emiStatus !== 'current');
    
    const emiBuckets = {
      current: loans.filter(l => l.emiStatus === 'current').length,
      "0-30": loans.filter(l => l.emiStatus === '0-30').length,
      "30-60": loans.filter(l => l.emiStatus === '30-60').length,
      "60-90": loans.filter(l => l.emiStatus === '60-90').length,
      "90+": loans.filter(l => l.emiStatus === '90+').length
    };
    
    res.status(200).json({
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      totalAUM,
      disbursed,
      repaid,
      totalInterest,
      defaultRate: ((npaLoans.length / loans.length) * 100).toFixed(1),
      npaAmount: npaLoans.reduce((sum, l) => sum + l.outstandingAmount, 0),
      overdueLoans: overdueLoans.length,
      avgTicketSize: activeLoans.length > 0 ? Math.round(totalAUM / activeLoans.length) : 0,
      monthlyEMI: activeLoans.reduce((sum, l) => sum + l.emiAmount, 0),
      emiBuckets
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Get portfolio trends
router.get('/metrics/trends', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trends = [
      { month: "Oct", disbursed: 4500000, outstanding: 8200000, repaid: 1200000 },
      { month: "Nov", disbursed: 5200000, outstanding: 9500000, repaid: 1400000 },
      { month: "Dec", disbursed: 4800000, outstanding: 10200000, repaid: 1500000 },
      { month: "Jan", disbursed: 5800000, outstanding: 11800000, repaid: 1800000 },
      { month: "Feb", disbursed: 6200000, outstanding: 13200000, repaid: 2000000 },
      { month: "Mar", disbursed: 7000000, outstanding: 15200000, repaid: 2200000 },
    ];
    
    res.status(200).json(trends);
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

// Get sector distribution
router.get('/metrics/sectors', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sectors = [
      { name: "Personal Loans", value: 35, color: "#3B82F6" },
      { name: "Business Loans", value: 28, color: "#22C55E" },
      { name: "Home Loans", value: 20, color: "#F59E0B" },
      { name: "Vehicle Loans", value: 12, color: "#8B5CF6" },
      { name: "Education", value: 5, color: "#EC4899" },
    ];
    
    res.status(200).json(sectors);
  } catch (error) {
    console.error('Error getting sectors:', error);
    res.status(500).json({ error: 'Failed to get sectors' });
  }
});

// Get income segmentation
router.get('/metrics/income-segmentation', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const segmentation = [
      { range: "<50K", count: 45, percentage: 18 },
      { range: "50K-1L", count: 85, percentage: 34 },
      { range: "1L-2L", count: 75, percentage: 30 },
      { range: "2L-5L", count: 35, percentage: 14 },
      { range: ">5L", count: 10, percentage: 4 },
    ];
    
    res.status(200).json(segmentation);
  } catch (error) {
    console.error('Error getting segmentation:', error);
    res.status(500).json({ error: 'Failed to get segmentation' });
  }
});

export default router;