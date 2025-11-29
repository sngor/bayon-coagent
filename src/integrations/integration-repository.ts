/**
 * Integration Repository
 * 
 * DynamoDB repository for managing integration connections.
 * Handles CRUD operations, encryption/decryption, and queries.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    DeleteCommand,
    QueryCommand,
    UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import {
    IntegrationConnection,
    IntegrationProvider,
    IntegrationType,
    IntegrationStatus,
    IntegrationCredentials
} from './types';

const TABLE_NAME = process.env.DYNAMODB_TABLE_PREFIX
    ? `${process.env.DYNAMODB_TABLE_PREFIX}-IntegrationConnections`
    : 'IntegrationConnections';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const KMS_KEY_ID = process.env.INTEGRATION_KMS_KEY_ID;

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize KMS client for encryption
const kmsClient = new KMSClient({ region: AWS_REGION });

/**
 * Encrypt sensitive credentials using AWS KMS
 */
async function encryptCredentials(credentials: IntegrationCredentials): Promise<string> {
    if (!KMS_KEY_ID) {
        // Fallback to base64 encoding if KMS is not configured (dev/test only)
        console.warn('KMS_KEY_ID not configured, using base64 encoding (not secure for production)');
        return Buffer.from(JSON.stringify(credentials)).toString('base64');
    }

    try {
        const command = new EncryptCommand({
            KeyId: KMS_KEY_ID,
            Plaintext: Buffer.from(JSON.stringify(credentials))
        });

        const response = await kmsClient.send(command);
        return Buffer.from(response.CiphertextBlob!).toString('base64');
    } catch (error) {
        console.error('Failed to encrypt credentials with KMS:', error);
        throw new Error('Credential encryption failed');
    }
}

/**
 * Decrypt credentials using AWS KMS
 */
async function decryptCredentials(encryptedData: string): Promise<IntegrationCredentials> {
    if (!KMS_KEY_ID) {
        // Fallback to base64 decoding if KMS is not configured (dev/test only)
        const decrypted = Buffer.from(encryptedData, 'base64').toString('utf-8');
        return JSON.parse(decrypted);
    }

    try {
        const command = new DecryptCommand({
            CiphertextBlob: Buffer.from(encryptedData, 'base64')
        });

        const response = await kmsClient.send(command);
        const decrypted = Buffer.from(response.Plaintext!).toString('utf-8');
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Failed to decrypt credentials with KMS:', error);
        throw new Error('Credential decryption failed');
    }
}

/**
 * Integration Repository Class
 */
export class IntegrationRepository {
    /**
     * Create a new integration connection
     */
    async create(connection: IntegrationConnection): Promise<IntegrationConnection> {
        // Encrypt credentials before storing
        const encryptedCredentials = await encryptCredentials(connection.credentials);

        const item = {
            ...connection,
            credentials: encryptedCredentials
        };

        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        });

        await docClient.send(command);
        return connection;
    }

    /**
     * Get integration connection by ID
     */
    async get(userId: string, integrationId: string): Promise<IntegrationConnection | null> {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                userId,
                integrationId
            }
        });

        const response = await docClient.send(command);

        if (!response.Item) {
            return null;
        }

        // Decrypt credentials
        const credentials = await decryptCredentials(response.Item.credentials as string);

        return {
            ...response.Item,
            credentials
        } as IntegrationConnection;
    }

    /**
     * Get integration connection by provider
     */
    async getByProvider(
        userId: string,
        provider: IntegrationProvider
    ): Promise<IntegrationConnection | null> {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'provider-index',
            KeyConditionExpression: 'userId = :userId AND provider = :provider',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':provider': provider
            },
            Limit: 1
        });

        const response = await docClient.send(command);

        if (!response.Items || response.Items.length === 0) {
            return null;
        }

        const item = response.Items[0];
        const credentials = await decryptCredentials(item.credentials as string);

        return {
            ...item,
            credentials
        } as IntegrationConnection;
    }

    /**
     * List all integrations for a user
     */
    async listByUser(userId: string): Promise<IntegrationConnection[]> {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        });

        const response = await docClient.send(command);

        if (!response.Items || response.Items.length === 0) {
            return [];
        }

        // Decrypt credentials for each connection
        const connections = await Promise.all(
            response.Items.map(async (item) => {
                const credentials = await decryptCredentials(item.credentials as string);
                return {
                    ...item,
                    credentials
                } as IntegrationConnection;
            })
        );

        return connections;
    }

    /**
     * List integrations by type
     */
    async listByType(userId: string, type: IntegrationType): Promise<IntegrationConnection[]> {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'userId = :userId',
            FilterExpression: '#type = :type',
            ExpressionAttributeNames: {
                '#type': 'type'
            },
            ExpressionAttributeValues: {
                ':userId': userId,
                ':type': type
            }
        });

        const response = await docClient.send(command);

        if (!response.Items || response.Items.length === 0) {
            return [];
        }

        const connections = await Promise.all(
            response.Items.map(async (item) => {
                const credentials = await decryptCredentials(item.credentials as string);
                return {
                    ...item,
                    credentials
                } as IntegrationConnection;
            })
        );

        return connections;
    }

    /**
     * Update integration connection
     */
    async update(connection: IntegrationConnection): Promise<IntegrationConnection> {
        // Encrypt credentials before storing
        const encryptedCredentials = await encryptCredentials(connection.credentials);

        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                userId: connection.userId,
                integrationId: connection.id
            },
            UpdateExpression: `
                SET #status = :status,
                    credentials = :credentials,
                    metadata = :metadata,
                    updatedAt = :updatedAt,
                    lastValidatedAt = :lastValidatedAt,
                    expiresAt = :expiresAt,
                    #error = :error
            `,
            ExpressionAttributeNames: {
                '#status': 'status',
                '#error': 'error'
            },
            ExpressionAttributeValues: {
                ':status': connection.status,
                ':credentials': encryptedCredentials,
                ':metadata': connection.metadata,
                ':updatedAt': connection.updatedAt,
                ':lastValidatedAt': connection.lastValidatedAt || null,
                ':expiresAt': connection.expiresAt || null,
                ':error': connection.error || null
            },
            ReturnValues: 'ALL_NEW'
        });

        await docClient.send(command);
        return connection;
    }

    /**
     * Update integration status
     */
    async updateStatus(
        userId: string,
        integrationId: string,
        status: IntegrationStatus,
        error?: string
    ): Promise<void> {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                userId,
                integrationId
            },
            UpdateExpression: `
                SET #status = :status,
                    updatedAt = :updatedAt,
                    #error = :error
            `,
            ExpressionAttributeNames: {
                '#status': 'status',
                '#error': 'error'
            },
            ExpressionAttributeValues: {
                ':status': status,
                ':updatedAt': Date.now(),
                ':error': error || null
            }
        });

        await docClient.send(command);
    }

    /**
     * Delete integration connection
     */
    async delete(userId: string, integrationId: string): Promise<void> {
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                userId,
                integrationId
            }
        });

        await docClient.send(command);
    }

    /**
     * Delete all integrations for a provider
     */
    async deleteByProvider(userId: string, provider: IntegrationProvider): Promise<void> {
        // First, query for all connections with this provider
        const connections = await this.listByUser(userId);
        const providerConnections = connections.filter(conn => conn.provider === provider);

        // Delete each connection
        await Promise.all(
            providerConnections.map(conn => this.delete(userId, conn.id))
        );
    }
}

// Export singleton instance
export const integrationRepository = new IntegrationRepository();
