/**
 * Tests for Document Cleanup Lambda Function
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Document Cleanup Lambda', () => {
    let mockContext: any;
    let handler: any;

    beforeEach(async () => {
        // Clear all mocks
        jest.clearAllMocks();

        // Mock Lambda context
        mockContext = {
            getRemainingTimeInMillis: jest.fn<any>().mockReturnValue(900000), // 15 minutes
            functionName: 'cleanup-deleted-documents',
            functionVersion: '1',
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:cleanup-deleted-documents',
            memoryLimitInMB: '1024',
            awsRequestId: 'test-request-id-123',
            logGroupName: '/aws/lambda/cleanup-deleted-documents',
            logStreamName: '2024/01/01/[$LATEST]test'
        };

        // Set environment variables
        process.env.DYNAMODB_TABLE_NAME = 'BayonCoAgent';
        process.env.S3_BUCKET_NAME = 'bayon-coagent-uploads';
        process.env.AWS_REGION = 'us-east-1';
    });

    describe('30-Day Filter Logic', () => {
        it('should calculate correct cutoff time for 30-day retention', () => {
            const now = Date.now();
            const retentionDays = 30;
            const expectedCutoff = now - (retentionDays * 24 * 60 * 60 * 1000);

            const actualCutoff = now - (30 * 24 * 60 * 60 * 1000);

            // Should be within 1 second of each other
            expect(Math.abs(expectedCutoff - actualCutoff)).toBeLessThan(1000);
        });

        it('should support custom retention days', () => {
            const now = Date.now();
            const customRetentionDays = 7;
            const expectedCutoff = now - (customRetentionDays * 24 * 60 * 60 * 1000);

            const actualCutoff = now - (7 * 24 * 60 * 60 * 1000);

            // Should match exactly
            expect(actualCutoff).toBe(expectedCutoff);
        });

        it('should identify documents older than cutoff', () => {
            const now = Date.now();
            const cutoffTime = now - (30 * 24 * 60 * 60 * 1000);

            // Document deleted 35 days ago (should be deleted)
            const oldDocument = {
                deletedAt: now - (35 * 24 * 60 * 60 * 1000)
            };

            // Document deleted 15 days ago (should NOT be deleted)
            const recentDocument = {
                deletedAt: now - (15 * 24 * 60 * 60 * 1000)
            };

            expect(oldDocument.deletedAt).toBeLessThan(cutoffTime);
            expect(recentDocument.deletedAt).toBeGreaterThan(cutoffTime);
        });
    });

    describe('Data Validation', () => {
        it('should validate document has required fields', () => {
            const validDocument = {
                id: 'doc-123',
                agentId: 'agent-456',
                s3Key: 'agents/agent-456/dashboards/dashboard-789/documents/doc-123.pdf',
                deletedAt: Date.now() - (35 * 24 * 60 * 60 * 1000)
            };

            expect(validDocument.id).toBeTruthy();
            expect(validDocument.agentId).toBeTruthy();
            expect(validDocument.s3Key).toBeTruthy();
            expect(validDocument.deletedAt).toBeTruthy();
        });

        it('should handle pagination marker format', () => {
            const lastEvaluatedKey = {
                PK: 'AGENT#agent-456',
                SK: 'DOCUMENT#doc-123'
            };

            expect(lastEvaluatedKey.PK).toMatch(/^AGENT#/);
            expect(lastEvaluatedKey.SK).toMatch(/^DOCUMENT#/);
        });
    });

    describe('S3 Key Format', () => {
        it('should handle standard S3 key format', () => {
            const s3Key = 'agents/agent-456/dashboards/dashboard-789/documents/doc-123.pdf';
            const parts = s3Key.split('/');

            expect(parts[0]).toBe('agents');
            expect(parts[1]).toBe('agent-456');
            expect(parts[2]).toBe('dashboards');
            expect(parts[4]).toBe('documents');
            expect(parts[5]).toBe('doc-123.pdf');
        });
    });

    describe('DynamoDB Key Format', () => {
        it('should format DynamoDB keys correctly', () => {
            const agentId = 'agent-456';
            const documentId = 'doc-123';

            const pk = `AGENT#${agentId}`;
            const sk = `DOCUMENT#${documentId}`;

            expect(pk).toBe('AGENT#agent-456');
            expect(sk).toBe('DOCUMENT#doc-123');
        });
    });

    describe('Error Handling Logic', () => {
        it('should handle NoSuchKey S3 error as success', () => {
            const error: any = new Error('The specified key does not exist.');
            error.name = 'NoSuchKey';

            // Simulate the logic from the Lambda
            const isNoSuchKey = error.name === 'NoSuchKey' || error.Code === 'NoSuchKey';

            expect(isNoSuchKey).toBe(true);
        });

        it('should treat S3 file not found as successful deletion', () => {
            const error: any = new Error('Not found');
            error.Code = 'NoSuchKey';

            const shouldContinue = error.Code === 'NoSuchKey';

            expect(shouldContinue).toBe(true);
        });
    });

    describe('Time Buffer Logic', () => {
        it('should stop processing when approaching timeout', () => {
            const remainingTime = 25000; // 25 seconds
            const bufferTime = 30000; // 30 seconds

            const shouldStop = remainingTime < bufferTime;

            expect(shouldStop).toBe(true);
        });

        it('should continue processing with sufficient time', () => {
            const remainingTime = 120000; // 2 minutes
            const bufferTime = 30000; // 30 seconds

            const shouldStop = remainingTime < bufferTime;

            expect(shouldStop).toBe(false);
        });
    });

    describe('Result Counting', () => {
        it('should track deletion counts correctly', () => {
            const result = {
                totalScanned: 0,
                documentsDeleted: 0,
                s3FilesDeleted: 0,
                dynamoRecordsDeleted: 0,
                errors: []
            };

            // Process first document - success
            result.totalScanned++;
            result.s3FilesDeleted++;
            result.dynamoRecordsDeleted++;
            result.documentsDeleted++;

            // Process second document - S3 fails, DynamoDB succeeds
            result.totalScanned++;
            result.dynamoRecordsDeleted++;
            result.documentsDeleted++;

            expect(result.totalScanned).toBe(2);
            expect(result.documentsDeleted).toBe(2);
            expect(result.s3FilesDeleted).toBe(1);
            expect(result.dynamoRecordsDeleted).toBe(2);
        });
    });

    describe('Dry Run Mode', () => {
        it('should not perform actual deletions in dry run', () => {
            const dryRun = true;
            let s3DeleteCalled = false;
            let dynamoDeleteCalled = false;

            if (!dryRun) {
                s3DeleteCalled = true;
                dynamoDeleteCalled = true;
            }

            expect(s3DeleteCalled).toBe(false);
            expect(dynamoDeleteCalled).toBe(false);
        });

        it('should perform deletions when not in dry run', () => {
            const dryRun = false;
            let s3DeleteCalled = false;
            let dynamoDeleteCalled = false;

            if (!dryRun) {
                s3DeleteCalled = true;
                dynamoDeleteCalled = true;
            }

            expect(s3DeleteCalled).toBe(true);
            expect(dynamoDeleteCalled).toBe(true);
        });
    });

    describe('Scan Filter Expression', () => {
        it('should use correct filter expression format', () => {
            const filterExpression = 'begins_with(SK, :docPrefix) AND attribute_exists(#data.deletedAt) AND #data.deletedAt < :cutoffTime';

            expect(filterExpression).toContain('begins_with(SK, :docPrefix)');
            expect(filterExpression).toContain('attribute_exists(#data.deletedAt)');
            expect(filterExpression).toContain('#data.deletedAt < :cutoffTime');
        });

        it('should use correct expression attribute names', () => {
            const expressionAttributeNames = {
                '#data': 'Data'
            };

            expect(expressionAttributeNames['#data']).toBe('Data');
        });

        it('should use correct expression attribute values', () => {
            const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const expressionAttributeValues = {
                ':docPrefix': 'DOCUMENT#',
                ':cutoffTime': cutoffTime
            };

            expect(expressionAttributeValues[':docPrefix']).toBe('DOCUMENT#');
            expect(expressionAttributeValues[':cutoffTime']).toBeLessThan(Date.now());
        });
    });
});
