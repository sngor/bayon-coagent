"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.METADATA_KEYS = exports.ANNOTATION_KEYS = exports.OPERATION_NAMES = exports.SERVICE_NAMES = void 0;
exports.getXRayConfig = getXRayConfig;
const config_1 = require("@/aws/config");
function getXRayConfig() {
    const config = (0, config_1.getConfig)();
    const isLocal = config.environment === 'local';
    const isProd = config.environment === 'production';
    return {
        enabled: process.env.XRAY_TRACING_ENABLED !== 'false',
        serviceName: process.env.XRAY_SERVICE_NAME || 'bayon-coagent',
        samplingRate: parseFloat(process.env.XRAY_SAMPLING_RATE || (isProd ? '0.1' : '1.0')),
        captureAWS: process.env.XRAY_CAPTURE_AWS !== 'false',
        captureHTTP: process.env.XRAY_CAPTURE_HTTP !== 'false',
        capturePromises: process.env.XRAY_CAPTURE_PROMISES !== 'false',
        contextMissingStrategy: isLocal ? 'IGNORE_ERROR' : 'LOG_ERROR',
        plugins: [
            'EC2Plugin',
            'ECSPlugin',
            'ElasticBeanstalkPlugin',
        ],
        daemonAddress: isLocal ? 'localhost:2000' : undefined,
    };
}
exports.SERVICE_NAMES = {
    MAIN: 'bayon-coagent-main',
    AI_SERVICE: 'bayon-coagent-ai',
    INTEGRATION_SERVICE: 'bayon-coagent-integration',
    BACKGROUND_SERVICE: 'bayon-coagent-background',
    ADMIN_SERVICE: 'bayon-coagent-admin',
    NEXT_JS: 'bayon-coagent-nextjs',
};
exports.OPERATION_NAMES = {
    AUTHENTICATE: 'authenticate',
    GET_USER_PROFILE: 'get-user-profile',
    UPDATE_USER_PROFILE: 'update-user-profile',
    CREATE_CONTENT: 'create-content',
    GET_CONTENT: 'get-content',
    UPDATE_CONTENT: 'update-content',
    DELETE_CONTENT: 'delete-content',
    GENERATE_BLOG_POST: 'generate-blog-post',
    GENERATE_SOCIAL_POST: 'generate-social-post',
    GENERATE_DESCRIPTION: 'generate-description',
    REIMAGINE_IMAGE: 'reimagine-image',
    GET_MARKET_INSIGHTS: 'get-market-insights',
    ANALYZE_TRENDS: 'analyze-trends',
    CALCULATE_VALUATION: 'calculate-valuation',
    OAUTH_CALLBACK: 'oauth-callback',
    SYNC_MLS_DATA: 'sync-mls-data',
    PUBLISH_SOCIAL_MEDIA: 'publish-social-media',
    PROCESS_NOTIFICATIONS: 'process-notifications',
    CALCULATE_OPTIMAL_TIMES: 'calculate-optimal-times',
    SYNC_ANALYTICS: 'sync-analytics',
    MANAGE_USERS: 'manage-users',
    SYSTEM_HEALTH_CHECK: 'system-health-check',
    AUDIT_LOGS: 'audit-logs',
};
exports.ANNOTATION_KEYS = {
    SERVICE_NAME: 'service.name',
    OPERATION_NAME: 'operation.name',
    USER_ID: 'user.id',
    REQUEST_ID: 'request.id',
    TRACE_ID: 'trace.id',
    SPAN_ID: 'span.id',
    ERROR: 'error',
    ERROR_MESSAGE: 'error.message',
    HTTP_METHOD: 'http.method',
    HTTP_URL: 'http.url',
    HTTP_STATUS_CODE: 'http.status_code',
    AWS_REGION: 'aws.region',
    AWS_SERVICE: 'aws.service',
};
exports.METADATA_KEYS = {
    REQUEST_BODY: 'request.body',
    RESPONSE_BODY: 'response.body',
    EXECUTION_TIME: 'execution.time',
    MEMORY_USAGE: 'memory.usage',
    COLD_START: 'lambda.cold_start',
    FUNCTION_NAME: 'lambda.function_name',
    FUNCTION_VERSION: 'lambda.function_version',
    API_GATEWAY_REQUEST_ID: 'apigateway.request_id',
    CORRELATION_ID: 'correlation.id',
};
