/**
 * Lead Response Service
 * 
 * Provides functionality for managing lead notifications and quick responses.
 * Handles push notifications, lead prioritization, and interaction logging.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

export interface Lead {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    source: string;
    propertyId?: string;
    propertyAddress?: string;
    message?: string;
    qualityScore: number; // 0-100
    urgency: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface LeadNotification {
    id: string;
    leadId: string;
    title: string;
    body: string;
    data: {
        leadId: string;
        leadName: string;
        propertyId?: string;
        qualityScore: number;
        urgency: string;
    };
    priority: 'low' | 'normal' | 'high';
    timestamp: number;
}

export interface QuickResponseTemplate {
    id: string;
    name: string;
    type: 'sms' | 'email';
    subject?: string; // For email only
    body: string;
    variables: string[]; // e.g., ['leadName', 'propertyAddress']
}

export interface LeadInteraction {
    id: string;
    leadId: string;
    userId: string;
    type: 'view' | 'call' | 'sms' | 'email' | 'note';
    content?: string;
    timestamp: number;
    followUpReminder?: {
        date: number;
        note: string;
    };
}

/**
 * Lead Response Service
 */
export class LeadResponseService {
    private static instance: LeadResponseService;

    private constructor() { }

    static getInstance(): LeadResponseService {
        if (!LeadResponseService.instance) {
            LeadResponseService.instance = new LeadResponseService();
        }
        return LeadResponseService.instance;
    }

    // ============================================================================
    // Push Notification Management
    // ============================================================================

    /**
     * Request push notification permission
     */
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Push notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    /**
     * Check if notifications are supported and enabled
     */
    hasNotificationSupport(): boolean {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    /**
     * Send a local push notification for a new lead
     */
    async sendLeadNotification(lead: Lead): Promise<void> {
        if (!this.hasNotificationSupport()) {
            console.warn('Notifications not available');
            return;
        }

        const notification = this.createLeadNotification(lead);

        // Create notification
        const notif = new Notification(notification.title, {
            body: notification.body,
            icon: '/icon-192x192.svg',
            badge: '/icon-192x192.svg',
            tag: `lead-${lead.id}`,
            data: notification.data,
            requireInteraction: notification.priority === 'high',
            vibrate: notification.priority === 'high' ? [200, 100, 200] : [100],
        });

        // Handle notification click
        notif.onclick = () => {
            window.focus();
            // Navigate to lead details
            window.location.href = `/leads/${lead.id}`;
            notif.close();
        };
    }

    /**
     * Create a notification object from a lead
     */
    private createLeadNotification(lead: Lead): LeadNotification {
        const priority = this.calculateNotificationPriority(lead);

        let title = '🔔 New Lead';
        if (lead.urgency === 'critical') {
            title = '🚨 Urgent Lead!';
        } else if (lead.urgency === 'high') {
            title = '⚡ High Priority Lead';
        }

        let body = `${lead.name}`;
        if (lead.propertyAddress) {
            body += ` - ${lead.propertyAddress}`;
        }
        if (lead.message) {
            body += `\n"${lead.message.substring(0, 100)}${lead.message.length > 100 ? '...' : ''}"`;
        }

        return {
            id: `notif-${lead.id}-${Date.now()}`,
            leadId: lead.id,
            title,
            body,
            data: {
                leadId: lead.id,
                leadName: lead.name,
                propertyId: lead.propertyId,
                qualityScore: lead.qualityScore,
                urgency: lead.urgency,
            },
            priority,
            timestamp: Date.now(),
        };
    }

    /**
     * Calculate notification priority based on lead quality and urgency
     */
    private calculateNotificationPriority(lead: Lead): 'low' | 'normal' | 'high' {
        if (lead.urgency === 'critical' || lead.qualityScore >= 80) {
            return 'high';
        }
        if (lead.urgency === 'high' || lead.qualityScore >= 60) {
            return 'normal';
        }
        return 'low';
    }

    // ============================================================================
    // Lead Prioritization
    // ============================================================================

    /**
     * Prioritize multiple leads based on quality score and urgency
     */
    prioritizeLeads(leads: Lead[]): Lead[] {
        return [...leads].sort((a, b) => {
            // First sort by urgency
            const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];

            if (urgencyDiff !== 0) {
                return urgencyDiff;
            }

            // Then by quality score
            const scoreDiff = b.qualityScore - a.qualityScore;
            if (scoreDiff !== 0) {
                return scoreDiff;
            }

            // Finally by timestamp (newer first)
            return b.timestamp - a.timestamp;
        });
    }

