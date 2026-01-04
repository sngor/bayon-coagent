/**
 * Performance Optimization Utilities
 * Optimizes common operations in the synchronization pipeline
 */

import type { ExtendedProfile, SchemaMarkup, KnowledgeGraphEntity } from '../profile-update-synchronizer';

export class PerformanceOptimizer {
  /**
   * Efficiently determines affected schemas and entities in a single pass
   */
  static analyzeAffectedComponents(changedFields: string[]): {
    affectedSchemas: Set<string>;
    affectedEntities: Set<string>;
    criticalChanges: string[];
    socialChanges: string[];
  } {
    const affectedSchemas = new Set<string>();
    const affectedEntities = new Set<string>();
    const criticalChanges: string[] = [];
    const socialChanges: string[] = [];

    // Field mapping for efficient lookup
    const fieldMappings = {
      schemas: {
        'RealEstateAgent': new Set(['name', 'bio', 'licenseNumber', 'certifications', 'yearsOfExperience']),
        'Person': new Set(['name', 'bio', 'linkedin', 'twitter', 'facebook', 'instagram']),
        'LocalBusiness': new Set(['agencyName', 'address', 'phone', 'website']),
        'Organization': new Set(['agencyName', 'address', 'phone', 'website'])
      },
      entities: {
        'agent': new Set(['name', 'bio', 'licenseNumber', 'yearsOfExperience']),
        'geographic': new Set(['address', 'serviceAreas']),
        'certifications': new Set(['certifications']),
        'social': new Set(['linkedin', 'twitter', 'facebook', 'instagram'])
      },
      critical: new Set(['name', 'agencyName', 'phone', 'address', 'website']),
      social: new Set(['linkedin', 'twitter', 'facebook', 'instagram'])
    };

    // Single pass analysis
    for (const field of changedFields) {
      // Check critical fields
      if (fieldMappings.critical.has(field)) {
        criticalChanges.push(field);
      }

      // Check social fields
      if (fieldMappings.social.has(field)) {
        socialChanges.push(field);
      }

      // Check affected schemas
      for (const [schemaType, fields] of Object.entries(fieldMappings.schemas)) {
        if (fields.has(field)) {
          affectedSchemas.add(schemaType);
        }
      }

      // Check affected entities
      for (const [entityType, fields] of Object.entries(fieldMappings.entities)) {
        if (fields.has(field)) {
          affectedEntities.add(entityType);
        }
      }
    }

    return {
      affectedSchemas,
      affectedEntities,
      criticalChanges,
      socialChanges
    };
  }

  /**
   * Batch validation with early exit on first error
   */
  static async validateBatch<T>(
    items: T[],
    validator: (item: T) => Promise<{ isValid: boolean; errors: string[] }>,
    options: { failFast?: boolean; maxConcurrency?: number } = {}
  ): Promise<{ isValid: boolean; errors: string[]; validatedCount: number }> {
    const { failFast = false, maxConcurrency = 5 } = options;
    const errors: string[] = [];
    let validatedCount = 0;

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < items.length; i += maxConcurrency) {
      const batch = items.slice(i, i + maxConcurrency);
      const results = await Promise.allSettled(
        batch.map(item => validator(item))
      );

      for (const result of results) {
        validatedCount++;
        
        if (result.status === 'fulfilled') {
          if (!result.value.isValid) {
            errors.push(...result.value.errors);
            
            if (failFast) {
              return { isValid: false, errors, validatedCount };
            }
          }
        } else {
          errors.push(`Validation failed: ${result.reason}`);
          
          if (failFast) {
            return { isValid: false, errors, validatedCount };
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors, validatedCount };
  }

  /**
   * Memoized field change detection
   */
  private static changeCache = new Map<string, boolean>();

  static hasValueChangedMemoized(
    prevValue: any, 
    currValue: any, 
    fieldKey: string
  ): boolean {
    const cacheKey = `${fieldKey}:${JSON.stringify(prevValue)}:${JSON.stringify(currValue)}`;
    
    if (this.changeCache.has(cacheKey)) {
      return this.changeCache.get(cacheKey)!;
    }

    let hasChanged = false;

    if (Array.isArray(prevValue) && Array.isArray(currValue)) {
      hasChanged = prevValue.length !== currValue.length || 
                   prevValue.some((val, idx) => val !== currValue[idx]);
    } else if (typeof prevValue === 'object' && typeof currValue === 'object') {
      hasChanged = JSON.stringify(prevValue) !== JSON.stringify(currValue);
    } else {
      hasChanged = prevValue !== currValue;
    }

    // Cache with TTL (cleanup old entries)
    if (this.changeCache.size > 1000) {
      this.changeCache.clear();
    }
    
    this.changeCache.set(cacheKey, hasChanged);
    return hasChanged;
  }
}