/**
 * Compliance Validation System
 * 
 * Implements comprehensive compliance checking for real estate content.
 * Detects fair housing violations, discriminatory language, and legal
 * compliance issues.
 * 
 * Requirements validated:
 * - 8.2: Checks for fair housing violations and discriminatory language
 * 
 * Properties validated:
 * - Property 37: Compliance checking
 */

import { BedrockClient, getBedrockClient } from '../client';
import { z } from 'zod';
import type { ComplianceRules, ComplianceResult, IssueSeverity } from './types';

/**
 * Protected class categories under Fair Housing Act
 */
export type ProtectedClass =
    | 'race'
    | 'color'
    | 'religion'
    | 'sex'
    | 'handicap'
    | 'familial-status'
    | 'national-origin';

/**
 * Types of compliance violations
 */
export type ViolationType =
    | 'fair-housing'
    | 'discriminatory'
    | 'legal'
    | 'custom';

/**
 * Detailed violation information
 */
export interface ComplianceViolation {
    /** Type of violation */
    type: ViolationType;

    /** Human-readable message */
    message: string;

    /** Location in content */
    location?: {
        start: number;
        end: number;
    };

    /** Severity level */
    severity: IssueSeverity;

    /** Suggested fix */
    suggestion: string;

    /** Protected class affected (for fair housing violations) */
    protectedClass?: ProtectedClass;

    /** Specific regulation or law violated */
    regulation?: string;

    /** Confidence in detection (0-1) */
    confidence: number;
}

/**
 * Fair housing violation patterns
 */
interface FairHousingPattern {
    /** Pattern category */
    category: ProtectedClass;

    /** Description of the pattern */
    description: string;

    /** Example violations */
    examples: string[];

    /** Keywords or phrases that may indicate violation */
    indicators: string[];
}

/**
 * Compliance validation configuration
 */
export interface ComplianceValidatorConfig {
    /** Enable strict mode (lower tolerance for potential violations) */
    strictMode: boolean;

    /** Minimum confidence threshold for flagging violations (0-1) */
    confidenceThreshold: number;

    /** Content domain for context */
    domain: 'real-estate' | 'rental' | 'sales' | 'advertising' | 'general';

    /** Include educational explanations in results */
    includeEducation: boolean;
}

/**
 * Comprehensive compliance validation result
 */
export interface DetailedComplianceResult extends ComplianceResult {
    /** Detailed violations with full context */
    detailedViolations: ComplianceViolation[];

    /** Violations grouped by type */
    violationsByType: Record<ViolationType, ComplianceViolation[]>;

    /** Violations grouped by protected class */
    violationsByClass: Record<ProtectedClass, ComplianceViolation[]>;

    /** Educational information about violations */
    education?: {
        fairHousingOverview: string;
        relevantRegulations: string[];
        bestPractices: string[];
    };

    /** Risk assessment */
    riskAssessment: {
        overallRisk: 'low' | 'medium' | 'high' | 'critical';
        legalRisk: number; // 0-1
        reputationalRisk: number; // 0-1
        recommendations: string[];
    };
}

/**
 * ComplianceValidator - Comprehensive compliance checking system
 */
export class ComplianceValidator {
    private client: BedrockClient;

