/**
 * @fileOverview Google AI Integration Index
 * 
 * Main entry point for Google AI (Gemini) integration in Bayon Coagent.
 * Provides image analysis and generation capabilities for the Reimagine toolkit.
 */

// Client and configuration
export {
    getGoogleAIClient,
    getGeminiImageModel,
    prepareImageForGemini,
    getImageMimeType,
    GEMINI_IMAGE_MODEL,
    DEFAULT_GENERATION_CONFIG
} from './client';

// All flows
export * from './flows';