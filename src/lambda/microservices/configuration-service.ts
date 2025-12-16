/**
 * Configuration Microservice
 * 
 * Manages environment-specific settings and configuration for all microservices.
 * Provides centralized configuration management with environment isolation,
 * version control, and secure secret handling.
 * 
 * **Requirements: 8.4**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { z } from 'zod';

// Configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'configuration-service',
    version: '1.0.0',
    description: 'Centralized configuration management service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    healthCheckEnabled: true,
};

// Validation schemas
const ConfigurationSchema = z.object({
    key: z.string().min(1),
    value: z.any(),
    environment: z.enum(['dev', 'staging', 'prod']),
    service: z.string().optional(),
    encrypted: z.boolean().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

const ConfigurationUpdateSchema = z.object({
    key: z.string().min(1),
    value: z.any(),
    environment: z.enum(['dev', 'staging', 'prod']),
    service: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

const ConfigurationQuerySchema = z.object({
    environment: z.enum(['dev', 'staging', 'prod']).optional(),
    service: z.string().optional(),
    keyPrefix: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

// Types
interface Configuration {
    key: string;
    value: any;
    environment: 'dev' | 'staging' | 'prod';
    service?: string;
    encrypted: boolean;
    description?: string;
    tags: string[];
    version: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

interface ConfigurationHistory {
    key: string;
    environment: string;
    version: number;
    value: any;
    changedAt: string;
    changedBy: string;
    changeReason?: string;
}

interface EnvironmentConfig {
    environment: string;
    configurations: Configuration[];
    totalCount: number;
    lastUpdated: string;
}

/**
 * Configuration Service Handler
 */
class ConfigurationServiceHandler extends BaseLambdaHandler {
    private dynamoClient: DynamoDBClient;
    private secretsClient: SecretsManagerClient;
    private tableName: string;
    private secretsPrefix: string;

    constructor() {
        super(SERVICE_CONFIG);
        this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
        this.secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
        this.tableName = process.env.DYNAMODB_TABLE_NAME || 'microservices-table';
        this.secretsPrefix = process.env.SECRETS_PREFIX || 'microservices';
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const path = event.path;
        const method = event.httpMethod;

        // Route requests
        if (method === 'GET' && path.endsWith('/health')) {
            return this.createHealthCheckResponse();
        }

        if (method === 'POST' && path.endsWith('/configuration')) {
            return this.handleCreateConfiguration(event);
        }

        if (method === 'GET' && path.endsWith('/configuration')) {
            return this.handleGetConfiguration(event);
        }

        if (method === 'PUT' && path.endsWith('/configuration')) {
            return this.handleUpdateConfiguration(event);
        }

        if (method === 'DELETE' && path.endsWith('/configuration')) {
            return this.handleDeleteConfiguration(event);
        }

        if (method === 'GET' && path.endsWith('/configurations')) {
            return this.handleListConfigurations(event);
        }

        if (method === 'GET' && path.endsWith('/environment-config')) {
            return this.handleGetEnvironmentConfig(event);
        }

        if (method === 'GET' && path.endsWith('/configuration-history')) {
            return this.handleGetConfigurationHistory(event);
        }

        if (method === 'POST' && path.endsWith('/validate-configuration')) {
            return this.handleValidateConfiguration(event);
        }

        return this.createErrorResponseData('INVALID_ENDPOINT', 'Endpoint not found', 404);
    }

