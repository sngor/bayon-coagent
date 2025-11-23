'use client';

import {
    ContentSection,
    FeatureBanner
} from '@/components/ui';
import { AlertsContent } from '@/components/alerts/alerts-content';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadAlertCount } from '@/hooks/use-unread-alert-count';
import { Badge } from '@/components/ui/badge';

export default function MarketAlertsPage() {
    const { unreadCount } = useUnreadAlertCount();

    return (
        <div className="space-y-6">
            {/* Feature Banner */}
            <FeatureBanner
                title="🔔 Market Alerts & Notifications"
                description="Stay informed about important market changes and opportunities"
                variant="onboarding"
                dismissible={true}
                tips={[
                    "Set up alerts for price changes in your target areas",
                    "Monitor new listings that match your client criteria",
                    "Get notified about market shifts that create opportunities",
                    "Use alerts to stay ahead of your competition"
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <Bell className="h-3 w-3" />
                                {unreadCount} unread
                            </Badge>
                        )}
                        <Button variant="outline" size="sm">
                            Alerts Guide
                        </Button>
                    </div>
                }
            />

            <ContentSection
                title="Market Alerts"
                description="Stay informed about important market changes and opportunities"
                icon={Bell}
                variant="default"
            >
                <AlertsContent />
            </ContentSection>
        </div>
    );
}