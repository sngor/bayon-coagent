'use client';

import React from 'react';
import { QuickCaptureWorkflow } from './quick-capture-workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CapturedPhoto, PhotoDescription } from './index';

export function QuickCaptureDemo() {
    const handleSaveToLibrary = async (
        photo: CapturedPhoto,
        description: PhotoDescription,
        photoUrl: string
    ) => {
        console.log('Saving to library:', { photo, description, photoUrl });

        // Simulate save operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real implementation, this would save to DynamoDB
        console.log('Saved to library successfully');
    };

    return (
        <div className="container mx-auto p-4 max-w-lg">
            <Card>
                <CardHeader>
                    <CardTitle>Quick Capture Demo</CardTitle>
                </CardHeader>
                <CardContent>
                    <QuickCaptureWorkflow
                        userId="demo-user"
                        onSaveToLibrary={handleSaveToLibrary}
                    />
                </CardContent>
            </Card>
        </div>
    );
}