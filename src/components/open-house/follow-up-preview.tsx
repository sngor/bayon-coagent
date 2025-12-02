'use client';

/**
 * FollowUpPreview Component
 * 
 * Displays generated follow-up content for review before sending.
 * Shows email subject, body, SMS message, and next steps.
 * 
 * Validates Requirements: 3.1
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Mail,
    MessageSquare,
    ListChecks,
    Eye,
    Copy,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import { FollowUpContent, Visitor } from '@/lib/open-house/types';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface FollowUpPreviewProps {
    content: FollowUpContent;
    visitor: Visitor;
    photos?: import('@/lib/open-house/types').SessionPhoto[];
    trigger?: React.ReactNode;
}

export function FollowUpPreview({ content, visitor, photos = [], trigger }: FollowUpPreviewProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Filter photos to only those selected for this follow-up
    const selectedPhotos = photos.filter(p => content.photoIds?.includes(p.photoId));

    const handleCopy = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            toast({
                title: 'Copied',
                description: `${fieldName} copied to clipboard`,
            });
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            toast({
                title: 'Copy Failed',
                description: 'Failed to copy to clipboard',
                variant: 'destructive',
            });
        }
    };

    const getInterestLevelColor = (level: string) => {
        switch (level) {
            case 'high':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'medium':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'low':
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getDeliveryStatusColor = (status?: string) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'failed':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Follow-up Content Preview</DialogTitle>
                    <DialogDescription>
                        Review the AI-generated follow-up content for {visitor.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Visitor Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Visitor Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Name</span>
                                <span className="text-sm font-medium">{visitor.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Email</span>
                                <span className="text-sm font-medium">{visitor.email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Interest Level</span>
                                <Badge
                                    variant="outline"
                                    className={getInterestLevelColor(visitor.interestLevel)}
                                >
                                    {visitor.interestLevel}
                                </Badge>
                            </div>
                            {content.deliveryStatus && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge
                                        variant="outline"
                                        className={getDeliveryStatusColor(content.deliveryStatus)}
                                    >
                                        {content.deliveryStatus}
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Email Content */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    <CardTitle className="text-base">Email Content</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        handleCopy(
                                            `Subject: ${content.emailSubject}\n\n${content.emailBody}`,
                                            'Email'
                                        )
                                    }
                                >
                                    {copiedField === 'Email' ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Subject Line
                                </p>
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium">{content.emailSubject}</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Email Body
                                </p>
                                <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                                    <div className="prose prose-sm max-w-none">
                                        {content.emailBody.split('\n').map((paragraph, index) => (
                                            <p key={index} className="text-sm whitespace-pre-wrap">
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SMS Message */}
                    {content.smsMessage && content.smsMessage.trim() !== '' && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        <CardTitle className="text-base">SMS Message</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(content.smsMessage, 'SMS')}
                                    >
                                        {copiedField === 'SMS' ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm">{content.smsMessage}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {content.smsMessage.length} characters
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Selected Photos */}
                    {selectedPhotos.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Eye className="h-5 w-5" />
                                    <CardTitle className="text-base">
                                        Included Photos ({selectedPhotos.length})
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {selectedPhotos.map((photo) => (
                                        <div key={photo.photoId} className="space-y-2">
                                            <div className="relative aspect-square rounded-lg overflow-hidden">
                                                <img
                                                    src={photo.url}
                                                    alt={photo.aiDescription || 'Property photo'}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {photo.aiDescription && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {photo.aiDescription}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Next Steps */}
                    {content.nextSteps && content.nextSteps.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ListChecks className="h-5 w-5" />
                                        <CardTitle className="text-base">Next Steps</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleCopy(content.nextSteps.join('\n'), 'Next Steps')
                                        }
                                    >
                                        {copiedField === 'Next Steps' ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {content.nextSteps.map((step, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm flex-1 pt-0.5">{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Metadata */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Generated</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(content.generatedAt), 'MMM d, yyyy h:mm a')}
                                </span>
                            </div>
                            {content.sentAt && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Sent</span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {format(new Date(content.sentAt), 'MMM d, yyyy h:mm a')}
                                    </span>
                                </div>
                            )}
                            {content.openedAt && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Opened</span>
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        {format(new Date(content.openedAt), 'MMM d, yyyy h:mm a')}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
