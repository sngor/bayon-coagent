'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    mobileErrorHandler,
    PermissionRequestHandler,
    FallbackOptionsProvider,
    type MobileErrorType,
    type MobileErrorOptions,
    type PermissionRequestOptions,
    type FallbackOption,
} from '@/lib/mobile/error-handler';
import { type ServiceError } from '@/lib/error-handling-framework';

// ============================================================================
// Mobile Error Hook
// ============================================================================

export function useMobileError() {
    const { toast } = useToast();
    const [currentError, setCurrentError] = useState<ServiceError | null>(null);
    const [fallbackOptions, setFallbackOptions] = useState<FallbackOption[]>([]);

    useEffect(() => {
        const handleError = (event: CustomEvent) => {
            const error = event.detail.error as ServiceError;
            setCurrentError(error);

            // Show toast notification
            toast({
                title: error.userMessage,
                description: error.suggestedActions?.[0],
                variant: error.severity === 'critical' || error.severity === 'high' ? 'destructive' : 'default',
                duration: error.severity === 'critical' ? Infinity : 5000,
            });
        };

        window.addEventListener('mobile-error', handleError as EventListener);

        return () => {
            window.removeEventListener('mobile-error', handleError as EventListener);
        };
    }, [toast]);

    const handleError = useCallback((options: MobileErrorOptions): ServiceError => {
        const error = mobileErrorHandler.handleMobileError(options);
        setCurrentError(error);

        // Get fallback options based on error type
        const fallbacks = getFallbackOptionsForError(options.type);
        setFallbackOptions(fallbacks);

        return error;
    }, []);

    const clearError = useCallback(() => {
        setCurrentError(null);
        setFallbackOptions([]);
    }, []);

    const retryOperation = useCallback(async <T,>(
        operation: () => Promise<T>,
        operationName: string,
        maxRetries = 3
    ) => {
        return mobileErrorHandler.retryOperation(operation, {
            maxRetries,
            operationName,
        });
    }, []);

    return {
        currentError,
        fallbackOptions,
        handleError,
        clearError,
        retryOperation,
    };
}

// ============================================================================
// Permission Hook
// ============================================================================

export function useMobilePermission() {
    const [permissions, setPermissions] = useState<
        Record<string, 'granted' | 'denied' | 'prompt'>
    >({
        camera: 'prompt',
        microphone: 'prompt',
        location: 'prompt',
        notifications: 'prompt',
    });

    useEffect(() => {
        checkAllPermissions();
    }, []);

    const checkAllPermissions = async () => {
        const newPermissions: Record<string, 'granted' | 'denied' | 'prompt'> = {};

        // Check camera
        try {
            if (navigator.permissions) {
                const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
                newPermissions.camera = camera.state;
            }
        } catch (error) {
            newPermissions.camera = 'prompt';
        }

        // Check microphone
        try {
            if (navigator.permissions) {
                const microphone = await navigator.permissions.query({
                    name: 'microphone' as PermissionName,
                });
                newPermissions.microphone = microphone.state;
            }
        } catch (error) {
            newPermissions.microphone = 'prompt';
        }

        // Check location
        try {
            if (navigator.permissions) {
                const location = await navigator.permissions.query({ name: 'geolocation' });
                newPermissions.location = location.state;
            }
        } catch (error) {
            newPermissions.location = 'prompt';
        }

        // Check notifications
        if ('Notification' in window) {
            const notificationPermission = Notification.permission;
            newPermissions.notifications = notificationPermission === 'default' ? 'prompt' : notificationPermission;
        }

        setPermissions(newPermissions);
    };

    const requestPermission = useCallback(
        async (options: PermissionRequestOptions) => {
            const result = await PermissionRequestHandler.requestPermission(options);

            // Update permission state
            await checkAllPermissions();

            return result;
        },
        []
    );

    const hasPermission = useCallback(
        (permissionType: 'camera' | 'microphone' | 'location' | 'notifications'): boolean => {
            return permissions[permissionType] === 'granted';
        },
        [permissions]
    );

    return {
        permissions,
        requestPermission,
        hasPermission,
        checkAllPermissions,
    };
}

// ============================================================================
// Network Status Hook
// ============================================================================

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [connectionType, setConnectionType] = useState<string>('unknown');

    useEffect(() => {
        setIsOnline(navigator.onLine);

        // Get connection type if available
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
            setConnectionType(connection.effectiveType || 'unknown');
        }

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        const handleConnectionChange = () => {
            if (connection) {
                setConnectionType(connection.effectiveType || 'unknown');
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (connection) {
            connection.addEventListener('change', handleConnectionChange);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);

            if (connection) {
                connection.removeEventListener('change', handleConnectionChange);
            }
        };
    }, []);

    return {
        isOnline,
        connectionType,
        isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFallbackOptionsForError(errorType: MobileErrorType): FallbackOption[] {
    switch (errorType) {
        case 'camera_failed':
        case 'hardware_unavailable':
            return FallbackOptionsProvider.getCameraFallbacks();

        case 'microphone_failed':
            return FallbackOptionsProvider.getMicrophoneFallbacks();

        case 'location_failed':
            return FallbackOptionsProvider.getLocationFallbacks();

        case 'network_offline':
        case 'sync_failed':
        case 'upload_failed':
            return FallbackOptionsProvider.getNetworkFallbacks();

        default:
            return [];
    }
}
