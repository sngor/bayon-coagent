/**
 * Agent Profile Repository
 * 
 * Manages agent profile storage and retrieval for the Bayon AI Assistant.
 * Provides CRUD operations with validation and caching for optimal performance.
 */

import { DynamoDBRepository, getRepository } from './repository';
import { getAgentProfileKeysV2 } from './keys';
import { DynamoDBError } from './errors';

/**
 * Agent Profile data structure
 * Stores personalization information for the Bayon AI Assistant
 */
export interface AgentProfile {
  userId: string;
  agentName: string;
  primaryMarket: string;
  specialization: 'luxury' | 'first-time-buyers' | 'investment' | 'commercial' | 'general';
  preferredTone: 'warm-consultative' | 'direct-data-driven' | 'professional' | 'casual';
  agentType: 'buyer' | 'seller' | 'hybrid';
  corePrinciple: string;
  // Optional profile photo URL (stored in S3)
  photoURL?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input type for creating a new agent profile
 */
export type CreateAgentProfileInput = Omit<AgentProfile, 'userId' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating an existing agent profile
 */
export type UpdateAgentProfileInput = Partial<Omit<AgentProfile, 'userId' | 'createdAt' | 'updatedAt'>>;

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Performance metrics for profile operations
 */
export interface PerformanceMetrics {
  operation: 'get' | 'create' | 'update' | 'delete';
  duration: number;
  cacheHit: boolean;
  timestamp: number;
}

/**
 * Agent Profile Repository class
 * Provides type-safe CRUD operations for agent profiles with validation and caching
 */
export class AgentProfileRepository {
  private repository: DynamoDBRepository;
  private cache: Map<string, { profile: AgentProfile; timestamp: number }>;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private performanceMetrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics

  constructor(repository?: DynamoDBRepository) {
    this.repository = repository || getRepository();
    this.cache = new Map();
  }

  /**
   * Records a performance metric
   * @param operation Operation type
   * @param duration Duration in milliseconds
   * @param cacheHit Whether the operation hit the cache
   */
  private recordMetric(operation: PerformanceMetrics['operation'], duration: number, cacheHit: boolean): void {
    const metric: PerformanceMetrics = {
      operation,
      duration,
      cacheHit,
      timestamp: Date.now()
    };

    this.performanceMetrics.push(metric);

    // Keep only the last MAX_METRICS entries
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics.shift();
    }

    // Log warning if retrieval is slow (> 500ms as per requirement 8.5)
    if (operation === 'get' && duration > 500) {
      console.warn(`[AgentProfileRepository] Slow profile retrieval detected: ${duration}ms for operation ${operation}`);
    }
  }

  /**
   * Gets performance metrics for analysis
   * @param operation Optional filter by operation type
   * @returns Array of performance metrics
   */
  getPerformanceMetrics(operation?: PerformanceMetrics['operation']): PerformanceMetrics[] {
    if (operation) {
      return this.performanceMetrics.filter(m => m.operation === operation);
    }
    return [...this.performanceMetrics];
  }