    /**
     * Calculate lead quality score based on various factors
     */
    calculateLeadQualityScore(lead: Partial<Lead>): number {
        let score = 50; // Base score

        // Has contact information
        if (lead.email) score += 10;
        if (lead.phone) score += 15;

        // Has property interest
        if (lead.propertyId) score += 15;

        // Has message (shows engagement)
        if (lead.message && lead.message.length > 20) score += 10;

        // Source quality (example scoring)
        const sourceScores: Record<string, number> = {
            'website': 10,
            'referral': 15,
            'social': 5,
            'zillow': 8,
            'realtor.com': 8,
        };
        if (lead.source && sourceScores[lead.source.toLowerCase()]) {
            score += sourceScores[lead.source.toLowerCase()];
        }

        return Math.min(100, Math.max(0, score));
    }

    // ============================================================================
    // Quick Response Templates
    // ============================================================================

    /**
     * Get default quick response templates
     */
    getDefaultTemplates(): QuickResponseTemplate[] {
        return [
            {
                id: 'sms-intro',
                name: 'SMS: Quick Introduction',
                type: 'sms',
                body: 'Hi {{leadName}}! This is {{agentName}} from {{agentCompany}}. I received your inquiry about {{propertyAddress}}. I\'d love to help! When would be a good time to chat?',
                variables: ['leadName', 'agentName', 'agentCompany', 'propertyAddress'],
            },
            {
                id: 'sms-schedule',
                name: 'SMS: Schedule Showing',
                type: 'sms',
                body: 'Hi {{leadName}}! I can schedule a showing for {{propertyAddress}}. Are you available this week? I have openings on {{availableDays}}.',
                variables: ['leadName', 'propertyAddress', 'availableDays'],
            },
            {
                id: 'email-intro',
                name: 'Email: Detailed Introduction',
                type: 'email',
                subject: 'Re: Your inquiry about {{propertyAddress}}',
                body: `Hi {{leadName}},

Thank you for your interest in {{propertyAddress}}! I'm {{agentName}}, and I'd be happy to help you with this property.

I have extensive knowledge of this area and can provide you with:
- Detailed property information
- Market analysis and comparable properties
- Neighborhood insights
- Financing options

When would be a good time for us to connect? I'm available for a call, video chat, or in-person meeting at your convenience.

Looking forward to hearing from you!

Best regards,
{{agentName}}
{{agentPhone}}
{{agentEmail}}`,
                variables: ['leadName', 'propertyAddress', 'agentName', 'agentPhone', 'agentEmail'],
            },
            {
                id: 'email-followup',
                name: 'Email: Follow-up',
                type: 'email',
                subject: 'Following up on {{propertyAddress}}',
                body: `Hi {{leadName}},

I wanted to follow up on your inquiry about {{propertyAddress}}. 

Have you had a chance to think about scheduling a showing? I'm here to answer any questions you might have about the property, the neighborhood, or the buying process.

I'm available this week if you'd like to see the property in person.

Best regards,
{{agentName}}`,
                variables: ['leadName', 'propertyAddress', 'agentName'],
            },
        ];
    }

    /**
     * Fill template with lead data
     */
    fillTemplate(
        template: QuickResponseTemplate,
        data: Record<string, string>
    ): { subject?: string; body: string } {
        let body = template.body;
        let subject = template.subject;

        // Replace all variables
        Object.entries(data).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            body = body.replace(new RegExp(placeholder, 'g'), value);
            if (subject) {
                subject = subject.replace(new RegExp(placeholder, 'g'), value);
            }
        });

        return { subject, body };
    }

    // ============================================================================
    // Interaction Logging
    // ============================================================================

    /**
     * Create a lead interaction record
     */
    createInteraction(
        leadId: string,
        userId: string,
        type: LeadInteraction['type'],
        content?: string,
        followUpDate?: number,
        followUpNote?: string
    ): LeadInteraction {
        const interaction: LeadInteraction = {
            id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            leadId,
            userId,
            type,
            content,
            timestamp: Date.now(),
        };

        if (followUpDate && followUpNote) {
            interaction.followUpReminder = {
                date: followUpDate,
                note: followUpNote,
            };
        }

        return interaction;
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    /**
     * Format phone number for SMS
     */
    formatPhoneForSMS(phone: string): string {
        // Remove all non-numeric characters
        const cleaned = phone.replace(/\D/g, '');

        // Add +1 for US numbers if not present
        if (cleaned.length === 10) {
            return `+1${cleaned}`;
        }

        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
        }

        return phone;
    }

    /**
     * Create SMS link
     */
    createSMSLink(phone: string, message: string): string {
        const formattedPhone = this.formatPhoneForSMS(phone);
        const encodedMessage = encodeURIComponent(message);
        return `sms:${formattedPhone}?body=${encodedMessage}`;
    }

    /**
     * Create email link
     */
    createEmailLink(email: string, subject: string, body: string): string {
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
    }

    /**
     * Create phone call link
     */
    createPhoneLink(phone: string): string {
        const formattedPhone = this.formatPhoneForSMS(phone);
        return `tel:${formattedPhone}`;
    }
}

// Export singleton instance
export const leadResponseService = LeadResponseService.getInstance();