    // Fair Housing Act protected classes and common violation patterns
    private readonly fairHousingPatterns: FairHousingPattern[] = [
        {
            category: 'race',
            description: 'References to race or ethnicity',
            examples: [
                'Perfect for Asian families',
                'Great neighborhood for white professionals',
                'Diverse community',
            ],
            indicators: [
                'race', 'racial', 'ethnicity', 'ethnic', 'caucasian', 'african',
                'asian', 'hispanic', 'latino', 'white', 'black', 'diverse',
            ],
        },
        {
            category: 'color',
            description: 'References to skin color',
            examples: ['Ideal for light-skinned residents'],
            indicators: ['color', 'skin color', 'complexion'],
        },
        {
            category: 'religion',
            description: 'References to religious affiliation',
            examples: [
                'Perfect for Christian families',
                'Near synagogue',
                'Close to mosque',
                'Great for church-goers',
            ],
            indicators: [
                'religion', 'religious', 'christian', 'jewish', 'muslim',
                'catholic', 'church', 'synagogue', 'mosque', 'temple',
            ],
        },
        {
            category: 'sex',
            description: 'Gender-based preferences or restrictions',
            examples: [
                'Ideal for single men',
                'Perfect for female professionals',
                'No men allowed',
            ],
            indicators: [
                'male', 'female', 'men', 'women', 'gender', 'ladies',
                'gentlemen', 'boys', 'girls',
            ],
        },
        {
            category: 'handicap',
            description: 'References to disabilities or physical limitations',
            examples: [
                'No wheelchairs',
                'Must be able-bodied',
                'Perfect for healthy individuals',
                'Not suitable for disabled',
            ],
            indicators: [
                'handicap', 'disabled', 'disability', 'wheelchair',
                'able-bodied', 'healthy', 'physical limitations', 'mental',
                'impairment', 'special needs',
            ],
        },
        {
            category: 'familial-status',
            description: 'References to family composition or children',
            examples: [
                'No children',
                'Adults only',
                'Perfect for couples without kids',
                'Ideal for mature individuals',
            ],
            indicators: [
                'children', 'kids', 'family', 'adults only', 'mature',
                'couples', 'single', 'married', 'parents', 'childless',
            ],
        },
        {
            category: 'national-origin',
            description: 'References to national origin or citizenship',
            examples: [
                'American citizens only',
                'No foreigners',
                'Perfect for locals',
                'Must speak English',
            ],
            indicators: [
                'national origin', 'citizenship', 'citizen', 'foreigner',
                'immigrant', 'native', 'local', 'american', 'english speaking',
            ],
        },
    ];

    // Discriminatory language patterns
    private readonly discriminatoryPatterns = [
        'no welfare',
        'no section 8',
        'no vouchers',
        'credit check required',
        'professional only',
        'executive',
        'prestigious',
    ];

    constructor() {
        this.client = getBedrockClient();
    }

    /**
     * Performs comprehensive compliance validation
     * 
     * @param content - Content to validate
     * @param rules - Compliance rules to apply
     * @param config - Validation configuration
     * @returns Detailed compliance result
     */
    async validateCompliance(
        content: string,
        rules: ComplianceRules,
        config?: Partial<ComplianceValidatorConfig>
    ): Promise<DetailedComplianceResult> {
        const finalConfig: ComplianceValidatorConfig = {
            strictMode: false,
            confidenceThreshold: 0.7,
            domain: 'real-estate',
            includeEducation: true,
            ...config,
        };

        // Perform different types of compliance checks
        const violations: ComplianceViolation[] = [];

        // 1. Fair Housing Act violations
        if (rules.checkFairHousing) {
            const fairHousingViolations = await this.checkFairHousing(content, finalConfig);
            violations.push(...fairHousingViolations);
        }

        // 2. Discriminatory language
        if (rules.checkDiscriminatory) {
            const discriminatoryViolations = await this.checkDiscriminatoryLanguage(
                content,
                finalConfig
            );
            violations.push(...discriminatoryViolations);
        }

        // 3. Legal compliance
        if (rules.checkLegal) {
            const legalViolations = await this.checkLegalCompliance(content, finalConfig);
            violations.push(...legalViolations);
        }

        // 4. Custom patterns
        if (rules.customPatterns && rules.customPatterns.length > 0) {
            const customViolations = await this.checkCustomPatterns(
                content,
                rules.customPatterns,
                finalConfig
            );
            violations.push(...customViolations);
        }

        // Filter by confidence threshold
        const filteredViolations = violations.filter(
            v => v.confidence >= finalConfig.confidenceThreshold
        );

        // Group violations
        const violationsByType = this.groupViolationsByType(filteredViolations);
        const violationsByClass = this.groupViolationsByClass(filteredViolations);

        // Calculate compliance score
        const complianceScore = this.calculateComplianceScore(filteredViolations);

        // Assess risk
        const riskAssessment = this.assessRisk(filteredViolations, finalConfig);

        // Generate education content if requested
        const education = finalConfig.includeEducation
            ? this.generateEducationContent(filteredViolations)
            : undefined;

        // Convert to standard format for compatibility
        const standardViolations = filteredViolations.map(v => ({
            type: v.type,
            message: v.message,
            location: v.location,
            severity: v.severity,
            suggestion: v.suggestion,
        }));

        return {
            compliant: filteredViolations.length === 0,
            violations: standardViolations,
            complianceScore,
            detailedViolations: filteredViolations,
            violationsByType,
            violationsByClass,
            education,
            riskAssessment,
        };
    }

