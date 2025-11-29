/**
 * Google AI (Gemini) Client Configuration
 * 
 * This module provides a configured client for Google AI's Gemini models,
 * specifically for image generation tasks in the Reimagine toolkit.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getConfig } from '@/aws/config';

// ============================================================================
// Constants
// ============================================================================

/**
 * Gemini 2.5 Flash Image model for image analysis and generation
 * This model is specifically designed for image understanding and generation tasks
 */
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

/**
 * Gemini 1.5 Flash model for text and document analysis
 * This model is fast and supports large context windows (1M tokens)
 */
export const GEMINI_TEXT_MODEL = 'gemini-1.5-flash';

/**
 * Default generation config for image tasks
 */
export const DEFAULT_GENERATION_CONFIG = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
};

/**
 * Default generation config for text tasks
 */
export const DEFAULT_TEXT_GENERATION_CONFIG = {
    temperature: 0.2, // Lower temperature for more analytical/factual responses
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
};

// ============================================================================
// Client Setup
// ============================================================================

let googleAI: GoogleGenerativeAI | null = null;

/**
 * Gets or creates the Google AI client instance
 */
export function getGoogleAIClient(): GoogleGenerativeAI {
    if (!googleAI) {
        const config = getConfig();

        if (!config.googleAI?.apiKey) {
            throw new Error('Google AI API key not configured. Please set GOOGLE_AI_API_KEY environment variable.');
        }

        googleAI = new GoogleGenerativeAI(config.googleAI.apiKey);
    }

    return googleAI;
}

/**
 * Gets a configured Gemini model instance for image generation
 */
export function getGeminiImageModel() {
    const client = getGoogleAIClient();
    return client.getGenerativeModel({
        model: GEMINI_IMAGE_MODEL,
        generationConfig: DEFAULT_GENERATION_CONFIG,
    });
}

/**
 * Gets a configured Gemini model instance for text/document analysis
 */
export function getGeminiTextModel() {
    const client = getGoogleAIClient();
    return client.getGenerativeModel({
        model: GEMINI_TEXT_MODEL,
        generationConfig: DEFAULT_TEXT_GENERATION_CONFIG,
    });
}

/**
 * Converts a base64 image to the format expected by Gemini
 */
export function prepareImageForGemini(base64Data: string, mimeType: string) {
    return {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
}

/**
 * Gets the appropriate MIME type for image format
 */
export function getImageMimeType(format: string): string {
    switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        default:
            return 'image/jpeg';
    }
}