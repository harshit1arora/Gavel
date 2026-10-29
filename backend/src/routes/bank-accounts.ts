import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createBankAccount,
  getBankAccount,
  listBankAccounts,
  updateBankAccountBalance,
  deleteBankAccount,
  testBankConnection,
} from '../services/banking';

const router = Router();

// Get all bank accounts for organization
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accounts = await listBankAccounts(req.orgId!);
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error listing bank accounts:', error);
    res.status(500).json({ error: 'Failed to list bank accounts' });
  }
});

// Get specific bank account
router.get('/:accountId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await getBankAccount(req.orgId!, req.params.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    res.status(200).json(account);
  } catch (error) {
    console.error('Error getting bank account:', error);
    res.status(500).json({ error: 'Failed to get bank account' });
  }
});

// Create new bank account
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
    } = req.body;

    // Validate required fields
    if (!bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        error: 'bankName, accountNumber, and ifscCode are required',
      });
    }

    // Validate IFSC format (11 characters)
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      return res.status(400).json({ error: 'Invalid IFSC code format' });
    }

    const accountId = await createBankAccount(req.orgId!, {
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
      status: 'Connected',
      balance: 0,
    });

    res.status(201).json({
      id: accountId,
      message: 'Bank account added successfully',
    });
  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ error: 'Failed to create bank account' });
  }
});

// Test bank account connection
router.post('/:accountId/test', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await getBankAccount(req.orgId!, req.params.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    const result = await testBankConnection(account);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error testing bank connection:', error);
    res.status(500).json({ error: 'Failed to test bank connection' });
  }
});

// Fetch current account balance (mock implementation)
router.get('/:accountId/balance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await getBankAccount(req.orgId!, req.params.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    // TODO: Fetch from actual banking API (Setu, Razorpay, etc.)
    // For now, return stored balance
    res.status(200).json({
      accountId: req.params.accountId,
      balance: account.balance || 0,
      lastFetchedAt: account.lastFetchedAt,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Manually update account balance (for testing or manual updates)
router.post('/:accountId/balance/update', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { balance } = req.body;

    if (typeof balance !== 'number' || balance < 0) {
      return res.status(400).json({ error: 'balance must be a non-negative number' });
    }

    await updateBankAccountBalance(req.orgId!, req.params.accountId, balance);

    res.status(200).json({
      success: true,
      message: 'Balance updated successfully',
      balance,
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Delete bank account
router.delete('/:accountId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteBankAccount(req.orgId!, req.params.accountId);

    res.status(200).json({ success: true, message: 'Bank account deleted' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

export default router;
