/**
 * Web Search Examples
 * 
 * This file demonstrates various ways to use the web search client.
 * Run with: npx tsx src/aws/search/example.ts
 */

import { search, getSearchClient, SearchError } from './client';

/**
 * Example 1: Basic search
 */
async function basicSearchExample() {
  console.log('\n=== Example 1: Basic Search ===\n');
  
  try {
    const results = await search('real estate agents San Francisco');
    
    console.log(`Found ${results.results.length} results for: "${results.query}"`);
    
    results.results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Content: ${result.content.substring(0, 150)}...`);
    });
  } catch (error) {
    if (error instanceof SearchError) {
      console.error('Search failed:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example 2: Advanced search with options
 */
async function advancedSearchExample() {
  console.log('\n=== Example 2: Advanced Search ===\n');
  
  try {
    const client = getSearchClient('tavily');
    
    const results = await client.search('NAP consistency real estate', {
      maxResults: 5,
      searchDepth: 'advanced',
      includeAnswer: true,
      includeDomains: ['zillow.com', 'realtor.com'],
    });
    
    if (results.answer) {
      console.log('AI Answer:', results.answer);
      console.log('');
    }
    
    console.log(`Found ${results.results.length} results`);
    
    results.results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.title}`);
      console.log(`   Score: ${result.score || 'N/A'}`);
      console.log(`   URL: ${result.url}`);
    });
  } catch (error) {
    if (error instanceof SearchError) {
      console.error('Search failed:', error.message);
    }
  }
}

/**
 * Example 3: Format results for AI
 */
async function formatForAIExample() {
  console.log('\n=== Example 3: Format for AI ===\n');
  
  try {
    const client = getSearchClient();
    
    const results = await client.search('real estate market trends 2024', {
      maxResults: 3,
    });
    
    // Format for AI consumption
    const formatted = client.formatResultsForAI(results.results, true);
    
    console.log('Formatted for AI:\n');
    console.log(formatted);
    
    // Extract citations
    const citations = client.extractCitations(results.results);
    
    console.log('\n\nCitations:');
    citations.forEach(citation => console.log(citation));
  } catch (error) {
    if (error instanceof SearchError) {
      console.error('Search failed:', error.message);
    }
  }
}

/**
 * Example 4: Search with domain filtering
 */
async function domainFilteringExample() {
  console.log('\n=== Example 4: Domain Filtering ===\n');
  
  try {
    const client = getSearchClient();
    
    // Only search specific domains
    const results = await client.search('real estate agent reviews', {
      maxResults: 5,
      includeDomains: ['zillow.com', 'realtor.com', 'yelp.com'],
    });
    
    console.log('Results from specific domains:');
    results.results.forEach((result, i) => {
      const domain = new URL(result.url).hostname;
      console.log(`${i + 1}. ${result.title} (${domain})`);
    });
  } catch (error) {
    if (error instanceof SearchError) {
      console.error('Search failed:', error.message);
    }
  }
}

/**
 * Example 5: Error handling
 */
async function errorHandlingExample() {
  console.log('\n=== Example 5: Error Handling ===\n');
  
  try {
    // This will fail if API key is not set
    const client = getSearchClient();
    const results = await client.search('test query');
    
    console.log('✅ Search successful');
  } catch (error) {
    if (error instanceof SearchError) {
      console.error('❌ Search Error:');
      console.error('  Message:', error.message);
      console.error('  Code:', error.code);
      console.error('  Status:', error.statusCode);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

/**
 * Example 6: Using with Bedrock (simulated)
 */
async function bedrockIntegrationExample() {
  console.log('\n=== Example 6: Bedrock Integration (Simulated) ===\n');
  
  try {
    const client = getSearchClient();
    
    // 1. Perform search
    const query = 'best practices for real estate NAP consistency';
    const results = await client.search(query, {
      maxResults: 5,
      includeAnswer: true,
    });
    
    // 2. Format for AI
    const context = client.formatResultsForAI(results.results, true);
    
    // 3. Construct prompt (would be sent to Bedrock)
    const prompt = `Based on the following search results, provide a summary of best practices:

${context}

Question: ${query}

Please provide a concise summary with key points.`;
    
    console.log('Prompt constructed for Bedrock:');
    console.log('─'.repeat(80));
    console.log(prompt.substring(0, 500) + '...');
    console.log('─'.repeat(80));
    
    // In real usage, you would send this to Bedrock:
    // const bedrockClient = getBedrockClient();
    // const response = await bedrockClient.invoke(prompt, outputSchema);
    
  } catch (error) {
    if (error instanceof SearchError) {
      console.error('Search failed:', error.message);
    }
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Web Search Client Examples                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Check if API key is set
  if (!process.env.TAVILY_API_KEY && !process.env.SERPER_API_KEY) {
    console.error('\n❌ Error: No API key found!');
    console.error('Please set TAVILY_API_KEY or SERPER_API_KEY in your .env.local file\n');
    console.error('Get a free API key:');
    console.error('  - Tavily: https://app.tavily.com/sign-up');
    console.error('  - Serper: https://serper.dev/signup\n');
    return;
  }
  
  try {
    await basicSearchExample();
    await advancedSearchExample();
    await formatForAIExample();
    await domainFilteringExample();
    await errorHandlingExample();
    await bedrockIntegrationExample();
    
    console.log('\n✅ All examples completed!\n');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  basicSearchExample,
  advancedSearchExample,
  formatForAIExample,
  domainFilteringExample,
  errorHandlingExample,
  bedrockIntegrationExample,
};
