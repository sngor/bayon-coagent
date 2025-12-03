'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    QrCode,
    MessageSquare,
    Mail,
    Share2,
    Copy,
    Check,
    Download,
    Eye,
    MousePointerClick,
} from 'lucide-react';
import { sharePropertyAction, getShareMetricsAction } from '@/app/mobile-actions';
import { isWebShareSupported, shareViaWebAPI } from '@/lib/mobile/quick-share';
import { useToast } from '@/hooks/use-toast';

interface QuickShareInterfaceProps {
    propertyId: string;
    propertyData?: {
        address?: string;
        price?: string;
        beds?: number;
        baths?: number;
        sqft?: number;
        description?: string;
        imageUrl?: string;
    };
    onClose?: () => void;
}

export function QuickShareInterface({
    propertyId,
    propertyData,
    onClose,
}: QuickShareInterfaceProps) {
    const [selectedMethod, setSelectedMethod] = useState<'qr' | 'sms' | 'email' | 'social'>('qr');
    const [recipient, setRecipient] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [shareResult, setShareResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const { toast } = useToast();

    const webShareSupported = isWebShareSupported();

    useEffect(() => {
        // Load metrics if we have a share result
        if (shareResult?.shareId) {
            loadMetrics(shareResult.shareId);
        }
    }, [shareResult]);

    const loadMetrics = async (shareId: string) => {
        try {
            const result = await getShareMetricsAction(shareId);
            if (result.success && result.data) {
                setMetrics(result.data);
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const formData = new FormData();
            formData.append('propertyId', propertyId);
            formData.append('method', selectedMethod);
            if (recipient) formData.append('recipient', recipient);
            if (customMessage) formData.append('customMessage', customMessage);
            if (propertyData) {
                formData.append('propertyData', JSON.stringify(propertyData));
            }

            const result = await sharePropertyAction(null, formData);

            if (result.success && result.data) {
                setShareResult(result.data);
                toast({
                    title: 'Share created',
                    description: 'Your property share has been created successfully.',
                });

                // If using Web Share API for social
                if (selectedMethod === 'social' && webShareSupported) {
                    const title = propertyData?.address || 'Property';
                    const text = customMessage || 'Check out this property!';
                    await shareViaWebAPI({
                        title,
                        text,
                        url: result.data.trackingUrl,
                    });
                }
            } else {
                toast({
                    title: 'Share failed',
                    description: result.message || 'Failed to create share',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Share error:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsSharing(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast({
                title: 'Copied',
                description: 'Copied to clipboard',
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Copy failed:', error);
            toast({
                title: 'Copy failed',
                description: 'Failed to copy to clipboard',
                variant: 'destructive',
            });
        }
    };

    const downloadQRCode = () => {
        if (!shareResult?.qrCodeDataUrl) return;

        const link = document.createElement('a');
        link.href = shareResult.qrCodeDataUrl;
        link.download = `property-qr-${propertyId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: 'Downloaded',
            description: 'QR code downloaded successfully',
        });
    };

    const shareMethodButtons = [
        {
            method: 'qr' as const,
            icon: QrCode,
            label: 'QR Code',
            description: 'Generate scannable code',
        },
        {
            method: 'sms' as const,
            icon: MessageSquare,
            label: 'SMS',
            description: 'Send via text message',
        },
        {
            method: 'email' as const,
            icon: Mail,
            label: 'Email',
            description: 'Send via email',
        },
        {
            method: 'social' as const,
            icon: Share2,
            label: 'Social',
            description: 'Share on social media',
            disabled: !webShareSupported,
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Quick Share</CardTitle>
                    <CardDescription>
                        Share property information with clients instantly
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Property Info */}
                    {propertyData && (
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            {propertyData.address && (
                                <p className="font-medium">{propertyData.address}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                {propertyData.price && <span>${propertyData.price}</span>}
                                {propertyData.beds && <span>{propertyData.beds} bed</span>}
                                {propertyData.baths && <span>{propertyData.baths} bath</span>}
                                {propertyData.sqft && (
                                    <span>{propertyData.sqft.toLocaleString()} sqft</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Share Method Selection */}
                    {!shareResult && (
                        <>
                            <div className="space-y-3">
                                <Label>Share Method</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {shareMethodButtons.map((btn) => {
                                        const Icon = btn.icon;
                                        return (
                                            <Button
                                                key={btn.method}
                                                variant={selectedMethod === btn.method ? 'default' : 'outline'}
                                                className="h-auto flex-col items-start p-4 space-y-2"
                                                onClick={() => setSelectedMethod(btn.method)}
                                                disabled={btn.disabled}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <div className="text-left">
                                                    <div className="font-medium">{btn.label}</div>
                                                    <div className="text-xs opacity-70">{btn.description}</div>
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recipient Input (for SMS/Email) */}
                            {(selectedMethod === 'sms' || selectedMethod === 'email') && (
                                <div className="space-y-2">
                                    <Label htmlFor="recipient">
                                        {selectedMethod === 'sms' ? 'Phone Number' : 'Email Address'}
                                    </Label>
                                    <Input
                                        id="recipient"
                                        type={selectedMethod === 'sms' ? 'tel' : 'email'}
                                        placeholder={
                                            selectedMethod === 'sms'
                                                ? '+1 (555) 123-4567'
                                                : 'client@example.com'
                                        }
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Custom Message */}
                            <div className="space-y-2">
                                <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                                <Textarea
                                    id="customMessage"
                                    placeholder="Add a personal message..."
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            {/* Share Button */}
                            <Button
                                onClick={handleShare}
                                disabled={isSharing}
                                className="w-full"
                                size="lg"
                            >
                                {isSharing ? 'Creating Share...' : 'Create Share'}
                            </Button>
                        </>
                    )}

                    {/* Share Result */}
                    {shareResult && (
                        <div className="space-y-4">
                            {/* QR Code Display */}
                            {shareResult.qrCodeDataUrl && (
                                <div className="flex flex-col items-center space-y-4 p-6 bg-muted rounded-lg">
                                    <img
                                        src={shareResult.qrCodeDataUrl}
                                        alt="Property QR Code"
                                        className="w-64 h-64 border-4 border-background rounded-lg"
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={downloadQRCode} variant="outline" size="sm">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Tracking URL */}
                            <div className="space-y-2">
                                <Label>Tracking URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={shareResult.trackingUrl}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        onClick={() => copyToClipboard(shareResult.trackingUrl)}
                                        variant="outline"
                                        size="icon"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* SMS Message */}
                            {shareResult.smsMessage && (
                                <div className="space-y-2">
                                    <Label>SMS Message</Label>
                                    <Textarea
                                        value={shareResult.smsMessage}
                                        readOnly
                                        rows={6}
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        onClick={() => copyToClipboard(shareResult.smsMessage)}
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Message
                                    </Button>
                                </div>
                            )}

                            {/* Email Content */}
                            {shareResult.emailSubject && shareResult.emailBody && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Email Subject</Label>
                                        <Input value={shareResult.emailSubject} readOnly />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Body</Label>
                                        <Textarea
                                            value={shareResult.emailBody}
                                            readOnly
                                            rows={10}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                    <Button
                                        onClick={() =>
                                            copyToClipboard(
                                                `Subject: ${shareResult.emailSubject}\n\n${shareResult.emailBody}`
                                            )
                                        }
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Email
                                    </Button>
                                </div>
                            )}

                            {/* Engagement Metrics */}
                            {metrics && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-2xl font-bold">{metrics.views}</div>
                                            <div className="text-xs text-muted-foreground">Views</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-2xl font-bold">{metrics.clicks}</div>
                                            <div className="text-xs text-muted-foreground">Clicks</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        setShareResult(null);
                                        setRecipient('');
                                        setCustomMessage('');
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Create Another
                                </Button>
                                {onClose && (
                                    <Button onClick={onClose} className="flex-1">
                                        Done
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
