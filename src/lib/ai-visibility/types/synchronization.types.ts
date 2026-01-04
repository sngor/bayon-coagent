/**
 * Enhanced Type Definitions for AI Visibility Synchronization
 * Provides better type safety and clearer interfaces
 */

import type { Profile } from '@/lib/types/common';

// Base types with better constraints
export interface ExtendedProfile extends Partial<Profile> {
  readonly email?: string;
  readonly instagram?: string;
  readonly specializations?: string | readonly string[];
  readonly serviceAreas?: readonly string[];
}

// Branded types for better type safety
export type UserId = string & { readonly __brand: 'UserId' };
export type ChangeId = string & { readonly __brand: 'ChangeId' };
export type Timestamp = number & { readonly __brand: 'Timestamp' };

// Utility type helpers
export type NonEmptyArray<T> = [T, ...T[]];
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Enhanced change event with better type constraints
export interface ProfileChangeEvent {
  readonly userId: UserId;
  readonly previousProfile: ExtendedProfile;
  readonly updatedProfile: ExtendedProfile;
  readonly changedFields: NonEmptyArray<string>;
  readonly timestamp: Date;
  readonly changeId: ChangeId;
}

// Result types with discriminated unions for better error handling
export type SynchronizationResult = 
  | SynchronizationSuccess
  | SynchronizationFailure;

export interface SynchronizationSuccess {
  readonly success: true;
  readonly changeId: ChangeId;
  readonly updatedSchemas: readonly SchemaMarkup[];
  readonly updatedEntities: readonly KnowledgeGraphEntity[];
  readonly exportedFormats: readonly ExportFormat[];
  readonly validationResults: readonly ValidationResult[];
  readonly impactAnalysis: ImpactAnalysis;
  readonly rollbackData?: RollbackData;
  readonly performance?: PerformanceMetrics;
}

export interface SynchronizationFailure {
  readonly success: false;
  readonly changeId: ChangeId;
  readonly updatedSchemas: readonly SchemaMarkup[];
  readonly updatedEntities: readonly KnowledgeGraphEntity[];
  readonly exportedFormats: readonly ExportFormat[];
  readonly validationResults: readonly ValidationResult[];
  readonly impactAnalysis: ImpactAnalysis;
  readonly errors: NonEmptyArray<string>;
  readonly warnings?: readonly string[];
  readonly rollbackData?: RollbackData;
  readonly performance?: PerformanceMetrics;
}

// Enhanced validation result with more specific error types
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
  readonly suggestions: readonly ValidationSuggestion[];
  readonly validatedAt: Date;
  readonly validationDuration: number;
}

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly severity: 'error';
}

export interface ValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly severity: 'warning';
}

export interface ValidationSuggestion {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly severity: 'suggestion';
  readonly actionable: boolean;
}

// Enhanced impact analysis with more granular data
export interface ImpactAnalysis {
  readonly affectedSchemas: readonly string[];
  readonly affectedEntities: readonly string[];
  readonly estimatedVisibilityImpact: number; // -100 to +100
  readonly riskLevel: RiskLevel;
  readonly recommendations: readonly string[];
  readonly aiPlatformImpact: readonly AIplatformImpact[];
  readonly confidenceScore: number; // 0 to 1
  readonly analysisTimestamp: Date;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AIplatformImpact {
  readonly platform: AIplatform;
  readonly expectedChange: ChangeDirection;
  readonly confidence: number; // 0 to 1
  readonly estimatedTimeToEffect: number; // hours
}

export type AIplatform = 'ChatGPT' | 'Claude' | 'Perplexity' | 'Gemini' | 'Bing Chat';
export type ChangeDirection = 'positive' | 'negative' | 'neutral';

// Enhanced rollback data with versioning
export interface RollbackData {
  readonly changeId: ChangeId;
  readonly timestamp: Date;
  readonly version: number;
  readonly previousSchemas: readonly SchemaMarkup[];
  readonly previousEntities: readonly KnowledgeGraphEntity[];
  readonly previousExports: Readonly<Record<ExportFormat, string>>;
  readonly rollbackReason?: string;
  readonly rollbackInitiator?: 'system' | 'user' | 'admin';
}

// Configuration with better defaults and validation
export interface ChangeDetectionConfig {
  readonly monitoredFields: readonly string[];
  readonly criticalFields: readonly string[];
  readonly ignoredFields: readonly string[];
  readonly debounceMs: number;
  readonly maxBatchSize: number;
  readonly enablePerformanceTracking: boolean;
  readonly validationTimeout: number;
}

// Performance tracking
export interface PerformanceMetrics {
  readonly totalDuration: number;
  readonly phases: Readonly<Record<SynchronizationPhase, number>>;
  readonly memoryUsage?: MemoryUsage;
  readonly apiCalls: readonly APICallMetric[];
}

export type SynchronizationPhase = 
  | 'detection'
  | 'validation'
  | 'entity_update'
  | 'schema_update'
  | 'export'
  | 'storage'
  | 'rollback';

export interface MemoryUsage {
  readonly heapUsed: number;
  readonly heapTotal: number;
  readonly external: number;
}

export interface APICallMetric {
  readonly service: string;
  readonly operation: string;
  readonly duration: number;
  readonly success: boolean;
  readonly retryCount: number;
}

// Schema and entity types (assuming these exist elsewhere)
export interface SchemaMarkup {
  readonly '@context': string;
  readonly '@type': string;
  readonly '@id'?: string;
  readonly name: string;
  readonly [key: string]: any;
}

export interface KnowledgeGraphEntity {
  readonly '@id': string;
  readonly '@type': string;
  readonly properties: Record<string, any>;
}

export type ExportFormat = 'json-ld' | 'rdf-xml' | 'turtle' | 'microdata';

// Type guards for runtime type checking
export function isProfileChangeEvent(obj: any): obj is ProfileChangeEvent {
  return obj &&
    typeof obj.userId === 'string' &&
    typeof obj.changeId === 'string' &&
    Array.isArray(obj.changedFields) &&
    obj.changedFields.length > 0 &&
    obj.timestamp instanceof Date;
}

export function isSynchronizationSuccess(result: SynchronizationResult): result is SynchronizationSuccess {
  return result.success === true;
}

export function isSynchronizationFailure(result: SynchronizationResult): result is SynchronizationFailure {
  return result.success === false;
}

// Utility functions for type creation
export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createChangeId(id: string): ChangeId {
  return id as ChangeId;
}

export function createTimestamp(timestamp: number): Timestamp {
  return timestamp as Timestamp;
}