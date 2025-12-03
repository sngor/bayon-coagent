/**
 * Strand Specialization System
 * 
 * Exports for the strand specialization system.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

// Main manager
export {
    StrandSpecializationManager,
    getSpecializationManager,
    resetSpecializationManager,
} from './strand-specialization-manager';

// Factory functions
export {
    createMarketSpecialization,
    createAgentSpecificSpecialization,
    createContentTypeSpecialization,
    createGeographicSpecialization,
    getMarketSpecialization,
    getContentTypeSpecialization,
    PREDEFINED_MARKET_SPECIALIZATIONS,
    PREDEFINED_CONTENT_SPECIALIZATIONS,
} from './specialization-factory';

// Types
export type {
    SpecializationType,
    SpecializationConfig,
    MarketSpecialization,
    AgentSpecificSpecialization,
    ContentTypeSpecialization,
    GeographicSpecialization,
    PerformanceSnapshot,
    SpecializationPerformance,
    SpecializationDecision,
    TaskContext,
    SpecializedStrand,
    RoutingDecision,
    SpecializationManagerConfig,
} from './types';
