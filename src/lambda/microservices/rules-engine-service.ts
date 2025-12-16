/**
 * Rules Engine Service
 * 
 * Evaluates business rules and conditions to trigger appropriate actions.
 * Supports complex rule conditions, logical operators, and action execution.
 * 
 * **Feature: microservices-architecture-enhancement**
 * **Validates: Requirements 10.2**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Rule types
interface BusinessRule {
    ruleId: string;
    name: string;
    description: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
    priority: number;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
}

interface RuleCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'exists';
    value: any;
    logicalOperator?: 'and' | 'or';
}

interface RuleAction {
    type: 'set_field' | 'call_service' | 'send_notification' | 'trigger_workflow' | 'log_event';
    parameters: Record<string, any>;
}

interface RuleEvaluationRequest {
    ruleId: string;
    context: Record<string, any>;
    userId: string;
}

interface RuleEvaluationResult {
    ruleId: string;
    matched: boolean;
    executedActions: RuleAction[];
    evaluationTime: number;
    context: Record<string, any>;
    errors?: RuleError[];
}

interface RuleError {
    code: string;
    message: string;
    details?: Record<string, any>;
}

interface CreateRuleRequest {
    rule: Omit<BusinessRule, 'createdAt' | 'updatedAt' | 'userId'>;
    userId: string;
}

interface UpdateRuleRequest {
    ruleId: string;
    updates: Partial<Omit<BusinessRule, 'ruleId' | 'createdAt' | 'updatedAt' | 'userId'>>;
    userId: string;
}

interface EvaluateRulesRequest {
    context: Record<string, any>;
    ruleIds?: string[];
    userId: string;
}

/**
 * Rules Engine Service Handler
 */
