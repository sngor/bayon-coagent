/**
 * Fact Checking System
 * 
 * Implements comprehensive fact-checking capabilities for content validation.
 * Extracts claims, verifies against sources, flags unverified statements,
 * and manages citations.
 * 
 * Requirements validated:
 * - 8.1: Verifies factual claims against reliable sources
 * 
 * Properties validated:
 * - Property 36: Fact verification
 */

import { BedrockClient, getBedrockClient } from '../client';
import { z } from 'zod';

/**
 * Represents a factual claim extracted from content
 */
export interface FactualClaim {
    /** The claim text */
    claim: string;

    /** Location in the original content */
    location: {
        start: number;
        end: number;
    };

    /** Type of claim */
    type: 'statistic' | 'fact' | 'quote' | 'date' | 'general';

    /** Confidence that this is a factual claim (0-1) */
    confidence: number;

    /** Context around the claim */
    context?: string;
}

/**
 * Verification status for a claim
 */
export type VerificationStatus =
    | 'verified'
    | 'unverified'
    | 'disputed'
    | 'false'
    | 'needs-citation';

/**
 * Source information for verification
 */
export interface SourceInfo {
    /** Source name or URL */
    source: string;

    /** Source type */
    type: 'official' | 'news' | 'research' | 'industry' | 'unknown';

    /** Reliability score (0-1) */
    reliability: number;

    /** Date of source */
    date?: string;

    /** Relevant excerpt from source */
    excerpt?: string;
}

/**
 * Result of claim verification
 */
export interface ClaimVerification {
    /** The original claim */
    claim: FactualClaim;

    /** Verification status */
    status: VerificationStatus;

    /** Confidence in verification (0-1) */
    confidence: number;

    /** Supporting sources */
    sources: SourceInfo[];

    /** Explanation of verification result */
    explanation: string;

    /** Suggested correction if claim is false/disputed */
    suggestedCorrection?: string;

    /** Citation text if needed */
    suggestedCitation?: string;
}

/**
 * Citation format options
 */
export type CitationFormat = 'inline' | 'footnote' | 'endnote' | 'apa' | 'mla';

/**
 * Citation information
 */
export interface Citation {
    /** Citation ID */
    id: string;

    /** Citation text */
    text: string;

    /** Format used */
    format: CitationFormat;

    /** Source information */
    source: SourceInfo;

    /** Claims this citation supports */
    supportedClaims: string[];
}

/**
 * Complete fact-checking result
 */
export interface FactCheckResult {
    /** All extracted claims */
    claims: FactualClaim[];

    /** Verification results for each claim */
    verifications: ClaimVerification[];

    /** Unverified claims that need attention */
    unverifiedClaims: ClaimVerification[];

    /** False or disputed claims */
    problematicClaims: ClaimVerification[];

    /** Generated citations */
    citations: Citation[];

    /** Overall fact-check score (0-1) */
    overallScore: number;

    /** Summary of findings */
    summary: string;

    /** Recommendations for improvement */
    recommendations: string[];
}

/**
 * Fact-checking configuration
 */
export interface FactCheckConfig {
    /** Whether to verify all claims or just flagged ones */
    verifyAll: boolean;

    /** Minimum confidence threshold for claims (0-1) */
    claimConfidenceThreshold: number;

    /** Whether to generate citations */
    generateCitations: boolean;

    /** Citation format to use */
    citationFormat: CitationFormat;

    /** Whether to include source reliability checks */
    checkSourceReliability: boolean;

    /** Content domain for context */
    domain?: 'real-estate' | 'finance' | 'legal' | 'general';
}

/**
 * FactChecker - Comprehensive fact-checking system
 */
export class FactChecker {
    private client: BedrockClient;

    constructor() {
        this.client = getBedrockClient();
    }

    /**
     * Performs comprehensive fact-checking on content
     * 
     * @param content - Content to fact-check
     * @param config - Fact-checking configuration
     * @returns Complete fact-check result
     */
    async checkFacts(content: string, config: FactCheckConfig): Promise<FactCheckResult> {
        // Step 1: Extract claims
        const claims = await this.extractClaims(content, config);

        // Step 2: Verify claims
        const verifications = await this.verifyClaims(claims, config);

        // Step 3: Identify problematic claims
        const unverifiedClaims = verifications.filter(
            v => v.status === 'unverified' || v.status === 'needs-citation'
        );
        const problematicClaims = verifications.filter(
            v => v.status === 'disputed' || v.status === 'false'
        );

        // Step 4: Generate citations if requested
        const citations = config.generateCitations
            ? await this.generateCitations(verifications, config.citationFormat)
            : [];

        // Step 5: Calculate overall score
        const overallScore = this.calculateFactCheckScore(verifications);

        // Step 6: Generate summary and recommendations
        const summary = this.generateSummary(verifications, unverifiedClaims, problematicClaims);
        const recommendations = this.generateRecommendations(
            unverifiedClaims,
            problematicClaims,
            config
        );

        return {
            claims,
            verifications,
            unverifiedClaims,
            problematicClaims,
            citations,
            overallScore,
            summary,
            recommendations,
        };
    }

