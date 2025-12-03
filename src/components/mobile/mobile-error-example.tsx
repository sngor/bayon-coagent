'use client';

/**
 * Example Component: Mobile Error Handling Integration
 * 
 * This file demonstrates how to integrate the mobile error handling system
 * into your components. Use this as a reference for implementing error
 * handling in your own mobile features.
 */

import React, { useState } from 'react';
import { Camera, Mic, MapPin, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMobileError, useMobilePermission, useNetworkStatus } from '@/hooks/use-mobile-error';
import { MobileErrorType } from '@/lib/mobile/error-handler';
import { deviceAPI } from '@/lib/mobile/device-apis';
import { offlineQueue } from '@/lib/mobile/offline-queue';

export function MobileErrorExample() {
    const [isLoading, setIsLoading] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);

    const { handleError, retryOperation, fallbackOptions } = useMobileError();
    const { permissions, requestPermission, hasPermission } = useMobilePermission();
    const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();

    // ========================================================================
    // Example 1: Camera with Permission Request and Error Handling
    // ========================================================================

    const handleCameraCapture = async () => {
        setIsLoading(true);

        try {
            // Step 1: Check and request permission
            if (!hasPermission('camera')) {
                const result = await requestPermission({
                    permissionType: 'camera',
                    explanation:
                        'We need camera access to capture property photos. This helps you quickly document properties while on-site.',
                    required: true,
                });

                if (!result.granted) {
                    handleError({
                        type: MobileErrorType.PERMISSION_DENIED,
                        operation: 'camera_capture',
                        showToast: true,
                        fallbackAvailable: true,
                    });
                    return;
                }
            }

            // Step 2: Capture photo with error handling
            const photo = await deviceAPI.capturePhoto({
                facingMode: 'environment',
                quality: 0.9,
            });

            setCapturedPhoto(photo);

            // Step 3: Upload with retry logic
            await uploadPhotoWithRetry(photo);
        } catch (error: any) {
            // Handle specific error types
            if (error.name === 'HardwareUnavailable') {
                handleError({
                    type: MobileErrorType.HARDWARE_UNAVAILABLE,
                    operation: 'camera_capture',
                    originalError: error,
                    showToast: true,
                    fallbackAvailable: true,
                });
            } else if (error.name === 'PermissionDenied') {
                handleError({
                    type: MobileErrorType.PERMISSION_DENIED,
                    operation: 'camera_capture',
                    originalError: error,
                    showToast: true,
                });
            } else {
                handleError({
                    type: MobileErrorType.CAMERA_FAILED,
                    operation: 'camera_capture',
                    originalError: error,
                    showToast: true,
                    retryable: true,
                    fallbackAvailable: true,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Example 2: Upload with Retry Logic and Offline Queue
    // ========================================================================

    const uploadPhotoWithRetry = async (photo: File) => {
        // Check if online
        if (!isOnline) {
            // Queue for later sync
            await offlineQueue.enqueue(
                'capture-photo',
                {
                    photoData: await fileToBase64(photo),
                    timestamp: Date.now(),
                },
                { maxRetries: 3 }
            );

            handleError({
                type: MobileErrorType.NETWORK_OFFLINE,
                operation: 'upload_photo',
                showToast: true,
            });

            return;
        }

        // Use retry logic for upload
        const result = await retryOperation(
            async () => {
                const formData = new FormData();
                formData.append('photo', photo);

                const response = await fetch('/api/mobile/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }

                return response.json();
            },
            'upload_photo',
            3 // max retries
        );

        if (!result.success) {
            handleError({
                type: MobileErrorType.UPLOAD_FAILED,
                operation: 'upload_photo',
                originalError: result.error as Error,
                showToast: true,
                retryable: true,
            });
        }
    };

    // ========================================================================
    // Example 3: Voice Recording with Permission and Error Handling
    // ========================================================================

    const handleVoiceRecording = async () => {
        setIsLoading(true);

        try {
            // Request microphone permission
            if (!hasPermission('microphone')) {
                const result = await requestPermission({
                    permissionType: 'microphone',
                    explanation:
                        'We need microphone access to record voice notes. This allows you to quickly capture thoughts and observations.',
                    required: true,
                });

                if (!result.granted) {
                    handleError({
                        type: MobileErrorType.PERMISSION_DENIED,
                        operation: 'voice_recording',
                        showToast: true,
                        fallbackAvailable: true,
                    });
                    return;
                }
            }

            // Start recording
            const recorder = await deviceAPI.startVoiceRecording();

            // Recording logic here...
            console.log('Recording started:', recorder);
        } catch (error: any) {
            if (error.name === 'HardwareUnavailable') {
                handleError({
                    type: MobileErrorType.HARDWARE_UNAVAILABLE,
                    operation: 'voice_recording',
                    originalError: error,
                    showToast: true,
                    fallbackAvailable: true,
                });
            } else if (error.name === 'MicrophoneFailed') {
                handleError({
                    type: MobileErrorType.MICROPHONE_FAILED,
                    operation: 'voice_recording',
                    originalError: error,
                    showToast: true,
                    retryable: true,
                    fallbackAvailable: true,
                });
            } else {
                handleError({
                    type: MobileErrorType.MICROPHONE_FAILED,
                    operation: 'voice_recording',
                    originalError: error,
                    showToast: true,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Example 4: Location with Permission and Error Handling
    // ========================================================================

    const handleLocationAccess = async () => {
        setIsLoading(true);

        try {
            // Request location permission
            if (!hasPermission('location')) {
                const result = await requestPermission({
                    permissionType: 'location',
                    explanation:
                        'We need location access to automatically tag your property photos and notes with location data.',
                    required: false, // Optional permission
                    fallbackAction: () => {
                        console.log('User can enter location manually');
                    },
                });

                if (!result.granted) {
                    // User declined, but it's optional
                    return;
                }
            }

            // Get location
            const position = await deviceAPI.getCurrentLocation({
                enableHighAccuracy: true,
                timeout: 10000,
            });

            console.log('Location:', position.coords);
        } catch (error: any) {
            if (error.name === 'LocationFailed') {
                handleError({
                    type: MobileErrorType.LOCATION_FAILED,
                    operation: 'get_location',
                    originalError: error,
                    showToast: true,
                    retryable: true,
                    fallbackAvailable: true,
                });
            } else {
                handleError({
                    type: MobileErrorType.LOCATION_FAILED,
                    operation: 'get_location',
                    originalError: error,
                    showToast: true,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div className="space-y-4 p-4">
            {/* Network Status */}
            {!isOnline && (
                <Card variant="elevated" className="border-warning bg-warning/10">
                    <CardContent className="p-4">
                        <p className="text-sm text-warning-foreground">
                            You're offline. Actions will be queued and synced when you're back online.
                        </p>
                    </CardContent>
                </Card>
            )}

            {isSlowConnection && (
                <Card variant="elevated" className="border-warning bg-warning/10">
                    <CardContent className="p-4">
                        <p className="text-sm text-warning-foreground">
                            Slow connection detected ({connectionType}). Some features may be limited.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Example Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Mobile Error Handling Examples</CardTitle>
                    <CardDescription>
                        Try these actions to see error handling in action
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                        onClick={handleCameraCapture}
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Camera className="mr-2 h-5 w-5" />
                        )}
                        Capture Photo
                    </Button>

                    <Button
                        onClick={handleVoiceRecording}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Mic className="mr-2 h-5 w-5" />
                        )}
                        Record Voice Note
                    </Button>

                    <Button
                        onClick={handleLocationAccess}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <MapPin className="mr-2 h-5 w-5" />
                        )}
                        Get Location
                    </Button>
                </CardContent>
            </Card>

            {/* Permission Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Permission Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <PermissionStatusItem
                        label="Camera"
                        status={permissions.camera}
                        icon={<Camera className="h-4 w-4" />}
                    />
                    <PermissionStatusItem
                        label="Microphone"
                        status={permissions.microphone}
                        icon={<Mic className="h-4 w-4" />}
                    />
                    <PermissionStatusItem
                        label="Location"
                        status={permissions.location}
                        icon={<MapPin className="h-4 w-4" />}
                    />
                </CardContent>
            </Card>

            {/* Fallback Options */}
            {fallbackOptions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Alternative Options</CardTitle>
                        <CardDescription>
                            Try these alternatives if the primary action failed
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {fallbackOptions.map((option, index) => (
                            <Button
                                key={index}
                                onClick={option.action}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                <div className="text-left">
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {option.description}
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ============================================================================
// Helper Components
// ============================================================================

function PermissionStatusItem({
    label,
    status,
    icon,
}: {
    label: string;
    status: string;
    icon: React.ReactNode;
}) {
    const getStatusColor = () => {
        switch (status) {
            case 'granted':
                return 'text-green-600';
            case 'denied':
                return 'text-destructive';
            default:
                return 'text-muted-foreground';
        }
    };

    return (
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className={`text-xs font-medium ${getStatusColor()}`}>
                {status === 'granted' ? 'Allowed' : status === 'denied' ? 'Denied' : 'Not Set'}
            </span>
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
