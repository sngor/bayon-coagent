/**
 * Strand Specialization Types
 * 
 * Type definitions for the strand specialization system.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import type { AgentStrand, AgentCapabilities } from '../agent-core';
import type { WorkerTask } from '../worker-protocol';

/**
 * Specialization type
 */
export type SpecializationType = 'market' | 'agent' | 'content-type' | 'geographic';

/**
 * Specialization configuration
 */
export interface SpecializationConfig {
    type: SpecializationType;
    domain: string;
    expertise: string[];
    trainingData?: any[];
    metadata?: Record<string, any>;
}

/**
 * Market specialization data
 */
export interface MarketSpecialization {
    marketType: string; // e.g., 'luxury', 'first-time-buyers', 'commercial', 'investment'
    priceRange?: {
        min: number;
        max: number;
    };
    propertyTypes: string[]; // e.g., 'single-family', 'condo', 'multi-family'
    expertise: string[];
    marketKnowledge: Record<string, any>;
}

/**
 * Agent-specific specialization data
 */
export interface AgentSpecificSpecialization {
    agentId: string;
    stylePreferences: {
        tone: string;
        vocabulary: string[];
        avoidWords: string[];
        sentenceStructure: 'simple' | 'complex' | 'varied';
    };
    contentPatterns: {
        openingStyle: string;
        closingStyle: string;
        callToActionStyle: string;
    };
    performanceHistory: PerformanceSnapshot[];
}

/**
 * Content-type specialization data
 */
export interface ContentTypeSpecialization {
    contentType: string; // e.g., 'blog-post', 'social-media', 'listing-description', 'email'
    format: string;
    bestPractices: string[];
    templates: string[];
    optimizationRules: Record<string, any>;
}

/**
 * Geographic specialization data
 */
export interface GeographicSpecialization {
    region: string; // e.g., 'San Francisco Bay Area', 'Austin, TX'
    localKnowledge: {
        neighborhoods: string[];
        schools: string[];
        amenities: string[];
        marketTrends: Record<string, any>;
    };
    regionalPreferences: {
        language: string;
        culturalNotes: string[];
    };
}

/**
 * Performance snapshot for tracking specialization effectiveness
 */
export interface PerformanceSnapshot {
    timestamp: string;
    tasksCompleted: number;
    successRate: number;
    avgQualityScore: number;
    avgExecutionTime: number;
    userSatisfaction: number;
}

/**
 * Specialization performance data
 */
export interface SpecializationPerformance {
    specializationId: string;
    config: SpecializationConfig;
    performanceHistory: PerformanceSnapshot[];
    comparisonToBase: {
        qualityImprovement: number; // percentage
        speedChange: number; // percentage
        satisfactionImprovement: number; // percentage
    };
    utilizationRate: number; // 0-1, how often this specialist is used
    lastUsed: string;
    createdAt: string;
}

/**
 * Specialization decision
 */
export interface SpecializationDecision {
    shouldSpecialize: boolean;
    reason: string;
    suggestedConfig?: SpecializationConfig;
    expectedBenefit?: {
        qualityImprovement: number;
        speedImprovement: number;
        satisfactionImprovement: number;
    };
    confidence: number;
}

/**
 * Task context for routing decisions
 */
export interface TaskContext {
    userId: string;
    agentProfile?: {
        id: string;
        marketFocus?: string;
        location?: string;
        specializations?: string[];
    };
    contentType?: string;
    targetAudience?: string;
    geographic?: {
        region: string;
        city?: string;
        state?: string;
    };
    metadata?: Record<string, any>;
}

/**
 * Specialized strand with additional metadata
 */
export interface SpecializedStrand extends AgentStrand {
    specialization: SpecializationConfig;
    baseStrandId?: string; // Reference to the base strand this was specialized from
    specializationPerformance: SpecializationPerformance;
}

/**
 * Strand routing decision
 */
export interface RoutingDecision {
    selectedStrand: AgentStrand | SpecializedStrand;
    reason: string;
    confidence: number;
    alternatives: Array<{
        strand: AgentStrand | SpecializedStrand;
        score: number;
        reason: string;
    }>;
}

/**
 * Specialization manager configuration
 */
export interface SpecializationManagerConfig {
    /** Minimum tasks before considering specialization */
    minTasksForSpecialization: number;
    /** Minimum performance improvement to justify specialization */
    minPerformanceImprovement: number; // percentage
    /** Maximum number of specialized strands per base strand */
    maxSpecializationsPerBase: number;
    /** Minimum utilization rate to keep a specialist */
    minUtilizationRate: number;
    /** Days of inactivity before pruning */
    pruneAfterDays: number;
    /** Enable automatic specialization detection */
    autoDetectSpecializations: boolean;
}