    /**
     * Checks for Fair Housing Act violations
     * 
     * @param content - Content to check
     * @param config - Configuration
     * @returns List of violations
     */
    private async checkFairHousing(
        content: string,
        config: ComplianceValidatorConfig
    ): Promise<ComplianceViolation[]> {
        const prompt = `You are a Fair Housing Act compliance expert. Analyze the following real estate content for potential Fair Housing Act violations.

Content:
${content}

The Fair Housing Act prohibits discrimination based on:
1. Race or color
2. National origin
3. Religion
4. Sex (including gender identity and sexual orientation)
5. Familial status (families with children under 18)
6. Disability (physical or mental)

Analyze the content for:
- Direct references to protected classes
- Indirect or coded language that suggests preferences
- Descriptions that could discourage protected classes
- Statements about "ideal" residents that reference protected characteristics
- Use of words like "perfect for," "ideal for," "great for" followed by protected class references

${config.strictMode ? 'Use STRICT interpretation - flag anything that could potentially be discriminatory.' : 'Use REASONABLE interpretation - flag clear violations and likely discriminatory language.'}

Provide your analysis in JSON format:
{
  "violations": [
    {
      "type": "fair-housing",
      "message": "Detailed explanation of the violation",
      "location": { "start": 0, "end": 50 },
      "severity": "error" | "warning" | "info",
      "suggestion": "How to fix this violation",
      "protectedClass": "race" | "color" | "religion" | "sex" | "handicap" | "familial-status" | "national-origin",
      "regulation": "Fair Housing Act Section X",
      "confidence": 0.95
    }
  ]
}`;

        const schema = z.object({
            violations: z.array(z.object({
                type: z.literal('fair-housing'),
                message: z.string(),
                location: z.object({
                    start: z.number(),
                    end: z.number(),
                }).optional(),
                severity: z.enum(['error', 'warning', 'info']),
                suggestion: z.string(),
                protectedClass: z.enum([
                    'race',
                    'color',
                    'religion',
                    'sex',
                    'handicap',
                    'familial-status',
                    'national-origin',
                ]).optional(),
                regulation: z.string().optional(),
                confidence: z.number(),
            })),
        });

        const result = await this.client.invoke(prompt, schema, {
            temperature: 0.1,
            maxTokens: 2000,
        });

        return result.violations;
    }

    /**
     * Checks for discriminatory language
     * 
     * @param content - Content to check
     * @param config - Configuration
     * @returns List of violations
     */
    private async checkDiscriminatoryLanguage(
        content: string,
        config: ComplianceValidatorConfig
    ): Promise<ComplianceViolation[]> {
        const prompt = `You are a discrimination detection expert. Analyze the following content for discriminatory language beyond Fair Housing Act violations.

Content:
${content}

Check for:
1. Economic discrimination (e.g., "no welfare," "no Section 8," "professionals only")
2. Source of income discrimination
3. Biased or exclusionary language
4. Stereotyping or coded language
5. Language that creates barriers for certain groups
6. Subtle preferences that could be discriminatory

${config.strictMode ? 'Flag any language that could be perceived as discriminatory or exclusionary.' : 'Flag clear discriminatory language and likely problematic phrases.'}

Provide your analysis in JSON format:
{
  "violations": [
    {
      "type": "discriminatory",
      "message": "Explanation of why this is discriminatory",
      "location": { "start": 0, "end": 50 },
      "severity": "error" | "warning" | "info",
      "suggestion": "How to make this language inclusive",
      "confidence": 0.90
    }
  ]
}`;

        const schema = z.object({
            violations: z.array(z.object({
                type: z.literal('discriminatory'),
                message: z.string(),
                location: z.object({
                    start: z.number(),
                    end: z.number(),
                }).optional(),
                severity: z.enum(['error', 'warning', 'info']),
                suggestion: z.string(),
                confidence: z.number(),
            })),
        });

        const result = await this.client.invoke(prompt, schema, {
            temperature: 0.1,
            maxTokens: 1500,
        });

        return result.violations;
    }