    /**
     * Extracts factual claims from content
     * 
     * @param content - Content to analyze
     * @param config - Configuration
     * @returns Extracted claims
     */
    async extractClaims(content: string, config: FactCheckConfig): Promise<FactualClaim[]> {
        const prompt = `You are a fact-checking expert. Analyze the following content and extract all factual claims that should be verified.

Content:
${content}

Domain: ${config.domain || 'general'}

Extract claims that are:
1. Specific statistics or numbers
2. Factual statements about events, dates, or people
3. Quotes attributed to sources
4. Market data or trends
5. Legal or regulatory statements

For each claim, identify:
- The exact claim text
- Its location in the content (character positions)
- The type of claim
- Your confidence that this is a factual claim (0-1)
- Surrounding context

Provide your analysis in JSON format:
{
  "claims": [
    {
      "claim": "The exact claim text",
      "location": { "start": 0, "end": 50 },
      "type": "statistic" | "fact" | "quote" | "date" | "general",
      "confidence": 0.95,
      "context": "Surrounding text for context"
    }
  ]
}`;

        const schema = z.object({
            claims: z.array(z.object({
                claim: z.string(),
                location: z.object({
                    start: z.number(),
                    end: z.number(),
                }),
                type: z.enum(['statistic', 'fact', 'quote', 'date', 'general']),
                confidence: z.number(),
                context: z.string().optional(),
            })),
        });

        const result = await this.client.invoke(prompt, schema, {
            temperature: 0.2,
            maxTokens: 2000,
        });

        // Filter by confidence threshold
        return result.claims.filter(
            claim => claim.confidence >= config.claimConfidenceThreshold
        );
    }

    /**
     * Verifies extracted claims
     * 
     * @param claims - Claims to verify
     * @param config - Configuration
     * @returns Verification results
     */
    async verifyClaims(
        claims: FactualClaim[],
        config: FactCheckConfig
    ): Promise<ClaimVerification[]> {
        // Verify claims in batches to avoid overwhelming the API
        const batchSize = 5;
        const verifications: ClaimVerification[] = [];

        for (let i = 0; i < claims.length; i += batchSize) {
            const batch = claims.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(claim => this.verifySingleClaim(claim, config))
            );
            verifications.push(...batchResults);
        }

