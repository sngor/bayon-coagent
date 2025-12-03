'use client';

/**
 * Lead Details View Component
 * 
 * Mobile-optimized view for lead details with quick action buttons.
 * Displays lead information and provides quick response options.
 * 
 * Requirements: 10.2, 10.3
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Phone,
    Mail,
    MessageSquare,
    MapPin,
    Clock,
    Star,
    AlertCircle,
    CheckCircle,
    Calendar,
} from 'lucide-react';
import { Lead, leadResponseService } from '@/lib/mobile/lead-response';
import { cn } from '@/lib/utils';

interface LeadDetailsViewProps {
    lead: Lead;
    agentData?: {
        name: string;
        company: string;
        phone: string;
        email: string;
    };
    onInteraction?: (type: 'call' | 'sms' | 'email', content?: string) => void;
    onClose?: () => void;
}

export function LeadDetailsView({
    lead,
    agentData,
    onInteraction,
    onClose,
}: LeadDetailsViewProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);

    const templates = leadResponseService.getDefaultTemplates();

    // Get urgency color
    const getUrgencyColor = (urgency: Lead['urgency']) => {
        switch (urgency) {
            case 'critical':
                return 'bg-red-500 text-white';
            case 'high':
                return 'bg-orange-500 text-white';
            case 'medium':
                return 'bg-yellow-500 text-black';
            case 'low':
                return 'bg-gray-500 text-white';
        }
    };

    // Get quality score color
    const getQualityColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-gray-600';
    };

    // Handle quick call
    const handleCall = () => {
        if (!lead.phone) return;
        const phoneLink = leadResponseService.createPhoneLink(lead.phone);
        window.location.href = phoneLink;
        onInteraction?.('call');
    };

    // Handle quick SMS
    const handleSMS = (templateId?: string) => {
        if (!lead.phone) return;

        let message = '';

        if (templateId) {
            const template = templates.find(t => t.id === templateId && t.type === 'sms');
            if (template && agentData) {
                const filled = leadResponseService.fillTemplate(template, {
                    leadName: lead.name,
                    agentName: agentData.name,
                    agentCompany: agentData.company,
                    propertyAddress: lead.propertyAddress || 'the property',
                    availableDays: 'Tuesday and Thursday',
                });
                message = filled.body;
            }
        }

        const smsLink = leadResponseService.createSMSLink(lead.phone, message);
        window.location.href = smsLink;
        onInteraction?.('sms', message);
        setShowTemplates(false);
    };

    // Handle quick email
    const handleEmail = (templateId?: string) => {
        if (!lead.email) return;

        let subject = `Re: Your inquiry`;
        let body = '';

        if (templateId) {
            const template = templates.find(t => t.id === templateId && t.type === 'email');
            if (template && agentData) {
                const filled = leadResponseService.fillTemplate(template, {
                    leadName: lead.name,
                    agentName: agentData.name,
                    agentCompany: agentData.company,
                    agentPhone: agentData.phone,
                    agentEmail: agentData.email,
                    propertyAddress: lead.propertyAddress || 'the property',
                });
                subject = filled.subject || subject;
                body = filled.body;
            }
        }

        const emailLink = leadResponseService.createEmailLink(lead.email, subject, body);
        window.location.href = emailLink;
        onInteraction?.('email', body);
        setShowTemplates(false);
    };

    return (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Lead Details</h1>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Close
                    </Button>
                )}
            </div>

            <div className="p-4 space-y-4 pb-24">
                {/* Lead Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">{lead.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge className={getUrgencyColor(lead.urgency)}>
                                        {lead.urgency.toUpperCase()}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                        <Star className={cn('h-4 w-4', getQualityColor(lead.qualityScore))} />
                                        <span className={cn('text-sm font-medium', getQualityColor(lead.qualityScore))}>
                                            {lead.qualityScore}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Contact Info */}
                        {lead.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">{lead.phone}</span>
                            </div>
                        )}
                        {lead.email && (
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">{lead.email}</span>
                            </div>
                        )}

                        {/* Property Info */}
                        {lead.propertyAddress && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">{lead.propertyAddress}</span>
                            </div>
                        )}

                        {/* Source */}
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">Source: {lead.source}</span>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">
                                {new Date(lead.timestamp).toLocaleString()}
                            </span>
                        </div>

                        {/* Message */}
                        {lead.message && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-1">Message:</p>
                                <p className="text-sm text-muted-foreground">{lead.message}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Call Button */}
                        {lead.phone && (
                            <Button
                                onClick={handleCall}
                                className="w-full h-14 text-base"
                                size="lg"
                            >
                                <Phone className="h-5 w-5 mr-2" />
                                Call Now
                            </Button>
                        )}

                        {/* SMS Button */}
                        {lead.phone && (
                            <Button
                                onClick={() => setShowTemplates(true)}
                                variant="outline"
                                className="w-full h-14 text-base"
                                size="lg"
                            >
                                <MessageSquare className="h-5 w-5 mr-2" />
                                Send SMS
                            </Button>
                        )}

                        {/* Email Button */}
                        {lead.email && (
                            <Button
                                onClick={() => setShowTemplates(true)}
                                variant="outline"
                                className="w-full h-14 text-base"
                                size="lg"
                            >
                                <Mail className="h-5 w-5 mr-2" />
                                Send Email
                            </Button>
                        )}

                        {/* Schedule Button */}
                        <Button
                            variant="outline"
                            className="w-full h-14 text-base"
                            size="lg"
                        >
                            <Calendar className="h-5 w-5 mr-2" />
                            Schedule Follow-up
                        </Button>
                    </CardContent>
                </Card>

                {/* Template Selection Modal */}
                {showTemplates && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                        <div className="bg-background w-full rounded-t-2xl max-h-[80vh] overflow-y-auto">
                            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Choose Template</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowTemplates(false)}
                                >
                                    Cancel
                                </Button>
                            </div>

                            <div className="p-4 space-y-3">
                                {templates.map((template) => (
                                    <Card
                                        key={template.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => {
                                            if (template.type === 'sms') {
                                                handleSMS(template.id);
                                            } else {
                                                handleEmail(template.id);
                                            }
                                        }}
                                    >
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base">{template.name}</CardTitle>
                                                <Badge variant="outline">
                                                    {template.type.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                                {template.body}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* Quick send without template */}
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        if (lead.phone) handleSMS();
                                        if (lead.email) handleEmail();
                                    }}
                                >
                                    Send without template
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
