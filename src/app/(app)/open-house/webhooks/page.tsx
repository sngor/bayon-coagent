import { Suspense } from 'react';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
import { WebhookConfigurationComponent } from '@/components/open-house/webhook-configuration';
import { WebhookDeliveryLogComponent } from '@/components/open-house/webhook-delivery-log';
import {
    getWebhookConfigurations,
    createWebhookConfiguration,
    updateWebhookConfiguration,
    deleteWebhookConfiguration,
    testWebhookUrl,
    getWebhookDeliveryLogs,
    retryWebhookDelivery,
} from '@/app/(app)/open-house/webhook-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata = {
    title: 'Webhook Configuration | Open House',
    description: 'Configure webhooks to receive real-time notifications about open house events',
};

async function WebhookConfigurationSection() {
    const { webhooks, error } = await getWebhookConfigurations();

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <WebhookConfigurationComponent
            webhooks={webhooks}
            onCreateWebhook={async (url, events) => {
                'use server';
                const result = await createWebhookConfiguration({ url, events });
                if (!result.success) {
                    throw new Error(result.error || 'Failed to create webhook');
                }
            }}
            onUpdateWebhook={async (webhookId, updates) => {
                'use server';
                const result = await updateWebhookConfiguration(webhookId, updates);
                if (!result.success) {
                    throw new Error(result.error || 'Failed to update webhook');
                }
            }}
            onDeleteWebhook={async (webhookId) => {
                'use server';
                const result = await deleteWebhookConfiguration(webhookId);
                if (!result.success) {
                    throw new Error(result.error || 'Failed to delete webhook');
                }
            }}
            onTestWebhook={async (url) => {
                'use server';
                return await testWebhookUrl(url);
            }}
        />
    );
}

async function WebhookDeliveryLogsSection() {
    // Get all webhooks first
    const { webhooks } = await getWebhookConfigurations();

    if (webhooks.length === 0) {
        return null;
    }

    // Get delivery logs for the first webhook (or all webhooks)
    // In a real implementation, you might want to allow filtering by webhook
    const allLogs = [];
    for (const webhook of webhooks) {
        const { logs } = await getWebhookDeliveryLogs(webhook.webhookId, 50);
        allLogs.push(...logs);
    }

    // Sort by most recent first
    allLogs.sort((a, b) =>
        new Date(b.lastAttemptAt).getTime() - new Date(a.lastAttemptAt).getTime()
    );

    // Take only the 50 most recent
    const recentLogs = allLogs.slice(0, 50);

    return (
        <WebhookDeliveryLogComponent
            logs={recentLogs}
            onRetry={async (deliveryId) => {
                'use server';
                const result = await retryWebhookDelivery(deliveryId);
                if (!result.success) {
                    throw new Error(result.error || 'Failed to retry webhook delivery');
                }
            }}
        />
    );
}

function LoadingSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function WebhooksPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-headline font-bold">Webhook Configuration</h2>
                    <p className="text-muted-foreground">
                        Configure webhooks to receive real-time notifications about open house events
                    </p>
                </div>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                    <CardTitle className="text-blue-900 dark:text-blue-100">
                        About Webhooks
                    </CardTitle>
                    <CardDescription className="text-blue-700 dark:text-blue-300">
                        Webhooks allow external applications to receive real-time notifications when events occur
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <p>
                        Configure webhook endpoints to integrate open house events with your CRM, marketing automation,
                        or other systems. When events occur (visitor check-in, session start/end, follow-up sent),
                        we'll send a POST request to your configured URL.
                    </p>
                    <p className="font-medium">
                        Supported events: Visitor Checked In, Session Started, Session Ended, Follow-up Sent
                    </p>
                </CardContent>
            </Card>

            <Suspense fallback={<LoadingSkeleton />}>
                <WebhookConfigurationSection />
            </Suspense>

            <Suspense fallback={<LoadingSkeleton />}>
                <WebhookDeliveryLogsSection />
            </Suspense>
        </div>
    );
}