  /**
   * Gets performance statistics
   * @param operation Optional filter by operation type
   * @returns Performance statistics
   */
  getPerformanceStats(operation?: PerformanceMetrics['operation']): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    cacheHitRate: number;
  } | null {
    const metrics = operation
      ? this.performanceMetrics.filter(m => m.operation === operation)
      : this.performanceMetrics;

    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const cacheHits = metrics.filter(m => m.cacheHit).length;

    const p95Index = Math.floor(durations.length * 0.95);

    return {
      count: metrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[p95Index] || durations[durations.length - 1],
      cacheHitRate: cacheHits / metrics.length
    };
  }

  /**
   * Clears performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }

  /**
   * Validates agent profile data
   * @param profile Profile data to validate
   * @returns Array of validation errors (empty if valid)
   */
  private validateProfile(profile: CreateAgentProfileInput | UpdateAgentProfileInput): ValidationError[] {
    const errors: ValidationError[] = [];

    // For create operations, check all required fields
    if ('agentName' in profile) {
      if (!profile.agentName || profile.agentName.trim().length === 0) {
        errors.push({ field: 'agentName', message: 'Agent name is required' });
      } else if (profile.agentName.length > 100) {
        errors.push({ field: 'agentName', message: 'Agent name must be 100 characters or less' });
      }
    }

    if ('primaryMarket' in profile) {
      if (!profile.primaryMarket || profile.primaryMarket.trim().length === 0) {
        errors.push({ field: 'primaryMarket', message: 'Primary market is required' });
      } else if (profile.primaryMarket.length > 200) {
        errors.push({ field: 'primaryMarket', message: 'Primary market must be 200 characters or less' });
      }
    }

    if ('specialization' in profile) {
      const validSpecializations = ['luxury', 'first-time-buyers', 'investment', 'commercial', 'general'];
      if (!profile.specialization) {
        errors.push({ field: 'specialization', message: 'Specialization is required' });
      } else if (!validSpecializations.includes(profile.specialization)) {
        errors.push({
          field: 'specialization',
          message: `Specialization must be one of: ${validSpecializations.join(', ')}`
        });
      }
    }

    if ('preferredTone' in profile) {
      const validTones = ['warm-consultative', 'direct-data-driven', 'professional', 'casual'];
      if (!profile.preferredTone) {
        errors.push({ field: 'preferredTone', message: 'Preferred tone is required' });
      } else if (!validTones.includes(profile.preferredTone)) {
        errors.push({
          field: 'preferredTone',
          message: `Preferred tone must be one of: ${validTones.join(', ')}`
        });
      }
    }

    if ('agentType' in profile) {
      const validTypes = ['buyer', 'seller', 'hybrid'];
      if (!profile.agentType) {
        errors.push({ field: 'agentType', message: 'Agent type is required' });
      } else if (!validTypes.includes(profile.agentType)) {
        errors.push({
          field: 'agentType',
          message: `Agent type must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    if ('corePrinciple' in profile) {
      if (!profile.corePrinciple || profile.corePrinciple.trim().length === 0) {
        errors.push({ field: 'corePrinciple', message: 'Core principle is required' });
      } else if (profile.corePrinciple.length < 10) {
        errors.push({ field: 'corePrinciple', message: 'Core principle must be at least 10 characters' });
      } else if (profile.corePrinciple.length > 500) {
        errors.push({ field: 'corePrinciple', message: 'Core principle must be 500 characters or less' });
      }
    }

    return errors;
  }

  /**
   * Validates that all required fields are present for profile creation
   * @param profile Profile data to validate
   * @returns Array of validation errors (empty if valid)
   */
  private validateRequiredFields(profile: CreateAgentProfileInput): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredFields: (keyof CreateAgentProfileInput)[] = [
      'agentName',
      'primaryMarket',
      'specialization',
      'preferredTone',
      'agentType',
      'corePrinciple'
    ];

    for (const field of requiredFields) {
      if (!(field in profile) || profile[field] === undefined || profile[field] === null) {
        errors.push({ field, message: `${field} is required` });
      }
    }

    return errors;
  }

  /**
   * Invalidates the cache for a specific user
   * @param userId User ID
   */
  private invalidateCache(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Gets a profile from cache if available and not expired
   * @param userId User ID
   * @returns Cached profile or null
   */
  private getFromCache(userId: string): AgentProfile | null {
    const cached = this.cache.get(userId);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(userId);
      return null;
    }

    return cached.profile;
  }

  /**
   * Stores a profile in cache
   * @param userId User ID
   * @param profile Profile to cache
   */
  private setCache(userId: string, profile: AgentProfile): void {
    this.cache.set(userId, {
      profile,
      timestamp: Date.now()
    });
  }

  /**
   * Creates a new agent profile
   * @param userId User ID
   * @param profile Profile data
   * @returns Created profile
   * @throws DynamoDBError if the operation fails
   * @throws Error if validation fails
   */
  async createProfile(userId: string, profile: CreateAgentProfileInput): Promise<AgentProfile> {
    const startTime = Date.now();

    // Validate required fields
    const requiredFieldErrors = this.validateRequiredFields(profile);
    if (requiredFieldErrors.length > 0) {
      throw new Error(`Validation failed: ${requiredFieldErrors.map(e => e.message).join(', ')}`);
    }

    // Validate profile data
    const validationErrors = this.validateProfile(profile);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    // Check if profile already exists
    const existing = await this.getProfile(userId);
    if (existing) {
      throw new Error('Agent profile already exists for this user');
    }

    const now = new Date().toISOString();
    const agentProfile: AgentProfile = {
      userId,
      ...profile,
      createdAt: now,
      updatedAt: now
    };

    const keys = getAgentProfileKeysV2(userId);
    await this.repository.create(
      keys.PK,
      keys.SK,
      'AgentProfile',
      agentProfile
    );

    // Cache the new profile
    this.setCache(userId, agentProfile);

    const duration = Date.now() - startTime;
    this.recordMetric('create', duration, false);

    return agentProfile;
  }

  /**
   * Gets an agent profile by user ID
   * @param userId User ID
   * @returns Profile or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getProfile(userId: string): Promise<AgentProfile | null> {
    const startTime = Date.now();

    // Check cache first
    const cached = this.getFromCache(userId);
    if (cached) {
      const duration = Date.now() - startTime;
      this.recordMetric('get', duration, true);
      return cached;
    }

    const keys = getAgentProfileKeysV2(userId);
    const profile = await this.repository.get<AgentProfile>(keys.PK, keys.SK);

    if (profile) {
      // Cache the retrieved profile
      this.setCache(userId, profile);
    }

    const duration = Date.now() - startTime;
    this.recordMetric('get', duration, false);

    return profile;
  }

  /**
   * Updates an existing agent profile
   * @param userId User ID
   * @param updates Partial profile data to update
   * @throws DynamoDBError if the operation fails
   * @throws Error if validation fails or profile doesn't exist
   */
  async updateProfile(userId: string, updates: UpdateAgentProfileInput): Promise<void> {
    const startTime = Date.now();

    // Validate update data
    const validationErrors = this.validateProfile(updates);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    // Check if profile exists
    const existing = await this.getProfile(userId);
    if (!existing) {
      throw new Error('Agent profile not found');
    }

    // Add updatedAt timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const keys = getAgentProfileKeysV2(userId);
    await this.repository.update(keys.PK, keys.SK, updatesWithTimestamp);

    // Invalidate cache
    this.invalidateCache(userId);

    const duration = Date.now() - startTime;
    this.recordMetric('update', duration, false);
  }

  /**
   * Deletes an agent profile
   * @param userId User ID
   * @throws DynamoDBError if the operation fails
   */
  async deleteProfile(userId: string): Promise<void> {
    const startTime = Date.now();

    const keys = getAgentProfileKeysV2(userId);
    await this.repository.delete(keys.PK, keys.SK);

    // Invalidate cache
    this.invalidateCache(userId);

    const duration = Date.now() - startTime;
    this.recordMetric('delete', duration, false);
  }

  /**
   * Clears the entire cache
   * Useful for testing or when you want to force fresh data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
let agentProfileRepositoryInstance: AgentProfileRepository | null = null;

/**
 * Gets the singleton agent profile repository instance
 */
export function getAgentProfileRepository(): AgentProfileRepository {
  if (!agentProfileRepositoryInstance) {
    agentProfileRepositoryInstance = new AgentProfileRepository();
  }
  return agentProfileRepositoryInstance;
}

/**
 * Resets the agent profile repository singleton
 * Useful for testing
 */
export function resetAgentProfileRepository(): void {
  agentProfileRepositoryInstance = null;
}

/**
 * Convenience function to get an agent profile by user ID
 * @param userId - The user ID to get the profile for
 * @returns The agent profile or null if not found
 */
export async function getAgentProfile(userId: string): Promise<AgentProfile | null> {
  const repository = getAgentProfileRepository();
  return await repository.getProfile(userId);
}
