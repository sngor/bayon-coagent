#!/usr/bin/env tsx
/**
 * Test the research agent flow
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { runResearchAgent } from '../src/aws/bedrock/flows/run-research-agent';

async function testResearchAgent() {
  console.log('🧪 Testing Research Agent Flow...\n');

  const input = {
    topic: 'Current trends in real estate technology for 2024',
  };

  try {
    console.log('📝 Topic:', input.topic);
    console.log('\n⏳ Running research agent...\n');

    const result = await runResearchAgent(input);

    console.log('✅ Success!\n');
    console.log('📄 Report Preview (first 500 chars):');
    console.log('─'.repeat(60));
    console.log(result.report.substring(0, 500) + '...');
    console.log('─'.repeat(60));
    console.log(`\n📚 Citations: ${result.citations.length} sources`);
    result.citations.forEach((citation, i) => {
      console.log(`   ${i + 1}. ${citation}`);
    });
    console.log('\n✨ Research agent is working correctly!\n');

  } catch (error: any) {
    console.log('❌ Research agent failed\n');
    console.log('Error:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Solution:');
      console.log('   - Check that TAVILY_API_KEY is set in .env.local');
      console.log('   - Get a free API key at: https://app.tavily.com/sign-up\n');
    } else if (error.message.includes('search')) {
      console.log('\n💡 This might be a Tavily API issue');
      console.log('   - Check your API key is valid');
      console.log('   - Verify you have API credits remaining\n');
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testResearchAgent();
