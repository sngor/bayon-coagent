/**
 * Document Cleanup Lambda Function
 * 
 * Permanently deletes documents that have been soft-deleted for more than 30 days.
 * Removes both the S3 files and DynamoDB records.
 * 
 * Schedule: Daily via EventBridge (cron(0 2 * * ? *) - 2 AM daily)
 * Timeout: 15 minutes
 * Memory: 1024 MB
 * 
 * Requirements: 6.2 - Cleanup job to permanently delete soft-deleted files after 30 days
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
});

// Logger interface for Lambda environment
interface Logger {
    info(message: string, context?: any): void;
    warn(message: string, context?: any): void;
    error(message: string, error?: Error, context?: any): void;
    debug(message: string, context?: any): void;
    child(context: any): Logger;
}

// Simple logger implementation for Lambda
const createSimpleLogger = (defaultContext: any = {}): Logger => ({
    info: (message: string, context?: any) => {
        console.log(JSON.stringify({ level: 'INFO', message, ...defaultContext, ...context, timestamp: new Date().toISOString() }));
    },
    warn: (message: string, context?: any) => {
        console.warn(JSON.stringify({ level: 'WARN', message, ...defaultContext, ...context, timestamp: new Date().toISOString() }));
    },
    error: (message: string, error?: Error, context?: any) => {
        console.error(JSON.stringify({
            level: 'ERROR',
            message,
            error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
            ...defaultContext,
            ...context,
            timestamp: new Date().toISOString()
        }));
    },
    debug: (message: string, context?: any) => {
        console.log(JSON.stringify({ level: 'DEBUG', message, ...defaultContext, ...context, timestamp: new Date().toISOString() }));
    },
    child: (context: any) => createSimpleLogger({ ...defaultContext, ...context })
});

// Initialize logger with Lambda context
const lambdaLogger = createSimpleLogger({
    service: 'cleanup-deleted-documents-lambda',
    environment: process.env.NODE_ENV || 'production',
    version: process.env.LAMBDA_VERSION || '1.0.0',
    region: process.env.AWS_REGION || 'us-east-1'
});

interface LambdaEvent {
    source?: string;
    'detail-type'?: string;
    detail?: {
        dryRun?: boolean;
        retentionDays?: number;
    };
}

interface LambdaContext {
    getRemainingTimeInMillis(): number;
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: string;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
}

interface CleanupResult {
    totalScanned: number;
    documentsDeleted: number;
    s3FilesDeleted: number;
    dynamoRecordsDeleted: number;
    errors: CleanupError[];
    executionTime: number;
}

interface CleanupError {
    documentId: string;
    agentId: string;
    fileName: string;
    error: string;
    step: 's3-delete' | 'dynamodb-delete' | 'scan';
}

interface DashboardDocument {
    id: string;
    agentId: string;
    dashboardId: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    s3Key: string;
    category?: string;
    description?: string;
    uploadedAt: number;
    deletedAt?: number;
}

/**
 * Lambda handler for document cleanup
 */
