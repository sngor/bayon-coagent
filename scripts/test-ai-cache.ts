/**
 * Test AI Caching
 * 
 * Verifies that caching is working for both Bedrock and Gemini.
 */

import { getBedrockClient } from '../src/aws/bedrock/client';
import { getGeminiTextModel } from '../src/aws/google-ai/client';
import { generateContentWithCache } from '../src/aws/google-ai/cached-client';
import { aiCache } from '../src/lib/ai/cache/service';
import { z } from 'zod';

async function testBedrockCache() {
    console.log('\n--- Testing Bedrock Cache ---');
    const client = getBedrockClient();
    const prompt = "What is the capital of France? Return JSON: { \"answer\": \"Paris\" }";
    const schema = z.object({ answer: z.string() });

    // First call (uncached)
    console.log('1. Making first call (uncached)...');
    const start1 = Date.now();
    try {
        const result1 = await client.invoke(prompt, schema, { temperature: 0 });
        const duration1 = Date.now() - start1;
        console.log(`   Result: ${JSON.stringify(result1)}`);
        console.log(`   Duration: ${duration1}ms`);

        // Second call (cached)
        console.log('2. Making second call (cached)...');
        const start2 = Date.now();
        const result2 = await client.invoke(prompt, schema, { temperature: 0 });
        const duration2 = Date.now() - start2;
        console.log(`   Result: ${JSON.stringify(result2)}`);
        console.log(`   Duration: ${duration2}ms`);

        if (duration2 < 100 && duration2 < duration1) {
            console.log('✅ Bedrock caching verified! (Second call was instant)');
        } else {
            console.warn('⚠️ Bedrock caching might not be working or first call was too fast.');
        }
    } catch (error) {
        console.error('❌ Bedrock test failed:', error);
    }
}

async function testGeminiCache() {
    console.log('\n--- Testing Gemini Cache ---');
    try {
        const model = getGeminiTextModel();
        const prompt = "What is the capital of Japan? Answer in one word.";

        // First call (uncached)
        console.log('1. Making first call (uncached)...');
        const start1 = Date.now();
        const result1 = await generateContentWithCache(model, prompt);
        const duration1 = Date.now() - start1;
        console.log(`   Result: ${result1.response.text()}`);
        console.log(`   Duration: ${duration1}ms`);

        // Second call (cached)
        console.log('2. Making second call (cached)...');
        const start2 = Date.now();
        const result2 = await generateContentWithCache(model, prompt);
        const duration2 = Date.now() - start2;
        console.log(`   Result: ${result2.response.text()}`);
        console.log(`   Duration: ${duration2}ms`);

        if (duration2 < 100 && duration2 < duration1) {
            console.log('✅ Gemini caching verified! (Second call was instant)');
        } else {
            console.warn('⚠️ Gemini caching might not be working or first call was too fast.');
        }
    } catch (error) {
        console.error('❌ Gemini test failed:', error);
        // Check if it's due to missing API key
        if (process.env.GOOGLE_AI_API_KEY) {
            console.error('   API Key is present.');
        } else {
            console.warn('   Skipping Gemini test: GOOGLE_AI_API_KEY not found.');
        }
    }
}

async function main() {
    await aiCache.clear();
    await testBedrockCache();
    await testGeminiCache();
}

main().catch(console.error);
