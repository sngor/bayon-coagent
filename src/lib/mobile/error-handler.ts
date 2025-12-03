/**
 * Mobile-Specific Error Handler
 * 
 * Provides error handling tailored for mobile device scenarios:
 * - Permission request flows with clear explanations
 * - Fallback options for unavailable hardware
 * - Network and AI service error retry logic
 * - User-friendly error messages with actionable steps
 * 
 * Requirements: All mobile requirements
 */

import {
    ErrorCategory,
    type ErrorContext,
    type RecoveryAction,
    detectErrorPattern,
    retryWithBackoff,
} from '@/lib/error-handling';
import {
    ServiceErrorFactory,
    type ServiceError,
    type ServiceResult,
} from '@/lib/error-handling-framework';

// ============================================================================
// Mobile-Specific Error Types
// ============================================================================

export enum MobileErrorType {
    PERMISSION_DENIED = 'permission_denied',
    HARDWARE_UNAVAILABLE = 'hardware_unavailable',
    CAMERA_FAILED = 'camera_failed',
    MICROPHONE_FAILED = 'microphone_failed',
    LOCATION_FAILED = 'location_failed',
    STORAGE_QUOTA_EXCEEDED = 'storage_quota_exceeded',
    NETWORK_OFFLINE = 'network_offline',
    SYNC_FAILED = 'sync_failed',
    AI_ANALYSIS_FAILED = 'ai_analysis_failed',
    TRANSCRIPTION_FAILED = 'transcription_failed',
    UPLOAD_FAILED = 'upload_failed',
}

export interface MobileErrorOptions {
    type: MobileErrorType;
    operation: string;
    originalError?: Error;
    metadata?: Record<string, any>;
    showToast?: boolean;
    retryable?: boolean;
    fallbackAvailable?: boolean;
}

export interface PermissionRequestOptions {
    permissionType: 'camera' | 'microphone' | 'location' | 'notifications';
    explanation: string;
    required: boolean;
    fallbackAction?: () => void;
}

export interface FallbackOption {
    label: string;
    description: string;
    action: () => void | Promise<void>;
    icon?: string;
}

// ============================================================================
// Mobile Error Handler Class
// ============================================================================

export class MobileErrorHandler {
    private static instance: MobileErrorHandler;
    private errorLog: Array<{ error: ServiceError; timestamp: Date }> = [];
    private maxLogSize = 50;

    private constructor() { }

    static getInstance(): MobileErrorHandler {
        if (!MobileErrorHandler.instance) {
            MobileErrorHandler.instance = new MobileErrorHandler();
        }
        return MobileErrorHandler.instance;
    }

    /**
     * Handle mobile-specific errors with appropriate user feedback
     */
    handleMobileError(options: MobileErrorOptions): ServiceError {
        const { type, operation, originalError, metadata, showToast = true } = options;

        const error = this.createMobileError(type, operation, originalError, metadata);

        // Log error
        this.logError(error);

        // Show user feedback if requested
        if (showToast) {
            this.showErrorFeedback(error);
        }

        return error;
    }

    /**
     * Create a mobile-specific service error
     */
    private createMobileError(
        type: MobileErrorType,
        operation: string,
        originalError?: Error,
        metadata?: Record<string, any>
    ): ServiceError {
        const errorInfo = this.getErrorInfo(type);

        return ServiceErrorFactory.create(
            originalError?.message || errorInfo.message,
            `MOBILE_${type.toUpperCase()}`,
            errorInfo.category,
            {
                operation,
                timestamp: new Date(),
                metadata: {
                    ...metadata,
                    isMobile: true,
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                },
            },
            {
                userMessage: errorInfo.userMessage,
                suggestedActions: errorInfo.suggestedActions,
                recoveryActions: errorInfo.recoveryActions,
                retryable: errorInfo.retryable,
                severity: errorInfo.severity,
                originalError,
            }
        );
    }

