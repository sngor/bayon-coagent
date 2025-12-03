/**
 * Quality Assurance Types
 * 
 * Type definitions for the quality assurance strand system.
 */

/**
 * Validation type categories
 */
export type ValidationType = 'factual' | 'compliance' | 'brand' | 'seo' | 'grammar';

/**
 * Issue severity levels
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue
 */
export interface ValidationIssue {
    /** Type of validation that found this issue */
    type: ValidationType;

    /** Severity level */
    severity: IssueSeverity;

    /** Human-readable message */
    message: string;

    /** Location in content (character positions) */
    location?: {
        start: number;
        end: number;
    };

    /** Suggested fix */
    suggestion?: string;
}

/**
 * Overall validation result
 */
export interface ValidationResult {
    /** Whether validation passed */
    passed: boolean;

    /** List of issues found */
    issues: ValidationIssue[];

    /** Actionable recommendations */
    recommendations: string[];

    /** Overall quality score (0-1) */
    overallScore: number;

    /** Scores by validation type */
    scoresByType: Record<ValidationType, number>;
}

/**
 * Compliance rules configuration
 */
export interface ComplianceRules {
    /** Check for fair housing violations */
    checkFairHousing: boolean;

    /** Check for discriminatory language */
    checkDiscriminatory: boolean;

    /** Check for legal compliance */
    checkLegal: boolean;

    /** Custom compliance patterns to check */
    customPatterns?: Array<{
        pattern: string;
        message: string;
        severity: IssueSeverity;
    }>;
}

/**
 * Compliance check result
 */
export interface ComplianceResult {
    /** Whether content is compliant */
    compliant: boolean;

    /** Violations found */
    violations: Array<{
        type: 'fair-housing' | 'discriminatory' | 'legal' | 'custom';
        message: string;
        location?: { start: number; end: number };
        severity: IssueSeverity;
        suggestion: string;
    }>;

    /** Overall compliance score (0-1) */
    complianceScore: number;
}

/**
 * Brand guidelines configuration
 */
export interface BrandGuidelines {
    /** Brand voice characteristics */
    voice: {
        tone: 'professional' | 'friendly' | 'authoritative' | 'casual';
        formality: 'formal' | 'semi-formal' | 'informal';
        personality: string[];
    };

    /** Messaging standards */
    messaging: {
        keyMessages: string[];
        avoidPhrases: string[];
        preferredTerminology: Record<string, string>;
    };

    /** Style preferences */
    style: {
        sentenceLength: 'short' | 'medium' | 'long' | 'varied';
        paragraphLength: 'short' | 'medium' | 'long';
        useOfEmojis: boolean;
        useOfExclamation: 'minimal' | 'moderate' | 'frequent';
    };
}

/**
 * Brand validation result
 */
export interface BrandValidationResult {
    /** Whether content matches brand guidelines */
    matchesBrand: boolean;

    /** Voice and tone alignment score (0-1) */
    voiceAlignment: number;

    /** Messaging alignment score (0-1) */
    messagingAlignment: number;

    /** Style alignment score (0-1) */
    styleAlignment: number;

    /** Overall brand score (0-1) */
    overallBrandScore: number;

    /** Specific issues found */
    issues: Array<{
        category: 'voice' | 'messaging' | 'style';
        message: string;
        suggestion: string;
    }>;
}

/**
 * SEO optimization result
 */
export interface SEOOptimization {
    /** Current SEO score (0-1) */
    currentScore: number;

    /** Keyword analysis */
    keywords: {
        primary: string[];
        secondary: string[];
        density: Record<string, number>;
        suggestions: string[];
    };

    /** Meta description suggestions */
    metaDescription: {
        current?: string;
        suggested: string;
        length: number;
        includesKeywords: boolean;
    };

    /** Structure recommendations */
    structure: {
        hasH1: boolean;
        headingHierarchy: boolean;
        paragraphLength: 'good' | 'too-long' | 'too-short';
        readabilityScore: number;
        suggestions: string[];
    };

    /** Content optimization suggestions */
    contentSuggestions: Array<{
        type: 'keyword' | 'structure' | 'readability' | 'meta';
        message: string;
        priority: 'high' | 'medium' | 'low';
    }>;
}

/**
 * Quality assurance task input
 */
export interface QualityAssuranceInput {
    /** Content to validate */
    content: string;

    /** Types of validation to perform */
    validationTypes: ValidationType[];

    /** Compliance rules (if checking compliance) */
    complianceRules?: ComplianceRules;

    /** Brand guidelines (if checking brand) */
    brandGuidelines?: BrandGuidelines;

    /** Target keywords (if checking SEO) */
    targetKeywords?: string[];

    /** Content type for context */
    contentType?: 'blog' | 'social' | 'email' | 'listing' | 'website';

    /** User ID for tracking */
    userId?: string;
}

/**
 * Comprehensive quality assurance result
 */
export interface QualityAssuranceResult {
    /** Overall validation result */
    validation: ValidationResult;

    /** Compliance check result (if requested) */
    compliance?: ComplianceResult;

    /** Brand validation result (if requested) */
    brand?: BrandValidationResult;

    /** SEO optimization result (if requested) */
    seo?: SEOOptimization;

    /** Final recommendation */
    finalRecommendation: 'approve' | 'approve-with-changes' | 'reject';

    /** Summary of key issues */
    summary: string;

    /** Prioritized action items */
    actionItems: Array<{
        priority: 'high' | 'medium' | 'low';
        action: string;
        rationale: string;
    }>;
}
