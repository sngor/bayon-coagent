'use client';

import React, { useState } from 'react';
import { QuickCaptureInterface, type CaptureData } from './quick-capture-interface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function QuickCaptureInterfaceDemo() {
    const [open, setOpen] = useState(false);
    const [captures, setCaptures] = useState<CaptureData[]>([]);
    const { toast } = useToast();

    const handleCapture = async (data: CaptureData) => {
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        setCaptures(prev => [data, ...prev]);

        toast({
            title: "Capture successful",
            description: `${data.type} captured successfully`,
        });
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Quick Capture Interface Demo</CardTitle>
                    <CardDescription>
                        Test the mobile-optimized quick capture interface with camera, voice, and text modes
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={() => setOpen(true)}
                        className="w-full min-h-[44px]"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Open Quick Capture
                    </Button>

                    {captures.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Recent Captures ({captures.length})</h3>
                            <div className="space-y-2">
                                {captures.map((capture, index) => (
                                    <div
                                        key={index}
                                        className="p-3 border rounded-lg text-sm"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium capitalize">{capture.type}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(capture.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {capture.location && (
                                            <div className="text-xs text-muted-foreground">
                                                Location: {capture.location.latitude.toFixed(4)}, {capture.location.longitude.toFixed(4)}
                                            </div>
                                        )}
                                        {capture.metadata && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {Object.entries(capture.metadata).map(([key, value]) => (
                                                    <div key={key}>
                                                        {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <QuickCaptureInterface
                open={open}
                onOpenChange={setOpen}
                onCapture={handleCapture}
                defaultMode="camera"
                enableLocation={true}
            />
        </div>
    );
}
