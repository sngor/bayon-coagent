/**
 * CloudWatch Dashboard Configuration
 * 
 * Defines dashboard layouts and metrics for monitoring the application.
 * This configuration can be used with AWS CDK or CloudFormation to create dashboards.
 */

export interface DashboardWidget {
  type: 'metric' | 'log' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: any;
}

export interface DashboardConfig {
  name: string;
  widgets: DashboardWidget[];
}

/**
 * System Health Dashboard
 * Overview of all services and their health status
 */
export const systemHealthDashboard: DashboardConfig = {
  name: 'BayonCoAgent-SystemHealth',
  widgets: [
    // Header
    {
      type: 'text',
      x: 0,
      y: 0,
      width: 24,
      height: 1,
      properties: {
        markdown: '# Bayon CoAgent - System Health Dashboard',
      },
    },

    // Authentication Metrics
    {
      type: 'metric',
      x: 0,
      y: 1,
      width: 12,
      height: 6,
      properties: {
        title: 'Authentication Success Rate',
        metrics: [
          ['AWS/Cognito', 'SignInSuccesses', { stat: 'Sum', label: 'Successful' }],
          ['.', 'SignInThrottles', { stat: 'Sum', label: 'Throttled' }],
        ],
        period: 300,
        stat: 'Sum',
        region: 'us-east-1',
        yAxis: {
          left: {
            min: 0,
          },
        },
      },
    },

    // DynamoDB Metrics
    {
      type: 'metric',
      x: 12,
      y: 1,
      width: 12,
      height: 6,
      properties: {
        title: 'DynamoDB Operations',
        metrics: [
          ['AWS/DynamoDB', 'SuccessfulRequestLatency', { stat: 'Average' }],
          ['.', 'UserErrors', { stat: 'Sum' }],
          ['.', 'SystemErrors', { stat: 'Sum' }],
        ],
        period: 300,
        stat: 'Average',
        region: 'us-east-1',
      },
    },

    // Bedrock AI Metrics
    {
      type: 'metric',
      x: 0,
      y: 7,
      width: 12,
      height: 6,
      properties: {
        title: 'Bedrock AI Requests',
        metrics: [
          ['AWS/Bedrock', 'Invocations', { stat: 'Sum', label: 'Total Requests' }],
          ['.', 'InvocationLatency', { stat: 'Average', label: 'Avg Latency (ms)' }],
          ['.', 'InvocationClientErrors', { stat: 'Sum', label: 'Client Errors' }],
          ['.', 'InvocationServerErrors', { stat: 'Sum', label: 'Server Errors' }],
        ],
        period: 300,
        region: 'us-east-1',
      },
    },

    // S3 Metrics
    {
      type: 'metric',
      x: 12,
      y: 7,
      width: 12,
      height: 6,
      properties: {
        title: 'S3 Storage Operations',
        metrics: [
          ['AWS/S3', 'AllRequests', { stat: 'Sum', label: 'Total Requests' }],
          ['.', '4xxErrors', { stat: 'Sum', label: '4xx Errors' }],
          ['.', '5xxErrors', { stat: 'Sum', label: '5xx Errors' }],
        ],
        period: 300,
        region: 'us-east-1',
      },
    },

    // Error Rate
    {
      type: 'metric',
      x: 0,
      y: 13,
      width: 24,
      height: 6,
      properties: {
        title: 'Overall Error Rate',
        metrics: [
          ['BayonCoAgent', 'ErrorCount', { stat: 'Sum', label: 'Total Errors' }],
          ['.', 'ErrorRate', { stat: 'Average', label: 'Error Rate (%)' }],
        ],
        period: 300,
        region: 'us-east-1',
        yAxis: {
          left: {
            min: 0,
          },
        },
      },
    },
  ],
};

/**
 * Performance Dashboard
 * Detailed performance metrics and latency tracking
 */
export const performanceDashboard: DashboardConfig = {
  name: 'BayonCoAgent-Performance',
  widgets: [
    {
      type: 'text',
      x: 0,
      y: 0,
      width: 24,
      height: 1,
      properties: {
        markdown: '# Bayon CoAgent - Performance Dashboard',
      },
    },

    // API Response Times
    {
      type: 'metric',
      x: 0,
      y: 1,
      width: 12,
      height: 6,
      properties: {
        title: 'API Response Times (p50, p95, p99)',
        metrics: [
          ['BayonCoAgent', 'APILatency', { stat: 'p50', label: 'p50' }],
          ['.', '.', { stat: 'p95', label: 'p95' }],
          ['.', '.', { stat: 'p99', label: 'p99' }],
        ],
        period: 300,
        region: 'us-east-1',
        yAxis: {
          left: {
            label: 'Milliseconds',
            min: 0,
          },
        },
      },
    },

    // Database Query Performance
    {
      type: 'metric',
      x: 12,
      y: 1,
      width: 12,
      height: 6,
      properties: {
        title: 'Database Query Latency',
        metrics: [
          ['AWS/DynamoDB', 'SuccessfulRequestLatency', { stat: 'p50', label: 'p50' }],
          ['.', '.', { stat: 'p95', label: 'p95' }],
          ['.', '.', { stat: 'p99', label: 'p99' }],
        ],
        period: 300,
        region: 'us-east-1',
        yAxis: {
          left: {
            label: 'Milliseconds',
            min: 0,
          },
        },
      },
    },

    // AI Generation Performance
    {
      type: 'metric',
      x: 0,
      y: 7,
      width: 12,
      height: 6,
      properties: {
        title: 'AI Generation Latency',
        metrics: [
          ['AWS/Bedrock', 'InvocationLatency', { stat: 'p50', label: 'p50' }],
          ['.', '.', { stat: 'p95', label: 'p95' }],
          ['.', '.', { stat: 'p99', label: 'p99' }],
        ],
        period: 300,
        region: 'us-east-1',
        yAxis: {
          left: {
            label: 'Milliseconds',
            min: 0,
          },
        },
      },
    },

    // Throughput
    {
      type: 'metric',
      x: 12,
      y: 7,
      width: 12,
      height: 6,
      properties: {
        title: 'Request Throughput',
        metrics: [
          ['BayonCoAgent', 'RequestCount', { stat: 'Sum', label: 'Total Requests' }],
        ],
        period: 60,
        region: 'us-east-1',
        yAxis: {
          left: {
            label: 'Requests per minute',
            min: 0,
          },
        },
      },
    },
  ],
};

