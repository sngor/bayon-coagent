'use client';

/**
 * Vision Interface Component
 * 
 * Vision analysis interface for the Bayon AI Assistant.
 * Features:
 * - Image upload with preview
 * - Camera capture for mobile devices
 * - Question input field
 * - Real-time streaming analysis
 * - Visual analysis results display
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/common';
import {
    Upload,
    Camera,
    X,
    Loader2,
    AlertCircle,
    Image as ImageIcon,
    Sparkles,
} from 'lucide-react';
import { streamVisionQuery } from '@/features/intelligence/actions/bayon-vision-actions';
import { VisionAnalysisResults } from './vision-analysis-results';

/**
 * Vision analysis result type
 */
export interface VisionAnalysisResult {
    analysisId: string;
    visualElements: {
        materials: string[];
        colors: string[];
        lighting: 'natural' | 'artificial' | 'mixed';
        size: 'small' | 'medium' | 'large';
        layout: string;
        notableFeatures?: string[];
    };
    recommendations: Array<{
        action: string;
        rationale: string;
        estimatedCost: 'low' | 'medium' | 'high';
        priority: 'high' | 'medium' | 'low';
        expectedImpact?: string;
    }>;
    marketAlignment: string;
    overallAssessment: string;
    answer: string;
}

/**
 * Vision Interface Props
 */
export interface VisionInterfaceProps {
    className?: string;
    onAnalysisComplete?: (result: VisionAnalysisResult) => void;
    maxImageSize?: number; // in MB
}

/**
 * Vision Interface Component
 * 
 * Requirements:
 * - 6.1: Image upload with preview, camera capture for mobile, question input field
 */
