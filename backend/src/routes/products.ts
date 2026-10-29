import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();

export interface LoanProduct {
  id?: string;
  orgId: string;
  name: string;
  segment: 'Micro' | 'Consumer' | 'MSME';
  minAmount: number;
  maxAmount: number;
  minTenor: number;
  maxTenor: number;
  rateType: 'fixed' | 'variable';
  rate: number;
  customFields?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'file';
    required: boolean;
  }>;
  eligibilityCriteria?: Record<string, any>;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Create a new product
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productData = req.body;
    
    const newProduct: Omit<LoanProduct, 'id'> = {
      ...productData,
      orgId: req.orgId!,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('loan_products').add(newProduct);
    
    // Audit log
    await db.collection('audit_logs').add({
      orgId: req.orgId,
      action: 'PRODUCT_CREATED',
      targetId: docRef.id,
      detail: `Loan product ${newProduct.name} created`,
      timestamp: new Date()
    });

    res.status(201).json({ id: docRef.id, ...newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// List all products
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('loan_products')
      .where('orgId', '==', req.orgId!)
      .get();
      
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(products);
  } catch (error) {
    console.error('Error listing products:', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

// Get specific product
router.get('/:productId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('loan_products').doc(req.params.productId).get();
    if (!doc.exists || doc.data()?.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Update product
router.put('/:productId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('loan_products').doc(req.params.productId).get();
    if (!doc.exists || doc.data()?.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.collection('loan_products').doc(req.params.productId).update({
      ...req.body,
      updatedAt: new Date()
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Get dynamic form schema for product
router.get('/:productId/form-schema', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('loan_products').doc(req.params.productId).get();
    if (!doc.exists || doc.data()?.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = doc.data() as LoanProduct;
    
    // Base schema fields
    const schema: any[] = [
      { name: 'borrowerName', label: 'Borrower Name', type: 'string', required: true },
      { name: 'borrowerPhone', label: 'Phone Number', type: 'string', required: true },
      { name: 'loanAmount', label: 'Loan Amount (₹)', type: 'number', required: true, min: product.minAmount, max: product.maxAmount },
      { name: 'tenor', label: 'Tenor (months)', type: 'number', required: true, min: product.minTenor, max: product.maxTenor }
    ];

    // Conditional segment-specific base fields
    if (product.segment === 'MSME') {
      schema.push({ name: 'gstNumber', label: 'GST Number', type: 'string', required: true });
      schema.push({ name: 'turnover', label: 'Annual Turnover (₹)', type: 'number', required: true });
    } else if (product.segment === 'Micro') {
      schema.push({ name: 'coBorrowerName', label: 'Co-Borrower Name', type: 'string', required: false });
      schema.push({ name: 'groupGuaranteeId', label: 'Group Guarantee ID', type: 'string', required: false });
    }

    // Append custom fields defined by org
    if (product.customFields && product.customFields.length > 0) {
      product.customFields.forEach(field => {
        schema.push({
          name: field.name,
          label: field.name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          type: field.type,
          required: field.required
        });
      });
    }

    res.status(200).json({ productId: product.id, schema });
  } catch (error) {
    console.error('Error generating form schema:', error);
    res.status(500).json({ error: 'Failed to generate form schema' });
  }
});

export default router;
