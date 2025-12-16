/**
 * Template Service
 * 
 * Manages reusable workflow and process templates for consistent orchestration patterns.
 * Provides template creation, versioning, and instantiation capabilities.
 * 
 * **Feature: microservices-architecture-enhancement**
 * **Validates: Requirements 10.5**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Template types
interface WorkflowTemplate {
    templateId: string;
    name: string;
    description: string;
    category: string;
    version: string;
    type: 'workflow' | 'saga' | 'process' | 'rule_set';
    template: TemplateDefinition;
    parameters: TemplateParameter[];
    tags: string[];
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
    usageCount: number;
}

interface TemplateDefinition {
    steps?: TemplateStep[];
    transactions?: TemplateTransaction[];
    rules?: TemplateRule[];
    config?: Record<string, any>;
    metadata?: Record<string, any>;
}

interface TemplateStep {
    stepId: string;
    name: string;
    type: string;
    config: Record<string, any>;
    nextSteps: string[];
    parameters?: string[]; // Parameter names that can be substituted
}

interface TemplateTransaction {
    transactionId: string;
    serviceName: string;
    operation: string;
    input: Record<string, any>;
    compensationId?: string;
    parameters?: string[];
}

interface TemplateRule {
    ruleId: string;
    name: string;
    conditions: TemplateRuleCondition[];
    actions: TemplateRuleAction[];
    parameters?: string[];
}

interface TemplateRuleCondition {
    field: string;
    operator: string;
    value: any;
    logicalOperator?: string;
}

interface TemplateRuleAction {
    type: string;
    parameters: Record<string, any>;
}

interface TemplateParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required: boolean;
    defaultValue?: any;
    validation?: TemplateParameterValidation;
}

interface TemplateParameterValidation {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
}

interface TemplateInstance {
    instanceId: string;
    templateId: string;
    templateVersion: string;
    name: string;
    parameters: Record<string, any>;
    instantiatedDefinition: any; // The actual workflow/saga/process definition
    createdAt: string;
    userId: string;
}

// Request/Response types
interface CreateTemplateRequest {
    template: Omit<WorkflowTemplate, 'createdAt' | 'updatedAt' | 'userId' | 'usageCount'>;
    userId: string;
}

interface UpdateTemplateRequest {
    templateId: string;
    updates: Partial<Omit<WorkflowTemplate, 'templateId' | 'createdAt' | 'updatedAt' | 'userId' | 'usageCount'>>;
    userId: string;
}

interface InstantiateTemplateRequest {
    templateId: string;
    templateVersion?: string;
    name: string;
    parameters: Record<string, any>;
    userId: string;
}

interface SearchTemplatesRequest {
    query?: string;
    category?: string;
    type?: string;
    tags?: string[];
    isPublic?: boolean;
    userId: string;
}

/**
 * Template Service Handler
 */
