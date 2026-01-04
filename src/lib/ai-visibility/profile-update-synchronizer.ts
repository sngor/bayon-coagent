/**
 * Profile Update Synchronizer
 * 
 * Implements real-time knowledge graph entity updates on profile changes,
 * schema markup synchronization across all formats, change detection and impact analysis,
 * and rollback functionality for problematic updates.
 * 
 * Requirements: 3.5
 */

import type { Profile } from '@/lib/types/common';
import type { 
  KnowledgeGraphEntity, 
  SchemaMarkup, 
  ValidationResult,
  ExportFormat
} from './types';
import { knowledgeGraphBuilder } from './services/knowledge-graph-builder';
import { generateAgentProfileSchema } from '@/lib/aeo/schema-generator';
import { evaluateAndRollback } from './rollback-manager';

// Import new services
import { ChangeDetector } from './services/change-detector';
import { SynchronizationStrategyFactory } from './services/synchronization-strategy';
import { PerformanceOptimizer } from './services/performance-optimizer';
import { createAIVisibilityRepository, type AIVisibilityRepository } from './repositories/ai-visibility-repository';
import { 
  SynchronizationErrorHandler,
  ValidationError,
  HighRiskChangeError,
  CircuitBreakerError,
  StorageError
} from './errors/synchronization-errors';
import type {
  ExtendedProfile,
  ProfileChangeEvent,
  SynchronizationResult,
  ImpactAnalysis,
  RollbackData,
  ChangeDetectionConfig,
  PerformanceMetrics,
  UserId,
  ChangeId
} from './types/synchronization.types';

/**
 * Extended Profile interface with all required fields for AI visibility
 */
interface ExtendedProfile extends Partial<Profile> {
  email?: string;
  instagram?: string;
  specializations?: string | string[];
  serviceAreas?: string[];
}

/**
 * Custom error class for synchronization operations
 */
class SynchronizationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SynchronizationError';
  }
}

/**
 * Circuit breaker state interface
 */
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

/**
 * Enhanced context object to manage synchronization state with performance tracking
 */
class SynchronizationContext {
  public rollbackData?: RollbackData;
  public updatedEntities: KnowledgeGraphEntity[] = [];
  public updatedSchemas: SchemaMarkup[] = [];
  public validationResults: ValidationResult[] = [];
  public exportedFormats: Record<ExportFormat, string> = {
    'json-ld': '',
    'rdf-xml': '',
    'turtle': '',
    'microdata': ''
  };

  private phaseMetrics = new Map<string, number>();
  private apiCallMetrics: any[] = [];
  private currentPhaseStart?: number;

  constructor(
    public readonly changeEvent: ProfileChangeEvent,
    public readonly impactAnalysis: ImpactAnalysis,
    public readonly repository: AIVisibilityRepository
  ) {}

  startPhase(phase: string): void {
    if (this.currentPhaseStart) {
      this.endCurrentPhase();
    }
    this.currentPhaseStart = performance.now();
    this.currentPhase = phase;
  }

  private currentPhase?: string;

  private endCurrentPhase(): void {
    if (this.currentPhase && this.currentPhaseStart) {
      const duration = performance.now() - this.currentPhaseStart;
      this.phaseMetrics.set(this.currentPhase, duration);
    }
  }

  recordAPICall(service: string, operation: string, duration: number, success: boolean, retryCount = 0): void {
    this.apiCallMetrics.push({
      service,
      operation,
      duration,
      success,
      retryCount
    });
  }

  getPhaseMetrics(): Record<string, number> {
    this.endCurrentPhase();
    return Object.fromEntries(this.phaseMetrics);
  }

  getAPICallMetrics(): any[] {
    return [...this.apiCallMetrics];
  }

  buildSuccessResult(): SynchronizationResult {
    return {
      success: true,
      changeId: this.changeEvent.changeId,
      updatedSchemas: this.updatedSchemas,
      updatedEntities: this.updatedEntities,
      exportedFormats: Object.keys(this.exportedFormats) as ExportFormat[],
      validationResults: this.validationResults,
      impactAnalysis: this.impactAnalysis,
      rollbackData: this.rollbackData
    };
  }

