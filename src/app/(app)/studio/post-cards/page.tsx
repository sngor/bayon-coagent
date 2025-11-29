'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Download, Share2, Wand2, RefreshCw, ImagePlus, Trash2 } from 'lucide-react';
import { generatePostCardAction } from '@/app/post-card-actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageConfig } from '@/components/dashboard-quick-actions';
import { CardTypeSelector } from './card-type-selector';
import { StyleSelector } from './style-selector';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
                toast({
                    title: 'Generation Failed',
                    description: result.error || 'Failed to generate post card. Please try again.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Generation error:', error);
            toast({
                title: 'System Error',
                description: 'An unexpected error occurred. Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;

        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `bayon-postcard-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">Post Card Studio</h1>
                    <p className="text-muted-foreground mt-1">
                        Design stunning, personalized real estate post cards in seconds with AI.
                    </p>
                </div>
                {(() => {
                    const pageConfig = getPageConfig('/studio/post-cards');
                    return pageConfig ? <FavoritesButton item={pageConfig} /> : null;
                })()}
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

                            {/* Card Type Selection */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Card Type</Label>
                                <CardTypeSelector value={cardType} onChange={setCardType} />
                            </div>

                            <Separator />

                            {/* Recipient & Style */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="recipient">Recipient Name (Optional)</Label>
                                    <Input
                                        id="recipient"
                                        placeholder="e.g. The Smith Family"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        className="bg-muted/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="style">Visual Style</Label>
                                    <Input
                                        id="style"
                                        placeholder="e.g. Modern, Classic, Watercolor..."
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        className="bg-muted/30"
                                    />
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
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="prompt" className="text-base font-semibold">Description</Label>
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
                                <p className="text-xs text-muted-foreground">
                                    Tip: Be specific about lighting, mood, and architectural details for best results.
                                </p>
                            </div>
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
                                <div className="text-center space-y-6 p-8 animate-in fade-in duration-500">
                                    <div className="relative mx-auto h-24 w-24">
                                        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                        <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold">Creating your design...</h3>
                                        <p className="text-muted-foreground max-w-xs mx-auto">
                                            AI is composing the image, adjusting lighting, and applying styles. This usually takes about 10-15 seconds.
                                        </p>
                                    </div>
                                </div>
                            ) : generatedImage ? (
                                <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-neutral-900/5">
                                    <img
                                        src={generatedImage}
                                        alt="Generated Post Card"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="text-center p-12 max-w-md mx-auto">
                                    <div className="bg-background rounded-full p-6 w-24 h-24 mx-auto mb-6 shadow-sm flex items-center justify-center border">
                                        <Sparkles className="h-10 w-10 text-primary/40" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Ready to Create?</h3>
                                    <p className="text-muted-foreground mb-8">
                                        Select a card type, choose a style, and describe your vision to generate a unique, professional post card.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 text-sm text-left">
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
