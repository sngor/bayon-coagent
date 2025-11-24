"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockClient = exports.BedrockParseError = exports.BedrockError = void 0;
exports.getBedrockClient = getBedrockClient;
exports.resetBedrockClient = resetBedrockClient;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const config_1 = require("@/aws/config");
const execution_logger_1 = require("./execution-logger");
class BedrockError extends Error {
    constructor(message, code, statusCode, originalError) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.originalError = originalError;
        this.name = 'BedrockError';
    }
}
exports.BedrockError = BedrockError;
class BedrockParseError extends Error {
    constructor(message, response, validationErrors) {
        super(message);
        this.response = response;
        this.validationErrors = validationErrors;
        this.name = 'BedrockParseError';
    }
}
exports.BedrockParseError = BedrockParseError;
const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
};
class BedrockClient {
    constructor(modelId) {
        const config = (0, config_1.getConfig)();
        const credentials = (0, config_1.getAWSCredentials)();
        this.client = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: config.bedrock.region,
            endpoint: config.bedrock.endpoint,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                }
                : undefined,
        });
        this.modelId = modelId || config.bedrock.modelId;
    }
    constructMessages(systemPrompt, userPrompt) {
        return {
            system: [{ text: systemPrompt }],
            messages: [
                {
                    role: 'user',
                    content: [{ text: userPrompt }],
                },
            ],
        };
    }
    extractTextFromResponse(content) {
        if (!content || content.length === 0) {
            throw new BedrockParseError('Empty content in Converse response', content);
        }
        const textContent = content.find((block) => 'text' in block);
        if (textContent && 'text' in textContent) {
            return textContent.text || '';
        }
        throw new BedrockParseError('No text content found in Converse response', content);
    }
    parseJSONResponse(textResponse) {
        try {
            const parsed = JSON.parse(textResponse);
            return parsed;
        }
        catch (firstError) {
            const codeBlockMatch = textResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (codeBlockMatch) {
                try {
                    return JSON.parse(codeBlockMatch[1]);
                }
                catch {
                }
            }
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                }
                catch {
                }
            }
            console.error('Failed to parse JSON response:', textResponse.substring(0, 200));
            return { result: textResponse };
        }
    }
    async withRetry(operation, retryConfig = DEFAULT_RETRY_CONFIG, executionLogger) {
        let lastError;
        let delay = retryConfig.initialDelayMs;
        for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                const isRetryable = this.isRetryableError(error);
                if (!isRetryable || attempt === retryConfig.maxRetries) {
                    throw lastError;
                }
                if (executionLogger) {
                    executionLogger.incrementRetry();
                }
                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs);
            }
        }
        throw lastError || new Error('Retry failed');
    }
    isRetryableError(error) {
        if (error && typeof error === 'object') {
            const err = error;
            if (err.name === 'ThrottlingException' || err.code === 'ThrottlingException') {
                return true;
            }
            if (err.statusCode === 503 || err.statusCode === 429) {
                return true;
            }
            if (err.name === 'TimeoutError' || err.code === 'TimeoutError') {
                return true;
            }
        }
        return false;
    }
    async invoke(prompt, outputSchema, options = {}) {
        const retryConfig = {
            ...DEFAULT_RETRY_CONFIG,
            ...options.retryConfig,
        };
        let executionLogger;
        if (options.flowName && options.executionMetadata) {
            executionLogger = (0, execution_logger_1.createExecutionLogger)(options.flowName, this.modelId, options.executionMetadata);
        }
        return this.withRetry(async () => {
            try {
                const input = {
                    modelId: this.modelId,
                    messages: [
                        {
                            role: 'user',
                            content: [{ text: prompt }],
                        },
                    ],
                    inferenceConfig: {
                        temperature: options.temperature ?? 0.7,
                        maxTokens: options.maxTokens || 4096,
                        topP: options.topP ?? 1,
                    },
                };
                const command = new client_bedrock_runtime_1.ConverseCommand(input);
                const response = await this.client.send(command);
                if (!response.output) {
                    throw new BedrockError('Empty response from Bedrock');
                }
                const textResponse = this.extractTextFromResponse(response.output.message?.content);
                const parsedOutput = this.parseJSONResponse(textResponse);
                const validationResult = outputSchema.safeParse(parsedOutput);
                if (!validationResult.success) {
                    throw new BedrockParseError('Response does not match expected schema', parsedOutput, validationResult.error);
                }
                if (executionLogger) {
                    const tokenUsage = (0, execution_logger_1.extractTokenUsage)(response);
                    executionLogger.logSuccess(tokenUsage);
                }
                return validationResult.data;
            }
            catch (error) {
                if (executionLogger) {
                    const err = error;
                    executionLogger.logError(error instanceof Error ? error : new Error(String(error)), err.code || err.name, err.statusCode || err.$metadata?.httpStatusCode);
                }
                if (error instanceof BedrockError || error instanceof BedrockParseError) {
                    throw error;
                }
                const err = error;
                throw new BedrockError(err.message || 'Failed to invoke Bedrock model', err.code || err.name, err.statusCode || err.$metadata?.httpStatusCode, error);
            }
        }, retryConfig, executionLogger);
    }
    async *invokeStream(prompt, options = {}) {
        try {
            const input = {
                modelId: this.modelId,
                messages: [
                    {
                        role: 'user',
                        content: [{ text: prompt }],
                    },
                ],
                inferenceConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxTokens: options.maxTokens || 4096,
                    topP: options.topP ?? 1,
                },
            };
            const command = new client_bedrock_runtime_1.ConverseStreamCommand(input);
            const response = await this.client.send(command);
            if (!response.stream) {
                throw new BedrockError('Empty streaming response from Bedrock');
            }
            for await (const event of response.stream) {
                if (event.contentBlockDelta?.delta && 'text' in event.contentBlockDelta.delta) {
                    yield event.contentBlockDelta.delta.text || '';
                }
            }
        }
        catch (error) {
            if (error instanceof BedrockError) {
                throw error;
            }
            const err = error;
            throw new BedrockError(err.message || 'Failed to stream from Bedrock model', err.code || err.name, err.statusCode || err.$metadata?.httpStatusCode, error);
        }
    }
    async invokeWithPrompts(systemPrompt, userPrompt, outputSchema, options = {}) {
        const retryConfig = {
            ...DEFAULT_RETRY_CONFIG,
            ...options.retryConfig,
        };
        let executionLogger;
        if (options.flowName && options.executionMetadata) {
            executionLogger = (0, execution_logger_1.createExecutionLogger)(options.flowName, this.modelId, options.executionMetadata);
        }
        return this.withRetry(async () => {
            try {
                const input = {
                    modelId: this.modelId,
                    system: [{ text: systemPrompt }],
                    messages: [
                        {
                            role: 'user',
                            content: [{ text: userPrompt }],
                        },
                    ],
                    inferenceConfig: {
                        temperature: options.temperature ?? 0.7,
                        maxTokens: options.maxTokens || 4096,
                        topP: options.topP ?? 1,
                    },
                };
                const command = new client_bedrock_runtime_1.ConverseCommand(input);
                const response = await this.client.send(command);
                if (!response.output) {
                    throw new BedrockError('Empty response from Bedrock');
                }
                const textResponse = this.extractTextFromResponse(response.output.message?.content);
                const parsedOutput = this.parseJSONResponse(textResponse);
                const validationResult = outputSchema.safeParse(parsedOutput);
                if (!validationResult.success) {
                    throw new BedrockParseError('Response does not match expected schema', parsedOutput, validationResult.error);
                }
                if (executionLogger) {
                    const tokenUsage = (0, execution_logger_1.extractTokenUsage)(response);
                    executionLogger.logSuccess(tokenUsage);
                }
                return validationResult.data;
            }
            catch (error) {
                if (executionLogger) {
                    const err = error;
                    executionLogger.logError(error instanceof Error ? error : new Error(String(error)), err.code || err.name, err.statusCode || err.$metadata?.httpStatusCode);
                }
                if (error instanceof BedrockError || error instanceof BedrockParseError) {
                    throw error;
                }
                const err = error;
                throw new BedrockError(err.message || 'Failed to invoke Bedrock model', err.code || err.name, err.statusCode || err.$metadata?.httpStatusCode, error);
            }
        }, retryConfig, executionLogger);
    }
    async *invokeStreamWithPrompts(systemPrompt, userPrompt, options = {}) {
        try {
            const input = {
                modelId: this.modelId,
                system: [{ text: systemPrompt }],
                messages: [
                    {
                        role: 'user',
                        content: [{ text: userPrompt }],
                    },
                ],
                inferenceConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxTokens: options.maxTokens || 4096,
                    topP: options.topP ?? 1,
                },
            };
            const command = new client_bedrock_runtime_1.ConverseStreamCommand(input);
            const response = await this.client.send(command);
            if (!response.stream) {
                throw new BedrockError('Empty streaming response from Bedrock');
            }
            for await (const event of response.stream) {
                if (event.contentBlockDelta?.delta && 'text' in event.contentBlockDelta.delta) {
                    yield event.contentBlockDelta.delta.text || '';
                }
            }
        }
        catch (error) {
            if (error instanceof BedrockError) {
                throw error;
            }
            const err = error;
            throw new BedrockError(err.message || 'Failed to stream from Bedrock model', err.code || err.name, err.statusCode || err.$metadata?.httpStatusCode, error);
        }
    }
    async invokeWithVision(systemPrompt, userPrompt, image, outputSchema, options = {}) {
        const retryConfig = {
            ...DEFAULT_RETRY_CONFIG,
            ...options.retryConfig,
        };
        let executionLogger;
        if (options.flowName && options.executionMetadata) {
            executionLogger = (0, execution_logger_1.createExecutionLogger)(options.flowName, this.modelId, options.executionMetadata);
        }
        return this.withRetry(async () => {
            try {
                const imageBytes = Buffer.from(image.data, 'base64');
                const input = {
                    modelId: this.modelId,
                    system: [{ text: systemPrompt }],
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    image: {
                                        format: image.format,
                                        source: {
                                            bytes: imageBytes,
                                        },
                                    },
                                },
                                {
                                    text: userPrompt,
                                },
                            ],
                        },
                    ],
                    inferenceConfig: {
                        temperature: options.temperature ?? 0.7,
                        maxTokens: options.maxTokens || 4096,
                        topP: options.topP ?? 1,
                    },
                };
                const command = new client_bedrock_runtime_1.ConverseCommand(input);
                const response = await this.client.send(command);
                if (!response.output) {
                    throw new BedrockError('Empty response from Bedrock');
                }
                const textResponse = this.extractTextFromResponse(response.output.message?.content);
                const parsedOutput = this.parseJSONResponse(textResponse);
                const validationResult = outputSchema.safeParse(parsedOutput);
                if (!validationResult.success) {
                    throw new BedrockParseError('Response does not match expected schema', parsedOutput, validationResult.error);
                }
                if (executionLogger) {
                    const tokenUsage = (0, execution_logger_1.extractTokenUsage)(response);
                    executionLogger.logSuccess(tokenUsage);
                }
                return validationResult.data;
            }
            catch (error) {
                if (executionLogger) {
                    const err = error;
                    executionLogger.logError(error instanceof Error ? error : new Error(String(error)), err.code || err.name, err.statusCode || err.$metadata?.httpStatusCode);
                }
                if (error instanceof BedrockError || error instanceof BedrockParseError) {
                    throw error;
                }
                const err = error;
                throw new BedrockError(err.message || 'Failed to invoke Bedrock model with vision', err.code || err.name, err.statusCode || err.$metadata?.httpStatusCode, error);
            }
        }, retryConfig, executionLogger);
    }
}
exports.BedrockClient = BedrockClient;
let bedrockClientInstance = null;
function getBedrockClient(modelId) {
    if (!bedrockClientInstance || modelId) {
        bedrockClientInstance = new BedrockClient(modelId);
    }
    return bedrockClientInstance;
}
function resetBedrockClient() {
    bedrockClientInstance = null;
}
