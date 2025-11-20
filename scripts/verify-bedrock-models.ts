#!/usr/bin/env tsx

/**
 * Verify Bedrock Model Access
 * 
 * This script verifies that all required Bedrock models for the Reimagine
 * Image Toolkit are accessible in the configured AWS region.
 */

import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { getConfig } from '../src/aws/config';

const REQUIRED_MODELS = [
  {
    id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    name: 'Claude 3.5 Sonnet',
    purpose: 'Image analysis and suggestions',
  },
  {
    id: 'amazon.titan-image-generator-v1',
    name: 'Titan Image Generator',
    purpose: 'Virtual staging, enhancement, renovation',
  },
  {
    id: 'stability.stable-diffusion-xl-v1',
    name: 'Stable Diffusion XL',
    purpose: 'Day-to-dusk, item removal',
  },
];

async function verifyBedrockModels() {
  console.log('🔍 Verifying Bedrock Model Access...\n');

  const config = getConfig();
  const client = new BedrockClient({
    region: config.bedrock.region,
  });

  try {
    // List all available foundation models
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    if (!response.modelSummaries) {
      console.error('❌ No models found in response');
      process.exit(1);
    }

    console.log(`📊 Found ${response.modelSummaries.length} total models in ${config.bedrock.region}\n`);

    // Check each required model
    let allModelsAvailable = true;

    for (const requiredModel of REQUIRED_MODELS) {
      const found = response.modelSummaries.find(
        (model) => model.modelId === requiredModel.id
      );

      if (found) {
        const status = found.modelLifecycle?.status || 'UNKNOWN';
        const isActive = status === 'ACTIVE';

        if (isActive) {
          console.log(`✅ ${requiredModel.name}`);
          console.log(`   Model ID: ${requiredModel.id}`);
          console.log(`   Purpose: ${requiredModel.purpose}`);
          console.log(`   Status: ${status}`);
        } else {
          console.log(`⚠️  ${requiredModel.name}`);
          console.log(`   Model ID: ${requiredModel.id}`);
          console.log(`   Purpose: ${requiredModel.purpose}`);
          console.log(`   Status: ${status} (NOT ACTIVE)`);
          allModelsAvailable = false;
        }
      } else {
        console.log(`❌ ${requiredModel.name}`);
        console.log(`   Model ID: ${requiredModel.id}`);
        console.log(`   Purpose: ${requiredModel.purpose}`);
        console.log(`   Status: NOT FOUND`);
        allModelsAvailable = false;
      }
      console.log('');
    }

    // Summary
    console.log('─'.repeat(60));
    if (allModelsAvailable) {
      console.log('✅ All required models are available and active!');
      console.log('\nYou can proceed with deploying the Reimagine Image Toolkit.');
      process.exit(0);
    } else {
      console.log('❌ Some required models are not available.');
      console.log('\n📝 Next Steps:');
      console.log('1. Go to AWS Console → Bedrock → Model access');
      console.log('2. Request access for the missing models');
      console.log('3. Wait for approval (usually instant for Titan and Claude)');
      console.log('4. Run this script again to verify');
      console.log('\n🔗 Model Access URL:');
      console.log(`https://console.aws.amazon.com/bedrock/home?region=${config.bedrock.region}#/modelaccess`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error verifying Bedrock models:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('AccessDeniedException')) {
        console.log('\n📝 Access Denied:');
        console.log('Your AWS credentials do not have permission to list Bedrock models.');
        console.log('Required permission: bedrock:ListFoundationModels');
      } else if (error.message.includes('UnrecognizedClientException')) {
        console.log('\n📝 Invalid Credentials:');
        console.log('Your AWS credentials are invalid or not configured.');
        console.log('Run: aws configure');
      }
    }
    
    process.exit(1);
  }
}

// Run verification
verifyBedrockModels();
