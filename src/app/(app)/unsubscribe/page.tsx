'use client';

/**
 * Unsubscribe Page
 * 
 * Allows users to unsubscribe from email notifications using a token link.
 * Validates Requirements: 4.5
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { NotificationType } from '@/lib/notifications/types';

export default function UnsubscribePage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const [tokenData, setTokenData] = useState<{ userId: string; email: string } | null>(null);
    const [unsubscribeComplete, setUnsubscribeComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<NotificationType[]>([]);
    const [unsubscribeAll, setUnsubscribeAll] = useState(true);

    // Notification types for selective unsubscribe
    const notificationTypes = [
        { value: NotificationType.SYSTEM, label: 'System Notifications' },
        { value: NotificationType.ALERT, label: 'Market Alerts' },
        { value: NotificationType.REMINDER, label: 'Reminders' },
        { value: NotificationType.ACHIEVEMENT, label: 'Achievements' },
        { value: NotificationType.ANNOUNCEMENT, label: 'Announcements' },
        { value: NotificationType.TASK_COMPLETION, label: 'Task Completions' },
        { value: NotificationType.FEATURE_UPDATE, label: 'Feature Updates' },
    ];

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setError('No unsubscribe token provided');
            setValidating(false);
            setLoading(false);
            return;
        }

        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const formData = new FormData();
            formData.append('token', token!);

            const { validateUnsubscribeTokenAction } = await import('@/services/notifications/unsubscribe-actions');
            const result = await validateUnsubscribeTokenAction(null, formData);

            if (result.data?.valid) {
                setTokenValid(true);
                setTokenData(result.data);
            } else {
                setError(result.message || 'Invalid or expired unsubscribe link');
            }
        } catch (err) {
            setError('Failed to validate unsubscribe link');
        } finally {
            setValidating(false);
            setLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        if (!token) return;

        setProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('token', token);
            if (reason) {
                formData.append('reason', reason);
            }
            if (!unsubscribeAll && selectedTypes.length > 0) {
                formData.append('alertTypes', JSON.stringify(selectedTypes));
            }

            const { processUnsubscribeAction } = await import('@/services/notifications/unsubscribe-actions');
            const result = await processUnsubscribeAction(null, formData);

            if (result.data?.unsubscribed) {
                setUnsubscribeComplete(true);
            } else {
                setError(result.message || 'Failed to process unsubscribe request');
            }
        } catch (err) {
            setError('An error occurred while processing your request');
        } finally {
            setProcessing(false);
        }
    };

    const toggleNotificationType = (type: NotificationType) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    if (loading || validating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm text-slate-600">Validating unsubscribe link...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error && !tokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <XCircle className="h-6 w-6 text-red-600" />
                            <CardTitle>Invalid Link</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <p className="mt-4 text-sm text-slate-600">
                            This unsubscribe link may have expired or is invalid. If you continue to receive
                            unwanted emails, please contact support.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (unsubscribeComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <CardTitle>Unsubscribed Successfully</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-600">
                            {unsubscribeAll
                                ? 'You have been unsubscribed from all email notifications.'
                                : `You have been unsubscribed from ${selectedTypes.length} notification type(s).`}
                        </p>
                        <p className="text-sm text-slate-500">
                            You can update your notification preferences at any time by logging into your account.
                        </p>
                        <Button
                            onClick={() => window.location.href = '/'}
                            className="w-full"
                        >
                            Return to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Mail className="h-6 w-6 text-blue-600" />
                        <CardTitle>Unsubscribe from Email Notifications</CardTitle>
                    </div>
                    <CardDescription>
                        Manage your email notification preferences for {tokenData?.email}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="unsubscribe-all"
                                checked={unsubscribeAll}
                                onCheckedChange={(checked) => setUnsubscribeAll(checked as boolean)}
                            />
                            <Label htmlFor="unsubscribe-all" className="font-medium">
                                Unsubscribe from all email notifications
                            </Label>
                        </div>

                        {!unsubscribeAll && (
                            <div className="ml-6 space-y-3 border-l-2 border-slate-200 pl-4">
                                <p className="text-sm text-slate-600 mb-3">
                                    Or select specific notification types to unsubscribe from:
                                </p>
                                {notificationTypes.map((type) => (
                                    <div key={type.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={type.value}
                                            checked={selectedTypes.includes(type.value)}
                                            onCheckedChange={() => toggleNotificationType(type.value)}
                                        />
                                        <Label htmlFor={type.value} className="text-sm">
                                            {type.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Why are you unsubscribing? (Optional)
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Help us improve by letting us know why you're unsubscribing..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex space-x-3">
                        <Button
                            onClick={handleUnsubscribe}
                            disabled={processing || (!unsubscribeAll && selectedTypes.length === 0)}
                            className="flex-1"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Confirm Unsubscribe'
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                        You can re-subscribe at any time from your account settings.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
