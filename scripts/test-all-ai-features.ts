#!/usr/bin/env tsx
/**
 * Comprehensive AI Features Test
 * Tests multiple AI flows to ensure everything is working
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { generateListingDescription } from '../src/aws/bedrock/flows/listing-description-generator';
import { generateSocialMediaPost } from '../src/aws/bedrock/flows/generate-social-media-post';
import { generateAgentBio } from '../src/aws/bedrock/flows/generate-agent-bio';

async function testAllFeatures() {
  console.log('🧪 Testing All AI Features\n');
  console.log('═'.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Listing Description
  console.log('\n1️⃣  Testing Listing Description Generator...');
  try {
    const result = await generateListingDescription({
      property_details: '3-bed, 2-bath home with pool and mountain views',
    });
    if (result.description && result.description.length > 50) {
      console.log('   ✅ PASSED - Generated description');
      passed++;
    } else {
      console.log('   ❌ FAILED - Description too short');
      failed++;
    }
  } catch (error: any) {
    console.log('   ❌ FAILED -', error.message);
    failed++;
  }

  // Test 2: Social Media Posts
  console.log('\n2️⃣  Testing Social Media Post Generator...');
  try {
    const result = await generateSocialMediaPost({
      topic: 'Spring home buying season tips',
      tone: 'Professional',
      platforms: ['linkedin', 'twitter', 'facebook'],
      numberOfVariations: 1,
    });
    if (result.variations && result.variations.length > 0 && result.variations[0].linkedin && result.variations[0].twitter && result.variations[0].facebook) {
      console.log('   ✅ PASSED - Generated all platform posts');
      passed++;
    } else {
      console.log('   ❌ FAILED - Missing platform posts');
      failed++;
    }
  } catch (error: any) {
    console.log('   ❌ FAILED -', error.message);
    failed++;
  }

  // Test 3: Agent Bio
  console.log('\n3️⃣  Testing Agent Bio Generator...');
  try {
    const result = await generateAgentBio({
      name: 'John Smith',
      experience: '10 years in luxury real estate',
      certifications: 'Certified Luxury Home Marketing Specialist',
      agencyName: 'Premier Realty Group',
    });
    if (result.bio && result.bio.length > 100) {
      console.log('   ✅ PASSED - Generated bio');
      passed++;
    } else {
      console.log('   ❌ FAILED - Bio too short');
      failed++;
    }
  } catch (error: any) {
    console.log('   ❌ FAILED -', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All AI features are working correctly!\n');
    console.log('You can now:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Test features in the application');
    console.log('   3. Generate content for your real estate business\n');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
    process.exit(1);
  }
}

testAllFeatures();
