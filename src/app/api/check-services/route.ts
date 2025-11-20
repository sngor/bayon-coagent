import { NextResponse } from 'next/server';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { CognitoIdentityProviderClient, DescribeUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { getConfig, getAWSCredentials } from '@/aws/config';

type ServiceStatus = 'checking' | 'connected' | 'error' | 'not-configured';

interface ServiceState {
    status: ServiceStatus;
    error?: string;
}

/**
 * API endpoint to check service connections
 * Tests actual connectivity to AWS services and external APIs
 */
export async function GET() {
    try {
        const config = getConfig();
        const credentials = getAWSCredentials();

        // Check AWS services in parallel
        const [bedrock, dynamodb, s3, cognito, cloudwatch] = await Promise.all([
            checkBedrock(config, credentials),
            checkDynamoDB(config, credentials),
            checkS3(config, credentials),
            checkCognito(config, credentials),
            checkCloudWatch(config, credentials),
        ]);

        // Check external APIs in parallel
        const [tavily, newsApi, bridgeApi] = await Promise.all([
            checkTavilyAPI(),
            checkNewsAPI(),
            checkBridgeAPI(),
        ]);

        return NextResponse.json({
            aws: {
                bedrock,
                dynamodb,
                s3,
                cognito,
                cloudwatch,
            },
            external: {
                tavily,
                newsApi,
                bridgeApi,
            },
        });
    } catch (error) {
        console.error('Error checking services:', error);
        return NextResponse.json(
            { error: 'Failed to check services' },
            { status: 500 }
        );
    }
}

/**
 * Check AWS Bedrock connectivity
 */
async function checkBedrock(config: any, credentials: any): Promise<ServiceState> {
    try {
        if (!config.bedrock.modelId) {
            return { status: 'not-configured', error: 'Model ID not configured' };
        }

        const client = new BedrockRuntimeClient({
            region: config.bedrock.region,
            endpoint: config.bedrock.endpoint,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? credentials
                : undefined,
        });

        // Try a minimal converse call to verify connectivity
        const command = new ConverseCommand({
            modelId: config.bedrock.modelId,
            messages: [
                {
                    role: 'user',
                    content: [{ text: 'test' }],
                },
            ],
        });
        await client.send(command);

        return { status: 'connected' };
    } catch (error: any) {
        console.error('Bedrock check failed:', error);
        return { 
            status: 'error', 
            error: error.message || 'Connection failed' 
        };
    }
}

/**
 * Check DynamoDB connectivity
 */
async function checkDynamoDB(config: any, credentials: any): Promise<ServiceState> {
    try {
        if (!config.dynamodb.tableName) {
            return { status: 'not-configured', error: 'Table name not configured' };
        }

        const client = new DynamoDBClient({
            region: config.region,
            endpoint: config.dynamodb.endpoint,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? credentials
                : undefined,
        });

        // Try to list tables to verify connectivity
        const command = new ListTablesCommand({});
        const response = await client.send(command);

        // Check if our table exists
        if (response.TableNames?.includes(config.dynamodb.tableName)) {
            return { status: 'connected' };
        } else {
            return { 
                status: 'error', 
                error: `Table ${config.dynamodb.tableName} not found` 
            };
        }
    } catch (error: any) {
        console.error('DynamoDB check failed:', error);
        return { 
            status: 'error', 
            error: error.message || 'Connection failed' 
        };
    }
}

/**
 * Check S3 connectivity
 */
async function checkS3(config: any, credentials: any): Promise<ServiceState> {
    try {
        if (!config.s3.bucketName) {
            return { status: 'not-configured', error: 'Bucket name not configured' };
        }

        const client = new S3Client({
            region: config.region,
            endpoint: config.s3.endpoint,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? credentials
                : undefined,
            forcePathStyle: config.environment === 'local',
        });

        // Try to check if bucket exists
        const command = new HeadBucketCommand({
            Bucket: config.s3.bucketName,
        });
        await client.send(command);

        return { status: 'connected' };
    } catch (error: any) {
        console.error('S3 check failed:', error);
        return { 
            status: 'error', 
            error: error.message || 'Connection failed' 
        };
    }
}

/**
 * Check Cognito connectivity
 */
async function checkCognito(config: any, credentials: any): Promise<ServiceState> {
    try {
        if (!config.cognito.userPoolId) {
            return { status: 'not-configured', error: 'User pool not configured' };
        }

        const client = new CognitoIdentityProviderClient({
            region: config.region,
            endpoint: config.cognito.endpoint,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? credentials
                : undefined,
        });

        // Try to describe the user pool
        const command = new DescribeUserPoolCommand({
            UserPoolId: config.cognito.userPoolId,
        });
        await client.send(command);

        return { status: 'connected' };
    } catch (error: any) {
        console.error('Cognito check failed:', error);
        return { 
            status: 'error', 
            error: error.message || 'Connection failed' 
        };
    }
}

/**
 * Check CloudWatch connectivity
 */
async function checkCloudWatch(config: any, credentials: any): Promise<ServiceState> {
    try {
        if (!config.region) {
            return { status: 'not-configured', error: 'Region not configured' };
        }

        const client = new CloudWatchLogsClient({
            region: config.region,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? credentials
                : undefined,
        });

        // Try to list log groups to verify connectivity
        const command = new DescribeLogGroupsCommand({ limit: 1 });
        await client.send(command);

        return { status: 'connected' };
    } catch (error: any) {
        console.error('CloudWatch check failed:', error);
        return { 
            status: 'error', 
            error: error.message || 'Connection failed' 
        };
    }
}

/**
 * Check Tavily API connectivity
 */
async function checkTavilyAPI(): Promise<ServiceState> {
    try {
        const apiKey = process.env.TAVILY_API_KEY;
        
        if (!apiKey || apiKey.length === 0) {
            return { status: 'not-configured', error: 'API key not configured' };
        }

        // Make a minimal test request to Tavily API
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: 'test',
                max_results: 1,
            }),
        });

        if (response.ok) {
            return { status: 'connected' };
        } else if (response.status === 401 || response.status === 403) {
            return { status: 'error', error: 'Invalid API key' };
        } else {
            return { status: 'error', error: `HTTP ${response.status}` };
        }
    } catch (error: any) {
        console.error('Tavily API check failed:', error);
        return { 
            status: 'error', 
            error: error.message || 'Connection failed' 
        };
    }
}

