'use client';

/**
 * Mobile Lead Response Demo Page
 * 
 * Demonstrates the lead response system with sample leads and interactions.
 * Shows notification handling, lead prioritization, and quick response features.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeadDetailsView } from '@/components/mobile/lead-details-view';
import { LeadNotificationHandler, useLeadNotifications } from '@/components/mobile/lead-notification-handler';
import { Lead, leadResponseService } from '@/lib/mobile/lead-response';
import { Bell, Star, Clock, TrendingUp } from 'lucide-react';
import { showSuccessToast } from '@/hooks/use-toast';

// Sample leads for demo
const sampleLeads: Lead[] = [
    {
        id: 'lead-1',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+1-555-0123',
        source: 'Website',
        propertyId: 'prop-123',
        propertyAddress: '123 Main St, San Francisco, CA',
        message: 'I\'m interested in scheduling a showing for this property. I\'m available this week.',
        qualityScore: 85,
        urgency: 'high',
        timestamp: Date.now() - 300000, // 5 minutes ago
    },
    {
        id: 'lead-2',
        name: 'Michael Chen',
        email: 'mchen@email.com',
        phone: '+1-555-0456',
        source: 'Zillow',
        propertyId: 'prop-456',
        propertyAddress: '456 Oak Ave, San Francisco, CA',
        message: 'Looking for more information about this listing.',
        qualityScore: 72,
        urgency: 'medium',
        timestamp: Date.now() - 900000, // 15 minutes ago
    },
    {
        id: 'lead-3',
        name: 'Emily Rodriguez',
        phone: '+1-555-0789',
        source: 'Referral',
        propertyAddress: '789 Pine St, San Francisco, CA',
        message: 'Referred by John Smith. Need to sell my current home and buy a new one.',
        qualityScore: 95,
        urgency: 'critical',
        timestamp: Date.now() - 60000, // 1 minute ago
    },
    {
        id: 'lead-4',
        name: 'David Park',
        email: 'dpark@email.com',
        source: 'Social Media',
        message: 'First-time homebuyer looking for guidance.',
        qualityScore: 58,
        urgency: 'low',
        timestamp: Date.now() - 1800000, // 30 minutes ago
    },
];

const agentData = {
    name: 'Alex Thompson',
    company: 'Premier Realty',
    phone: '+1-555-1234',
    email: 'alex@premierrealty.com',
};

export default function MobileLeadDemoPage() {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [leads, setLeads] = useState<Lead[]>(sampleLeads);
    const { hasPermission, requestPermission, sendNotification, prioritizeLeads } = useLeadNotifications();

    // Prioritize leads
    const prioritizedLeads = prioritizeLeads(leads);

    // Handle test notification
    const handleTestNotification = async () => {
        if (!hasPermission) {
            const granted = await requestPermission();
            if (!granted) {
                return;
            }
        }

        // Send notification for the first lead
        const testLead = leads[0];
        const success = await sendNotification(testLead);

        if (success) {
            showSuccessToast('Test notification sent', 'Check your notifications');
        }
    };

    // Handle interaction logging
    const handleInteraction = (type: 'call' | 'sms' | 'email', content?: string) => {
        showSuccessToast(
            'Interaction logged',
            `${type.toUpperCase()} interaction recorded`
        );
        console.log('Interaction:', { type, content });
    };

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

    // Get quality color
    const getQualityColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-gray-600';
    };

    if (selectedLead) {
        return (
            <LeadDetailsView
                lead={selectedLead}
                agentData={agentData}
                onInteraction={handleInteraction}
                onClose={() => setSelectedLead(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Notification Handler */}
            <LeadNotificationHandler
                onNotificationTap={(leadId) => {
                    const lead = leads.find(l => l.id === leadId);
                    if (lead) setSelectedLead(lead);
                }}
                onNewLeads={(newLeads) => {
                    setLeads(prev => [...newLeads, ...prev]);
                }}
            />

            {/* Header */}
            <div className="sticky top-0 bg-background border-b p-4 z-10">
                <h1 className="text-2xl font-bold">Lead Response Demo</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Mobile-optimized lead management system
                </p>
            </div>

            <div className="p-4 space-y-4">
                {/* Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Lead Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Total Leads</span>
                            </div>
                            <p className="text-2xl font-bold">{leads.length}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Avg Quality</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {Math.round(leads.reduce((sum, l) => sum + l.qualityScore, 0) / leads.length)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Test Notification Button */}
                <Button
                    onClick={handleTestNotification}
                    className="w-full"
                    variant="outline"
                >
                    <Bell className="h-4 w-4 mr-2" />
                    Test Push Notification
                </Button>

                {/* Lead List */}
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Leads (Prioritized)</h2>

                    {prioritizedLeads.map((lead) => (
                        <Card
                            key={lead.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedLead(lead)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold">{lead.name}</h3>
                                        <p className="text-sm text-muted-foreground">{lead.source}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge className={getUrgencyColor(lead.urgency)}>
                                            {lead.urgency}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                            <Star className={`h-3 w-3 ${getQualityColor(lead.qualityScore)}`} />
                                            <span className={`text-xs font-medium ${getQualityColor(lead.qualityScore)}`}>
                                                {lead.qualityScore}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {lead.propertyAddress && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        📍 {lead.propertyAddress}
                                    </p>
                                )}

                                {lead.message && (
                                    <p className="text-sm line-clamp-2 mb-2">
                                        {lead.message}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                        {new Date(lead.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Info Card */}
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p>✅ Automatic lead prioritization based on quality and urgency</p>
                        <p>✅ Push notifications for new high-priority leads</p>
                        <p>✅ Quick response templates for SMS and email</p>
                        <p>✅ One-tap calling and messaging</p>
                        <p>✅ Automatic interaction logging</p>
                        <p>✅ Follow-up reminder creation</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
