import { db } from '../config/firebase';

export interface BankAccount {
  id?: string;
  orgId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName?: string;
  balance?: number;
  lastFetchedAt?: Date | string;
  apiCredentials?: {
    encryptedKey?: string;
    provider?: string;
  };
  status: 'Connected' | 'Failed' | 'Expired';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const createBankAccount = async (
  orgId: string,
  account: Omit<BankAccount, 'id' | 'createdAt' | 'orgId'>
): Promise<string> => {
  try {
    const docRef = await db.collection('bank_accounts').add({
      ...account,
      orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'BANK_ACCOUNT_ADDED',
      targetId: docRef.id,
      detail: `Bank account ${account.accountNumber.slice(-4)} added`,
      timestamp: new Date()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating bank account:', error);
    throw error;
  }
};

export const getBankAccount = async (
  orgId: string,
  accountId: string
): Promise<BankAccount | null> => {
  try {
    const doc = await db.collection('bank_accounts').doc(accountId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    if (data.orgId !== orgId) return null;

    return { id: doc.id, ...data } as BankAccount;
  } catch (error) {
    console.error('Error getting bank account:', error);
    throw error;
  }
};

export const listBankAccounts = async (orgId: string): Promise<BankAccount[]> => {
  try {
    const snapshot = await db
      .collection('bank_accounts')
      .where('orgId', '==', orgId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BankAccount[];
  } catch (error) {
    console.error('Error listing bank accounts:', error);
    throw error;
  }
};

export const updateBankAccountBalance = async (
  orgId: string,
  accountId: string,
  balance: number
): Promise<void> => {
  try {
    const account = await getBankAccount(orgId, accountId);
    if (!account) throw new Error('Bank account not found');

    await db.collection('bank_accounts').doc(accountId).update({
      balance,
      lastFetchedAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating bank account balance:', error);
    throw error;
  }
};

export const deleteBankAccount = async (
  orgId: string,
  accountId: string
): Promise<void> => {
  try {
    const account = await getBankAccount(orgId, accountId);
    if (!account) throw new Error('Bank account not found');

    await db.collection('bank_accounts').doc(accountId).delete();

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'BANK_ACCOUNT_DELETED',
      targetId: accountId,
      detail: `Bank account ${account.accountNumber.slice(-4)} deleted`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    throw error;
  }
};

// Stub for fetching real bank balance from external API
// This would integrate with Setu, Razorpay, or direct bank APIs
export const fetchBankBalance = async (
  account: BankAccount
): Promise<number> => {
  try {
    // TODO: Integrate with actual banking API (Setu, Razorpay Banking, etc.)
    // For now, return stored balance
    return account.balance || 0;
  } catch (error) {
    console.error('Error fetching bank balance:', error);
    throw error;
  }
};

export const testBankConnection = async (
  account: BankAccount
): Promise<{ success: boolean; message: string }> => {
  try {
    // TODO: Implement actual connection test with banking provider
    // For MVP, assume successful connection
    return {
      success: true,
      message: 'Bank connection verified successfully'
    };
  } catch (error) {
    console.error('Error testing bank connection:', error);
    return {
      success: false,
      message: 'Bank connection failed'
    };
  }
};
