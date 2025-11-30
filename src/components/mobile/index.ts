/**
 * Mobile Components Index
 * 
 * Central export point for all mobile-specific components.
 * Follows existing component patterns and uses mobile optimization utilities.
 */

// Quick Capture
export { QuickCapture } from './quick-capture';
export type { CapturedPhoto, QuickCaptureProps } from './quick-capture';

// Voice Memo
export { VoiceMemo } from './voice-memo';
export type { AudioRecording, GeneratedContent, VoiceMemoProps } from './voice-memo';

// Content Management
export { ContentManagement } from './content-management';
export { ContentTypeSelector } from './content-type-selector';

// Push Notifications
export { default as NotificationPreferences } from './notification-preferences';
export { default as InAppNotifications, NotificationBadge, useInAppNotifications } from './in-app-notifications';

// Property Comparison
export { PropertyComparison } from './property-comparison';
export { default as PropertyComparisonDemo } from './property-comparison-demo';
export type { Property, SavedComparison, PropertyComparisonProps } from './property-comparison';

// Market Stats
export { MarketStats, default as MarketStatsComponent } from './market-stats';
export { default as MarketStatsTest } from './market-stats-test';
export type { MarketStats as MarketStatsType, MarketStatsProps } from './market-stats';

// Meeting Prep
export { default as MeetingPrep, MeetingPrepForm, MeetingMaterialsDisplay } from './meeting-prep';
export type { MeetingPrepProps, MeetingPrepRequest, MeetingMaterials } from './meeting-prep';

// Open House Check-in
export { default as OpenHouseCheckin } from './open-house-checkin';
export type { OpenHouseCheckinProps, Visitor, OpenHouseSession, OpenHouseSummary } from './open-house-checkin';

// Sync Status and Offline Management
export { SyncStatus, FloatingSyncStatus } from './sync-status';
export { OfflineStatusIndicator, SimpleOfflineIndicator, useOfflineStatus } from './offline-status-indicator';
export { BackgroundSyncStatus } from './background-sync-status';

// Conflict Resolution
export { ConflictResolution } from './conflict-resolution';
export { default as ConflictManager } from './conflict-manager';
export { default as ConflictList } from './conflict-list';

// Photo Description Display
export { PhotoDescriptionDisplay } from './photo-description-display';
export type { PhotoDescription } from './photo-description-display';

// Gesture Handling
export { default as GestureDemo } from './gesture-demo';

// Workflow Components
export { VoiceMemoWorkflow, WorkflowProgress } from './voice-memo-workflow';
export { QuickCaptureWorkflow } from './quick-capture-workflow';

// Demo Components
export { QuickCaptureDemo } from './quick-capture-demo';
export { VoiceMemoDemo } from './voice-memo-demo';
export { SyncStatusDemo } from './sync-status-demo';
export { ConflictDemo } from './conflict-demo';
export { MobileStorageDemo } from './mobile-storage-demo';
export { MarketStatsDemo } from './market-stats-demo';