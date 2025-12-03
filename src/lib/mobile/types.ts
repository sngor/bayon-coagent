/**
 * Mobile Agent Features Type Definitions
 * 
 * TypeScript types for mobile-specific entities and operations.
 */

/**
 * Mobile Capture Types
 */
export type CaptureType = 'photo' | 'voice' | 'text';

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export interface PropertyPhotoAnalysis {
    propertyType: string;
    features: string[];
    condition: 'excellent' | 'good' | 'fair' | 'needs work';
    suggestedPrice?: number;
    marketingHighlights: string[];
    improvements: string[];
}

export interface MobileCapture {
    id: string;
    userId: string;
    type: CaptureType;
    content: string; // S3 URL for media, text for text captures
    transcription?: string; // For voice captures
    analysis?: PropertyPhotoAnalysis; // For photo captures
    location?: LocationCoordinates;
    timestamp: number;
    processed: boolean;
    generatedContentId?: string; // Link to generated content
    createdAt: string;
    updatedAt: string;
}

/**
 * Quick Action Types
 */
export interface QuickAction {
    id: string;
    userId: string;
    actionType: string;
    label: string;
    icon: string;
    route?: string;
    config: Record<string, any>;
    usageCount: number;
    lastUsed: number;
    isPinned: boolean;
    createdAt: string;
}

/**
 * Property Share Types
 */
export type ShareMethod = 'qr' | 'sms' | 'email' | 'social';

export interface PropertyShare {
    id: string;
    userId: string;
    propertyId: string;
    method: ShareMethod;
    recipient?: string;
    trackingUrl: string;
    qrCodeUrl?: string;
    views: number;
    clicks: number;
    lastViewed?: number;
    createdAt: string;
    expiresAt: string;
}

export interface EngagementMetrics {
    shareId: string;
    views: number;
    clicks: number;
    uniqueVisitors: number;
    lastViewed?: number;
    averageTimeOnPage?: number;
}

/**
 * Voice Note Types
 */
export interface VoiceNote {
    id: string;
    userId: string;
    propertyId?: string;
    audioUrl: string; // S3 URL
    transcription: string;
    duration: number; // seconds
    location?: LocationCoordinates;
    timestamp: number;
    createdAt: string;
}

/**
 * Location Check-In Types
 */
export interface LocationCheckIn {
    id: string;
    userId: string;
    propertyId?: string;
    appointmentId?: string;
    location: LocationCoordinates;
    address?: string;
    notes?: string;
    timestamp: number;
    createdAt: string;
}

/**
 * Offline Queue Types
 */
export type OperationType =
    | 'create_capture'
    | 'create_voice_note'
    | 'create_check_in'
    | 'update_property'
    | 'create_content'
    | 'send_share';

export type OperationStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export interface OfflineOperation {
    id: string;
    userId: string;
    type: OperationType;
    data: any;
    status: OperationStatus;
    retryCount: number;
    error?: string;
    createdAt: number;
    syncedAt?: number;
}

/**
 * Device API Types
 */
export interface CameraOptions {
    quality?: number; // 0-1
    maxWidth?: number;
    maxHeight?: number;
    facingMode?: 'user' | 'environment';
}

export interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

/**
 * Quick Share Types
 */
export interface ShareOptions {
    propertyId: string;
    method: ShareMethod;
    recipient?: string;
    customMessage?: string;
}

export interface ShareResult {
    success: boolean;
    shareId: string;
    trackingUrl: string;
    qrCodeUrl?: string;
    error?: string;
}

/**
 * PWA Types
 */
export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
    actions?: NotificationAction[];
}

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

/**
 * Market Data Types
 */
export interface MarketDataCard {
    id: string;
    propertyId: string;
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    photos: string[];
    status: string;
    daysOnMarket: number;
}

export interface ComparisonReport {
    id: string;
    userId: string;
    properties: MarketDataCard[];
    generatedAt: string;
    pdfUrl?: string;
}

/**
 * Content Creation Types
 */
export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter';

export interface ContentTemplate {
    id: string;
    name: string;
    platform: Platform;
    layout: 'vertical' | 'horizontal' | 'square';
    elements: TemplateElement[];
}

export interface TemplateElement {
    type: 'text' | 'image' | 'logo' | 'property-data';
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: Record<string, any>;
    dataBinding?: string;
}

export interface PlatformPreview {
    platform: Platform;
    previewUrl: string;
    dimensions: { width: number; height: number };
}

/**
 * Location Services Types
 */
export interface LocationReminder {
    id: string;
    userId: string;
    appointmentId: string;
    location: LocationCoordinates;
    radius: number; // meters
    message: string;
    triggered: boolean;
    createdAt: string;
}

export interface ProximityNotification {
    id: string;
    appointmentId: string;
    propertyId: string;
    distance: number; // meters
    estimatedArrival: number; // minutes
}

/**
 * Lead Response Types
 */
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Lead {
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    source: string;
    priority: LeadPriority;
    qualityScore: number;
    message?: string;
    propertyInterest?: string;
    createdAt: string;
    respondedAt?: string;
}

export interface QuickResponseTemplate {
    id: string;
    name: string;
    type: 'sms' | 'email';
    subject?: string; // For email
    body: string;
    variables: string[]; // e.g., ['name', 'property', 'time']
}

export interface LeadInteraction {
    id: string;
    leadId: string;
    userId: string;
    type: 'call' | 'sms' | 'email' | 'meeting';
    notes?: string;
    followUpDate?: string;
    createdAt: string;
}

/**
 * Performance Optimization Types
 */
export interface ImageLoadingState {
    src: string;
    loaded: boolean;
    error?: string;
    placeholder?: string;
}

export interface PrefetchConfig {
    routes: string[];
    priority: 'high' | 'low';
    condition?: () => boolean;
}

export interface CancellableOperation<T> {
    promise: Promise<T>;
    cancel: () => void;
    status: 'pending' | 'completed' | 'cancelled';
}
