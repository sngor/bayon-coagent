#!/usr/bin/env tsx
/**
 * Bedrock Diagnostic Script
 * 
 * This script tests the Bedrock connection and helps identify configuration issues.
 */

import { getConfig, validateConfig, getAWSCredentials } from '../src/aws/config';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

async function diagnoseBedrock() {
  console.log('🔍 Diagnosing Bedrock Configuration...\n');

  // Step 1: Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  const config = getConfig();
  console.log(`   Environment: ${config.environment}`);
  console.log(`   AWS Region: ${config.region}`);
  console.log(`   Bedrock Region: ${config.bedrock.region}`);
  console.log(`   Bedrock Model: ${config.bedrock.modelId}`);
  console.log(`   Bedrock Endpoint: ${config.bedrock.endpoint || 'default'}\n`);

  // Step 2: Validate configuration
  console.log('2️⃣ Validating Configuration:');
  const validation = validateConfig();
  if (validation.valid) {
    console.log('   ✅ Configuration is valid\n');
  } else {
    console.log('   ❌ Configuration errors:');
    validation.errors.forEach(error => console.log(`      - ${error}`));
    console.log();
  }

  // Step 3: Check AWS credentials
  console.log('3️⃣ Checking AWS Credentials:');
  const credentials = getAWSCredentials();
  if (credentials && credentials.accessKeyId && credentials.accessKeyId !== 'test' && credentials.accessKeyId !== 'your-access-key-here') {
    console.log(`   ✅ Access Key ID: ${credentials.accessKeyId.substring(0, 8)}...`);
  } else {
    console.log(`   ❌ Access Key ID: ${credentials.accessKeyId || 'NOT SET'}`);
    console.log('      Please set AWS_ACCESS_KEY_ID in .env.local');
  }

  if (credentials.secretAccessKey && credentials.secretAccessKey !== 'test' && credentials.secretAccessKey !== 'your-secret-key-here') {
    console.log(`   ✅ Secret Access Key: ${credentials.secretAccessKey.substring(0, 8)}...\n`);
  } else {
    console.log(`   ❌ Secret Access Key: ${credentials.secretAccessKey || 'NOT SET'}`);
    console.log('      Please set AWS_SECRET_ACCESS_KEY in .env.local\n');
  }

  // Step 4: Test Bedrock connection
  console.log('4️⃣ Testing Bedrock Connection:');
  try {
    const client = new BedrockRuntimeClient({
      region: config.bedrock.region,
      credentials: credentials.accessKeyId && credentials.secretAccessKey
        ? {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        }
        : undefined,
    });

    // Try to invoke a simple model call
    const { BedrockClient, ListFoundationModelsCommand: BedrockListCommand } = await import('@aws-sdk/client-bedrock');
    const bedrockClient = new BedrockClient({
      region: config.bedrock.region,
      credentials: credentials.accessKeyId && credentials.secretAccessKey
        ? {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        }
        : undefined,
    });

    const command = new BedrockListCommand({});
    const response = await bedrockClient.send(command);

    console.log('   ✅ Successfully connected to Bedrock');
    console.log(`   ✅ Found ${response.modelSummaries?.length || 0} available models\n`);

    // Check if the configured model is available
    const modelAvailable = response.modelSummaries?.some(
      model => model.modelId === config.bedrock.modelId
    );

    if (modelAvailable) {
      console.log(`   ✅ Model ${config.bedrock.modelId} is available\n`);
    } else {
      console.log(`   ⚠️  Model ${config.bedrock.modelId} not found in available models`);
      console.log('      Available Claude models:');
      response.modelSummaries
        ?.filter(model => model.modelId?.includes('claude'))
        .forEach(model => console.log(`      - ${model.modelId}`));
      console.log();
    }

  } catch (error: any) {
    console.log('   ❌ Failed to connect to Bedrock');
    console.log(`   Error: ${error.message}`);

    if (error.name === 'UnrecognizedClientException' || error.message.includes('security token')) {
      console.log('\n   💡 This error usually means:');
      console.log('      - AWS credentials are invalid or expired');
      console.log('      - AWS credentials are not set correctly in .env.local');
      console.log('      - The IAM user/role lacks Bedrock permissions');
    } else if (error.name === 'AccessDeniedException') {
      console.log('\n   💡 This error means:');
      console.log('      - Your AWS credentials are valid but lack Bedrock permissions');
      console.log('      - Add the "AmazonBedrockFullAccess" policy to your IAM user/role');
    }
    console.log();
  }

  // Step 5: Recommendations
  console.log('5️⃣ Recommendations:');

  if (!credentials || credentials.accessKeyId === 'your-access-key-here' || !credentials.accessKeyId) {
    console.log('   📝 Update .env.local with your AWS credentials:');
    console.log('      AWS_ACCESS_KEY_ID=your-actual-access-key');
    console.log('      AWS_SECRET_ACCESS_KEY=your-actual-secret-key\n');
    console.log('   📝 Or use AWS CLI configured credentials by removing these variables\n');
  }

  console.log('   📝 Ensure your IAM user/role has these permissions:');
  console.log('      - bedrock:InvokeModel');
  console.log('      - bedrock:InvokeModelWithResponseStream');
  console.log('      - bedrock:ListFoundationModels\n');

  console.log('   📝 Enable model access in AWS Bedrock console:');
  console.log('      https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess\n');
}

diagnoseBedrock().catch(console.error);
