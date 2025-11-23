'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';

export interface CapturedPhoto {
    id: string;
    blob: Blob;
    timestamp: number;
    metadata: {
        width: number;
        height: number;
        size: number;
    };
}

export interface QuickCaptureProps {
    userId: string;
    onCapture: (photo: CapturedPhoto) => void;
    onDescriptionGenerated?: (description: string) => void;
    className?: string;
}

export function QuickCapture({
    userId,
    onCapture,
    onDescriptionGenerated,
    className
}: QuickCaptureProps) {
    const [isActive, setIsActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Start camera stream
    const startCamera = useCallback(async () => {
        try {
            setError(null);

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }

            setIsActive(true);
        } catch (err: any) {
            console.error('Camera access error:', err);
            setError(
                err.name === 'NotAllowedError'
                    ? 'Camera access denied. Please allow camera permissions and try again.'
                    : err.name === 'NotFoundError'
                        ? 'No camera found on this device.'
                        : 'Failed to access camera. Please try again.'
            );
        }
    }, [facingMode]);

    // Stop camera stream
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsActive(false);
        setCapturedPhoto(null);
    }, [stream]);

    // Capture photo
    const capturePhoto = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsCapturing(true);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Failed to get canvas context');
            }

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create image blob'));
                    }
                }, 'image/jpeg', 0.9);
            });

            // Create photo object with metadata
            const photo: CapturedPhoto = {
                id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                blob,
                timestamp: Date.now(),
                metadata: {
                    width: canvas.width,
                    height: canvas.height,
                    size: blob.size
                }
            };

            setCapturedPhoto(photo);
            onCapture(photo);

            // Stop camera after capture
            stopCamera();

        } catch (err: any) {
            console.error('Photo capture error:', err);
            setError('Failed to capture photo. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    }, [onCapture, stopCamera]);

    // Switch camera (front/back)
    const switchCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        if (isActive) {
            stopCamera();
            // Restart with new facing mode
            setTimeout(startCamera, 100);
        }
    }, [isActive, stopCamera, startCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Render captured photo preview
    if (capturedPhoto) {
        const photoUrl = URL.createObjectURL(capturedPhoto.blob);

        return (
            <Card className={cn("w-full max-w-md mx-auto", className)}>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        <div className="relative">
                            <img
                                src={photoUrl}
                                alt="Captured photo"
                                className="w-full h-auto rounded-lg"
                                onLoad={() => URL.revokeObjectURL(photoUrl)}
                            />
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                {capturedPhoto.metadata.width} × {capturedPhoto.metadata.height}
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <p>Size: {(capturedPhoto.metadata.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p>Captured: {new Date(capturedPhoto.timestamp).toLocaleTimeString()}</p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => setCapturedPhoto(null)}
                                variant="outline"
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Retake
                            </Button>

                            <Button
                                onClick={startCamera}
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Take Another
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardContent className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {!isActive ? (
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                            <Camera className="w-12 h-12 text-muted-foreground" />
                        </div>

                        <div>
                            <h3 className="font-headline font-semibold mb-2">Quick Photo Capture</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Capture property photos with automatic AI descriptions
                            </p>
                        </div>

                        <Button
                            onClick={startCamera}
                            className={TOUCH_FRIENDLY_CLASSES.button}
                            disabled={!navigator.mediaDevices}
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            Start Camera
                        </Button>

                        {!navigator.mediaDevices && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Camera not available in this browser
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative bg-black rounded-lg overflow-hidden">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-auto"
                                style={{ maxHeight: '400px' }}
                            />

                            {/* Camera controls overlay */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
                                <Button
                                    onClick={switchCamera}
                                    variant="secondary"
                                    size="sm"
                                    className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>

                                <Button
                                    onClick={capturePhoto}
                                    disabled={isCapturing}
                                    className={cn(
                                        "w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black",
                                        "border-4 border-white shadow-lg",
                                        TOUCH_FRIENDLY_CLASSES.button
                                    )}
                                >
                                    {isCapturing ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <div className="w-8 h-8 bg-black rounded-full" />
                                    )}
                                </Button>

                                <Button
                                    onClick={stopCamera}
                                    variant="secondary"
                                    size="sm"
                                    className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <p className="text-xs text-center text-muted-foreground">
                            Tap the white button to capture • Tap rotate to switch camera
                        </p>
                    </div>
                )}

                {/* Hidden canvas for photo capture */}
                <canvas
                    ref={canvasRef}
                    className="hidden"
                />
            </CardContent>
        </Card>
    );
}