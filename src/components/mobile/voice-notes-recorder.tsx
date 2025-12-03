'use client';

/**
 * Voice Notes Recorder Component
 * 
 * Enhanced voice recording component with:
 * - MediaRecorder API integration
 * - Property attachment system
 * - Photo capture integration
 * - Cloud sync support
 * - Offline queue support
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Camera, MapPin, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';
import { deviceAPI } from '@/lib/mobile/device-apis';

export interface VoiceNoteData {
    id: string;
    audioBlob: Blob;
    duration: number;
    timestamp: number;
    propertyId?: string;
    propertyAddress?: string;
    photos?: File[];
    location?: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
    notes?: string;
}

export interface VoiceNotesRecorderProps {
    userId: string;
    propertyId?: string;
    propertyAddress?: string;
    onSave: (note: VoiceNoteData) => Promise<void>;
    onCancel?: () => void;
    className?: string;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export function VoiceNotesRecorder({
    userId,
    propertyId: initialPropertyId,
    propertyAddress: initialPropertyAddress,
    onSave,
    onCancel,
    className
}: VoiceNotesRecorderProps) {
    // Recording state
    const [state, setState] = useState<RecordingState>('idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    // Property attachment
    const [propertyId, setPropertyId] = useState(initialPropertyId || '');
    const [propertyAddress, setPropertyAddress] = useState(initialPropertyAddress || '');

    // Photo capture
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

    // Location
    const [location, setLocation] = useState<GeolocationPosition | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Additional notes
    const [notes, setNotes] = useState('');

    // UI state
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs
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

    // Get current location
    const captureLocation = useCallback(async () => {
        try {
            setLocationError(null);
            const position = await deviceAPI.getCurrentLocation();
            setLocation(position);
        } catch (err: any) {
            console.error('Location error:', err);
            setLocationError('Unable to get location');
        }
    }, []);

    // Capture location on mount if available
    useEffect(() => {
        if (deviceAPI.hasLocationSupport()) {
            captureLocation();
        }
    }, [captureLocation]);

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
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(1000);
            setState('recording');
            setRecordingTime(0);

            // Start timer
            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err: any) {
            console.error('Recording error:', err);
            setError(
                err.name === 'NotAllowedError'
                    ? 'Microphone access denied. Please allow microphone permissions.'
                    : err.name === 'NotFoundError'
                        ? 'No microphone found on this device.'
                        : 'Failed to access microphone. Please try again.'
            );
        }
    }, []);

    // Pause/resume recording
    const togglePause = useCallback(() => {
        if (!mediaRecorderRef.current) return;

        if (state === 'paused') {
            mediaRecorderRef.current.resume();
            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            setState('recording');
        } else {
            mediaRecorderRef.current.pause();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setState('paused');
        }
    }, [state]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && (state === 'recording' || state === 'paused')) {
            mediaRecorderRef.current.stop();
            setState('stopped');
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [state]);

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

    // Capture photo
    const capturePhoto = useCallback(async () => {
        try {
            const photo = await deviceAPI.capturePhoto();
            setPhotos(prev => [...prev, photo]);

            // Create preview URL
            const previewUrl = URL.createObjectURL(photo);
            setPhotoPreviewUrls(prev => [...prev, previewUrl]);
        } catch (err: any) {
            console.error('Photo capture error:', err);
            setError('Failed to capture photo. Please try again.');
        }
    }, []);

    // Remove photo
    const removePhoto = useCallback((index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviewUrls(prev => {
            const url = prev[index];
            URL.revokeObjectURL(url);
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    // Save voice note
    const handleSave = useCallback(async () => {
        if (!audioBlob) {
            setError('No recording to save');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const noteData: VoiceNoteData = {
                id: `voice-note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                audioBlob,
                duration: recordingTime,
                timestamp: Date.now(),
                propertyId: propertyId || undefined,
                propertyAddress: propertyAddress || undefined,
                photos: photos.length > 0 ? photos : undefined,
                location: location ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy
                } : undefined,
                notes: notes || undefined
            };

            await onSave(noteData);

            // Reset form
            setAudioBlob(null);
            setState('idle');
            setRecordingTime(0);
            setPhotos([]);
            setPhotoPreviewUrls([]);
            setNotes('');
            setPropertyId(initialPropertyId || '');
            setPropertyAddress(initialPropertyAddress || '');

        } catch (err: any) {
            console.error('Save error:', err);
            setError(err.message || 'Failed to save voice note');
        } finally {
            setIsSaving(false);
        }
    }, [audioBlob, recordingTime, propertyId, propertyAddress, photos, location, notes, onSave, initialPropertyId, initialPropertyAddress]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        stopRecording();
        setAudioBlob(null);
        setState('idle');
        setRecordingTime(0);
        setPhotos([]);
        setPhotoPreviewUrls([]);
        setNotes('');
        setError(null);

        if (onCancel) {
            onCancel();
        }
    }, [stopRecording, onCancel]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [photoPreviewUrls]);

    // Handle audio playback
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
        <Card className={cn("w-full max-w-2xl mx-auto", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Voice Note
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Recording Controls */}
                <div className="text-center space-y-4">
                    {state === 'idle' ? (
                        <>
                            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                                <Mic className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <Button
                                onClick={startRecording}
                                className={cn(TOUCH_FRIENDLY_CLASSES.button, "bg-red-500 hover:bg-red-600")}
                                disabled={!navigator.mediaDevices || isSaving}
                            >
                                <Mic className="w-4 h-4 mr-2" />
                                Start Recording
                            </Button>
                        </>
                    ) : state === 'recording' || state === 'paused' ? (
                        <>
                            <div className={cn(
                                "w-24 h-24 mx-auto bg-red-500 rounded-full flex items-center justify-center",
                                state === 'recording' && "animate-pulse"
                            )}>
                                <Mic className="w-12 h-12 text-white" />
                            </div>
                            <div className="text-2xl font-mono font-bold text-red-500">
                                {formatTime(recordingTime)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {state === 'paused' ? 'Recording paused' : 'Recording...'}
                            </p>
                            <div className="flex justify-center gap-2">
                                <Button
                                    onClick={togglePause}
                                    variant="outline"
                                    className={TOUCH_FRIENDLY_CLASSES.button}
                                >
                                    {state === 'paused' ? (
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
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-3">
                                <Check className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-semibold">Recording Complete</h3>
                            <p className="text-sm text-muted-foreground">
                                Duration: {formatTime(recordingTime)}
                            </p>
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
                                    onClick={handleCancel}
                                    variant="outline"
                                    className={TOUCH_FRIENDLY_CLASSES.button}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* Property Attachment (only show when stopped) */}
                {state === 'stopped' && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="propertyId">Property ID (Optional)</Label>
                            <Input
                                id="propertyId"
                                value={propertyId}
                                onChange={(e) => setPropertyId(e.target.value)}
                                placeholder="Enter property ID"
                                className={TOUCH_FRIENDLY_CLASSES.input}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyAddress">Property Address (Optional)</Label>
                            <Input
                                id="propertyAddress"
                                value={propertyAddress}
                                onChange={(e) => setPropertyAddress(e.target.value)}
                                placeholder="Enter property address"
                                className={TOUCH_FRIENDLY_CLASSES.input}
                            />
                        </div>

                        {/* Photo Capture */}
                        <div className="space-y-2">
                            <Label>Photos (Optional)</Label>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={capturePhoto}
                                className={TOUCH_FRIENDLY_CLASSES.button}
                                disabled={!deviceAPI.hasCameraSupport()}
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Add Photo
                            </Button>

                            {photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {photoPreviewUrls.map((url, index) => (
                                        <div key={index} className="relative aspect-square">
                                            <img
                                                src={url}
                                                alt={`Photo ${index + 1}`}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => removePhoto(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Location Display */}
                        {location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>
                                    Location captured ({location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)})
                                </span>
                            </div>
                        )}
                        {locationError && (
                            <div className="text-sm text-muted-foreground">
                                {locationError}
                            </div>
                        )}

                        {/* Additional Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any additional notes..."
                                rows={3}
                                className={TOUCH_FRIENDLY_CLASSES.input}
                            />
                        </div>

                        {/* Save/Cancel Buttons */}
                        <div className="flex gap-2 pt-4">
                            <Button
                                onClick={handleSave}
                                className={cn(TOUCH_FRIENDLY_CLASSES.button, "flex-1")}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Save Voice Note
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                className={TOUCH_FRIENDLY_CLASSES.button}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
