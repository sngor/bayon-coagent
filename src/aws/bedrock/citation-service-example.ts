/**
 * Citation Service Usage Example
 * 
 * Demonstrates how to use the CitationService for the Kiro AI Assistant
 */

import { CitationService, Citation } from './citation-service';
import { CitationRepository } from './citation-repository';

/**
 * Example 1: Adding and formatting a single citation
 */
export async function exampleSingleCitation() {
  const service = new CitationService();

  // Create a citation
  const citation = await service.addCitation(
    'The median home price in Austin increased by 8.2% year-over-year',
    {
      url: 'https://example.com/austin-q4-2024-report',
      title: 'Austin Q4 2024 Housing Report',
      sourceType: 'market-report',
    }
  );

  console.log('Citation created:', citation);
  console.log('Validated:', citation.validated);

  // Format the citation
  const formatted = await service.formatCitations(
    'The median home price in Austin increased by 8.2% year-over-year',
    [citation]
  );

  console.log('Formatted text:', formatted);
}

/**
 * Example 2: Extracting citations from AI response
 */
export async function exampleExtractCitations() {
  const service = new CitationService();

  const aiResponse = `
    According to recent data, the Austin real estate market is showing strong growth.
    [Market Report Q4 2024](https://example.com/market-report) indicates an 8.2% increase
    in median home prices. Additionally, [MLS data](https://mls.example.com/data) shows
    inventory levels have decreased by 15%.
  `;

  // Extract citations from the response
  const citations = await service.extractCitations(aiResponse);

  console.log('Extracted citations:', citations.length);
  citations.forEach((citation, index) => {
    console.log(`Citation ${index + 1}:`, {
      title: citation.title,
      url: citation.url,
      sourceType: citation.sourceType,
      validated: citation.validated,
    });
  });
}

/**
 * Example 3: Formatting response with numbered citations
 */
export async function exampleNumberedCitations() {
  const service = new CitationService();

  const citations: Citation[] = [
    {
      id: 'cite1',
      url: 'https://example.com/market-report',
      title: 'Austin Market Report Q4 2024',
      sourceType: 'market-report',
      accessedAt: new Date().toISOString(),
      validated: true,
    },
    {
      id: 'cite2',
      url: 'https://mls.example.com/listing/12345',
      title: 'MLS Listing #12345',
      sourceType: 'mls',
      accessedAt: new Date().toISOString(),
      validated: false, // URL validation failed or timed out
    },
  ];

  const response = `
    The Austin luxury real estate market is experiencing significant growth.
    Median prices have increased by 8.2% year-over-year, with inventory
    levels decreasing by 15%. This trend is expected to continue into 2025.
  `;

  const formatted = service.formatWithNumberedCitations(response, citations);

  console.log('Formatted response with citations:');
  console.log(formatted);
}

/**
 * Example 4: Storing citations in DynamoDB
 */
export async function exampleStoreCitations() {
  const service = new CitationService();
  const userId = 'user123';
  const conversationId = 'conv456';

  // Create citations
  const citations: Citation[] = [
    {
      id: 'cite1',
      url: 'https://example.com/report',
      title: 'Market Report',
      sourceType: 'market-report',
      accessedAt: new Date().toISOString(),
      validated: true,
    },
  ];

  // Store citations
  const stored = await service.storeCitations(
    userId,
    citations,
    conversationId
  );

  console.log('Stored citations:', stored.length);

  // Retrieve citations for the conversation
  const retrieved = await service.getCitationsForConversation(
    userId,
    conversationId
  );

  console.log('Retrieved citations:', retrieved.length);
}

/**
 * Example 5: Handling unvalidated URLs with fallback
 */
export async function exampleFallbackCitation() {
  const service = new CitationService();

  // Create a citation with a URL that might not be accessible
  const citation = await service.createCitationWithFallback(
    'https://example.com/potentially-unavailable-report',
    'Market Analysis Report',
    'market-report',
    2000 // 2 second timeout
  );

  console.log('Citation created with fallback:');
  console.log('URL:', citation.url);
  console.log('Validated:', citation.validated);

  // Format the citation - will include "accessibility not verified" if validation failed
  const formatted = service.formatWithNumberedCitations(
    'Market analysis shows positive trends.',
    [citation]
  );

  console.log('Formatted with fallback notation:');
  console.log(formatted);
}

/**
 * Example 6: Batch URL validation
 */
export async function exampleBatchValidation() {
  const service = new CitationService();

  const urls = [
    'https://example.com/report1',
    'https://example.com/report2',
    'https://example.com/report3',
  ];

  // Validate all URLs in parallel
  const validationResults = await service.validateURLsBatch(urls, 5000);

  console.log('Batch validation results:');
  validationResults.forEach((isValid, url) => {
    console.log(`${url}: ${isValid ? 'Valid' : 'Invalid'}`);
  });
}

/**
 * Example 7: Complete workflow - Extract, Store, and Format
 */
export async function exampleCompleteWorkflow() {
  const service = new CitationService();
  const userId = 'user123';
  const conversationId = 'conv789';

  // Simulate AI response with embedded citations
  const aiResponse = `
    The Austin real estate market continues to show strong performance.
    According to [recent market data](https://example.com/austin-market-2024),
    median home prices have increased by 8.2% year-over-year. This growth is
    supported by [MLS statistics](https://mls.example.com/austin-stats) showing
    decreased inventory levels.
  `;

  // Extract citations from the response
  const citations = await service.extractCitations(aiResponse);
  console.log(`Extracted ${citations.length} citations`);

  // Store citations in DynamoDB
  const stored = await service.storeCitations(
    userId,
    citations,
    conversationId
  );
  console.log(`Stored ${stored.length} citations`);

  // Format the response with numbered citations
  const formatted = service.formatWithNumberedCitations(aiResponse, citations);
  console.log('Final formatted response:');
  console.log(formatted);

  // Get citation statistics
  const stats = await service.getCitationStats(userId);
  console.log('Citation statistics:', stats);
}

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    console.log('=== Example 1: Single Citation ===');
    await exampleSingleCitation();

    console.log('\n=== Example 2: Extract Citations ===');
    await exampleExtractCitations();

    console.log('\n=== Example 3: Numbered Citations ===');
    await exampleNumberedCitations();

    console.log('\n=== Example 5: Fallback Citation ===');
    await exampleFallbackCitation();

    console.log('\n=== Example 6: Batch Validation ===');
    await exampleBatchValidation();
  })();
}
