/**
 * Workflow Analytics Service
 * 
 * Tracks workflow-related events and metrics for analytics and monitoring.
 * Sends structured events to CloudWatch for analysis and reporting.
 * 
 * Events tracked:
 * - Workflow start events
 * - Step completion events
 * - Step skip events
 * - Workflow completion events
 * - Workflow abandonment (stale)
 * - Time spent on each step
 * 
 * Requirements: 8.4, 8.5
 */

import { cloudWatchLogger } from '@/services/monitoring/cloudwatch-logging-service';
import type { BusinessEventLog, PerformanceMetrics } from '@/services/monitoring/cloudwatch-logging-service';
import type { WorkflowInstance, WorkflowPreset } from '@/types/workflows';

/**
 * Analytics event types
 */
export enum WorkflowEventType {
    WORKFLOW_STARTED = 'workflow_started',
    WORKFLOW_COMPLETED = 'workflow_completed',
    WORKFLOW_ABANDONED = 'workflow_abandoned',
    STEP_COMPLETED = 'step_completed',
    STEP_SKIPPED = 'step_skipped',
    STEP_STARTED = 'step_started',
}

/**
 * Workflow analytics event data
 */
export interface WorkflowAnalyticsEvent {
    eventType: WorkflowEventType;
    userId: string;
    workflowInstanceId: string;
    workflowPresetId: string;
    workflowTitle: string;
    workflowCategory: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

/**
 * Step analytics event data
 */
export interface StepAnalyticsEvent extends WorkflowAnalyticsEvent {
    stepId: string;
    stepTitle: string;
    stepIndex: number;
    totalSteps: number;
    isOptional: boolean;
    timeSpentMinutes?: number;
}

/**
 * Workflow Analytics Service
 */
export class WorkflowAnalyticsService {
    private stepStartTimes: Map<string, Date> = new Map();

    /**
     * Track workflow start event
     * 
     * @param userId User ID
     * @param instance Workflow instance
     * @param preset Workflow preset
     */
    trackWorkflowStart(
        userId: string,
        instance: WorkflowInstance,
        preset: WorkflowPreset
    ): void {
        const event: WorkflowAnalyticsEvent = {
            eventType: WorkflowEventType.WORKFLOW_STARTED,
            userId,
            workflowInstanceId: instance.id,
            workflowPresetId: preset.id,
            workflowTitle: preset.title,
            workflowCategory: preset.category,
            timestamp: new Date(),
            metadata: {
                estimatedMinutes: preset.estimatedMinutes,
                totalSteps: preset.steps.length,
                requiredSteps: preset.steps.filter(s => !s.isOptional).length,
                optionalSteps: preset.steps.filter(s => s.isOptional).length,
                isRecommended: preset.isRecommended,
                tags: preset.tags,
            },
        };

        this.logAnalyticsEvent(event);
    }

    /**
     * Track step start event (for time tracking)
     * 
     * @param userId User ID
     * @param instance Workflow instance
     * @param preset Workflow preset
     * @param stepId Step ID
     */
    trackStepStart(
        userId: string,
        instance: WorkflowInstance,
        preset: WorkflowPreset,
        stepId: string
    ): void {
        const step = preset.steps.find(s => s.id === stepId);
        if (!step) return;

        const stepKey = `${instance.id}:${stepId}`;
        this.stepStartTimes.set(stepKey, new Date());

        const stepIndex = preset.steps.findIndex(s => s.id === stepId);

        const event: StepAnalyticsEvent = {
            eventType: WorkflowEventType.STEP_STARTED,
            userId,
            workflowInstanceId: instance.id,
            workflowPresetId: preset.id,
            workflowTitle: preset.title,
            workflowCategory: preset.category,
            stepId,
            stepTitle: step.title,
            stepIndex,
            totalSteps: preset.steps.length,
            isOptional: step.isOptional,
            timestamp: new Date(),
            metadata: {
                estimatedMinutes: step.estimatedMinutes,
                hubRoute: step.hubRoute,
                completedSteps: instance.completedSteps.length,
                skippedSteps: instance.skippedSteps.length,
            },
        };

        this.logAnalyticsEvent(event);
    }

