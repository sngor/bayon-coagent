'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    compressImage,
    getOptimalImageFormat,
    ImageCompressionOptions,
    CompressedImage,
} from '@/lib/mobile/performance';
import { Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/common';

export interface ImageCompressorProps {
    onCompress?: (result: CompressedImage) => void;
    className?: string;
}

/**
 * Image compression component with WebP conversion
 * Implements Requirements 7.3: Image compression and WebP conversion
 */
export function ImageCompressor({ onCompress, className }: ImageCompressorProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [result, setResult] = useState<CompressedImage | null>(null);
    const [quality, setQuality] = useState(85);
    const [format, setFormat] = useState<'webp' | 'jpeg' | 'png'>(getOptimalImageFormat());
    const [maxWidth, setMaxWidth] = useState(1920);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleCompress = async () => {
        if (!file) return;

        setIsCompressing(true);
        try {
            const options: ImageCompressionOptions = {
                maxWidth,
                maxHeight: Math.floor(maxWidth * 0.75), // 4:3 aspect ratio
                quality: quality / 100,
                outputFormat: format,
            };

            const compressed = await compressImage(file, options);
            setResult(compressed);
            onCompress?.(compressed);
        } catch (error) {
            console.error('Compression failed:', error);
        } finally {
            setIsCompressing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const link = document.createElement('a');
        link.href = result.url;
        link.download = `compressed-${Date.now()}.${result.format}`;
        link.click();
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Card className={cn('p-6 space-y-6', className)}>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Image Compression</h3>
                <p className="text-sm text-muted-foreground">
                    Compress and optimize images for mobile devices
                </p>
            </div>

            <div className="space-y-4">
                {/* File Input */}
                <div className="space-y-2">
                    <Label htmlFor="image-file">Select Image</Label>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('image-file')?.click()}
                        >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            {file ? file.name : 'Choose File'}
                        </Button>
                        <input
                            id="image-file"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            aria-label="Select image file"
                        />
                    </div>
                </div>

                {/* Quality Slider */}
                <div className="space-y-2">
                    <Label>Quality: {quality}%</Label>
                    <Slider
                        value={[quality]}
                        onValueChange={(value) => setQuality(value[0])}
                        min={10}
                        max={100}
                        step={5}
                        disabled={!file}
                    />
                </div>

                {/* Format Select */}
                <div className="space-y-2">
                    <Label>Output Format</Label>
                    <Select value={format} onValueChange={(v) => setFormat(v as any)} disabled={!file}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="webp">WebP (Recommended)</SelectItem>
                            <SelectItem value="jpeg">JPEG</SelectItem>
                            <SelectItem value="png">PNG</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Max Width Slider */}
                <div className="space-y-2">
                    <Label>Max Width: {maxWidth}px</Label>
                    <Slider
                        value={[maxWidth]}
                        onValueChange={(value) => setMaxWidth(value[0])}
                        min={320}
                        max={3840}
                        step={160}
                        disabled={!file}
                    />
                </div>

                {/* Compress Button */}
                <Button
                    onClick={handleCompress}
                    disabled={!file || isCompressing}
                    className="w-full"
                >
                    {isCompressing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Compressing...
                        </>
                    ) : (
                        'Compress Image'
                    )}
                </Button>

                {/* Results */}
                {result && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Original Size</p>
                                <p className="font-medium">{formatBytes(result.originalSize)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Compressed Size</p>
                                <p className="font-medium">{formatBytes(result.compressedSize)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Compression Ratio</p>
                                <p className="font-medium">{result.compressionRatio.toFixed(2)}x</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Dimensions</p>
                                <p className="font-medium">
                                    {result.width} × {result.height}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleDownload} className="flex-1">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </div>

                        {/* Preview */}
                        <div className="space-y-2">
                            <Label>Preview</Label>
                            <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                                <img
                                    src={result.url}
                                    alt="Compressed preview"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
