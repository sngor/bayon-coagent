/**
 * Device API Service
 * 
 * Provides a unified interface for accessing device capabilities:
 * - Camera (photo capture, video recording)
 * - Microphone (audio recording, transcription)
 * - Location (GPS, geofencing)
 * - Permissions management
 * 
 * Requirements: 6.1, 6.5, 7.3, 10.1
 */

export interface CameraOptions {
    facingMode?: 'user' | 'environment';
    width?: number;
    height?: number;
    quality?: number; // 0-1
}

export interface AudioOptions {
    mimeType?: string;
    audioBitsPerSecond?: number;
}

export interface LocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

export class DeviceAPIService {
    private static instance: DeviceAPIService;

    private constructor() { }

    static getInstance(): DeviceAPIService {
        if (!DeviceAPIService.instance) {
            DeviceAPIService.instance = new DeviceAPIService();
        }
        return DeviceAPIService.instance;
    }

    // ============================================================================
    // Camera APIs
    // ============================================================================

    /**
     * Capture a photo using the device camera
     */
    async capturePhoto(options: CameraOptions = {}): Promise<File> {
        if (!this.hasCameraSupport()) {
            const error = new Error('Camera not supported on this device');
            error.name = 'HardwareUnavailable';
            throw error;
        }

        const hasPermission = await this.requestCameraPermission();
        if (!hasPermission) {
            const error = new Error('Camera permission denied');
            error.name = 'PermissionDenied';
            throw error;
        }

        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';

            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    resolve(file);
                } else {
                    reject(new Error('No file selected'));
                }
            };

            input.onerror = () => {
                const error = new Error('Camera capture failed');
                error.name = 'CameraFailed';
                reject(error);
            };

            input.click();
        });
    }

    /**
     * Start video recording
     */
    async startVideoRecording(options: CameraOptions = {}): Promise<MediaStream> {
        if (!this.hasCameraSupport()) {
            const error = new Error('Camera not supported on this device');
            error.name = 'HardwareUnavailable';
            throw error;
        }

        const hasPermission = await this.requestCameraPermission();
        if (!hasPermission) {
            const error = new Error('Camera permission denied');
            error.name = 'PermissionDenied';
            throw error;
        }

        const constraints: MediaStreamConstraints = {
            video: {
                facingMode: options.facingMode || 'environment',
                width: options.width,
                height: options.height,
            },
        };

        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            const err = new Error('Failed to start video recording');
            err.name = 'CameraFailed';
            throw err;
        }
    }

    // ============================================================================
    // Microphone APIs
    // ============================================================================

    /**
     * Start voice recording
     */
    async startVoiceRecording(options: AudioOptions = {}): Promise<MediaRecorder> {
        if (!this.hasMicrophoneSupport()) {
            const error = new Error('Microphone not supported on this device');
            error.name = 'HardwareUnavailable';
            throw error;
        }

        const hasPermission = await this.requestMicrophonePermission();
        if (!hasPermission) {
            const error = new Error('Microphone permission denied');
            error.name = 'PermissionDenied';
            throw error;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mimeType = options.mimeType || this.getSupportedAudioMimeType();
            const recorder = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: options.audioBitsPerSecond || 128000,
            });

            return recorder;
        } catch (error) {
            const err = new Error('Failed to start voice recording');
            err.name = 'MicrophoneFailed';
            throw err;
        }
    }

    /**
     * Transcribe audio using Web Speech API (for real-time transcription)
     * Note: For server-side transcription, use AWS Transcribe
     */
    async transcribeAudio(audioBlob: Blob): Promise<string> {
        // This is a placeholder for client-side transcription
        // In production, this should call AWS Transcribe via API
        throw new Error('Client-side transcription not implemented. Use AWS Transcribe service.');
    }

    /**
     * Get supported audio MIME type for recording
     */
    private getSupportedAudioMimeType(): string {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'audio/webm'; // fallback
    }

    // ============================================================================
    // Location APIs
    // ============================================================================

    /**
     * Get current location
     */
    async getCurrentLocation(options: LocationOptions = {}): Promise<GeolocationPosition> {
        if (!this.hasLocationSupport()) {
            const error = new Error('Geolocation not supported on this device');
            error.name = 'HardwareUnavailable';
            throw error;
        }

        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
            const error = new Error('Location permission denied');
            error.name = 'PermissionDenied';
            throw error;
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                (error) => {
                    const err = new Error(error.message || 'Failed to get location');
                    err.name = 'LocationFailed';
                    reject(err);
                },
                {
                    enableHighAccuracy: options.enableHighAccuracy ?? true,
                    timeout: options.timeout ?? 10000,
                    maximumAge: options.maximumAge ?? 0,
                }
            );
        });
    }

    /**
     * Watch location changes
     */
    watchLocation(
        callback: (position: GeolocationPosition) => void,
        errorCallback?: (error: GeolocationPositionError) => void,
        options: LocationOptions = {}
    ): number {
        if (!this.hasLocationSupport()) {
            throw new Error('Geolocation not supported on this device');
        }

        return navigator.geolocation.watchPosition(
            callback,
            errorCallback,
            {
                enableHighAccuracy: options.enableHighAccuracy ?? true,
                timeout: options.timeout ?? 10000,
                maximumAge: options.maximumAge ?? 0,
            }
        );
    }

    /**
     * Clear location watch
     */
    clearLocationWatch(watchId: number): void {
        navigator.geolocation.clearWatch(watchId);
    }

    // ============================================================================
    // Permission Management
    // ============================================================================

    /**
     * Request camera permission
     */
    async requestCameraPermission(): Promise<boolean> {
        try {
            if (!navigator.permissions) {
                // Fallback: try to access camera directly
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                return true;
            }

            const result = await navigator.permissions.query({ name: 'camera' as PermissionName });

            if (result.state === 'granted') {
                return true;
            }

            if (result.state === 'prompt') {
                // Trigger permission prompt by requesting camera
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                return true;
            }

            return false;
        } catch (error) {
            console.error('Camera permission error:', error);
            return false;
        }
    }

    /**
     * Request microphone permission
     */
    async requestMicrophonePermission(): Promise<boolean> {
        try {
            if (!navigator.permissions) {
                // Fallback: try to access microphone directly
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                return true;
            }

            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });

            if (result.state === 'granted') {
                return true;
            }

            if (result.state === 'prompt') {
                // Trigger permission prompt by requesting microphone
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                return true;
            }

            return false;
        } catch (error) {
            console.error('Microphone permission error:', error);
            return false;
        }
    }

    /**
     * Request location permission
     */
    async requestLocationPermission(): Promise<boolean> {
        try {
            if (!navigator.permissions) {
                // Fallback: try to get location directly
                await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                return true;
            }

            const result = await navigator.permissions.query({ name: 'geolocation' });

            if (result.state === 'granted') {
                return true;
            }

            if (result.state === 'prompt') {
                // Trigger permission prompt by requesting location
                await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('Location permission error:', error);
            return false;
        }
    }

    // ============================================================================
    // Capability Detection
    // ============================================================================

    /**
     * Check if camera is supported
     */
    hasCameraSupport(): boolean {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
        );
    }

    /**
     * Check if microphone is supported
     */
    hasMicrophoneSupport(): boolean {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            typeof MediaRecorder !== 'undefined'
        );
    }

    /**
     * Check if location is supported
     */
    hasLocationSupport(): boolean {
        return 'geolocation' in navigator;
    }

    /**
     * Check if Web Share API is supported
     */
    hasShareSupport(): boolean {
        return 'share' in navigator;
    }

    /**
     * Check if device is mobile
     */
    isMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    /**
     * Check if device is iOS
     */
    isIOS(): boolean {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    /**
     * Check if device is Android
     */
    isAndroid(): boolean {
        return /Android/.test(navigator.userAgent);
    }
}

// Export singleton instance
export const deviceAPI = DeviceAPIService.getInstance();
