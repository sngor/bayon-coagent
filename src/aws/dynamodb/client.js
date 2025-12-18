"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDynamoDBClient = getDynamoDBClient;
exports.getDocumentClient = getDocumentClient;
exports.resetClients = resetClients;
exports.getTableName = getTableName;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const config_1 = require("../config");
let dynamoDBClient = null;
let documentClient = null;
function createDynamoDBClient() {
    if (typeof window !== 'undefined') {
        throw new Error('DynamoDB client cannot be used in the browser. ' +
            'DynamoDB operations must be performed server-side using Server Actions or API routes.');
    }
    const config = (0, config_1.getConfig)();
    const credentials = (0, config_1.getAWSCredentials)();
    const clientConfig = {
        region: config.region,
    };
    if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
        clientConfig.credentials = credentials;
    }
    if (config.dynamodb.endpoint) {
        clientConfig.endpoint = config.dynamodb.endpoint;
    }
    return new client_dynamodb_1.DynamoDBClient(clientConfig);
}
function getDynamoDBClient() {
    if (!dynamoDBClient) {
        dynamoDBClient = createDynamoDBClient();
    }
    return dynamoDBClient;
}
function getDocumentClient() {
    if (!documentClient) {
        const client = getDynamoDBClient();
        documentClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client, {
            marshallOptions: {
                convertEmptyValues: false,
                removeUndefinedValues: true,
                convertClassInstanceToMap: false,
            },
            unmarshallOptions: {
                wrapNumbers: false,
            },
        });
    }
    return documentClient;
}
function resetClients() {
    if (documentClient) {
        documentClient.destroy();
        documentClient = null;
    }
    if (dynamoDBClient) {
        dynamoDBClient.destroy();
        dynamoDBClient = null;
    }
}
function getTableName() {
    const config = (0, config_1.getConfig)();
    return config.dynamodb.tableName;
}
