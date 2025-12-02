'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WebhookConfiguration, WebhookEvent } from '@/lib/open-house/types';
import { Webhook, Trash2, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebhookConfigurationProps {
    webhooks: WebhookConfiguration[];
    onCreateWebhook: (url: string, events: WebhookEvent[]) => Promise<void>;
    onUpdateWebhook: (webhookId: string, updates: Partial<WebhookConfiguration>) => Promise<void>;
    onDeleteWebhook: (webhookId: string) => Promise<void>;
    onTestWebhook: (url: string) => Promise<{ success: boolean; error?: string }>;
}

const WEBHOOK_EVENTS = [
    { value: WebhookEvent.VISITOR_CHECKED_IN, label: 'Visitor Checked In' },
    { value: WebhookEvent.SESSION_STARTED, label: 'Session Started' },
    { value: WebhookEvent.SESSION_ENDED, label: 'Session Ended' },
    { value: WebhookEvent.FOLLOW_UP_SENT, label: 'Follow-up Sent' },
];

export function WebhookConfigurationComponent({
    webhooks,
    onCreateWebhook,
    onUpdateWebhook,
    onDeleteWebhook,
    onTestWebhook,
}: WebhookConfigurationProps) {
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [newWebhookUrl, setNewWebhookUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
    const [testingUrl, setTestingUrl] = useState<string | null>(null);
    const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateWebhook = async () => {
        if (!newWebhookUrl) {
            toast({
                title: 'Error',
                description: 'Please enter a webhook URL',
                variant: 'destructive',
            });
            return;
        }

        if (selectedEvents.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select at least one event',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await onCreateWebhook(newWebhookUrl, selectedEvents);
            toast({
                title: 'Success',
                description: 'Webhook configuration created successfully',
            });
            setNewWebhookUrl('');
            setSelectedEvents([]);
            setIsCreating(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create webhook configuration',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTestWebhook = async (url: string) => {
        setTestingUrl(url);
        try {
            const result = await onTestWebhook(url);
            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Webhook test successful',
                });
            } else {
                toast({
                    title: 'Test Failed',
                    description: result.error || 'Webhook test failed',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to test webhook',
                variant: 'destructive',
            });
        } finally {
            setTestingUrl(null);
        }
    };

    const handleDeleteWebhook = async () => {
        if (!deleteWebhookId) return;

        setIsSubmitting(true);
        try {
            await onDeleteWebhook(deleteWebhookId);
            toast({
                title: 'Success',
                description: 'Webhook configuration deleted',
            });
            setDeleteWebhookId(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete webhook configuration',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (webhookId: string, currentActive: boolean) => {
        try {
            await onUpdateWebhook(webhookId, { active: !currentActive });
            toast({
                title: 'Success',
                description: `Webhook ${!currentActive ? 'enabled' : 'disabled'}`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update webhook',
                variant: 'destructive',
            });
        }
    };

    const handleEventToggle = (event: WebhookEvent) => {
        setSelectedEvents((prev) =>
            prev.includes(event)
                ? prev.filter((e) => e !== event)
                : [...prev, event]
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Webhook className="h-5 w-5" />
                        Webhook Configurations
                    </CardTitle>
                    <CardDescription>
                        Configure webhooks to receive real-time notifications about open house events
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isCreating ? (
                        <Button onClick={() => setIsCreating(true)}>
                            Add Webhook
                        </Button>
                    ) : (
                        <div className="space-y-4 border rounded-lg p-4">
                            <div className="space-y-2">
                                <Label htmlFor="webhook-url">Webhook URL</Label>
                                <Input
                                    id="webhook-url"
                                    type="url"
                                    placeholder="https://your-domain.com/webhook"
                                    value={newWebhookUrl}
                                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Events to Subscribe</Label>
                                <div className="space-y-2">
                                    {WEBHOOK_EVENTS.map((event) => (
                                        <div key={event.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={event.value}
                                                checked={selectedEvents.includes(event.value)}
                                                onCheckedChange={() => handleEventToggle(event.value)}
                                            />
                                            <Label
                                                htmlFor={event.value}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {event.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCreateWebhook}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Webhook'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewWebhookUrl('');
                                        setSelectedEvents([]);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {webhooks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Configured Webhooks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>URL</TableHead>
                                    <TableHead>Events</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {webhooks.map((webhook) => (
                                    <TableRow key={webhook.webhookId}>
                                        <TableCell className="font-mono text-sm">
                                            {webhook.url}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {webhook.events.map((event) => (
                                                    <Badge key={event} variant="secondary" className="text-xs">
                                                        {WEBHOOK_EVENTS.find((e) => e.value === event)?.label || event}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={webhook.active ? 'default' : 'secondary'}
                                                className="flex items-center gap-1 w-fit"
                                            >
                                                {webhook.active ? (
                                                    <>
                                                        <CheckCircle className="h-3 w-3" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-3 w-3" />
                                                        Inactive
                                                    </>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleTestWebhook(webhook.url)}
                                                    disabled={testingUrl === webhook.url}
                                                >
                                                    <TestTube className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleToggleActive(webhook.webhookId, webhook.active)}
                                                >
                                                    {webhook.active ? 'Disable' : 'Enable'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setDeleteWebhookId(webhook.webhookId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={!!deleteWebhookId} onOpenChange={() => setDeleteWebhookId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Webhook Configuration</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this webhook configuration? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteWebhook}
                            disabled={isSubmitting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
