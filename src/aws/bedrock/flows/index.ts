/**
 * Bedrock AI Flows Index
 * 
 * This file exports all migrated AI flows from Genkit to Bedrock.
 * Each flow maintains the same interface as the original Genkit version
 * for backward compatibility.
 */

// Agent Bio
export { generateAgentBio, type GenerateAgentBioInput, type GenerateAgentBioOutput } from './generate-agent-bio';

// NAP Audit
export { runNapAudit, type RunNapAuditInput, type RunNapAuditOutput } from './run-nap-audit';

// Blog Post
export { generateBlogPost, type GenerateBlogPostInput, type GenerateBlogPostOutput } from './generate-blog-post';

// Market Update
export { generateMarketUpdate, type GenerateMarketUpdateInput, type GenerateMarketUpdateOutput } from './generate-market-update';

// Social Media
export { generateSocialMediaPost, type GenerateSocialMediaPostInput, type GenerateSocialMediaPostOutput } from './generate-social-media-post';

// Video Script
export { generateVideoScript, type GenerateVideoScriptInput, type GenerateVideoScriptOutput } from './generate-video-script';

// Listing FAQs
export { generateListingFaqs, type GenerateListingFaqsInput, type GenerateListingFaqsOutput } from './generate-listing-faqs';

// Neighborhood Guides
export { generateNeighborhoodGuide, type GenerateNeighborhoodGuideInput, type GenerateNeighborhoodGuideOutput } from './generate-neighborhood-guides';

// Marketing Plan
export { generateMarketingPlan, type GenerateMarketingPlanInput, type GenerateMarketingPlanOutput } from './generate-marketing-plan';

// Research Agent
export { runResearchAgent, type RunResearchAgentInput, type RunResearchAgentOutput } from './run-research-agent';

// Property Valuation
export { runPropertyValuation, type PropertyValuationInput, type PropertyValuationOutput } from './property-valuation';

// Renovation ROI
export { runRenovationROIAnalysis, type RenovationROIInput, type RenovationROIOutput } from './renovation-roi';

// Neighborhood Profile
export { runNeighborhoodProfileSynthesis, type NeighborhoodProfileInput, type NeighborhoodProfileOutput } from './neighborhood-profile-flow';

// Review Analysis
export { analyzeMultipleReviews, type AnalyzeMultipleReviewsInput, type AnalyzeMultipleReviewsOutput } from './analyze-multiple-reviews';
export { analyzeReviewSentiment, type AnalyzeReviewSentimentInput, type AnalyzeReviewSentimentOutput } from './analyze-review-sentiment';

// Competitor Analysis
export { findCompetitors, enrichCompetitorData, type FindCompetitorsInput, type FindCompetitorsOutput, type EnrichCompetitorDataInput, type EnrichCompetitorDataOutput } from './find-competitors';

// Keyword Rankings
export { getKeywordRankings, type GetKeywordRankingsInput, type GetKeywordRankingsOutput } from './get-keyword-rankings';

// AI Visibility & Monitoring
export { analyzeAIMention, type AnalyzeAIMentionInput, type AnalyzeAIMentionOutput } from './analyze-ai-mention';
export { runAISearchMonitoring, quickAIMonitoring, type AISearchMonitorInput, type AISearchMonitorOutput } from './ai-search-monitor';

// News & Reviews (API integrations, no AI)
export { getRealEstateNews, type GetRealEstateNewsInput, type GetRealEstateNewsOutput } from './get-real-estate-news';
export { getZillowReviews, type GetZillowReviewsInput, type GetZillowReviewsOutput } from './get-zillow-reviews';

// OAuth (API integration, no AI)
export { exchangeGoogleToken, type ExchangeGoogleTokenInput, type ExchangeGoogleTokenOutput } from './exchange-google-token';

// Image Generation (placeholder)
export { generateHeaderImage, type GenerateHeaderImageInput, type GenerateHeaderImageOutput } from './generate-header-image';

// Listing Description
export {
    generateNewListingDescription,
    optimizeListingDescription,
    generateListingDescription,
    type ListingDescriptionOutput
} from './listing-description-generator';

// MLS Listing Description Flow (with vision support)
export {
    generateFromPhotos,
    generateFromData,
    createListingDescriptionFlow,
    type GenerateFromPhotosInput,
    type GenerateFromDataInput,
    type ListingDescriptionOutput,
    type ListingDescriptionFlow,
    type PhotoData
} from './listing-description-flow';

// Photo Description Generation (Mobile Quick Capture)
export { generatePhotoDescription, type GeneratePhotoDescriptionInput, type GeneratePhotoDescriptionOutput } from './generate-photo-description';

// Property Photo Analysis (Mobile Quick Capture)
export { analyzePropertyPhoto, analyzePropertyPhotoWithRetry } from './analyze-property-photo';

// Audio Transcription (Mobile Voice Memo)
export { transcribeAudio, type AudioTranscriptionInput, type AudioTranscriptionOutput } from './transcribe-audio';

// Voice-to-Content Conversion (Mobile Voice Memo)
export {
    convertVoiceToContent,
    convertVoiceToBlogPost,
    convertVoiceToSocialMedia,
    convertVoiceToMarketUpdate,
    convertVoiceToNotes,
    type VoiceToContentInput,
    type VoiceToContentOutput,
    type BlogPostContent,
    type SocialMediaContent,
    type MarketUpdateContent,
    type NotesContent
} from './voice-to-content';

// Reimagine Image Toolkit
export { analyzeImage, type AnalyzeImageInput, type AnalyzeImageOutput } from './reimagine-analyze';
export { virtualStaging, type VirtualStagingInput, type VirtualStagingOutput } from './reimagine-staging';
export { dayToDusk, type DayToDuskInput, type DayToDuskOutput } from './reimagine-day-to-dusk';
export { enhanceImage, type EnhanceInput, type EnhanceOutput } from './reimagine-enhance';
export { removeItems, type ItemRemovalInput, type ItemRemovalOutput } from './reimagine-remove';
export { virtualRenovation, type VirtualRenovationInput, type VirtualRenovationOutput } from './reimagine-renovate';

/**
 * Note: The following flows from the original Genkit implementation require additional
 * dependencies or database integrations that are beyond the scope of this migration:
 * 
 * - client-management-flow: Requires Firestore integration for client data
 * - client-qa-flow: Requires tools and complex multi-step interactions
 * - cma-report-flow: Requires property search and analysis tools
 * - comparable-properties-flow: Requires property database and search functionality
 * - equity-review-flow: Simple flow, can be added if needed
 * - insurance-checkup-flow: Simple flow, can be added if needed
 * - investment-opportunity-identification: Requires property search functionality
 * - life-event-predictor-flow: Requires client database integration
 * - mortgage-calculator-flow: Mathematical calculation, no AI needed
 * - persona-driven-listing-descriptions: Similar to listing-description-generator
 * - image-enhancement-flow: Requires image generation service integration
 * - generate-training-plan-flow: Can be added if needed
 * 
 * These flows can be migrated as needed when the supporting infrastructure
 * (DynamoDB repositories, property search, etc.) is fully implemented.
 */
