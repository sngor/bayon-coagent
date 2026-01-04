/**
 * Rollback Manager
 * 
 * Manages rollback operations for AI visibility profile updates,
 * providing monitoring, automatic rollback triggers, and manual rollback capabilities.
 * 
 * Requirements: 3.5
 */

import type { 
  SynchronizationResult, 
  RollbackData, 
  ImpactAnalysis 
} from './profile-update-synchronizer';
import { rollbackProfileChanges } from './profile-update-synchronizer';

/**
 * Rollback trigger conditions
 */
export interface RollbackTrigger {
  /** Trigger type */
  type: 'validation_failure' | 'high_risk' | 'user_request' | 'monitoring_alert' | 'timeout';
  /** Trigger threshold */
  threshold?: number;
  /** Automatic rollback enabled */
  autoRollback: boolean;
  /** Description */
  description: string;
}

/**
 * Rollback monitoring configuration
 */
export interface RollbackMonitoringConfig {
  /** Enable automatic monitoring */
  enabled: boolean;
  /** Monitoring interval in minutes */
  intervalMinutes: number;
  /** Rollback triggers */
  triggers: RollbackTrigger[];
  /** Maximum rollback attempts */
  maxRollbackAttempts: number;
  /** Rollback timeout in minutes */
  rollbackTimeoutMinutes: number;
}

/**
 * Rollback event interface
 */
export interface RollbackEvent {
  /** Event ID */
  id: string;
  /** User ID */
  userId: string;
  /** Change ID being rolled back */
  changeId: string;
  /** Rollback trigger */
  trigger: RollbackTrigger;
  /** Rollback reason */
  reason: string;
  /** Rollback timestamp */
  timestamp: Date;
  /** Rollback success */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Impact analysis */
  impactAnalysis?: ImpactAnalysis;
}

/**
 * Rollback status interface
 */
export interface RollbackStatus {
  /** Change ID */
  changeId: string;
  /** User ID */
  userId: string;
  /** Rollback available */
  rollbackAvailable: boolean;
  /** Rollback data exists */
  rollbackDataExists: boolean;
  /** Time since change */
  timeSinceChange: number;
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high';
  /** Rollback recommendations */
  recommendations: string[];
  /** Automatic rollback triggered */
  autoRollbackTriggered: boolean;
}

/**
 * Rollback Manager Service
 */
export class RollbackManager {
  private readonly defaultConfig: RollbackMonitoringConfig = {
    enabled: true,
    intervalMinutes: 5,
    triggers: [
      {
        type: 'validation_failure',
        autoRollback: true,
        description: 'Automatic rollback on validation failures'
      },
      {
        type: 'high_risk',
        threshold: 80,
        autoRollback: false,
        description: 'Alert on high-risk changes (>80% impact)'
      },
      {
        type: 'monitoring_alert',
        threshold: 50,
        autoRollback: false,
        description: 'Alert on significant negative impact'
      },
      {
        type: 'timeout',
        threshold: 30000, // 30 seconds
        autoRollback: true,
        description: 'Automatic rollback on operation timeout'
      }
    ],
    maxRollbackAttempts: 3,
    rollbackTimeoutMinutes: 60
  };

  private rollbackHistory = new Map<string, RollbackEvent[]>();
  private monitoringIntervals = new Map<string, NodeJS.Timeout>();