class RulesEngineHandler extends BaseLambdaHandler {
    private dynamoClient: DynamoDBClient;
    private tableName: string;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'rules-engine-service',
            version: '1.0.0',
            description: 'Evaluates business rules and conditions to trigger appropriate actions',
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
            if (path === '/rules' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateCreateRuleRequest);
                return await this.createRule(request);
            }

            if (path === '/rules/evaluate' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateEvaluateRulesRequest);
                return await this.evaluateRules(request);
            }

            if (path.startsWith('/rules/') && path.endsWith('/evaluate') && method === 'POST') {
                const ruleId = path.split('/')[2];
                const request = this.validateRequestBody(event, this.validateRuleEvaluationRequest);
                request.ruleId = ruleId;
                return await this.evaluateRule(request);
            }

            if (path.startsWith('/rules/') && method === 'PUT') {
                const ruleId = path.split('/')[2];
                const request = this.validateRequestBody(event, this.validateUpdateRuleRequest);
                request.ruleId = ruleId;
                return await this.updateRule(request);
            }

            if (path.startsWith('/rules/') && method === 'GET') {
                const ruleId = path.split('/')[2];
                const userId = this.extractUserId(event);
                return await this.getRule(ruleId, userId);
            }

            if (path === '/rules' && method === 'GET') {
                const userId = this.extractUserId(event);
                return await this.listRules(userId);
            }

            return this.createErrorResponseData('INVALID_ENDPOINT', 'Endpoint not found', 404);

        } catch (error) {
            this.logger.error('Rules engine error:', error);
            return this.createErrorResponseData(
                'RULES_ENGINE_ERROR',
                error instanceof Error ? error.message : 'Unknown error',
                500
            );
        }
    }

    private async createRule(request: CreateRuleRequest): Promise<ApiResponse> {
        const now = new Date().toISOString();
        const rule: BusinessRule = {
            ...request.rule,
            userId: request.userId,
            createdAt: now,
            updatedAt: now,
        };

        // Validate rule
        this.validateBusinessRule(rule);

        // Store rule
        const item = {
            PK: `USER#${request.userId}`,
            SK: `RULE#${rule.ruleId}`,
            Type: 'BusinessRule',
            ...rule,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
            ConditionExpression: 'attribute_not_exists(PK)',
        }));

        await this.publishServiceEvent('rules-engine', 'RuleCreated', {
            ruleId: rule.ruleId,
            userId: request.userId,
        });

        return this.createSuccessResponse(rule, 201);
    }

    private async updateRule(request: UpdateRuleRequest): Promise<ApiResponse> {
        // Get existing rule
        const existingRule = await this.getRuleById(request.ruleId, request.userId);
        if (!existingRule) {
            return this.createErrorResponseData('RULE_NOT_FOUND', 'Rule not found', 404);
        }

        // Update rule
        const updatedRule: BusinessRule = {
            ...existingRule,
            ...request.updates,
            updatedAt: new Date().toISOString(),
        };

        // Validate updated rule
        this.validateBusinessRule(updatedRule);

        // Store updated rule
        const item = {
            PK: `USER#${request.userId}`,
            SK: `RULE#${request.ruleId}`,
            Type: 'BusinessRule',
            ...updatedRule,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
        }));

        await this.publishServiceEvent('rules-engine', 'RuleUpdated', {
            ruleId: request.ruleId,
            userId: request.userId,
        });

        return this.createSuccessResponse(updatedRule);
    }

    private async evaluateRule(request: RuleEvaluationRequest): Promise<ApiResponse> {
        const rule = await this.getRuleById(request.ruleId, request.userId);
        if (!rule) {
            return this.createErrorResponseData('RULE_NOT_FOUND', 'Rule not found', 404);
        }

        const result = await this.evaluateBusinessRule(rule, request.context);

        await this.publishServiceEvent('rules-engine', 'RuleEvaluated', {
            ruleId: request.ruleId,
            matched: result.matched,
            userId: request.userId,
        });

        return this.createSuccessResponse(result);
    }

    private async evaluateRules(request: EvaluateRulesRequest): Promise<ApiResponse> {
        let rules: BusinessRule[];

        if (request.ruleIds && request.ruleIds.length > 0) {
            // Evaluate specific rules
            rules = [];
            for (const ruleId of request.ruleIds) {
                const rule = await this.getRuleById(ruleId, request.userId);
                if (rule) {
                    rules.push(rule);
                }
            }
        } else {
            // Evaluate all enabled rules for user
            rules = await this.getUserRules(request.userId);
            rules = rules.filter(rule => rule.enabled);
        }

        // Sort by priority (higher priority first)
        rules.sort((a, b) => b.priority - a.priority);

        const results: RuleEvaluationResult[] = [];
        let updatedContext = { ...request.context };

        for (const rule of rules) {
            const result = await this.evaluateBusinessRule(rule, updatedContext);
            results.push(result);

            // Update context with results from executed actions
            if (result.matched) {
                updatedContext = { ...updatedContext, ...result.context };
            }
        }

        await this.publishServiceEvent('rules-engine', 'RulesEvaluated', {
            ruleCount: rules.length,
            matchedCount: results.filter(r => r.matched).length,
            userId: request.userId,
        });

        return this.createSuccessResponse({
            results,
            finalContext: updatedContext,
            evaluatedRules: rules.length,
            matchedRules: results.filter(r => r.matched).length,
        });
    }

    private async getRule(ruleId: string, userId: string): Promise<ApiResponse> {
        const rule = await this.getRuleById(ruleId, userId);
        if (!rule) {
            return this.createErrorResponseData('RULE_NOT_FOUND', 'Rule not found', 404);
        }

        return this.createSuccessResponse(rule);
    }

    private async listRules(userId: string): Promise<ApiResponse> {
        const rules = await this.getUserRules(userId);
        return this.createSuccessResponse({
            rules,
            count: rules.length,
        });
    }

    private async evaluateBusinessRule(rule: BusinessRule, context: Record<string, any>): Promise<RuleEvaluationResult> {
        const startTime = Date.now();
        const errors: RuleError[] = [];

        if (!rule.enabled) {
            return {
                ruleId: rule.ruleId,
                matched: false,
                executedActions: [],
                evaluationTime: Date.now() - startTime,
                context,
            };
        }

        try {
            // Evaluate conditions
            const matched = this.evaluateConditions(rule.conditions, context);

            let executedActions: RuleAction[] = [];
            let updatedContext = { ...context };

            // Execute actions if rule matched
            if (matched) {
                for (const action of rule.actions) {
                    try {
                        executedActions.push(action);
                        updatedContext = this.executeAction(action, updatedContext);
                    } catch (error) {
                        errors.push({
                            code: 'ACTION_EXECUTION_FAILED',
                            message: `Failed to execute action: ${action.type}`,
                            details: { action, error: error instanceof Error ? error.message : String(error) },
                        });
                    }
                }
            }

            return {
                ruleId: rule.ruleId,
                matched,
                executedActions,
                evaluationTime: Date.now() - startTime,
                context: updatedContext,
                errors: errors.length > 0 ? errors : undefined,
            };

        } catch (error) {
            errors.push({
                code: 'RULE_EVALUATION_FAILED',
                message: error instanceof Error ? error.message : 'Rule evaluation failed',
            });

            return {
                ruleId: rule.ruleId,
                matched: false,
                executedActions: [],
                evaluationTime: Date.now() - startTime,
                context,
                errors,
            };
        }
    }

    private evaluateConditions(conditions: RuleCondition[], context: Record<string, any>): boolean {
        if (conditions.length === 0) {
            return true;
        }

        let result = this.evaluateCondition(conditions[0], context);

        for (let i = 1; i < conditions.length; i++) {
            const condition = conditions[i];
            const conditionResult = this.evaluateCondition(condition, context);
            const operator = conditions[i - 1].logicalOperator || 'and';

            if (operator === 'and') {
                result = result && conditionResult;
            } else {
                result = result || conditionResult;
            }
        }

        return result;
    }

    private evaluateCondition(condition: RuleCondition, context: Record<string, any>): boolean {
        const fieldValue = this.getFieldValue(condition.field, context);

        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;
            case 'not_equals':
                return fieldValue !== condition.value;
            case 'greater_than':
                return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue > condition.value;
            case 'less_than':
                return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue < condition.value;
            case 'contains':
                return typeof fieldValue === 'string' && typeof condition.value === 'string' && fieldValue.includes(condition.value);
            case 'in':
                return Array.isArray(condition.value) && condition.value.includes(fieldValue);
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null;
            default:
                return false;
        }
    }

    private getFieldValue(field: string, context: Record<string, any>): any {
        const parts = field.split('.');
        let value = context;
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return undefined;
            }
        }
        return value;
    }

    private executeAction(action: RuleAction, context: Record<string, any>): Record<string, any> {
        const updatedContext = { ...context };

        switch (action.type) {
            case 'set_field':
                if (action.parameters.field && action.parameters.value !== undefined) {
                    this.setFieldValue(action.parameters.field, action.parameters.value, updatedContext);
                }
                break;
            case 'call_service':
                updatedContext._serviceCallResults = updatedContext._serviceCallResults || [];
                updatedContext._serviceCallResults.push({
                    service: action.parameters.service,
                    operation: action.parameters.operation,
                    timestamp: new Date().toISOString(),
                });
                break;
            case 'send_notification':
                updatedContext._notifications = updatedContext._notifications || [];
                updatedContext._notifications.push({
                    type: action.parameters.type,
                    recipient: action.parameters.recipient,
                    message: action.parameters.message,
                    timestamp: new Date().toISOString(),
                });
                break;
            case 'trigger_workflow':
                updatedContext._triggeredWorkflows = updatedContext._triggeredWorkflows || [];
                updatedContext._triggeredWorkflows.push({
                    workflowId: action.parameters.workflowId,
                    timestamp: new Date().toISOString(),
                });
                break;
            case 'log_event':
                updatedContext._loggedEvents = updatedContext._loggedEvents || [];
                updatedContext._loggedEvents.push({
                    level: action.parameters.level,
                    message: action.parameters.message,
                    timestamp: new Date().toISOString(),
                });
                break;
        }

        return updatedContext;
    }

    private setFieldValue(field: string, value: any, context: Record<string, any>): void {
        const parts = field.split('.');
        let current = context;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current) || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
    }

    private async getRuleById(ruleId: string, userId: string): Promise<BusinessRule | null> {
        try {
            const result = await this.dynamoClient.send(new GetItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `RULE#${ruleId}`,
                }),
            }));

            if (!result.Item) {
                return null;
            }

            const item = unmarshall(result.Item);
            return item as BusinessRule;
        } catch (error) {
            this.logger.error('Error getting rule:', error);
            return null;
        }
    }

    private async getUserRules(userId: string): Promise<BusinessRule[]> {
        try {
            const result = await this.dynamoClient.send(new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: marshall({
                    ':pk': `USER#${userId}`,
                    ':sk': 'RULE#',
                }),
            }));

            if (!result.Items) {
                return [];
            }

            return result.Items.map(item => unmarshall(item) as BusinessRule);
        } catch (error) {
            this.logger.error('Error getting user rules:', error);
            return [];
        }
    }

    private validateBusinessRule(rule: BusinessRule): void {
        if (!rule.ruleId || !rule.name || !rule.conditions || !rule.actions) {
            throw new Error('Invalid rule: missing required fields');
        }

        if (rule.conditions.length === 0) {
            throw new Error('Rule must have at least one condition');
        }

        if (rule.actions.length === 0) {
            throw new Error('Rule must have at least one action');
        }

        // Validate conditions
        for (const condition of rule.conditions) {
            if (!condition.field || !condition.operator) {
                throw new Error('Invalid condition: missing field or operator');
            }

            const validOperators = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'exists'];
            if (!validOperators.includes(condition.operator)) {
                throw new Error(`Invalid operator: ${condition.operator}`);
            }
        }

        // Validate actions
        for (const action of rule.actions) {
            if (!action.type || !action.parameters) {
                throw new Error('Invalid action: missing type or parameters');
            }

            const validActionTypes = ['set_field', 'call_service', 'send_notification', 'trigger_workflow', 'log_event'];
            if (!validActionTypes.includes(action.type)) {
                throw new Error(`Invalid action type: ${action.type}`);
            }
        }
    }

    // Validation functions
    private validateCreateRuleRequest(data: any): CreateRuleRequest {
        if (!data.rule || !data.userId) {
            throw new Error('Missing required fields: rule, userId');
        }
        return data as CreateRuleRequest;
    }

    private validateUpdateRuleRequest(data: any): UpdateRuleRequest {
        if (!data.updates || !data.userId) {
            throw new Error('Missing required fields: updates, userId');
        }
        return data as UpdateRuleRequest;
    }

    private validateRuleEvaluationRequest(data: any): RuleEvaluationRequest {
        if (!data.context || !data.userId) {
            throw new Error('Missing required fields: context, userId');
        }
        return data as RuleEvaluationRequest;
    }

    private validateEvaluateRulesRequest(data: any): EvaluateRulesRequest {
        if (!data.context || !data.userId) {
            throw new Error('Missing required fields: context, userId');
        }
        return data as EvaluateRulesRequest;
    }
}

// Export handler
export const handler = new RulesEngineHandler().lambdaHandler.bind(new RulesEngineHandler());

// Export types for testing
export {
    BusinessRule,
    RuleCondition,
    RuleAction,
    RuleEvaluationRequest,
    RuleEvaluationResult,
    CreateRuleRequest,
    UpdateRuleRequest,
    EvaluateRulesRequest,
};