class TemplateServiceHandler extends BaseLambdaHandler {
    private dynamoClient: DynamoDBClient;
    private tableName: string;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'template-service',
            version: '1.0.0',
            description: 'Manages reusable workflow and process templates for consistent orchestration patterns',
            enableTracing: true,
            enableCircuitBreaker: true,
            enableRetry: true,
        };

        super(config);

        this.dynamoClient = new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1',
            ...(process.env.USE_LOCAL_AWS === 'true' && {
                endpoint: 'http://localhost:4566',
                credentials: {
                    accessKeyId: 'test',
                    secretAccessKey: 'test',
                },
            }),
        });

        this.tableName = process.env.DYNAMODB_TABLE || 'bayon-coagent-dev';
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const path = event.path;
        const method = event.httpMethod;

        try {
            // Health check
            if (path === '/health' && method === 'GET') {
                return this.createHealthCheckResponse();
            }

            // Route requests
            if (path === '/templates' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateCreateTemplateRequest);
                return await this.createTemplate(request);
            }

            if (path === '/templates/search' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateSearchTemplatesRequest);
                return await this.searchTemplates(request);
            }

            if (path === '/templates/instantiate' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateInstantiateTemplateRequest);
                return await this.instantiateTemplate(request);
            }

            if (path.startsWith('/templates/') && method === 'PUT') {
                const templateId = path.split('/')[2];
                const request = this.validateRequestBody(event, this.validateUpdateTemplateRequest);
                request.templateId = templateId;
                return await this.updateTemplate(request);
            }

            if (path.startsWith('/templates/') && path.endsWith('/versions') && method === 'GET') {
                const templateId = path.split('/')[2];
                const userId = this.extractUserId(event);
                return await this.getTemplateVersions(templateId, userId);
            }

            if (path.startsWith('/templates/') && method === 'GET') {
                const templateId = path.split('/')[2];
                const userId = this.extractUserId(event);
                const version = event.queryStringParameters?.version;
                return await this.getTemplate(templateId, userId, version);
            }

            if (path === '/templates' && method === 'GET') {
                const userId = this.extractUserId(event);
                const category = event.queryStringParameters?.category;
                const type = event.queryStringParameters?.type;
                return await this.listTemplates(userId, category, type);
            }

            if (path === '/templates/instances' && method === 'GET') {
                const userId = this.extractUserId(event);
                return await this.listTemplateInstances(userId);
            }

            return this.createErrorResponseData('INVALID_ENDPOINT', 'Endpoint not found', 404);

        } catch (error) {
            this.logger.error('Template service error:', error);
            return this.createErrorResponseData(
                'TEMPLATE_SERVICE_ERROR',
                error instanceof Error ? error.message : 'Unknown error',
                500
            );
        }
    }

    private async createTemplate(request: CreateTemplateRequest): Promise<ApiResponse> {
        const now = new Date().toISOString();
        const template: WorkflowTemplate = {
            ...request.template,
            userId: request.userId,
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
        };

        // Validate template
        this.validateWorkflowTemplate(template);

        // Store template
        const item = {
            PK: `USER#${request.userId}`,
            SK: `TEMPLATE#${template.templateId}#${template.version}`,
            Type: 'WorkflowTemplate',
            GSI1PK: `TEMPLATE#${template.templateId}`,
            GSI1SK: `VERSION#${template.version}`,
            ...template,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
            ConditionExpression: 'attribute_not_exists(PK)',
        }));

        await this.publishServiceEvent('template-service', 'TemplateCreated', {
            templateId: template.templateId,
            version: template.version,
            userId: request.userId,
        });

        return this.createSuccessResponse(template, 201);
    }

    private async updateTemplate(request: UpdateTemplateRequest): Promise<ApiResponse> {
        // Get existing template
        const existingTemplate = await this.getTemplateById(request.templateId, request.userId);
        if (!existingTemplate) {
            return this.createErrorResponseData('TEMPLATE_NOT_FOUND', 'Template not found', 404);
        }

        // Create new version if template definition changed
        const isDefinitionChanged = request.updates.template || request.updates.parameters;
        const newVersion = isDefinitionChanged ? this.generateNewVersion(existingTemplate.version) : existingTemplate.version;

        const updatedTemplate: WorkflowTemplate = {
            ...existingTemplate,
            ...request.updates,
            version: newVersion,
            updatedAt: new Date().toISOString(),
        };

        // Validate updated template
        this.validateWorkflowTemplate(updatedTemplate);

        // Store updated template
        const item = {
            PK: `USER#${request.userId}`,
            SK: `TEMPLATE#${request.templateId}#${newVersion}`,
            Type: 'WorkflowTemplate',
            GSI1PK: `TEMPLATE#${request.templateId}`,
            GSI1SK: `VERSION#${newVersion}`,
            ...updatedTemplate,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
        }));

        await this.publishServiceEvent('template-service', 'TemplateUpdated', {
            templateId: request.templateId,
            version: newVersion,
            userId: request.userId,
        });

        return this.createSuccessResponse(updatedTemplate);
    }

    private async instantiateTemplate(request: InstantiateTemplateRequest): Promise<ApiResponse> {
        // Get template
        const template = await this.getTemplateById(request.templateId, request.userId, request.templateVersion);
        if (!template) {
            return this.createErrorResponseData('TEMPLATE_NOT_FOUND', 'Template not found', 404);
        }

        // Validate parameters
        const validationResult = this.validateTemplateParameters(template.parameters, request.parameters);
        if (!validationResult.valid) {
            return this.createErrorResponseData('INVALID_PARAMETERS', validationResult.errors.join(', '), 400);
        }

        // Instantiate template
        const instanceId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const instantiatedDefinition = this.instantiateTemplateDefinition(template.template, request.parameters);

        const instance: TemplateInstance = {
            instanceId,
            templateId: request.templateId,
            templateVersion: template.version,
            name: request.name,
            parameters: request.parameters,
            instantiatedDefinition,
            createdAt: new Date().toISOString(),
            userId: request.userId,
        };

        // Store instance
        const item = {
            PK: `USER#${request.userId}`,
            SK: `TEMPLATE_INST#${instanceId}`,
            Type: 'TemplateInstance',
            ...instance,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
        }));

        // Increment usage count
        await this.incrementTemplateUsage(request.templateId, template.version, request.userId);

        await this.publishServiceEvent('template-service', 'TemplateInstantiated', {
            templateId: request.templateId,
            instanceId,
            userId: request.userId,
        });

        return this.createSuccessResponse(instance, 201);
    }

    private async searchTemplates(request: SearchTemplatesRequest): Promise<ApiResponse> {
        // For simplicity, this implementation does basic filtering
        // In a production system, you might use ElasticSearch or similar
        const templates = await this.listAllTemplates(request.userId, request.isPublic);

        let filteredTemplates = templates;

        // Filter by category
        if (request.category) {
            filteredTemplates = filteredTemplates.filter(t => t.category === request.category);
        }

        // Filter by type
        if (request.type) {
            filteredTemplates = filteredTemplates.filter(t => t.type === request.type);
        }

        // Filter by tags
        if (request.tags && request.tags.length > 0) {
            filteredTemplates = filteredTemplates.filter(t =>
                request.tags!.some(tag => t.tags.includes(tag))
            );
        }

        // Filter by query (simple text search in name and description)
        if (request.query) {
            const query = request.query.toLowerCase();
            filteredTemplates = filteredTemplates.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query)
            );
        }

        // Sort by usage count (most used first)
        filteredTemplates.sort((a, b) => b.usageCount - a.usageCount);

        return this.createSuccessResponse({
            templates: filteredTemplates,
            count: filteredTemplates.length,
        });
    }

    private async getTemplate(templateId: string, userId: string, version?: string): Promise<ApiResponse> {
        const template = await this.getTemplateById(templateId, userId, version);
        if (!template) {
            return this.createErrorResponseData('TEMPLATE_NOT_FOUND', 'Template not found', 404);
        }

        return this.createSuccessResponse(template);
    }

    private async getTemplateVersions(templateId: string, userId: string): Promise<ApiResponse> {
        const versions = await this.getTemplateVersionsById(templateId, userId);
        return this.createSuccessResponse({
            templateId,
            versions: versions.map(v => ({
                version: v.version,
                createdAt: v.createdAt,
                updatedAt: v.updatedAt,
                usageCount: v.usageCount,
            })),
            count: versions.length,
        });
    }

    private async listTemplates(userId: string, category?: string, type?: string): Promise<ApiResponse> {
        const templates = await this.getUserTemplates(userId);

        let filteredTemplates = templates;

        if (category) {
            filteredTemplates = filteredTemplates.filter(t => t.category === category);
        }

        if (type) {
            filteredTemplates = filteredTemplates.filter(t => t.type === type);
        }

        return this.createSuccessResponse({
            templates: filteredTemplates,
            count: filteredTemplates.length,
        });
    }

    private async listTemplateInstances(userId: string): Promise<ApiResponse> {
        try {
            const result = await this.dynamoClient.send(new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: marshall({
                    ':pk': `USER#${userId}`,
                    ':sk': 'TEMPLATE_INST#',
                }),
            }));

            if (!result.Items) {
                return this.createSuccessResponse({ instances: [], count: 0 });
            }

            const instances = result.Items.map(item => unmarshall(item) as TemplateInstance);

            // Sort by creation time (newest first)
            instances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return this.createSuccessResponse({
                instances,
                count: instances.length,
            });

        } catch (error) {
            this.logger.error('Error listing template instances:', error);
            return this.createErrorResponseData('LIST_INSTANCES_FAILED', 'Failed to list template instances', 500);
        }
    }

    private async getTemplateById(templateId: string, userId: string, version?: string): Promise<WorkflowTemplate | null> {
        try {
            if (version) {
                // Get specific version
                const result = await this.dynamoClient.send(new GetItemCommand({
                    TableName: this.tableName,
                    Key: marshall({
                        PK: `USER#${userId}`,
                        SK: `TEMPLATE#${templateId}#${version}`,
                    }),
                }));

                if (!result.Item) {
                    return null;
                }

                return unmarshall(result.Item) as WorkflowTemplate;
            } else {
                // Get latest version
                const versions = await this.getTemplateVersionsById(templateId, userId);
                if (versions.length === 0) {
                    return null;
                }

                // Sort by version and return latest
                versions.sort((a, b) => this.compareVersions(b.version, a.version));
                return versions[0];
            }
        } catch (error) {
            this.logger.error('Error getting template:', error);
            return null;
        }
    }

    private async getTemplateVersionsById(templateId: string, userId: string): Promise<WorkflowTemplate[]> {
        try {
            const result = await this.dynamoClient.send(new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: marshall({
                    ':pk': `USER#${userId}`,
                    ':sk': `TEMPLATE#${templateId}#`,
                }),
            }));

            if (!result.Items) {
                return [];
            }

            return result.Items.map(item => unmarshall(item) as WorkflowTemplate);
        } catch (error) {
            this.logger.error('Error getting template versions:', error);
            return [];
        }
    }

    private async getUserTemplates(userId: string): Promise<WorkflowTemplate[]> {
        try {
            const result = await this.dynamoClient.send(new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: marshall({
                    ':pk': `USER#${userId}`,
                    ':sk': 'TEMPLATE#',
                }),
            }));

            if (!result.Items) {
                return [];
            }

            const templates = result.Items.map(item => unmarshall(item) as WorkflowTemplate);

            // Return only latest version of each template
            const templateMap = new Map<string, WorkflowTemplate>();
            for (const template of templates) {
                const existing = templateMap.get(template.templateId);
                if (!existing || this.compareVersions(template.version, existing.version) > 0) {
                    templateMap.set(template.templateId, template);
                }
            }

            return Array.from(templateMap.values());
        } catch (error) {
            this.logger.error('Error getting user templates:', error);
            return [];
        }
    }

    private async listAllTemplates(userId: string, includePublic?: boolean): Promise<WorkflowTemplate[]> {
        // For simplicity, just return user templates
        // In a production system, you'd also query public templates from other users
        return this.getUserTemplates(userId);
    }

    private async incrementTemplateUsage(templateId: string, version: string, userId: string): Promise<void> {
        try {
            await this.dynamoClient.send(new UpdateItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `TEMPLATE#${templateId}#${version}`,
                }),
                UpdateExpression: 'ADD usageCount :inc',
                ExpressionAttributeValues: marshall({
                    ':inc': 1,
                }),
            }));
        } catch (error) {
            this.logger.error('Error incrementing template usage:', error);
        }
    }

    private instantiateTemplateDefinition(template: TemplateDefinition, parameters: Record<string, any>): any {
        // Deep clone the template and substitute parameters
        const instantiated = JSON.parse(JSON.stringify(template));

        // Replace parameter placeholders with actual values
        this.substituteParameters(instantiated, parameters);

        return instantiated;
    }

    private substituteParameters(obj: any, parameters: Record<string, any>): void {
        if (typeof obj === 'string') {
            // Replace parameter placeholders like {{paramName}}
            return obj.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
                return parameters[paramName] !== undefined ? parameters[paramName] : match;
            });
        } else if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                obj[i] = this.substituteParameters(obj[i], parameters);
            }
        } else if (obj && typeof obj === 'object') {
            for (const key in obj) {
                obj[key] = this.substituteParameters(obj[key], parameters);
            }
        }
        return obj;
    }

    private validateTemplateParameters(templateParams: TemplateParameter[], providedParams: Record<string, any>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check required parameters
        for (const param of templateParams) {
            if (param.required && !(param.name in providedParams)) {
                errors.push(`Missing required parameter: ${param.name}`);
                continue;
            }

            const value = providedParams[param.name];
            if (value === undefined) continue;

            // Type validation
            if (!this.validateParameterType(value, param.type)) {
                errors.push(`Parameter ${param.name} must be of type ${param.type}`);
                continue;
            }

            // Additional validation
            if (param.validation) {
                const validationErrors = this.validateParameterValue(value, param.validation, param.name);
                errors.push(...validationErrors);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    private validateParameterType(value: any, type: string): boolean {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number';
            case 'boolean':
                return typeof value === 'boolean';
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'array':
                return Array.isArray(value);
            default:
                return false;
        }
    }

    private validateParameterValue(value: any, validation: TemplateParameterValidation, paramName: string): string[] {
        const errors: string[] = [];

        if (typeof value === 'string') {
            if (validation.minLength !== undefined && value.length < validation.minLength) {
                errors.push(`Parameter ${paramName} must be at least ${validation.minLength} characters`);
            }
            if (validation.maxLength !== undefined && value.length > validation.maxLength) {
                errors.push(`Parameter ${paramName} must be at most ${validation.maxLength} characters`);
            }
            if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
                errors.push(`Parameter ${paramName} does not match required pattern`);
            }
        }

        if (typeof value === 'number') {
            if (validation.min !== undefined && value < validation.min) {
                errors.push(`Parameter ${paramName} must be at least ${validation.min}`);
            }
            if (validation.max !== undefined && value > validation.max) {
                errors.push(`Parameter ${paramName} must be at most ${validation.max}`);
            }
        }

        if (validation.enum && !validation.enum.includes(value)) {
            errors.push(`Parameter ${paramName} must be one of: ${validation.enum.join(', ')}`);
        }

        return errors;
    }

    private generateNewVersion(currentVersion: string): string {
        const parts = currentVersion.split('.');
        const patch = parseInt(parts[2] || '0') + 1;
        return `${parts[0]}.${parts[1]}.${patch}`;
    }

    private compareVersions(a: string, b: string): number {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;

            if (aPart > bPart) return 1;
            if (aPart < bPart) return -1;
        }

        return 0;
    }

    private validateWorkflowTemplate(template: WorkflowTemplate): void {
        if (!template.templateId || !template.name || !template.type || !template.template) {
            throw new Error('Invalid template: missing required fields');
        }

        const validTypes = ['workflow', 'saga', 'process', 'rule_set'];
        if (!validTypes.includes(template.type)) {
            throw new Error(`Invalid template type: ${template.type}`);
        }

        // Validate parameters
        for (const param of template.parameters) {
            if (!param.name || !param.type || !param.description) {
                throw new Error('Invalid parameter: missing required fields');
            }

            const validParamTypes = ['string', 'number', 'boolean', 'object', 'array'];
            if (!validParamTypes.includes(param.type)) {
                throw new Error(`Invalid parameter type: ${param.type}`);
            }
        }
    }

    // Validation functions
    private validateCreateTemplateRequest(data: any): CreateTemplateRequest {
        if (!data.template || !data.userId) {
            throw new Error('Missing required fields: template, userId');
        }
        return data as CreateTemplateRequest;
    }

    private validateUpdateTemplateRequest(data: any): UpdateTemplateRequest {
        if (!data.updates || !data.userId) {
            throw new Error('Missing required fields: updates, userId');
        }
        return data as UpdateTemplateRequest;
    }

    private validateInstantiateTemplateRequest(data: any): InstantiateTemplateRequest {
        if (!data.templateId || !data.name || !data.parameters || !data.userId) {
            throw new Error('Missing required fields: templateId, name, parameters, userId');
        }
        return data as InstantiateTemplateRequest;
    }

    private validateSearchTemplatesRequest(data: any): SearchTemplatesRequest {
        if (!data.userId) {
            throw new Error('Missing required field: userId');
        }
        return data as SearchTemplatesRequest;
    }
}

// Export handler
export const handler = new TemplateServiceHandler().lambdaHandler.bind(new TemplateServiceHandler());

// Export types for testing
export {
    WorkflowTemplate,
    TemplateDefinition,
    TemplateParameter,
    TemplateInstance,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    InstantiateTemplateRequest,
    SearchTemplatesRequest,
};