    /**
     * Get error information based on mobile error type
     */
    private getErrorInfo(type: MobileErrorType): {
        message: string;
        userMessage: string;
        suggestedActions: string[];
        recoveryActions?: RecoveryAction[];
        category: ErrorCategory;
        retryable: boolean;
        severity: 'low' | 'medium' | 'high' | 'critical';
    } {
        switch (type) {
            case MobileErrorType.PERMISSION_DENIED:
                return {
                    message: 'Permission denied by user',
                    userMessage: 'Permission is required to use this feature',
                    suggestedActions: [
                        'Go to your device settings',
                        'Find this app in the permissions list',
                        'Enable the required permission',
                        'Return to the app and try again',
                    ],
                    category: ErrorCategory.AUTHORIZATION,
                    retryable: false,
                    severity: 'medium',
                };

            case MobileErrorType.HARDWARE_UNAVAILABLE:
                return {
                    message: 'Required hardware not available',
                    userMessage: 'This feature requires hardware that is not available on your device',
                    suggestedActions: [
                        'Use an alternative input method',
                        'Try on a different device',
                        'Contact support for assistance',
                    ],
                    category: ErrorCategory.CLIENT_ERROR,
                    retryable: false,
                    severity: 'low',
                };

            case MobileErrorType.CAMERA_FAILED:
                return {
                    message: 'Camera access failed',
                    userMessage: 'Unable to access your camera',
                    suggestedActions: [
                        'Check if another app is using the camera',
                        'Restart your device',
                        'Check camera permissions in settings',
                        'Use file upload as an alternative',
                    ],
                    category: ErrorCategory.CLIENT_ERROR,
                    retryable: true,
                    severity: 'medium',
                };

            case MobileErrorType.MICROPHONE_FAILED:
                return {
                    message: 'Microphone access failed',
                    userMessage: 'Unable to access your microphone',
                    suggestedActions: [
                        'Check if another app is using the microphone',
                        'Check microphone permissions in settings',
                        'Use text input as an alternative',
                    ],
                    category: ErrorCategory.CLIENT_ERROR,
                    retryable: true,
                    severity: 'medium',
                };

            case MobileErrorType.LOCATION_FAILED:
                return {
                    message: 'Location access failed',
                    userMessage: 'Unable to access your location',
                    suggestedActions: [
                        'Enable location services in device settings',
                        'Check location permissions for this app',
                        'Ensure you have a GPS signal',
                        'Enter location manually if needed',
                    ],
                    category: ErrorCategory.CLIENT_ERROR,
                    retryable: true,
                    severity: 'low',
                };

            case MobileErrorType.STORAGE_QUOTA_EXCEEDED:
                return {
                    message: 'Storage quota exceeded',
                    userMessage: 'Not enough storage space available',
                    suggestedActions: [
                        'Clear app cache and old data',
                        'Delete unused files',
                        'Free up device storage',
                        'Sync and clear completed operations',
                    ],
                    category: ErrorCategory.CLIENT_ERROR,
                    retryable: false,
                    severity: 'high',
                };

            case MobileErrorType.NETWORK_OFFLINE:
                return {
                    message: 'Device is offline',
                    userMessage: 'No internet connection available',
                    suggestedActions: [
                        'Check your WiFi or mobile data connection',
                        'Your action has been queued and will sync when online',
                        'Move to an area with better signal',
                    ],
                    category: ErrorCategory.NETWORK,
                    retryable: true,
                    severity: 'medium',
                };

            case MobileErrorType.SYNC_FAILED:
                return {
                    message: 'Sync operation failed',
                    userMessage: 'Unable to sync your data',
                    suggestedActions: [
                        'Check your internet connection',
                        'The operation will retry automatically',
                        'View queued operations in settings',
                        'Contact support if this persists',
                    ],
                    category: ErrorCategory.NETWORK,
                    retryable: true,
                    severity: 'medium',
                };

            case MobileErrorType.AI_ANALYSIS_FAILED:
                return {
                    message: 'AI analysis failed',
                    userMessage: 'Unable to analyze the content',
                    suggestedActions: [
                        'Try again in a moment',
                        'Ensure the image is clear and well-lit',
                        'Enter details manually if needed',
                        'Contact support if this continues',
                    ],
                    category: ErrorCategory.AI_OPERATION,
                    retryable: true,
                    severity: 'medium',
                };

            case MobileErrorType.TRANSCRIPTION_FAILED:
                return {
                    message: 'Transcription failed',
                    userMessage: 'Unable to transcribe the audio',
                    suggestedActions: [
                        'Try recording again in a quieter environment',
                        'Speak more clearly',
                        'Type your message instead',
                        'Contact support if this continues',
                    ],
                    category: ErrorCategory.AI_OPERATION,
                    retryable: true,
                    severity: 'medium',
                };

            case MobileErrorType.UPLOAD_FAILED:
                return {
                    message: 'Upload failed',
                    userMessage: 'Unable to upload your file',
                    suggestedActions: [
                        'Check your internet connection',
                        'Ensure the file is not too large',
                        'Try again in a moment',
                        'The upload will retry automatically',
                    ],
                    category: ErrorCategory.NETWORK,
                    retryable: true,
                    severity: 'medium',
                };

            default:
                return {
                    message: 'Unknown mobile error',
                    userMessage: 'An unexpected error occurred',
                    suggestedActions: [
                        'Try again',
                        'Restart the app',
                        'Contact support if this persists',
                    ],
                    category: ErrorCategory.UNKNOWN,
                    retryable: true,
                    severity: 'medium',
                };
        }
    }

