"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_CONFIGS = exports.BEDROCK_MODELS = void 0;
exports.defineFlow = defineFlow;
exports.definePrompt = definePrompt;
exports.formatPromptValue = formatPromptValue;
exports.invokeStream = invokeStream;
exports.mergeFlowOptions = mergeFlowOptions;
const client_1 = require("./client");
const config_1 = require("@/aws/config");
const execution_logger_1 = require("./execution-logger");
exports.BEDROCK_MODELS = {
    HAIKU: 'us.anthropic.claude-3-haiku-20240307-v1:0',
    SONNET_3: 'us.anthropic.claude-3-sonnet-20240229-v1:0',
    SONNET_3_5_V1: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
    SONNET_3_5_V2: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    OPUS: 'us.anthropic.claude-3-opus-20240229-v1:0',
};
exports.MODEL_CONFIGS = {
    SIMPLE: {
        modelId: exports.BEDROCK_MODELS.HAIKU,
        temperature: 0.3,
        maxTokens: 2048,
    },
    BALANCED: {
        modelId: exports.BEDROCK_MODELS.SONNET_3_5_V2,
        temperature: 0.5,
        maxTokens: 4096,
    },
    CREATIVE: {
        modelId: exports.BEDROCK_MODELS.SONNET_3_5_V2,
        temperature: 0.7,
        maxTokens: 4096,
    },
    LONG_FORM: {
        modelId: exports.BEDROCK_MODELS.SONNET_3_5_V2,
        temperature: 0.6,
        maxTokens: 8192,
    },
    ANALYTICAL: {
        modelId: exports.BEDROCK_MODELS.SONNET_3_5_V2,
        temperature: 0.2,
        maxTokens: 4096,
    },
    CRITICAL: {
        modelId: exports.BEDROCK_MODELS.OPUS,
        temperature: 0.1,
        maxTokens: 4096,
    },
};
function defineFlow(config, handler) {
    return {
        name: config.name,
        inputSchema: config.inputSchema,
        outputSchema: config.outputSchema,
        execute: async (input) => {
            const validatedInput = config.inputSchema.parse(input);
            return handler(validatedInput);
        },
    };
}
function definePrompt(config) {
    return async (input, runtimeOptions) => {
        const validatedInput = config.inputSchema.parse(input);
        let userPrompt = config.prompt;
        for (const [key, value] of Object.entries(validatedInput)) {
            const regex = new RegExp(`{{{${key}}}}`, 'g');
            const formattedValue = formatPromptValue(value);
            userPrompt = userPrompt.replace(regex, formattedValue);
            const jsonRegex = new RegExp(`{{{json ${key}}}}`, 'g');
            const jsonValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : formattedValue;
            userPrompt = userPrompt.replace(jsonRegex, jsonValue);
        }
        const effectiveModelId = runtimeOptions?.modelId ?? config.options?.modelId;
        const effectiveTemperature = runtimeOptions?.temperature ?? config.options?.temperature ?? 0.7;
        const effectiveMaxTokens = runtimeOptions?.maxTokens ?? config.options?.maxTokens ?? 4096;
        const effectiveTopP = runtimeOptions?.topP ?? config.options?.topP ?? 1;
        const client = (0, client_1.getBedrockClient)(effectiveModelId);
        const executionMetadata = {
            userId: runtimeOptions?.userId,
            featureCategory: (0, execution_logger_1.categorizeFlow)(config.name),
            temperature: effectiveTemperature,
            maxTokens: effectiveMaxTokens,
            topP: effectiveTopP,
        };
        const jsonInstruction = '\n\nIMPORTANT: Respond with ONLY valid JSON matching the required schema. Do not include any markdown formatting, code blocks, or explanatory text.';
        const fullUserPrompt = userPrompt + jsonInstruction;
        try {
            const response = config.systemPrompt
                ? await client.invokeWithPrompts(config.systemPrompt, fullUserPrompt, config.outputSchema, {
                    temperature: effectiveTemperature,
                    maxTokens: effectiveMaxTokens,
                    topP: effectiveTopP,
                    flowName: config.name,
                    executionMetadata,
                })
                : await client.invoke(fullUserPrompt, config.outputSchema, {
                    temperature: effectiveTemperature,
                    maxTokens: effectiveMaxTokens,
                    topP: effectiveTopP,
                    flowName: config.name,
                    executionMetadata,
                });
            return response;
        }
        catch (error) {
            if (error instanceof client_1.BedrockParseError) {
                console.error('Bedrock parse error:', error.message);
                console.error('Raw response:', error.response);
                throw new Error(`AI response validation failed: ${error.message}`);
            }
            if (error instanceof client_1.BedrockError) {
                console.error('Bedrock error:', error.message, error.code);
                throw new Error(`AI service error: ${error.message}`);
            }
            throw error;
        }
    };
}
function formatPromptValue(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.map(v => formatPromptValue(v)).join(', ');
    }
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
}
async function* invokeStream(prompt, options, runtimeOptions) {
    const effectiveModelId = runtimeOptions?.modelId ?? options?.modelId;
    const effectiveTemperature = runtimeOptions?.temperature ?? options?.temperature;
    const effectiveMaxTokens = runtimeOptions?.maxTokens ?? options?.maxTokens;
    const effectiveTopP = runtimeOptions?.topP ?? options?.topP;
    const client = (0, client_1.getBedrockClient)(effectiveModelId);
    yield* client.invokeStream(prompt, {
        temperature: effectiveTemperature,
        maxTokens: effectiveMaxTokens,
        topP: effectiveTopP,
    });
}
function mergeFlowOptions(configOptions, runtimeOptions) {
    const config = (0, config_1.getConfig)();
    return {
        modelId: runtimeOptions?.modelId ?? configOptions?.modelId ?? config.bedrock.modelId,
        temperature: runtimeOptions?.temperature ?? configOptions?.temperature ?? 0.7,
        maxTokens: runtimeOptions?.maxTokens ?? configOptions?.maxTokens ?? 4096,
        topP: runtimeOptions?.topP ?? configOptions?.topP ?? 1,
    };
}
