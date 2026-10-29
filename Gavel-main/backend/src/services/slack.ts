import axios from 'axios';
import {
  db,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from '../config/firebase';

export interface SlackConfig {
  botToken: string;
  webhookUrl: string;
  channelId: string;
  enabled: boolean;
}

/**
 * Send a message to Slack
 */
export async function sendSlackMessage(
  webhookUrl: string,
  message: {
    text?: string;
    blocks?: any[];
    attachments?: any[];
  }
): Promise<boolean> {
  try {
    const response = await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.status === 200;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return false;
  }
}

/**
 * Send low usage alert to Slack
 */
export async function notifySlackLowUsage(
  webhookUrl: string,
  orgName: string,
  daysSinceUsage: number
): Promise<boolean> {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '⚠️ Low Usage Alert',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${orgName}* hasn't used Gavel in *${daysSinceUsage} days*.`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `This could indicate:
• Setup is incomplete
• They're having integration issues
• They forgot we exist (retention risk!)`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Dashboard',
          },
          url: 'https://app.gavel.ai/dashboard',
          action_id: 'view_dashboard',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Send Alert Email',
          },
          action_id: 'send_alert_email',
        },
      ],
    },
  ];

  return sendSlackMessage(webhookUrl, { blocks });
}

/**
 * Send new deal notification to Slack
 */
export async function notifySlackNewDeal(
  webhookUrl: string,
  deal: {
    prospectName: string;
    prospectCompany: string;
    valueEstimate: number;
  }
): Promise<boolean> {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🎯 New Sales Deal',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Company*\n${deal.prospectCompany}`,
        },
        {
          type: 'mrkdwn',
          text: `*Contact*\n${deal.prospectName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Value*\n₹${deal.valueEstimate.toLocaleString('en-IN')}/year`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Pipeline',
          },
          url: 'https://app.gavel.ai/sales-pipeline',
          action_id: 'view_pipeline',
        },
      ],
    },
  ];

  return sendSlackMessage(webhookUrl, { blocks });
}

/**
 * Send collections alert to Slack (borrower at risk)
 */
export async function notifySlackCollectionsAlert(
  webhookUrl: string,
  alert: {
    borrowerName: string;
    loanId: string;
    riskLevel: 'high' | 'medium';
    daysOverdue: number;
    amountOutstanding: number;
  }
): Promise<boolean> {
  const riskColor = alert.riskLevel === 'high' ? '#dc2626' : '#f59e0b';
  const riskEmoji = alert.riskLevel === 'high' ? '🔴' : '🟡';

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${riskEmoji} *Collections Alert: ${alert.riskLevel.toUpperCase()} RISK*`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Borrower*\n${alert.borrowerName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Loan ID*\n${alert.loanId}`,
        },
        {
          type: 'mrkdwn',
          text: `*Days Overdue*\n${alert.daysOverdue}`,
        },
        {
          type: 'mrkdwn',
          text: `*Outstanding*\n₹${alert.amountOutstanding.toLocaleString('en-IN')}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Collections Dashboard',
          },
          url: 'https://app.gavel.ai/collections',
          action_id: 'view_collections',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Send SMS Alert',
          },
          action_id: 'send_sms_alert',
        },
      ],
    },
  ];

  return sendSlackMessage(webhookUrl, { blocks });
}

/**
 * Get Slack configuration for an organization
 */
export async function getSlackConfig(orgId: string): Promise<SlackConfig | null> {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return null;
    }

    const slackConfig = orgSnap.data().slackConfig;
    return slackConfig || null;
  } catch (error) {
    console.error('Error getting Slack config:', error);
    return null;
  }
}

/**
 * Update Slack configuration for an organization
 */
export async function updateSlackConfig(
  orgId: string,
  config: Partial<SlackConfig>
): Promise<void> {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, {
      slackConfig: config,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating Slack config:', error);
    throw error;
  }
}

/**
 * Daily digest: Send summary of key metrics to Slack
 */
export async function sendDailyDigest(
  webhookUrl: string,
  metrics: {
    decisionsMadeToday: number;
    newApplications: number;
    approvalsToday: number;
    collectionsAlerts: number;
    lowUsageWarnings: number;
  }
): Promise<boolean> {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 Daily Digest',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Good morning! Here's what happened on Gavel today:`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Decisions*\n${metrics.decisionsMadeToday}`,
        },
        {
          type: 'mrkdwn',
          text: `*Applications*\n${metrics.newApplications}`,
        },
        {
          type: 'mrkdwn',
          text: `*Approvals*\n${metrics.approvalsToday}`,
        },
        {
          type: 'mrkdwn',
          text: `*Collections Alerts*\n${metrics.collectionsAlerts}`,
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Dashboard',
          },
          url: 'https://app.gavel.ai/dashboard',
          action_id: 'view_dashboard',
        },
      ],
    },
  ];

  return sendSlackMessage(webhookUrl, { blocks });
}

/**
 * Send demo request alert to Slack
 */
export async function notifySlackDemoRequest(
  webhookUrl: string,
  request: {
    fullName: string;
    workEmail: string;
    company: string;
    phone?: string;
    companySize?: string;
    productInterest: string;
    preferredDay?: string;
    preferredTime?: string;
    message?: string;
  }
): Promise<boolean> {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚀 New Demo Request Submitted!',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Name*\n${request.fullName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Work Email*\n${request.workEmail}`,
        },
        {
          type: 'mrkdwn',
          text: `*Company*\n${request.company} ${request.companySize ? `(${request.companySize} employees)` : ''}`,
        },
        {
          type: 'mrkdwn',
          text: `*Product Interest*\n${request.productInterest}`,
        },
      ],
    },
    ...(request.preferredDay || request.preferredTime || request.phone ? [{
      type: 'section',
      fields: [
        ...(request.phone ? [{
          type: 'mrkdwn',
          text: `*Phone*\n${request.phone}`,
        }] : []),
        ...(request.preferredDay || request.preferredTime ? [{
          type: 'mrkdwn',
          text: `*Preferred Time*\n${request.preferredDay || 'Flexible'} - ${request.preferredTime || 'Anytime'}`,
        }] : []),
      ],
    }] : []),
    ...(request.message ? [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Message / Use Case*\n_${request.message}_`,
      },
    }] : []),
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Sales Pipeline',
          },
          url: 'https://app.gavel.ai/sales-pipeline',
          action_id: 'view_sales_pipeline',
        },
      ],
    },
  ];

  return sendSlackMessage(webhookUrl, { blocks });
}