    /**
     * Checks for legal compliance issues
     * 
     * @param content - Content to check
     * @param config - Configuration
     * @returns List of violations
     */
    private async checkLegalCompliance(
        content: string,
        config: ComplianceValidatorConfig
    ): Promise<ComplianceViolation[]> {
        const prompt = `You are a real estate legal compliance expert. Analyze the following content for legal compliance issues.

Content:
${content}

Domain: ${config.domain}

Check for:
1. Required disclosures missing (lead paint, flood zones, etc.)
2. Misleading or false advertising
3. Unauthorized use of trademarks or logos
4. Privacy violations
5. Truth in advertising violations
6. State-specific real estate advertising requirements
7. Misrepresentation of property features
8. Unlicensed practice of law (giving legal advice)

Provide your analysis in JSON format:
{
  "violations": [
    {
      "type": "legal",
      "message": "Explanation of the legal issue",
      "location": { "start": 0, "end": 50 },
      "severity": "error" | "warning" | "info",
      "suggestion": "How to achieve compliance",
      "regulation": "Specific law or regulation",
      "confidence": 0.85
    }
  ]
}`;

        const schema = z.object({
            violations: z.array(z.object({
                type: z.literal('legal'),
                message: z.string(),
                location: z.object({
                    start: z.number(),
                    end: z.number(),
                }).optional(),
                severity: z.enum(['error', 'warning', 'info']),
                suggestion: z.string(),
                regulation: z.string().optional(),
                confidence: z.number(),
            })),
        });

        const result = await this.client.invoke(prompt, schema, {
            temperature: 0.1,
            maxTokens: 1500,
        });

        return result.violations;
    }

    /**
     * Checks for custom compliance patterns
     * 
     * @param content - Content to check
     * @param patterns - Custom patterns to check
     * @param config - Configuration
     * @returns List of violations
     */
    private async checkCustomPatterns(
        content: string,
        patterns: Array<{ pattern: string; message: string; severity: IssueSeverity }>,
        config: ComplianceValidatorConfig
    ): Promise<ComplianceViolation[]> {
        const violations: ComplianceViolation[] = [];

        // Check each custom pattern
        for (const customPattern of patterns) {
            const regex = new RegExp(customPattern.pattern, 'gi');
            let match;

            while ((match = regex.exec(content)) !== null) {
                violations.push({
                    type: 'custom',
                    message: customPattern.message,
                    location: {
                        start: match.index,
                        end: match.index + match[0].length,
                    },
                    severity: customPattern.severity,
                    suggestion: `Remove or revise: "${match[0]}"`,
                    confidence: 1.0, // Custom patterns are exact matches
                });
            }
        }

        return violations;
    }

    /**
     * Groups violations by type
     */
    private groupViolationsByType(
        violations: ComplianceViolation[]
    ): Record<ViolationType, ComplianceViolation[]> {
        const grouped: Record<ViolationType, ComplianceViolation[]> = {
            'fair-housing': [],
            'discriminatory': [],
            'legal': [],
            'custom': [],
        };

        violations.forEach(violation => {
            grouped[violation.type].push(violation);
        });

        return grouped;
    }

    /**
     * Groups violations by protected class
     */
    private groupViolationsByClass(
        violations: ComplianceViolation[]
    ): Record<ProtectedClass, ComplianceViolation[]> {
        const grouped: Record<ProtectedClass, ComplianceViolation[]> = {
            'race': [],
            'color': [],
            'religion': [],
            'sex': [],
            'handicap': [],
            'familial-status': [],
            'national-origin': [],
        };

        violations.forEach(violation => {
            if (violation.protectedClass) {
                grouped[violation.protectedClass].push(violation);
            }
        });

        return grouped;
    }

    /**
     * Calculates overall compliance score
     */
    private calculateComplianceScore(violations: ComplianceViolation[]): number {
        if (violations.length === 0) {
            return 1.0;
        }

        let deduction = 0;

        violations.forEach(violation => {
            // Weight by severity and confidence
            const severityWeight = violation.severity === 'error' ? 1.0 :
                violation.severity === 'warning' ? 0.5 : 0.2;

            deduction += severityWeight * violation.confidence * 0.2;
        });

        return Math.max(0, 1.0 - deduction);
    }

