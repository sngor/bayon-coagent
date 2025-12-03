/**
 * Analytics Integration Examples
 * 
 * Examples of how to integrate mobile analytics into existing mobile features.
 */

import {
    getMobileAnalytics,
    useMobileAnalytics,
    useQuickCaptureAnalytics,
    useQuickActionsAnalytics,
    useShareAnalytics,
    useVoiceNotesAnalytics,
    useLocationAnalytics,
} from './analytics';

// ============================================================================
// Example 1: Quick Capture Integration
// ============================================================================

/**
 * Example: Integrating analytics into quick capture component
 */
export function QuickCaptureExample() {
    const { trackCaptureStart } = useQuickCaptureAnalytics();

    const handlePhotoCapture = async () => {
        const capture = trackCaptureStart('photo');

        try {
            // Existing capture logic
            const photo = await capturePhoto();
            const analysis = await analyzePhoto(photo);

            // Track success with metadata
            capture.success({
                photoSize: photo.size,
                analysisTime: analysis.duration,
                featuresDetected: analysis.features.length,
                propertyType: analysis.propertyType,
            });
        } catch (error) {
            // Track error
            capture.error(error as Error);
        }
    };

    const handleVoiceCapture = async () => {
        const capture = trackCaptureStart('voice');

        try {
            const audio = await recordAudio();
            const transcription = await transcribeAudio(audio);

            capture.success({
                duration: audio.duration,
                transcriptionLength: transcription.length,
                confidence: transcription.confidence,
            });
        } catch (error) {
            capture.error(error as Error);
        }
    };

    return null; // Component JSX
}

// ============================================================================
// Example 2: Quick Actions Integration
// ============================================================================

/**
 * Example: Integrating analytics into quick actions
 */
export function QuickActionsExample() {
    const { trackActionStart } = useQuickActionsAnalytics();

    const executeAction = async (actionType: string) => {
        const action = trackActionStart(actionType);

        try {
            // Existing action execution logic
            const result = await performAction(actionType);

            action.success({
                resultType: result.type,
                itemsProcessed: result.count,
            });
        } catch (error) {
            action.error(error as Error);
        }
    };

    return null; // Component JSX
}

// ============================================================================
// Example 3: Quick Share Integration
// ============================================================================

/**
 * Example: Integrating analytics into quick share
 */
export function QuickShareExample({ propertyId }: { propertyId: string }) {
    const { trackShareStart } = useShareAnalytics();

    const handleQRShare = async () => {
        const share = trackShareStart('qr', propertyId);

        try {
            const qrCode = await generateQRCode(propertyId);

            share.success({
                qrCodeSize: qrCode.size,
                format: qrCode.format,
            });
        } catch (error) {
            share.error(error as Error);
        }
    };

    const handleSMSShare = async (phoneNumber: string) => {
        const share = trackShareStart('sms', propertyId);

        try {
            const result = await sendSMS(phoneNumber, propertyId);

            share.success({
                messageLength: result.messageLength,
                trackingUrl: result.trackingUrl,
            });
        } catch (error) {
            share.error(error as Error);
        }
    };

    return null; // Component JSX
}

// ============================================================================
// Example 4: Voice Notes Integration
// ============================================================================

/**
 * Example: Integrating analytics into voice notes
 */
export function VoiceNotesExample({ propertyId }: { propertyId?: string }) {
    const { trackVoiceNoteStart } = useVoiceNotesAnalytics();

    const handleRecording = async () => {
        const recording = trackVoiceNoteStart();

        try {
            const audio = await recordAudio();
            const transcription = await transcribeAudio(audio);

            if (propertyId) {
                await attachToProperty(propertyId, audio, transcription);
            }

            recording.success(true, propertyId);
        } catch (error) {
            recording.error(error as Error, propertyId);
        }
    };

    return null; // Component JSX
}

// ============================================================================
// Example 5: Location Services Integration
// ============================================================================

/**
 * Example: Integrating analytics into location services
 */
export function LocationServicesExample() {
    const { trackLocationAction, trackLocationError } = useLocationAnalytics();

    const handleCheckIn = async (propertyId: string) => {
        try {
            const location = await getCurrentLocation();
            await logCheckIn(propertyId, location);

            trackLocationAction('check-in', {
                propertyId,
                accuracy: location.accuracy,
            });
        } catch (error) {
            trackLocationError(error as Error, 'check-in');
        }
    };

    const handleNavigation = async (address: string) => {
        try {
            await openNavigation(address);

            trackLocationAction('navigation', {
                address,
            });
        } catch (error) {
            trackLocationError(error as Error, 'navigation');
        }
    };

    return null; // Component JSX
}

// ============================================================================
// Example 6: Offline Queue Integration
// ============================================================================

/**
 * Example: Integrating analytics into offline queue
 */
export class OfflineQueueWithAnalytics {
    private analytics = getMobileAnalytics();

