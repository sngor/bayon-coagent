'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';

export interface AudioRecording {
    id: string;
    blob: Blob;
    duration: number;
    timestamp: number;
}

export interface GeneratedContent {
    transcript: string;
    contentType: "blog" | "social" | "market-update" | "notes";
    content: string;
}

export interface VoiceMemoProps {
    userId: string;
    onRecordingComplete: (audio: AudioRecording) => void;
    onContentGenerated?: (content: GeneratedContent) => void;
    className?: string;
}

export function VoiceMemo({
    userId,
    onRecordingComplete,
    onContentGenerated,
    className
}: VoiceMemoProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Format time display
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Start recording
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

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: mediaRecorder.mimeType
                });
                setAudioBlob(blob);

                // Create audio recording object
                const recording: AudioRecording = {
                    id: `voice-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    blob,
                    duration: recordingTime,
                    timestamp: Date.now()
                };

                onRecordingComplete(recording);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err: any) {
            console.error('Recording error:', err);
            setError(
                err.name === 'NotAllowedError'
                    ? 'Microphone access denied. Please allow microphone permissions and try again.'
                    : err.name === 'NotFoundError'
                        ? 'No microphone found on this device.'
                        : 'Failed to access microphone. Please try again.'
            );
        }
    }, [recordingTime, onRecordingComplete]);

    // Pause/resume recording
    const togglePauseRecording = useCallback(() => {
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

    // Stop recording
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
    }, [isRecording]);

    // Play/pause audio
    const togglePlayback = useCallback(() => {
        if (!audioBlob || !audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    }, [audioBlob, isPlaying]);

    // Delete recording
    const deleteRecording = useCallback(() => {
        setAudioBlob(null);
        setRecordingTime(0);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, []);

    // Reset to initial state
    const reset = useCallback(() => {
        stopRecording();
        deleteRecording();
        setError(null);
        setIsProcessing(false);
    }, [stopRecording, deleteRecording]);

    // Monitor connectivity
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Handle audio playback events
    useEffect(() => {
        if (!audioBlob) return;

        const audio = new Audio(URL.createObjectURL(audioBlob));
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
            setError('Failed to play audio recording');
            setIsPlaying(false);
        };

        return () => {
            URL.revokeObjectURL(audio.src);
        };
    }, [audioBlob]);

    return (
        <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardContent className="p-4">
                {/* Connectivity Status */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi className="w-4 h-4 text-green-500" />
                        ) : (
                            <WifiOff className="w-4 h-4 text-orange-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                            {isOnline ? 'Online' : 'Offline - recordings will be queued'}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {!isRecording && !audioBlob ? (
                    // Initial state - ready to record
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                            <Mic className="w-12 h-12 text-muted-foreground" />
                        </div>

                        <div>
                            <h3 className="font-headline font-semibold mb-2">Voice Memo</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Record voice memos that are automatically transcribed and converted to content
                            </p>
                        </div>

                        <Button
                            onClick={startRecording}
                            className={cn(TOUCH_FRIENDLY_CLASSES.button, "bg-red-500 hover:bg-red-600")}
                            disabled={!navigator.mediaDevices || isProcessing}
                        >
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording
                        </Button>

                        {!navigator.mediaDevices && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Microphone not available in this browser
                            </p>
                        )}
                    </div>
                ) : isRecording ? (
                    // Recording state
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 mx-auto bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <Mic className="w-12 h-12 text-white" />
                        </div>

                        <div>
                            <div className="text-2xl font-mono font-bold text-red-500">
                                {formatTime(recordingTime)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {isPaused ? 'Recording paused' : 'Recording...'}
                            </p>
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button
                                onClick={togglePauseRecording}
                                variant="outline"
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                {isPaused ? (
                                    <Play className="w-4 h-4" />
                                ) : (
                                    <Pause className="w-4 h-4" />
                                )}
                            </Button>

                            <Button
                                onClick={stopRecording}
                                className={cn(TOUCH_FRIENDLY_CLASSES.button, "bg-red-500 hover:bg-red-600")}
                            >
                                <Square className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Playback state - recording completed
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-3">
                                <Mic className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-headline font-semibold">Recording Complete</h3>
                            <p className="text-sm text-muted-foreground">
                                Duration: {formatTime(recordingTime)}
                            </p>
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button
                                onClick={togglePlayback}
                                variant="outline"
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                {isPlaying ? (
                                    <Pause className="w-4 h-4" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                            </Button>

                            <Button
                                onClick={deleteRecording}
                                variant="outline"
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <Button
                                onClick={reset}
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                <Mic className="w-4 h-4 mr-2" />
                                New Recording
                            </Button>
                        </div>

                        {isProcessing && (
                            <div className="text-center">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Processing recording...
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}