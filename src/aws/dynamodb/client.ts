/**
 * DynamoDB Client Module
 * 
 * Provides a configured DynamoDB client for the application.
 * Automatically configures endpoints based on environment (local vs remote).
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getConfig, getAWSCredentials } from '../config';

let dynamoDBClient: DynamoDBClient | null = null;
let documentClient: DynamoDBDocumentClient | null = null;

/**
 * Creates and configures a DynamoDB client
 */
function createDynamoDBClient(): DynamoDBClient {
  // Browser-side check: DynamoDB should not be accessed from the browser
  if (typeof window !== 'undefined') {
    throw new Error(
      'DynamoDB client cannot be used in the browser. ' +
      'DynamoDB operations must be performed server-side using Server Actions or API routes.'
    );
  }

  const config = getConfig();
  const credentials = getAWSCredentials();

  const clientConfig: any = {
    region: config.region,
  };

  // Add credentials if available
  if (credentials.accessKeyId && credentials.secretAccessKey) {
    clientConfig.credentials = credentials;
  }

  // Add custom endpoint for local development
  if (config.dynamodb.endpoint) {
    clientConfig.endpoint = config.dynamodb.endpoint;
  }

  return new DynamoDBClient(clientConfig);
}

/**
 * Gets or creates the DynamoDB client singleton
 */
export function getDynamoDBClient(): DynamoDBClient {
  if (!dynamoDBClient) {
    dynamoDBClient = createDynamoDBClient();
  }
  return dynamoDBClient;
}

/**
 * Gets or creates the DynamoDB Document client singleton
 * The Document client provides a simpler interface for working with JSON documents
 */
export function getDocumentClient(): DynamoDBDocumentClient {
  if (!documentClient) {
    const client = getDynamoDBClient();
    documentClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        // Convert empty strings to null
        convertEmptyValues: false,
        // Remove undefined values
        removeUndefinedValues: true,
        // Convert class instances to maps
        convertClassInstanceToMap: false,
      },
      unmarshallOptions: {
        // Return numbers as JavaScript numbers instead of strings
        wrapNumbers: false,
      },
    });
  }
  return documentClient;
}

/**
 * Resets the client singletons
 * Useful for testing or when configuration changes
 */
export function resetClients(): void {
  if (documentClient) {
    documentClient.destroy();
    documentClient = null;
  }
  if (dynamoDBClient) {
    dynamoDBClient.destroy();
    dynamoDBClient = null;
  }
}

/**
 * Gets the table name from configuration
 */
export function getTableName(): string {
  const config = getConfig();
  return config.dynamodb.tableName;
}
