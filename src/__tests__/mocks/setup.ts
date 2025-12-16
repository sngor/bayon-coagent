// Jest setup file for microservices tests
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    // Uncomment to ignore specific console methods
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    // warn: jest.fn(),
    // error: jest.fn(),
};

// Setup for property-based testing with fast-check
// Increase timeout for property-based tests
jest.setTimeout(30000);

// Mock AWS SDK for testing
jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({
        send: jest.fn(),
    })),
    GetItemCommand: jest.fn(),
    PutItemCommand: jest.fn(),
    UpdateItemCommand: jest.fn(),
    DeleteItemCommand: jest.fn(),
    QueryCommand: jest.fn(),
    ScanCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({
        send: jest.fn(),
    })),
    GetObjectCommand: jest.fn(),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
        send: jest.fn(),
    })),
    InvokeModelCommand: jest.fn(),
    InvokeModelWithResponseStreamCommand: jest.fn(),
}));

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';
process.env.USE_LOCAL_AWS = 'true';
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_TABLE_NAME = 'test-table';
process.env.S3_BUCKET_NAME = 'test-bucket';

// Global test utilities
global.testUtils = {
    // Helper for generating test data
    generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

    // Helper for async test cleanup
    cleanup: async () => {
        // Add any global cleanup logic here
        jest.clearAllMocks();
    },

    // Helper for property-based test configuration
    propertyTestConfig: {
        numRuns: 100,
        timeout: 20000,
        verbose: false,
    },
};

// Setup and teardown for each test
beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(async () => {
    await global.testUtils.cleanup();
});

// Extend Jest matchers for microservices testing
expect.extend({
    toBeValidServiceResponse(received) {
        const pass = received &&
            typeof received === 'object' &&
            received.hasOwnProperty('statusCode') &&
            received.hasOwnProperty('body');

        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid service response`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid service response with statusCode and body`,
                pass: false,
            };
        }
    },

    toHaveValidTraceId(received) {
        const pass = received &&
            typeof received === 'object' &&
            received.traceId &&
            typeof received.traceId === 'string' &&
            received.traceId.length > 0;

        if (pass) {
            return {
                message: () => `expected ${received} not to have a valid trace ID`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to have a valid trace ID`,
                pass: false,
            };
        }
    },
});

// Type declarations for global utilities
declare global {
    var testUtils: {
        generateTestId: () => string;
        cleanup: () => Promise<void>;
        propertyTestConfig: {
            numRuns: number;
            timeout: number;
            verbose: boolean;
        };
    };

    namespace jest {
        interface Matchers<R> {
            toBeValidServiceResponse(): R;
            toHaveValidTraceId(): R;
        }
    }
}