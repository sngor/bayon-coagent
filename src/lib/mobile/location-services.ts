/**
 * Location Services Module
 * 
 * Provides location-based features for mobile agents:
 * - Location-based reminders for appointments
 * - Proximity notifications using geofencing
 * - One-tap navigation integration
 * - Arrival detection with property information
 * - Check-in logging with location and timestamp
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { deviceAPI } from './device-apis';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface Appointment {
    id: string;
    title: string;
    propertyId?: string;
    clientName?: string;
    location: LocationCoordinates;
    address: string;
    startTime: Date;
    endTime: Date;
    notes?: string;
}

export interface LocationReminder {
    id: string;
    appointmentId: string;
    location: LocationCoordinates;
    radius: number; // meters
    message: string;
    triggered: boolean;
    createdAt: Date;
}

export interface ProximityNotification {
    id: string;
    appointmentId: string;
    location: LocationCoordinates;
    radius: number; // meters
    message: string;
    sent: boolean;
    sentAt?: Date;
}

export interface CheckIn {
    id: string;
    userId: string;
    appointmentId?: string;
    propertyId?: string;
    location: LocationCoordinates;
    address?: string;
    notes?: string;
    timestamp: Date;
}

export interface GeofenceRegion {
    id: string;
    location: LocationCoordinates;
    radius: number; // meters
    appointmentId: string;
    onEnter?: () => void;
    onExit?: () => void;
}

// ============================================================================
// Location Services Class
// ============================================================================

export class LocationServices {
    private static instance: LocationServices;
    private watchId: number | null = null;
    private geofences: Map<string, GeofenceRegion> = new Map();
    private lastKnownPosition: GeolocationPosition | null = null;
    private proximityCheckInterval: NodeJS.Timeout | null = null;

    private constructor() { }

    static getInstance(): LocationServices {
        if (!LocationServices.instance) {
            LocationServices.instance = new LocationServices();
        }
        return LocationServices.instance;
    }

    // ============================================================================
    // Location Tracking
    // ============================================================================

    /**
     * Start tracking location for proximity notifications
     * Requirement 9.2: Proximity notifications
     */
    startLocationTracking(): void {
        if (this.watchId !== null) {
            console.warn('Location tracking already started');
            return;
        }

        this.watchId = deviceAPI.watchLocation(
            (position) => {
                this.lastKnownPosition = position;
                this.checkProximity(position);
            },
            (error) => {
                console.error('Location tracking error:', error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 30000, // 30 seconds
                timeout: 27000, // 27 seconds
            }
        );

        // Also check proximity every minute as a backup
        this.proximityCheckInterval = setInterval(() => {
            if (this.lastKnownPosition) {
                this.checkProximity(this.lastKnownPosition);
            }
        }, 60000);
    }

    /**
     * Stop tracking location
     */
    stopLocationTracking(): void {
        if (this.watchId !== null) {
            deviceAPI.clearLocationWatch(this.watchId);
            this.watchId = null;
        }

        if (this.proximityCheckInterval) {
            clearInterval(this.proximityCheckInterval);
            this.proximityCheckInterval = null;
        }
    }

    /**
     * Get current location
     */
    async getCurrentLocation(): Promise<LocationCoordinates> {
        const position = await deviceAPI.getCurrentLocation();
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
        };
    }

    // ============================================================================
    // Geofencing
    // ============================================================================

    /**
     * Add a geofence region for an appointment
     * Requirement 9.2: Proximity notifications using geofencing
     */
    addGeofence(region: GeofenceRegion): void {
        this.geofences.set(region.id, region);
    }

    /**
     * Remove a geofence region
     */
    removeGeofence(id: string): void {
        this.geofences.delete(id);
    }

    /**
     * Clear all geofences
     */
    clearGeofences(): void {
        this.geofences.clear();
    }

    /**
     * Check if current position is within any geofence
     */
    private checkProximity(position: GeolocationPosition): void {
        const currentLocation: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
        };

        this.geofences.forEach((geofence) => {
            const distance = this.calculateDistance(
                currentLocation,
                geofence.location
            );

            // Check if within geofence radius
            if (distance <= geofence.radius) {
                if (geofence.onEnter) {
                    geofence.onEnter();
                }
            }
        });
    }

    // ============================================================================
    // Location-Based Reminders
    // ============================================================================

    /**
     * Create location-based reminder for an appointment
     * Requirement 9.1: Location-based reminders
     */
    async createLocationReminder(
        appointment: Appointment,
        radiusMeters: number = 500
    ): Promise<LocationReminder> {
        const reminder: LocationReminder = {
            id: `reminder-${appointment.id}-${Date.now()}`,
            appointmentId: appointment.id,
            location: appointment.location,
            radius: radiusMeters,
            message: `You're near ${appointment.title}`,
            triggered: false,
            createdAt: new Date(),
        };

        // Add geofence for this reminder
        this.addGeofence({
            id: reminder.id,
            location: appointment.location,
            radius: radiusMeters,
            appointmentId: appointment.id,
            onEnter: () => {
                this.triggerReminder(reminder, appointment);
            },
        });

        return reminder;
    }

    /**
     * Trigger a location reminder
     */
    private async triggerReminder(
        reminder: LocationReminder,
        appointment: Appointment
    ): Promise<void> {
        if (reminder.triggered) {
            return;
        }

        reminder.triggered = true;

        // Send notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(reminder.message, {
                body: `${appointment.address}\n${appointment.startTime.toLocaleTimeString()}`,
                icon: '/icon-192x192.svg',
                tag: reminder.id,
            });
        }

        // Store in localStorage for persistence
        this.saveTriggeredReminder(reminder);
    }

    /**
     * Save triggered reminder to localStorage
     */
    private saveTriggeredReminder(reminder: LocationReminder): void {
        try {
            const key = 'triggered-reminders';
            const existing = localStorage.getItem(key);
            const reminders = existing ? JSON.parse(existing) : [];
            reminders.push({
                ...reminder,
                triggeredAt: new Date().toISOString(),
            });
            localStorage.setItem(key, JSON.stringify(reminders));
        } catch (error) {
            console.error('Failed to save triggered reminder:', error);
        }
    }

    // ============================================================================
    // Proximity Notifications
    // ============================================================================

    /**
     * Setup proximity notification for an appointment
     * Requirement 9.2: Proximity notifications
     */
    async setupProximityNotification(
        appointment: Appointment,
        radiusMeters: number = 200
    ): Promise<ProximityNotification> {
        const notification: ProximityNotification = {
            id: `proximity-${appointment.id}-${Date.now()}`,
            appointmentId: appointment.id,
            location: appointment.location,
            radius: radiusMeters,
            message: `Arriving at ${appointment.title}`,
            sent: false,
        };

        // Add geofence for proximity notification
        this.addGeofence({
            id: notification.id,
            location: appointment.location,
            radius: radiusMeters,
            appointmentId: appointment.id,
            onEnter: () => {
                this.sendProximityNotification(notification, appointment);
            },
        });

        return notification;
    }

    /**
     * Send proximity notification
     */
    private async sendProximityNotification(
        notification: ProximityNotification,
        appointment: Appointment
    ): Promise<void> {
        if (notification.sent) {
            return;
        }

        notification.sent = true;
        notification.sentAt = new Date();

        // Request notification permission if needed
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }

            if (Notification.permission === 'granted') {
                new Notification(notification.message, {
                    body: `You've arrived at ${appointment.address}`,
                    icon: '/icon-192x192.svg',
                    tag: notification.id,
                });
            }
        }
    }

    // ============================================================================
    // Navigation Integration
    // ============================================================================

    /**
     * Open device navigation app with destination
     * Requirement 9.3: One-tap navigation integration
     */
    openNavigation(destination: LocationCoordinates, address?: string): void {
        const { latitude, longitude } = destination;

        // Try different navigation apps based on platform
        if (deviceAPI.isIOS()) {
            // iOS: Try Apple Maps first, fallback to Google Maps
            const appleMapsUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}`;
            const googleMapsUrl = `https://maps.google.com/maps?daddr=${latitude},${longitude}`;

            // Try Apple Maps
            window.location.href = appleMapsUrl;

            // Fallback to Google Maps after a delay
            setTimeout(() => {
                window.location.href = googleMapsUrl;
            }, 500);
        } else if (deviceAPI.isAndroid()) {
            // Android: Use Google Maps intent
            const googleMapsUrl = `google.navigation:q=${latitude},${longitude}`;
            window.location.href = googleMapsUrl;
        } else {
            // Desktop or unknown: Open Google Maps in browser
            const url = address
                ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
                : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            window.open(url, '_blank');
        }
    }

    /**
     * Get navigation URL for sharing
     */
    getNavigationUrl(destination: LocationCoordinates, address?: string): string {
        const { latitude, longitude } = destination;
        return address
            ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
            : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }

    // ============================================================================
    // Arrival Detection
    // ============================================================================

    /**
     * Detect arrival at appointment location
     * Requirement 9.4: Arrival detection with property information display
     */
    async detectArrival(
        appointment: Appointment,
        arrivalRadiusMeters: number = 50
    ): Promise<boolean> {
        try {
            const currentLocation = await this.getCurrentLocation();
            const distance = this.calculateDistance(
                currentLocation,
                appointment.location
            );

            return distance <= arrivalRadiusMeters;
        } catch (error) {
            console.error('Failed to detect arrival:', error);
            return false;
        }
    }

    /**
     * Setup arrival detection for an appointment
     */
    setupArrivalDetection(
        appointment: Appointment,
        onArrival: (appointment: Appointment) => void,
        radiusMeters: number = 50
    ): void {
        this.addGeofence({
            id: `arrival-${appointment.id}`,
            location: appointment.location,
            radius: radiusMeters,
            appointmentId: appointment.id,
            onEnter: () => {
                onArrival(appointment);
            },
        });
    }

    // ============================================================================
    // Check-In Logging
    // ============================================================================

    /**
     * Log check-in at current location
     * Requirement 9.5: Check-in logging with location and timestamp
     */
    async checkIn(
        userId: string,
        appointmentId?: string,
        propertyId?: string,
        notes?: string
    ): Promise<CheckIn> {
        const location = await this.getCurrentLocation();
        const address = await this.reverseGeocode(location);

        const checkIn: CheckIn = {
            id: `checkin-${Date.now()}`,
            userId,
            appointmentId,
            propertyId,
            location,
            address,
            notes,
            timestamp: new Date(),
        };

        // Store check-in locally
        this.saveCheckIn(checkIn);

        return checkIn;
    }

    /**
     * Save check-in to localStorage
     */
    private saveCheckIn(checkIn: CheckIn): void {
        try {
            const key = 'check-ins';
            const existing = localStorage.getItem(key);
            const checkIns = existing ? JSON.parse(existing) : [];
            checkIns.push(checkIn);
            localStorage.setItem(key, JSON.stringify(checkIns));
        } catch (error) {
            console.error('Failed to save check-in:', error);
        }
    }

    /**
     * Get all check-ins for a user
     */
    getCheckIns(userId: string): CheckIn[] {
        try {
            const key = 'check-ins';
            const existing = localStorage.getItem(key);
            if (!existing) return [];

            const checkIns = JSON.parse(existing);
            return checkIns.filter((c: CheckIn) => c.userId === userId);
        } catch (error) {
            console.error('Failed to get check-ins:', error);
            return [];
        }
    }

    // ============================================================================
    // Utility Functions
    // ============================================================================

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in meters
     */
    calculateDistance(
        coord1: LocationCoordinates,
        coord2: LocationCoordinates
    ): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (coord1.latitude * Math.PI) / 180;
        const φ2 = (coord2.latitude * Math.PI) / 180;
        const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
        const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Reverse geocode coordinates to address
     * Note: This requires a geocoding service API
     */
    private async reverseGeocode(
        location: LocationCoordinates
    ): Promise<string | undefined> {
        try {
            // This would typically call a geocoding API like Google Maps Geocoding API
            // For now, return undefined and let the caller handle it
            return undefined;
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return undefined;
        }
    }

    /**
     * Format distance for display
     */
    formatDistance(meters: number): string {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    }

    /**
     * Check if location services are available and enabled
     */
    isLocationAvailable(): boolean {
        return deviceAPI.hasLocationSupport();
    }

    /**
     * Request location permission
     */
    async requestLocationPermission(): Promise<boolean> {
        return deviceAPI.requestLocationPermission();
    }
}

// Export singleton instance
export const locationServices = LocationServices.getInstance();
