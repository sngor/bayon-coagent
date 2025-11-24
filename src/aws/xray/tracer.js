"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.METADATA_KEYS = exports.ANNOTATION_KEYS = exports.OPERATION_NAMES = exports.SERVICE_NAMES = exports.tracer = exports.DistributedTracer = void 0;
const config_1 = require("./config");
Object.defineProperty(exports, "SERVICE_NAMES", { enumerable: true, get: function () { return config_1.SERVICE_NAMES; } });
Object.defineProperty(exports, "OPERATION_NAMES", { enumerable: true, get: function () { return config_1.OPERATION_NAMES; } });
Object.defineProperty(exports, "ANNOTATION_KEYS", { enumerable: true, get: function () { return config_1.ANNOTATION_KEYS; } });
Object.defineProperty(exports, "METADATA_KEYS", { enumerable: true, get: function () { return config_1.METADATA_KEYS; } });
const logger_1 = require("@/aws/logging/logger");
let AWSXRay = null;
let Segment = null;
let Subsegment = null;
const xrayConfig = (0, config_1.getXRayConfig)();
class DistributedTracer {
    constructor() {
        this.initialized = false;
        this.enabled = xrayConfig.enabled && typeof window === 'undefined';
    }
    static getInstance() {
        if (!DistributedTracer.instance) {
            DistributedTracer.instance = new DistributedTracer();
        }
        return DistributedTracer.instance;
    }
    async initializeXRay() {
        if (this.initialized || !this.enabled)
            return;
        try {
            const xrayModule = await Promise.resolve().then(() => __importStar(require('aws-xray-sdk-core')));
            AWSXRay = xrayModule.default;
            Segment = xrayModule.Segment;
            Subsegment = xrayModule.Subsegment;
            AWSXRay.config([
                AWSXRay.plugins.EC2Plugin,
                AWSXRay.plugins.ECSPlugin,
                AWSXRay.plugins.ElasticBeanstalkPlugin,
            ]);
            AWSXRay.setContextMissingStrategy(xrayConfig.contextMissingStrategy);
            if (xrayConfig.daemonAddress) {
                AWSXRay.setDaemonAddress(xrayConfig.daemonAddress);
            }
            if (xrayConfig.captureAWS) {
                try {
                    const AWS = require('aws-sdk');
                    AWSXRay.captureAWS(AWS);
                }
                catch (error) {
                    console.warn('AWS SDK v2 not available for X-Ray capture, using SDK v3');
                }
            }
            if (xrayConfig.captureHTTP) {
                AWSXRay.captureHTTPs(require('https'));
                AWSXRay.captureHTTPs(require('http'));
            }
            if (xrayConfig.capturePromises) {
                AWSXRay.capturePromise();
            }
            this.initialized = true;
        }
        catch (error) {
            console.warn('Failed to initialize X-Ray SDK:', error);
            this.enabled = false;
        }
    }
    isEnabled() {
        return this.enabled;
    }
    async createSegment(name, traceId, parentId) {
        if (!this.enabled)
            return null;
        await this.initializeXRay();
        if (!AWSXRay)
            return null;
        try {
            const segment = new AWSXRay.Segment(name, traceId, parentId);
            segment.addAnnotation(config_1.ANNOTATION_KEYS.SERVICE_NAME, xrayConfig.serviceName);
            segment.addAnnotation(config_1.ANNOTATION_KEYS.AWS_REGION, process.env.AWS_REGION || 'us-east-1');
            return segment;
        }
        catch (error) {
            console.warn('Failed to create X-Ray segment:', error);
            return null;
        }
    }
    async createSubsegment(name, parent) {
        if (!this.enabled)
            return null;
        await this.initializeXRay();
        if (!AWSXRay)
            return null;
        try {
            const parentSegment = parent || AWSXRay.getSegment();
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
    async startTrace(operationName, options = {}) {
        if (!this.enabled)
            return null;
        await this.initializeXRay();
        if (!AWSXRay)
            return null;
        try {
            const serviceName = options.serviceName || xrayConfig.serviceName;
            const correlationId = (0, logger_1.generateCorrelationId)();
            const segment = await this.createSegment(`${serviceName}-${operationName}`);
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
            AWSXRay.setSegment(segment);
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
    async addAnnotation(key, value) {
        if (!this.enabled)
            return;
        await this.initializeXRay();
        if (!AWSXRay)
            return;
        try {
            const segment = AWSXRay.getSegment();
            if (segment) {
                segment.addAnnotation(key, value);
            }
        }
        catch (error) {
            console.warn('Failed to add X-Ray annotation:', error);
        }
    }
    async addMetadata(key, value, namespace) {
        if (!this.enabled)
            return;
        await this.initializeXRay();
        if (!AWSXRay)
            return;
        try {
            const segment = AWSXRay.getSegment();
            if (segment) {
                segment.addMetadata(key, value, namespace);
            }
        }
        catch (error) {
            console.warn('Failed to add X-Ray metadata:', error);
        }
    }
    async addError(error, remote = false) {
        if (!this.enabled)
            return;
        await this.initializeXRay();
        if (!AWSXRay)
            return;
        try {
            const segment = AWSXRay.getSegment();
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
    async closeSegment(error) {
        if (!this.enabled)
            return;
        await this.initializeXRay();
        if (!AWSXRay)
            return;
        try {
            const segment = AWSXRay.getSegment();
            if (segment) {
                if (error) {
                    await this.addError(error);
                }
                segment.close();
            }
        }
        catch (err) {
            console.warn('Failed to close X-Ray segment:', err);
        }
    }
    async traceAsync(operationName, fn, options = {}) {
        if (!this.enabled) {
            return fn();
        }
        const subsegment = await this.createSubsegment(operationName);
        try {
            const result = await fn();
            if (subsegment)
                subsegment.close();
            return result;
        }
        catch (error) {
            if (subsegment) {
                subsegment.addError(error);
                subsegment.close();
            }
            throw error;
        }
    }
}
exports.DistributedTracer = DistributedTracer;
exports.tracer = DistributedTracer.getInstance();
