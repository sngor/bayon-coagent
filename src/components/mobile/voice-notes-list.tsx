'use client';

/**
 * Voice Notes List Component
 * 
 * Displays a list of voice notes with:
 * - Playback controls
 * - Transcription display
 * - Property attachment info
 * - Photo thumbnails
 * - Location info
 * - Delete functionality
 * 
 * Requirements: 4.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Trash2, MapPin, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/common';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';

export interface VoiceNote {
    id: string;
    userId: string;
    audioUrl: string;
    duration: number;
    transcription?: string;
    transcriptionConfidence?: number;
    propertyId?: string;
    propertyAddress?: string;
    photoUrls?: string[];
    location?: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
    notes?: string;
    timestamp: number;
    createdAt: string;
    synced: boolean;
}

export interface VoiceNotesListProps {
    notes: VoiceNote[];
    onDelete?: (noteId: string) => Promise<void>;
    onRefresh?: () => Promise<void>;
    propertyFilter?: string;
    className?: string;
}

export function VoiceNotesList({
    notes,
    onDelete,
    onRefresh,
    propertyFilter,
    className
}: VoiceNotesListProps) {
    const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
    const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());
    const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

    // Filter notes by property if specified
    const filteredNotes = propertyFilter
        ? notes.filter(note => note.propertyId === propertyFilter)
        : notes;

    // Format duration
    const formatDuration = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Format date
    const formatDate = useCallback((timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    }, []);

    // Initialize audio elements
    useEffect(() => {
        const newAudioElements = new Map<string, HTMLAudioElement>();

        filteredNotes.forEach(note => {
            const audio = new Audio(note.audioUrl);

            audio.onended = () => {
                setPlayingNoteId(null);
            };

            audio.onerror = () => {
                console.error(`Failed to load audio for note ${note.id}`);
                setPlayingNoteId(null);
            };

            newAudioElements.set(note.id, audio);
        });

        setAudioElements(newAudioElements);

        // Cleanup
        return () => {
            newAudioElements.forEach(audio => {
                audio.pause();
                audio.src = '';
            });
        };
    }, [filteredNotes]);

    // Toggle playback
    const togglePlayback = useCallback((noteId: string) => {
        const audio = audioElements.get(noteId);
        if (!audio) return;

        if (playingNoteId === noteId) {
            audio.pause();
            setPlayingNoteId(null);
        } else {
            // Pause any currently playing audio
            if (playingNoteId) {
                const currentAudio = audioElements.get(playingNoteId);
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
            }

            audio.play();
            setPlayingNoteId(noteId);
        }
    }, [audioElements, playingNoteId]);

    // Handle delete
    const handleDelete = useCallback(async (noteId: string) => {
        if (!onDelete) return;

        const confirmed = window.confirm('Are you sure you want to delete this voice note?');
        if (!confirmed) return;

        setDeletingNoteId(noteId);

        try {
            await onDelete(noteId);

            // Stop audio if playing
            if (playingNoteId === noteId) {
                const audio = audioElements.get(noteId);
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
                setPlayingNoteId(null);
            }

            // Refresh list
            if (onRefresh) {
                await onRefresh();
            }
        } catch (error) {
            console.error('Failed to delete voice note:', error);
            alert('Failed to delete voice note. Please try again.');
        } finally {
            setDeletingNoteId(null);
        }
    }, [onDelete, onRefresh, playingNoteId, audioElements]);

    // Toggle expanded view
    const toggleExpanded = useCallback((noteId: string) => {
        setExpandedNoteId(prev => prev === noteId ? null : noteId);
    }, []);

    if (filteredNotes.length === 0) {
        return (
            <Card className={cn("w-full", className)}>
                <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Voice Notes</h3>
                    <p className="text-sm text-muted-foreground">
                        {propertyFilter
                            ? 'No voice notes for this property yet.'
                            : 'Start recording voice notes to capture your thoughts on the go.'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            {filteredNotes.map(note => {
                const isPlaying = playingNoteId === note.id;
                const isDeleting = deletingNoteId === note.id;
                const isExpanded = expandedNoteId === note.id;

                return (
                    <Card key={note.id} className="overflow-hidden">
                        <CardContent className="p-4">
                            {/* Header */}
                            <div className="flex items-start gap-3 mb-3">
                                {/* Play/Pause Button */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => togglePlayback(note.id)}
                                    className={cn(
                                        TOUCH_FRIENDLY_CLASSES.button,
                                        "flex-shrink-0",
                                        isPlaying && "bg-primary text-primary-foreground"
                                    )}
                                    disabled={isDeleting}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                </Button>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">
                                            {formatDuration(note.duration)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(note.timestamp)}
                                        </span>
                                        {!note.synced && (
                                            <Badge variant="outline" className="text-xs">
                                                Pending Sync
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Property Info */}
                                    {note.propertyAddress && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {note.propertyAddress}
                                        </p>
                                    )}

                                    {/* Transcription Preview */}
                                    {note.transcription && (
                                        <p className="text-sm mt-2 line-clamp-2">
                                            {note.transcription}
                                        </p>
                                    )}

                                    {/* Metadata Badges */}
                                    <div className="flex items-center gap-2 mt-2">
                                        {note.photoUrls && note.photoUrls.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                <ImageIcon className="w-3 h-3 mr-1" />
                                                {note.photoUrls.length}
                                            </Badge>
                                        )}
                                        {note.location && (
                                            <Badge variant="secondary" className="text-xs">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                Location
                                            </Badge>
                                        )}
                                        {note.notes && (
                                            <Badge variant="secondary" className="text-xs">
                                                <FileText className="w-3 h-3 mr-1" />
                                                Notes
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Delete Button */}
                                {onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(note.id)}
                                        className={cn(TOUCH_FRIENDLY_CLASSES.button, "flex-shrink-0")}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                )}
                            </div>

                            {/* Expand/Collapse Button */}
                            {(note.transcription || note.photoUrls || note.notes) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpanded(note.id)}
                                    className="w-full text-xs"
                                >
                                    {isExpanded ? 'Show Less' : 'Show More'}
                                </Button>
                            )}

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="mt-3 pt-3 border-t space-y-3">
                                    {/* Full Transcription */}
                                    {note.transcription && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-1">Transcription</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {note.transcription}
                                            </p>
                                            {note.transcriptionConfidence && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Confidence: {Math.round(note.transcriptionConfidence * 100)}%
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Photos */}
                                    {note.photoUrls && note.photoUrls.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Photos</h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {note.photoUrls.map((url, index) => (
                                                    <img
                                                        key={index}
                                                        src={url}
                                                        alt={`Photo ${index + 1}`}
                                                        className="w-full aspect-square object-cover rounded-lg"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Additional Notes */}
                                    {note.notes && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-1">Notes</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {note.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Location */}
                                    {note.location && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-1">Location</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {note.location.latitude.toFixed(6)}, {note.location.longitude.toFixed(6)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Accuracy: ±{Math.round(note.location.accuracy)}m
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
