#!/usr/bin/env tsx
/**
 * Test social media post generation flow
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { generateSocialMediaPost } from '../src/aws/bedrock/flows/generate-social-media-post';

async function testSocialPost() {
  console.log('🧪 Testing Social Media Post Flow...\n');

  const input = {
    topic: 'Tips for first-time homebuyers in a competitive market',
    tone: 'Professional' as const,
  };

  try {
    console.log('📝 Topic:', input.topic);
    console.log('🎭 Tone:', input.tone);
    console.log('\n⏳ Generating posts...\n');

    const result = await generateSocialMediaPost(input);

    console.log('✅ Success!\n');
    console.log('📱 Generated Posts:');
    console.log('═'.repeat(60));
    
    console.log('\n📘 LinkedIn:');
    console.log('─'.repeat(60));
    console.log(result.linkedin);
    
    console.log('\n🐦 Twitter/X:');
    console.log('─'.repeat(60));
    console.log(result.twitter);
    
    console.log('\n📱 Facebook:');
    console.log('─'.repeat(60));
    console.log(result.facebook);
    
    console.log('\n═'.repeat(60));
    console.log('\n✨ Social media post generation is working!\n');

  } catch (error: any) {
    console.log('❌ Flow failed\n');
    console.log('Error:', error.message);
    process.exit(1);
  }
}

testSocialPost();
