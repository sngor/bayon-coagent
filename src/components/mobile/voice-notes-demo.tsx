'use client';

/**
 * Voice Notes Demo Component
 * 
 * Demonstrates the complete voice notes system including:
 * - Recording with MediaRecorder API
 * - Property attachment
 * - Photo capture
 * - Location tracking
 * - Cloud sync
 * - List management
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React from 'react';
import { VoiceNotesManager } from './voice-notes-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export interface VoiceNotesDemoProps {
    userId: string;
    propertyId?: string;
    propertyAddress?: string;
}

export function VoiceNotesDemo({
    userId,
    propertyId,
    propertyAddress
}: VoiceNotesDemoProps) {
    return (
        <div className="container max-w-4xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-headline font-bold mb-2">Voice Notes System</h1>
                <p className="text-muted-foreground">
                    Record voice notes with property attachments, photos, and location data
                </p>
            </div>

            {/* Feature Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Features</CardTitle>
                    <CardDescription>
                        Complete voice notes system for mobile agents
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <h3 className="font-semibold mb-2">Recording</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• MediaRecorder API integration</li>
                                <li>• Pause/resume support</li>
                                <li>• Real-time duration tracking</li>
                                <li>• Audio playback preview</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Property Attachment</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Link notes to properties</li>
                                <li>• Property ID and address</li>
                                <li>• Filter by property</li>
                                <li>• Quick property lookup</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Photo Integration</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Capture photos with notes</li>
                                <li>• Multiple photo support</li>
                                <li>• Automatic compression</li>
                                <li>• Photo thumbnails in list</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Cloud Sync</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Automatic S3 upload</li>
                                <li>• DynamoDB storage</li>
                                <li>• Offline queue support</li>
                                <li>• Sync status indicators</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Transcription</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• AWS Transcribe integration</li>
                                <li>• Confidence scoring</li>
                                <li>• Real estate terminology</li>
                                <li>• Searchable transcripts</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Location Services</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Automatic location capture</li>
                                <li>• GPS coordinates</li>
                                <li>• Accuracy tracking</li>
                                <li>• Location metadata</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Browser Compatibility */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <strong>Browser Requirements:</strong> This feature requires a modern browser with
                    MediaRecorder API support (Chrome, Firefox, Safari, Edge). Microphone and camera
                    permissions are required for full functionality.
                </AlertDescription>
            </Alert>

            {/* Voice Notes Manager */}
            <VoiceNotesManager
                userId={userId}
                propertyId={propertyId}
                propertyAddress={propertyAddress}
            />

            {/* Technical Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Technical Implementation</CardTitle>
                    <CardDescription>
                        Architecture and technology stack
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Frontend</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• React with TypeScript</li>
                            <li>• MediaRecorder API for audio capture</li>
                            <li>• Geolocation API for location tracking</li>
                            <li>• File API for photo capture</li>
                            <li>• Canvas API for image compression</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Backend</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Next.js Server Actions</li>
                            <li>• AWS S3 for audio/photo storage</li>
                            <li>• DynamoDB for metadata storage</li>
                            <li>• AWS Transcribe for audio transcription</li>
                            <li>• Offline sync queue with IndexedDB</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Data Flow</h3>
                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>User records audio with MediaRecorder</li>
                            <li>Optional: Capture photos and location</li>
                            <li>Audio/photos compressed and uploaded to S3</li>
                            <li>Audio sent to AWS Transcribe for transcription</li>
                            <li>Metadata saved to DynamoDB</li>
                            <li>If offline, queued for later sync</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
