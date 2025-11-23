'use client';

import React from 'react';
import { MeetingPrep } from '@/components/mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function MobileMeetingPrepDemoPage() {
    const handleMaterialsGenerated = (materials: any) => {
        console.log('Meeting materials generated:', materials);
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Meeting Prep Assistant Demo
                    </CardTitle>
                    <CardDescription>
                        Test the mobile meeting preparation assistant with AI-powered material generation.
                        This demo shows both online and offline functionality.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <h3 className="font-headline font-semibold mb-2">Features Demonstrated:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Client information collection with validation</li>
                                <li>Property interests and budget range input</li>
                                <li>AI-powered meeting material generation</li>
                                <li>Editable meeting materials with save functionality</li>
                                <li>Offline queueing when connectivity is lost</li>
                                <li>Automatic sync when connectivity is restored</li>
                            </ul>
                        </div>

                        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                            <h3 className="font-headline font-semibold mb-2 text-yellow-800">Testing Offline Mode:</h3>
                            <p className="text-sm text-yellow-700">
                                To test offline functionality, open your browser's Developer Tools,
                                go to the Network tab, and check "Offline" to simulate no internet connection.
                                Meeting prep requests will be queued and processed when you go back online.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <MeetingPrep
                userId="demo-user"
                onGenerate={handleMaterialsGenerated}
            />
        </div>
    );
}