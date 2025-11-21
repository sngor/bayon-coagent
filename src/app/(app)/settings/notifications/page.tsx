/**
 * Notification Settings Page
 * 
 * Allows users to manage their email notification preferences for Market Intelligence Alerts.
 */

import { Metadata } from 'next';
import { NotificationSettings } from '@/components/alerts/notification-settings';
import { DigestManagement } from '@/components/alerts/digest-management';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
    title: 'Notification Settings - Bayon CoAgent',
    description: 'Manage your email notification preferences for market intelligence alerts',
};

export default function NotificationSettingsPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your email notification preferences for market intelligence alerts.
                        Control when and how you receive notifications about new opportunities.
                    </p>
                </div>

                <NotificationSettings />

                <Separator />

                <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-2">Digest Management</h2>
                    <p className="text-muted-foreground mb-6">
                        Test digest functionality and manage email templates.
                    </p>
                    <DigestManagement />
                </div>
            </div>
        </div>
    );
}