  constructor(private config: RollbackMonitoringConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Evaluates if a synchronization result should trigger a rollback
   */
  async evaluateRollbackTriggers(
    syncResult: SynchronizationResult,
    userId: string
  ): Promise<RollbackEvent | null> {
    const { changeId, impactAnalysis, success, errors } = syncResult;

    // Check validation failure trigger
    if (!success && errors?.some(error => error.includes('Validation failed'))) {
      const trigger = this.config.triggers.find(t => t.type === 'validation_failure');
      if (trigger?.autoRollback) {
        return this.createRollbackEvent(
          userId,
          changeId,
          trigger,
          'Validation failure detected',
          impactAnalysis
        );
      }
    }

    // Check high-risk trigger
    if (impactAnalysis?.riskLevel === 'high') {
      const trigger = this.config.triggers.find(t => t.type === 'high_risk');
      if (trigger) {
        const event = this.createRollbackEvent(
          userId,
          changeId,
          trigger,
          `High-risk change detected: ${impactAnalysis.recommendations.join(', ')}`,
          impactAnalysis
        );

        if (trigger.autoRollback) {
          return event;
        } else {
          // Log for manual review
          console.warn('High-risk change detected, manual review recommended:', event);
        }
      }
    }

    // Check impact threshold trigger
    const impactTrigger = this.config.triggers.find(t => t.type === 'monitoring_alert');
    if (impactTrigger?.threshold && impactAnalysis?.estimatedVisibilityImpact) {
      if (Math.abs(impactAnalysis.estimatedVisibilityImpact) > impactTrigger.threshold) {
        const event = this.createRollbackEvent(
          userId,
          changeId,
          impactTrigger,
          `High impact change: ${impactAnalysis.estimatedVisibilityImpact}%`,
          impactAnalysis
        );

        if (impactTrigger.autoRollback) {
          return event;
        }
      }
    }

    return null;
  }

  /**
   * Performs automatic rollback if triggered
   */
  async performAutomaticRollback(rollbackEvent: RollbackEvent): Promise<boolean> {
    try {
      console.log(`Performing automatic rollback for change ${rollbackEvent.changeId}: ${rollbackEvent.reason}`);

      const success = await rollbackProfileChanges(rollbackEvent.changeId, rollbackEvent.reason);
      
      rollbackEvent.success = success;
      rollbackEvent.timestamp = new Date();

      // Store rollback event
      this.storeRollbackEvent(rollbackEvent);

      if (success) {
        console.log(`Automatic rollback successful for change ${rollbackEvent.changeId}`);
      } else {
        console.error(`Automatic rollback failed for change ${rollbackEvent.changeId}`);
      }

      return success;

    } catch (error) {
      rollbackEvent.success = false;
      rollbackEvent.error = error instanceof Error ? error.message : 'Unknown error';
      rollbackEvent.timestamp = new Date();

      this.storeRollbackEvent(rollbackEvent);

      console.error(`Automatic rollback error for change ${rollbackEvent.changeId}:`, error);
      return false;
    }
  }

  /**
   * Performs manual rollback requested by user
   */
  async performManualRollback(
    userId: string,
    changeId: string,
    reason: string
  ): Promise<RollbackEvent> {
    const trigger: RollbackTrigger = {
      type: 'user_request',
      autoRollback: false,
      description: 'Manual rollback requested by user'
    };

    const rollbackEvent = this.createRollbackEvent(userId, changeId, trigger, reason);

    try {
      const success = await rollbackProfileChanges(changeId, reason);
      
      rollbackEvent.success = success;
      rollbackEvent.timestamp = new Date();

      this.storeRollbackEvent(rollbackEvent);

      return rollbackEvent;

    } catch (error) {
      rollbackEvent.success = false;
      rollbackEvent.error = error instanceof Error ? error.message : 'Unknown error';
      rollbackEvent.timestamp = new Date();

      this.storeRollbackEvent(rollbackEvent);

      return rollbackEvent;
    }
  }

  /**
   * Gets rollback status for a change
   */
  async getRollbackStatus(userId: string, changeId: string): Promise<RollbackStatus> {
    const rollbackEvents = this.rollbackHistory.get(changeId) || [];
    const latestEvent = rollbackEvents[rollbackEvents.length - 1];

    // Check if rollback data exists (simplified check)
    const rollbackDataExists = await this.checkRollbackDataExists(changeId);

    // Calculate time since change (simplified)
    const timeSinceChange = Date.now() - (latestEvent?.timestamp.getTime() || Date.now());

    // Determine if rollback is still available
    const rollbackAvailable = rollbackDataExists && 
      timeSinceChange < (this.config.rollbackTimeoutMinutes * 60 * 1000);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (!rollbackAvailable) {
      recommendations.push('Rollback window has expired');
    } else if (latestEvent?.impactAnalysis?.riskLevel === 'high') {
      recommendations.push('High-risk change - consider rollback');
    } else if (rollbackEvents.length > 0) {
      recommendations.push('Previous rollback attempts detected');
    }

    return {
      changeId,
      userId,
      rollbackAvailable,
      rollbackDataExists,
      timeSinceChange,
      riskLevel: latestEvent?.impactAnalysis?.riskLevel || 'low',
      recommendations,
      autoRollbackTriggered: rollbackEvents.some(e => e.trigger.autoRollback)
    };
  }

  /**
   * Starts monitoring for a user's changes
   */
  startMonitoring(userId: string): void {
    if (!this.config.enabled) {
      return;
    }

    // Clear existing monitoring
    this.stopMonitoring(userId);

    const interval = setInterval(async () => {
      await this.performMonitoringCheck(userId);
    }, this.config.intervalMinutes * 60 * 1000);

    this.monitoringIntervals.set(userId, interval);
    console.log(`Started rollback monitoring for user ${userId}`);
  }

  /**
   * Stops monitoring for a user
   */
  stopMonitoring(userId: string): void {
    const interval = this.monitoringIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(userId);
      console.log(`Stopped rollback monitoring for user ${userId}`);
    }
  }

