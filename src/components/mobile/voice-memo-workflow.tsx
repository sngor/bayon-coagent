'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { VoiceMemo, type AudioRecording } from './voice-memo';
import { ContentTypeSelector } from './content-type-selector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';
import { offlineSyncManager } from '@/lib/offline-sync-manager';
import type { VoiceToContentOutput } from '@/ai/schemas/voice-to-content-schemas';

export interface VoiceMemoWorkflowProps {
    userId: string;
    onContentSaved?: (content: VoiceToContentOutput) => void;
    className?: string;
}

type WorkflowStep = 'record' | 'transcribe' | 'generate' | 'complete';

export function VoiceMemoWorkflow({
    userId,
    onContentSaved,
    className
}: VoiceMemoWorkflowProps) {
    const [currentStep, setCurrentStep] = useState<WorkflowStep>('record');
    const [audioRecording, setAudioRecording] = useState<AudioRecording | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<VoiceToContentOutput | null>(null);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [isQueued, setIsQueued] = useState<boolean>(false);

    // Monitor connectivity changes
    useEffect(() => {
        const unsubscribe = offlineSyncManager.onConnectivityChange((online) => {
            setIsOnline(online);
        });

        return unsubscribe;
    }, []);

    // Handle recording completion
    const handleRecordingComplete = useCallback(async (recording: AudioRecording) => {
        setAudioRecording(recording);
        setCurrentStep('transcribe');
        setIsTranscribing(true);
        setError(null);
        setIsQueued(false);

        try {
            if (!isOnline) {
                // Queue for offline processing
                console.log('Offline: Queueing voice recording for later processing');

                // Convert blob to base64 for storage
                const arrayBuffer = await recording.blob.arrayBuffer();
                const base64Audio = Buffer.from(arrayBuffer).toString('base64');

                await offlineSyncManager.queueOperation({
                    type: 'voice',
                    data: {
                        audioData: base64Audio,
                        audioFormat: recording.blob.type.includes('webm') ? 'webm' : 'mp4',
                        duration: recording.duration,
                        timestamp: recording.timestamp,
                        userId
                    },
                    timestamp: Date.now()
                });

                setIsQueued(true);
                setIsTranscribing(false);
                setCurrentStep('complete');
                return;
            }

            // Online processing
            const { uploadVoiceRecordingAction } = await import('@/features/client-dashboards/actions/mobile-actions');

            // Prepare FormData for the action
            const actionFormData = new FormData();
            actionFormData.append('file', recording.blob);
            actionFormData.append('duration', recording.duration.toString());
            actionFormData.append('contentType', 'notes'); // Default content type
            actionFormData.append('context', 'Mobile voice memo');

            const result = await uploadVoiceRecordingAction(null, actionFormData);

            if (result.success && result.data?.transcript) {
                setTranscript(result.data.transcript);
                setCurrentStep('generate');
            } else {
                setError(result.message || 'Failed to transcribe audio');
                setCurrentStep('record');
            }
        } catch (err: any) {
            console.error('Transcription error:', err);
            setError(err.message || 'Failed to transcribe audio');
            setCurrentStep('record');
        } finally {
            setIsTranscribing(false);
        }
    }, [userId, isOnline]);

    // Handle content generation
    const handleContentGenerated = useCallback((content: VoiceToContentOutput) => {
        setGeneratedContent(content);
        setCurrentStep('complete');
    }, []);

    // Handle saving to library
    const handleSaveToLibrary = useCallback(async (content: VoiceToContentOutput) => {
        try {
            // Here you would typically save to DynamoDB via a server action
            // For now, we'll just call the callback
            if (onContentSaved) {
                await onContentSaved(content);
            }
        } catch (err: any) {
            console.error('Save to library error:', err);
            setError(err.message || 'Failed to save content');
        }
    }, [onContentSaved]);

    // Reset workflow
    const handleReset = useCallback(() => {
        setCurrentStep('record');
        setAudioRecording(null);
        setTranscript('');
        setGeneratedContent(null);
        setError(null);
        setIsTranscribing(false);
        setIsQueued(false);
    }, []);

    // Render transcription step
    const renderTranscriptionStep = () => (
        <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardContent className="p-6 text-center space-y-4">
                {/* Connectivity Status */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {isOnline ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-orange-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>

                <div>
                    <h3 className="font-headline font-semibold mb-2">
                        {isOnline ? 'Transcribing Audio' : 'Queueing for Processing'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {isOnline
                            ? 'Converting your voice memo to text...'
                            : 'Your recording will be processed when you\'re back online'
                        }
                    </p>
                </div>

                {audioRecording && (
                    <div className="text-xs text-muted-foreground">
                        Duration: {Math.floor(audioRecording.duration / 60)}:
                        {(audioRecording.duration % 60).toString().padStart(2, '0')}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    // Render error state
    const renderError = () => (
        <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-white" />
                </div>

                <div>
                    <h3 className="font-headline font-semibold mb-2">Something went wrong</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {error}
                    </p>
                </div>

                <Button
                    onClick={handleReset}
                    className={TOUCH_FRIENDLY_CLASSES.button}
                >
                    Try Again
                </Button>
            </CardContent>
        </Card>
    );

    // Render based on current step
    if (error && currentStep === 'record') {
        return renderError();
    }

    switch (currentStep) {
        case 'record':
            return (
                <VoiceMemo
                    userId={userId}
                    onRecordingComplete={handleRecordingComplete}
                    className={className}
                />
            );

        case 'transcribe':
            return renderTranscriptionStep();

        case 'generate':
            return (
                <ContentTypeSelector
                    transcript={transcript}
                    onContentGenerated={handleContentGenerated}
                    onSaveToLibrary={handleSaveToLibrary}
                    className={className}
                />
            );

        case 'complete':
            return (
                <Card className={cn("w-full max-w-md mx-auto", className)}>
                    <CardContent className="p-6 text-center space-y-4">
                        {/* Connectivity Status */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {isOnline ? (
                                <Wifi className="w-4 h-4 text-green-500" />
                            ) : (
                                <WifiOff className="w-4 h-4 text-orange-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        <div className={cn(
                            "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
                            isQueued ? "bg-orange-500" : "bg-green-500"
                        )}>
                            {isQueued ? (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>

                        <div>
                            <h3 className="font-headline font-semibold mb-2">
                                {isQueued ? 'Recording Queued!' : 'Content Generated!'}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {isQueued
                                    ? 'Your voice memo is queued for processing when you\'re back online.'
                                    : `Your voice memo has been converted to ${generatedContent?.contentType} content.`
                                }
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                Create Another
                            </Button>

                            {generatedContent && (
                                <div className="text-xs text-muted-foreground">
                                    {generatedContent.wordCount} words • {generatedContent.estimatedReadTime} min read
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );

        default:
            return null;
    }
}

// Progress indicator component
export function WorkflowProgress({ currentStep }: { currentStep: WorkflowStep }) {
    const steps = [
        { key: 'record', label: 'Record' },
        { key: 'transcribe', label: 'Transcribe' },
        { key: 'generate', label: 'Generate' },
        { key: 'complete', label: 'Complete' }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
        <div className="flex items-center justify-center space-x-2 mb-6">
            {steps.map((step, index) => (
                <React.Fragment key={step.key}>
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        index <= currentIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                    )}>
                        {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                        <div className={cn(
                            "w-8 h-0.5",
                            index < currentIndex ? "bg-primary" : "bg-muted"
                        )} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}