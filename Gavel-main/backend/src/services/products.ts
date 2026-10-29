import { db } from '../config/firebase';

export interface CustomField {
  name: string;
  type: 'text' | 'number' | 'select' | 'date' | 'file' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: string; // regex pattern
  conditional?: {
    field: string;
    value: any;
  };
}

export interface EligibilityCriteria {
  minMonthlyIncome?: number;
  maxAge?: number;
  minAge?: number;
  minBureauScore?: number;
  maxEmiRatio?: number;
  employmentType?: string[];
  collateralRequired?: boolean;
  coApplicantRequired?: boolean;
}

export interface LoanProduct {
  id?: string;
  orgId: string;
  
  // Basic Info
  name: string;
  segment: 'Micro' | 'Consumer' | 'MSME';
  description?: string;
  isActive: boolean;
  
  // Loan Amounts
  minAmount: number;
  maxAmount: number;
  defaultAmount?: number;
  
  // Tenure
  minTenor: number; // months
  maxTenor: number;
  defaultTenor?: number;
  
  // Interest
  rateType: 'fixed' | 'variable';
  rate: number;
  processingFeePercent?: number;
  
  // Processing
  defaultProcessingFee?: number;
  disburseType: 'full' | 'tranched'; // full at once or in tranches
  defaultTranches?: number;
  
  // Eligibility
  eligibilityCriteria: EligibilityCriteria;
  
  // Custom Fields
  customFields: CustomField[];
  
  // Documentation
  requiredDocuments: string[];
  
  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: string;
}

export const createLoanProduct = async (
  orgId: string,
  product: Omit<LoanProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await db.collection('loan_products').add({
      ...product,
      orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'LOAN_PRODUCT_CREATED',
      targetId: docRef.id,
      detail: `Loan product "${product.name}" created for ${product.segment} segment`,
      timestamp: new Date()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating loan product:', error);
    throw error;
  }
};

export const getLoanProduct = async (
  orgId: string,
  productId: string
): Promise<LoanProduct | null> => {
  try {
    const doc = await db.collection('loan_products').doc(productId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    if (data.orgId !== orgId) return null;

    return { id: doc.id, ...data } as LoanProduct;
  } catch (error) {
    console.error('Error getting loan product:', error);
    throw error;
  }
};

export const listLoanProducts = async (
  orgId: string,
  filter?: {
    segment?: string;
    isActive?: boolean;
  }
): Promise<LoanProduct[]> => {
  try {
    let query: any = db.collection('loan_products').where('orgId', '==', orgId);

    if (filter?.isActive !== undefined) {
      query = query.where('isActive', '==', filter.isActive);
    }
    if (filter?.segment) {
      query = query.where('segment', '==', filter.segment);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as LoanProduct[];
  } catch (error) {
    console.error('Error listing loan products:', error);
    throw error;
  }
};

export const updateLoanProduct = async (
  orgId: string,
  productId: string,
  updates: Partial<Omit<LoanProduct, 'id' | 'orgId' | 'createdAt'>>
): Promise<void> => {
  try {
    const product = await getLoanProduct(orgId, productId);
    if (!product) throw new Error('Loan product not found');

    await db.collection('loan_products').doc(productId).update({
      ...updates,
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'LOAN_PRODUCT_UPDATED',
      targetId: productId,
      detail: `Loan product "${product.name}" updated`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating loan product:', error);
    throw error;
  }
};

export const deleteLoanProduct = async (
  orgId: string,
  productId: string
): Promise<void> => {
  try {
    const product = await getLoanProduct(orgId, productId);
    if (!product) throw new Error('Loan product not found');

    // Soft delete by marking inactive
    await db.collection('loan_products').doc(productId).update({
      isActive: false,
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'LOAN_PRODUCT_DELETED',
      targetId: productId,
      detail: `Loan product "${product.name}" disabled`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error deleting loan product:', error);
    throw error;
  }
};

export const getLoanProductFormSchema = async (
  orgId: string,
  productId: string
): Promise<{
  product: LoanProduct;
  formFields: CustomField[];
} | null> => {
  try {
    const product = await getLoanProduct(orgId, productId);
    if (!product) return null;

    return {
      product,
      formFields: product.customFields || [],
    };
  } catch (error) {
    console.error('Error getting form schema:', error);
    throw error;
  }
};
