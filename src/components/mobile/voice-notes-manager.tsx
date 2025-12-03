'use client';

/**
 * Voice Notes Manager Component
 * 
 * Main component that integrates:
 * - Voice note recording
 * - Voice notes list
 * - Cloud sync
 * - Property filtering
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { VoiceNotesRecorder, type VoiceNoteData } from './voice-notes-recorder';
import { VoiceNotesList, type VoiceNote } from './voice-notes-list';
import { cn } from '@/lib/utils/common';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';
import { useToast } from '@/hooks/use-toast';

export interface VoiceNotesManagerProps {
    userId: string;
    propertyId?: string;
    propertyAddress?: string;
    className?: string;
}

export function VoiceNotesManager({
    userId,
    propertyId: initialPropertyId,
    propertyAddress: initialPropertyAddress,
    className
}: VoiceNotesManagerProps) {
    const [notes, setNotes] = useState<VoiceNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [propertyFilter, setPropertyFilter] = useState(initialPropertyId || '');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const { toast } = useToast();

    // Load voice notes
    const loadNotes = useCallback(async () => {
        setIsLoading(true);

        try {
            const { getVoiceNotesAction } = await import('@/features/client-dashboards/actions/mobile-actions');
            const result = await getVoiceNotesAction(propertyFilter || undefined);

            if (result.success && result.data?.notes) {
                setNotes(result.data.notes);
            } else {
                throw new Error(result.message || 'Failed to load voice notes');
            }
        } catch (error: any) {
            console.error('Error loading voice notes:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load voice notes',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [propertyFilter, toast]);

    // Load notes on mount and when filter changes
    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    // Handle save voice note
    const handleSaveNote = useCallback(async (noteData: VoiceNoteData) => {
        try {
            // Create FormData for server action
            const formData = new FormData();
            formData.append('audioFile', noteData.audioBlob, `voice-note-${noteData.id}.webm`);
            formData.append('duration', noteData.duration.toString());

            if (noteData.propertyId) {
                formData.append('propertyId', noteData.propertyId);
            }
            if (noteData.propertyAddress) {
                formData.append('propertyAddress', noteData.propertyAddress);
            }
            if (noteData.notes) {
                formData.append('notes', noteData.notes);
            }
            if (noteData.location) {
                formData.append('location', JSON.stringify(noteData.location));
            }

            // Add photos
            if (noteData.photos) {
                noteData.photos.forEach((photo, index) => {
                    formData.append(`photo${index}`, photo);
                });
            }

            const { saveVoiceNoteAction } = await import('@/features/client-dashboards/actions/mobile-actions');
            const result = await saveVoiceNoteAction(null, formData);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Voice note saved successfully',
                });

                // Close recorder and refresh list
                setIsRecording(false);
                await loadNotes();
            } else {
                throw new Error(result.message || 'Failed to save voice note');
            }
        } catch (error: any) {
            console.error('Error saving voice note:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save voice note',
                variant: 'destructive',
            });
            throw error;
        }
    }, [loadNotes, toast]);

    // Handle delete voice note
    const handleDeleteNote = useCallback(async (noteId: string) => {
        try {
            const { deleteVoiceNoteAction } = await import('@/features/client-dashboards/actions/mobile-actions');
            const result = await deleteVoiceNoteAction(noteId);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Voice note deleted successfully',
                });
            } else {
                throw new Error(result.message || 'Failed to delete voice note');
            }
        } catch (error: any) {
            console.error('Error deleting voice note:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete voice note',
                variant: 'destructive',
            });
            throw error;
        }
    }, [toast]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        await loadNotes();
        toast({
            title: 'Refreshed',
            description: 'Voice notes list updated',
        });
    }, [loadNotes, toast]);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-headline font-bold">Voice Notes</h2>

                <div className="flex items-center gap-2">
                    {/* Filter Button */}
                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                <Filter className="w-4 h-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[300px]">
                            <SheetHeader>
                                <SheetTitle>Filter Voice Notes</SheetTitle>
                                <SheetDescription>
                                    Filter voice notes by property
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="propertyFilter">Property ID</Label>
                                    <Input
                                        id="propertyFilter"
                                        value={propertyFilter}
                                        onChange={(e) => setPropertyFilter(e.target.value)}
                                        placeholder="Enter property ID"
                                        className={TOUCH_FRIENDLY_CLASSES.input}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => {
                                            setPropertyFilter('');
                                            setIsFilterOpen(false);
                                        }}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Clear Filter
                                    </Button>
                                    <Button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="flex-1"
                                    >
                                        Apply Filter
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className={TOUCH_FRIENDLY_CLASSES.button}
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </Button>

                    {/* New Note Button */}
                    <Button
                        onClick={() => setIsRecording(true)}
                        className={TOUCH_FRIENDLY_CLASSES.button}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Note
                    </Button>
                </div>
            </div>

            {/* Recorder Sheet */}
            <Sheet open={isRecording} onOpenChange={setIsRecording}>
                <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Record Voice Note</SheetTitle>
                        <SheetDescription>
                            Record a voice note with optional property attachment and photos
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <VoiceNotesRecorder
                            userId={userId}
                            propertyId={initialPropertyId}
                            propertyAddress={initialPropertyAddress}
                            onSave={handleSaveNote}
                            onCancel={() => setIsRecording(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Notes List */}
            {isLoading ? (
                <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading voice notes...</p>
                </div>
            ) : (
                <VoiceNotesList
                    notes={notes}
                    onDelete={handleDeleteNote}
                    onRefresh={loadNotes}
                    propertyFilter={propertyFilter}
                />
            )}
        </div>
    );
}
