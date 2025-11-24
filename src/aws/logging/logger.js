"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
exports.generateCorrelationId = generateCorrelationId;
exports.createLogger = createLogger;
exports.withCorrelationId = withCorrelationId;
const config_1 = require("../config");
class Logger {
    constructor(defaultContext = {}) {
        this.environment = (0, config_1.getConfig)().environment;
        this.defaultContext = defaultContext;
    }
    shouldLog(level) {
        const levelPriority = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
        };
        const minLevel = {
            local: 'DEBUG',
            development: 'INFO',
            production: 'INFO',
        };
        return levelPriority[level] >= levelPriority[minLevel[this.environment]];
    }
    createLogEntry(level, message, context, error) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: { ...this.defaultContext, ...context },
            environment: this.environment,
        };
        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code,
            };
        }
        return entry;
    }
    output(entry) {
        if (!this.shouldLog(entry.level)) {
            return;
        }
        if (this.environment === 'local') {
            this.outputToConsole(entry);
        }
        else {
            this.outputToCloudWatch(entry);
        }
    }
    outputToConsole(entry) {
        const colors = {
            DEBUG: '\x1b[36m',
            INFO: '\x1b[32m',
            WARN: '\x1b[33m',
            ERROR: '\x1b[31m',
        };
        const reset = '\x1b[0m';
        const color = colors[entry.level];
        const prefix = `${color}[${entry.level}]${reset} ${entry.timestamp}`;
        console.log(`${prefix} ${entry.message}`);
        if (entry.context && Object.keys(entry.context).length > 0) {
            console.log('  Context:', JSON.stringify(entry.context, null, 2));
        }
        if (entry.error) {
            console.error('  Error:', entry.error.name, '-', entry.error.message);
            if (entry.error.stack) {
                console.error('  Stack:', entry.error.stack);
            }
        }
    }
    outputToCloudWatch(entry) {
        console.log(JSON.stringify(entry));
    }
    debug(message, context) {
        this.output(this.createLogEntry('DEBUG', message, context));
    }
    info(message, context) {
        this.output(this.createLogEntry('INFO', message, context));
    }
    warn(message, context) {
        this.output(this.createLogEntry('WARN', message, context));
    }
    error(message, error, context) {
        this.output(this.createLogEntry('ERROR', message, context, error));
    }
    child(additionalContext) {
        return new Logger({ ...this.defaultContext, ...additionalContext });
    }
    startOperation(operation, context) {
        const startTime = Date.now();
        this.debug(`Starting operation: ${operation}`, context);
        return () => {
            const duration = Date.now() - startTime;
            this.debug(`Completed operation: ${operation}`, {
                ...context,
                duration,
            });
        };
    }
}
exports.Logger = Logger;
function generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function createLogger(defaultContext) {
    return new Logger(defaultContext);
}
exports.logger = createLogger();
function withCorrelationId(fn, service) {
    return ((...args) => {
        const correlationId = generateCorrelationId();
        const contextLogger = exports.logger.child({ correlationId, service });
        try {
            const result = fn(...args);
            if (result instanceof Promise) {
                return result.catch((error) => {
                    contextLogger.error(`Error in ${service}`, error, {
                        operation: fn.name,
                    });
                    throw error;
                });
            }
            return result;
        }
        catch (error) {
            contextLogger.error(`Error in ${service}`, error, {
                operation: fn.name,
            });
            throw error;
        }
    });
}
