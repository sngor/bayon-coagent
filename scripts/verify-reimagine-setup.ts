#!/usr/bin/env tsx

/**
 * Verify Reimagine Image Toolkit Setup
 * 
 * This script verifies that all AWS resources are properly configured
 * for the Reimagine Image Toolkit.
 */

import { S3Client, GetBucketCorsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { getConfig } from '../src/aws/config';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

function addResult(result: CheckResult) {
  results.push(result);
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
}

async function checkAWSCredentials() {
  console.log('\n🔐 Checking AWS Credentials...');
  try {
    const client = new STSClient({ region: 'us-east-1' });
    const response = await client.send(new GetCallerIdentityCommand({}));
    
    addResult({
      name: 'AWS Credentials',
      status: 'pass',
      message: 'Valid credentials found',
      details: `Account: ${response.Account}, User: ${response.Arn}`,
    });
    return true;
  } catch (error) {
    addResult({
      name: 'AWS Credentials',
      status: 'fail',
      message: 'Invalid or missing credentials',
      details: 'Run: aws configure',
    });
    return false;
  }
}

async function checkS3Bucket() {
  console.log('\n🪣 Checking S3 Bucket...');
  const config = getConfig();
  const client = new S3Client({
    region: config.region,
    endpoint: config.s3.endpoint,
  });

  try {
    // Check if bucket exists
    await client.send(new HeadBucketCommand({ Bucket: config.s3.bucketName }));
    
    addResult({
      name: 'S3 Bucket Exists',
      status: 'pass',
      message: `Bucket "${config.s3.bucketName}" is accessible`,
    });

    // Check CORS configuration
    try {
      const corsResponse = await client.send(
        new GetBucketCorsCommand({ Bucket: config.s3.bucketName })
      );

      if (corsResponse.CORSRules && corsResponse.CORSRules.length > 0) {
        const hasRequiredMethods = corsResponse.CORSRules.some((rule) =>
          rule.AllowedMethods?.includes('PUT') && rule.AllowedMethods?.includes('POST')
        );

        if (hasRequiredMethods) {
          addResult({
            name: 'S3 CORS Configuration',
            status: 'pass',
            message: 'CORS rules configured correctly',
          });
        } else {
          addResult({
            name: 'S3 CORS Configuration',
            status: 'warn',
            message: 'CORS rules exist but may be incomplete',
            details: 'Ensure PUT and POST methods are allowed',
          });
        }
      } else {
        addResult({
          name: 'S3 CORS Configuration',
          status: 'fail',
          message: 'No CORS rules configured',
          details: 'Run: npm run configure:reimagine-s3',
        });
      }
    } catch (error) {
      addResult({
        name: 'S3 CORS Configuration',
        status: 'fail',
        message: 'Unable to check CORS configuration',
        details: 'Run: npm run configure:reimagine-s3',
      });
    }

    return true;
  } catch (error) {
    addResult({
      name: 'S3 Bucket',
      status: 'fail',
      message: `Bucket "${config.s3.bucketName}" not accessible`,
      details: 'Create the bucket or update S3_BUCKET_NAME',
    });
    return false;
  }
}

async function checkDynamoDB() {
  console.log('\n🗄️  Checking DynamoDB Table...');
  const config = getConfig();
  const client = new DynamoDBClient({
    region: config.region,
    endpoint: config.dynamodb.endpoint,
  });

  try {
    const response = await client.send(
      new DescribeTableCommand({ TableName: config.dynamodb.tableName })
    );

    if (response.Table) {
      addResult({
        name: 'DynamoDB Table Exists',
        status: 'pass',
        message: `Table "${config.dynamodb.tableName}" is active`,
      });

      // Check for UserIndex GSI
      const hasUserIndex = response.Table.GlobalSecondaryIndexes?.some(
        (gsi) => gsi.IndexName === 'UserIndex'
      );

      if (hasUserIndex) {
        addResult({
          name: 'DynamoDB UserIndex GSI',
          status: 'pass',
          message: 'UserIndex GSI exists for efficient queries',
        });
      } else {
        addResult({
          name: 'DynamoDB UserIndex GSI',
          status: 'warn',
          message: 'UserIndex GSI not found',
          details: 'Edit history queries may be less efficient',
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    addResult({
      name: 'DynamoDB Table',
      status: 'fail',
      message: `Table "${config.dynamodb.tableName}" not accessible`,
      details: 'Deploy infrastructure or update DYNAMODB_TABLE_NAME',
    });
    return false;
  }
}

async function checkBedrockModels() {
  console.log('\n🤖 Checking Bedrock Model Access...');
  const config = getConfig();
  const client = new BedrockClient({ region: config.bedrock.region });

  const requiredModels = [
    'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'amazon.titan-image-generator-v1',
    'stability.stable-diffusion-xl-v1',
  ];

  try {
    const response = await client.send(new ListFoundationModelsCommand({}));

    if (!response.modelSummaries) {
      addResult({
        name: 'Bedrock Models',
        status: 'fail',
        message: 'Unable to list Bedrock models',
      });
      return false;
    }

    let allModelsAvailable = true;

    for (const modelId of requiredModels) {
      const found = response.modelSummaries.find((m) => m.modelId === modelId);

      if (found && found.modelLifecycle?.status === 'ACTIVE') {
        addResult({
          name: `Bedrock Model: ${modelId}`,
          status: 'pass',
          message: 'Available and active',
        });
      } else {
        addResult({
          name: `Bedrock Model: ${modelId}`,
          status: 'fail',
          message: 'Not available or not active',
          details: 'Request access in AWS Console → Bedrock → Model access',
        });
        allModelsAvailable = false;
      }
    }

    return allModelsAvailable;
  } catch (error) {
    addResult({
      name: 'Bedrock Models',
      status: 'fail',
      message: 'Unable to check Bedrock model access',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔧 Checking Environment Variables...');

  const requiredVars = [
    'AWS_REGION',
    'COGNITO_USER_POOL_ID',
    'COGNITO_CLIENT_ID',
    'DYNAMODB_TABLE_NAME',
    'S3_BUCKET_NAME',
    'BEDROCK_MODEL_ID',
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addResult({
        name: `Env Var: ${varName}`,
        status: 'pass',
        message: 'Set',
      });
    } else {
      addResult({
        name: `Env Var: ${varName}`,
        status: 'fail',
        message: 'Not set',
        details: 'Update .env.local or .env.production',
      });
      allPresent = false;
    }
  }

  return allPresent;
}

async function runVerification() {
  console.log('🔍 Verifying Reimagine Image Toolkit Setup');
  console.log('═'.repeat(60));

  const credentialsOk = await checkAWSCredentials();
  if (!credentialsOk) {
    console.log('\n❌ Cannot proceed without valid AWS credentials');
    process.exit(1);
  }

  await checkEnvironmentVariables();
  await checkS3Bucket();
  await checkDynamoDB();
  await checkBedrockModels();

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Verification Summary');
  console.log('═'.repeat(60));

  const passed = results.filter((r) => r.status === 'pass').length;
  const warned = results.filter((r) => r.status === 'warn').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed === 0 && warned === 0) {
    console.log('\n🎉 All checks passed! Reimagine Image Toolkit is ready to use.');
    process.exit(0);
  } else if (failed === 0) {
    console.log('\n⚠️  Setup is functional but has warnings. Review the warnings above.');
    process.exit(0);
  } else {
    console.log('\n❌ Setup is incomplete. Fix the failed checks above.');
    console.log('\n📝 Common Solutions:');
    console.log('1. Deploy infrastructure: npm run sam:deploy:dev');
    console.log('2. Configure S3: npm run configure:reimagine-s3');
    console.log('3. Verify Bedrock models: npm run verify:bedrock-models');
    console.log('4. Update environment variables in .env.local');
    process.exit(1);
  }
}

// Run verification
runVerification();