    /**
     * Track step completion event
     * 
     * @param userId User ID
     * @param instance Workflow instance
     * @param preset Workflow preset
     * @param stepId Step ID
     * @param contextData Optional context data captured
     */
    trackStepCompletion(
        userId: string,
        instance: WorkflowInstance,
        preset: WorkflowPreset,
        stepId: string,
        contextData?: Record<string, any>
    ): void {
        const step = preset.steps.find(s => s.id === stepId);
        if (!step) return;

        const stepIndex = preset.steps.findIndex(s => s.id === stepId);
        const stepKey = `${instance.id}:${stepId}`;
        const timeSpentMinutes = this.calculateTimeSpent(stepKey);

        const event: StepAnalyticsEvent = {
            eventType: WorkflowEventType.STEP_COMPLETED,
            userId,
            workflowInstanceId: instance.id,
            workflowPresetId: preset.id,
            workflowTitle: preset.title,
            workflowCategory: preset.category,
            stepId,
            stepTitle: step.title,
            stepIndex,
            totalSteps: preset.steps.length,
            isOptional: step.isOptional,
            timeSpentMinutes,
            timestamp: new Date(),
            metadata: {
                estimatedMinutes: step.estimatedMinutes,
                hubRoute: step.hubRoute,
                completedSteps: instance.completedSteps.length + 1,
                skippedSteps: instance.skippedSteps.length,
                progressPercentage: ((instance.completedSteps.length + 1 + instance.skippedSteps.length) / preset.steps.length) * 100,
                hasContextData: !!contextData && Object.keys(contextData).length > 0,
                contextOutputs: step.contextOutputs,
            },
        };

        this.logAnalyticsEvent(event, timeSpentMinutes ? {
            duration: timeSpentMinutes * 60 * 1000, // Convert to milliseconds
        } : undefined);

        // Clean up step start time
        this.stepStartTimes.delete(stepKey);
    }

    /**
     * Track step skip event
     * 
     * @param userId User ID
     * @param instance Workflow instance
     * @param preset Workflow preset
     * @param stepId Step ID
     */
    trackStepSkip(
        userId: string,
        instance: WorkflowInstance,
        preset: WorkflowPreset,
        stepId: string
    ): void {
        const step = preset.steps.find(s => s.id === stepId);
        if (!step) return;

        const stepIndex = preset.steps.findIndex(s => s.id === stepId);
        const stepKey = `${instance.id}:${stepId}`;
        const timeSpentMinutes = this.calculateTimeSpent(stepKey);

        const event: StepAnalyticsEvent = {
            eventType: WorkflowEventType.STEP_SKIPPED,
            userId,
            workflowInstanceId: instance.id,
            workflowPresetId: preset.id,
            workflowTitle: preset.title,
            workflowCategory: preset.category,
            stepId,
            stepTitle: step.title,
            stepIndex,
            totalSteps: preset.steps.length,
            isOptional: step.isOptional,
            timeSpentMinutes,
            timestamp: new Date(),
            metadata: {
                estimatedMinutes: step.estimatedMinutes,
                hubRoute: step.hubRoute,
                completedSteps: instance.completedSteps.length,
                skippedSteps: instance.skippedSteps.length + 1,
                progressPercentage: ((instance.completedSteps.length + instance.skippedSteps.length + 1) / preset.steps.length) * 100,
            },
        };

        this.logAnalyticsEvent(event);

        // Clean up step start time
        this.stepStartTimes.delete(stepKey);
    }

    /**
     * Track workflow completion event
     * 
     * @param userId User ID
     * @param instance Workflow instance
     * @param preset Workflow preset
     * @param actualMinutes Actual time taken to complete
     */
    trackWorkflowCompletion(
        userId: string,
        instance: WorkflowInstance,
        preset: WorkflowPreset,
        actualMinutes: number
    ): void {
        const event: WorkflowAnalyticsEvent = {
            eventType: WorkflowEventType.WORKFLOW_COMPLETED,
            userId,
            workflowInstanceId: instance.id,
            workflowPresetId: preset.id,
            workflowTitle: preset.title,
            workflowCategory: preset.category,
            timestamp: new Date(),
            metadata: {
                estimatedMinutes: preset.estimatedMinutes,
                actualMinutes,
                timeVarianceMinutes: actualMinutes - preset.estimatedMinutes,
                timeVariancePercentage: ((actualMinutes - preset.estimatedMinutes) / preset.estimatedMinutes) * 100,
                totalSteps: preset.steps.length,
                completedSteps: instance.completedSteps.length,
                skippedSteps: instance.skippedSteps.length,
                completionRate: (instance.completedSteps.length / preset.steps.filter(s => !s.isOptional).length) * 100,
                startedAt: instance.startedAt,
                completedAt: instance.completedAt,
            },
        };

        this.logAnalyticsEvent(event, {
            duration: actualMinutes * 60 * 1000, // Convert to milliseconds
        });
    }