    /**
     * Show error feedback to user
     */
    private showErrorFeedback(error: ServiceError): void {
        // Dispatch custom event for UI components to handle
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('mobile-error', {
                    detail: {
                        error,
                        timestamp: new Date(),
                    },
                })
            );
        }
    }

    /**
     * Log error for debugging and monitoring
     */
    private logError(error: ServiceError): void {
        this.errorLog.push({
            error,
            timestamp: new Date(),
        });

        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('[Mobile Error]', {
                code: error.code,
                message: error.message,
                userMessage: error.userMessage,
                category: error.category,
                severity: error.severity,
                context: error.context,
            });
        }
    }

    /**
     * Get recent errors for debugging
     */
    getRecentErrors(): Array<{ error: ServiceError; timestamp: Date }> {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     */
    clearErrorLog(): void {
        this.errorLog = [];
    }

    /**
     * Retry an operation with exponential backoff
     */
    async retryOperation<T>(
        operation: () => Promise<T>,
        options: {
            maxRetries?: number;
            baseDelay?: number;
            operationName: string;
        }
    ): Promise<ServiceResult<T>> {
        const { maxRetries = 3, baseDelay = 1000, operationName } = options;

        try {
            const result = await retryWithBackoff(operation, {
                maxAttempts: maxRetries,
                baseDelay,
                maxDelay: 30000,
                backoffMultiplier: 2,
                onRetry: (attempt, error) => {
                    console.log(`Retry attempt ${attempt} for ${operationName}:`, error.message);
                },
            });

            return {
                success: true,
                data: result,
                timestamp: new Date(),
            };
        } catch (error) {
            const serviceError = this.handleMobileError({
                type: MobileErrorType.SYNC_FAILED,
                operation: operationName,
                originalError: error as Error,
                showToast: true,
            });

            return {
                success: false,
                error: serviceError,
                message: serviceError.userMessage,
                timestamp: new Date(),
            };
        }
    }
}

// ============================================================================
// Permission Request Handler
// ============================================================================

export class PermissionRequestHandler {
    /**
     * Request permission with user-friendly explanation
     */
    static async requestPermission(
        options: PermissionRequestOptions
    ): Promise<{ granted: boolean; error?: ServiceError }> {
        const { permissionType, explanation, required, fallbackAction } = options;

        // Show explanation dialog first
        const userConsent = await this.showPermissionExplanation(permissionType, explanation, required);

        if (!userConsent && !required) {
            // User declined optional permission
            if (fallbackAction) {
                fallbackAction();
            }
            return { granted: false };
        }

        // Request the actual permission
        try {
            let granted = false;

            switch (permissionType) {
                case 'camera':
                    granted = await this.requestCameraPermission();
                    break;
                case 'microphone':
                    granted = await this.requestMicrophonePermission();
                    break;
                case 'location':
                    granted = await this.requestLocationPermission();
                    break;
                case 'notifications':
                    granted = await this.requestNotificationPermission();
                    break;
            }

            if (!granted && required) {
                const error = MobileErrorHandler.getInstance().handleMobileError({
                    type: MobileErrorType.PERMISSION_DENIED,
                    operation: `request_${permissionType}_permission`,
                    showToast: true,
                });

                return { granted: false, error };
            }

            return { granted };
        } catch (error) {
            const serviceError = MobileErrorHandler.getInstance().handleMobileError({
                type: MobileErrorType.PERMISSION_DENIED,
                operation: `request_${permissionType}_permission`,
                originalError: error as Error,
                showToast: true,
            });

            return { granted: false, error: serviceError };
        }
    }