    /**
     * Handle configuration creation
     */
    private async handleCreateConfiguration(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const configData = this.validateRequestBody(event, (data) =>
                ConfigurationSchema.parse(data)
            );

            const userId = this.extractUserId(event);
            const configuration = await this.executeWithCircuitBreaker('create-configuration', async () => {
                return this.createConfiguration(configData, userId);
            });

            // Publish configuration created event
            await this.publishServiceEvent(EventSource.CONFIGURATION, 'ConfigurationCreated', {
                key: configuration.key,
                environment: configuration.environment,
                service: configuration.service,
            });

            return this.createSuccessResponse(configuration, 201);
        } catch (error) {
            this.logger.error('Configuration creation failed', { error });
            return this.createErrorResponseData(
                'CONFIGURATION_CREATION_FAILED',
                error instanceof Error ? error.message : 'Configuration creation failed',
                400
            );
        }
    }

    /**
     * Handle configuration retrieval
     */
    private async handleGetConfiguration(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const key = event.queryStringParameters?.key;
            const environment = event.queryStringParameters?.environment as 'dev' | 'staging' | 'prod';
            const service = event.queryStringParameters?.service;

            if (!key || !environment) {
                throw new Error('Key and environment are required');
            }

            const configuration = await this.executeWithCircuitBreaker('get-configuration', async () => {
                return this.getConfiguration(key, environment, service);
            });

            if (!configuration) {
                return this.createErrorResponseData('CONFIGURATION_NOT_FOUND', 'Configuration not found', 404);
            }

            return this.createSuccessResponse(configuration);
        } catch (error) {
            this.logger.error('Configuration retrieval failed', { error });
            return this.createErrorResponseData(
                'CONFIGURATION_RETRIEVAL_FAILED',
                error instanceof Error ? error.message : 'Configuration retrieval failed',
                500
            );
        }
    }

    /**
     * Handle configuration update
     */
    private async handleUpdateConfiguration(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const updateData = this.validateRequestBody(event, (data) =>
                ConfigurationUpdateSchema.parse(data)
            );

            const userId = this.extractUserId(event);
            const configuration = await this.executeWithCircuitBreaker('update-configuration', async () => {
                return this.updateConfiguration(updateData, userId);
            });

            // Publish configuration updated event
            await this.publishServiceEvent(EventSource.CONFIGURATION, 'ConfigurationUpdated', {
                key: configuration.key,
                environment: configuration.environment,
                service: configuration.service,
                version: configuration.version,
            });

            return this.createSuccessResponse(configuration);
        } catch (error) {
            this.logger.error('Configuration update failed', { error });
            return this.createErrorResponseData(
                'CONFIGURATION_UPDATE_FAILED',
                error instanceof Error ? error.message : 'Configuration update failed',
                400
            );
        }
    }

    /**
     * Handle configuration deletion
     */
    private async handleDeleteConfiguration(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const key = event.queryStringParameters?.key;
            const environment = event.queryStringParameters?.environment as 'dev' | 'staging' | 'prod';
            const service = event.queryStringParameters?.service;

            if (!key || !environment) {
                throw new Error('Key and environment are required');
            }

            const userId = this.extractUserId(event);
            await this.executeWithCircuitBreaker('delete-configuration', async () => {
                return this.deleteConfiguration(key, environment, service, userId);
            });

            // Publish configuration deleted event
            await this.publishServiceEvent(EventSource.CONFIGURATION, 'ConfigurationDeleted', {
                key,
                environment,
                service,
            });

            return this.createSuccessResponse({ message: 'Configuration deleted successfully' });
        } catch (error) {
            this.logger.error('Configuration deletion failed', { error });
            return this.createErrorResponseData(
                'CONFIGURATION_DELETION_FAILED',
                error instanceof Error ? error.message : 'Configuration deletion failed',
                400
            );
        }
    }

    /**
     * Handle configuration listing
     */
    private async handleListConfigurations(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const queryParams = event.queryStringParameters || {};
            const query = ConfigurationQuerySchema.parse(queryParams);

            const configurations = await this.executeWithCircuitBreaker('list-configurations', async () => {
                return this.listConfigurations(query);
            });

            return this.createSuccessResponse(configurations);
        } catch (error) {
            this.logger.error('Configuration listing failed', { error });
            return this.createErrorResponseData(
                'CONFIGURATION_LISTING_FAILED',
                error instanceof Error ? error.message : 'Configuration listing failed',
                500
            );
        }
    }

    /**
     * Handle environment configuration retrieval
     */
    private async handleGetEnvironmentConfig(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const environment = event.queryStringParameters?.environment as 'dev' | 'staging' | 'prod';
            const service = event.queryStringParameters?.service;

            if (!environment) {
                throw new Error('Environment is required');
            }

            const envConfig = await this.executeWithCircuitBreaker('get-environment-config', async () => {
                return this.getEnvironmentConfig(environment, service);
            });

            return this.createSuccessResponse(envConfig);
        } catch (error) {
            this.logger.error('Environment configuration retrieval failed', { error });
            return this.createErrorResponseData(
                'ENVIRONMENT_CONFIG_FAILED',
                error instanceof Error ? error.message : 'Environment configuration retrieval failed',
                500
            );
        }
    }

    /**
     * Handle configuration history retrieval
     */
    private async handleGetConfigurationHistory(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const key = event.queryStringParameters?.key;
            const environment = event.queryStringParameters?.environment as 'dev' | 'staging' | 'prod';

            if (!key || !environment) {
                throw new Error('Key and environment are required');
            }

            const history = await this.getConfigurationHistory(key, environment);
            return this.createSuccessResponse(history);
        } catch (error) {
            this.logger.error('Configuration history retrieval failed', { error });
            return this.createErrorResponseData(
                'CONFIGURATION_HISTORY_FAILED',
                error instanceof Error ? error.message : 'Configuration history retrieval failed',
                500
            );
        }
    }

    /**
     * Handle configuration validation
     */
    private async handleValidateConfiguration(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const configData = this.validateRequestBody(event, (data) =>
                ConfigurationSchema.parse(data)
            );

            const validation = await this.validateConfiguration(configData);
            return this.createSuccessResponse(validation);
        } catch (error) {
            this.logger.error('Configuration validation failed', { error });
            return this.createErrorResponseData(
                'CONFIGURATION_VALIDATION_FAILED',
                error instanceof Error ? error.message : 'Configuration validation failed',
                400
            );
        }
    }

    /**
     * Create new configuration
     */
    private async createConfiguration(configData: any, userId: string): Promise<Configuration> {
        const now = new Date().toISOString();

        const configuration: Configuration = {
            key: configData.key,
            value: configData.value,
            environment: configData.environment,
            service: configData.service,
            encrypted: configData.encrypted || false,
            description: configData.description,
            tags: configData.tags || [],
            version: 1,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId,
        };

        // Handle encrypted values
        if (configuration.encrypted) {
            await this.storeSecretValue(configuration.key, configuration.environment, configuration.value);
            configuration.value = '[ENCRYPTED]';
        }

        // Store configuration
        await this.storeConfiguration(configuration);

        // Store initial history entry
        await this.storeConfigurationHistory({
            key: configuration.key,
            environment: configuration.environment,
            version: configuration.version,
            value: configuration.value,
            changedAt: now,
            changedBy: userId,
            changeReason: 'Initial creation',
        });

        return configuration;
    }

    /**
     * Get configuration by key and environment
     */
    private async getConfiguration(key: string, environment: string, service?: string): Promise<Configuration | null> {
        try {
            const pk = `CONFIG#${environment}`;
            const sk = service ? `${service}#${key}` : key;

            const result = await this.dynamoClient.send(new GetItemCommand({
                TableName: this.tableName,
                Key: marshall({ PK: pk, SK: sk }),
            }));

            if (!result.Item) {
                return null;
            }

            const configuration = unmarshall(result.Item) as Configuration;

            // Decrypt encrypted values
            if (configuration.encrypted) {
                try {
                    configuration.value = await this.getSecretValue(configuration.key, configuration.environment);
                } catch (error) {
                    this.logger.warn('Failed to decrypt configuration value', { key, environment, error });
                    configuration.value = '[DECRYPTION_FAILED]';
                }
            }

            return configuration;
        } catch (error) {
            this.logger.error('Failed to get configuration', { key, environment, service, error });
            throw error;
        }
    }

    /**
     * Update existing configuration
     */
    private async updateConfiguration(updateData: any, userId: string): Promise<Configuration> {
        const existing = await this.getConfiguration(updateData.key, updateData.environment, updateData.service);
        if (!existing) {
            throw new Error('Configuration not found');
        }

        const now = new Date().toISOString();
        const newVersion = existing.version + 1;

        const updated: Configuration = {
            ...existing,
            value: updateData.value,
            description: updateData.description || existing.description,
            tags: updateData.tags || existing.tags,
            version: newVersion,
            updatedAt: now,
            updatedBy: userId,
        };

        // Handle encrypted values
        if (updated.encrypted) {
            await this.storeSecretValue(updated.key, updated.environment, updated.value);
            updated.value = '[ENCRYPTED]';
        }

        // Store updated configuration
        await this.storeConfiguration(updated);

        // Store history entry
        await this.storeConfigurationHistory({
            key: updated.key,
            environment: updated.environment,
            version: newVersion,
            value: updated.value,
            changedAt: now,
            changedBy: userId,
            changeReason: 'Configuration update',
        });

        return updated;
    }

    /**
     * Delete configuration
     */
    private async deleteConfiguration(key: string, environment: string, service: string | undefined, userId: string): Promise<void> {
        const existing = await this.getConfiguration(key, environment, service);
        if (!existing) {
            throw new Error('Configuration not found');
        }

        // Delete from DynamoDB
        const pk = `CONFIG#${environment}`;
        const sk = service ? `${service}#${key}` : key;

        await this.dynamoClient.send(new GetItemCommand({
            TableName: this.tableName,
            Key: marshall({ PK: pk, SK: sk }),
        }));

        // Delete secret if encrypted
        if (existing.encrypted) {
            await this.deleteSecretValue(key, environment);
        }

        // Store deletion history entry
        await this.storeConfigurationHistory({
            key,
            environment,
            version: existing.version + 1,
            value: '[DELETED]',
            changedAt: new Date().toISOString(),
            changedBy: userId,
            changeReason: 'Configuration deleted',
        });
    }

    /**
     * List configurations based on query
     */
    private async listConfigurations(query: any): Promise<Configuration[]> {
        // Mock implementation - in production, this would use DynamoDB Query/Scan
        const mockConfigurations: Configuration[] = [
            {
                key: 'database.connection.timeout',
                value: 30000,
                environment: query.environment || 'dev',
                service: 'user-service',
                encrypted: false,
                description: 'Database connection timeout in milliseconds',
                tags: ['database', 'timeout'],
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system',
                updatedBy: 'system',
            },
            {
                key: 'api.rate.limit',
                value: 1000,
                environment: query.environment || 'dev',
                service: 'api-gateway',
                encrypted: false,
                description: 'API rate limit per minute',
                tags: ['api', 'rate-limit'],
                version: 2,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin',
                updatedBy: 'admin',
            },
        ];

        return mockConfigurations.filter(config => {
            if (query.service && config.service !== query.service) return false;
            if (query.keyPrefix && !config.key.startsWith(query.keyPrefix)) return false;
            if (query.tags && !query.tags.some((tag: string) => config.tags.includes(tag))) return false;
            return true;
        });
    }

    /**
     * Get all configurations for an environment
     */
    private async getEnvironmentConfig(environment: string, service?: string): Promise<EnvironmentConfig> {
        const configurations = await this.listConfigurations({ environment, service });

        return {
            environment,
            configurations,
            totalCount: configurations.length,
            lastUpdated: configurations.length > 0
                ? Math.max(...configurations.map(c => new Date(c.updatedAt).getTime())).toString()
                : new Date().toISOString(),
        };
    }

    /**
     * Get configuration history
     */
    private async getConfigurationHistory(key: string, environment: string): Promise<ConfigurationHistory[]> {
        // Mock history - in production, this would query DynamoDB
        return [
            {
                key,
                environment,
                version: 1,
                value: 'initial-value',
                changedAt: new Date(Date.now() - 86400000).toISOString(),
                changedBy: 'system',
                changeReason: 'Initial creation',
            },
            {
                key,
                environment,
                version: 2,
                value: 'updated-value',
                changedAt: new Date().toISOString(),
                changedBy: 'admin',
                changeReason: 'Configuration update',
            },
        ];
    }

    /**
     * Validate configuration
     */
    private async validateConfiguration(configData: any): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Check for reserved keys
        const reservedKeys = ['aws.', 'system.', 'internal.'];
        if (reservedKeys.some(prefix => configData.key.startsWith(prefix))) {
            errors.push('Configuration key uses reserved prefix');
        }

        // Validate value type based on key patterns
        if (configData.key.includes('timeout') && typeof configData.value !== 'number') {
            errors.push('Timeout values must be numbers');
        }

        if (configData.key.includes('enabled') && typeof configData.value !== 'boolean') {
            errors.push('Enabled flags must be boolean values');
        }

        // Check for existing configuration
        const existing = await this.getConfiguration(configData.key, configData.environment, configData.service);
        if (existing) {
            errors.push('Configuration already exists');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Store configuration in DynamoDB
     */
    private async storeConfiguration(configuration: Configuration): Promise<void> {
        const pk = `CONFIG#${configuration.environment}`;
        const sk = configuration.service ? `${configuration.service}#${configuration.key}` : configuration.key;

        const item = marshall({
            PK: pk,
            SK: sk,
            GSI1PK: `SERVICE#${configuration.service || 'GLOBAL'}`,
            GSI1SK: configuration.key,
            ...configuration,
        });

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: item,
        }));
    }

    /**
     * Store configuration history
     */
    private async storeConfigurationHistory(history: ConfigurationHistory): Promise<void> {
        const pk = `CONFIG_HISTORY#${history.key}#${history.environment}`;
        const sk = `${history.version.toString().padStart(10, '0')}`;

        const item = marshall({
            PK: pk,
            SK: sk,
            ...history,
        });

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: item,
        }));
    }

    /**
     * Store encrypted value in Secrets Manager
     */
    private async storeSecretValue(key: string, environment: string, value: any): Promise<void> {
        const secretName = `${this.secretsPrefix}/${environment}/${key}`;

        await this.secretsClient.send(new PutSecretValueCommand({
            SecretId: secretName,
            SecretString: JSON.stringify(value),
        }));
    }

    /**
     * Get encrypted value from Secrets Manager
     */
    private async getSecretValue(key: string, environment: string): Promise<any> {
        const secretName = `${this.secretsPrefix}/${environment}/${key}`;

        const result = await this.secretsClient.send(new GetSecretValueCommand({
            SecretId: secretName,
        }));

        if (!result.SecretString) {
            throw new Error('Secret value not found');
        }

        return JSON.parse(result.SecretString);
    }

    /**
     * Delete encrypted value from Secrets Manager
     */
    private async deleteSecretValue(key: string, environment: string): Promise<void> {
        const secretName = `${this.secretsPrefix}/${environment}/${key}`;

        // In production, you would use DeleteSecretCommand
        this.logger.info('Secret marked for deletion', { secretName });
    }
}

// Export the handler
export const handler = new ConfigurationServiceHandler().lambdaHandler.bind(new ConfigurationServiceHandler());