    async add(operation: any) {
        try {
            await this.store.add(operation);

            // Track queue size after adding
            const queueSize = await this.getQueueSize();
            this.analytics.trackOfflineQueueSize(queueSize);

            this.analytics.trackFeatureUsage('offline-queue', 'operation-queued', {
                operationType: operation.type,
            });
        } catch (error) {
            this.analytics.trackError('offline-queue', error as Error, {
                operation: 'add',
            });
        }
    }

    async sync() {
        const operation = this.analytics.trackOperation('offline-sync');

        try {
            const items = await this.store.getAll();
            const results = await this.syncItems(items);

            operation.success({
                itemsSynced: results.success,
                itemsFailed: results.failed,
            });

            // Track queue size after sync
            const queueSize = await this.getQueueSize();
            this.analytics.trackOfflineQueueSize(queueSize);
        } catch (error) {
            operation.error(error as Error);
        }
    }

    private async getQueueSize(): Promise<number> {
        return await this.store.count();
    }

    private store: any; // Your actual store implementation
    private syncItems(items: any[]): Promise<{ success: number; failed: number }> {
        // Your sync implementation
        return Promise.resolve({ success: items.length, failed: 0 });
    }
}

// ============================================================================
// Example 7: Error Boundary Integration
// ============================================================================

/**
 * Example: Mobile error boundary with analytics
 */
import { Component, ReactNode } from 'react';
import { trackMobileError, type MobileFeature } from './analytics';

export class MobileErrorBoundary extends Component<
    { feature: MobileFeature; children: ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        trackMobileError(this.props.feature, error, {
            componentStack: errorInfo.componentStack,
            boundary: 'MobileErrorBoundary',
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className= "p-4 text-center" >
                <h2 className="text-lg font-semibold mb-2" > Something went wrong </h2>
                    < p className = "text-sm text-muted-foreground" >
                        We've been notified and are working on a fix.
                            </p>
                            </div>
      );
        }
        return this.props.children;
    }
}

// ============================================================================
// Example 8: Performance Tracking Integration
// ============================================================================

/**
 * Example: Page-level performance tracking
 */
import { usePerformanceTracking } from './use-mobile-analytics';

export function MobilePageExample() {
    // Automatically track page load performance
    usePerformanceTracking('quick-capture-page');

    return null; // Component JSX
}

// ============================================================================
// Example 9: Custom Timing Integration
// ============================================================================

/**
 * Example: Tracking custom operation timing
 */
export async function performExpensiveOperation() {
    const analytics = getMobileAnalytics();
    const startTime = Date.now();

    try {
        // Perform operation
        const result = await expensiveOperation();

        const duration = Date.now() - startTime;
        analytics.trackCustomTiming('expensive-operation', duration, {
            resultSize: result.size,
            itemsProcessed: result.count,
        });

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        analytics.trackError('mobile-content', error as Error, {
            operation: 'expensive-operation',
            duration,
        });
        throw error;
    }
}

// ============================================================================
// Example 10: Engagement Tracking Integration
// ============================================================================

/**
 * Example: Tracking content creation engagement
 */
export function ContentCreationExample() {
    const analytics = getMobileAnalytics();

    const handleContentCreation = async (captureType: 'photo' | 'voice' | 'text') => {
        const startTime = Date.now();

        try {
            const content = await createContent(captureType);
            const duration = Date.now() - startTime;

            analytics.trackContentCreation(captureType, true, duration, {
                contentLength: content.length,
                contentType: content.type,
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            analytics.trackContentCreation(captureType, false, duration);
        }
    };

    return null; // Component JSX
}

// ============================================================================
// Helper Functions (Placeholders)
// ============================================================================

async function capturePhoto(): Promise<any> {
    return { size: 1024000 };
}

async function analyzePhoto(photo: any): Promise<any> {
    return {
        duration: 1000,
        features: ['pool', 'garage'],
        propertyType: 'residential',
    };
}

async function recordAudio(): Promise<any> {
    return { duration: 30000 };
}

async function transcribeAudio(audio: any): Promise<any> {
    return {
        text: 'Transcribed text',
        length: 100,
        confidence: 0.95,
    };
}

async function performAction(actionType: string): Promise<any> {
    return { type: 'success', count: 1 };
}

async function generateQRCode(propertyId: string): Promise<any> {
    return { size: 512, format: 'png' };
}

async function sendSMS(phoneNumber: string, propertyId: string): Promise<any> {
    return { messageLength: 160, trackingUrl: 'https://...' };
}

async function attachToProperty(propertyId: string, audio: any, transcription: any): Promise<void> {
    // Implementation
}

async function getCurrentLocation(): Promise<any> {
    return { latitude: 0, longitude: 0, accuracy: 10 };
}

async function logCheckIn(propertyId: string, location: any): Promise<void> {
    // Implementation
}

async function openNavigation(address: string): Promise<void> {
    // Implementation
}

async function expensiveOperation(): Promise<any> {
    return { size: 1000, count: 100 };
}

async function createContent(captureType: string): Promise<any> {
    return { length: 500, type: captureType };
}
