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
exports.DynamoDBRepository = void 0;
exports.getRepository = getRepository;
exports.resetRepository = resetRepository;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_1 = require("./client");
const errors_1 = require("./errors");
const retry_1 = require("./retry");
class DynamoDBRepository {
    constructor(retryOptions = {}) {
        this.tableName = (0, client_1.getTableName)();
        this.retryOptions = retryOptions;
    }
    async get(pk, sk) {
        try {
            return await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                const command = new lib_dynamodb_1.GetCommand({
                    TableName: this.tableName,
                    Key: { PK: pk, SK: sk },
                });
                const response = await client.send(command);
                if (!response.Item) {
                    return null;
                }
                const item = response.Item;
                return item.Data;
            }, this.retryOptions);
        }
        catch (error) {
            const wrappedError = (0, errors_1.wrapDynamoDBError)(error);
            if (typeof window !== 'undefined' && wrappedError.message.includes('Credential is missing')) {
                console.warn('DynamoDB operation skipped: credentials not configured for browser');
                return null;
            }
            throw wrappedError;
        }
    }
    async getItem(pk, sk) {
        try {
            return await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                const command = new lib_dynamodb_1.GetCommand({
                    TableName: this.tableName,
                    Key: { PK: pk, SK: sk },
                });
                const response = await client.send(command);
                if (!response.Item) {
                    return null;
                }
                return response.Item;
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async query(pk, skPrefix, options = {}) {
        try {
            return await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                let keyConditionExpression = 'PK = :pk';
                const expressionAttributeValues = {
                    ':pk': pk,
                };
                if (skPrefix) {
                    keyConditionExpression += ' AND begins_with(SK, :skPrefix)';
                    expressionAttributeValues[':skPrefix'] = skPrefix;
                }
                const command = new lib_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: keyConditionExpression,
                    ExpressionAttributeValues: {
                        ...expressionAttributeValues,
                        ...options.expressionAttributeValues,
                    },
                    ExpressionAttributeNames: options.expressionAttributeNames,
                    FilterExpression: options.filterExpression,
                    Limit: options.limit,
                    ExclusiveStartKey: options.exclusiveStartKey,
                    ScanIndexForward: options.scanIndexForward ?? true,
                });
                const response = await client.send(command);
                const items = (response.Items || []);
                const data = items.map((item) => item.Data);
                return {
                    items: data,
                    lastEvaluatedKey: response.LastEvaluatedKey,
                    count: response.Count || 0,
                };
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async queryItems(pk, skPrefix, options = {}) {
        try {
            return await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                let keyConditionExpression = 'PK = :pk';
                const expressionAttributeValues = {
                    ':pk': pk,
                };
                if (skPrefix) {
                    keyConditionExpression += ' AND begins_with(SK, :skPrefix)';
                    expressionAttributeValues[':skPrefix'] = skPrefix;
                }
                const command = new lib_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: keyConditionExpression,
                    ExpressionAttributeValues: {
                        ...expressionAttributeValues,
                        ...options.expressionAttributeValues,
                    },
                    ExpressionAttributeNames: options.expressionAttributeNames,
                    FilterExpression: options.filterExpression,
                    Limit: options.limit,
                    ExclusiveStartKey: options.exclusiveStartKey,
                    ScanIndexForward: options.scanIndexForward ?? true,
                });
                const response = await client.send(command);
                return {
                    items: (response.Items || []),
                    lastEvaluatedKey: response.LastEvaluatedKey,
                    count: response.Count || 0,
                };
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async put(item) {
        try {
            await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                const command = new lib_dynamodb_1.PutCommand({
                    TableName: this.tableName,
                    Item: item,
                });
                await client.send(command);
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async create(pk, sk, entityType, data, gsi) {
        const now = Date.now();
        const item = {
            PK: pk,
            SK: sk,
            EntityType: entityType,
            Data: data,
            CreatedAt: now,
            UpdatedAt: now,
            ...gsi,
        };
        await this.put(item);
        return item;
    }
    async update(pk, sk, updates, options = {}) {
        try {
            await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                const updateExpressions = [];
                const expressionAttributeNames = {
                    ...options.expressionAttributeNames,
                };
                const expressionAttributeValues = {
                    ...options.expressionAttributeValues,
                    ':updatedAt': Date.now(),
                };
                updateExpressions.push('#updatedAt = :updatedAt');
                expressionAttributeNames['#updatedAt'] = 'UpdatedAt';
                Object.entries(updates).forEach(([key, value], index) => {
                    const attrName = `#data_${index}`;
                    const attrValue = `:data_${index}`;
                    updateExpressions.push(`#data.${attrName} = ${attrValue}`);
                    expressionAttributeNames['#data'] = 'Data';
                    expressionAttributeNames[attrName] = key;
                    expressionAttributeValues[attrValue] = value;
                });
                const command = new lib_dynamodb_1.UpdateCommand({
                    TableName: this.tableName,
                    Key: { PK: pk, SK: sk },
                    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
                    ExpressionAttributeNames: expressionAttributeNames,
                    ExpressionAttributeValues: expressionAttributeValues,
                    ConditionExpression: options.conditionExpression,
                });
                await client.send(command);
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async delete(pk, sk) {
        try {
            await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                const command = new lib_dynamodb_1.DeleteCommand({
                    TableName: this.tableName,
                    Key: { PK: pk, SK: sk },
                });
                await client.send(command);
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async batchGet(keys) {
        try {
            if (keys.length === 0) {
                return { items: [] };
            }
            const batchSize = 100;
            const batches = [];
            for (let i = 0; i < keys.length; i += batchSize) {
                batches.push(keys.slice(i, i + batchSize));
            }
            const allItems = [];
            const allUnprocessedKeys = [];
            for (const batch of batches) {
                const result = await (0, retry_1.withBatchRetry)(async (keysToGet) => {
                    const client = (0, client_1.getDocumentClient)();
                    const command = new lib_dynamodb_1.BatchGetCommand({
                        RequestItems: {
                            [this.tableName]: {
                                Keys: keysToGet,
                            },
                        },
                    });
                    const response = await client.send(command);
                    const items = [];
                    if (response.Responses?.[this.tableName]) {
                        const dynamoItems = response.Responses[this.tableName];
                        items.push(...dynamoItems.map((item) => item.Data));
                    }
                    const unprocessedKeys = [];
                    if (response.UnprocessedKeys?.[this.tableName]?.Keys) {
                        unprocessedKeys.push(...response.UnprocessedKeys[this.tableName].Keys);
                    }
                    return {
                        items,
                        unprocessedKeys: unprocessedKeys.length > 0 ? unprocessedKeys : undefined,
                    };
                }, (result) => result.unprocessedKeys, batch, this.retryOptions, (accumulated, newResult) => ({
                    items: [...accumulated.items, ...newResult.items],
                    unprocessedKeys: newResult.unprocessedKeys,
                }));
                allItems.push(...result.items);
                if (result.unprocessedKeys) {
                    allUnprocessedKeys.push(...result.unprocessedKeys);
                }
            }
            return {
                items: allItems,
                unprocessedKeys: allUnprocessedKeys.length > 0 ? allUnprocessedKeys : undefined,
            };
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async batchWrite(puts = [], deletes = []) {
        try {
            if (puts.length === 0 && deletes.length === 0) {
                return;
            }
            const batchSize = 25;
            const allRequests = [
                ...puts.map((item) => ({ PutRequest: { Item: item } })),
                ...deletes.map((key) => ({ DeleteRequest: { Key: key } })),
            ];
            for (let i = 0; i < allRequests.length; i += batchSize) {
                const batch = allRequests.slice(i, i + batchSize);
                await (0, retry_1.withBatchRetry)(async (requests) => {
                    const client = (0, client_1.getDocumentClient)();
                    const command = new lib_dynamodb_1.BatchWriteCommand({
                        RequestItems: {
                            [this.tableName]: requests,
                        },
                    });
                    const response = await client.send(command);
                    const unprocessedItems = [];
                    if (response.UnprocessedItems?.[this.tableName]) {
                        unprocessedItems.push(...response.UnprocessedItems[this.tableName]);
                    }
                    return {
                        unprocessedItems: unprocessedItems.length > 0 ? unprocessedItems : undefined,
                    };
                }, (result) => result.unprocessedItems, batch, this.retryOptions);
            }
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async saveImageMetadata(userId, imageId, metadata) {
        const { getImageMetadataKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getImageMetadataKeys(userId, imageId);
        const item = {
            ...keys,
            EntityType: 'ImageMetadata',
            Data: {
                imageId,
                userId,
                ...metadata,
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        };
        await this.put(item);
    }
    async getImageMetadata(userId, imageId) {
        const { getImageMetadataKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getImageMetadataKeys(userId, imageId);
        return this.get(keys.PK, keys.SK);
    }
    async updateImageSuggestions(userId, imageId, suggestions) {
        const { getImageMetadataKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getImageMetadataKeys(userId, imageId);
        await this.update(keys.PK, keys.SK, { suggestions });
    }
    async saveEditRecord(userId, editId, record) {
        const { getEditRecordKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getEditRecordKeys(userId, editId);
        const item = {
            ...keys,
            EntityType: 'EditRecord',
            Data: {
                editId,
                userId,
                ...record,
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        };
        await this.put(item);
    }
    async getEditHistory(userId, limit = 50, exclusiveStartKey) {
        const pk = `USER#${userId}`;
        const skPrefix = 'EDIT#';
        return this.query(pk, skPrefix, {
            limit,
            exclusiveStartKey,
            scanIndexForward: false,
        });
    }
    async deleteEdit(userId, editId) {
        const { getEditRecordKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getEditRecordKeys(userId, editId);
        await this.delete(keys.PK, keys.SK);
    }
    async updateEditStatus(userId, editId, status, additionalUpdates) {
        const { getEditRecordKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getEditRecordKeys(userId, editId);
        const updates = { status, ...additionalUpdates };
        await this.update(keys.PK, keys.SK, updates);
    }
    async createListing(userId, listingId, listingData) {
        const { getListingKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingKeys(userId, listingId, listingData.mlsProvider, listingData.mlsNumber, listingData.status);
        return this.create(keys.PK, keys.SK, 'Listing', listingData, {
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
        });
    }
    async getListing(userId, listingId) {
        const { getListingKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingKeys(userId, listingId);
        return this.get(keys.PK, keys.SK);
    }
    async updateListing(userId, listingId, updates) {
        const { getListingKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingKeys(userId, listingId);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deleteListing(userId, listingId) {
        const { getListingKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingKeys(userId, listingId);
        await this.delete(keys.PK, keys.SK);
    }
    async queryListings(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'LISTING#';
        return this.query(pk, skPrefix, options);
    }
    async queryListingsByMLSNumber(mlsProvider, mlsNumber, options = {}) {
        try {
            return await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                const command = new lib_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :gsi1pk',
                    ExpressionAttributeValues: {
                        ':gsi1pk': `MLS#${mlsProvider}#${mlsNumber}`,
                        ...options.expressionAttributeValues,
                    },
                    ExpressionAttributeNames: options.expressionAttributeNames,
                    FilterExpression: options.filterExpression,
                    Limit: options.limit,
                    ExclusiveStartKey: options.exclusiveStartKey,
                    ScanIndexForward: options.scanIndexForward ?? true,
                });
                const response = await client.send(command);
                const items = (response.Items || []);
                const data = items.map((item) => item.Data);
                return {
                    items: data,
                    lastEvaluatedKey: response.LastEvaluatedKey,
                    count: response.Count || 0,
                };
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async queryListingsByStatus(mlsProvider, mlsNumber, status, options = {}) {
        try {
            return await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                const command = new lib_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
                    ExpressionAttributeValues: {
                        ':gsi1pk': `MLS#${mlsProvider}#${mlsNumber}`,
                        ':gsi1sk': `STATUS#${status}`,
                        ...options.expressionAttributeValues,
                    },
                    ExpressionAttributeNames: options.expressionAttributeNames,
                    FilterExpression: options.filterExpression,
                    Limit: options.limit,
                    ExclusiveStartKey: options.exclusiveStartKey,
                    ScanIndexForward: options.scanIndexForward ?? true,
                });
                const response = await client.send(command);
                const items = (response.Items || []);
                const data = items.map((item) => item.Data);
                return {
                    items: data,
                    lastEvaluatedKey: response.LastEvaluatedKey,
                    count: response.Count || 0,
                };
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async createMLSConnection(userId, connectionId, connectionData) {
        const { getMLSConnectionKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getMLSConnectionKeys(userId, connectionId);
        return this.create(keys.PK, keys.SK, 'MLSConnection', connectionData);
    }
    async getMLSConnection(userId, connectionId) {
        const { getMLSConnectionKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getMLSConnectionKeys(userId, connectionId);
        return this.get(keys.PK, keys.SK);
    }
    async updateMLSConnection(userId, connectionId, updates) {
        const { getMLSConnectionKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getMLSConnectionKeys(userId, connectionId);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deleteMLSConnection(userId, connectionId) {
        const { getMLSConnectionKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getMLSConnectionKeys(userId, connectionId);
        await this.delete(keys.PK, keys.SK);
    }
    async queryMLSConnections(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'MLS_CONNECTION#';
        return this.query(pk, skPrefix, options);
    }
    async createSocialConnection(userId, platform, connectionData) {
        const { getSocialConnectionKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getSocialConnectionKeys(userId, platform);
        return this.create(keys.PK, keys.SK, 'SocialConnection', connectionData);
    }
    async getSocialConnection(userId, platform) {
        const { getSocialConnectionKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getSocialConnectionKeys(userId, platform);
        return this.get(keys.PK, keys.SK);
    }
    async updateSocialConnection(userId, platform, updates) {
        const { getSocialConnectionKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getSocialConnectionKeys(userId, platform);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deleteSocialConnection(userId, platform) {
        const { getSocialConnectionKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getSocialConnectionKeys(userId, platform);
        await this.delete(keys.PK, keys.SK);
    }
    async querySocialConnections(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'SOCIAL#';
        return this.query(pk, skPrefix, options);
    }
    async createSocialPost(userId, postId, postData, listingId) {
        const { getSocialPostKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getSocialPostKeys(userId, postId, listingId);
        return this.create(keys.PK, keys.SK, 'SocialPost', postData, {
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
        });
    }
    async getSocialPost(userId, postId) {
        const { getSocialPostKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getSocialPostKeys(userId, postId);
        return this.get(keys.PK, keys.SK);
    }
    async updateSocialPost(userId, postId, updates) {
        const { getSocialPostKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getSocialPostKeys(userId, postId);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deleteSocialPost(userId, postId) {
        const { getSocialPostKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getSocialPostKeys(userId, postId);
        await this.delete(keys.PK, keys.SK);
    }
    async querySocialPosts(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'POST#';
        return this.query(pk, skPrefix, options);
    }
    async querySocialPostsByListing(listingId, options = {}) {
        try {
            return await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                const command = new lib_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :gsi1pk',
                    ExpressionAttributeValues: {
                        ':gsi1pk': `LISTING#${listingId}`,
                        ...options.expressionAttributeValues,
                    },
                    ExpressionAttributeNames: options.expressionAttributeNames,
                    FilterExpression: options.filterExpression,
                    Limit: options.limit,
                    ExclusiveStartKey: options.exclusiveStartKey,
                    ScanIndexForward: options.scanIndexForward ?? true,
                });
                const response = await client.send(command);
                const items = (response.Items || []);
                const data = items.map((item) => item.Data);
                return {
                    items: data,
                    lastEvaluatedKey: response.LastEvaluatedKey,
                    count: response.Count || 0,
                };
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async savePerformanceMetrics(userId, listingId, date, metricsData) {
        const { getPerformanceMetricsKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getPerformanceMetricsKeys(userId, listingId, date);
        return this.create(keys.PK, keys.SK, 'PerformanceMetrics', metricsData);
    }
    async getPerformanceMetrics(userId, listingId, date) {
        const { getPerformanceMetricsKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getPerformanceMetricsKeys(userId, listingId, date);
        return this.get(keys.PK, keys.SK);
    }
    async updatePerformanceMetrics(userId, listingId, date, updates) {
        const { getPerformanceMetricsKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getPerformanceMetricsKeys(userId, listingId, date);
        await this.update(keys.PK, keys.SK, updates);
    }
    async queryPerformanceMetrics(userId, listingId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = `METRICS#${listingId}#`;
        return this.query(pk, skPrefix, options);
    }
    async createAlert(userId, alertId, alertData) {
        const { getAlertKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const timestamp = new Date(alertData.createdAt).getTime().toString();
        const keys = getAlertKeys(userId, alertId, timestamp, alertData.type);
        return this.create(keys.PK, keys.SK, 'Alert', alertData, {
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
        });
    }
    async getAlert(userId, alertId, timestamp) {
        const { getAlertKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getAlertKeys(userId, alertId, timestamp);
        return this.get(keys.PK, keys.SK);
    }
    async updateAlert(userId, alertId, timestamp, updates) {
        const { getAlertKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getAlertKeys(userId, alertId, timestamp);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deleteAlert(userId, alertId, timestamp) {
        const { getAlertKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getAlertKeys(userId, alertId, timestamp);
        await this.delete(keys.PK, keys.SK);
    }
    async queryAlerts(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'ALERT#';
        return this.query(pk, skPrefix, {
            ...options,
            scanIndexForward: false,
        });
    }
    async queryAlertsByType(userId, alertType, options = {}) {
        try {
            return await (0, retry_1.withRetry)(async () => {
                const client = (0, client_1.getDocumentClient)();
                const command = new lib_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :gsi1pk',
                    ExpressionAttributeValues: {
                        ':gsi1pk': `ALERT#${userId}#${alertType}`,
                        ...options.expressionAttributeValues,
                    },
                    ExpressionAttributeNames: options.expressionAttributeNames,
                    FilterExpression: options.filterExpression,
                    Limit: options.limit,
                    ExclusiveStartKey: options.exclusiveStartKey,
                    ScanIndexForward: options.scanIndexForward ?? false,
                });
                const response = await client.send(command);
                const items = (response.Items || []);
                const data = items.map((item) => item.Data);
                return {
                    items: data,
                    lastEvaluatedKey: response.LastEvaluatedKey,
                    count: response.Count || 0,
                };
            }, this.retryOptions);
        }
        catch (error) {
            throw (0, errors_1.wrapDynamoDBError)(error);
        }
    }
    async saveAlertSettings(userId, settingsData) {
        const { getAlertSettingsKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getAlertSettingsKeys(userId);
        return this.create(keys.PK, keys.SK, 'AlertSettings', settingsData);
    }
    async getAlertSettings(userId) {
        const { getAlertSettingsKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getAlertSettingsKeys(userId);
        return this.get(keys.PK, keys.SK);
    }
    async updateAlertSettings(userId, updates) {
        const { getAlertSettingsKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getAlertSettingsKeys(userId);
        await this.update(keys.PK, keys.SK, updates);
    }
    async createNeighborhoodProfile(userId, profileId, profileData) {
        const { getNeighborhoodProfileKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getNeighborhoodProfileKeys(userId, profileId);
        return this.create(keys.PK, keys.SK, 'NeighborhoodProfile', profileData);
    }
    async getNeighborhoodProfile(userId, profileId) {
        const { getNeighborhoodProfileKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getNeighborhoodProfileKeys(userId, profileId);
        return this.get(keys.PK, keys.SK);
    }
    async updateNeighborhoodProfile(userId, profileId, updates) {
        const { getNeighborhoodProfileKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getNeighborhoodProfileKeys(userId, profileId);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deleteNeighborhoodProfile(userId, profileId) {
        const { getNeighborhoodProfileKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getNeighborhoodProfileKeys(userId, profileId);
        await this.delete(keys.PK, keys.SK);
    }
    async queryNeighborhoodProfiles(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'NEIGHBORHOOD#';
        return this.query(pk, skPrefix, options);
    }
    async createLifeEvent(userId, eventId, eventData) {
        const { getLifeEventKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getLifeEventKeys(userId, eventId);
        return this.create(keys.PK, keys.SK, 'LifeEvent', eventData);
    }
    async getLifeEvent(userId, eventId) {
        const { getLifeEventKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getLifeEventKeys(userId, eventId);
        return this.get(keys.PK, keys.SK);
    }
    async queryLifeEvents(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'LIFE_EVENT#';
        return this.query(pk, skPrefix, options);
    }
    async createProspect(userId, prospectId, prospectData) {
        const { getProspectKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getProspectKeys(userId, prospectId);
        return this.create(keys.PK, keys.SK, 'Prospect', prospectData);
    }
    async getProspect(userId, prospectId) {
        const { getProspectKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getProspectKeys(userId, prospectId);
        return this.get(keys.PK, keys.SK);
    }
    async updateProspect(userId, prospectId, updates) {
        const { getProspectKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getProspectKeys(userId, prospectId);
        await this.update(keys.PK, keys.SK, updates);
    }
    async queryProspects(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'PROSPECT#';
        return this.query(pk, skPrefix, options);
    }
    async createTrackedCompetitor(userId, competitorId, competitorData) {
        const { getTrackedCompetitorKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTrackedCompetitorKeys(userId, competitorId);
        return this.create(keys.PK, keys.SK, 'TrackedCompetitor', competitorData);
    }
    async getTrackedCompetitor(userId, competitorId) {
        const { getTrackedCompetitorKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTrackedCompetitorKeys(userId, competitorId);
        return this.get(keys.PK, keys.SK);
    }
    async updateTrackedCompetitor(userId, competitorId, updates) {
        const { getTrackedCompetitorKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTrackedCompetitorKeys(userId, competitorId);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deleteTrackedCompetitor(userId, competitorId) {
        const { getTrackedCompetitorKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTrackedCompetitorKeys(userId, competitorId);
        await this.delete(keys.PK, keys.SK);
    }
    async queryTrackedCompetitors(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'TRACKED_COMPETITOR#';
        return this.query(pk, skPrefix, options);
    }
    async createListingEvent(userId, eventId, eventData) {
        const { getListingEventKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingEventKeys(userId, eventId);
        return this.create(keys.PK, keys.SK, 'ListingEvent', eventData);
    }
    async getListingEvent(userId, eventId) {
        const { getListingEventKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingEventKeys(userId, eventId);
        return this.get(keys.PK, keys.SK);
    }
    async queryListingEvents(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'LISTING_EVENT#';
        return this.query(pk, skPrefix, options);
    }
    async saveTrendIndicators(userId, neighborhood, period, trendData) {
        const { getTrendIndicatorsKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTrendIndicatorsKeys(userId, neighborhood, period);
        return this.create(keys.PK, keys.SK, 'TrendIndicators', trendData);
    }
    async getTrendIndicators(userId, neighborhood, period) {
        const { getTrendIndicatorsKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTrendIndicatorsKeys(userId, neighborhood, period);
        return this.get(keys.PK, keys.SK);
    }
    async queryTrendIndicators(userId, neighborhood, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = `TREND#${neighborhood}#`;
        return this.query(pk, skPrefix, options);
    }
    async createTargetArea(userId, areaId, areaData) {
        const { getTargetAreaKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTargetAreaKeys(userId, areaId);
        return this.create(keys.PK, keys.SK, 'TargetArea', areaData);
    }
    async getTargetArea(userId, areaId) {
        const { getTargetAreaKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTargetAreaKeys(userId, areaId);
        return this.get(keys.PK, keys.SK);
    }
    async updateTargetArea(userId, areaId, updates) {
        const { getTargetAreaKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTargetAreaKeys(userId, areaId);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deleteTargetArea(userId, areaId) {
        const { getTargetAreaKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getTargetAreaKeys(userId, areaId);
        await this.delete(keys.PK, keys.SK);
    }
    async queryTargetAreas(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'TARGET_AREA#';
        return this.query(pk, skPrefix, options);
    }
    async createPriceHistory(userId, mlsNumber, priceHistoryData) {
        const { getPriceHistoryKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getPriceHistoryKeys(userId, mlsNumber);
        return this.create(keys.PK, keys.SK, 'PriceHistory', priceHistoryData);
    }
    async getPriceHistory(userId, mlsNumber) {
        const { getPriceHistoryKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getPriceHistoryKeys(userId, mlsNumber);
        return this.get(keys.PK, keys.SK);
    }
    async updatePriceHistory(userId, mlsNumber, updates) {
        const { getPriceHistoryKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getPriceHistoryKeys(userId, mlsNumber);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deletePriceHistory(userId, mlsNumber) {
        const { getPriceHistoryKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getPriceHistoryKeys(userId, mlsNumber);
        await this.delete(keys.PK, keys.SK);
    }
    async queryPriceHistories(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'PRICE_HISTORY#';
        return this.query(pk, skPrefix, options);
    }
    async createListingSnapshot(userId, mlsNumber, listingData) {
        const { getListingSnapshotKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingSnapshotKeys(userId, mlsNumber);
        return this.create(keys.PK, keys.SK, 'ListingSnapshot', listingData);
    }
    async getListingSnapshot(userId, mlsNumber) {
        const { getListingSnapshotKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingSnapshotKeys(userId, mlsNumber);
        return this.get(keys.PK, keys.SK);
    }
    async updateListingSnapshot(userId, mlsNumber, updates) {
        const { getListingSnapshotKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingSnapshotKeys(userId, mlsNumber);
        await this.update(keys.PK, keys.SK, updates);
    }
    async deleteListingSnapshot(userId, mlsNumber) {
        const { getListingSnapshotKeys } = await Promise.resolve().then(() => __importStar(require('./keys')));
        const keys = getListingSnapshotKeys(userId, mlsNumber);
        await this.delete(keys.PK, keys.SK);
    }
    async queryListingSnapshots(userId, options = {}) {
        const pk = `USER#${userId}`;
        const skPrefix = 'LISTING_SNAPSHOT#';
        return this.query(pk, skPrefix, options);
    }
}
exports.DynamoDBRepository = DynamoDBRepository;
let repositoryInstance = null;
function getRepository() {
    if (!repositoryInstance) {
        repositoryInstance = new DynamoDBRepository();
    }
    return repositoryInstance;
}
function resetRepository() {
    repositoryInstance = null;
}
