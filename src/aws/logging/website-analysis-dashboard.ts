/**
 * CloudWatch Dashboard Configuration for Website Analysis
 * 
 * Provides a comprehensive monitoring dashboard for the website analysis feature:
 * - Analysis success/failure rates
 * - Performance metrics (duration, throughput)
 * - Error tracking by type
 * - Score distribution
 * 
 * Requirements: All (Task 20)
 */

import { CloudWatchClient, PutDashboardCommand } from '@aws-sdk/client-cloudwatch';
import { getConfig, getAWSCredentials } from '@/aws/config';

/**
 * Dashboard configuration for website analysis monitoring
 */
export function getWebsiteAnalysisDashboardConfig(region: string = 'us-east-1') {
    const namespace = 'BayonCoagent/WebsiteAnalysis';

    return {
        widgets: [
            // Row 1: Overview metrics
            {
                type: 'metric',
                x: 0,
                y: 0,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        [namespace, 'AnalysisStarted', { stat: 'Sum', label: 'Started' }],
                        ['.', 'AnalysisCompleted', { stat: 'Sum', label: 'Completed' }],
                        ['.', 'AnalysisFailed', { stat: 'Sum', label: 'Failed' }],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region,
                    title: 'Analysis Volume',
                    period: 300,
                    yAxis: {
                        left: {
                            min: 0,
                        },
                    },
                },
            },
            {
                type: 'metric',
                x: 6,
                y: 0,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        [
                            {
                                expression: '(m2 / (m1 + m2)) * 100',
                                label: 'Success Rate',
                                id: 'e1',
                            },
                        ],
                        [namespace, 'AnalysisCompleted', { id: 'm2', visible: false }],
                        ['.', 'AnalysisFailed', { id: 'm1', visible: false }],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region,
                    title: 'Success Rate (%)',
                    period: 300,
                    yAxis: {
                        left: {
                            min: 0,
                            max: 100,
                        },
                    },
                },
            },
            {
                type: 'metric',
                x: 12,
                y: 0,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        [namespace, 'AnalysisDuration', { stat: 'Average', label: 'Avg' }],
                        ['...', { stat: 'p50', label: 'p50' }],
                        ['...', { stat: 'p90', label: 'p90' }],
                        ['...', { stat: 'p99', label: 'p99' }],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region,
                    title: 'Analysis Duration (ms)',
                    period: 300,
                    yAxis: {
                        left: {
                            min: 0,
                        },
                    },
                },
            },
            {
                type: 'metric',
                x: 18,
                y: 0,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        [namespace, 'OverallScore', { stat: 'Average', label: 'Average Score' }],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region,
                    title: 'Average Optimization Score',
                    period: 300,
                    yAxis: {
                        left: {
                            min: 0,
                            max: 100,
                        },
                    },
                },
            },

            // Row 2: Performance breakdown
            {
                type: 'metric',
                x: 0,
                y: 6,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        [namespace, 'CrawlDuration', { stat: 'Average', label: 'Crawl' }],
                        ['.', 'ExtractionDuration', { stat: 'Average', label: 'Extraction' }],
                        ['.', 'AIAnalysisDuration', { stat: 'Average', label: 'AI Analysis' }],
                    ],
                    view: 'timeSeries',
                    stacked: true,
                    region,
                    title: 'Duration Breakdown (ms)',
                    period: 300,
                    yAxis: {
                        left: {
                            min: 0,
                        },
                    },
                },
            },
            {
                type: 'metric',
                x: 8,
                y: 6,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        [namespace, 'PagesCrawled', { stat: 'Average', label: 'Pages' }],
                        ['.', 'SchemaTypesFound', { stat: 'Average', label: 'Schema Types' }],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region,
                    title: 'Data Collected',
                    period: 300,
                    yAxis: {
                        left: {
                            min: 0,
                        },
                    },
                },
            },
            {
                type: 'metric',
                x: 16,
                y: 6,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        [namespace, 'ErrorRate', 'ErrorType', 'ValidationError', { stat: 'Sum' }],
                        ['...', 'NetworkError', { stat: 'Sum' }],
                        ['...', 'TimeoutError', { stat: 'Sum' }],
                        ['...', 'SSLError', { stat: 'Sum' }],
                        ['...', 'ParsingError', { stat: 'Sum' }],
                        ['...', 'AIServiceError', { stat: 'Sum' }],
                        ['...', 'DatabaseError', { stat: 'Sum' }],
                        ['...', 'UnknownError', { stat: 'Sum' }],
                    ],
                    view: 'timeSeries',
                    stacked: true,
                    region,
                    title: 'Errors by Type',
                    period: 300,
                    yAxis: {
                        left: {
                            min: 0,
                        },
                    },
                },
            },

            // Row 3: Single value metrics
            {
                type: 'metric',
                x: 0,
                y: 12,
                width: 6,
                height: 3,
                properties: {
                    metrics: [[namespace, 'AnalysisCompleted', { stat: 'Sum' }]],
                    view: 'singleValue',
                    region,
                    title: 'Total Analyses (24h)',
                    period: 86400,
                },
            },
            {
                type: 'metric',
                x: 6,
                y: 12,
                width: 6,
                height: 3,
                properties: {
                    metrics: [
                        [
                            {
                                expression: '(m2 / (m1 + m2)) * 100',
                                label: 'Success Rate',
                                id: 'e1',
                            },
                        ],
                        [namespace, 'AnalysisCompleted', { id: 'm2', visible: false }],
                        ['.', 'AnalysisFailed', { id: 'm1', visible: false }],
                    ],
                    view: 'singleValue',
                    region,
                    title: 'Success Rate (24h)',
                    period: 86400,
                },
            },
            {
                type: 'metric',
                x: 12,
                y: 12,
                width: 6,
                height: 3,
                properties: {
                    metrics: [[namespace, 'AnalysisDuration', { stat: 'Average' }]],
                    view: 'singleValue',
                    region,
                    title: 'Avg Duration (24h)',
                    period: 86400,
                },
            },
            {
                type: 'metric',
                x: 18,
                y: 12,
                width: 6,
                height: 3,
                properties: {
                    metrics: [[namespace, 'OverallScore', { stat: 'Average' }]],
                    view: 'singleValue',
                    region,
                    title: 'Avg Score (24h)',
                    period: 86400,
                },
            },

            // Row 4: Log insights
            {
                type: 'log',
                x: 0,
                y: 15,
                width: 24,
                height: 6,
                properties: {
                    query: `SOURCE '/aws/lambda/website-analysis'
| fields @timestamp, @message, context.userId, context.websiteUrl, context.duration, context.score, context.errorType
| filter context.operation = 'analyzeWebsite'
| sort @timestamp desc
| limit 100`,
                    region,
                    title: 'Recent Website Analyses',
                    stacked: false,
                },
            },
        ],
    };
}

/**
 * Create or update the website analysis CloudWatch dashboard
 */
export async function createWebsiteAnalysisDashboard(
    region: string = 'us-east-1'
): Promise<void> {
    const config = getConfig();
    const credentials = getAWSCredentials();

    const client = new CloudWatchClient({
        region: config.region,
        credentials: credentials.accessKeyId && credentials.secretAccessKey
            ? credentials
            : undefined,
    });

    const dashboardConfig = getWebsiteAnalysisDashboardConfig(region);

    const command = new PutDashboardCommand({
        DashboardName: 'BayonCoagent-WebsiteAnalysis',
        DashboardBody: JSON.stringify(dashboardConfig),
    });

    try {
        await client.send(command);
        console.log('Website Analysis dashboard created/updated successfully');
    } catch (error) {
        console.error('Failed to create Website Analysis dashboard:', error);
        throw error;
    }
}

/**
 * Example usage:
 * 
 * import { createWebsiteAnalysisDashboard } from '@/aws/logging/website-analysis-dashboard';
 * 
 * // Create the dashboard
 * await createWebsiteAnalysisDashboard('us-east-1');
 */
