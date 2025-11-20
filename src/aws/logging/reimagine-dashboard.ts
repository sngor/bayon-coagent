/**
 * CloudWatch Dashboard for Reimagine Image Toolkit
 * 
 * This module defines a comprehensive CloudWatch dashboard for monitoring
 * the Reimagine Image Toolkit with visualizations for:
 * - Operation metrics (uploads, edits, downloads)
 * - Bedrock invocation metrics by model
 * - Processing time by edit type
 * - Error rates and counts
 * - Storage usage
 * 
 * Requirements: Task 29 - Monitoring and analytics
 */

// ============================================================================
// Dashboard Configuration
// ============================================================================

export interface DashboardWidget {
  type: 'metric' | 'log';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: any;
}

/**
 * Generates the Reimagine monitoring dashboard configuration
 */
export function generateReimagineDashboard(region: string = 'us-east-1'): string {
  const widgets: DashboardWidget[] = [
    // Row 1: Overview metrics
    {
      type: 'metric',
      x: 0,
      y: 0,
      width: 8,
      height: 6,
      properties: {
        title: 'Operation Count by Type',
        metrics: [
          ['BayonCoagent/Reimagine', 'OperationCount', { stat: 'Sum', label: 'Total Operations' }],
          ['...', { stat: 'Sum', label: 'Uploads', dimensions: { OperationType: 'upload' } }],
          ['...', { stat: 'Sum', label: 'Edits', dimensions: { OperationType: 'edit' } }],
          ['...', { stat: 'Sum', label: 'Downloads', dimensions: { OperationType: 'download' } }],
          ['...', { stat: 'Sum', label: 'Analysis', dimensions: { OperationType: 'analysis' } }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Count',
            showUnits: false,
          },
        },
      },
    },
    {
      type: 'metric',
      x: 8,
      y: 0,
      width: 8,
      height: 6,
      properties: {
        title: 'Success vs Failure Rate',
        metrics: [
          ['BayonCoagent/Reimagine', 'OperationCount', { stat: 'Sum', label: 'Success', dimensions: { Status: 'Success' } }],
          ['...', { stat: 'Sum', label: 'Failure', dimensions: { Status: 'Failure' } }],
        ],
        view: 'timeSeries',
        stacked: true,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Count',
            showUnits: false,
          },
        },
      },
    },
    {
      type: 'metric',
      x: 16,
      y: 0,
      width: 8,
      height: 6,
      properties: {
        title: 'Error Rate by Operation',
        metrics: [
          ['BayonCoagent/Reimagine', 'ErrorRate', { stat: 'Average', label: 'Upload', dimensions: { OperationType: 'upload' } }],
          ['...', { stat: 'Average', label: 'Edit', dimensions: { OperationType: 'edit' } }],
          ['...', { stat: 'Average', label: 'Analysis', dimensions: { OperationType: 'analysis' } }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Percent',
            showUnits: false,
          },
        },
        annotations: {
          horizontal: [
            {
              label: 'Error Rate Threshold',
              value: 10,
              fill: 'above',
              color: '#ff0000',
            },
          ],
        },
      },
    },

    // Row 2: Processing time metrics
    {
      type: 'metric',
      x: 0,
      y: 6,
      width: 12,
      height: 6,
      properties: {
        title: 'Average Processing Time by Edit Type',
        metrics: [
          ['BayonCoagent/Reimagine', 'OperationDuration', { stat: 'Average', label: 'Virtual Staging', dimensions: { EditType: 'virtual-staging' } }],
          ['...', { stat: 'Average', label: 'Day to Dusk', dimensions: { EditType: 'day-to-dusk' } }],
          ['...', { stat: 'Average', label: 'Enhance', dimensions: { EditType: 'enhance' } }],
          ['...', { stat: 'Average', label: 'Item Removal', dimensions: { EditType: 'item-removal' } }],
          ['...', { stat: 'Average', label: 'Virtual Renovation', dimensions: { EditType: 'virtual-renovation' } }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Milliseconds',
            showUnits: false,
          },
        },
        annotations: {
          horizontal: [
            {
              label: 'Slow Processing Threshold (60s)',
              value: 60000,
              fill: 'above',
              color: '#ff9900',
            },
          ],
        },
      },
    },
    {
      type: 'metric',
      x: 12,
      y: 6,
      width: 12,
      height: 6,
      properties: {
        title: 'Processing Time Percentiles',
        metrics: [
          ['BayonCoagent/Reimagine', 'OperationDuration', { stat: 'p50', label: 'p50 (Median)', dimensions: { OperationType: 'edit' } }],
          ['...', { stat: 'p90', label: 'p90' }],
          ['...', { stat: 'p99', label: 'p99' }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Milliseconds',
            showUnits: false,
          },
        },
      },
    },

    // Row 3: Bedrock metrics
    {
      type: 'metric',
      x: 0,
      y: 12,
      width: 8,
      height: 6,
      properties: {
        title: 'Bedrock Invocations by Model',
        metrics: [
          ['BayonCoagent/Reimagine', 'BedrockInvocationCount', { stat: 'Sum', label: 'Claude 3.5 Sonnet', dimensions: { ModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0' } }],
          ['...', { stat: 'Sum', label: 'Titan Image Generator', dimensions: { ModelId: 'amazon.titan-image-generator-v1' } }],
          ['...', { stat: 'Sum', label: 'Stable Diffusion XL', dimensions: { ModelId: 'stability.stable-diffusion-xl-v1' } }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Count',
            showUnits: false,
          },
        },
      },
    },
    {
      type: 'metric',
      x: 8,
      y: 12,
      width: 8,
      height: 6,
      properties: {
        title: 'Bedrock Invocation Duration by Model',
        metrics: [
          ['BayonCoagent/Reimagine', 'BedrockInvocationDuration', { stat: 'Average', label: 'Claude 3.5 Sonnet', dimensions: { ModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0' } }],
          ['...', { stat: 'Average', label: 'Titan Image Generator', dimensions: { ModelId: 'amazon.titan-image-generator-v1' } }],
          ['...', { stat: 'Average', label: 'Stable Diffusion XL', dimensions: { ModelId: 'stability.stable-diffusion-xl-v1' } }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Milliseconds',
            showUnits: false,
          },
        },
      },
    },
    {
      type: 'metric',
      x: 16,
      y: 12,
      width: 8,
      height: 6,
      properties: {
        title: 'Bedrock Errors by Type',
        metrics: [
          ['BayonCoagent/Reimagine', 'BedrockErrorCount', { stat: 'Sum', label: 'Throttling', dimensions: { ErrorType: 'ThrottlingException' } }],
          ['...', { stat: 'Sum', label: 'Validation', dimensions: { ErrorType: 'ValidationException' } }],
          ['...', { stat: 'Sum', label: 'Service', dimensions: { ErrorType: 'ServiceException' } }],
          ['...', { stat: 'Sum', label: 'Timeout', dimensions: { ErrorType: 'TimeoutError' } }],
        ],
        view: 'timeSeries',
        stacked: true,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Count',
            showUnits: false,
          },
        },
      },
    },

    // Row 4: Token usage
    {
      type: 'metric',
      x: 0,
      y: 18,
      width: 12,
      height: 6,
      properties: {
        title: 'Bedrock Token Usage',
        metrics: [
          ['BayonCoagent/Reimagine', 'BedrockInputTokens', { stat: 'Sum', label: 'Input Tokens' }],
          ['BayonCoagent/Reimagine', 'BedrockOutputTokens', { stat: 'Sum', label: 'Output Tokens' }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Tokens',
            showUnits: false,
          },
        },
      },
    },
    {
      type: 'metric',
      x: 12,
      y: 18,
      width: 12,
      height: 6,
      properties: {
        title: 'Token Usage by Model',
        metrics: [
          ['BayonCoagent/Reimagine', 'BedrockInputTokens', { stat: 'Sum', label: 'Claude Input', dimensions: { ModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0' } }],
          ['BayonCoagent/Reimagine', 'BedrockOutputTokens', { stat: 'Sum', label: 'Claude Output', dimensions: { ModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0' } }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Tokens',
            showUnits: false,
          },
        },
      },
    },

    // Row 5: Storage metrics
    {
      type: 'metric',
      x: 0,
      y: 24,
      width: 8,
      height: 6,
      properties: {
        title: 'Storage Operations',
        metrics: [
          ['BayonCoagent/Reimagine', 'StorageOperationCount', { stat: 'Sum', label: 'Uploads', dimensions: { Operation: 'upload' } }],
          ['...', { stat: 'Sum', label: 'Downloads', dimensions: { Operation: 'download' } }],
          ['...', { stat: 'Sum', label: 'Deletes', dimensions: { Operation: 'delete' } }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Count',
            showUnits: false,
          },
        },
      },
    },
    {
      type: 'metric',
      x: 8,
      y: 24,
      width: 8,
      height: 6,
      properties: {
        title: 'Storage Usage Growth',
        metrics: [
          ['BayonCoagent/Reimagine', 'StorageUsage', { stat: 'Sum', label: 'Net Storage Change', dimensions: { Operation: 'upload' } }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 3600, // 1 hour
        yAxis: {
          left: {
            label: 'Bytes',
            showUnits: false,
          },
        },
      },
    },
    {
      type: 'metric',
      x: 16,
      y: 24,
      width: 8,
      height: 6,
      properties: {
        title: 'Average Image Size',
        metrics: [
          ['BayonCoagent/Reimagine', 'ImageSize', { stat: 'Average', label: 'Average Upload Size' }],
        ],
        view: 'timeSeries',
        stacked: false,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Bytes',
            showUnits: false,
          },
        },
      },
    },

    // Row 6: Edit type distribution
    {
      type: 'metric',
      x: 0,
      y: 30,
      width: 24,
      height: 6,
      properties: {
        title: 'Edit Operations by Type',
        metrics: [
          ['BayonCoagent/Reimagine', 'OperationCount', { stat: 'Sum', label: 'Virtual Staging', dimensions: { OperationType: 'edit', EditType: 'virtual-staging' } }],
          ['...', { stat: 'Sum', label: 'Day to Dusk', dimensions: { OperationType: 'edit', EditType: 'day-to-dusk' } }],
          ['...', { stat: 'Sum', label: 'Enhance', dimensions: { OperationType: 'edit', EditType: 'enhance' } }],
          ['...', { stat: 'Sum', label: 'Item Removal', dimensions: { OperationType: 'edit', EditType: 'item-removal' } }],
          ['...', { stat: 'Sum', label: 'Virtual Renovation', dimensions: { OperationType: 'edit', EditType: 'virtual-renovation' } }],
        ],
        view: 'timeSeries',
        stacked: true,
        region,
        period: 300,
        yAxis: {
          left: {
            label: 'Count',
            showUnits: false,
          },
        },
      },
    },
  ];

  const dashboardBody = {
    widgets: widgets.map((widget) => ({
      type: 'metric',
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
      properties: widget.properties,
    })),
  };

  return JSON.stringify(dashboardBody, null, 2);
}

/**
 * Generates CloudFormation template for the Reimagine dashboard
 */
export function generateReimagineDashboardTemplate(region: string = 'us-east-1'): string {
  const dashboardBody = generateReimagineDashboard(region);

  return `# CloudWatch Dashboard for Reimagine Image Toolkit
# Generated automatically - do not edit manually

Resources:
  ReimagineDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: Reimagine-Image-Toolkit
      DashboardBody: |
${dashboardBody.split('\n').map(line => `        ${line}`).join('\n')}
`;
}

/**
 * Creates the dashboard using AWS SDK (for programmatic creation)
 */
export async function createReimagineDashboard(region: string = 'us-east-1'): Promise<void> {
  const { CloudWatchClient, PutDashboardCommand } = await import('@aws-sdk/client-cloudwatch');
  const { getConfig, getAWSCredentials } = await import('@/aws/config');

  const config = getConfig();
  const credentials = getAWSCredentials();

  const client = new CloudWatchClient({
    region: config.region,
    credentials: credentials.accessKeyId && credentials.secretAccessKey
      ? {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        }
      : undefined,
  });

  const dashboardBody = generateReimagineDashboard(region);

  const command = new PutDashboardCommand({
    DashboardName: 'Reimagine-Image-Toolkit',
    DashboardBody: dashboardBody,
  });

  await client.send(command);
  console.log('Reimagine dashboard created successfully');
}
