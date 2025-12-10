/**
 * CloudWatch Configuration for Onboarding Analytics
 * 
 * Defines log groups, metrics, and alarms for onboarding tracking.
 */

/**
 * CloudWatch Log Group configuration
 */
export const ONBOARDING_LOG_GROUP = '/bayon-coagent/onboarding';

/**
 * CloudWatch Log Stream naming
 */
export const ONBOARDING_LOG_STREAM_PREFIX = 'onboarding-events';

/**
 * Metric namespace for onboarding
 */
export const ONBOARDING_METRIC_NAMESPACE = 'BayonCoagent/Onboarding';

/**
 * Metric names for onboarding tracking
 */
export const ONBOARDING_METRICS = {
    STARTED: 'OnboardingStarted',
    COMPLETED: 'OnboardingCompleted',
    ABANDONED: 'OnboardingAbandoned',
    STEP_COMPLETED: 'StepCompleted',
    STEP_SKIPPED: 'StepSkipped',
    RESUMED: 'OnboardingResumed',
    FLOW_SWITCHED: 'FlowSwitched',
    COMPLETION_TIME: 'CompletionTime',
    STEP_TIME: 'StepTime',
} as const;

/**
 * Dimension names for metrics
 */
export const ONBOARDING_DIMENSIONS = {
    FLOW_TYPE: 'FlowType',
    STEP_ID: 'StepId',
    DEVICE_TYPE: 'DeviceType',
    USER_ID: 'UserId',
} as const;

/**
 * Alarm thresholds
 */
export const ONBOARDING_ALARM_THRESHOLDS = {
    LOW_COMPLETION_RATE: 0.5, // Alert if completion rate drops below 50%
    HIGH_ABANDONMENT_RATE: 0.3, // Alert if abandonment rate exceeds 30%
    SLOW_STEP_TIME: 300000, // Alert if step takes more than 5 minutes (in ms)
} as const;

/**
 * Log retention period (in days)
 */
export const ONBOARDING_LOG_RETENTION_DAYS = 30;

/**
 * CloudWatch Insights queries for onboarding analytics
 */
export const ONBOARDING_INSIGHTS_QUERIES = {
    /**
     * Query to get completion rate by flow type
     */
    COMPLETION_RATE_BY_FLOW: `
    fields @timestamp, eventType, flowType, userId
    | filter eventType in ["onboarding_started", "onboarding_completed"]
    | stats count() as total by eventType, flowType
    | sort flowType, eventType
  `,

    /**
     * Query to get step abandonment rates
     */
    STEP_ABANDONMENT: `
    fields @timestamp, eventType, stepId, flowType
    | filter eventType in ["step_completed", "step_skipped", "onboarding_abandoned"]
    | stats count() as total by stepId, eventType, flowType
    | sort flowType, stepId, eventType
  `,

    /**
     * Query to get average time per step
     */
    AVERAGE_STEP_TIME: `
    fields @timestamp, stepId, metadata.timeSpent, flowType
    | filter eventType = "step_completed" and metadata.timeSpent > 0
    | stats avg(metadata.timeSpent) as avgTime, count() as completions by stepId, flowType
    | sort flowType, stepId
  `,

    /**
     * Query to get total onboarding completion time
     */
    TOTAL_COMPLETION_TIME: `
    fields @timestamp, metadata.totalTime, flowType
    | filter eventType = "onboarding_completed" and metadata.totalTime > 0
    | stats avg(metadata.totalTime) as avgTime, min(metadata.totalTime) as minTime, max(metadata.totalTime) as maxTime by flowType
  `,

    /**
     * Query to get device type distribution
     */
    DEVICE_DISTRIBUTION: `
    fields @timestamp, metadata.deviceType, eventType
    | filter eventType = "onboarding_started"
    | stats count() as total by metadata.deviceType
  `,

    /**
     * Query to get user flow paths
     */
    USER_FLOW_PATHS: `
    fields @timestamp, userId, eventType, stepId, flowType
    | filter userId = "{userId}"
    | sort @timestamp asc
  `,

    /**
     * Query to get skip reasons
     */
    SKIP_REASONS: `
    fields @timestamp, stepId, metadata.skipReason, flowType
    | filter eventType = "step_skipped" and metadata.skipReason != ""
    | stats count() as total by stepId, metadata.skipReason, flowType
    | sort total desc
  `,

    /**
     * Query to get resume rate
     */
    RESUME_RATE: `
    fields @timestamp, eventType, userId
    | filter eventType in ["onboarding_abandoned", "onboarding_resumed"]
    | stats count() as total by eventType
  `,
} as const;

/**
 * Helper function to create a CloudWatch Insights query with date range
 */
export function createInsightsQuery(
    queryTemplate: string,
    startTime: Date,
    endTime: Date,
    variables?: Record<string, string>
): {
    queryString: string;
    startTime: number;
    endTime: number;
} {
    let queryString = queryTemplate;

    // Replace variables in query
    if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
            queryString = queryString.replace(`{${key}}`, value);
        });
    }

    return {
        queryString,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
    };
}

/**
 * Helper function to format metric data for CloudWatch
 */
export function formatMetricData(
    metricName: string,
    value: number,
    dimensions: Record<string, string>,
    timestamp?: Date
): {
    MetricName: string;
    Value: number;
    Timestamp: Date;
    Dimensions: Array<{ Name: string; Value: string }>;
    Unit: string;
} {
    return {
        MetricName: metricName,
        Value: value,
        Timestamp: timestamp || new Date(),
        Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
        Unit: metricName.includes('Time') ? 'Milliseconds' : 'Count',
    };
}

/**
 * Helper function to create log stream name
 */
export function createLogStreamName(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const instanceId = process.env.AWS_LAMBDA_LOG_STREAM_NAME || 'local';

    return `${ONBOARDING_LOG_STREAM_PREFIX}/${year}/${month}/${day}/${instanceId}`;
}
