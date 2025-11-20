/**
 * Guardrails & Safety Service
 * 
 * Enforces safety constraints and validates all requests before AI processing.
 * Implements domain validation, PII detection, and ethical constraint enforcement.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

/**
 * Guardrails configuration
 */
export interface GuardrailsConfig {
  allowedDomains: string[];
  blockedTopics: string[];
  piiDetectionEnabled: boolean;
  maxPromptLength: number;
}

/**
 * Guardrails validation result
 */
export interface GuardrailsResult {
  allowed: boolean;
  reason?: string;
  sanitizedPrompt?: string;
  detectedPII?: string[];
}

/**
 * PII pattern generators (to avoid global flag state issues)
 */
const getPIIPatterns = () => ({
  SSN: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g,
  CREDIT_CARD: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Note: We're more lenient with addresses as they're often needed in real estate context
});

/**
 * Real estate domain keywords
 */
const REAL_ESTATE_KEYWORDS = [
  'property', 'real estate', 'house', 'home', 'listing', 'market', 'buyer', 'seller',
  'agent', 'broker', 'mls', 'mortgage', 'appraisal', 'inspection', 'closing',
  'neighborhood', 'location', 'price', 'value', 'investment', 'rental', 'lease',
  'commercial', 'residential', 'land', 'lot', 'square feet', 'bedroom', 'bathroom',
  'kitchen', 'garage', 'yard', 'hoa', 'zoning', 'title', 'deed', 'equity',
  'staging', 'curb appeal', 'open house', 'showing', 'offer', 'contract',
  'contingency', 'escrow', 'commission', 'client', 'lead', 'prospect',
  'marketing', 'advertising', 'social media', 'website', 'seo', 'content',
  'luxury', 'first-time buyer', 'foreclosure', 'short sale', 'flip',
];

/**
 * Financial guarantee patterns
 */
const GUARANTEE_PATTERNS = [
  /\bguarantee\b/i,
  /\bpromise\b.*\breturn/i,
  /\bensure\b.*\bprofit/i,
  /\bcertain\b.*\bgain/i,
  /\bwill\b.*\bmake\b.*\bmoney/i,
  /\bguaranteed\b.*\bincome/i,
];

/**
 * Legal advice patterns
 */
const LEGAL_ADVICE_PATTERNS = [
  /\blegal\b.*\badvice/i,
  /\bshould\b.*\bsue/i,
  /\bcontract\b.*\bvalid/i,
  /\blawsuit/i,
  /\blitigation/i,
  /\bcourt\b.*\bcase/i,
];

/**
 * Unethical/illegal activity patterns
 */
const UNETHICAL_PATTERNS = [
  /\bdiscriminat/i,
  /\bredlining/i,
  /\bsteering\b/i,
  /\bfraud/i,
  /\bmisrepresent/i,
  /\bhide\b.*\bdefect/i,
  /\bconceal\b.*\bissue/i,
  /\bfake\b.*\breview/i,
  /\bmanipulat.*\bprice/i,
];

/**
 * Guardrails Service class
 * Validates requests and enforces safety constraints
 */
export class GuardrailsService {
  /**
   * Validates a request against guardrails
   * 
   * Requirements:
   * - 1.1: Domain validation (real estate only)
   * - 1.2: Financial guarantee and legal advice detection
   * - 1.3: PII detection and sanitization
   * - 1.4: Unethical/illegal activity detection
   * 
   * @param prompt User's prompt
   * @param config Guardrails configuration
   * @returns Validation result
   */
  validateRequest(prompt: string, config: GuardrailsConfig): GuardrailsResult {
    // Check prompt length
    if (prompt.length > config.maxPromptLength) {
      return {
        allowed: false,
        reason: `Prompt exceeds maximum length of ${config.maxPromptLength} characters`,
      };
    }

    // Check for unethical/illegal content first (Requirement 1.4)
    if (this.containsUnethicalContent(prompt)) {
      return {
        allowed: false,
        reason: 'Query involves unethical or illegal activities',
      };
    }

    // Check for financial guarantees or legal advice (Requirement 1.2)
    if (this.requestsFinancialGuarantee(prompt)) {
      return {
        allowed: false,
        reason: 'Cannot provide financial guarantees or investment advice',
      };
    }

    if (this.requestsLegalAdvice(prompt)) {
      return {
        allowed: false,
        reason: 'Cannot provide legal advice',
      };
    }

    // Check domain (Requirement 1.1)
    if (!this.isRealEstateDomain(prompt)) {
      return {
        allowed: false,
        reason: 'Query is not related to real estate',
      };
    }

    // Detect and sanitize PII (Requirement 1.3)
    let sanitizedPrompt = prompt;
    const detectedPII: string[] = [];

    if (config.piiDetectionEnabled) {
      const piiResult = this.detectAndSanitizePII(prompt);
      if (piiResult.detected.length > 0) {
        sanitizedPrompt = piiResult.sanitized;
        detectedPII.push(...piiResult.detected);
      }
    }

    return {
      allowed: true,
      sanitizedPrompt: detectedPII.length > 0 ? sanitizedPrompt : undefined,
      detectedPII: detectedPII.length > 0 ? detectedPII : undefined,
    };
  }

