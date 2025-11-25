/**
 * Parallel Search Agent - Example Usage
 * 
 * Demonstrates how to use the ParallelSearchAgent for cross-platform validation
 */

import { ParallelSearchAgent, PlatformAPIConfig } from './parallel-search-agent';
import { ParallelSearchInput } from '@/ai/schemas/parallel-search-schemas';

/**
 * Example 1: Basic parallel search across all platforms
 */
async function basicParallelSearch() {
  // Configure API keys for external platforms
  const config: PlatformAPIConfig = {
    chatgpt: {
      apiKey: process.env.CHATGPT_API_KEY || '',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
    },
  };

  const agent = new ParallelSearchAgent(config);

  const input: ParallelSearchInput = {
    query: 'What are the current real estate market trends in Seattle, Washington?',
    platforms: ['chatgpt', 'gemini', 'claude'],
  };

  const result = await agent.search(input);

  console.log('=== Parallel Search Results ===');
  console.log('\nSummary:', result.summary);
  console.log('\nConsensus Points:');
  result.consensus.forEach((point, i) => {
    console.log(`  ${i + 1}. ${point}`);
  });
  console.log('\nDiscrepancies:');
  result.discrepancies.forEach((disc, i) => {
    console.log(`  ${i + 1}. ${disc}`);
  });

  console.log('\n=== Individual Platform Results ===');
  result.results.forEach((platformResult) => {
    console.log(`\n${platformResult.platform.toUpperCase()}:`);
    if (platformResult.error) {
      console.log(`  Error: ${platformResult.error}`);
    } else {
      console.log(`  Response: ${platformResult.response.substring(0, 200)}...`);
      console.log(`  Sources: ${platformResult.sources.length} found`);
    }
  });
}

/**
 * Example 2: Agent visibility search
 */
async function agentVisibilitySearch() {
  const config: PlatformAPIConfig = {
    chatgpt: {
      apiKey: process.env.CHATGPT_API_KEY || '',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
    },
  };

  const agent = new ParallelSearchAgent(config);

  const input: ParallelSearchInput = {
    query: 'Who are the top luxury real estate agents in Miami?',
    platforms: ['chatgpt', 'gemini', 'claude'],
    agentName: 'Jane Smith',
    firmName: 'Smith Luxury Realty',
  };

  const result = await agent.search(input);

  console.log('=== Agent Visibility Report ===');
  console.log('\nAgent Mentioned:', result.agentVisibility.mentioned);
  console.log('Platforms:', result.agentVisibility.platforms.join(', '));
  console.log('Rankings:', JSON.stringify(result.agentVisibility.rankings, null, 2));
}

/**
 * Example 3: Selective platform search (only available platforms)
 */
async function selectivePlatformSearch() {
  // Only configure ChatGPT and Claude
  const config: PlatformAPIConfig = {
    chatgpt: {
      apiKey: process.env.CHATGPT_API_KEY || '',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
    },
  };

  const agent = new ParallelSearchAgent(config);

  const input: ParallelSearchInput = {
    query: 'What are the best practices for staging a luxury home?',
    platforms: ['chatgpt', 'claude'], // Only use configured platforms
  };

  const result = await agent.search(input);

  console.log('=== Selective Platform Search ===');
  console.log('\nSummary:', result.summary);
  console.log('\nSuccessful Platforms:');
  result.results
    .filter((r) => !r.error)
    .forEach((r) => {
      console.log(`  - ${r.platform}`);
    });
}

/**
 * Example 4: High-stakes data validation
 */
async function highStakesValidation() {
  const config: PlatformAPIConfig = {
    chatgpt: {
      apiKey: process.env.CHATGPT_API_KEY || '',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
    },
  };

  const agent = new ParallelSearchAgent(config);

  const input: ParallelSearchInput = {
    query:
      'What are the legal requirements for real estate disclosures in Washington?',
    platforms: ['chatgpt', 'gemini', 'claude'],
  };

  const result = await agent.search(input);

  console.log('=== High-Stakes Validation ===');
  console.log('\nQuery:', input.query);
  console.log('\nConsensus (Cross-validated facts):');
  result.consensus.forEach((point, i) => {
    console.log(`  ${i + 1}. ${point}`);
  });

  if (result.discrepancies.length > 0) {
    console.log('\n⚠️  DISCREPANCIES FOUND - Manual review recommended:');
    result.discrepancies.forEach((disc, i) => {
      console.log(`  ${i + 1}. ${disc}`);
    });
  }

  console.log('\nSources collected:');
  const allSources = new Set<string>();
  result.results.forEach((r) => {
    r.sources.forEach((s) => allSources.add(s));
  });
  Array.from(allSources).forEach((source, i) => {
    console.log(`  ${i + 1}. ${source}`);
  });
}

/**
 * Example 5: Error handling and graceful degradation
 */
async function errorHandlingExample() {
  // Intentionally misconfigure one platform
  const config: PlatformAPIConfig = {
    chatgpt: {
      apiKey: 'invalid-key', // This will fail
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
    },
  };

  const agent = new ParallelSearchAgent(config);

  const input: ParallelSearchInput = {
    query: 'What is the average home price in Seattle?',
    platforms: ['chatgpt', 'gemini', 'claude'],
  };

  const result = await agent.search(input);

  console.log('=== Error Handling Example ===');
  console.log('\nSummary:', result.summary);

  console.log('\nPlatform Status:');
  result.results.forEach((r) => {
    if (r.error) {
      console.log(`  ❌ ${r.platform}: ${r.error}`);
    } else {
      console.log(`  ✅ ${r.platform}: Success`);
    }
  });

  const successfulCount = result.results.filter((r) => !r.error).length;
  console.log(
    `\n${successfulCount}/${result.results.length} platforms responded successfully`
  );
}

// Export examples for testing
export {
  basicParallelSearch,
  agentVisibilitySearch,
  selectivePlatformSearch,
  highStakesValidation,
  errorHandlingExample,
};

// Run examples if executed directly
if (require.main === module) {
  (async () => {
    console.log('Running Parallel Search Agent Examples...\n');

    try {
      await basicParallelSearch();
      console.log('\n' + '='.repeat(50) + '\n');

      await agentVisibilitySearch();
      console.log('\n' + '='.repeat(50) + '\n');

      await selectivePlatformSearch();
      console.log('\n' + '='.repeat(50) + '\n');

      await highStakesValidation();
      console.log('\n' + '='.repeat(50) + '\n');

      await errorHandlingExample();
    } catch (error) {
      console.error('Error running examples:', error);
    }
  })();
}