export const handler = async (event: LambdaEvent, context: LambdaContext): Promise<{
    statusCode: number;
    body: string;
    result: CleanupResult;
}> => {
    const startTime = Date.now();
    const correlationId = context.awsRequestId;

    const operationLogger = lambdaLogger.child({
        correlationId,
        functionName: context.functionName,
        operation: 'cleanup_deleted_documents'
    });

    operationLogger.info('Starting document cleanup Lambda', {
        event,
        remainingTime: context.getRemainingTimeInMillis(),
        memoryLimit: context.memoryLimitInMB
    });

    const result: CleanupResult = {
        totalScanned: 0,
        documentsDeleted: 0,
        s3FilesDeleted: 0,
        dynamoRecordsDeleted: 0,
        errors: [],
        executionTime: 0
    };

    try {
        // Get configuration from event
        const dryRun = event.detail?.dryRun || false;
        const retentionDays = event.detail?.retentionDays || 30;

        operationLogger.info('Cleanup configuration', {
            dryRun,
            retentionDays
        });

        // Calculate cutoff timestamp (30 days ago by default)
        const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

        operationLogger.info('Querying for soft-deleted documents', {
            cutoffTime: new Date(cutoffTime).toISOString(),
            retentionDays
        });

        // Scan DynamoDB for soft-deleted documents
        const documentsToDelete = await getSoftDeletedDocuments(cutoffTime, operationLogger);

        result.totalScanned = documentsToDelete.length;

        if (documentsToDelete.length === 0) {
            operationLogger.info('No documents found for cleanup');
            result.executionTime = Date.now() - startTime;

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No documents found for cleanup',
                    result
                }),
                result
            };
        }

        operationLogger.info(`Found ${documentsToDelete.length} documents to delete`);

        // Process each document
        for (const document of documentsToDelete) {
            // Check remaining execution time (leave 30 seconds buffer)
            const remainingTime = context.getRemainingTimeInMillis();
            if (remainingTime < 30000) {
                operationLogger.warn('Approaching Lambda timeout, stopping processing', {
                    remainingTime,
                    processedSoFar: result.documentsDeleted
                });
                break;
            }

            const docLogger = operationLogger.child({
                documentId: document.id,
                agentId: document.agentId,
                fileName: document.fileName,
                s3Key: document.s3Key
            });

            try {
                if (dryRun) {
                    // Dry run mode - just log what would be deleted
                    docLogger.info('DRY RUN: Would delete document', {
                        fileName: document.fileName,
                        deletedAt: new Date(document.deletedAt!).toISOString(),
                        s3Key: document.s3Key
                    });
                    result.documentsDeleted++;
                    continue;
                }

                // Step 1: Delete S3 file
                docLogger.info('Deleting S3 file', { s3Key: document.s3Key });
                const s3Deleted = await deleteS3File(document.s3Key, docLogger);

                if (s3Deleted) {
                    result.s3FilesDeleted++;
                    docLogger.info('Successfully deleted S3 file');
                } else {
                    docLogger.warn('S3 file deletion failed or file not found');
                }

                // Step 2: Delete DynamoDB record
                docLogger.info('Deleting DynamoDB record');
                const dynamoDeleted = await deleteDynamoRecord(document.agentId, document.id, docLogger);

                if (dynamoDeleted) {
                    result.dynamoRecordsDeleted++;
                    docLogger.info('Successfully deleted DynamoDB record');
                    result.documentsDeleted++;
                } else {
                    docLogger.error('Failed to delete DynamoDB record');
                    result.errors.push({
                        documentId: document.id,
                        agentId: document.agentId,
                        fileName: document.fileName,
                        error: 'Failed to delete DynamoDB record',
                        step: 'dynamodb-delete'
                    });
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                docLogger.error('Error processing document', error as Error);

                result.errors.push({
                    documentId: document.id,
                    agentId: document.agentId,
                    fileName: document.fileName,
                    error: errorMessage,
                    step: 'scan'
                });
            }
        }

        result.executionTime = Date.now() - startTime;

        operationLogger.info('Document cleanup completed', {
            totalScanned: result.totalScanned,
            documentsDeleted: result.documentsDeleted,
            s3FilesDeleted: result.s3FilesDeleted,
            dynamoRecordsDeleted: result.dynamoRecordsDeleted,
            errorCount: result.errors.length,
            executionTime: result.executionTime
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Cleanup completed: ${result.documentsDeleted} documents deleted from ${result.totalScanned} scanned`,
                result
            }),
            result
        };

    } catch (error) {
        result.executionTime = Date.now() - startTime;

        operationLogger.error('Critical failure in document cleanup Lambda', error as Error, {
            executionTime: result.executionTime,
            partialResult: result
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Critical failure in document cleanup',
                error: error instanceof Error ? error.message : 'Unknown error',
                result
            }),
            result
        };
    }
};

/**
 * Scan DynamoDB for soft-deleted documents older than the cutoff time
 */
async function getSoftDeletedDocuments(
    cutoffTime: number,
    logger = lambdaLogger
): Promise<DashboardDocument[]> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        logger.info('Scanning DynamoDB for soft-deleted documents', {
            tableName,
            cutoffTime: new Date(cutoffTime).toISOString()
        });

        const documents: DashboardDocument[] = [];
        let lastEvaluatedKey: Record<string, any> | undefined;

        // Scan the table with pagination
        do {
            const scanCommand = new ScanCommand({
                TableName: tableName,
                FilterExpression: 'begins_with(SK, :docPrefix) AND attribute_exists(#data.deletedAt) AND #data.deletedAt < :cutoffTime',
                ExpressionAttributeNames: {
                    '#data': 'Data'
                },
                ExpressionAttributeValues: {
                    ':docPrefix': 'DOCUMENT#',
                    ':cutoffTime': cutoffTime
                },
                ExclusiveStartKey: lastEvaluatedKey
            });

            const response = await docClient.send(scanCommand);

            if (response.Items) {
                for (const item of response.Items) {
                    if (item.Data) {
                        const doc = item.Data as DashboardDocument;

                        // Validate that this is actually a document and is old enough
                        if (doc.id && doc.agentId && doc.s3Key && doc.deletedAt && doc.deletedAt < cutoffTime) {
                            documents.push(doc);
                        }
                    }
                }
            }

            lastEvaluatedKey = response.LastEvaluatedKey;

        } while (lastEvaluatedKey);

        logger.info(`Scan completed: found ${documents.length} documents to delete`);

        return documents;

    } catch (error) {
        logger.error('Failed to scan for soft-deleted documents', error as Error);
        throw error;
    }
}

/**
 * Delete a file from S3
 * Returns true if successful or file not found, false if error
 */
async function deleteS3File(s3Key: string, logger = lambdaLogger): Promise<boolean> {
    try {
        const bucketName = process.env.S3_BUCKET_NAME || 'bayon-coagent-uploads';

        logger.debug('Deleting S3 object', {
            bucket: bucketName,
            key: s3Key
        });

        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: s3Key
        });

        await s3Client.send(deleteCommand);

        logger.debug('S3 object deleted successfully');
        return true;

    } catch (error: any) {
        // If file doesn't exist (NoSuchKey), treat as success
        if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
            logger.warn('S3 file not found (already deleted)', {
                s3Key,
                error: error.message
            });
            return true;
        }

        logger.error('Failed to delete S3 file', error as Error, {
            s3Key
        });
        return false;
    }
}

/**
 * Delete a document record from DynamoDB
 * Returns true if successful, false if error
 */
async function deleteDynamoRecord(agentId: string, documentId: string, logger = lambdaLogger): Promise<boolean> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        logger.debug('Deleting DynamoDB record', {
            tableName,
            agentId,
            documentId
        });

        const deleteCommand = new DeleteCommand({
            TableName: tableName,
            Key: {
                PK: `AGENT#${agentId}`,
                SK: `DOCUMENT#${documentId}`
            }
        });

        await docClient.send(deleteCommand);

        logger.debug('DynamoDB record deleted successfully');
        return true;

    } catch (error) {
        logger.error('Failed to delete DynamoDB record', error as Error, {
            agentId,
            documentId
        });
        return false;
    }
}
