'use client';

import React, { useEffect, useState } from 'react';
import { Camera, Mic, MapPin, Bell, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils/common';

// ============================================================================
// Permission Request Dialog
// ============================================================================

export interface PermissionRequestEvent {
    permissionType: 'camera' | 'microphone' | 'location' | 'notifications';
    explanation: string;
    required: boolean;
}

export function PermissionDialog() {
    const [request, setRequest] = useState<PermissionRequestEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleRequest = (event: CustomEvent<PermissionRequestEvent>) => {
            setRequest(event.detail);
            setIsVisible(true);
        };

        window.addEventListener('permission-request', handleRequest as EventListener);

        return () => {
            window.removeEventListener('permission-request', handleRequest as EventListener);
        };
    }, []);

    const handleAllow = () => {
        window.dispatchEvent(
            new CustomEvent('permission-response', {
                detail: { granted: true },
            })
        );
        setIsVisible(false);
        setTimeout(() => setRequest(null), 300);
    };

    const handleDeny = () => {
        if (!request?.required) {
            window.dispatchEvent(
                new CustomEvent('permission-response', {
                    detail: { granted: false },
                })
            );
            setIsVisible(false);
            setTimeout(() => setRequest(null), 300);
        }
    };

    if (!request || !isVisible) return null;

    const getIcon = () => {
        switch (request.permissionType) {
            case 'camera':
                return <Camera className="h-8 w-8" />;
            case 'microphone':
                return <Mic className="h-8 w-8" />;
            case 'location':
                return <MapPin className="h-8 w-8" />;
            case 'notifications':
                return <Bell className="h-8 w-8" />;
        }
    };

    const getTitle = () => {
        switch (request.permissionType) {
            case 'camera':
                return 'Camera Access';
            case 'microphone':
                return 'Microphone Access';
            case 'location':
                return 'Location Access';
            case 'notifications':
                return 'Notification Permission';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
            <Card className="w-full max-w-md animate-in zoom-in-95">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-primary/10 p-3 text-primary">
                                {getIcon()}
                            </div>
                            <div>
                                <CardTitle className="text-lg">{getTitle()}</CardTitle>
                                {request.required && (
                                    <CardDescription className="text-xs text-destructive">
                                        Required
                                    </CardDescription>
                                )}
                            </div>
                        </div>
                        {!request.required && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDeny}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{request.explanation}</p>

                    <div className="rounded-lg bg-muted p-3 space-y-2">
                        <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 mt-0.5 text-primary" />
                            <div className="text-xs text-muted-foreground">
                                <p className="font-semibold text-foreground mb-1">
                                    Your privacy matters
                                </p>
                                <p>
                                    We only use this permission for the features you choose to use.
                                    You can change this anytime in your device settings.
                                </p>
                            </div>
                        </div>
                    </div>

                    {getPermissionInstructions(request.permissionType)}
                </CardContent>

                <CardFooter className="flex gap-2">
                    {!request.required && (
                        <Button onClick={handleDeny} variant="outline" className="flex-1">
                            Not Now
                        </Button>
                    )}
                    <Button onClick={handleAllow} className="flex-1">
                        Allow
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// ============================================================================
// Permission Instructions
// ============================================================================

function getPermissionInstructions(permissionType: string) {
    const instructions: Record<string, { title: string; steps: string[] }> = {
        camera: {
            title: 'If you accidentally deny:',
            steps: [
                'Go to your device Settings',
                'Find this app in the app list',
                'Tap Permissions',
                'Enable Camera access',
            ],
        },
        microphone: {
            title: 'If you accidentally deny:',
            steps: [
                'Go to your device Settings',
                'Find this app in the app list',
                'Tap Permissions',
                'Enable Microphone access',
            ],
        },
        location: {
            title: 'If you accidentally deny:',
            steps: [
                'Go to your device Settings',
                'Find this app in the app list',
                'Tap Permissions',
                'Enable Location access',
            ],
        },
        notifications: {
            title: 'If you accidentally deny:',
            steps: [
                'Go to your device Settings',
                'Find this app in the app list',
                'Tap Notifications',
                'Enable notifications',
            ],
        },
    };

    const info = instructions[permissionType];
    if (!info) return null;

    return (
        <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-muted-foreground">
                {info.title}
            </summary>
            <ol className="mt-2 space-y-1 pl-4 list-decimal text-muted-foreground">
                {info.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                ))}
            </ol>
        </details>
    );
}

// ============================================================================
// Permission Status Indicator
// ============================================================================

export interface PermissionStatusProps {
    permissionType: 'camera' | 'microphone' | 'location' | 'notifications';
    status: 'granted' | 'denied' | 'prompt';
    onRequest?: () => void;
    className?: string;
}

export function PermissionStatus({
    permissionType,
    status,
    onRequest,
    className,
}: PermissionStatusProps) {
    const getIcon = () => {
        switch (permissionType) {
            case 'camera':
                return <Camera className="h-4 w-4" />;
            case 'microphone':
                return <Mic className="h-4 w-4" />;
            case 'location':
                return <MapPin className="h-4 w-4" />;
            case 'notifications':
                return <Bell className="h-4 w-4" />;
        }
    };

    const getLabel = () => {
        switch (permissionType) {
            case 'camera':
                return 'Camera';
            case 'microphone':
                return 'Microphone';
            case 'location':
                return 'Location';
            case 'notifications':
                return 'Notifications';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'granted':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'denied':
                return 'text-destructive bg-destructive/10 border-destructive/20';
            case 'prompt':
                return 'text-warning bg-warning/10 border-warning/20';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'granted':
                return 'Allowed';
            case 'denied':
                return 'Denied';
            case 'prompt':
                return 'Not Set';
        }
    };

    return (
        <div
            className={cn(
                'flex items-center justify-between rounded-lg border p-3',
                getStatusColor(),
                className
            )}
        >
            <div className="flex items-center gap-3">
                {getIcon()}
                <div>
                    <div className="text-sm font-medium">{getLabel()}</div>
                    <div className="text-xs opacity-80">{getStatusText()}</div>
                </div>
            </div>
            {status !== 'granted' && onRequest && (
                <Button size="sm" variant="outline" onClick={onRequest}>
                    {status === 'denied' ? 'Settings' : 'Allow'}
                </Button>
            )}
        </div>
    );
}
