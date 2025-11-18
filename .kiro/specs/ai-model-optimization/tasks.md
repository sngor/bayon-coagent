# Implementation Plan

- [ ] 1. Set up model configuration infrastructure

  - Create model constants and configuration presets in flow-base.ts
  - Add TypeScript types for model configurations
  - Add helper functions for model selection
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [ ] 1.1 Write property test for model configuration

  - **Property 1: Model selection matches feature complexity**
  - **Validates: Requirements 1.1, 1.2, 2.1, 2.2**

- [ ] 2. Update short-form content generation flows with Haiku

  - Update generate-agent-bio.ts to use Haiku with SIMPLE config
  - Update analyze-review-sentiment.ts to use Haiku with SIMPLE config
  - Update generate-social-media-post.ts to use Haiku with CREATIVE config
  - Update listing-description-generator.ts to use Haiku with CREATIVE config
  - _Requirements: 11.1, 11.2, 11.3, 13.1_

- [ ] 2.1 Write property test for temperature configuration

  - **Property 2: Temperature configuration matches feature type**
  - **Validates: Requirements 1.3, 1.4, 13.3**

- [ ] 2.2 Write property test for Twitter character limits

  - **Property 15: Twitter posts respect character limits**
  - **Validates: Requirements 11.5**

- [ ] 3. Update long-form content generation flows with Sonnet 3.5

  - Update generate-blog-post.ts to use Sonnet 3.5 with LONG_FORM config (8K tokens)
  - Update generate-neighborhood-guides.ts to use Sonnet 3.5 with LONG_FORM config
  - Update run-research-agent.ts to use Sonnet 3.5 with LONG_FORM config (8K tokens)
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 3.1 Write property test for token limits

  - **Property 3: Token limits match content length requirements**
  - **Validates: Requirements 2.5, 10.3**

- [ ] 4. Update structured content generation flows with Sonnet 3.5

  - Update generate-video-script.ts to use Sonnet 3.5 with CREATIVE config
  - Update generate-listing-faqs.ts to use Sonnet 3.5 with BALANCED config
  - Update generate-market-update.ts to use Sonnet 3.5 with BALANCED config
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 4.1 Write property test for schema validation

  - **Property 4: Schema validation ensures output completeness**
  - **Validates: Requirements 4.1, 4.5, 12.4, 12.5**

- [ ] 5. Update analysis flows with appropriate models

  - Update analyze-multiple-reviews.ts to use Sonnet 3.5 with ANALYTICAL config
  - Update generate-marketing-plan.ts to use Sonnet 3.5 with BALANCED config
  - Verify temperature settings for analytical accuracy
  - _Requirements: 13.2, 14.1, 14.4_

- [ ] 5.1 Write property test for marketing plan structure

  - **Property 16: Marketing plans have exactly 3 tasks**
  - **Validates: Requirements 14.2, 14.3**

- [ ] 5.2 Write property test for review analysis output

  - **Property 17: Review analysis extracts keywords and themes**
  - **Validates: Requirements 13.4**

- [ ] 6. Update brand audit flows with Sonnet 3.5

  - Update run-nap-audit.ts to use Sonnet 3.5 with ANALYTICAL config
  - Ensure low temperature for accurate data extraction
  - Verify web search integration works correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6.1 Write property test for NAP comparison logic

  - **Property 11: NAP comparison ignores formatting differences**
  - **Validates: Requirements 7.3**

- [ ] 6.2 Write property test for missing profile handling

  - **Property 12: Missing profiles return "Not Found"**
  - **Validates: Requirements 7.4**

- [ ] 7. Update competitive analysis flows with Sonnet 3.5

  - Update find-competitors.ts (both functions) to use Sonnet 3.5 with ANALYTICAL config
  - Update get-keyword-rankings.ts to use Sonnet 3.5 with ANALYTICAL config
  - Ensure proper handling of missing data (return zeros, not hallucinations)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 7.1 Write property test for competitor discovery

  - **Property 13: Competitor discovery returns 3-5 results**
  - **Validates: Requirements 8.1**