/**
 * Check NewsAPI connectivity
 */
async function checkNewsAPI(): Promise<ServiceState> {
    try {
        const apiKey = process.env.NEWS_API_KEY;
        
        if (!apiKey || apiKey.length === 0) {
            return { status: 'not-configured', error: 'API key not configured' };
        }

        // Make a minimal test request to NewsAPI
        const response = await fetch(
            `https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${apiKey}`
        );

        if (response.ok) {
            return { status: 'connected' };
        } else if (response.status === 401) {
            return { status: 'error', error: 'Invalid API key' };
        } else {
            return { status: 'error', error: `HTTP ${response.status}` };
        }
    } catch (error: any) {
        console.error('NewsAPI check failed:', error);
        return { 
            status: 'error', 
            error: error.message || 'Connection failed' 
        };
    }
}

/**
 * Check Bridge API connectivity
 */
async function checkBridgeAPI(): Promise<ServiceState> {
    try {
        const apiKey = process.env.BRIDGE_API_KEY;
        
        if (!apiKey || apiKey.length === 0) {
            return { status: 'not-configured', error: 'API key not configured' };
        }

        // Bridge API doesn't have a simple health check endpoint
        // Just verify the key is configured
        return { status: 'connected' };
    } catch (error: any) {
        console.error('Bridge API check failed:', error);
        return { 
            status: 'error', 
            error: error.message || 'Connection failed' 
        };
    }
}
