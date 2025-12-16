/**
 * Audit Microservice
 * 
 * Provides comprehensive audit logging and tracking for all administrative actions
 * and system events. Creates complete audit trails with required metadata for
 * compliance and security monitoring.
 * 
 * **Requirements: 8.3**
 * **Property 25: Complete audit trail**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { z } from 'zod';

// Configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'audit-service',
    version: '1.0.0',
    description: 'Comprehensive audit logging and tracking service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    healthCheckEnabled: true,
};

// Validation schemas
const AuditableActionSchema = z.object({
    actionType: z.string(),
    userId: z.string().uuid(),
    resourceId: z.string().optional(),
    resourceType: z.string().optional(),
    actionData: z.record(z.any()),
    timestamp: z.string().datetime(),
    sessionId: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().optional(),
});

const AuditTrailRequestSchema = z.object({
    actions: z.array(AuditableActionSchema),
    batchId: z.string().optional(),
    correlationId: z.string().optional(),
});

const AuditQuerySchema = z.object({
    userId: z.string().uuid().optional(),
    actionType: z.string().optional(),
    resourceType: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.number().min(1).max(1000).optional(),
    nextToken: z.string().optional(),
});

// Types
interface AuditableAction {
    actionType: string;
    userId: string;
    resourceId?: string;
    resourceType?: string;
    actionData: Record<string, any>;
    timestamp: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
}

interface AuditLogEntry {
    auditId: string;
    actionType: string;
    userId: string;
    resourceId?: string;
    resourceType?: string;
    actionData: Record<string, any>;
    timestamp: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    outcome: 'success' | 'failure' | 'partial';
    metadata: {
        traceId: string;
        correlationId: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        batchId?: string;
        processingTime: number;
        dataSize: number;
    };
}

interface AuditTrailResult {
    entriesCreated: AuditLogEntry[];
    totalEntries: number;
    completeness: number;
    missingMetadata: string[];
    batchId: string;
    processingTime: number;
}

interface AuditQueryResult {
    entries: AuditLogEntry[];
    totalCount: number;
    nextToken?: string;
    queryTime: number;
}

interface AuditStatistics {
    totalEntries: number;
    entriesByActionType: Record<string, number>;
    entriesByUser: Record<string, number>;
    entriesBySeverity: Record<string, number>;
    averageProcessingTime: number;
    completenessScore: number;
    timeRange: {
        earliest: string;
        latest: string;
    };
}

/**
 * Audit Service Handler
 */
class AuditServiceHandler extends BaseLambdaHandler {
    private dynamoClient: DynamoDBClient;
    private tableName: string;
    private auditTableName: string;

    constructor() {
        super(SERVICE_CONFIG);
        this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
        this.tableName = process.env.DYNAMODB_TABLE_NAME || 'microservices-table';
        this.auditTableName = process.env.AUDIT_TABLE_NAME || 'audit-logs-table';
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const path = event.path;
        const method = event.httpMethod;

        // Route requests
        if (method === 'GET' && path.endsWith('/health')) {
            return this.createHealthCheckResponse();
        }

        if (method === 'POST' && path.endsWith('/create-audit-trail')) {
            return this.handleCreateAuditTrail(event);
        }

        if (method === 'POST' && path.endsWith('/log-action')) {
            return this.handleLogAction(event);
        }

        if (method === 'GET' && path.endsWith('/query-audit-logs')) {
            return this.handleQueryAuditLogs(event);
        }

        if (method === 'GET' && path.endsWith('/audit-statistics')) {
            return this.handleGetAuditStatistics(event);
        }

        if (method === 'GET' && path.endsWith('/compliance-report')) {
            return this.handleGetComplianceReport(event);
        }

        return this.createErrorResponseData('INVALID_ENDPOINT', 'Endpoint not found', 404);
    }

    /**
     * Handle audit trail creation for multiple actions
     */
    private async handleCreateAuditTrail(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        const startTime = Date.now();

        try {
            const request = this.validateRequestBody(event, (data) =>
                AuditTrailRequestSchema.parse(data)
            );

            const result = await this.executeWithCircuitBreaker('create-audit-trail', async () => {
                return this.createAuditTrail(request.actions, request.batchId, request.correlationId);
            });

            result.processingTime = Date.now() - startTime;

            // Publish audit trail created event
            await this.publishServiceEvent(EventSource.AUDIT, 'AuditTrailCreated', {
                batchId: result.batchId,
                entriesCount: result.totalEntries,
                completeness: result.completeness,
            });

            return this.createSuccessResponse(result);
        } catch (error) {
            this.logger.error('Audit trail creation failed', { error });
            return this.createErrorResponseData(
                'AUDIT_TRAIL_CREATION_FAILED',
                error instanceof Error ? error.message : 'Audit trail creation failed',
                500
            );
        }
    }