/**
 * Cost Tracking Dashboard
 * Monitor AWS service costs and usage
 */
export const costDashboard: DashboardConfig = {
  name: 'BayonCoAgent-Cost',
  widgets: [
    {
      type: 'text',
      x: 0,
      y: 0,
      width: 24,
      height: 1,
      properties: {
        markdown: '# Bayon CoAgent - Cost Tracking Dashboard',
      },
    },

    // DynamoDB Costs
    {
      type: 'metric',
      x: 0,
      y: 1,
      width: 12,
      height: 6,
      properties: {
        title: 'DynamoDB Read/Write Units',
        metrics: [
          ['AWS/DynamoDB', 'ConsumedReadCapacityUnits', { stat: 'Sum' }],
          ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum' }],
        ],
        period: 3600,
        region: 'us-east-1',
      },
    },

    // Bedrock Token Usage
    {
      type: 'metric',
      x: 12,
      y: 1,
      width: 12,
      height: 6,
      properties: {
        title: 'Bedrock Token Usage',
        metrics: [
          ['AWS/Bedrock', 'InputTokens', { stat: 'Sum', label: 'Input Tokens' }],
          ['.', 'OutputTokens', { stat: 'Sum', label: 'Output Tokens' }],
        ],
        period: 3600,
        region: 'us-east-1',
      },
    },

    // S3 Storage
    {
      type: 'metric',
      x: 0,
      y: 7,
      width: 12,
      height: 6,
      properties: {
        title: 'S3 Storage Size',
        metrics: [
          ['AWS/S3', 'BucketSizeBytes', { stat: 'Average' }],
          ['.', 'NumberOfObjects', { stat: 'Average' }],
        ],
        period: 86400,
        region: 'us-east-1',
      },
    },

    // Request Counts (for cost estimation)
    {
      type: 'metric',
      x: 12,
      y: 7,
      width: 12,
      height: 6,
      properties: {
        title: 'Service Request Counts',
        metrics: [
          ['AWS/DynamoDB', 'UserErrors', { stat: 'Sum', label: 'DynamoDB Requests' }],
          ['AWS/Bedrock', 'Invocations', { stat: 'Sum', label: 'Bedrock Requests' }],
          ['AWS/S3', 'AllRequests', { stat: 'Sum', label: 'S3 Requests' }],
        ],
        period: 3600,
        region: 'us-east-1',
      },
    },
  ],
};

/**
 * User Activity Dashboard
 * Track user engagement and activity patterns
 */
export const userActivityDashboard: DashboardConfig = {
  name: 'BayonCoAgent-UserActivity',
  widgets: [
    {
      type: 'text',
      x: 0,
      y: 0,
      width: 24,
      height: 1,
      properties: {
        markdown: '# Bayon CoAgent - User Activity Dashboard',
      },
    },

    // Active Users
    {
      type: 'metric',
      x: 0,
      y: 1,
      width: 12,
      height: 6,
      properties: {
        title: 'Active Users',
        metrics: [
          ['BayonCoAgent', 'ActiveUsers', { stat: 'Sum', label: 'Active Users' }],
          ['.', 'NewUsers', { stat: 'Sum', label: 'New Registrations' }],
        ],
        period: 3600,
        region: 'us-east-1',
      },
    },

    // Feature Usage
    {
      type: 'metric',
      x: 12,
      y: 1,
      width: 12,
      height: 6,
      properties: {
        title: 'Feature Usage',
        metrics: [
          ['BayonCoAgent', 'AIGenerations', { stat: 'Sum', label: 'AI Generations' }],
          ['.', 'FileUploads', { stat: 'Sum', label: 'File Uploads' }],
          ['.', 'DataQueries', { stat: 'Sum', label: 'Data Queries' }],
        ],
        period: 3600,
        region: 'us-east-1',
      },
    },

    // User Sessions
    {
      type: 'metric',
      x: 0,
      y: 7,
      width: 24,
      height: 6,
      properties: {
        title: 'User Sessions',
        metrics: [
          ['BayonCoAgent', 'SessionDuration', { stat: 'Average', label: 'Avg Session Duration (min)' }],
          ['.', 'SessionCount', { stat: 'Sum', label: 'Total Sessions' }],
        ],
        period: 3600,
        region: 'us-east-1',
      },
    },
  ],
};

/**
 * Export all dashboard configurations
 */
export const dashboards = {
  systemHealth: systemHealthDashboard,
  performance: performanceDashboard,
  cost: costDashboard,
  userActivity: userActivityDashboard,
};

/**
 * Generate CloudFormation template for dashboards
 */
export function generateDashboardTemplate(config: DashboardConfig): string {
  return JSON.stringify(
    {
      DashboardName: config.name,
      DashboardBody: JSON.stringify({
        widgets: config.widgets,
      }),
    },
    null,
    2
  );
}
