#!/usr/bin/env tsx
/**
 * Test an actual AI flow to verify end-to-end functionality
 */

// Load environment variables like Next.js does
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { generateListingDescription } from '../src/aws/bedrock/flows/listing-description-generator';

async function testFlow() {
  console.log('🧪 Testing Listing Description Flow...\n');

  const input = {
    property_details: 'Beautiful 3-bedroom, 2-bathroom home in a quiet neighborhood. Features include hardwood floors, updated kitchen, and large backyard.',
  };

  try {
    console.log('📝 Input:', input.property_details);
    console.log('\n⏳ Generating description...\n');

    const result = await generateListingDescription(input);

    console.log('✅ Success!\n');
    console.log('📄 Generated Description:');
    console.log('─'.repeat(60));
    console.log(result.description);
    console.log('─'.repeat(60));
    console.log('\n✨ AI features are working correctly!\n');

  } catch (error: any) {
    console.log('❌ Flow failed\n');
    console.log('Error:', error.message);

    if (error.message.includes('validation') || error.message.includes('invalid')) {
      console.log('\n💡 This might be due to:');
      console.log('   - Model ID not using inference profile (should have us. prefix)');
      console.log('   - Model not enabled in Bedrock console');
      console.log('   - Invalid AWS credentials\n');
    }

    process.exit(1);
  }
}

testFlow();
