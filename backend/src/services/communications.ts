import { db } from '../config/firebase';

export type CommunicationChannel = 'SMS' | 'Email';
export type EventType = 'application.approved' | 'application.rejected' | 'disbursement.initiated' | 'disbursement.completed' | 'repayment.due' | 'custom';

export interface CommunicationTemplate {
  id?: string;
  orgId: string;
  name: string;
  eventType: EventType;
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  placeholders: string[]; // e.g., ['{borrowerName}', '{loanAmount}', '{dueDate}']
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CommunicationLog {
  id?: string;
  orgId: string;
  templateId: string;
  eventType: EventType;
  channel: CommunicationChannel;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientName?: string;
  subject?: string;
  body: string;
  status: 'Sent' | 'Failed' | 'Pending';
  errorMessage?: string;
  sentAt?: Date | string;
  createdAt: Date | string;
}

export const createCommunicationTemplate = async (
  orgId: string,
  template: Omit<CommunicationTemplate, 'id' | 'createdAt' | 'orgId'>
): Promise<string> => {
  try {
    const docRef = await db.collection('communication_templates').add({
      ...template,
      orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'COMMUNICATION_TEMPLATE_CREATED',
      targetId: docRef.id,
      detail: `Template '${template.name}' created for ${template.channel}`,
      timestamp: new Date()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating communication template:', error);
    throw error;
  }
};

export const getCommunicationTemplate = async (
  orgId: string,
  templateId: string
): Promise<CommunicationTemplate | null> => {
  try {
    const doc = await db.collection('communication_templates').doc(templateId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    if (data.orgId !== orgId) return null;

    return { id: doc.id, ...data } as CommunicationTemplate;
  } catch (error) {
    console.error('Error getting communication template:', error);
    throw error;
  }
};

export const listCommunicationTemplates = async (
  orgId: string,
  eventType?: EventType
): Promise<CommunicationTemplate[]> => {
  try {
    let query: any = db.collection('communication_templates')
      .where('orgId', '==', orgId)
      .where('isActive', '==', true);

    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as CommunicationTemplate[];
  } catch (error) {
    console.error('Error listing communication templates:', error);
    throw error;
  }
};

export const updateCommunicationTemplate = async (
  orgId: string,
  templateId: string,
  updates: Partial<Omit<CommunicationTemplate, 'id' | 'orgId' | 'createdAt'>>
): Promise<void> => {
  try {
    const template = await getCommunicationTemplate(orgId, templateId);
    if (!template) throw new Error('Template not found');

    await db.collection('communication_templates').doc(templateId).update({
      ...updates,
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'COMMUNICATION_TEMPLATE_UPDATED',
      targetId: templateId,
      detail: `Template '${template.name}' updated`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating communication template:', error);
    throw error;
  }
};

export const deleteCommunicationTemplate = async (
  orgId: string,
  templateId: string
): Promise<void> => {
  try {
    const template = await getCommunicationTemplate(orgId, templateId);
    if (!template) throw new Error('Template not found');

    await db.collection('communication_templates').doc(templateId).delete();

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'COMMUNICATION_TEMPLATE_DELETED',
      targetId: templateId,
      detail: `Template '${template.name}' deleted`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error deleting communication template:', error);
    throw error;
  }
};

// Replace placeholders in template body with actual values
export const renderTemplate = (
  body: string,
  placeholders: Record<string, any>
): string => {
  let rendered = body;
  Object.entries(placeholders).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    rendered = rendered.replace(regex, String(value || ''));
  });
  return rendered;
};

// Log communication sent/failed
export const logCommunication = async (
  orgId: string,
  log: Omit<CommunicationLog, 'id' | 'createdAt' | 'orgId'>
): Promise<string> => {
  try {
    const docRef = await db.collection('communication_logs').add({
      ...log,
      orgId,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error logging communication:', error);
    throw error;
  }
};

// Stub for sending SMS via Twilio
export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // TODO: Integrate with Twilio SMS API
    // For MVP, just log and return success
    console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);
    return {
      success: true,
      messageId: `sms_${Date.now()}`,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Stub for sending Email via SendGrid
export const sendEmail = async (
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // TODO: Integrate with SendGrid Email API
    // For MVP, just log and return success
    console.log(`[Email] To: ${to}, Subject: ${subject}`);
    return {
      success: true,
      messageId: `email_${Date.now()}`,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Main function to send communication using template
export const sendCommunication = async (
  orgId: string,
  templateId: string,
  recipient: {
    name: string;
    phone?: string;
    email?: string;
  },
  placeholders: Record<string, any>
): Promise<{ success: boolean; logId: string }> => {
  try {
    const template = await getCommunicationTemplate(orgId, templateId);
    if (!template) throw new Error('Template not found');

    const renderedBody = renderTemplate(template.body, placeholders);
    let result: { success: boolean; messageId?: string; error?: string };

    if (template.channel === 'SMS' && recipient.phone) {
      result = await sendSMS(recipient.phone, renderedBody);
    } else if (template.channel === 'Email' && recipient.email) {
      result = await sendEmail(
        recipient.email,
        template.subject || 'Notification',
        renderedBody
      );
    } else {
      throw new Error('Invalid recipient info for channel');
    }

    // Log the communication
    const logId = await logCommunication(orgId, {
      templateId,
      eventType: template.eventType,
      channel: template.channel,
      recipientPhone: recipient.phone,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      subject: template.subject,
      body: renderedBody,
      status: result.success ? 'Sent' : 'Failed',
      errorMessage: result.error,
      sentAt: new Date(),
    });

    return {
      success: result.success,
      logId,
    };
  } catch (error) {
    console.error('Error sending communication:', error);
    throw error;
  }
};

// Bulk send communications to multiple recipients
export const sendCommunicationBulk = async (
  orgId: string,
  templateId: string,
  recipients: Array<{
    name: string;
    phone?: string;
    email?: string;
    placeholders: Record<string, any>;
  }>
): Promise<string[]> => {
  try {
    const logIds: string[] = [];

    for (const recipient of recipients) {
      const result = await sendCommunication(
        orgId,
        templateId,
        {
          name: recipient.name,
          phone: recipient.phone,
          email: recipient.email,
        },
        recipient.placeholders
      );
      logIds.push(result.logId);
    }

    return logIds;
  } catch (error) {
    console.error('Error bulk sending communications:', error);
    throw error;
  }
};