  /**
   * Checks if prompt is within real estate domain
   * Requirement 1.1: Domain validation
   * 
   * @param prompt User's prompt
   * @returns True if real estate related
   */
  isRealEstateDomain(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();

    // Check for real estate keywords
    const hasRealEstateKeyword = REAL_ESTATE_KEYWORDS.some(keyword =>
      lowerPrompt.includes(keyword.toLowerCase())
    );

    if (hasRealEstateKeyword) {
      return true;
    }

    // Check for common real estate phrases
    const realEstatePhrases = [
      'buy a home',
      'sell my house',
      'market analysis',
      'property value',
      'home price',
      'listing description',
      'open house',
      'real estate market',
      'housing market',
      'property search',
    ];

    return realEstatePhrases.some(phrase => lowerPrompt.includes(phrase));
  }

  /**
   * Checks if prompt requests financial guarantees
   * Requirement 1.2: Financial guarantee detection
   * 
   * @param prompt User's prompt
   * @returns True if requests guarantees
   */
  requestsFinancialGuarantee(prompt: string): boolean {
    return GUARANTEE_PATTERNS.some(pattern => pattern.test(prompt));
  }

  /**
   * Checks if prompt requests legal advice
   * Requirement 1.2: Legal advice detection
   * 
   * @param prompt User's prompt
   * @returns True if requests legal advice
   */
  requestsLegalAdvice(prompt: string): boolean {
    return LEGAL_ADVICE_PATTERNS.some(pattern => pattern.test(prompt));
  }

  /**
   * Checks if prompt contains unethical or illegal content
   * Requirement 1.4: Unethical activity detection
   * 
   * @param prompt User's prompt
   * @returns True if contains unethical content
   */
  containsUnethicalContent(prompt: string): boolean {
    return UNETHICAL_PATTERNS.some(pattern => pattern.test(prompt));
  }

  /**
   * Detects PII in text
   * Requirement 1.3: PII detection
   * 
   * @param text Text to scan
   * @returns Array of detected PII types
   */
  detectPII(text: string): string[] {
    const detected: string[] = [];
    const patterns = getPIIPatterns();

    if (patterns.SSN.test(text)) {
      detected.push('SSN');
    }
    if (patterns.CREDIT_CARD.test(text)) {
      detected.push('CREDIT_CARD');
    }
    if (patterns.PHONE.test(text)) {
      detected.push('PHONE');
    }
    if (patterns.EMAIL.test(text)) {
      detected.push('EMAIL');
    }

    return detected;
  }

  /**
   * Detects and sanitizes PII from text
   * Requirement 1.3: PII sanitization
   * 
   * @param text Text to sanitize
   * @returns Sanitized text and detected PII types
   */
  detectAndSanitizePII(text: string): {
    sanitized: string;
    detected: string[];
  } {
    let sanitized = text;
    const detected: string[] = [];
    const patterns = getPIIPatterns();

    // Sanitize SSN
    if (patterns.SSN.test(sanitized)) {
      const ssnPattern = getPIIPatterns().SSN; // Get fresh pattern for replace
      sanitized = sanitized.replace(ssnPattern, '[SSN REDACTED]');
      detected.push('SSN');
    }

    // Sanitize credit card
    if (patterns.CREDIT_CARD.test(sanitized)) {
      const ccPattern = getPIIPatterns().CREDIT_CARD; // Get fresh pattern for replace
      sanitized = sanitized.replace(ccPattern, '[CREDIT CARD REDACTED]');
      detected.push('CREDIT_CARD');
    }

    // Sanitize phone (but be lenient as phone numbers are common in real estate)
    // Only redact if it looks like a personal phone number in context
    const phonePattern = getPIIPatterns().PHONE;
    const phoneMatches = sanitized.match(phonePattern);
    if (phoneMatches && phoneMatches.length > 0) {
      // Check context - if it's clearly a personal phone, redact it
      const hasPersonalContext = /my phone|my number|call me at|reach me at/i.test(sanitized);
      if (hasPersonalContext) {
        const phoneReplacePattern = getPIIPatterns().PHONE; // Get fresh pattern for replace
        sanitized = sanitized.replace(phoneReplacePattern, '[PHONE REDACTED]');
        detected.push('PHONE');
      }
    }

    // Sanitize email (but be lenient as emails are common in real estate)
    const emailPattern = getPIIPatterns().EMAIL;
    const emailMatches = sanitized.match(emailPattern);
    if (emailMatches && emailMatches.length > 0) {
      // Check context - if it's clearly a personal email, redact it
      const hasPersonalContext = /my email|email me at|contact me at/i.test(sanitized);
      if (hasPersonalContext) {
        const emailReplacePattern = getPIIPatterns().EMAIL; // Get fresh pattern for replace
        sanitized = sanitized.replace(emailReplacePattern, '[EMAIL REDACTED]');
        detected.push('EMAIL');
      }
    }

    return { sanitized, detected };
  }

  /**
   * Sanitizes prompt by removing detected PII
   * Requirement 1.3: PII sanitization
   * 
   * @param prompt Prompt to sanitize
   * @returns Sanitized prompt
   */
  sanitizePrompt(prompt: string): string {
    return this.detectAndSanitizePII(prompt).sanitized;
  }
}

/**
 * Singleton instance
 */
let guardrailsServiceInstance: GuardrailsService | null = null;

/**
 * Gets the singleton guardrails service instance
 */
export function getGuardrailsService(): GuardrailsService {
  if (!guardrailsServiceInstance) {
    guardrailsServiceInstance = new GuardrailsService();
  }
  return guardrailsServiceInstance;
}

/**
 * Resets the guardrails service singleton (useful for testing)
 */
export function resetGuardrailsService(): void {
  guardrailsServiceInstance = null;
}
