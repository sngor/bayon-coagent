'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Download, Share2, Wand2, RefreshCw, ImagePlus, Trash2 } from 'lucide-react';
import { generatePostCardAction } from '@/features/content-engine/actions/post-card-actions';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';

import { CardTypeSelector } from './card-type-selector';
import { StyleSelector } from './style-selector';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QRCodeCanvas } from 'qrcode.react';
import {
    listDashboards,
    listAllAgentLinks,
    type ClientDashboard,
    type SecuredLink
} from '@/features/client-dashboards/actions/client-dashboard-actions';
import { useUser } from '@/aws/auth';
import { StandardFormField } from '@/components/standard/form-field';
import { StandardLoadingState } from '@/components/standard/loading-state';
import { StandardErrorDisplay } from '@/components/standard/error-display';
import { StandardEmptyState } from '@/components/standard/empty-state';

export default function PostCardsPage() {
    const { toast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [recipient, setRecipient] = useState('');
    const [style, setStyle] = useState('');
    const [cardType, setCardType] = useState('Holiday Card');
    const [generationMode, setGenerationMode] = useState<'print' | 'social'>('print');
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);

    // QR Code State
    const { user } = useUser();
    const [qrCodeEnabled, setQrCodeEnabled] = useState(false);
    const [qrCodeSource, setQrCodeSource] = useState<'dashboard' | 'custom'>('dashboard');
    const [customQrLink, setCustomQrLink] = useState('');
    const [selectedDashboardId, setSelectedDashboardId] = useState<string>('');
    const [dashboards, setDashboards] = useState<ClientDashboard[]>([]);
    const [links, setLinks] = useState<SecuredLink[]>([]);
    const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);

    // Fetch dashboards when QR code is enabled
    useEffect(() => {
        if (qrCodeEnabled && dashboards.length === 0 && user) {
            const fetchData = async () => {
                setIsLoadingDashboards(true);
                try {
                    const [dashboardsResult, linksResult] = await Promise.all([
                        listDashboards(),
                        listAllAgentLinks()
                    ]);

                    if (dashboardsResult.data) {
                        setDashboards(dashboardsResult.data);
                    }
                    if (linksResult.data) {
                        setLinks(linksResult.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch dashboards:', error);
                    toast({
                        title: 'Error',
                        description: 'Failed to load dashboards for QR code',
                        variant: 'destructive',
                    });
                } finally {
                    setIsLoadingDashboards(false);
                }
            };
            fetchData();
        }
    }, [qrCodeEnabled, user]);

    const getDashboardLink = (dashboardId: string) => {
        const link = links
            .filter(l => l.dashboardId === dashboardId && !l.revoked)
            .sort((a, b) => b.createdAt - a.createdAt)[0];

        if (!link) return '';

        const baseUrl = window.location.origin;
        return `${baseUrl}/d/${link.token}`;
    };

    const getQrValue = () => {
        if (!qrCodeEnabled) return '';
        if (qrCodeSource === 'custom') return customQrLink;
        if (selectedDashboardId) return getDashboardLink(selectedDashboardId);
        return '';
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please upload an image smaller than 5MB",
                variant: "destructive"
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data URL prefix to get raw base64 if needed, but Gemini helper handles data URLs
            // Actually gemini-image.ts expects base64 data, let's check implementation
            // The implementation in gemini-image.ts takes the data part from inlineData.data
            // But here we are passing it to generatePostCardAction which passes it to generateImageWithGemini
            // generateImageWithGemini constructs inlineData: { data: input.referenceImage ... }
            // So we should strip the prefix if it exists
            const base64Data = base64String.split(',')[1] || base64String;
            setReferenceImage(base64Data);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!prompt) {
            toast({
                title: 'Missing Description',
                description: 'Please enter a description for your card to guide the AI.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);
        setGenerationError(null);

        try {
            const result = await generatePostCardAction({
                prompt,
                recipient,
                style,
                cardType,
                generationMode,
                referenceImage: referenceImage || undefined,
            });

            if (result.success && result.imageUrl) {
                setGeneratedImage(result.imageUrl);
                toast({
                    title: 'Card Generated!',
                    description: 'Your custom post card is ready.',
                    variant: 'default',
                    className: "bg-green-600 text-white border-none",
                });
            } else {
                const errorMsg = result.error || 'Failed to generate post card. Please try again.';
                setGenerationError(errorMsg);
                toast({
                    title: 'Generation Failed',
                    description: errorMsg,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Generation error:', error);
            const errorMsg = 'An unexpected error occurred. Please try again later.';
            setGenerationError(errorMsg);
            toast({
                title: 'System Error',
                description: errorMsg,
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;

        const qrValue = getQrValue();

        if (qrCodeEnabled && qrValue) {
            // Composite QR code onto image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw main image
                ctx?.drawImage(img, 0, 0);

                // Draw QR Code
                const qrCanvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
                if (qrCanvas && ctx) {
                    // Calculate position (bottom right, with padding)
                    const qrSize = Math.max(img.width * 0.15, 150); // 15% of width or min 150px
                    const padding = qrSize * 0.1;
                    const x = img.width - qrSize - padding;
                    const y = img.height - qrSize - padding;

                    // Draw white background for QR code
                    ctx.fillStyle = 'white';
                    ctx.fillRect(x - 10, y - 10, qrSize + 20, qrSize + 20);

                    // Draw QR code
                    ctx.drawImage(qrCanvas, x, y, qrSize, qrSize);
                }

                // Download
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `bayon-postcard-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            img.src = generatedImage;
            // Handle cross-origin if needed (though generatedImage is usually base64 or local blob)
            img.crossOrigin = "anonymous";
        } else {
            // Standard download
            const link = document.createElement('a');
            link.href = generatedImage;
            link.download = `bayon-postcard-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        toast({
            title: "Downloaded",
            description: "Image saved to your device.",
        });
    };

    const enhancePrompt = () => {
        if (!prompt) return;
        setPrompt(prev => `${prev}, professional photography, 8k resolution, highly detailed, cinematic lighting`);
        toast({
            title: "Prompt Enhanced",
            description: "Added professional keywords to your description.",
        });
    };

    return (
        <div className="w-full space-y-8 pb-12">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">Post Card Studio</h1>
                <p className="text-muted-foreground mt-1">
                    Design stunning, personalized real estate post cards in seconds with AI.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Controls */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-muted/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Configuration</CardTitle>
                            <CardDescription>Customize the details of your card.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Generation Mode Selection */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Output Format</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        className={`cursor-pointer border-2 rounded-lg p-3 flex flex-col items-center text-center gap-2 transition-all ${generationMode === 'print' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted hover:border-primary/50'}`}
                                        onClick={() => setGenerationMode('print')}
                                    >
                                        <div className={`p-2 rounded-full ${generationMode === 'print' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            <Download className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">Print Ready</div>
                                            <div className="text-[10px] text-muted-foreground">Full image, no background</div>
                                        </div>
                                    </div>
                                    <div
                                        className={`cursor-pointer border-2 rounded-lg p-3 flex flex-col items-center text-center gap-2 transition-all ${generationMode === 'social' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted hover:border-primary/50'}`}
                                        onClick={() => setGenerationMode('social')}
                                    >
                                        <div className={`p-2 rounded-full ${generationMode === 'social' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            <Share2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">Social Showcase</div>
                                            <div className="text-[10px] text-muted-foreground">Staged with background</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* QR Code Configuration */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Include QR Code</Label>
                                        <div className="text-xs text-muted-foreground">
                                            Link to a client dashboard
                                        </div>
                                    </div>
                                    <Switch
                                        checked={qrCodeEnabled}
                                        onCheckedChange={setQrCodeEnabled}
                                    />
                                </div>

                                {qrCodeEnabled && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <RadioGroup
                                            value={qrCodeSource}
                                            onValueChange={(value) => setQrCodeSource(value as 'dashboard' | 'custom')}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            <div>
                                                <RadioGroupItem value="dashboard" id="source-dashboard" className="peer sr-only" />
                                                <Label
                                                    htmlFor="source-dashboard"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    <span className="text-sm font-medium">Dashboard</span>
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="custom" id="source-custom" className="peer sr-only" />
                                                <Label
                                                    htmlFor="source-custom"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    <span className="text-sm font-medium">Custom Link</span>
                                                </Label>
                                            </div>
                                        </RadioGroup>

                                        {qrCodeSource === 'dashboard' ? (
                                            <StandardFormField
                                                label="Select Dashboard"
                                                id="dashboard-select"
                                                error={selectedDashboardId && !getDashboardLink(selectedDashboardId) ? "No active link found for this dashboard. Please generate one in the dashboard manager." : undefined}
                                            >
                                                <Select
                                                    value={selectedDashboardId}
                                                    onValueChange={setSelectedDashboardId}
                                                    disabled={isLoadingDashboards}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={isLoadingDashboards ? "Loading..." : "Select a client dashboard"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {dashboards.map((dashboard) => (
                                                            <SelectItem key={dashboard.id} value={dashboard.id}>
                                                                {dashboard.clientInfo.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </StandardFormField>
                                        ) : (
                                            <StandardFormField
                                                label="Custom URL or Text"
                                                id="custom-qr-link"
                                                helpText="Enter your website, contact info, or any other link."
                                            >
                                                <Input
                                                    id="custom-qr-link"
                                                    placeholder="https://your-website.com"
                                                    value={customQrLink}
                                                    onChange={(e) => setCustomQrLink(e.target.value)}
                                                />
                                            </StandardFormField>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Card Type Selection */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Card Type</Label>
                                <CardTypeSelector value={cardType} onChange={setCardType} />
                            </div>

                            <Separator />

                            {/* Recipient & Style */}
                            <div className="grid grid-cols-1 gap-4">
                                <StandardFormField
                                    label="Recipient Name (Optional)"
                                    id="recipient"
                                    helpText="Personalize the card with a recipient name"
                                >
                                    <Input
                                        id="recipient"
                                        placeholder="e.g. The Smith Family"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        className="bg-muted/30"
                                    />
                                </StandardFormField>
                                <div className="space-y-2">
                                    <StandardFormField
                                        label="Visual Style"
                                        id="style"
                                        helpText="Choose or enter a custom style"
                                    >
                                        <Input
                                            id="style"
                                            placeholder="e.g. Modern, Classic, Watercolor..."
                                            value={style}
                                            onChange={(e) => setStyle(e.target.value)}
                                            className="bg-muted/30"
                                        />
                                    </StandardFormField>
                                    <StyleSelector value={style} onChange={setStyle} />
                                </div>
                            </div>

                            <Separator />

                            {/* Reference Image Upload */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Reference Image (Optional)</Label>
                                <div className="grid grid-cols-1 gap-4">
                                    {!referenceImage ? (
                                        <div
                                            className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 rounded-lg p-6 transition-all cursor-pointer text-center"
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                        >
                                            <input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                aria-label="Upload reference image"
                                            />
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-muted rounded-full">
                                                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div className="text-sm font-medium">Click to upload reference</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Use an existing photo to guide the style or composition
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative rounded-lg overflow-hidden border border-border group">
                                            <img
                                                src={`data:image/png;base64,${referenceImage}`}
                                                alt="Reference"
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setReferenceImage(null)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Prompt Input */}
                            <StandardFormField
                                label="Description"
                                id="prompt"
                                required
                                helpText="Tip: Be specific about lighting, mood, and architectural details for best results."
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs text-blue-600 hover:text-blue-700"
                                            onClick={enhancePrompt}
                                            disabled={!prompt}
                                        >
                                            <Wand2 className="h-3 w-3 mr-1" />
                                            Enhance Prompt
                                        </Button>
                                    </div>
                                    <Textarea
                                        id="prompt"
                                        placeholder="Describe the scene in detail. For example: 'A beautiful modern house with a sold sign in the front yard, sunny day, blue sky, lush green grass'..."
                                        className="h-32 resize-none bg-muted/30 focus:bg-background transition-colors"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                </div>
                            </StandardFormField>
                        </CardContent>
                        <CardFooter className="pt-2 pb-6">
                            <Button
                                className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Generating Masterpiece...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Generate Card
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Right Column: Preview */}
                <div className="lg:col-span-7">
                    <Card className="h-full min-h-[600px] flex flex-col border-muted/60 shadow-md overflow-hidden bg-muted/10">
                        <CardHeader className="border-b bg-background/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Live Preview</CardTitle>
                                    <CardDescription>Your generated design will appear here.</CardDescription>
                                </div>
                                {generatedImage && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Ready for Download
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 relative flex items-center justify-center bg-muted/5">
                            {isGenerating ? (
                                <div className="p-8">
                                    <StandardLoadingState
                                        variant="spinner"
                                        size="lg"
                                        text="Creating your design..."
                                    />
                                    <p className="text-muted-foreground text-center mt-4 max-w-xs mx-auto">
                                        AI is composing the image, adjusting lighting, and applying styles. This usually takes about 10-15 seconds.
                                    </p>
                                </div>

                            ) : generationError ? (
                                <div className="p-8 w-full max-w-md">
                                    <StandardErrorDisplay
                                        title="Generation Failed"
                                        message={generationError}
                                        variant="error"
                                        action={{
                                            label: "Try Again",
                                            onClick: () => {
                                                setGenerationError(null);
                                                handleGenerate();
                                            }
                                        }}
                                    />
                                </div>

                            ) : generatedImage ? (
                                <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-neutral-900/5">
                                    <div className="relative max-w-full max-h-full">
                                        <NextImage
                                            src={generatedImage}
                                            alt="Generated Post Card"
                                            className="max-w-full max-h-[600px] object-contain shadow-lg"
                                            width={800}
                                            height={600}
                                            unoptimized
                                        />
                                        {qrCodeEnabled && getQrValue() && (
                                            <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow-md">
                                                <QRCodeCanvas
                                                    id="qr-code-canvas"
                                                    value={getQrValue()}
                                                    size={80}
                                                    level="H"
                                                    includeMargin={false}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 w-full max-w-md mx-auto">
                                    <StandardEmptyState
                                        icon={Sparkles}
                                        title="Ready to Create?"
                                        description="Select a card type, choose a style, and describe your vision to generate a unique, professional post card."
                                    />
                                    <div className="grid grid-cols-2 gap-3 text-sm text-left mt-8">
                                        <div className="bg-background p-3 rounded border shadow-sm">
                                            <span className="font-medium block mb-1">Try:</span>
                                            "Luxury modern living room with floor to ceiling windows, sunset view"
                                        </div>
                                        <div className="bg-background p-3 rounded border shadow-sm">
                                            <span className="font-medium block mb-1">Try:</span>
                                            "Cozy suburban home exterior with autumn leaves, warm lighting"
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        {generatedImage && (
                            <div className="p-4 border-t bg-background/50 backdrop-blur-sm flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => setGeneratedImage(null)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                                <Button variant="secondary">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                                <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download High-Res
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

        </div>
    );
}