    /**
     * Assesses risk level
     */
    private assessRisk(
        violations: ComplianceViolation[],
        config: ComplianceValidatorConfig
    ): {
        overallRisk: 'low' | 'medium' | 'high' | 'critical';
        legalRisk: number;
        reputationalRisk: number;
        recommendations: string[];
    } {
        const errorCount = violations.filter(v => v.severity === 'error').length;
        const warningCount = violations.filter(v => v.severity === 'warning').length;
        const fairHousingCount = violations.filter(v => v.type === 'fair-housing').length;
        const legalCount = violations.filter(v => v.type === 'legal').length;

        // Calculate legal risk (0-1)
        const legalRisk = Math.min(1.0, (fairHousingCount * 0.3 + legalCount * 0.2 + errorCount * 0.1));

        // Calculate reputational risk (0-1)
        const reputationalRisk = Math.min(1.0, (violations.length * 0.1));

        // Determine overall risk
        let overallRisk: 'low' | 'medium' | 'high' | 'critical';
        if (fairHousingCount > 0 || errorCount > 2) {
            overallRisk = 'critical';
        } else if (legalCount > 0 || errorCount > 0) {
            overallRisk = 'high';
        } else if (warningCount > 2) {
            overallRisk = 'medium';
        } else {
            overallRisk = 'low';
        }

        // Generate recommendations
        const recommendations: string[] = [];

        if (fairHousingCount > 0) {
            recommendations.push(
                'URGENT: Fair Housing violations detected. Consult with legal counsel before publishing.'
            );
        }

        if (legalCount > 0) {
            recommendations.push(
                'Legal compliance issues found. Review with compliance team.'
            );
        }

        if (errorCount > 0) {
            recommendations.push(
                'Critical errors must be fixed before publication.'
            );
        }

        if (warningCount > 0) {
            recommendations.push(
                'Address warnings to improve compliance and reduce risk.'
            );
        }

        if (violations.length === 0) {
            recommendations.push(
                'Content appears compliant. Proceed with standard review process.'
            );
        }

        return {
            overallRisk,
            legalRisk,
            reputationalRisk,
            recommendations,
        };
    }

    /**
     * Generates educational content about violations
     */
    private generateEducationContent(violations: ComplianceViolation[]): {
        fairHousingOverview: string;
        relevantRegulations: string[];
        bestPractices: string[];
    } {
        const fairHousingOverview = `The Fair Housing Act prohibits discrimination in housing based on race, color, national origin, religion, sex, familial status, and disability. Real estate advertising must not express preferences, limitations, or discrimination based on these protected classes.`;

        const relevantRegulations: string[] = [
            'Fair Housing Act (42 U.S.C. §§ 3601-3619)',
            'HUD Advertising Guidelines',
            'State Fair Housing Laws',
        ];

        const bestPractices: string[] = [
            'Focus on property features, not ideal residents',
            'Use inclusive language that welcomes all potential buyers/renters',
            'Avoid describing neighborhoods in ways that suggest racial or ethnic composition',
            'Do not mention proximity to religious institutions as a selling point',
            'Describe accessibility features objectively without suggesting who should use them',
            'Use "adults" instead of "mature" when describing age-restricted communities (where legally allowed)',
            'Avoid economic discrimination by not mentioning income sources',
        ];

        // Add specific best practices based on violations found
        const protectedClasses = new Set(
            violations
                .filter(v => v.protectedClass)
                .map(v => v.protectedClass!)
        );

        if (protectedClasses.has('familial-status')) {
            bestPractices.push(
                'Never use "adults only," "no children," or similar phrases unless property qualifies as senior housing'
            );
        }

        if (protectedClasses.has('handicap')) {
            bestPractices.push(
                'Describe accessibility features without suggesting limitations (e.g., "wheelchair accessible" not "perfect for disabled")'
            );
        }

        return {
            fairHousingOverview,
            relevantRegulations,
            bestPractices,
        };
    }
}

/**
 * Singleton instance
 */
let complianceValidatorInstance: ComplianceValidator | null = null;

/**
 * Gets the singleton ComplianceValidator instance
 */
export function getComplianceValidator(): ComplianceValidator {
    if (!complianceValidatorInstance) {
        complianceValidatorInstance = new ComplianceValidator();
    }
    return complianceValidatorInstance;
}

/**
 * Resets the ComplianceValidator singleton (useful for testing)
 */
export function resetComplianceValidator(): void {
    complianceValidatorInstance = null;
}