    /**
     * Show permission explanation dialog
     */
    private static async showPermissionExplanation(
        permissionType: string,
        explanation: string,
        required: boolean
    ): Promise<boolean> {
        // Dispatch event for UI to show explanation dialog
        return new Promise((resolve) => {
            if (typeof window !== 'undefined') {
                const handleResponse = (event: CustomEvent) => {
                    window.removeEventListener('permission-response', handleResponse as EventListener);
                    resolve(event.detail.granted);
                };

                window.addEventListener('permission-response', handleResponse as EventListener);

                window.dispatchEvent(
                    new CustomEvent('permission-request', {
                        detail: {
                            permissionType,
                            explanation,
                            required,
                        },
                    })
                );

                // Auto-resolve after timeout if no response
                setTimeout(() => {
                    window.removeEventListener('permission-response', handleResponse as EventListener);
                    resolve(true); // Proceed with permission request
                }, 10000);
            } else {
                resolve(true);
            }
        });
    }

    /**
     * Request camera permission
     */
    private static async requestCameraPermission(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop());
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Request microphone permission
     */
    private static async requestMicrophonePermission(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Request location permission
     */
    private static async requestLocationPermission(): Promise<boolean> {
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                () => resolve(true),
                () => resolve(false),
                { timeout: 5000 }
            );
        });
    }

    /**
     * Request notification permission
     */
    private static async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
}

// ============================================================================
// Fallback Options Provider
// ============================================================================

export class FallbackOptionsProvider {
    /**
     * Get fallback options for camera failure
     */
    static getCameraFallbacks(): FallbackOption[] {
        return [
            {
                label: 'Upload from Gallery',
                description: 'Choose an existing photo from your device',
                action: () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.click();
                },
                icon: 'image',
            },
            {
                label: 'Enter Details Manually',
                description: 'Type property details instead',
                action: () => {
                    window.dispatchEvent(new CustomEvent('show-manual-input'));
                },
                icon: 'edit',
            },
        ];
    }

    /**
     * Get fallback options for microphone failure
     */
    static getMicrophoneFallbacks(): FallbackOption[] {
        return [
            {
                label: 'Type Your Message',
                description: 'Use text input instead of voice',
                action: () => {
                    window.dispatchEvent(new CustomEvent('show-text-input'));
                },
                icon: 'keyboard',
            },
        ];
    }

    /**
     * Get fallback options for location failure
     */
    static getLocationFallbacks(): FallbackOption[] {
        return [
            {
                label: 'Enter Address Manually',
                description: 'Type the address instead',
                action: () => {
                    window.dispatchEvent(new CustomEvent('show-address-input'));
                },
                icon: 'map-pin',
            },
            {
                label: 'Continue Without Location',
                description: 'Proceed without location data',
                action: () => {
                    window.dispatchEvent(new CustomEvent('skip-location'));
                },
                icon: 'skip-forward',
            },
        ];
    }

    /**
     * Get fallback options for network failure
     */
    static getNetworkFallbacks(): FallbackOption[] {
        return [
            {
                label: 'Save for Later',
                description: 'Your action will sync when online',
                action: () => {
                    window.dispatchEvent(new CustomEvent('queue-for-sync'));
                },
                icon: 'cloud-off',
            },
            {
                label: 'View Queued Items',
                description: 'See all pending operations',
                action: () => {
                    window.location.href = '/settings?tab=offline';
                },
                icon: 'list',
            },
        ];
    }
}

// Export singleton instance
export const mobileErrorHandler = MobileErrorHandler.getInstance();
