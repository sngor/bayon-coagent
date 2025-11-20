#!/usr/bin/env tsx
/**
 * Simple Bedrock Test
 * Tests a basic Bedrock API call to identify issues
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

async function testBedrock() {
  console.log('🧪 Testing Bedrock API Call...\n');

  // Use AWS CLI credentials (no explicit credentials needed)
  const client = new BedrockRuntimeClient({
    region: 'us-east-2',
  });

  // Use cross-region inference profile (works in any region)
  const modelId = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

  try {
    console.log(`📡 Calling model: ${modelId}`);
    console.log('   Sending test prompt...\n');

    const command = new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Say "Hello, Bedrock is working!" in JSON format with a "message" field.' }],
        },
      ],
      inferenceConfig: {
        temperature: 0.7,
        maxTokens: 100,
      },
    });

    const response = await client.send(command);
    
    console.log('✅ Success! Bedrock is working correctly.\n');
    console.log('📝 Response:');
    
    const content = response.output?.message?.content;
    if (content && content[0] && 'text' in content[0]) {
      console.log(content[0].text);
    }
    
    console.log('\n📊 Token Usage:');
    console.log(`   Input tokens: ${response.usage?.inputTokens || 0}`);
    console.log(`   Output tokens: ${response.usage?.outputTokens || 0}`);
    console.log(`   Total tokens: ${response.usage?.totalTokens || 0}\n`);

  } catch (error: any) {
    console.log('❌ Bedrock API call failed\n');
    console.log('Error Details:');
    console.log(`   Name: ${error.name}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    console.log(`   Status: ${error.$metadata?.httpStatusCode || 'N/A'}\n`);

    if (error.name === 'UnrecognizedClientException') {
      console.log('💡 Solution:');
      console.log('   Your AWS credentials are invalid or not set.');
      console.log('   Run: aws configure');
      console.log('   Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY\n');
    } else if (error.name === 'AccessDeniedException') {
      console.log('💡 Solution:');
      console.log('   Your AWS credentials lack Bedrock permissions.');
      console.log('   Add these IAM permissions:');
      console.log('   - bedrock:InvokeModel');
      console.log('   - bedrock:InvokeModelWithResponseStream\n');
    } else if (error.name === 'ResourceNotFoundException') {
      console.log('💡 Solution:');
      console.log('   The model is not available in your region or account.');
      console.log('   Enable model access at:');
      console.log('   https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess\n');
    } else if (error.name === 'ValidationException') {
      console.log('💡 Solution:');
      console.log('   The request format is invalid.');
      console.log('   This might be a code issue or model incompatibility.\n');
    }

    process.exit(1);
  }
}

testBedrock();