export function VisionInterface({
    className,
    onAnalysisComplete,
    maxImageSize = 5,
}: VisionInterfaceProps) {
    // Image state
    const [imageData, setImageData] = useState<string>('');
    const [imageFormat, setImageFormat] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Form state
    const [question, setQuestion] = useState('');
    const [propertyType, setPropertyType] = useState('');

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState('');
    const [progressStep, setProgressStep] = useState(0);
    const [progressTotal, setProgressTotal] = useState(4);
    const [error, setError] = useState('');
    const [result, setResult] = useState<VisionAnalysisResult | null>(null);

    // Camera state
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    /**
     * Convert file to base64
     */
    const fileToBase64 = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                // Remove data URL prefix
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }, []);

    /**
     * Handle file selection
     */
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxImageSize) {
            setError(`Image size must be less than ${maxImageSize}MB`);
            return;
        }

        try {
            setError('');
            const base64Data = await fileToBase64(file);
            const format = file.type.split('/')[1];

            setImageData(base64Data);
            setImageFormat(format);
            setImagePreview(URL.createObjectURL(file));
            setImageFile(file);
        } catch (err) {
            console.error('File processing error:', err);
            setError('Failed to process image');
        }
    }, [fileToBase64, maxImageSize]);

    /**
     * Start camera
     */
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
                setError('');
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Failed to access camera. Please check permissions.');
        }
    }, []);

    /**
     * Stop camera
     */
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }, []);

    /**
     * Capture image from camera
     */
    const captureImage = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context?.drawImage(video, 0, 0);

            // Get base64 data
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const base64Data = dataUrl.split(',')[1];

            setImageData(base64Data);
            setImageFormat('jpeg');
            setImagePreview(dataUrl);

            // Stop camera
            stopCamera();
        }
    }, [stopCamera]);

    /**
     * Clear image
     */
    const clearImage = useCallback(() => {
        setImageData('');
        setImageFormat('');
        setImagePreview('');
        setImageFile(null);
        setResult(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    /**
     * Handle analysis
     */
    const handleAnalyze = useCallback(async () => {
        if (!imageData || !question.trim()) {
            setError('Please provide an image and a question');
            return;
        }

        setIsAnalyzing(true);
        setError('');
        setResult(null);
        setProgress('Starting analysis...');
        setProgressStep(0);

        const tempResult: Partial<VisionAnalysisResult> = {
            visualElements: undefined,
            recommendations: [],
            marketAlignment: '',
            overallAssessment: '',
            answer: '',
        };

        try {
            const response = await streamVisionQuery(
                imageData,
                imageFormat,
                question,
                propertyType || undefined
            );

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const event = JSON.parse(line);

                        switch (event.type) {
                            case 'progress':
                                setProgress(event.message);
                                setProgressStep(event.step);
                                setProgressTotal(event.totalSteps);
                                break;

                            case 'visual_elements':
                                tempResult.visualElements = event.data;
                                setResult({ ...tempResult } as VisionAnalysisResult);
                                break;

                            case 'recommendation':
                                tempResult.recommendations = [
                                    ...(tempResult.recommendations || []),
                                    event.data,
                                ];
                                setResult({ ...tempResult } as VisionAnalysisResult);
                                break;

                            case 'market_alignment':
                                tempResult.marketAlignment = event.data;
                                setResult({ ...tempResult } as VisionAnalysisResult);
                                break;

                            case 'overall_assessment':
                                tempResult.overallAssessment = event.data;
                                setResult({ ...tempResult } as VisionAnalysisResult);
                                break;

                            case 'answer':
                                tempResult.answer = event.data;
                                setResult({ ...tempResult } as VisionAnalysisResult);
                                break;

                            case 'complete':
                                tempResult.analysisId = event.data.analysisId;
                                const finalResult = tempResult as VisionAnalysisResult;
                                setResult(finalResult);
                                setIsAnalyzing(false);
                                setProgress('Analysis complete!');

                                if (onAnalysisComplete) {
                                    onAnalysisComplete(finalResult);
                                }
                                break;

                            case 'error':
                                setError(event.error);
                                setIsAnalyzing(false);
                                break;
                        }
                    } catch (parseError) {
                        console.error('Failed to parse event:', parseError);
                    }
                }
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err instanceof Error ? err.message : 'Failed to analyze image');
            setIsAnalyzing(false);
        }
    }, [imageData, imageFormat, question, propertyType, onAnalysisComplete]);

    return (
        <div className={cn('space-y-6', className)}>
            {/* Image Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Property Image
                    </CardTitle>
                    <CardDescription>
                        Upload a property image or capture one with your camera
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Image Preview */}
                    {imagePreview ? (
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Property preview"
                                className="w-full h-auto max-h-[400px] object-contain rounded-lg border"
                            />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={clearImage}
                                disabled={isAnalyzing}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : isCameraActive ? (
                        <div className="relative">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-auto max-h-[400px] object-contain rounded-lg border"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="flex gap-2 mt-4">
                                <Button onClick={captureImage} className="flex-1">
                                    <Camera className="w-4 h-4 mr-2" />
                                    Capture
                                </Button>
                                <Button variant="outline" onClick={stopCamera}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Upload Button */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isAnalyzing}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Image
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={startCamera}
                                    disabled={isAnalyzing}
                                >
                                    <Camera className="w-4 h-4 mr-2" />
                                    Use Camera
                                </Button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                aria-label="Upload property image"
                            />

                            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">
                                    Upload an image or use your camera to get started
                                </p>
                                <p className="text-xs mt-2">
                                    Maximum file size: {maxImageSize}MB
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Question Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Your Question
                    </CardTitle>
                    <CardDescription>
                        What would you like to know about this property?
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="question">Question</Label>
                        <Textarea
                            id="question"
                            placeholder="e.g., What improvements would increase the value of this property?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={isAnalyzing}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="propertyType">Property Type (Optional)</Label>
                        <Select
                            value={propertyType}
                            onValueChange={setPropertyType}
                            disabled={isAnalyzing}
                        >
                            <SelectTrigger id="propertyType">
                                <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single-family">Single Family</SelectItem>
                                <SelectItem value="condo">Condo</SelectItem>
                                <SelectItem value="townhouse">Townhouse</SelectItem>
                                <SelectItem value="multi-family">Multi-Family</SelectItem>
                                <SelectItem value="commercial">Commercial</SelectItem>
                                <SelectItem value="land">Land</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleAnalyze}
                        disabled={!imageData || !question.trim() || isAnalyzing}
                        className="w-full"
                        size="lg"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Analyze Property
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Progress */}
            {isAnalyzing && progress && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{progress}</span>
                                <span className="text-muted-foreground">
                                    {progressStep}/{progressTotal}
                                </span>
                            </div>
                            <Progress value={(progressStep / progressTotal) * 100} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Results */}
            {result && (
                <VisionAnalysisResults result={result} />
            )}
        </div>
    );
}
