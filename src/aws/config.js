"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_BEDROCK_MODELS = void 0;
exports.getAWSConfig = getAWSConfig;
exports.getAWSCredentials = getAWSCredentials;
exports.isValidBedrockModel = isValidBedrockModel;
exports.validateConfig = validateConfig;
exports.getConfig = getConfig;
exports.resetConfig = resetConfig;
exports.VALID_BEDROCK_MODELS = [
    'us.anthropic.claude-3-haiku-20240307-v1:0',
    'us.anthropic.claude-3-sonnet-20240229-v1:0',
    'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
    'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    'us.anthropic.claude-3-opus-20240229-v1:0',
];
function isLocalEnvironment() {
    return (process.env.NODE_ENV === 'development' &&
        process.env.USE_LOCAL_AWS === 'true');
}
function getEnvironment() {
    if (isLocalEnvironment()) {
        return 'local';
    }
    if (process.env.NODE_ENV === 'production') {
        return 'production';
    }
    return 'development';
}
function getAWSConfig() {
    const environment = getEnvironment();
    const isLocal = environment === 'local';
    const region = process.env.AWS_REGION || 'us-east-1';
    return {
        region,
        environment,
        cognito: {
            userPoolId: process.env.COGNITO_USER_POOL_ID || '',
            clientId: process.env.COGNITO_CLIENT_ID || '',
            endpoint: isLocal ? 'http://localhost:4566' : undefined,
        },
        dynamodb: {
            tableName: process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent',
            endpoint: isLocal ? 'http://localhost:4566' : undefined,
        },
        s3: {
            bucketName: process.env.S3_BUCKET_NAME || 'bayon-coagent-storage',
            endpoint: isLocal ? 'http://localhost:4566' : undefined,
        },
        bedrock: {
            modelId: process.env.BEDROCK_MODEL_ID ||
                'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
            region: process.env.BEDROCK_REGION || region,
            endpoint: undefined,
        },
    };
}
function getAWSCredentials() {
    const environment = getEnvironment();
    if (environment === 'local') {
        return {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
        };
    }
    return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
}
function isValidBedrockModel(modelId) {
    return exports.VALID_BEDROCK_MODELS.includes(modelId);
}
function validateConfig() {
    const errors = [];
    const config = getAWSConfig();
    if (!config.cognito.userPoolId) {
        errors.push('COGNITO_USER_POOL_ID is not set');
    }
    if (!config.cognito.clientId) {
        errors.push('COGNITO_CLIENT_ID is not set');
    }
    if (!config.dynamodb.tableName) {
        errors.push('DYNAMODB_TABLE_NAME is not set');
    }
    if (!config.s3.bucketName) {
        errors.push('S3_BUCKET_NAME is not set');
    }
    if (!config.bedrock.modelId) {
        errors.push('BEDROCK_MODEL_ID is not set');
    }
    else if (!isValidBedrockModel(config.bedrock.modelId)) {
        errors.push(`BEDROCK_MODEL_ID "${config.bedrock.modelId}" is not a valid model. ` +
            `Valid models: ${exports.VALID_BEDROCK_MODELS.join(', ')}`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
let cachedConfig = null;
function getConfig() {
    if (!cachedConfig) {
        cachedConfig = getAWSConfig();
    }
    return cachedConfig;
}
function resetConfig() {
    cachedConfig = null;
}