  buildErrorResult(error: unknown): SynchronizationResult {
    return {
      success: false,
      changeId: this.changeEvent.changeId,
      updatedSchemas: [],
      updatedEntities: [],
      exportedFormats: [],
      validationResults: this.validationResults,
      impactAnalysis: this.impactAnalysis,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Profile change event interface
 */
export interface ProfileChangeEvent {
  userId: string;
  previousProfile: ExtendedProfile;
  updatedProfile: ExtendedProfile;
  changedFields: string[];
  timestamp: Date;
  changeId: string;
}

/**
 * Synchronization result interface
 */
export interface SynchronizationResult {
  success: boolean;
  changeId: string;
  updatedSchemas: SchemaMarkup[];
  updatedEntities: KnowledgeGraphEntity[];
  exportedFormats: ExportFormat[];
  validationResults: ValidationResult[];
  impactAnalysis: ImpactAnalysis;
  rollbackData?: RollbackData;
  errors?: string[];
  warnings?: string[];
}

/**
 * Impact analysis interface
 */
export interface ImpactAnalysis {
  affectedSchemas: string[];
  affectedEntities: string[];
  estimatedVisibilityImpact: number; // -100 to +100
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  aiPlatformImpact: {
    platform: string;
    expectedChange: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }[];
}

/**
 * Rollback data interface
 */
export interface RollbackData {
  changeId: string;
  timestamp: Date;
  previousSchemas: SchemaMarkup[];
  previousEntities: KnowledgeGraphEntity[];
  previousExports: Record<ExportFormat, string>;
  rollbackReason?: string;
}

/**
 * Change detection configuration
 */
export interface ChangeDetectionConfig {
  /** Fields to monitor for changes */
  monitoredFields: string[];
  /** Fields that trigger immediate sync */
  criticalFields: string[];
  /** Fields to ignore */
  ignoredFields: string[];
  /** Debounce delay in milliseconds */
  debounceMs: number;
  /** Maximum batch size for changes */
  maxBatchSize: number;
}

/**
 * Profile Update Synchronizer Service
 */
export class ProfileUpdateSynchronizer {
  private readonly changeDetector: ChangeDetector;
  private readonly strategyFactory: SynchronizationStrategyFactory;
  private readonly repository: AIVisibilityRepository;
  
  private pendingChanges = new Map<string, ProfileChangeEvent>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private circuitBreaker = new Map<string, CircuitBreakerState>();

  constructor(private config: Partial<ChangeDetectionConfig> = {}) {
    const fullConfig = { ...this.defaultConfig, ...config };
    this.changeDetector = new ChangeDetector(fullConfig);
    this.strategyFactory = new SynchronizationStrategyFactory();
    this.repository = createAIVisibilityRepository();
  }

  private readonly defaultConfig: ChangeDetectionConfig = {
    monitoredFields: [
      'name', 'agencyName', 'bio', 'phone', 'email', 'website', 'address',
      'licenseNumber', 'yearsOfExperience', 'certifications', 'specializations',
      'linkedin', 'twitter', 'facebook', 'instagram', 'serviceAreas'
    ],
    criticalFields: ['name', 'agencyName', 'phone', 'address', 'website'],
    ignoredFields: ['updatedAt', 'lastSeen', 'loginCount', 'lastLogin'],
    debounceMs: 2000,
    maxBatchSize: 10,
    enablePerformanceTracking: true,
    validationTimeout: 30000
  };

  /**
   * Detects changes between profile versions using the new ChangeDetector service
   */
  detectChanges(
    previousProfile: ExtendedProfile,
    updatedProfile: ExtendedProfile,
    userId: string
  ): ProfileChangeEvent | null {
    return this.changeDetector.detectChanges(previousProfile, updatedProfile, userId);
  }

  /**
   * Synchronizes profile updates using the new strategy-based approach
   */
  async synchronizeProfileUpdate(
    changeEvent: ProfileChangeEvent
  ): Promise<SynchronizationResult> {
    const startTime = performance.now();
    let performanceMetrics: PerformanceMetrics | undefined;

    try {
      // Analyze impact to determine strategy
      const impactAnalysis = await this.analyzeImpact(changeEvent);
      
      // Get appropriate strategy
      const strategy = this.strategyFactory.getStrategy(changeEvent, impactAnalysis);
      
      // Create context for the synchronization
      const context = new SynchronizationContext(changeEvent, impactAnalysis, this.repository);
      
      // Execute synchronization using the selected strategy
      const result = await strategy.execute(context);
      
      // Add performance metrics if enabled
      if (this.config.enablePerformanceTracking) {
        const totalDuration = performance.now() - startTime;
        performanceMetrics = {
          totalDuration,
          phases: context.getPhaseMetrics(),
          apiCalls: context.getAPICallMetrics()
        };
        
        if ('performance' in result) {
          (result as any).performance = performanceMetrics;
        }
      }

      return result;

    } catch (error) {
      const synchronizationError = SynchronizationErrorHandler.handle(error, {
        changeId: changeEvent.changeId,
        userId: changeEvent.userId
      });

      // Attempt rollback if possible
      try {
        await this.performRollback(changeEvent.changeId, synchronizationError.message);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      return {
        success: false,
        changeId: changeEvent.changeId,
        updatedSchemas: [],
        updatedEntities: [],
        exportedFormats: [],
        validationResults: [],
        impactAnalysis: await this.analyzeImpact(changeEvent),
        errors: [synchronizationError.message],
        performance: performanceMetrics
      };
    }
  }

  /**
   * Debounced synchronization to prevent excessive API calls
   */
  async debouncedSynchronizeProfileUpdate(
    changeEvent: ProfileChangeEvent
  ): Promise<void> {
    const { userId } = changeEvent;
    
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Store pending change
    this.pendingChanges.set(userId, changeEvent);

    // Set new debounce timer
    const timer = setTimeout(async () => {
      const pendingChange = this.pendingChanges.get(userId);
      if (pendingChange) {
        this.pendingChanges.delete(userId);
        this.debounceTimers.delete(userId);
        
        try {
          await this.synchronizeProfileUpdate(pendingChange);
        } catch (error) {
          console.error('Debounced synchronization failed:', error);
        }
      }
    }, this.config.debounceMs || this.defaultConfig.debounceMs);

    this.debounceTimers.set(userId, timer);
  }

  /**
   * Batch process multiple profile changes with improved error handling
   */
  async batchSynchronizeProfileUpdates(
    changeEvents: ProfileChangeEvent[]
  ): Promise<SynchronizationResult[]> {
    const maxBatchSize = this.config.maxBatchSize || this.defaultConfig.maxBatchSize;
    const batches = this.createBatches(changeEvents, maxBatchSize);
    const results: SynchronizationResult[] = [];

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(event => this.synchronizeProfileUpdate(event))
      );

      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : this.createErrorResult(result.reason, 'batch-error')
      ));
    }

    return results;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private createErrorResult(error: any, changeId: string): SynchronizationResult {
    const synchronizationError = SynchronizationErrorHandler.handle(error);
    
    return {
      success: false,
      changeId: changeId as ChangeId,
      updatedSchemas: [],
      updatedEntities: [],
      exportedFormats: [],
      validationResults: [],
      impactAnalysis: {
        affectedSchemas: [],
        affectedEntities: [],
        estimatedVisibilityImpact: 0,
        riskLevel: 'low',
        recommendations: [],
        aiPlatformImpact: [],
        confidenceScore: 0,
        analysisTimestamp: new Date()
      },
      errors: [synchronizationError.message]
    };
  }

  /**
   * Detects changes between profile versions
   */
  detectChanges(
    previousProfile: ExtendedProfile,
    updatedProfile: ExtendedProfile,
    userId: string
  ): ProfileChangeEvent | null {
    const startTime = performance.now();
    
    const changedFields = this.getChangedFields(previousProfile, updatedProfile);
    
    if (changedFields.length === 0) {
      this.logPerformance('detectChanges', startTime, { userId, result: 'no_changes' });
      return null;
    }

    // Filter out ignored fields
    const relevantChanges = changedFields.filter(
      field => !this.config.ignoredFields!.includes(field)
    );

    if (relevantChanges.length === 0) {
      this.logPerformance('detectChanges', startTime, { userId, result: 'no_relevant_changes' });
      return null;
    }

    const changeEvent = {
      userId,
      previousProfile,
      updatedProfile,
      changedFields: relevantChanges,
      timestamp: new Date(),
      changeId: this.generateChangeId(userId)
    };

    this.logPerformance('detectChanges', startTime, { 
      userId, 
      result: 'changes_detected',
      changedFields: relevantChanges.length,
      changeId: changeEvent.changeId
    });

    return changeEvent;
  }

  private logPerformance(operation: string, startTime: number, metadata: Record<string, any>): void {
    const duration = performance.now() - startTime;
    console.log(`[ProfileUpdateSynchronizer] ${operation} completed in ${duration.toFixed(2)}ms`, metadata);
    
    // In production, you might want to send this to CloudWatch or another monitoring service
    if (duration > 1000) { // Log slow operations
      console.warn(`[ProfileUpdateSynchronizer] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Synchronizes profile updates across all AI visibility components
   */
  async synchronizeProfileUpdate(
    changeEvent: ProfileChangeEvent
  ): Promise<SynchronizationResult> {
    const context = new SynchronizationContext(changeEvent);
    
    try {
      // Execute synchronization pipeline
      await this.executePreSyncValidation(context);
      await this.executeEntityUpdates(context);
      await this.executeValidation(context);
      await this.executeExportAndSave(context);
      await this.executePostSyncValidation(context);

      return context.buildSuccessResult();

    } catch (error) {
      await this.handleSynchronizationError(context, error);
      return context.buildErrorResult(error);
    }
  }

  private async executePreSyncValidation(context: SynchronizationContext): Promise<void> {
    context.rollbackData = await this.createRollbackData(context.changeEvent);
    context.impactAnalysis = await this.analyzeImpact(context.changeEvent);

    if (context.impactAnalysis.riskLevel === 'high') {
      throw new SynchronizationError('Changes deemed too risky - manual review required', 'HIGH_RISK');
    }
  }

  private async executeEntityUpdates(context: SynchronizationContext): Promise<void> {
    context.updatedEntities = await this.updateKnowledgeGraphEntities(context.changeEvent);
    context.updatedSchemas = await this.updateSchemaMarkup(context.changeEvent);
  }

  private async executeValidation(context: SynchronizationContext): Promise<void> {
    context.validationResults = await this.validateUpdates(
      context.updatedSchemas, 
      context.updatedEntities
    );

    const hasErrors = context.validationResults.some(result => !result.isValid);
    if (hasErrors) {
      await this.performRollback(context.changeEvent.changeId, 'Validation failed');
      throw new SynchronizationError('Validation failed - changes rolled back', 'VALIDATION_FAILED');
    }
  }

  private async executeExportAndSave(context: SynchronizationContext): Promise<void> {
    context.exportedFormats = await this.exportAllFormats(
      context.updatedSchemas, 
      context.changeEvent.userId
    );

    await this.saveUpdates(
      context.changeEvent.userId,
      context.updatedSchemas,
      context.updatedEntities,
      context.exportedFormats
    );

    // Store rollback data - it should be defined from executePreSyncValidation
    if (context.rollbackData) {
      this.rollbackHistory.set(context.changeEvent.changeId, context.rollbackData);
    }
  }

  private async executePostSyncValidation(context: SynchronizationContext): Promise<void> {
    const rollbackEvent = await evaluateAndRollback(
      context.buildSuccessResult(), 
      context.changeEvent.userId
    );
    
    if (rollbackEvent?.success) {
      throw new SynchronizationError(
        `Changes automatically rolled back: ${rollbackEvent.reason}`, 
        'AUTO_ROLLBACK'
      );
    }
  }

  private async handleSynchronizationError(
    context: SynchronizationContext, 
    error: unknown
  ): Promise<void> {
    try {
      await this.performRollback(
        context.changeEvent.changeId, 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
  }

  /**
   * Updates knowledge graph entities based on profile changes
   */
  private async updateKnowledgeGraphEntities(
    changeEvent: ProfileChangeEvent
  ): Promise<KnowledgeGraphEntity[]> {
    const { userId, updatedProfile, changedFields } = changeEvent;

    // Get existing entities
    const existingEntities = await this.getExistingEntities(userId);

    // Determine which entities need updates
    const entitiesToUpdate = this.determineAffectedEntities(changedFields);

    const updatedEntities: KnowledgeGraphEntity[] = [];

    for (const entityType of entitiesToUpdate) {
      switch (entityType) {
        case 'agent':
          const agentEntity = await this.updateAgentEntity(userId, updatedProfile, existingEntities);
          if (agentEntity) updatedEntities.push(agentEntity);
          break;

        case 'geographic':
          if (changedFields.includes('address') || changedFields.includes('serviceAreas')) {
            const geoEntities = await this.updateGeographicEntities(userId, updatedProfile);
            updatedEntities.push(...geoEntities);
          }
          break;

        case 'certifications':
          if (changedFields.includes('certifications')) {
            const certEntities = await this.updateCertificationEntities(userId, updatedProfile);
            updatedEntities.push(...certEntities);
          }
          break;

        case 'social':
          const socialFields = ['linkedin', 'twitter', 'facebook', 'instagram'];
          if (socialFields.some(field => changedFields.includes(field))) {
            const socialEntities = await this.updateSocialEntities(userId, updatedProfile);
            updatedEntities.push(...socialEntities);
          }
          break;
      }
    }

    return updatedEntities;
  }

  /**
   * Updates schema markup based on profile changes
   */
  private async updateSchemaMarkup(
    changeEvent: ProfileChangeEvent
  ): Promise<SchemaMarkup[]> {
    const { updatedProfile, changedFields } = changeEvent;

    // Determine which schemas need updates
    const schemasToUpdate = this.determineAffectedSchemas(changedFields);

    const updatedSchemas: SchemaMarkup[] = [];

    // Generate updated schemas
    if (schemasToUpdate.length > 0) {
      const profileSchemas = generateAgentProfileSchema({
        name: updatedProfile.name || '',
        agencyName: updatedProfile.agencyName,
        jobTitle: 'Real Estate Agent',
        address: updatedProfile.address,
        phone: updatedProfile.phone,
        email: updatedProfile.email,
        website: updatedProfile.website,
        socialMedia: {
          linkedin: updatedProfile.linkedin,
          twitter: updatedProfile.twitter,
          facebook: updatedProfile.facebook,
          instagram: updatedProfile.instagram
        }
      });

      updatedSchemas.push(...profileSchemas);
    }

    return updatedSchemas;
  }

  /**
   * Analyzes the impact of profile changes using performance-optimized approach
   */
  private async analyzeImpact(changeEvent: ProfileChangeEvent): Promise<ImpactAnalysis> {
    const { changedFields } = changeEvent;

    // Use performance optimizer for efficient analysis
    const {
      affectedSchemas,
      affectedEntities,
      criticalChanges,
      socialChanges
    } = PerformanceOptimizer.analyzeAffectedComponents(changedFields);

    // Calculate visibility impact
    let estimatedVisibilityImpact = 0;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Critical fields have higher impact
    if (criticalChanges.length > 0) {
      estimatedVisibilityImpact += criticalChanges.length * 10;
      riskLevel = criticalChanges.length > 2 ? 'high' : 'medium';
    }

    // Analyze specific field impacts
    if (changedFields.includes('name')) {
      estimatedVisibilityImpact += 15;
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    if (changedFields.includes('website')) {
      estimatedVisibilityImpact += 20;
    }

    if (changedFields.includes('address')) {
      estimatedVisibilityImpact += 10;
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (criticalChanges.length > 3) {
      recommendations.push('Consider implementing changes gradually to monitor impact');
      riskLevel = 'critical';
    }

    if (changedFields.includes('name')) {
      recommendations.push('Name changes may affect AI recognition - monitor mentions closely');
    }

    if (changedFields.includes('website')) {
      recommendations.push('Website changes may impact schema validation - verify all links');
    }

    if (socialChanges.length > 0) {
      recommendations.push('Social profile changes may affect cross-platform consistency');
    }

    // Estimate AI platform impact with confidence scores
    const aiPlatformImpact = [
      {
        platform: 'ChatGPT' as const,
        expectedChange: estimatedVisibilityImpact > 0 ? 'positive' as const : 'neutral' as const,
        confidence: 0.7,
        estimatedTimeToEffect: 24
      },
      {
        platform: 'Claude' as const,
        expectedChange: estimatedVisibilityImpact > 0 ? 'positive' as const : 'neutral' as const,
        confidence: 0.8,
        estimatedTimeToEffect: 12
      },
      {
        platform: 'Perplexity' as const,
        expectedChange: estimatedVisibilityImpact > 0 ? 'positive' as const : 'neutral' as const,
        confidence: 0.9,
        estimatedTimeToEffect: 6
      },
      {
        platform: 'Gemini' as const,
        expectedChange: estimatedVisibilityImpact > 0 ? 'positive' as const : 'neutral' as const,
        confidence: 0.6,
        estimatedTimeToEffect: 48
      }
    ];

    // Calculate overall confidence score
    const confidenceScore = aiPlatformImpact.reduce((sum, impact) => sum + impact.confidence, 0) / aiPlatformImpact.length;

    return {
      affectedSchemas: Array.from(affectedSchemas),
      affectedEntities: Array.from(affectedEntities),
      estimatedVisibilityImpact: Math.min(estimatedVisibilityImpact, 100),
      riskLevel,
      recommendations,
      aiPlatformImpact,
      confidenceScore,
      analysisTimestamp: new Date()
    };
  }

  /**
   * Creates rollback data before making changes using the repository
   */
  private async createRollbackData(changeEvent: ProfileChangeEvent): Promise<RollbackData> {
    const { userId, changeId } = changeEvent;

    // Get current state before changes using repository
    const previousSchemas = await this.repository.getSchemas(userId);
    const previousEntities = await this.repository.getEntities(userId);
    const previousExports = await this.repository.getExports(userId);

    const rollbackData: RollbackData = {
      changeId,
      timestamp: new Date(),
      version: 1,
      previousSchemas,
      previousEntities,
      previousExports
    };

    // Save rollback data
    await this.repository.saveRollbackData(changeId, rollbackData);

    return rollbackData;
  }

  // Circuit breaker functionality (kept for backward compatibility)
  private async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceKey: string
  ): Promise<T> {
    const state = this.getCircuitBreakerState(serviceKey);
    
    if (state.isOpen && Date.now() - state.lastFailure < 60000) { // 1 minute cooldown
      throw new CircuitBreakerError(serviceKey, state.failures);
    }

    try {
      const result = await operation();
      this.resetCircuitBreaker(serviceKey);
      return result;
    } catch (error) {
      this.recordFailure(serviceKey);
      throw error;
    }
  }

  private getCircuitBreakerState(serviceKey: string): CircuitBreakerState {
    if (!this.circuitBreaker.has(serviceKey)) {
      this.circuitBreaker.set(serviceKey, {
        failures: 0,
        lastFailure: 0,
        isOpen: false
      });
    }
    return this.circuitBreaker.get(serviceKey)!;
  }

  private recordFailure(serviceKey: string): void {
    const state = this.getCircuitBreakerState(serviceKey);
    state.failures++;
    state.lastFailure = Date.now();
    
    if (state.failures >= 3) { // Open circuit after 3 failures
      state.isOpen = true;
    }
  }

  private resetCircuitBreaker(serviceKey: string): void {
    const state = this.getCircuitBreakerState(serviceKey);
    state.failures = 0;
    state.isOpen = false;
  }
}

  /**
   * Performs rollback to previous state using the repository
   */
  async performRollback(changeId: string, reason?: string): Promise<boolean> {
    try {
      const rollbackData = await this.repository.getRollbackData(changeId);
      
      if (!rollbackData) {
        console.error(`No rollback data found for change ${changeId}`);
        return false;
      }

      // Restore previous state using repository
      const userId = changeId.split('-')[0]; // Extract userId from changeId
      
      await this.repository.saveBatch(userId, {
        schemas: rollbackData.previousSchemas as SchemaMarkup[],
        entities: rollbackData.previousEntities as KnowledgeGraphEntity[],
        exports: rollbackData.previousExports
      });

      // Update rollback data with reason
      const updatedRollbackData: RollbackData = {
        ...rollbackData,
        rollbackReason: reason,
        rollbackInitiator: 'system'
      };
      
      await this.repository.saveRollbackData(changeId, updatedRollbackData);

      console.log(`Successfully rolled back change ${changeId}: ${reason}`);
      return true;

    } catch (error) {
      console.error(`Rollback failed for change ${changeId}:`, error);
      throw new StorageError('rollback', error instanceof Error ? error.message : 'Unknown error', {
        changeId,
        reason
      });
    }
  }

// Export singleton instance
export const profileUpdateSynchronizer = new ProfileUpdateSynchronizer();

/**
 * Convenience function for detecting and synchronizing profile changes
 */
export async function synchronizeProfileChanges(
  userId: string,
  previousProfile: ExtendedProfile,
  updatedProfile: ExtendedProfile
): Promise<SynchronizationResult | null> {
  const changeEvent = profileUpdateSynchronizer.detectChanges(
    previousProfile,
    updatedProfile,
    userId
  );

  if (!changeEvent) {
    return null;
  }

  return profileUpdateSynchronizer.synchronizeProfileUpdate(changeEvent);
}

/**
 * Convenience function for performing rollback
 */
export async function rollbackProfileChanges(
  changeId: string,
  reason?: string
): Promise<boolean> {
  return profileUpdateSynchronizer.performRollback(changeId, reason);
}

/**
 * Convenience function for batch synchronization
 */
export async function batchSynchronizeProfileChanges(
  changeEvents: ProfileChangeEvent[]
): Promise<SynchronizationResult[]> {
  return profileUpdateSynchronizer.batchSynchronizeProfileUpdates(changeEvents);
}