import { getDynamoDBClient } from './src/aws/dynamodb/client';
import { PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';

async function test() {
    const client = getDynamoDBClient();
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent-development';
    
    console.log('Table name:', tableName);
    
    // Write
    console.log('Writing...');
    await client.send(new PutItemCommand({
        TableName: tableName,
        Item: {
            PK: { S: 'TEST#simple' },
            SK: { S: 'TEST#' + Date.now() },
            data: { S: 'test' }
        }
    }));
    console.log('Write OK');
    
    // Read
    console.log('Reading...');
    const result = await client.send(new GetItemCommand({
        TableName: tableName,
        Key: {
            PK: { S: 'TEST#simple' },
            SK: { S: 'TEST#' + Date.now() }
        }
    }));
    console.log('Read result:', result.Item);
}

test().catch(console.error);
