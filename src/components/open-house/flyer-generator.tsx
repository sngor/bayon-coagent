'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileText, Download, Copy, Save, Check } from 'lucide-react';
import { generateOpenHouseFlyer } from '@/app/(app)/open-house/actions';
import { toast } from '@/hooks/use-toast';
import type { GenerateOpenHouseFlyerOutput } from '@/aws/bedrock/flows/generate-open-house-marketing';
import { marked } from 'marked';

interface FlyerGeneratorProps {
    sessionId: string;
}

/**
 * Component for generating open house flyers with AI
 * Validates Requirements: 16.2
 */
export function FlyerGenerator({ sessionId }: FlyerGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [flyer, setFlyer] = useState<GenerateOpenHouseFlyerOutput | null>(null);
    const [template, setTemplate] = useState<'modern' | 'classic' | 'luxury'>('modern');
    const [includeQRCode, setIncludeQRCode] = useState(true);
    const [includePropertyImages, setIncludePropertyImages] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateOpenHouseFlyer(sessionId, {
                template,
                includeQRCode,
                includePropertyImages,
            });

            if (result.success && result.flyer) {
                setFlyer(result.flyer);
                toast({
                    title: '✨ Flyer Generated!',
                    description: 'Your open house flyer is ready.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Generation Failed',
                    description: result.error || 'Failed to generate flyer',
                });
            }
        } catch (error) {
            console.error('Flyer generation error:', error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: 'An unexpected error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!flyer) return;
        // Combine all flyer content into a single text
        const fullContent = `${flyer.headline}\n\n${flyer.subheadline || ''}\n\n${flyer.marketingCopy}\n\nProperty Highlights:\n${flyer.propertyHighlights.join('\n')}\n\n${flyer.openHouseDetails.date} | ${flyer.openHouseDetails.time}\n${flyer.openHouseDetails.address}\n\n${flyer.callToAction}\n\nContact: ${flyer.agentInfo.name}\n${flyer.agentInfo.phone} | ${flyer.agentInfo.email}`;
        navigator.clipboard.writeText(fullContent);
        setCopied(true);
        toast({
            title: '✨ Copied!',
            description: 'Flyer content copied to clipboard',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!flyer) return;
        const fullContent = `${flyer.headline}\n\n${flyer.subheadline || ''}\n\n${flyer.marketingCopy}\n\nProperty Highlights:\n${flyer.propertyHighlights.join('\n')}\n\n${flyer.openHouseDetails.date} | ${flyer.openHouseDetails.time}\n${flyer.openHouseDetails.address}\n\n${flyer.callToAction}\n\nContact: ${flyer.agentInfo.name}\n${flyer.agentInfo.phone} | ${flyer.agentInfo.email}`;
        const blob = new Blob([fullContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `open-house-flyer-${sessionId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
            title: '✨ Downloaded!',
            description: 'Flyer saved to your device',
        });
    };

    return (
        <div className="space-y-6">
            {/* Configuration Options */}
            <div className="space-y-4">
                <div className="space-y-3">
                    <Label>Template Style</Label>
                    <RadioGroup value={template} onValueChange={(v) => setTemplate(v as any)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="modern" id="modern" />
                            <Label htmlFor="modern" className="font-normal cursor-pointer">
                                Modern - Clean, contemporary design with bold typography
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="classic" id="classic" />
                            <Label htmlFor="classic" className="font-normal cursor-pointer">
                                Classic - Traditional, elegant layout with serif fonts
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="luxury" id="luxury" />
                            <Label htmlFor="luxury" className="font-normal cursor-pointer">
                                Luxury - Premium, sophisticated design for high-end properties
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-3">
                    <Label>Include Elements</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="qr-code"
                                checked={includeQRCode}
                                onCheckedChange={(checked) => setIncludeQRCode(checked as boolean)}
                            />
                            <Label htmlFor="qr-code" className="font-normal cursor-pointer">
                                Include QR code for easy check-in
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="property-images"
                                checked={includePropertyImages}
                                onCheckedChange={(checked) =>
                                    setIncludePropertyImages(checked as boolean)
                                }
                            />
                            <Label htmlFor="property-images" className="font-normal cursor-pointer">
                                Include property images
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Flyer...
                    </>
                ) : (
                    <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Flyer
                    </>
                )}
            </Button>

            {/* Generated Flyer Preview */}
            {flyer && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Generated Flyer</h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopy}
                                    disabled={copied}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{flyer.headline}</h2>
                                {flyer.subheadline && (
                                    <p className="text-lg text-muted-foreground">{flyer.subheadline}</p>
                                )}
                            </div>

                            <div className="prose prose-sm max-w-none">
                                <p>{flyer.marketingCopy}</p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Property Highlights:</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {flyer.propertyHighlights.map((highlight, idx) => (
                                        <li key={idx}>{highlight}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border-t pt-4">
                                <p className="font-semibold">{flyer.openHouseDetails.date}</p>
                                <p>{flyer.openHouseDetails.time}</p>
                                <p className="text-sm text-muted-foreground">{flyer.openHouseDetails.address}</p>
                            </div>

                            <div className="border-t pt-4">
                                <p className="font-semibold text-primary">{flyer.callToAction}</p>
                            </div>

                            <div className="border-t pt-4 text-sm">
                                <p className="font-semibold">{flyer.agentInfo.name}</p>
                                {flyer.agentInfo.brokerage && <p>{flyer.agentInfo.brokerage}</p>}
                                <p>{flyer.agentInfo.phone} | {flyer.agentInfo.email}</p>
                            </div>

                            {flyer.qrCodeMessage && (
                                <div className="border-t pt-4 text-center">
                                    <p className="text-sm text-muted-foreground">{flyer.qrCodeMessage}</p>
                                </div>
                            )}
                        </div>

                        {flyer.designNotes && (
                            <div className="text-sm text-muted-foreground p-4 rounded-lg border bg-muted/30">
                                <p className="font-semibold mb-2">Design Notes:</p>
                                <p>{flyer.designNotes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
