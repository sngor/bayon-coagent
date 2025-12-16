// Jest setup file for microservices tests

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-cloudwatch');
jest.mock('@aws-sdk/client-eventbridge');
jest.mock('@aws-sdk/client-sqs');
jest.mock('@aws-sdk/client-lambda');

// Mock X-Ray SDK
jest.mock('aws-xray-sdk-core', () => ({
    captureAWSv3Client: jest.fn((client) => client),
    captureHTTPsGlobal: jest.fn(),
    captureAsyncFunc: jest.fn((name, fn) => fn(null)),
    getSegment: jest.fn(() => ({
        trace_id: 'test-trace-id',
        addAnnotation: jest.fn(),
        addMetadata: jest.fn(),
        setUser: jest.fn(),
        close: jest.fn(),
        addError: jest.fn(),
    })),
}));

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_TABLE_NAME = 'BayonCoAgent-test';
process.env.EVENT_BUS_NAME = 'bayon-coagent-events-test';
process.env.XRAY_TRACING_ENABLED = 'false';

// Global test timeout
jest.setTimeout(30000);