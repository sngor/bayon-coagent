'use client';

import React from 'react';
import { VoiceMemoWorkflow } from './voice-memo-workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic } from 'lucide-react';
import type { VoiceToContentOutput } from '@/ai/schemas/voice-to-content-schemas';

export function VoiceMemoDemo() {
    const handleContentSaved = async (content: VoiceToContentOutput) => {
        console.log('Content saved to library:', content);
        // In a real implementation, this would save to DynamoDB
        // For demo purposes, we'll just log it
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle>Voice Memo Feature</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Record voice memos and convert them to structured content
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            <h4 className="font-headline font-medium mb-2">Features:</h4>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Audio recording with MediaRecorder API</li>
                                <li>Automatic transcription using Bedrock AI</li>
                                <li>Content generation (blog, social, market update, notes)</li>
                                <li>Offline recording with sync queue</li>
                                <li>Touch-optimized mobile interface</li>
                            </ul>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <h4 className="font-headline font-medium mb-2">Workflow:</h4>
                            <ol className="space-y-1 list-decimal list-inside">
                                <li>Record voice memo</li>
                                <li>Upload and transcribe (or queue if offline)</li>
                                <li>Select content type</li>
                                <li>Generate and edit content</li>
                                <li>Save to content library</li>
                            </ol>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <VoiceMemoWorkflow
                userId="demo-user"
                onContentSaved={handleContentSaved}
            />
        </div>
    );
}