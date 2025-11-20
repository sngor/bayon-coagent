/**
 * Test setup for MLS Social Integration tests
 * Mocks AWS SDK dependencies
 */

// Mock AWS CloudWatch
jest.mock('@aws-sdk/client-cloudwatch', () => ({
    CloudWatchClient: jest.fn().mockImplementation(() => ({
        send: jest.fn(),
    })),
    PutMetricDataCommand: jest.fn(),
}));

// Mock AWS CloudWatch Logs
jest.mock('@aws-sdk/client-cloudwatch-logs', () => ({
    CloudWatchLogsClient: jest.fn().mockImplementation(() => ({
        send: jest.fn(),
    })),
    PutLogEventsCommand: jest.fn(),
    CreateLogGroupCommand: jest.fn(),
    CreateLogStreamCommand: jest.fn(),
}));
