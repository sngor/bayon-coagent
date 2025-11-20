/**
 * Guardrails Service Usage Example
 * 
 * Demonstrates how to use the GuardrailsService in your application
 */

import { getGuardrailsService, GuardrailsConfig } from './guardrails';

/**
 * Example: Validating user input before processing
 */
export async function processUserQuery(userPrompt: string): Promise<string> {
  const guardrails = getGuardrailsService();
  
  // Configure guardrails
  const config: GuardrailsConfig = {
    allowedDomains: ['real-estate'],
    blockedTopics: ['illegal', 'unethical'],
    piiDetectionEnabled: true,
    maxPromptLength: 10000,
  };

  // Validate the request
  const result = guardrails.validateRequest(userPrompt, config);

  // Handle validation failures
  if (!result.allowed) {
    switch (result.reason) {
      case 'Query is not related to real estate':
        return "I can only assist with real estate-related questions. Would you like help with property listings, market analysis, or client communication?";
      
      case 'Cannot provide financial guarantees or investment advice':
        return "I cannot provide financial guarantees. For investment advice, please consult a licensed financial advisor. I can help you understand historical market trends instead.";
      
      case 'Cannot provide legal advice':
        return "I cannot provide legal advice. For legal matters, please consult a licensed attorney. I can help you with general real estate information instead.";
      
      case 'Query involves unethical or illegal activities':
        return "I cannot assist with that request.";
      
      default:
        return `I cannot process this request: ${result.reason}`;
    }
  }

  // Handle PII detection
  if (result.detectedPII && result.detectedPII.length > 0) {
    console.warn(`PII detected and sanitized: ${result.detectedPII.join(', ')}`);
    
    // Use the sanitized prompt instead of the original
    const promptToProcess = result.sanitizedPrompt || userPrompt;
    
    // Continue processing with sanitized prompt
    return processWithAI(promptToProcess);
  }

  // Process the validated prompt
  return processWithAI(userPrompt);
}

/**
 * Mock AI processing function
 */
async function processWithAI(prompt: string): Promise<string> {
  // This would call your actual AI service (Bedrock, etc.)
  return `Processing: ${prompt}`;
}

/**
 * Example: Pre-validation before expensive AI calls
 */
export function quickValidation(prompt: string): boolean {
  const guardrails = getGuardrailsService();
  
  // Quick checks without full validation
  if (!guardrails.isRealEstateDomain(prompt)) {
    return false;
  }
  
  if (guardrails.requestsFinancialGuarantee(prompt)) {
    return false;
  }
  
  if (guardrails.requestsLegalAdvice(prompt)) {
    return false;
  }
  
  if (guardrails.containsUnethicalContent(prompt)) {
    return false;
  }
  
  return true;
}

/**
 * Example: Sanitizing user input for logging
 */
export function sanitizeForLogging(text: string): string {
  const guardrails = getGuardrailsService();
  return guardrails.sanitizePrompt(text);
}

/**
 * Example: Checking for PII before storing
 */
export function checkPIIBeforeStorage(text: string): {
  hasPII: boolean;
  types: string[];
} {
  const guardrails = getGuardrailsService();
  const detected = guardrails.detectPII(text);
  
  return {
    hasPII: detected.length > 0,
    types: detected,
  };
}
