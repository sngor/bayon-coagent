'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Mic, Type, X, RotateCcw, Square, Play, Pause, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/common';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';

export type CaptureMode = 'camera' | 'voice' | 'text';

export interface CaptureData {
    type: 'photo' | 'voice' | 'text';
    content: string | File | Blob;
    location?: GeolocationCoordinates;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface QuickCaptureInterfaceProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCapture: (data: CaptureData) => Promise<void>;
    defaultMode?: CaptureMode;
    enableLocation?: boolean;
    className?: string;
}

export function QuickCaptureInterface({
    open,
    onOpenChange,
    onCapture,
    defaultMode = 'camera',
    enableLocation = true,
    className
}: QuickCaptureInterfaceProps) {
    const [mode, setMode] = useState<CaptureMode>(defaultMode);
    const [isCapturing, setIsCapturing] = useState(false);
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

    // Get location if enabled
    useEffect(() => {
        if (open && enableLocation && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => setLocation(position.coords),
                (error) => console.warn('Location access denied:', error)
            );
        }
    }, [open, enableLocation]);

    // Reset state when sheet closes
    useEffect(() => {
        if (!open) {
            setMode(defaultMode);
            setIsCapturing(false);
        }
    }, [open, defaultMode]);

    const handleCapture = useCallback(async (data: Omit<CaptureData, 'location' | 'timestamp'>) => {
        setIsCapturing(true);
        try {
            await onCapture({
                ...data,
                location: location || undefined,
                timestamp: Date.now()
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Capture error:', error);
        } finally {
            setIsCapturing(false);
        }
    }, [location, onCapture, onOpenChange]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className={cn(
                    "h-[85vh] max-h-[85vh] rounded-t-3xl p-0 overflow-hidden",
                    className
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <SheetHeader className="px-6 pt-6 pb-4 border-b">
                        <SheetTitle>Quick Capture</SheetTitle>
                        <SheetDescription>
                            Capture content using camera, voice, or text
                        </SheetDescription>
                    </SheetHeader>

                    {/* Mode Switcher */}
                    <div className="flex items-center justify-center gap-2 px-6 py-4 border-b bg-muted/30">
                        <ModeButton
                            mode="camera"
                            currentMode={mode}
                            onClick={() => setMode('camera')}
                            icon={Camera}
                            label="Camera"
                        />
                        <ModeButton
                            mode="voice"
                            currentMode={mode}
                            onClick={() => setMode('voice')}
                            icon={Mic}
                            label="Voice"
                        />
                        <ModeButton
                            mode="text"
                            currentMode={mode}
                            onClick={() => setMode('text')}
                            icon={Type}
                            label="Text"
                        />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        {mode === 'camera' && (
                            <CameraCapture
                                onCapture={handleCapture}
                                isCapturing={isCapturing}
                            />
                        )}
                        {mode === 'voice' && (
                            <VoiceCapture
                                onCapture={handleCapture}
                                isCapturing={isCapturing}
                            />
                        )}
                        {mode === 'text' && (
                            <TextCapture
                                onCapture={handleCapture}
                                isCapturing={isCapturing}
                            />
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Mode Button Component
interface ModeButtonProps {
    mode: CaptureMode;
    currentMode: CaptureMode;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}

function ModeButton({ mode, currentMode, onClick, icon: Icon, label }: ModeButtonProps) {
    const isActive = mode === currentMode;

    return (
        <Button
            onClick={onClick}
            variant={isActive ? 'default' : 'outline'}
            className={cn(
                TOUCH_FRIENDLY_CLASSES.button,
                "flex-1 flex flex-col items-center gap-1 py-3 transition-all",
                isActive && "shadow-md scale-105"
            )}
        >
            <Icon className={cn("w-5 h-5", isActive && "animate-in zoom-in-50 duration-200")} />
            <span className="text-xs font-medium">{label}</span>
        </Button>
    );
}

// Camera Capture Component
interface CaptureComponentProps {
    onCapture: (data: Omit<CaptureData, 'location' | 'timestamp'>) => Promise<void>;
    isCapturing: boolean;
}

function CameraCapture({ onCapture, isCapturing }: CaptureComponentProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
        } catch (err: any) {
            setError(
                err.name === 'NotAllowedError'
                    ? 'Camera access denied. Please allow camera permissions.'
                    : 'Failed to access camera. Please try again.'
            );
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const capturePhoto = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to create image blob'));
            }, 'image/jpeg', 0.9);
        });

        setCapturedPhoto(blob);
        stopCamera();
    }, [stopCamera]);

    const handleSubmit = useCallback(async () => {
        if (!capturedPhoto) return;

        const file = new File([capturedPhoto], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        await onCapture({
            type: 'photo',
            content: file,
            metadata: {
                size: capturedPhoto.size,
                facingMode
            }
        });
    }, [capturedPhoto, facingMode, onCapture]);

    const switchCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        if (stream) {
            stopCamera();
            setTimeout(startCamera, 100);
        }
    }, [stream, stopCamera, startCamera]);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    if (capturedPhoto) {
        const photoUrl = URL.createObjectURL(capturedPhoto);

        return (
            <div className="p-6 space-y-4">
                <img
                    src={photoUrl}
                    alt="Captured"
                    className="w-full rounded-lg"
                    onLoad={() => URL.revokeObjectURL(photoUrl)}
                />
                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            setCapturedPhoto(null);
                            startCamera();
                        }}
                        variant="outline"
                        className={cn(TOUCH_FRIENDLY_CLASSES.button, "flex-1")}
                        disabled={isCapturing}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Retake
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className={cn(TOUCH_FRIENDLY_CLASSES.button, "flex-1")}
                        disabled={isCapturing}
                    >
                        {isCapturing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Submit
                    </Button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
                <Button onClick={startCamera} className={TOUCH_FRIENDLY_CLASSES.button}>
                    Try Again
                </Button>
            </div>
        );
    }

    if (!stream) {
        return (
            <div className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                    Capture property photos with automatic AI analysis
                </p>
                <Button onClick={startCamera} className={TOUCH_FRIENDLY_CLASSES.button}>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                </Button>
            </div>
        );
    }

    return (
        <div className="relative">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto bg-black"
                style={{ maxHeight: '60vh' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 px-4">
                <Button
                    onClick={switchCamera}
                    variant="secondary"
                    size="sm"
                    className="bg-black/50 hover:bg-black/70 text-white border-white/20 backdrop-blur-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                    onClick={capturePhoto}
                    className={cn(
                        "w-16 h-16 rounded-full bg-background hover:bg-accent text-foreground border-4 border-background shadow-lg",
                        TOUCH_FRIENDLY_CLASSES.button
                    )}
                >
                    <div className="w-8 h-8 bg-foreground rounded-full" />
                </Button>
            </div>
        </div>
    );
}

// Voice Capture Component
function VoiceCapture({ onCapture, isCapturing }: CaptureComponentProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;
            chunksRef.current = [];

            // Set up audio visualization
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const updateAudioLevel = () => {
                if (!analyserRef.current) return;

                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(average / 255);

                animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
            };
            updateAudioLevel();

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
                setAudioBlob(blob);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(1000);
            setIsRecording(true);
            setRecordingTime(0);

            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err: any) {
            setError(
                err.name === 'NotAllowedError'
                    ? 'Microphone access denied. Please allow microphone permissions.'
                    : 'Failed to access microphone. Please try again.'
            );
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setAudioLevel(0);
    }, [isRecording]);

    const togglePause = useCallback(() => {
        if (!mediaRecorderRef.current) return;

        if (isPaused) {
            mediaRecorderRef.current.resume();
            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            setIsPaused(false);
        } else {
            mediaRecorderRef.current.pause();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setIsPaused(true);
        }
    }, [isPaused]);

    const handleSubmit = useCallback(async () => {
        if (!audioBlob) return;

        await onCapture({
            type: 'voice',
            content: audioBlob,
            metadata: {
                duration: recordingTime,
                size: audioBlob.size
            }
        });
    }, [audioBlob, recordingTime, onCapture]);

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    if (audioBlob) {
        return (
            <div className="p-6 space-y-4">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-3">
                        <Mic className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold">Recording Complete</h3>
                    <p className="text-sm text-muted-foreground">
                        Duration: {formatTime(recordingTime)}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            setAudioBlob(null);
                            setRecordingTime(0);
                        }}
                        variant="outline"
                        className={cn(TOUCH_FRIENDLY_CLASSES.button, "flex-1")}
                        disabled={isCapturing}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Discard
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className={cn(TOUCH_FRIENDLY_CLASSES.button, "flex-1")}
                        disabled={isCapturing}
                    >
                        {isCapturing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Submit
                    </Button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
                <Button onClick={startRecording} className={TOUCH_FRIENDLY_CLASSES.button}>
                    Try Again
                </Button>
            </div>
        );
    }

    if (!isRecording) {
        return (
            <div className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Mic className="w-12 h-12 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                    Record voice notes with automatic transcription
                </p>
                <Button onClick={startRecording} className={cn(TOUCH_FRIENDLY_CLASSES.button, "bg-red-500 hover:bg-red-600")}>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 text-center space-y-6">
            <div className="relative w-32 h-32 mx-auto">
                <div
                    className={cn(
                        "w-full h-full bg-red-500 rounded-full flex items-center justify-center transition-transform",
                        !isPaused && "animate-pulse"
                    )}
                    style={{
                        transform: `scale(${1 + audioLevel * 0.3})`
                    }}
                >
                    <Mic className="w-16 h-16 text-white" />
                </div>
            </div>

            {/* Waveform Visualization */}
            <div className="flex items-center justify-center gap-1 h-16">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="w-1 bg-red-500 rounded-full transition-all duration-100"
                        style={{
                            height: `${Math.max(8, audioLevel * 64 * (0.5 + Math.random() * 0.5))}px`
                        }}
                    />
                ))}
            </div>

            <div>
                <div className="text-3xl font-mono font-bold text-red-500">
                    {formatTime(recordingTime)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {isPaused ? 'Recording paused' : 'Recording...'}
                </p>
            </div>

            <div className="flex justify-center gap-2">
                <Button
                    onClick={togglePause}
                    variant="outline"
                    className={TOUCH_FRIENDLY_CLASSES.button}
                >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button
                    onClick={stopRecording}
                    className={cn(TOUCH_FRIENDLY_CLASSES.button, "bg-red-500 hover:bg-red-600")}
                >
                    <Square className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// Text Capture Component
function TextCapture({ onCapture, isCapturing }: CaptureComponentProps) {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Auto-focus textarea when component mounts
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!text.trim()) return;

        await onCapture({
            type: 'text',
            content: text.trim(),
            metadata: {
                length: text.length
            }
        });
    }, [text, onCapture]);

    return (
        <div className="p-6 space-y-4 h-full flex flex-col">
            <div className="flex-1">
                <Textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your content here... (property details, notes, ideas)"
                    className={cn(
                        TOUCH_FRIENDLY_CLASSES.input,
                        "min-h-[300px] resize-none text-base"
                    )}
                    disabled={isCapturing}
                />
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{text.length} characters</span>
                <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>

            <Button
                onClick={handleSubmit}
                disabled={!text.trim() || isCapturing}
                className={cn(TOUCH_FRIENDLY_CLASSES.button, "w-full")}
            >
                {isCapturing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Send className="w-4 h-4 mr-2" />
                )}
                Submit
            </Button>
        </div>
    );
}
