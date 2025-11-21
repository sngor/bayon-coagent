"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
exports.withBatchRetry = withBatchRetry;
const errors_1 = require("./errors");
const DEFAULT_RETRY_OPTIONS = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitter: true,
};
function calculateDelay(attempt, options) {
    const exponentialDelay = Math.min(options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt), options.maxDelayMs);
    if (options.jitter) {
        const jitterRange = exponentialDelay * 0.25;
        const jitter = Math.random() * jitterRange * 2 - jitterRange;
        return Math.max(0, exponentialDelay + jitter);
    }
    return exponentialDelay;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withRetry(fn, options = {}) {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === config.maxRetries) {
                break;
            }
            if (!(0, errors_1.isRetryableError)(error)) {
                throw error;
            }
            const delay = calculateDelay(attempt, config);
            if (process.env.NODE_ENV !== 'test') {
                console.warn(`DynamoDB operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}). ` +
                    `Retrying in ${Math.round(delay)}ms...`, { error: error.message, code: error.code || error.name });
            }
            await sleep(delay);
        }
    }
    throw lastError;
}
async function withBatchRetry(fn, getUnprocessed, items, options = {}, mergeResults) {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let currentItems = items;
    let accumulatedResult;
    let attempt = 0;
    while (attempt <= config.maxRetries) {
        try {
            const result = await fn(currentItems);
            if (accumulatedResult && mergeResults) {
                accumulatedResult = mergeResults(accumulatedResult, result);
            }
            else {
                accumulatedResult = result;
            }
            const unprocessed = getUnprocessed(result);
            if (!unprocessed || unprocessed.length === 0) {
                return accumulatedResult;
            }
            if (attempt === config.maxRetries) {
                return accumulatedResult;
            }
            currentItems = unprocessed;
            const delay = calculateDelay(attempt, config);
            if (process.env.NODE_ENV !== 'test') {
                console.warn(`Batch operation has ${unprocessed.length} unprocessed items. ` +
                    `Retrying in ${Math.round(delay)}ms...`);
            }
            await sleep(delay);
            attempt++;
        }
        catch (error) {
            if (attempt === config.maxRetries || !(0, errors_1.isRetryableError)(error)) {
                throw error;
            }
            const delay = calculateDelay(attempt, config);
            if (process.env.NODE_ENV !== 'test') {
                console.warn(`Batch operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}). ` +
                    `Retrying in ${Math.round(delay)}ms...`, { error: error.message, code: error.code || error.name });
            }
            await sleep(delay);
            attempt++;
        }
    }
    return accumulatedResult;
}
