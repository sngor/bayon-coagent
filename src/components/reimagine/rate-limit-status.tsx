'use client';

/**
 * Rate Limit Status Component
 * 
 * Displays current rate limit status for upload and edit operations.
 * Shows remaining requests and time until reset.
 * 
 * Requirements: Security considerations
 */

import { useEffect, useState } from 'react';
import { Clock, Upload, Edit3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getRateLimitStatusAction } from '@/app/reimagine-actions';

interface RateLimitStatusProps {
    userId: string;
    className?: string;
}

interface RateLimitInfo {
    allowed: boolean;
    remaining: number;
    total: number;
    resetAt: Date;
    retryAfter?: number;
}

export function RateLimitStatus({ userId, className }: RateLimitStatusProps) {
    const [uploadLimit, setUploadLimit] = useState<RateLimitInfo | null>(null);
    const [editLimit, setEditLimit] = useState<RateLimitInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch rate limit status
    const fetchRateLimits = async () => {
        try {
            const [uploadResult, editResult] = await Promise.all([
                getRateLimitStatusAction(userId, 'upload'),
                getRateLimitStatusAction(userId, 'edit'),
            ]);

            if (uploadResult.success && uploadResult.status) {
                setUploadLimit({
                    allowed: uploadResult.status.allowed,
                    remaining: uploadResult.status.remaining,
                    total: 10, // From RATE_LIMITS.upload.maxRequests
                    resetAt: new Date(uploadResult.status.resetAt),
                    retryAfter: uploadResult.status.retryAfter,
                });
            }

            if (editResult.success && editResult.status) {
                setEditLimit({
                    allowed: editResult.status.allowed,
                    remaining: editResult.status.remaining,
                    total: 20, // From RATE_LIMITS.edit.maxRequests
                    resetAt: new Date(editResult.status.resetAt),
                    retryAfter: editResult.status.retryAfter,
                });
            }
        } catch (error) {
            console.error('Failed to fetch rate limit status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRateLimits();

        // Refresh every 30 seconds
        const interval = setInterval(fetchRateLimits, 30000);

        return () => clearInterval(interval);
    }, [userId]);

    if (loading) {
        return null;
    }

    // Format time until reset
    const formatTimeUntilReset = (resetAt: Date) => {
        const now = new Date();
        const diff = resetAt.getTime() - now.getTime();

        if (diff <= 0) {
            return 'Resetting...';
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Rate Limits
                </CardTitle>
                <CardDescription className="text-xs">
                    Usage limits reset every hour
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload Rate Limit */}
                {uploadLimit && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-medium">Uploads</span>
                            </div>
                            <span className="text-muted-foreground">
                                {uploadLimit.remaining}/{uploadLimit.total}
                            </span>
                        </div>
                        <Progress
                            value={(uploadLimit.remaining / uploadLimit.total) * 100}
                            className="h-2"
                        />
                        {!uploadLimit.allowed && (
                            <p className="text-xs text-destructive">
                                Limit reached. Resets in {formatTimeUntilReset(uploadLimit.resetAt)}
                            </p>
                        )}
                        {uploadLimit.allowed && uploadLimit.remaining <= 2 && (
                            <p className="text-xs text-amber-600 dark:text-amber-500">
                                {uploadLimit.remaining} upload{uploadLimit.remaining !== 1 ? 's' : ''} remaining
                            </p>
                        )}
                    </div>
                )}

                {/* Edit Rate Limit */}
                {editLimit && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-medium">Edits</span>
                            </div>
                            <span className="text-muted-foreground">
                                {editLimit.remaining}/{editLimit.total}
                            </span>
                        </div>
                        <Progress
                            value={(editLimit.remaining / editLimit.total) * 100}
                            className="h-2"
                        />
                        {!editLimit.allowed && (
                            <p className="text-xs text-destructive">
                                Limit reached. Resets in {formatTimeUntilReset(editLimit.resetAt)}
                            </p>
                        )}
                        {editLimit.allowed && editLimit.remaining <= 5 && (
                            <p className="text-xs text-amber-600 dark:text-amber-500">
                                {editLimit.remaining} edit{editLimit.remaining !== 1 ? 's' : ''} remaining
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
