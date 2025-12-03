/**
 * Offline Queue Usage Example
 * 
 * Demonstrates how to use the offline queue in components.
 * This file serves as documentation and can be removed in production.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { useConnectivity } from '@/hooks/use-connectivity';
import { executeOrQueue, getQueuedMessage, isQueuedResult } from '@/lib/mobile/queue-helpers';
import { useToast } from '@/hooks/use-toast';

export function OfflineQueueExample() {
    const [text, setText] = useState('');
    const { enqueue } = useOfflineQueue();
    const { isOnline } = useConnectivity();
    const { toast } = useToast();

    // Example 1: Manual queuing
    const handleManualQueue = async () => {
        try {
            const operationId = await enqueue('capture-text', {
                content: text,
                timestamp: Date.now(),
            });

            toast({
                title: 'Queued',
                description: `Operation queued with ID: ${operationId}`,
            });

            setText('');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to queue operation',
                variant: 'destructive',
            });
        }
    };

    // Example 2: Automatic queuing with executeOrQueue
    const handleAutoQueue = async () => {
        try {
            const result = await executeOrQueue(
                'capture-text',
                { content: text, timestamp: Date.now() },
                async () => {
                    // This function executes if online
                    const response = await fetch('/api/mobile/capture', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'text',
                            content: text,
                            timestamp: Date.now(),
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to save');
                    }

                    return response.json();
                }
            );

            if (isQueuedResult(result)) {
                // Operation was queued
                toast({
                    title: 'Saved Offline',
                    description: getQueuedMessage('capture-text'),
                });
            } else {
                // Operation executed successfully
                toast({
                    title: 'Saved',
                    description: 'Your text has been saved',
                });
            }

            setText('');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save text',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-4 p-4">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Offline Queue Example</h3>
                <p className="text-sm text-muted-foreground">
                    Status: {isOnline ? 'Online' : 'Offline'}
                </p>
            </div>

            <div className="space-y-2">
                <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter some text..."
                />

                <div className="flex gap-2">
                    <Button onClick={handleManualQueue} variant="outline">
                        Manual Queue
                    </Button>
                    <Button onClick={handleAutoQueue}>
                        Auto Queue
                    </Button>
                </div>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium">How it works:</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Manual Queue: Always queues the operation</li>
                    <li>Auto Queue: Executes if online, queues if offline</li>
                    <li>Operations sync automatically when connection returns</li>
                    <li>Conflicts are resolved using last-write-wins strategy</li>
                </ul>
            </div>
        </div>
    );
}