        return verifications;
    }

    /**
     * Verifies a single claim
     * 
     * @param claim - Claim to verify
     * @param config - Configuration
     * @returns Verification result
     */
    private async verifySingleClaim(
        claim: FactualClaim,
        config: FactCheckConfig
    ): Promise<ClaimVerification> {
        const prompt = `You are a fact-checking expert specializing in ${config.domain || 'general'} content. Verify the following claim.

Claim: "${claim.claim}"
Type: ${claim.type}
Context: ${claim.context || 'None provided'}

Analyze this claim and determine:
1. Whether it can be verified
2. What sources would support or refute it
3. The reliability of those sources
4. Whether it needs a citation
5. If false or disputed, what the correct information is

Provide your analysis in JSON format:
{
  "status": "verified" | "unverified" | "disputed" | "false" | "needs-citation",
  "confidence": 0.85,
  "sources": [
    {
      "source": "Source name or URL",
      "type": "official" | "news" | "research" | "industry" | "unknown",
      "reliability": 0.90,
      "date": "2024-01-01",
      "excerpt": "Relevant excerpt from source"
    }
  ],
  "explanation": "Detailed explanation of verification result",
  "suggestedCorrection": "Corrected version if claim is false",
  "suggestedCitation": "Proper citation text if needed"
}`;

        const schema = z.object({
            status: z.enum(['verified', 'unverified', 'disputed', 'false', 'needs-citation']),
            confidence: z.number(),
            sources: z.array(z.object({
                source: z.string(),
                type: z.enum(['official', 'news', 'research', 'industry', 'unknown']),
                reliability: z.number(),
                date: z.string().optional(),
                excerpt: z.string().optional(),
            })),
            explanation: z.string(),
            suggestedCorrection: z.string().optional(),
            suggestedCitation: z.string().optional(),
        });

        const result = await this.client.invoke(prompt, schema, {
            temperature: 0.2,
            maxTokens: 1500,
        });

        return {
            claim,
            ...result,
        };
    }

    /**
     * Generates citations for verified claims
     * 
     * @param verifications - Verification results
     * @param format - Citation format
     * @returns Generated citations
     */
    async generateCitations(
        verifications: ClaimVerification[],
        format: CitationFormat
    ): Promise<Citation[]> {
        // Group verifications by source
        const sourceMap = new Map<string, ClaimVerification[]>();

        verifications.forEach(verification => {
            verification.sources.forEach(source => {
                const key = source.source;
                if (!sourceMap.has(key)) {
                    sourceMap.set(key, []);
                }
                sourceMap.get(key)!.push(verification);
            });
        });

        // Generate citations for each unique source
        const citations: Citation[] = [];
        let citationId = 1;

        for (const [sourceKey, relatedVerifications] of sourceMap.entries()) {
            const source = relatedVerifications[0].sources.find(s => s.source === sourceKey);
            if (!source) continue;

            const citationText = await this.formatCitation(source, format);

            citations.push({
                id: `cite-${citationId++}`,
                text: citationText,
                format,
                source,
                supportedClaims: relatedVerifications.map(v => v.claim.claim),
            });
        }

        return citations;
    }

    /**
     * Formats a citation according to the specified format
     * 
     * @param source - Source information
     * @param format - Citation format
     * @returns Formatted citation text
     */
    private async formatCitation(source: SourceInfo, format: CitationFormat): Promise<string> {
        const prompt = `Format the following source as a ${format} citation.

Source: ${source.source}
Type: ${source.type}
Date: ${source.date || 'Unknown'}

Provide the properly formatted citation as a plain text string.`;

        const schema = z.object({
            citation: z.string(),
        });

        const result = await this.client.invoke(prompt, schema, {
            temperature: 0.1,
            maxTokens: 200,
        });

        return result.citation;
    }

    /**
     * Calculates overall fact-check score
     * 
     * @param verifications - All verification results
     * @returns Score from 0-1
     */
    private calculateFactCheckScore(verifications: ClaimVerification[]): number {
        if (verifications.length === 0) {
            return 1.0; // No claims to verify
        }

        let totalScore = 0;

        verifications.forEach(verification => {
            switch (verification.status) {
                case 'verified':
                    totalScore += 1.0 * verification.confidence;
                    break;
                case 'needs-citation':
                    totalScore += 0.7 * verification.confidence;
                    break;
                case 'unverified':
                    totalScore += 0.5 * verification.confidence;
                    break;
                case 'disputed':
                    totalScore += 0.3 * verification.confidence;
                    break;
                case 'false':
                    totalScore += 0.0;
                    break;
            }
        });

        return totalScore / verifications.length;
    }

    /**
     * Generates a summary of fact-checking results
     * 
     * @param verifications - All verifications
     * @param unverified - Unverified claims
     * @param problematic - Problematic claims
     * @returns Summary text
     */
    private generateSummary(
        verifications: ClaimVerification[],
        unverified: ClaimVerification[],
        problematic: ClaimVerification[]
    ): string {
        const total = verifications.length;
        const verified = verifications.filter(v => v.status === 'verified').length;

        if (total === 0) {
            return 'No factual claims found in content.';
        }

        const parts: string[] = [];

        parts.push(`Found ${total} factual claim${total !== 1 ? 's' : ''}.`);
        parts.push(`${verified} verified (${((verified / total) * 100).toFixed(0)}%).`);

        if (problematic.length > 0) {
            parts.push(`${problematic.length} problematic claim${problematic.length !== 1 ? 's' : ''} found.`);
        }

        if (unverified.length > 0) {
            parts.push(`${unverified.length} claim${unverified.length !== 1 ? 's' : ''} need${unverified.length === 1 ? 's' : ''} verification or citation.`);
        }

        return parts.join(' ');
    }

    /**
     * Generates recommendations for improvement
     * 
     * @param unverified - Unverified claims
     * @param problematic - Problematic claims
     * @param config - Configuration
     * @returns List of recommendations
     */
    private generateRecommendations(
        unverified: ClaimVerification[],
        problematic: ClaimVerification[],
        config: FactCheckConfig
    ): string[] {
        const recommendations: string[] = [];

        // Handle problematic claims first (highest priority)
        problematic.forEach(verification => {
            if (verification.status === 'false') {
                recommendations.push(
                    `Remove or correct false claim: "${verification.claim.claim}". ${verification.suggestedCorrection ? `Suggested: ${verification.suggestedCorrection}` : ''}`
                );
            } else if (verification.status === 'disputed') {
                recommendations.push(
                    `Revise disputed claim: "${verification.claim.claim}". ${verification.explanation}`
                );
            }
        });

        // Handle unverified claims
        unverified.forEach(verification => {
            if (verification.status === 'needs-citation') {
                recommendations.push(
                    `Add citation for: "${verification.claim.claim}". ${verification.suggestedCitation || 'Provide a reliable source.'}`
                );
            } else if (verification.status === 'unverified') {
                recommendations.push(
                    `Verify or remove claim: "${verification.claim.claim}". Unable to find supporting sources.`
                );
            }
        });

        // General recommendations
        if (config.generateCitations && unverified.length > 0) {
            recommendations.push(
                'Consider adding citations for all factual claims to increase credibility.'
            );
        }

        if (problematic.length === 0 && unverified.length === 0) {
            recommendations.push('All factual claims are verified. Content has strong factual accuracy.');
        }

        return recommendations;
    }
}

/**
 * Singleton instance
 */
let factCheckerInstance: FactChecker | null = null;

/**
 * Gets the singleton FactChecker instance
 */
export function getFactChecker(): FactChecker {
    if (!factCheckerInstance) {
        factCheckerInstance = new FactChecker();
    }
    return factCheckerInstance;
}

/**
 * Resets the FactChecker singleton (useful for testing)
 */
export function resetFactChecker(): void {
    factCheckerInstance = null;
}
