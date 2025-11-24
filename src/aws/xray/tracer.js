"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.METADATA_KEYS = exports.ANNOTATION_KEYS = exports.OPERATION_NAMES = exports.SERVICE_NAMES = exports.AWSXRay = exports.tracer = exports.DistributedTracer = void 0;
const aws_xray_sdk_core_1 = __importDefault(require("aws-xray-sdk-core"));
exports.AWSXRay = aws_xray_sdk_core_1.default;
const config_1 = require("./config");
Object.defineProperty(exports, "SERVICE_NAMES", { enumerable: true, get: function () { return config_1.SERVICE_NAMES; } });
Object.defineProperty(exports, "OPERATION_NAMES", { enumerable: true, get: function () { return config_1.OPERATION_NAMES; } });
Object.defineProperty(exports, "ANNOTATION_KEYS", { enumerable: true, get: function () { return config_1.ANNOTATION_KEYS; } });
Object.defineProperty(exports, "METADATA_KEYS", { enumerable: true, get: function () { return config_1.METADATA_KEYS; } });
const logger_1 = require("@/aws/logging/logger");
const xrayConfig = (0, config_1.getXRayConfig)();
if (xrayConfig.enabled) {
    aws_xray_sdk_core_1.default.config([
        aws_xray_sdk_core_1.default.plugins.EC2Plugin,
        aws_xray_sdk_core_1.default.plugins.ECSPlugin,
        aws_xray_sdk_core_1.default.plugins.ElasticBeanstalkPlugin,
    ]);
    aws_xray_sdk_core_1.default.setContextMissingStrategy(xrayConfig.contextMissingStrategy);
    if (xrayConfig.daemonAddress) {
        aws_xray_sdk_core_1.default.setDaemonAddress(xrayConfig.daemonAddress);
    }
    if (xrayConfig.captureAWS) {
        try {
            const AWS = require('aws-sdk');
            aws_xray_sdk_core_1.default.captureAWS(AWS);
        }
        catch (error) {
            console.warn('AWS SDK v2 not available for X-Ray capture, using SDK v3');
        }
    }
    if (xrayConfig.captureHTTP) {
        aws_xray_sdk_core_1.default.captureHTTPs(require('https'));
        aws_xray_sdk_core_1.default.captureHTTPs(require('http'));
    }
    if (xrayConfig.capturePromises) {
        aws_xray_sdk_core_1.default.capturePromise();
    }
}
class DistributedTracer {
    constructor() {
        this.enabled = xrayConfig.enabled;
    }
    static getInstance() {
        if (!DistributedTracer.instance) {
            DistributedTracer.instance = new DistributedTracer();
        }
        return DistributedTracer.instance;
    }
    isEnabled() {
        return this.enabled;
    }
    createSegment(name, traceId, parentId) {
        if (!this.enabled)
            return null;
        try {
            const segment = new aws_xray_sdk_core_1.default.Segment(name, traceId, parentId);
            segment.addAnnotation(config_1.ANNOTATION_KEYS.SERVICE_NAME, xrayConfig.serviceName);
            segment.addAnnotation(config_1.ANNOTATION_KEYS.AWS_REGION, process.env.AWS_REGION || 'us-east-1');
            return segment;
        }
        catch (error) {
            console.warn('Failed to create X-Ray segment:', error);
            return null;
        }
    }
    createSubsegment(name, parent) {
        if (!this.enabled)
            return null;
        try {
            const parentSegment = parent || aws_xray_sdk_core_1.default.getSegment();
            if (!parentSegment) {
                console.warn('No parent segment available for subsegment:', name);
                return null;
            }
            const subsegment = parentSegment.addNewSubsegment(name);
            return subsegment;
        }
        catch (error) {
            console.warn('Failed to create X-Ray subsegment:', error);
            return null;
        }
    }
    startTrace(operationName, options = {}) {
        if (!this.enabled)
            return null;
        try {
            const serviceName = options.serviceName || xrayConfig.serviceName;
            const correlationId = (0, logger_1.generateCorrelationId)();
            const segment = this.createSegment(`${serviceName}-${operationName}`);
            if (!segment)
                return null;
            segment.addAnnotation(config_1.ANNOTATION_KEYS.OPERATION_NAME, operationName);
            segment.addAnnotation(config_1.ANNOTATION_KEYS.SERVICE_NAME, serviceName);
            if (options.userId) {
                segment.addAnnotation(config_1.ANNOTATION_KEYS.USER_ID, options.userId);
            }
            if (options.requestId) {
                segment.addAnnotation(config_1.ANNOTATION_KEYS.REQUEST_ID, options.requestId);
            }
            segment.addMetadata(config_1.METADATA_KEYS.CORRELATION_ID, correlationId);
            if (options.metadata) {
                Object.entries(options.metadata).forEach(([key, value]) => {
                    segment.addMetadata(key, value);
                });
            }
            if (options.annotations) {
                Object.entries(options.annotations).forEach(([key, value]) => {
                    segment.addAnnotation(key, value);
                });
            }
            aws_xray_sdk_core_1.default.setSegment(segment);
            return {
                traceId: segment.trace_id,
                segmentId: segment.id,
                correlationId,
                serviceName,
                operationName,
                userId: options.userId,
                requestId: options.requestId,
            };
        }
        catch (error) {
            console.warn('Failed to start X-Ray trace:', error);
            return null;
        }
    }
    startSubsegment(operationName, options = {}) {
        if (!this.enabled)
            return null;
        try {
            const subsegment = this.createSubsegment(operationName);
            if (!subsegment)
                return null;
            subsegment.addAnnotation(config_1.ANNOTATION_KEYS.OPERATION_NAME, operationName);
            if (options.serviceName) {
                subsegment.addAnnotation(config_1.ANNOTATION_KEYS.SERVICE_NAME, options.serviceName);
            }
            if (options.userId) {
                subsegment.addAnnotation(config_1.ANNOTATION_KEYS.USER_ID, options.userId);
            }
            if (options.requestId) {
                subsegment.addAnnotation(config_1.ANNOTATION_KEYS.REQUEST_ID, options.requestId);
            }
            if (options.metadata) {
                Object.entries(options.metadata).forEach(([key, value]) => {
                    subsegment.addMetadata(key, value);
                });
            }
            if (options.annotations) {
                Object.entries(options.annotations).forEach(([key, value]) => {
                    subsegment.addAnnotation(key, value);
                });
            }
            return subsegment;
        }
        catch (error) {
            console.warn('Failed to start X-Ray subsegment:', error);
            return null;
        }
    }
    addAnnotation(key, value) {
        if (!this.enabled)
            return;
        try {
            const segment = aws_xray_sdk_core_1.default.getSegment();
            if (segment) {
                segment.addAnnotation(key, value);
            }
        }
        catch (error) {
            console.warn('Failed to add X-Ray annotation:', error);
        }
    }
    addMetadata(key, value, namespace) {
        if (!this.enabled)
            return;
        try {
            const segment = aws_xray_sdk_core_1.default.getSegment();
            if (segment) {
                segment.addMetadata(key, value, namespace);
            }
        }
        catch (error) {
            console.warn('Failed to add X-Ray metadata:', error);
        }
    }
    addError(error, remote = false) {
        if (!this.enabled)
            return;
        try {
            const segment = aws_xray_sdk_core_1.default.getSegment();
            if (segment) {
                if (typeof error === 'string') {
                    segment.addError(new Error(error), remote);
                }
                else {
                    segment.addError(error, remote);
                }
                segment.addAnnotation(config_1.ANNOTATION_KEYS.ERROR, true);
                segment.addAnnotation(config_1.ANNOTATION_KEYS.ERROR_MESSAGE, typeof error === 'string' ? error : error.message);
            }
        }
        catch (err) {
            console.warn('Failed to add X-Ray error:', err);
        }
    }
    closeSegment(error) {
        if (!this.enabled)
            return;
        try {
            const segment = aws_xray_sdk_core_1.default.getSegment();
            if (segment) {
                if (error) {
                    this.addError(error);
                }
                segment.close();
            }
        }
        catch (err) {
            console.warn('Failed to close X-Ray segment:', err);
        }
    }
    closeSubsegment(subsegment, error) {
        if (!this.enabled || !subsegment)
            return;
        try {
            if (error) {
                subsegment.addError(error);
                subsegment.addAnnotation(config_1.ANNOTATION_KEYS.ERROR, true);
                subsegment.addAnnotation(config_1.ANNOTATION_KEYS.ERROR_MESSAGE, error.message);
            }
            subsegment.close();
        }
        catch (err) {
            console.warn('Failed to close X-Ray subsegment:', err);
        }
    }
    getCurrentTraceContext() {
        if (!this.enabled)
            return null;
        try {
            const segment = aws_xray_sdk_core_1.default.getSegment();
            if (!segment)
                return null;
            return {
                traceId: segment.trace_id,
                segmentId: segment.id,
                parentId: segment.parent_id,
                correlationId: segment.metadata?.default?.[config_1.METADATA_KEYS.CORRELATION_ID] || (0, logger_1.generateCorrelationId)(),
                serviceName: segment.annotations?.[config_1.ANNOTATION_KEYS.SERVICE_NAME] || xrayConfig.serviceName,
                operationName: segment.annotations?.[config_1.ANNOTATION_KEYS.OPERATION_NAME] || 'unknown',
                userId: segment.annotations?.[config_1.ANNOTATION_KEYS.USER_ID],
                requestId: segment.annotations?.[config_1.ANNOTATION_KEYS.REQUEST_ID],
            };
        }
        catch (error) {
            console.warn('Failed to get X-Ray trace context:', error);
            return null;
        }
    }
    getTraceHeader() {
        if (!this.enabled)
            return null;
        try {
            const segment = aws_xray_sdk_core_1.default.getSegment();
            if (!segment)
                return null;
            return `Root=${segment.trace_id};Parent=${segment.id};Sampled=1`;
        }
        catch (error) {
            console.warn('Failed to get X-Ray trace header:', error);
            return null;
        }
    }
    parseTraceHeader(traceHeader) {
        if (!this.enabled || !traceHeader)
            return null;
        try {
            const parts = traceHeader.split(';');
            const result = {};
            parts.forEach(part => {
                const [key, value] = part.split('=');
                switch (key) {
                    case 'Root':
                        result.traceId = value;
                        break;
                    case 'Parent':
                        result.parentId = value;
                        break;
                    case 'Sampled':
                        result.sampled = value === '1';
                        break;
                }
            });
            return result;
        }
        catch (error) {
            console.warn('Failed to parse X-Ray trace header:', error);
            return null;
        }
    }
    async traceAsync(operationName, fn, options = {}) {
        if (!this.enabled) {
            return fn();
        }
        const subsegment = this.startSubsegment(operationName, options);
        try {
            const result = await fn();
            this.closeSubsegment(subsegment);
            return result;
        }
        catch (error) {
            this.closeSubsegment(subsegment, error);
            throw error;
        }
    }
    trace(operationName, fn, options = {}) {
        if (!this.enabled) {
            return fn();
        }
        const subsegment = this.startSubsegment(operationName, options);
        try {
            const result = fn();
            this.closeSubsegment(subsegment);
            return result;
        }
        catch (error) {
            this.closeSubsegment(subsegment, error);
            throw error;
        }
    }
}
exports.DistributedTracer = DistributedTracer;
exports.tracer = DistributedTracer.getInstance();