- [ ] 7.2 Write property test for missing data handling

  - **Property 10: Missing data returns zeros not hallucinations**
  - **Validates: Requirements 8.4**

- [ ] 7.3 Write property test for keyword rankings

  - **Property 14: Keyword rankings return up to 5 results**
  - **Validates: Requirements 9.2, 9.4**

- [ ] 8. Enhance error handling and retry logic

  - Update BedrockClient to improve retry logic for throttling and timeouts
  - Add better error messages for parse failures
  - Implement input truncation for oversized inputs
  - Add detailed error logging with model ID and flow name
  - _Requirements: 4.2, 4.3, 5.2, 5.4, 5.5_

- [ ] 8.1 Write property test for retry behavior

  - **Property 8: Retryable errors trigger retry logic**
  - **Validates: Requirements 4.2, 5.2**

- [ ] 8.2 Write property test for input validation

  - **Property 7: Input validation precedes model invocation**
  - **Validates: Requirements 4.4**

- [ ] 9. Improve search failure handling

  - Update NAP audit to gracefully handle search failures
  - Update competitor analysis to fall back when search unavailable
  - Update keyword rankings to handle search errors
  - Ensure no crashes when external services fail
  - _Requirements: 5.1, 5.3_

- [ ] 9.1 Write property test for search failure handling

  - **Property 9: Search failures don't crash flows**
  - **Validates: Requirements 5.1**

- [ ] 10. Add model configuration override capability

  - Update definePrompt to support runtime model override
  - Add tests for model override functionality
  - Document how to override models for testing
  - _Requirements: 3.1, 3.5_

- [ ] 10.1 Write property test for model override

  - **Property 5: Model configuration is overridable**
  - **Validates: Requirements 3.1, 3.5**

- [ ] 10.2 Write property test for default fallback

  - **Property 6: Default model fallback works**
  - **Validates: Requirements 3.2**

- [ ] 11. Implement execution logging and metrics

  - Add logging for model selection, execution time, and token usage
  - Add error logging with detailed debugging information
  - Create FlowExecutionLog type and logging utilities
  - Add CloudWatch integration for metrics tracking
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ] 11.1 Write property test for execution logging

  - **Property 18: Execution metrics are logged**
  - **Validates: Requirements 15.1, 15.2, 15.3**

- [ ] 11.2 Write property test for error logging

  - **Property 20: Error logs contain debugging information**
  - **Validates: Requirements 5.5**

- [ ] 12. Add performance monitoring

  - Implement execution time tracking for all flows
  - Add performance benchmarks for Haiku vs Sonnet features
  - Create performance alerts for slow executions
  - Document expected performance for each feature
  - _Requirements: 1.5, 15.4_

- [ ] 12.1 Write property test for performance expectations

  - **Property 21: Performance meets expectations**
  - **Validates: Requirements 1.5**

- [ ] 13. Create model configuration documentation

  - Document model selection rationale for each feature
  - Create configuration guide for adding new flows
  - Document how to test and benchmark new models
  - Add examples of model override for experimentation
  - _Requirements: 2.4, 3.4_

- [ ] 14. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Update environment configuration

  - Add model configuration to .env.local and .env.production
  - Document required environment variables
  - Add validation for model IDs in config
  - _Requirements: 3.2, 3.4_

- [ ] 16. Create cost tracking utilities

  - Implement token usage tracking per feature
  - Calculate cost per feature invocation
  - Create cost comparison report (before/after optimization)
  - Add cost monitoring dashboard data
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 17. Integration testing with real API calls

  - Test all flows with real Bedrock API in staging
  - Verify model selection works correctly
  - Measure actual performance and token usage
  - Validate cost savings vs single-model approach
  - _Requirements: All_

- [ ] 18. Final checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Production deployment preparation

  - Create deployment checklist
  - Set up monitoring and alerting
  - Prepare rollback plan
  - Document expected improvements
  - _Requirements: All_

- [ ] 20. Performance and cost validation
  - Validate performance improvements in production
  - Validate cost savings in production
  - Monitor error rates and success rates
  - Gather user feedback on response quality
  - _Requirements: 1.5, 2.1, 2.2, 2.3, 15.3, 15.4_
