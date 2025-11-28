'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Download, Share2 } from 'lucide-react';
import { generateHolidayCardAction } from '@/app/holiday-card-actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function HolidayCardsPage() {
    const { toast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [recipient, setRecipient] = useState('');
    const [style, setStyle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) {
            toast({
                title: 'Error',
                description: 'Please enter a description for your card',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            const result = await generateHolidayCardAction({
                prompt,
                recipient,
                style,
            });

            if (result.success && result.imageUrl) {
                setGeneratedImage(result.imageUrl);
                toast({
                    title: 'Success',
                    description: 'Holiday card generated successfully!',
                    variant: 'default',
                    className: "bg-green-600 text-white border-none",
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to generate holiday card',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Generation error:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
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
        link.download = 'holiday-card.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                    <h1 className="text-3xl font-bold font-headline">Holiday Card Studio</h1>
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full text-xs font-semibold text-purple-600 dark:text-purple-400">
                        Gemini 3.0 Pro Image
                    </span>
                </div>
                <p className="text-muted-foreground">
                    Create personalized holiday cards with state-of-the-art AI • Up to 4K resolution • Advanced thinking mode
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Card Details</CardTitle>
                        <CardDescription>
                            Describe the perfect holiday card you want to create
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipient">Recipient (Optional)</Label>
                            <Input
                                id="recipient"
                                placeholder="e.g. The Smith Family"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="style">Style (Optional)</Label>
                            <Input
                                id="style"
                                placeholder="e.g. Watercolor, Minimalist, 3D Render"
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prompt">Description</Label>
                            <Textarea
                                id="prompt"
                                placeholder="Describe the scene, e.g. A cozy living room with a fireplace and a Christmas tree..."
                                className="h-32"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Card
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center min-h-[300px] bg-muted/20 rounded-lg m-4 border-2 border-dashed border-muted">
                            {isGenerating ? (
                                <div className="text-center space-y-4">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    <p className="text-muted-foreground">Creating your masterpiece...</p>
                                </div>
                            ) : generatedImage ? (
                                <div className="relative w-full h-full min-h-[300px]">
                                    <Image
                                        src={generatedImage}
                                        alt="Generated Holiday Card"
                                        fill
                                        className="object-contain rounded-md"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Your generated card will appear here</p>
                                </div>
                            )}
                        </CardContent>
                        {generatedImage && (
                            <div className="p-4 border-t flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                                <Button variant="outline" className="flex-1">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
