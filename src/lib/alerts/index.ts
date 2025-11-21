/**
 * Market Intelligence Alerts - Main Export
 * 
 * Exports all alert-related types, functions, and utilities.
 */

// Export all types
export * from './types';

// Export data access layer
export * from './data-access';

// Export validation functions
export * from './validation';

// Export life event analyzer
export * from './life-event-analyzer';

// Export neighborhood trend detector
export * from './neighborhood-trend-detector';

// Export competitor monitor
export * from './competitor-monitor';

// Export price reduction monitor
export * from './price-reduction-monitor';

// Export price reduction data access
export * from './price-reduction-data-access';

// Export price reduction service
export * from './price-reduction-service';

// Re-export key generation functions for alerts
export {
    getAlertKeys,
    getAlertSettingsKeys,
    getNeighborhoodProfileKeys,
    getLifeEventKeys,
    getProspectKeys,
    getTrackedCompetitorKeys,
    getListingEventKeys,
    getTrendIndicatorsKeys,
    getTargetAreaKeys,
    getPriceHistoryKeys,
    getListingSnapshotKeys,
} from '../../aws/dynamodb/keys';