/**
 * Change Detection Service
 * Handles profile change detection and analysis
 */

import type { 
  ExtendedProfile, 
  ProfileChangeEvent, 
  ChangeDetectionConfig,
  UserId,
  ChangeId
} from '../types/synchronization.types';

export class ChangeDetector {
  constructor(private config: ChangeDetectionConfig) {}

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
      field => !this.config.ignoredFields.includes(field)
    );

    if (relevantChanges.length === 0) {
      this.logPerformance('detectChanges', startTime, { userId, result: 'no_relevant_changes' });
      return null;
    }

    const changeEvent: ProfileChangeEvent = {
      userId: userId as UserId,
      previousProfile,
      updatedProfile,
      changedFields: relevantChanges as [string, ...string[]], // NonEmptyArray
      timestamp: new Date(),
      changeId: this.generateChangeId(userId) as ChangeId
    };

    this.logPerformance('detectChanges', startTime, { 
      userId, 
      result: 'changes_detected',
      changedFields: relevantChanges.length,
      changeId: changeEvent.changeId
    });

    return changeEvent;
  }

  private getChangedFields(previous: ExtendedProfile, current: ExtendedProfile): string[] {
    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

    for (const key of allKeys) {
      const prevValue = previous[key as keyof ExtendedProfile];
      const currValue = current[key as keyof ExtendedProfile];

      if (this.hasValueChanged(prevValue, currValue)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  private hasValueChanged(prevValue: any, currValue: any): boolean {
    if (Array.isArray(prevValue) && Array.isArray(currValue)) {
      return JSON.stringify(prevValue) !== JSON.stringify(currValue);
    }
    
    if (typeof prevValue === 'object' && typeof currValue === 'object') {
      return JSON.stringify(prevValue) !== JSON.stringify(currValue);
    }
    
    return prevValue !== currValue;
  }

  private generateChangeId(userId: string): string {
    return `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private logPerformance(operation: string, startTime: number, metadata: Record<string, any>): void {
    const duration = performance.now() - startTime;
    console.log(`[ChangeDetector] ${operation} completed in ${duration.toFixed(2)}ms`, metadata);
    
    if (duration > 1000) {
      console.warn(`[ChangeDetector] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }
}