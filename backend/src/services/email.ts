import nodemailer from 'nodemailer';
import { getUsageROI, calculateSavings } from './roi';
import {
  db,
  getDocs,
  query,
  where,
  collection,
  Timestamp,
  updateDoc,
  doc,
} from '../config/firebase';

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@gavel.ai',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

export interface EmailSubscription {
  orgId: string;
  frequency: 'weekly' | 'monthly';
  recipients: string[]; // Email addresses
  enabled: boolean;
}

/**
 * Send weekly usage report email to organization
 */
export async function sendWeeklyUsageEmail(
  orgId: string,
  organization: {
    name: string;
    email: string;
  },
  costPerDecision: number = 7.50
): Promise<boolean> {
  try {
    const roi = await getUsageROI(orgId, costPerDecision);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Gavel Weekly Usage Report</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Week of ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="padding: 30px; background: #f9fafb;">
          <!-- This Week's Highlights -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0;">This Week's Highlights</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <!-- Decisions Card -->
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                <p style="color: #6b7280; margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Decisions Made</p>
                <h3 style="color: #667eea; margin: 10px 0 0 0; font-size: 32px;">${roi.thisMonth.decisions}</h3>
                <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
                  ${roi.thisMonth.trend.percentageChange > 0 ? '📈' : '📉'} 
                  ${Math.abs(roi.thisMonth.trend.percentageChange)}% vs last week
                </p>
              </div>

              <!-- Savings Card -->
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="color: #6b7280; margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Cost Saved</p>
                <h3 style="color: #10b981; margin: 10px 0 0 0; font-size: 32px;">₹${roi.thisMonth.costSaved.toLocaleString('en-IN')}</h3>
                <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">${roi.thisMonth.hoursSaved} analyst-hours saved</p>
              </div>
            </div>
          </div>

          <!-- Annual Projection -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 2px dashed #fbbf24;">
            <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">📊 Annual Projection at Current Pace</h3>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              If you maintain this usage rate:
            </p>
            <p style="color: #fbbf24; margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">
              ₹${roi.projectedAnnualSavings.toLocaleString('en-IN')} saved annually
            </p>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">
              That's ${roi.annualAnalystHours} analyst-hours (${Math.round(roi.annualAnalystHours / 40)} work-months of labor)
            </p>
          </div>

          <!-- All-Time Stats -->
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">📈 All-Time Stats with Gavel</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
              <div style="text-align: center;">
                <p style="color: #6b7280; margin: 0; font-size: 12px;">Total Decisions</p>
                <p style="color: #0284c7; margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${roi.allTime.decisions}</p>
              </div>
              <div style="text-align: center;">
                <p style="color: #6b7280; margin: 0; font-size: 12px;">Total Saved</p>
                <p style="color: #0284c7; margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">₹${roi.allTime.costSaved.toLocaleString('en-IN')}</p>
              </div>
              <div style="text-align: center;">
                <p style="color: #6b7280; margin: 0; font-size: 12px;">Analyst-Hours</p>
                <p style="color: #0284c7; margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${roi.allTime.hoursSaved}</p>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <p style="color: white; margin: 0 0 15px 0; font-weight: 600;">Ready to see more insights?</p>
            <a href="https://app.gavel.ai/usage-billing" style="display: inline-block; background: white; color: #667eea; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View Full Dashboard →
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              Gavel AI • Intelligent Underwriting Platform<br/>
              Questions? Contact us at support@gavel.ai
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await transporter.sendMail({
      from: 'Gavel Weekly Report <noreply@gavel.ai>',
      to: organization.email,
      subject: `📊 Gavel Weekly Report: ₹${roi.thisMonth.costSaved.toLocaleString('en-IN')} Saved This Week`,
      html,
    });

    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending weekly email:', error);
    return false;
  }
}

/**
 * Send alert email when usage drops below threshold
 */
export async function sendLowUsageAlert(
  orgId: string,
  organization: { name: string; email: string },
  daysSinceLastUsage: number
): Promise<boolean> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #fbbf24; margin-bottom: 20px;">
          <p style="color: #92400e; margin: 0; font-weight: 600;">
            ⚠️ We haven't seen activity from you in ${daysSinceLastUsage} days
          </p>
        </div>

        <p style="color: #374151; margin: 0 0 15px 0;">Hi ${organization.name},</p>

        <p style="color: #374151; margin: 0 0 15px 0;">
          We noticed that your Gavel integration hasn't been used in a while. We'd love to help you get the most out of the platform.
        </p>

        <p style="color: #374151; margin: 0 0 15px 0;">
          Common ways to use Gavel:
        </p>

        <ul style="color: #374151; margin: 0 0 15px 0; padding-left: 20px;">
          <li>Batch process your entire loan book to identify weak applications</li>
          <li>Use our Collections module to track defaults and overdue payments</li>
          <li>Generate compliance reports for your next RBI audit</li>
        </ul>

        <a href="https://app.gavel.ai/console" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Get Started →
        </a>

        <p style="color: #9ca3af; margin: 30px 0 0 0; font-size: 12px;">
          Still need help? Reply to this email or contact support@gavel.ai
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: 'Gavel Support <support@gavel.ai>',
      to: organization.email,
      subject: `We miss you! 🎯 Get back to ${organization.name}`,
      html,
    });

    return true;
  } catch (error) {
    console.error('Error sending low usage alert:', error);
    return false;
  }
}

/**
 * Store email subscription preferences
 */
export async function updateEmailSubscription(
  orgId: string,
  subscription: Partial<EmailSubscription>
): Promise<void> {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, {
      emailSubscription: subscription,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating email subscription:', error);
    throw error;
  }
}
