/**
 * Example usage of AWS Bedrock Client
 * 
 * This file demonstrates how to use the Bedrock client for AI operations.
 * Run with: tsx src/aws/bedrock/example.ts
 */

import { getBedrockClient, BedrockError, BedrockParseError } from './client';
import { z } from 'zod';

// Example 1: Simple text generation with schema validation
async function example1() {
  console.log('\n=== Example 1: Simple Text Generation ===\n');

  const client = getBedrockClient();

  const outputSchema = z.object({
    greeting: z.string(),
  });

  try {
    const result = await client.invoke(
      'Generate a friendly greeting in JSON format with a "greeting" field',
      outputSchema,
      {
        temperature: 0.7,
        maxTokens: 100,
      }
    );

    console.log('Result:', result);
  } catch (error) {
    if (error instanceof BedrockError) {
      console.error('Bedrock API Error:', error.message);
    } else if (error instanceof BedrockParseError) {
      console.error('Parse Error:', error.message);
      console.error('Response:', error.response);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 2: Streaming response
async function example2() {
  console.log('\n=== Example 2: Streaming Response ===\n');

  const client = getBedrockClient();

  try {
    process.stdout.write('Streaming: ');
    
    for await (const chunk of client.invokeStream(
      'Tell me a very short joke about programming'
    )) {
      process.stdout.write(chunk);
    }
    
    console.log('\n');
  } catch (error) {
    if (error instanceof BedrockError) {
      console.error('Bedrock API Error:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 3: Using system and user prompts
async function example3() {
  console.log('\n=== Example 3: System and User Prompts ===\n');

  const client = getBedrockClient();

  const outputSchema = z.object({
    bio: z.string(),
  });

  try {
    const result = await client.invokeWithPrompts(
      'You are an expert copywriter for real estate professionals.',
      `Write a professional bio (2-3 sentences) for a real estate agent named Sarah Johnson 
       with 10 years of experience and specializing in luxury homes. 
       Return as JSON with a "bio" field.`,
      outputSchema
    );

    console.log('Generated Bio:', result.bio);
  } catch (error) {
    if (error instanceof BedrockError) {
      console.error('Bedrock API Error:', error.message);
    } else if (error instanceof BedrockParseError) {
      console.error('Parse Error:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 4: Complex schema validation
async function example4() {
  console.log('\n=== Example 4: Complex Schema Validation ===\n');

  const client = getBedrockClient();

  const outputSchema = z.object({
    properties: z.array(
      z.object({
        address: z.string(),
        price: z.number(),
        bedrooms: z.number(),
        bathrooms: z.number(),
      })
    ),
  });

  try {
    const result = await client.invoke(
      `Generate 3 fictional real estate property listings in JSON format.
       Return as JSON with a "properties" array, where each property has:
       - address (string)
       - price (number)
       - bedrooms (number)
       - bathrooms (number)`,
      outputSchema
    );

    console.log('Generated Properties:');
    result.properties.forEach((prop, idx) => {
      console.log(`\n${idx + 1}. ${prop.address}`);
      console.log(`   Price: $${prop.price.toLocaleString()}`);
      console.log(`   ${prop.bedrooms} bed, ${prop.bathrooms} bath`);
    });
  } catch (error) {
    if (error instanceof BedrockError) {
      console.error('Bedrock API Error:', error.message);
    } else if (error instanceof BedrockParseError) {
      console.error('Parse Error:', error.message);
      console.error('Validation Errors:', error.validationErrors?.errors);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 5: Retry behavior demonstration
async function example5() {
  console.log('\n=== Example 5: Retry Configuration ===\n');

  const client = getBedrockClient();

  const outputSchema = z.object({
    message: z.string(),
  });

  try {
    const result = await client.invoke(
      'Say "Hello World" in JSON format with a "message" field',
      outputSchema,
      {
        retryConfig: {
          maxRetries: 5,
          initialDelayMs: 500,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
        },
      }
    );

    console.log('Result:', result);
  } catch (error) {
    if (error instanceof BedrockError) {
      console.error('Failed after retries:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Run all examples
async function main() {
  console.log('AWS Bedrock Client Examples');
  console.log('===========================');

  // Note: These examples require valid AWS credentials and Bedrock access
  // Uncomment the examples you want to run:

  // await example1();
  // await example2();
  // await example3();
  // await example4();
  // await example5();

  console.log('\n✓ Examples completed');
  console.log('\nNote: Uncomment the example calls in main() to run them.');
  console.log('Make sure you have valid AWS credentials and Bedrock access configured.');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { example1, example2, example3, example4, example5 };
