import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createCommunicationTemplate,
  getCommunicationTemplate,
  listCommunicationTemplates,
  updateCommunicationTemplate,
  deleteCommunicationTemplate,
  sendCommunication,
  sendCommunicationBulk,
  CommunicationTemplate,
  EventType,
} from '../services/communications';

const router = Router();

// ── Communication Templates ─────────────────────────────────────

// Get all communication templates for organization
router.get('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventType = req.query.eventType as EventType | undefined;
    const templates = await listCommunicationTemplates(req.orgId!, eventType);

    res.status(200).json(templates);
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

// Get specific template
router.get('/templates/:templateId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const template = await getCommunicationTemplate(req.orgId!, req.params.templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.status(200).json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// Create new template
router.post('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      eventType,
      channel,
      subject,
      body,
      placeholders,
    } = req.body;

    // Validate required fields
    if (!name || !eventType || !channel || !body) {
      return res.status(400).json({
        error: 'name, eventType, channel, and body are required',
      });
    }

    if (!['SMS', 'Email'].includes(channel)) {
      return res.status(400).json({ error: 'channel must be SMS or Email' });
    }

    if (
      ![
        'application.approved',
        'application.rejected',
        'disbursement.initiated',
        'disbursement.completed',
        'repayment.due',
        'custom',
      ].includes(eventType)
    ) {
      return res.status(400).json({ error: 'Invalid eventType' });
    }

    const templateId = await createCommunicationTemplate(req.orgId!, {
      name,
      eventType: eventType as EventType,
      channel: channel as 'SMS' | 'Email',
      subject,
      body,
      placeholders: placeholders || [],
      isActive: true,
    });

    res.status(201).json({
      id: templateId,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.patch('/templates/:templateId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = req.body;

    // Validate channel if provided
    if (updates.channel && !['SMS', 'Email'].includes(updates.channel)) {
      return res.status(400).json({ error: 'channel must be SMS or Email' });
    }

    // Validate eventType if provided
    if (
      updates.eventType &&
      ![
        'application.approved',
        'application.rejected',
        'disbursement.initiated',
        'disbursement.completed',
        'repayment.due',
        'custom',
      ].includes(updates.eventType)
    ) {
      return res.status(400).json({ error: 'Invalid eventType' });
    }

    await updateCommunicationTemplate(req.orgId!, req.params.templateId, updates);

    res.status(200).json({ success: true, message: 'Template updated' });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/templates/:templateId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteCommunicationTemplate(req.orgId!, req.params.templateId);

    res.status(200).json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ── Send Communications ─────────────────────────────────────────

// Send single communication
router.post('/send', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      templateId,
      recipient,
      placeholders,
    } = req.body;

    if (!templateId || !recipient || !placeholders) {
      return res.status(400).json({
        error: 'templateId, recipient (name, phone/email), and placeholders are required',
      });
    }

    if (!recipient.name) {
      return res.status(400).json({ error: 'recipient.name is required' });
    }

    if (!recipient.phone && !recipient.email) {
      return res.status(400).json({
        error: 'recipient must have either phone or email',
      });
    }

    const result = await sendCommunication(req.orgId!, templateId, recipient, placeholders);

    res.status(200).json({
      success: result.success,
      logId: result.logId,
      message: 'Communication sent',
    });
  } catch (error) {
    console.error('Error sending communication:', error);
    res.status(500).json({ error: 'Failed to send communication' });
  }
});

// Bulk send communications
router.post('/send-bulk', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      templateId,
      recipients,
    } = req.body;

    if (!templateId || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: 'templateId and recipients (non-empty array) are required',
      });
    }

    // Validate recipients
    for (const recipient of recipients) {
      if (!recipient.name) {
        return res.status(400).json({ error: 'Each recipient must have a name' });
      }
      if (!recipient.phone && !recipient.email) {
        return res.status(400).json({
          error: 'Each recipient must have either phone or email',
        });
      }
      if (!recipient.placeholders) {
        return res.status(400).json({
          error: 'Each recipient must have placeholders',
        });
      }
    }

    const logIds = await sendCommunicationBulk(req.orgId!, templateId, recipients);

    res.status(200).json({
      success: true,
      count: logIds.length,
      logIds,
      message: `${logIds.length} communications sent`,
    });
  } catch (error) {
    console.error('Error bulk sending communications:', error);
    res.status(500).json({ error: 'Failed to bulk send communications' });
  }
});

// Get default templates for org (create if not exist)
router.post('/templates/create-defaults', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const defaults: Array<Omit<CommunicationTemplate, 'id' | 'createdAt' | 'orgId'>> = [
      {
        name: 'Application Approved',
        eventType: 'application.approved',
        channel: 'SMS',
        body: 'Hi {borrowerName}, your loan application of ₹{loanAmount} has been approved! Check your email for details.',
        placeholders: ['borrowerName', 'loanAmount'],
        isActive: true,
      },
      {
        name: 'Application Rejected',
        eventType: 'application.rejected',
        channel: 'SMS',
        body: 'Hi {borrowerName}, we regret to inform you that your loan application could not be approved at this time.',
        placeholders: ['borrowerName'],
        isActive: true,
      },
      {
        name: 'Disbursement Initiated',
        eventType: 'disbursement.initiated',
        channel: 'Email',
        subject: 'Your Loan Disbursement Has Been Initiated',
        body: 'Dear {borrowerName},\n\nYour loan of ₹{loanAmount} has been initiated. You should receive the funds within 1-2 business days.\n\nLoan ID: {loanId}\nExpected Date: {expectedDate}',
        placeholders: ['borrowerName', 'loanAmount', 'loanId', 'expectedDate'],
        isActive: true,
      },
      {
        name: 'Disbursement Completed',
        eventType: 'disbursement.completed',
        channel: 'SMS',
        body: 'Hi {borrowerName}, your loan disbursement of ₹{loanAmount} is complete! Check your bank account.',
        placeholders: ['borrowerName', 'loanAmount'],
        isActive: true,
      },
      {
        name: 'EMI Due Reminder',
        eventType: 'repayment.due',
        channel: 'SMS',
        body: 'Hi {borrowerName}, your EMI of ₹{emiAmount} is due on {dueDate}. Please ensure timely payment.',
        placeholders: ['borrowerName', 'emiAmount', 'dueDate'],
        isActive: true,
      },
    ];

    const ids: string[] = [];
    for (const template of defaults) {
      const id = await createCommunicationTemplate(req.orgId!, template);
      ids.push(id);
    }

    res.status(201).json({
      count: ids.length,
      ids,
      message: 'Default templates created',
    });
  } catch (error) {
    console.error('Error creating default templates:', error);
    res.status(500).json({ error: 'Failed to create default templates' });
  }
});

export default router;
