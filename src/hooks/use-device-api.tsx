'use client';

/**
 * Device API Hook
 * 
 * React hook for device API functionality:
 * - Camera access
 * - Microphone access
 * - Location access
 * - Permission management
 * 
 * Requirements: 6.1, 6.5, 7.3, 10.1
 */

import { useState, useEffect, useCallback } from 'react';
import { deviceAPI, CameraOptions, AudioOptions, LocationOptions } from '@/lib/mobile/device-apis';

export interface DeviceCapabilities {
    hasCamera: boolean;
    hasMicrophone: boolean;
    hasLocation: boolean;
    hasShare: boolean;
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
}

export interface UseDeviceAPIReturn {
    capabilities: DeviceCapabilities;
    capturePhoto: (options?: CameraOptions) => Promise<File>;
    startVideoRecording: (options?: CameraOptions) => Promise<MediaStream>;
    startVoiceRecording: (options?: AudioOptions) => Promise<MediaRecorder>;
    getCurrentLocation: (options?: LocationOptions) => Promise<GeolocationPosition>;
    watchLocation: (
        callback: (position: GeolocationPosition) => void,
        errorCallback?: (error: GeolocationPositionError) => void,
        options?: LocationOptions
    ) => number;
    clearLocationWatch: (watchId: number) => void;
    requestCameraPermission: () => Promise<boolean>;
    requestMicrophonePermission: () => Promise<boolean>;
    requestLocationPermission: () => Promise<boolean>;
}

export function useDeviceAPI(): UseDeviceAPIReturn {
    const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
        hasCamera: false,
        hasMicrophone: false,
        hasLocation: false,
        hasShare: false,
        isMobile: false,
        isIOS: false,
        isAndroid: false,
    });

    useEffect(() => {
        // Check capabilities
        setCapabilities({
            hasCamera: deviceAPI.hasCameraSupport(),
            hasMicrophone: deviceAPI.hasMicrophoneSupport(),
            hasLocation: deviceAPI.hasLocationSupport(),
            hasShare: deviceAPI.hasShareSupport(),
            isMobile: deviceAPI.isMobile(),
            isIOS: deviceAPI.isIOS(),
            isAndroid: deviceAPI.isAndroid(),
        });
    }, []);

    const capturePhoto = useCallback(async (options?: CameraOptions) => {
        return await deviceAPI.capturePhoto(options);
    }, []);

    const startVideoRecording = useCallback(async (options?: CameraOptions) => {
        return await deviceAPI.startVideoRecording(options);
    }, []);

    const startVoiceRecording = useCallback(async (options?: AudioOptions) => {
        return await deviceAPI.startVoiceRecording(options);
    }, []);

    const getCurrentLocation = useCallback(async (options?: LocationOptions) => {
        return await deviceAPI.getCurrentLocation(options);
    }, []);

    const watchLocation = useCallback((
        callback: (position: GeolocationPosition) => void,
        errorCallback?: (error: GeolocationPositionError) => void,
        options?: LocationOptions
    ) => {
        return deviceAPI.watchLocation(callback, errorCallback, options);
    }, []);

    const clearLocationWatch = useCallback((watchId: number) => {
        deviceAPI.clearLocationWatch(watchId);
    }, []);

    const requestCameraPermission = useCallback(async () => {
        return await deviceAPI.requestCameraPermission();
    }, []);

    const requestMicrophonePermission = useCallback(async () => {
        return await deviceAPI.requestMicrophonePermission();
    }, []);

    const requestLocationPermission = useCallback(async () => {
        return await deviceAPI.requestLocationPermission();
    }, []);

    return {
        capabilities,
        capturePhoto,
        startVideoRecording,
        startVoiceRecording,
        getCurrentLocation,
        watchLocation,
        clearLocationWatch,
        requestCameraPermission,
        requestMicrophonePermission,
        requestLocationPermission,
    };
}
