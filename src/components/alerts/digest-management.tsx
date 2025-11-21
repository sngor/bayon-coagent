'use client';

/**
 * Digest Management Component
 * 
 * Provides UI for testing and managing digest email functionality.
 * Allows users to send test daily/weekly digests and view digest history.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Calendar, Clock, Send } from 'lucide-react';
import {
    sendDailyDigestAction,
    sendWeeklyDigestAction,
    initializeEmailTemplatesAction,
} from '@/app/actions';

interface DigestManagementProps {
    className?: string;
}

export function DigestManagement({ className }: DigestManagementProps) {
    const [dailyLoading, setDailyLoading] = useState(false);
    const [weeklyLoading, setWeeklyLoading] = useState(false);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const { toast } = useToast();

    const handleSendDailyDigest = async () => {
        try {
            setDailyLoading(true);
            const result = await sendDailyDigestAction();

            if (result.data?.success) {
                toast({
                    title: 'Daily Digest Sent',
                    description: `Successfully sent ${result.data.emailsSent} digest email(s)`,
                });
            } else {
                toast({
                    title: 'Digest Failed',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to send daily digest',
                variant: 'destructive',
            });
        } finally {
            setDailyLoading(false);
        }
    };

    const handleSendWeeklyDigest = async () => {
        try {
            setWeeklyLoading(true);
            const result = await sendWeeklyDigestAction();

            if (result.data?.success) {
                toast({
                    title: 'Weekly Digest Sent',
                    description: `Successfully sent ${result.data.emailsSent} digest email(s)`,
                });
            } else {
                toast({
                    title: 'Digest Failed',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to send weekly digest',
                variant: 'destructive',
            });
        } finally {
            setWeeklyLoading(false);
        }
    };

    const handleInitializeTemplates = async () => {
        try {
            setTemplatesLoading(true);
            const result = await initializeEmailTemplatesAction();

            if (result.data?.success) {
                toast({
                    title: 'Templates Initialized',
                    description: 'Email templates have been created/updated successfully',
                });
            } else {
                toast({
                    title: 'Template Initialization Failed',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to initialize email templates',
                variant: 'destructive',
            });
        } finally {
            setTemplatesLoading(false);
        }
    };

    return (
        <div className={className}>
            <div className="space-y-6">
                {/* Email Templates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Email Templates
                        </CardTitle>
                        <CardDescription>
                            Initialize or update email templates for notifications and digests
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-medium">Initialize Templates</p>
                                <p className="text-sm text-muted-foreground">
                                    Create or update email templates in AWS SES for real-time alerts and digests
                                </p>
                            </div>
                            <Button
                                onClick={handleInitializeTemplates}
                                disabled={templatesLoading}
                                variant="outline"
                            >
                                {templatesLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Initialize Templates
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Daily Digest */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Daily Digest
                        </CardTitle>
                        <CardDescription>
                            Send a test daily digest with alerts from the past 24 hours
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-medium">Test Daily Digest</p>
                                <p className="text-sm text-muted-foreground">
                                    Generate and send a daily digest email with recent alerts
                                </p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant="secondary">Past 24 hours</Badge>
                                    <Badge variant="outline">All alert types</Badge>
                                </div>
                            </div>
                            <Button
                                onClick={handleSendDailyDigest}
                                disabled={dailyLoading}
                            >
                                {dailyLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Send Daily Digest
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Digest */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Weekly Digest
                        </CardTitle>
                        <CardDescription>
                            Send a test weekly digest with alerts from the past 7 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-medium">Test Weekly Digest</p>
                                <p className="text-sm text-muted-foreground">
                                    Generate and send a weekly digest email with recent alerts
                                </p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant="secondary">Past 7 days</Badge>
                                    <Badge variant="outline">All alert types</Badge>
                                </div>
                            </div>
                            <Button
                                onClick={handleSendWeeklyDigest}
                                disabled={weeklyLoading}
                            >
                                {weeklyLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Send Weekly Digest
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Real-time Notifications</h4>
                            <p className="text-sm text-muted-foreground">
                                Sent immediately when new alerts are created, unless quiet hours are enabled.
                                During quiet hours, notifications are queued for later delivery.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Daily Digests</h4>
                            <p className="text-sm text-muted-foreground">
                                Sent once per day at your specified time, containing all alerts from the past 24 hours.
                                Only sent if there are alerts to include.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Weekly Digests</h4>
                            <p className="text-sm text-muted-foreground">
                                Sent once per week at your specified time, containing all alerts from the past 7 days.
                                Includes summary statistics and trends.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Email Templates</h4>
                            <p className="text-sm text-muted-foreground">
                                Professional email templates are stored in AWS SES and include your branding,
                                contact information, and unsubscribe links.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}