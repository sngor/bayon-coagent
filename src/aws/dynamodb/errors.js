"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ThroughputExceededError = exports.ConditionalCheckFailedError = exports.ItemNotFoundError = exports.DynamoDBError = void 0;
exports.isRetryableError = isRetryableError;
exports.wrapDynamoDBError = wrapDynamoDBError;
class DynamoDBError extends Error {
    constructor(message, code, statusCode, retryable = false, originalError) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.retryable = retryable;
        this.originalError = originalError;
        this.name = 'DynamoDBError';
    }
}
exports.DynamoDBError = DynamoDBError;
class ItemNotFoundError extends DynamoDBError {
    constructor(pk, sk) {
        super(`Item not found: PK=${pk}, SK=${sk}`, 'ItemNotFound', 404, false);
        this.name = 'ItemNotFoundError';
    }
}
exports.ItemNotFoundError = ItemNotFoundError;
class ConditionalCheckFailedError extends DynamoDBError {
    constructor(message = 'Conditional check failed') {
        super(message, 'ConditionalCheckFailedException', 400, false);
        this.name = 'ConditionalCheckFailedError';
    }
}
exports.ConditionalCheckFailedError = ConditionalCheckFailedError;
class ThroughputExceededError extends DynamoDBError {
    constructor(message = 'Throughput exceeded') {
        super(message, 'ProvisionedThroughputExceededException', 400, true);
        this.name = 'ThroughputExceededError';
    }
}
exports.ThroughputExceededError = ThroughputExceededError;
class ValidationError extends DynamoDBError {
    constructor(message) {
        super(message, 'ValidationException', 400, false);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
function isRetryableError(error) {
    if (error instanceof DynamoDBError) {
        return error.retryable;
    }
    const retryableCodes = [
        'ProvisionedThroughputExceededException',
        'ThrottlingException',
        'RequestLimitExceeded',
        'InternalServerError',
        'ServiceUnavailable',
    ];
    return retryableCodes.includes(error.name || error.code);
}
function wrapDynamoDBError(error) {
    const errorName = error.name || error.code;
    const errorMessage = error.message || 'Unknown DynamoDB error';
    switch (errorName) {
        case 'ConditionalCheckFailedException':
            return new ConditionalCheckFailedError(errorMessage);
        case 'ProvisionedThroughputExceededException':
        case 'ThrottlingException':
            return new ThroughputExceededError(errorMessage);
        case 'ValidationException':
            return new ValidationError(errorMessage);
        case 'ResourceNotFoundException':
            return new DynamoDBError(errorMessage, errorName, 404, false, error);
        default:
            const retryable = isRetryableError(error);
            return new DynamoDBError(errorMessage, errorName, error.$metadata?.httpStatusCode, retryable, error);
    }
}
