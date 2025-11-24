"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionLogger = exports.FlowExecutionLogSchema = void 0;
exports.createExecutionLogger = createExecutionLogger;
exports.extractTokenUsage = extractTokenUsage;
exports.categorizeFlow = categorizeFlow;
const logger_1 = require("@/aws/logging/logger");
const zod_1 = require("zod");
exports.FlowExecutionLogSchema = zod_1.z.object({
    timestamp: zod_1.z.string(),
    flowName: zod_1.z.string(),
    modelId: zod_1.z.string(),
    executionTimeMs: zod_1.z.number(),
    tokenUsage: zod_1.z.object({
        input: zod_1.z.number(),
        output: zod_1.z.number(),
    }).optional(),
    success: zod_1.z.boolean(),
    error: zod_1.z.object({
        type: zod_1.z.string(),
        message: zod_1.z.string(),
        retryCount: zod_1.z.number(),
        code: zod_1.z.string().optional(),
        statusCode: zod_1.z.number().optional(),
    }).optional(),
    metadata: zod_1.z.object({
        userId: zod_1.z.string().optional(),
        featureCategory: zod_1.z.string(),
        temperature: zod_1.z.number(),
        maxTokens: zod_1.z.number(),
        topP: zod_1.z.number().optional(),
    }),
});
const bedrockLogger = (0, logger_1.createLogger)({ service: 'bedrock-flows' });
class ExecutionLogger {
    constructor(flowName, modelId, metadata) {
        this.retryCount = 0;
        this.flowName = flowName;
        this.modelId = modelId;
        this.metadata = metadata;
        this.startTime = Date.now();
    }
    incrementRetry() {
        this.retryCount++;
    }
    getRetryCount() {
        return this.retryCount;
    }
    logSuccess(tokenUsage) {
        const executionTimeMs = Date.now() - this.startTime;
        const logEntry = {
            timestamp: new Date().toISOString(),
            flowName: this.flowName,
            modelId: this.modelId,
            executionTimeMs,
            tokenUsage,
            success: true,
            metadata: this.metadata,
        };
        exports.FlowExecutionLogSchema.parse(logEntry);
        bedrockLogger.info(`Flow execution succeeded: ${this.flowName}`, {
            flowName: this.flowName,
            modelId: this.modelId,
            executionTimeMs,
            tokenUsage,
            featureCategory: this.metadata.featureCategory,
            temperature: this.metadata.temperature,
            maxTokens: this.metadata.maxTokens,
            userId: this.metadata.userId,
        });
        this.storeMetrics(logEntry);
    }
    logError(error, errorCode, statusCode) {
        const executionTimeMs = Date.now() - this.startTime;
        const executionError = {
            type: error.name,
            message: error.message,
            retryCount: this.retryCount,
        };
        const code = errorCode || error.code;
        const status = statusCode || error.statusCode;
        if (code) {
            executionError.code = code;
        }
        if (status) {
            executionError.statusCode = status;
        }
        const logEntry = {
            timestamp: new Date().toISOString(),
            flowName: this.flowName,
            modelId: this.modelId,
            executionTimeMs,
            success: false,
            error: executionError,
            metadata: this.metadata,
        };
        exports.FlowExecutionLogSchema.parse(logEntry);
        bedrockLogger.error(`Flow execution failed: ${this.flowName}`, error, {
            flowName: this.flowName,
            modelId: this.modelId,
            executionTimeMs,
            errorType: executionError.type,
            errorCode: executionError.code,
            statusCode: executionError.statusCode,
            retryCount: this.retryCount,
            featureCategory: this.metadata.featureCategory,
            temperature: this.metadata.temperature,
            maxTokens: this.metadata.maxTokens,
            userId: this.metadata.userId,
        });
        this.storeMetrics(logEntry);
    }
    storeMetrics(logEntry) {
        bedrockLogger.debug('Flow execution metrics', {
            metrics: logEntry,
        });
    }
}
exports.ExecutionLogger = ExecutionLogger;
function createExecutionLogger(flowName, modelId, metadata) {
    return new ExecutionLogger(flowName, modelId, metadata);
}
function extractTokenUsage(responseMetadata) {
    if (responseMetadata?.usage) {
        return {
            input: responseMetadata.usage.inputTokens || 0,
            output: responseMetadata.usage.outputTokens || 0,
        };
    }
    return undefined;
}
function categorizeFlow(flowName) {
    const categories = {
        'content-generation': [
            'generateBlogPost',
            'generateNeighborhoodGuides',
            'generateSocialMediaPost',
            'listingDescriptionGenerator',
            'generateAgentBio',
            'generateVideoScript',
            'generateListingFaqs',
            'generateMarketUpdate',
        ],
        'analysis': [
            'analyzeReviewSentiment',
            'analyzeMultipleReviews',
            'runNapAudit',
            'findCompetitors',
            'enrichCompetitorData',
            'getKeywordRankings',
        ],
        'strategic': [
            'generateMarketingPlan',
            'runResearchAgent',
        ],
    };
    for (const [category, flows] of Object.entries(categories)) {
        if (flows.includes(flowName)) {
            return category;
        }
    }
    return 'other';
}
