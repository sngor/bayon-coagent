/**
 * Pre-built Zap Templates
 * 
 * 10+ ready-to-use Zap templates for common real estate workflows
 */

import { ZapTemplate } from './types';

export const ZAP_TEMPLATES: ZapTemplate[] = [
    {
        id: 'new-client-to-crm',
        name: 'New Client → CRM Contact',
        description: 'Automatically create a contact in your CRM when a new client is added',
        category: 'crm',
        triggerType: 'client.created',
        actions: [
            {
                app: 'HubSpot',
                action: 'Create Contact',
                description: 'Creates a new contact with client details'
            },
            {
                app: 'Salesforce',
                action: 'Create Lead',
                description: 'Creates a new lead record'
            }
        ],
        setupInstructions: [
            'Connect your CRM account',
            'Map client fields to CRM fields',
            'Test with a sample client',
            'Activate the Zap'
        ]
    },
    {
        id: 'property-listed-to-social',
        name: 'Property Listed → Social Media Post',
        description: 'Automatically post to social media when a property is listed',
        category: 'marketing',
        triggerType: 'property.listed',
        actions: [
            {
                app: 'Facebook Pages',
                action: 'Create Post',
                description: 'Posts property details to your Facebook page'
            },
            {
                app: 'LinkedIn',
                action: 'Share Update',
                description: 'Shares property listing on LinkedIn'
            },
            {
                app: 'Instagram',
                action: 'Create Post',
                description: 'Posts property photo to Instagram'
            }
        ],
        setupInstructions: [
            'Connect your social media accounts',
            'Customize post template',
            'Select which platforms to post to',
            'Activate the Zap'
        ]
    },
    {
        id: 'lead-to-mailchimp',
        name: 'Lead Captured → Email Marketing',
        description: 'Add new leads to your email marketing list automatically',
        category: 'marketing',
        triggerType: 'lead.captured',
        actions: [
            {
                app: 'Mailchimp',
                action: 'Add/Update Subscriber',
                description: 'Adds lead to email list'
            },
            {
                app: 'SendGrid',
                action: 'Add Contact',
                description: 'Adds contact to SendGrid list'
            }
        ],
        setupInstructions: [
            'Connect your email marketing platform',
            'Select target email list',
            'Map lead fields',
            'Activate the Zap'
        ]
    },
    {
        id: 'review-to-slack',
        name: 'Review Received → Slack Notification',
        description: 'Get instant Slack notifications when you receive a new review',
        category: 'communication',
        triggerType: 'review.received',
        actions: [
            {
                app: 'Slack',
                action: 'Send Channel Message',
                description: 'Posts review to team channel'
            },
            {
                app: 'Microsoft Teams',
                action: 'Post Message',
                description: 'Posts to Teams channel'
            }
        ],
        setupInstructions: [
            'Connect Slack or Teams',
            'Select notification channel',
            'Customize message format',
            'Activate the Zap'
        ]
    },
    {
        id: 'deal-closed-to-gift',
        name: 'Deal Closed → Send Thank You Gift',
        description: 'Automatically trigger gift sending when a deal closes',
        category: 'crm',
        triggerType: 'deal.closed',
        actions: [
            {
                app: 'Postal.io',
                action: 'Send Gift',
                description: 'Sends automated gift to client'
            },
            {
                app: 'SendOutCards',
                action: 'Send Card',
                description: 'Sends thank you card'
            }
        ],
        setupInstructions: [
            'Connect your gifting platform',
            'Select default gift package',
            'Set up personalization',
            'Activate the Zap'
        ]
    },
    {
        id: 'inquiry-to-task',
        name: 'Listing Inquiry → Create Follow-up Task',
        description: 'Create a follow-up task when someone inquires about a listing',
        category: 'productivity',
        triggerType: 'lead.captured',
        actions: [
            {
                app: 'Asana',
                action: 'Create Task',
                description: 'Creates follow-up task with inquiry details'
            },
            {
                app: 'Trello',
                action: 'Create Card',
                description: 'Creates card in follow-up board'
            },
            {
                app: 'Todoist',
                action: 'Create Task',
                description: 'Adds to your task list'
            }
        ],
        setupInstructions: [
            'Connect your task management tool',
            'Select project/board for tasks',
            'Set default priority and due date',
            'Activate the Zap'
        ]
    },
    {
        id: 'openhouse-to-calendar',
        name: 'Open House Scheduled → Calendar Event',
        description: 'Automatically add open houses to your calendar',
        category: 'productivity',
        triggerType: 'openhouse.scheduled',
        actions: [
            {
                app: 'Google Calendar',
                action: 'Create Event',
                description: 'Adds open house to calendar'
            },
            {
                app: 'Outlook Calendar',
                action: 'Create Event',
                description: 'Creates calendar event'
            }
        ],
        setupInstructions: [
            'Connect your calendar',
            'Set default event duration',
            'Add automatic reminders',
            'Activate the Zap'
        ]
    },
    {
        id: 'milestone-to-team',
        name: 'Analytics Milestone → Team Notification',
        description: 'Celebrate analytics milestones with your team automatically',
        category: 'analytics',
        triggerType: 'analytics.milestone',
        actions: [
            {
                app: 'Slack',
                action: 'Send Channel Message',
                description: 'Posts milestone achievement'
            },
            {
                app: 'Email',
                action: 'Send Email',
                description: 'Sends celebration email to team'
            }
        ],
        setupInstructions: [
            'Connect communication platform',
            'Define milestone thresholds',
            'Customize celebration message',
            'Activate the Zap'
        ]
    },
    {
        id: 'document-to-storage',
        name: 'Document Uploaded → Cloud Storage',
        description: 'Automatically backup documents to cloud storage',
        category: 'productivity',
        triggerType: 'document.uploaded',
        actions: [
            {
                app: 'Google Drive',
                action: 'Upload File',
                description: 'Saves to Google Drive folder'
            },
            {
                app: 'Dropbox',
                action: 'Upload File',
                description: 'Uploads to Dropbox'
            },
            {
                app: 'OneDrive',
                action: 'Upload File',
                description: 'Saves to OneDrive'
            }
        ],
        setupInstructions: [
            'Connect cloud storage service',
            'Select backup folder',
            'Configure file naming',
            'Activate the Zap'
        ]
    },
    {
        id: 'client-update-to-log',
        name: 'Client Updated → Activity Log',
        description: 'Log all client updates to a spreadsheet for tracking',
        category: 'analytics',
        triggerType: 'client.updated',
        actions: [
            {
                app: 'Google Sheets',
                action: 'Create Spreadsheet Row',
                description: 'Logs update to tracking sheet'
            },
            {
                app: 'Airtable',
                action: 'Create Record',
                description: 'Creates activity record'
            }
        ],
        setupInstructions: [
            'Connect spreadsheet service',
            'Select or create tracking sheet',
            'Map client fields to columns',
            'Activate the Zap'
        ]
    },
    {
        id: 'feedback-to-crm-note',
        name: 'User Feedback → CRM Note',
        description: 'Add user feedback as notes to your CRM automatically',
        category: 'crm',
        triggerType: 'feedback.submitted',
        actions: [
            {
                app: 'HubSpot',
                action: 'Create Note',
                description: 'Adds feedback as contact note'
            },
            {
                app: 'Salesforce',
                action: 'Create Task',
                description: 'Creates follow-up task for feedback'
            }
        ],
        setupInstructions: [
            'Connect your CRM',
            'Set note categorization',
            'Define feedback priority',
            'Activate the Zap'
        ]
    },
    {
        id: 'lead-to-sms',
        name: 'Lead Captured → Send SMS',
        description: 'Send instant SMS notifications when you get a new lead',
        category: 'communication',
        triggerType: 'lead.captured',
        actions: [
            {
                app: 'Twilio',
                action: 'Send SMS',
                description: 'Sends SMS to your phone'
            },
            {
                app: 'SMS by Zapier',
                action: 'Send SMS',
                description: 'Instant SMS notification'
            }
        ],
        setupInstructions: [
            'Connect SMS service',
            'Enter your phone number',
            'Customize SMS message template',
            'Activate the Zap'
        ]
    }
];