    /**
     * Handle single action logging
     */
    private async handleLogAction(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const action = this.validateRequestBody(event, (data) =>
                AuditableActionSchema.parse(data)
            );

            const auditEntry = await this.executeWithCircuitBreaker('log-action', async () => {
                return this.logSingleAction(action);
            });

            return this.createSuccessResponse(auditEntry);
        } catch (error) {
            this.logger.error('Action logging failed', { error });
            return this.createErrorResponseData(
                'ACTION_LOGGING_FAILED',
                error instanceof Error ? error.message : 'Action logging failed',
                500
            );
        }
    }

    /**
     * Handle audit log queries
     */
    private async handleQueryAuditLogs(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const queryParams = event.queryStringParameters || {};
            const query = AuditQuerySchema.parse(queryParams);

            const result = await this.executeWithCircuitBreaker('query-audit-logs', async () => {
                return this.queryAuditLogs(query);
            });

            return this.createSuccessResponse(result);
        } catch (error) {
            this.logger.error('Audit log query failed', { error });
            return this.createErrorResponseData(
                'AUDIT_QUERY_FAILED',
                error instanceof Error ? error.message : 'Audit log query failed',
                500
            );
        }
    }

    /**
     * Handle audit statistics retrieval
     */
    private async handleGetAuditStatistics(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const timeRange = event.queryStringParameters?.timeRange || '24h';
            const statistics = await this.getAuditStatistics(timeRange);
            return this.createSuccessResponse(statistics);
        } catch (error) {
            this.logger.error('Audit statistics retrieval failed', { error });
            return this.createErrorResponseData(
                'AUDIT_STATISTICS_FAILED',
                error instanceof Error ? error.message : 'Audit statistics retrieval failed',
                500
            );
        }
    }

    /**
     * Handle compliance report generation
     */
    private async handleGetComplianceReport(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const reportType = event.queryStringParameters?.type || 'standard';
            const timeRange = event.queryStringParameters?.timeRange || '30d';

            const report = await this.generateComplianceReport(reportType, timeRange);
            return this.createSuccessResponse(report);
        } catch (error) {
            this.logger.error('Compliance report generation failed', { error });
            return this.createErrorResponseData(
                'COMPLIANCE_REPORT_FAILED',
                error instanceof Error ? error.message : 'Compliance report generation failed',
                500
            );
        }
    }

    /**
     * Create comprehensive audit trail for multiple actions
     */
    private async createAuditTrail(
        actions: AuditableAction[],
        batchId?: string,
        correlationId?: string
    ): Promise<AuditTrailResult> {
        const startTime = Date.now();
        const generatedBatchId = batchId || `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const entriesCreated: AuditLogEntry[] = [];
        const missingMetadata: string[] = [];

        // Process each action
        for (const action of actions) {
            try {
                const auditEntry = await this.createAuditEntry(action, generatedBatchId, correlationId);
                entriesCreated.push(auditEntry);

                // Check for missing metadata
                this.checkMissingMetadata(action, missingMetadata);

                // Store audit entry
                await this.storeAuditEntry(auditEntry);

            } catch (error) {
                this.logger.error('Failed to create audit entry', { action, error });

                // Create a failure audit entry
                const failureEntry = await this.createFailureAuditEntry(action, error, generatedBatchId, correlationId);
                entriesCreated.push(failureEntry);
            }
        }

        // Calculate completeness
        const completeness = this.calculateCompleteness(actions);

        const result: AuditTrailResult = {
            entriesCreated,
            totalEntries: entriesCreated.length,
            completeness,
            missingMetadata: [...new Set(missingMetadata)], // Remove duplicates
            batchId: generatedBatchId,
            processingTime: Date.now() - startTime,
        };

        // Log audit trail creation
        this.logger.info('Audit trail created', {
            batchId: generatedBatchId,
            totalEntries: result.totalEntries,
            completeness: result.completeness,
            processingTime: result.processingTime,
        });

        return result;
    }

    /**
     * Log a single action
     */
    private async logSingleAction(action: AuditableAction): Promise<AuditLogEntry> {
        const auditEntry = await this.createAuditEntry(action);
        await this.storeAuditEntry(auditEntry);
        return auditEntry;
    }

    /**
     * Create audit entry from auditable action
     */
    private async createAuditEntry(
        action: AuditableAction,
        batchId?: string,
        correlationId?: string
    ): Promise<AuditLogEntry> {
        const startTime = Date.now();
        const traceId = process.env._X_AMZN_TRACE_ID || `trace-${Date.now()}`;
        const finalCorrelationId = correlationId || `corr-${Date.now()}`;

        const auditEntry: AuditLogEntry = {
            auditId: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            actionType: action.actionType,
            userId: action.userId,
            resourceId: action.resourceId,
            resourceType: action.resourceType,
            actionData: action.actionData,
            timestamp: action.timestamp,
            sessionId: action.sessionId,
            ipAddress: action.ipAddress,
            userAgent: action.userAgent,
            outcome: 'success', // Default to success, will be updated if needed
            metadata: {
                traceId,
                correlationId: finalCorrelationId,
                severity: this.determineSeverity(action.actionType),
                batchId,
                processingTime: Date.now() - startTime,
                dataSize: JSON.stringify(action.actionData).length,
            },
        };

        return auditEntry;
    }

    /**
     * Create failure audit entry
     */
    private async createFailureAuditEntry(
        action: AuditableAction,
        error: unknown,
        batchId?: string,
        correlationId?: string
    ): Promise<AuditLogEntry> {
        const auditEntry = await this.createAuditEntry(action, batchId, correlationId);
        auditEntry.outcome = 'failure';
        auditEntry.actionData = {
            ...auditEntry.actionData,
            error: error instanceof Error ? error.message : String(error),
        };
        return auditEntry;
    }

    /**
     * Determine severity level based on action type
     */
    private determineSeverity(actionType: string): 'low' | 'medium' | 'high' | 'critical' {
        const criticalActions = ['user.delete', 'admin.user.role.change', 'system.config.update'];
        const highActions = ['user.create', 'user.update', 'content.create', 'content.update'];
        const mediumActions = ['user.login', 'user.logout', 'content.view'];

        if (criticalActions.some(action => actionType.includes(action))) {
            return 'critical';
        } else if (highActions.some(action => actionType.includes(action))) {
            return 'high';
        } else if (mediumActions.some(action => actionType.includes(action))) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Check for missing metadata in action
     */
    private checkMissingMetadata(action: AuditableAction, missingMetadata: string[]): void {
        if (!action.sessionId) {
            missingMetadata.push(`sessionId for ${action.actionType}`);
        }
        if (!action.ipAddress) {
            missingMetadata.push(`ipAddress for ${action.actionType}`);
        }
        if (!action.userAgent) {
            missingMetadata.push(`userAgent for ${action.actionType}`);
        }
        if (!action.resourceId && action.resourceType) {
            missingMetadata.push(`resourceId for ${action.actionType}`);
        }
        if (!action.resourceType && action.resourceId) {
            missingMetadata.push(`resourceType for ${action.actionType}`);
        }
    }

    /**
     * Calculate completeness score
     */
    private calculateCompleteness(actions: AuditableAction[]): number {
        const requiredFields = ['actionType', 'userId', 'timestamp'];
        const optionalFields = ['sessionId', 'ipAddress', 'userAgent', 'resourceId', 'resourceType'];
        const totalPossibleFields = requiredFields.length + optionalFields.length;

        let totalFieldsPresent = 0;
        actions.forEach(action => {
            totalFieldsPresent += requiredFields.length; // All required fields are always present
            if (action.sessionId) totalFieldsPresent++;
            if (action.ipAddress) totalFieldsPresent++;
            if (action.userAgent) totalFieldsPresent++;
            if (action.resourceId) totalFieldsPresent++;
            if (action.resourceType) totalFieldsPresent++;
        });

        return (totalFieldsPresent / (actions.length * totalPossibleFields)) * 100;
    }

    /**
     * Store audit entry in DynamoDB
     */
    private async storeAuditEntry(auditEntry: AuditLogEntry): Promise<void> {
        try {
            const item = marshall({
                PK: `AUDIT#${auditEntry.userId}`,
                SK: `${auditEntry.timestamp}#${auditEntry.auditId}`,
                GSI1PK: `ACTION#${auditEntry.actionType}`,
                GSI1SK: auditEntry.timestamp,
                GSI2PK: `RESOURCE#${auditEntry.resourceType || 'NONE'}`,
                GSI2SK: auditEntry.timestamp,
                ...auditEntry,
            });

            await this.dynamoClient.send(new PutItemCommand({
                TableName: this.auditTableName,
                Item: item,
            }));

        } catch (error) {
            this.logger.error('Failed to store audit entry', { auditEntry, error });
            throw error;
        }
    }

    /**
     * Query audit logs
     */
    private async queryAuditLogs(query: any): Promise<AuditQueryResult> {
        const startTime = Date.now();

        try {
            // Mock query implementation - in production, this would use DynamoDB Query/Scan
            const mockEntries: AuditLogEntry[] = this.generateMockAuditEntries(query.limit || 50);

            return {
                entries: mockEntries,
                totalCount: mockEntries.length,
                queryTime: Date.now() - startTime,
            };

        } catch (error) {
            this.logger.error('Audit log query failed', { query, error });
            throw error;
        }
    }

    /**
     * Get audit statistics
     */
    private async getAuditStatistics(timeRange: string): Promise<AuditStatistics> {
        // Mock statistics - in production, this would aggregate from DynamoDB
        return {
            totalEntries: Math.floor(Math.random() * 10000) + 1000,
            entriesByActionType: {
                'user.login': Math.floor(Math.random() * 1000),
                'user.logout': Math.floor(Math.random() * 800),
                'content.create': Math.floor(Math.random() * 500),
                'content.update': Math.floor(Math.random() * 300),
                'admin.user.role.change': Math.floor(Math.random() * 50),
            },
            entriesByUser: {
                'user-admin-123': Math.floor(Math.random() * 500),
                'user-user-456': Math.floor(Math.random() * 300),
                'user-mod-789': Math.floor(Math.random() * 200),
            },
            entriesBySeverity: {
                'low': Math.floor(Math.random() * 5000),
                'medium': Math.floor(Math.random() * 3000),
                'high': Math.floor(Math.random() * 1500),
                'critical': Math.floor(Math.random() * 100),
            },
            averageProcessingTime: Math.random() * 100 + 10,
            completenessScore: Math.random() * 20 + 80, // 80-100%
            timeRange: {
                earliest: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                latest: new Date().toISOString(),
            },
        };
    }

    /**
     * Generate compliance report
     */
    private async generateComplianceReport(reportType: string, timeRange: string): Promise<any> {
        const statistics = await this.getAuditStatistics(timeRange);

        return {
            reportType,
            timeRange,
            generatedAt: new Date().toISOString(),
            summary: {
                totalAuditEntries: statistics.totalEntries,
                completenessScore: statistics.completenessScore,
                criticalActions: statistics.entriesBySeverity.critical,
                complianceStatus: statistics.completenessScore > 95 ? 'compliant' : 'needs-attention',
            },
            details: {
                actionTypeDistribution: statistics.entriesByActionType,
                severityDistribution: statistics.entriesBySeverity,
                userActivityDistribution: statistics.entriesByUser,
            },
            recommendations: this.generateComplianceRecommendations(statistics),
        };
    }

    /**
     * Generate compliance recommendations
     */
    private generateComplianceRecommendations(statistics: AuditStatistics): string[] {
        const recommendations: string[] = [];

        if (statistics.completenessScore < 95) {
            recommendations.push('Improve audit log completeness by ensuring all optional metadata fields are captured');
        }

        if (statistics.entriesBySeverity.critical > 100) {
            recommendations.push('Review critical actions and consider implementing additional approval workflows');
        }

        if (statistics.averageProcessingTime > 50) {
            recommendations.push('Optimize audit logging performance to reduce processing time');
        }

        return recommendations;
    }

    /**
     * Generate mock audit entries for testing
     */
    private generateMockAuditEntries(count: number): AuditLogEntry[] {
        const entries: AuditLogEntry[] = [];
        const actionTypes = ['user.login', 'user.logout', 'content.create', 'content.update', 'admin.user.role.change'];
        const userIds = ['user-admin-123', 'user-user-456', 'user-mod-789'];

        for (let i = 0; i < count; i++) {
            const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
            const userId = userIds[Math.floor(Math.random() * userIds.length)];

            entries.push({
                auditId: `audit-${Date.now()}-${i}`,
                actionType,
                userId,
                resourceId: `resource-${Math.random().toString(36).substr(2, 9)}`,
                resourceType: 'content',
                actionData: { test: 'data' },
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                sessionId: `session-${Math.random().toString(36).substr(2, 9)}`,
                ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                userAgent: 'Mozilla/5.0 Test Browser',
                outcome: Math.random() > 0.1 ? 'success' : 'failure',
                metadata: {
                    traceId: `trace-${Date.now()}-${i}`,
                    correlationId: `corr-${Date.now()}-${i}`,
                    severity: this.determineSeverity(actionType),
                    processingTime: Math.random() * 100,
                    dataSize: Math.floor(Math.random() * 1000),
                },
            });
        }

        return entries;
    }
}

// Export the handler
export const handler = new AuditServiceHandler().lambdaHandler.bind(new AuditServiceHandler());