    /**
     * Track workflow abandonment (stale workflow)
     * 
     * @param userId User ID
     * @param instance Workflow instance
     * @param preset Workflow preset
     * @param daysSinceLastActive Days since last activity
     */
    trackWorkflowAbandonment(
        userId: string,
        instance: WorkflowInstance,
        preset: WorkflowPreset,
        daysSinceLastActive: number
    ): void {
        const event: WorkflowAnalyticsEvent = {
            eventType: WorkflowEventType.WORKFLOW_ABANDONED,
            userId,
            workflowInstanceId: instance.id,
            workflowPresetId: preset.id,
            workflowTitle: preset.title,
            workflowCategory: preset.category,
            timestamp: new Date(),
            metadata: {
                daysSinceLastActive,
                totalSteps: preset.steps.length,
                completedSteps: instance.completedSteps.length,
                skippedSteps: instance.skippedSteps.length,
                progressPercentage: ((instance.completedSteps.length + instance.skippedSteps.length) / preset.steps.length) * 100,
                lastActiveAt: instance.lastActiveAt,
                startedAt: instance.startedAt,
                abandonedAtStep: instance.currentStepId,
            },
        };

        this.logAnalyticsEvent(event);
    }

    /**
     * Calculate time spent on a step
     * 
     * @param stepKey Step key (instanceId:stepId)
     * @returns Time spent in minutes, or undefined if not tracked
     */
    private calculateTimeSpent(stepKey: string): number | undefined {
        const startTime = this.stepStartTimes.get(stepKey);
        if (!startTime) return undefined;

        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();
        return Math.round(durationMs / 60000); // Convert to minutes
    }

    /**
     * Log analytics event to CloudWatch
     * 
     * @param event Analytics event
     * @param performanceMetrics Optional performance metrics
     */
    private logAnalyticsEvent(
        event: WorkflowAnalyticsEvent | StepAnalyticsEvent,
        performanceMetrics?: PerformanceMetrics
    ): void {
        const businessEvent: BusinessEventLog = {
            eventType: event.eventType,
            eventData: {
                ...event,
                timestamp: event.timestamp.toISOString(),
            },
            businessMetrics: {
                userEngagement: this.calculateEngagementScore(event),
            },
            tags: [
                `workflow:${event.workflowPresetId}`,
                `category:${event.workflowCategory}`,
                `event:${event.eventType}`,
            ],
        };

        cloudWatchLogger.logBusinessEvent(
            `Workflow Analytics: ${event.eventType}`,
            {
                operation: event.eventType,
                service: 'workflow-analytics',
                userId: event.userId,
                timestamp: event.timestamp,
                metadata: event.metadata,
            },
            businessEvent,
            performanceMetrics
        );
    }

    /**
     * Calculate engagement score for an event
     * 
     * @param event Analytics event
     * @returns Engagement score (0-100)
     */
    private calculateEngagementScore(event: WorkflowAnalyticsEvent | StepAnalyticsEvent): number {
        switch (event.eventType) {
            case WorkflowEventType.WORKFLOW_STARTED:
                return 20; // Starting a workflow shows initial engagement
            case WorkflowEventType.STEP_COMPLETED:
                return 50; // Completing steps shows active engagement
            case WorkflowEventType.STEP_SKIPPED:
                return 30; // Skipping shows some engagement but less commitment
            case WorkflowEventType.WORKFLOW_COMPLETED:
                return 100; // Completing a workflow shows maximum engagement
            case WorkflowEventType.WORKFLOW_ABANDONED:
                return 0; // Abandonment shows no engagement
            default:
                return 0;
        }
    }
}

/**
 * Singleton instance of WorkflowAnalyticsService
 */
let analyticsServiceInstance: WorkflowAnalyticsService | null = null;

export function getWorkflowAnalyticsService(): WorkflowAnalyticsService {
    if (!analyticsServiceInstance) {
        analyticsServiceInstance = new WorkflowAnalyticsService();
    }
    return analyticsServiceInstance;
}
