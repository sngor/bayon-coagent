/**
 * Email Service
 * 
 * Handles email notifications for subscription events.
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getAWSConfig } from '@/aws/config';

const sesClient = new SESClient(getAWSConfig());

interface EmailTemplate {
    subject: string;
    htmlBody: string;
    textBody: string;
}

interface TrialExpiryEmailData {
    userName: string;
    daysRemaining: number;
    trialEndDate: string;
    upgradeUrl: string;
}

interface TrialExpiredEmailData {
    userName: string;
    upgradeUrl: string;
    freeTierLimits: {
        aiContent: number;
        images: number;
        research: number;
        marketing: number;
    };
}

export class EmailService {
    private readonly fromEmail = process.env.FROM_EMAIL || 'noreply@bayoncoagent.app';
    private readonly baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bayoncoagent.app';

    /**
     * Send trial expiry warning email
     */
    async sendTrialExpiryWarning(
        userEmail: string,
        data: TrialExpiryEmailData
    ): Promise<void> {
        const template = this.getTrialExpiryTemplate(data);
        
        await this.sendEmail({
            to: userEmail,
            subject: template.subject,
            htmlBody: template.htmlBody,
            textBody: template.textBody,
        });
    }

    /**
     * Send trial expired notification
     */
    async sendTrialExpiredNotification(
        userEmail: string,
        data: TrialExpiredEmailData
    ): Promise<void> {
        const template = this.getTrialExpiredTemplate(data);
        
        await this.sendEmail({
            to: userEmail,
            subject: template.subject,
            htmlBody: template.htmlBody,
            textBody: template.textBody,
        });
    }

    /**
     * Send subscription confirmation email
     */
    async sendSubscriptionConfirmation(
        userEmail: string,
        userName: string,
        planName: string,
        amount: string
    ): Promise<void> {
        const template = this.getSubscriptionConfirmationTemplate(userName, planName, amount);
        
        await this.sendEmail({
            to: userEmail,
            subject: template.subject,
            htmlBody: template.htmlBody,
            textBody: template.textBody,
        });
    }

    /**
     * Send subscription cancellation confirmation
     */
    async sendCancellationConfirmation(
        userEmail: string,
        userName: string,
        endDate: string
    ): Promise<void> {
        const template = this.getCancellationConfirmationTemplate(userName, endDate);
        
        await this.sendEmail({
            to: userEmail,
            subject: template.subject,
            htmlBody: template.htmlBody,
            textBody: template.textBody,
        });
    }

    /**
     * Send email using AWS SES
     */
    private async sendEmail({
        to,
        subject,
        htmlBody,
        textBody,
    }: {
        to: string;
        subject: string;
        htmlBody: string;
        textBody: string;
    }): Promise<void> {
        try {
            const command = new SendEmailCommand({
                Source: this.fromEmail,
                Destination: {
                    ToAddresses: [to],
                },
                Message: {
                    Subject: {
                        Data: subject,
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Html: {
                            Data: htmlBody,
                            Charset: 'UTF-8',
                        },
                        Text: {
                            Data: textBody,
                            Charset: 'UTF-8',
                        },
                    },
                },
            });

            await sesClient.send(command);
            console.log(`Email sent successfully to ${to}`);
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    }

    /**
     * Get trial expiry warning email template
     */
    private getTrialExpiryTemplate(data: TrialExpiryEmailData): EmailTemplate {
        const { userName, daysRemaining, trialEndDate, upgradeUrl } = data;
        
        const subject = `Your Bayon CoAgent trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
        
        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
                    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                    .highlight { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
                    .features { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
                    .features ul { margin: 0; padding-left: 20px; }
                    .features li { margin: 8px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⏰ Your Trial is Ending Soon</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        
                        <div class="highlight">
                            <strong>Your 7-day free trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (${trialEndDate})</strong>
                        </div>
                        
                        <p>You've been enjoying professional-level features during your trial. Don't lose access to:</p>
                        
                        <div class="features">
                            <ul>
                                <li><strong>Unlimited AI Content Generation</strong> - Blog posts, social media, market updates</li>
                                <li><strong>Unlimited Image Enhancements</strong> - Virtual staging, day-to-dusk, renovations</li>
                                <li><strong>Unlimited Research Reports</strong> - Market insights and competitor analysis</li>
                                <li><strong>Unlimited Marketing Plans</strong> - AI-powered strategy generation</li>
                                <li><strong>Advanced Brand Monitoring</strong> - Track your online presence</li>
                                <li><strong>Competitor Tracking</strong> - Stay ahead of the competition</li>
                                <li><strong>Priority Support</strong> - Get help when you need it</li>
                            </ul>
                        </div>
                        
                        <p>After your trial ends, you'll be moved to our free tier with limited usage. Upgrade now to keep all these powerful features!</p>
                        
                        <div style="text-align: center;">
                            <a href="${upgradeUrl}" class="btn">Continue with Professional Plan</a>
                        </div>
                        
                        <p>Questions? Reply to this email or visit our <a href="${this.baseUrl}/support">support center</a>.</p>
                        
                        <p>Best regards,<br>The Bayon CoAgent Team</p>
                    </div>
                    <div class="footer">
                        <p>Bayon CoAgent - AI-Powered Success Platform for Real Estate Agents</p>
                        <p><a href="${this.baseUrl}/unsubscribe">Unsubscribe</a> | <a href="${this.baseUrl}/privacy">Privacy Policy</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const textBody = `
Hi ${userName},

Your 7-day free trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (${trialEndDate}).

You've been enjoying professional-level features during your trial. Don't lose access to:

• Unlimited AI Content Generation - Blog posts, social media, market updates
• Unlimited Image Enhancements - Virtual staging, day-to-dusk, renovations  
• Unlimited Research Reports - Market insights and competitor analysis
• Unlimited Marketing Plans - AI-powered strategy generation
• Advanced Brand Monitoring - Track your online presence
• Competitor Tracking - Stay ahead of the competition
• Priority Support - Get help when you need it

After your trial ends, you'll be moved to our free tier with limited usage. Upgrade now to keep all these powerful features!

Continue with Professional Plan: ${upgradeUrl}

Questions? Reply to this email or visit our support center: ${this.baseUrl}/support

Best regards,
The Bayon CoAgent Team

---
Bayon CoAgent - AI-Powered Success Platform for Real Estate Agents
Unsubscribe: ${this.baseUrl}/unsubscribe
        `;
        
        return { subject, htmlBody, textBody };
    }

    /**
     * Get trial expired email template
     */
    private getTrialExpiredTemplate(data: TrialExpiredEmailData): EmailTemplate {
        const { userName, upgradeUrl, freeTierLimits } = data;
        
        const subject = 'Your Bayon CoAgent trial has ended - Welcome to the free tier!';
        
        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
                    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                    .limits { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
                    .limits ul { margin: 0; padding-left: 20px; }
                    .limits li { margin: 8px 0; }
                    .upgrade-box { background: #e7f3ff; padding: 20px; border-radius: 6px; border-left: 4px solid #0066cc; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to Bayon CoAgent!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        
                        <p>Your 7-day trial has ended, but your journey with Bayon CoAgent is just beginning! You now have access to our free tier with these monthly limits:</p>
                        
                        <div class="limits">
                            <ul>
                                <li><strong>AI Content Generation:</strong> ${freeTierLimits.aiContent} pieces per month</li>
                                <li><strong>Image Enhancements:</strong> ${freeTierLimits.images} images per month</li>
                                <li><strong>Research Reports:</strong> ${freeTierLimits.research} reports per month</li>
                                <li><strong>Marketing Plans:</strong> ${freeTierLimits.marketing} plan per month</li>
                            </ul>
                        </div>
                        
                        <p>Ready to unlock unlimited access and advanced features?</p>
                        
                        <div class="upgrade-box">
                            <h3>🚀 Upgrade to Professional</h3>
                            <p>Get unlimited usage of all features plus:</p>
                            <ul>
                                <li>Advanced brand monitoring</li>
                                <li>Competitor tracking</li>
                                <li>Priority support</li>
                                <li>And much more!</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${upgradeUrl}" class="btn">Upgrade to Professional</a>
                        </div>
                        
                        <p>Thank you for choosing Bayon CoAgent. We're here to help you succeed!</p>
                        
                        <p>Best regards,<br>The Bayon CoAgent Team</p>
                    </div>
                    <div class="footer">
                        <p>Bayon CoAgent - AI-Powered Success Platform for Real Estate Agents</p>
                        <p><a href="${this.baseUrl}/unsubscribe">Unsubscribe</a> | <a href="${this.baseUrl}/privacy">Privacy Policy</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const textBody = `
Hi ${userName},

Your 7-day trial has ended, but your journey with Bayon CoAgent is just beginning! You now have access to our free tier with these monthly limits:

• AI Content Generation: ${freeTierLimits.aiContent} pieces per month
• Image Enhancements: ${freeTierLimits.images} images per month  
• Research Reports: ${freeTierLimits.research} reports per month
• Marketing Plans: ${freeTierLimits.marketing} plan per month

Ready to unlock unlimited access and advanced features?

UPGRADE TO PROFESSIONAL
Get unlimited usage of all features plus:
• Advanced brand monitoring
• Competitor tracking  
• Priority support
• And much more!

Upgrade to Professional: ${upgradeUrl}

Thank you for choosing Bayon CoAgent. We're here to help you succeed!

Best regards,
The Bayon CoAgent Team

---
Bayon CoAgent - AI-Powered Success Platform for Real Estate Agents
Unsubscribe: ${this.baseUrl}/unsubscribe
        `;
        
        return { subject, htmlBody, textBody };
    }

    /**
     * Get subscription confirmation email template
     */
    private getSubscriptionConfirmationTemplate(userName: string, planName: string, amount: string): EmailTemplate {
        const subject = `Welcome to Bayon CoAgent ${planName}! 🎉`;
        
        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
                    .btn { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                    .success-box { background: #d4edda; padding: 20px; border-radius: 6px; border-left: 4px solid #28a745; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Subscription Confirmed!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        
                        <div class="success-box">
                            <h3>Welcome to ${planName}!</h3>
                            <p><strong>Amount:</strong> ${amount}/month</p>
                            <p>Your subscription is now active and you have full access to all premium features.</p>
                        </div>
                        
                        <p>You now have unlimited access to:</p>
                        <ul>
                            <li>AI Content Generation</li>
                            <li>Image Enhancements</li>
                            <li>Research Reports</li>
                            <li>Marketing Plans</li>
                            <li>Advanced Brand Monitoring</li>
                            <li>Competitor Tracking</li>
                            <li>Priority Support</li>
                        </ul>
                        
                        <div style="text-align: center;">
                            <a href="${this.baseUrl}/dashboard" class="btn">Go to Dashboard</a>
                        </div>
                        
                        <p>Need help getting started? Visit our <a href="${this.baseUrl}/support">support center</a> or reply to this email.</p>
                        
                        <p>Best regards,<br>The Bayon CoAgent Team</p>
                    </div>
                    <div class="footer">
                        <p>Bayon CoAgent - AI-Powered Success Platform for Real Estate Agents</p>
                        <p><a href="${this.baseUrl}/settings">Manage Subscription</a> | <a href="${this.baseUrl}/privacy">Privacy Policy</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const textBody = `
Hi ${userName},

Welcome to ${planName}!

Amount: ${amount}/month
Your subscription is now active and you have full access to all premium features.

You now have unlimited access to:
• AI Content Generation
• Image Enhancements
• Research Reports  
• Marketing Plans
• Advanced Brand Monitoring
• Competitor Tracking
• Priority Support

Go to Dashboard: ${this.baseUrl}/dashboard

Need help getting started? Visit our support center: ${this.baseUrl}/support

Best regards,
The Bayon CoAgent Team

---
Bayon CoAgent - AI-Powered Success Platform for Real Estate Agents
Manage Subscription: ${this.baseUrl}/settings
        `;
        
        return { subject, htmlBody, textBody };
    }

    /**
     * Get cancellation confirmation email template
     */
    private getCancellationConfirmationTemplate(userName: string, endDate: string): EmailTemplate {
        const subject = 'Your Bayon CoAgent subscription has been cancelled';
        
        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #6c757d; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
                    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                    .info-box { background: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Subscription Cancelled</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        
                        <p>We've processed your cancellation request. Here's what happens next:</p>
                        
                        <div class="info-box">
                            <h3>📅 Your access continues until ${endDate}</h3>
                            <p>You'll keep all premium features until your current billing period ends. After that, you'll be moved to our free tier.</p>
                        </div>
                        
                        <p><strong>What you'll keep on the free tier:</strong></p>
                        <ul>
                            <li>10 AI content generations per month</li>
                            <li>5 image enhancements per month</li>
                            <li>3 research reports per month</li>
                            <li>1 marketing plan per month</li>
                        </ul>
                        
                        <p>Changed your mind? You can reactivate your subscription anytime before ${endDate}.</p>
                        
                        <div style="text-align: center;">
                            <a href="${this.baseUrl}/settings" class="btn">Manage Subscription</a>
                        </div>
                        
                        <p>We're sorry to see you go! If you have feedback on how we can improve, please reply to this email.</p>
                        
                        <p>Best regards,<br>The Bayon CoAgent Team</p>
                    </div>
                    <div class="footer">
                        <p>Bayon CoAgent - AI-Powered Success Platform for Real Estate Agents</p>
                        <p><a href="${this.baseUrl}/settings">Reactivate Subscription</a> | <a href="${this.baseUrl}/privacy">Privacy Policy</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const textBody = `
Hi ${userName},

We've processed your cancellation request. Here's what happens next:

YOUR ACCESS CONTINUES UNTIL ${endDate}
You'll keep all premium features until your current billing period ends. After that, you'll be moved to our free tier.

What you'll keep on the free tier:
• 10 AI content generations per month
• 5 image enhancements per month
• 3 research reports per month  
• 1 marketing plan per month

Changed your mind? You can reactivate your subscription anytime before ${endDate}.

Manage Subscription: ${this.baseUrl}/settings

We're sorry to see you go! If you have feedback on how we can improve, please reply to this email.

Best regards,
The Bayon CoAgent Team

---
Bayon CoAgent - AI-Powered Success Platform for Real Estate Agents
Reactivate Subscription: ${this.baseUrl}/settings
        `;
        
        return { subject, htmlBody, textBody };
    }
}

export const emailService = new EmailService();