  /**
   * Gets rollback history for a user
   */
  getRollbackHistory(userId: string): RollbackEvent[] {
    const allEvents: RollbackEvent[] = [];
    
    for (const events of this.rollbackHistory.values()) {
      allEvents.push(...events.filter(e => e.userId === userId));
    }

    return allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Private helper methods
   */

  private createRollbackEvent(
    userId: string,
    changeId: string,
    trigger: RollbackTrigger,
    reason: string,
    impactAnalysis?: ImpactAnalysis
  ): RollbackEvent {
    return {
      id: `rollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      changeId,
      trigger,
      reason,
      timestamp: new Date(),
      success: false,
      impactAnalysis
    };
  }

  private storeRollbackEvent(event: RollbackEvent): void {
    const events = this.rollbackHistory.get(event.changeId) || [];
    events.push(event);
    this.rollbackHistory.set(event.changeId, events);
  }

  private async checkRollbackDataExists(changeId: string): Promise<boolean> {
    // Implementation would check if rollback data exists in storage
    // For now, assume it exists for recent changes
    return true;
  }

  private async performMonitoringCheck(userId: string): Promise<void> {
    try {
      // Implementation would check for issues that might require rollback
      // This could include:
      // - Monitoring AI visibility scores
      // - Checking for validation errors
      // - Monitoring user feedback
      // - Checking system health metrics

      console.log(`Performing monitoring check for user ${userId}`);
    } catch (error) {
      console.error(`Monitoring check failed for user ${userId}:`, error);
    }
  }
}

// Export singleton instance
export const rollbackManager = new RollbackManager();

/**
 * Convenience functions for rollback operations
 */

/**
 * Evaluates and potentially performs automatic rollback
 */
export async function evaluateAndRollback(
  syncResult: SynchronizationResult,
  userId: string
): Promise<RollbackEvent | null> {
  const rollbackEvent = await rollbackManager.evaluateRollbackTriggers(syncResult, userId);
  
  if (rollbackEvent && rollbackEvent.trigger.autoRollback) {
    await rollbackManager.performAutomaticRollback(rollbackEvent);
    return rollbackEvent;
  }

  return rollbackEvent;
}

/**
 * Performs manual rollback with user confirmation
 */
export async function performManualRollback(
  userId: string,
  changeId: string,
  reason: string
): Promise<RollbackEvent> {
  return rollbackManager.performManualRollback(userId, changeId, reason);
}

/**
 * Gets rollback status for UI display
 */
export async function getRollbackStatus(
  userId: string,
  changeId: string
): Promise<RollbackStatus> {
  return rollbackManager.getRollbackStatus(userId, changeId);
}

/**
 * Starts rollback monitoring for a user
 */
export function startRollbackMonitoring(userId: string): void {
  rollbackManager.startMonitoring(userId);
}

/**
 * Stops rollback monitoring for a user
 */
export function stopRollbackMonitoring(userId: string): void {
  rollbackManager.stopMonitoring(userId);
}