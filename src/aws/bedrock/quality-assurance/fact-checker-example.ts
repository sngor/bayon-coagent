/**
 * Fact Checker Usage Examples
 * 
 * Demonstrates how to use the fact-checking system for content validation.
 */

import { getFactChecker, type FactCheckConfig } from './fact-checker';
import { getQualityAssuranceStrand } from './quality-assurance-strand';

/**
 * Example 1: Basic fact-checking
 */
export async function basicFactCheckExample() {
    const factChecker = getFactChecker();

    const content = `
        The median home price in Austin, Texas reached $550,000 in 2023, 
        representing a 15% increase from the previous year. According to the 
        National Association of Realtors, first-time homebuyers now represent 
        only 26% of all home purchases, the lowest level in decades.
    `;

    const config: FactCheckConfig = {
        verifyAll: true,
        claimConfidenceThreshold: 0.7,
        generateCitations: true,
        citationFormat: 'inline',
        checkSourceReliability: true,
        domain: 'real-estate',
    };

    const result = await factChecker.checkFacts(content, config);

    console.log('Fact Check Results:');
    console.log(`- Total claims: ${result.claims.length}`);
    console.log(`- Verified: ${result.verifications.filter(v => v.status === 'verified').length}`);
    console.log(`- Unverified: ${result.unverifiedClaims.length}`);
    console.log(`- Problematic: ${result.problematicClaims.length}`);
    console.log(`- Overall score: ${(result.overallScore * 100).toFixed(0)}%`);
    console.log(`\nSummary: ${result.summary}`);

    if (result.recommendations.length > 0) {
        console.log('\nRecommendations:');
        result.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });
    }

    if (result.citations.length > 0) {
        console.log('\nCitations:');
        result.citations.forEach(citation => {
            console.log(`[${citation.id}] ${citation.text}`);
        });
    }

    return result;
}

/**
 * Example 2: Fact-checking with minimal verification
 */
export async function minimalFactCheckExample() {
    const factChecker = getFactChecker();

    const content = `
        This beautiful 3-bedroom home features hardwood floors throughout 
        and a newly renovated kitchen. The property is located in a quiet 
        neighborhood with excellent schools nearby.
    `;

    const config: FactCheckConfig = {
        verifyAll: false, // Only verify flagged claims
        claimConfidenceThreshold: 0.8, // Higher threshold
        generateCitations: false, // Don't generate citations
        citationFormat: 'inline',
        checkSourceReliability: false,
        domain: 'real-estate',
    };

    const result = await factChecker.checkFacts(content, config);

    console.log('Minimal Fact Check Results:');
    console.log(`- Claims found: ${result.claims.length}`);
    console.log(`- Overall score: ${(result.overallScore * 100).toFixed(0)}%`);

    return result;
}

/**
 * Example 3: Integrated quality assurance with fact-checking
 */
export async function integratedQAExample() {
    const qaStrand = getQualityAssuranceStrand();

    const content = `
        According to recent studies, homes with smart home technology sell 
        for 5% more than comparable homes without these features. The average 
        days on market has decreased to just 18 days in competitive markets.
        
        This property includes state-of-the-art smart home features including 
        automated lighting, climate control, and security systems.
    `;

    // Perform comprehensive quality assurance including fact-checking
    const result = await qaStrand.validateContent({
        content,
        validationTypes: ['factual', 'grammar', 'seo'],
        targetKeywords: ['smart home', 'technology', 'real estate'],
        contentType: 'listing',
        userId: 'user-123',
    });

    console.log('Integrated QA Results:');
    console.log(`- Overall score: ${(result.validation.overallScore * 100).toFixed(0)}%`);
    console.log(`- Factual score: ${(result.validation.scoresByType.factual * 100).toFixed(0)}%`);
    console.log(`- Grammar score: ${(result.validation.scoresByType.grammar * 100).toFixed(0)}%`);
    console.log(`- SEO score: ${result.seo ? (result.seo.currentScore * 100).toFixed(0) : 'N/A'}%`);
    console.log(`\nFinal recommendation: ${result.finalRecommendation}`);
    console.log(`\nSummary: ${result.summary}`);

    if (result.actionItems.length > 0) {
        console.log('\nAction Items:');
        result.actionItems.forEach(item => {
            console.log(`[${item.priority.toUpperCase()}] ${item.action}`);
            console.log(`  Rationale: ${item.rationale}`);
        });
    }

    return result;
}

/**
 * Example 4: Standalone fact-checking via QA strand
 */
export async function standaloneFactCheckExample() {
    const qaStrand = getQualityAssuranceStrand();

    const content = `
        The Federal Reserve raised interest rates by 0.75% in their last meeting, 
        bringing the federal funds rate to 5.5%. This has caused mortgage rates 
        to climb to their highest level since 2008, with the average 30-year 
        fixed rate now at 7.2%.
    `;

    // Use the QA strand's fact-checking method directly
    const result = await qaStrand.checkFacts(content, {
        verifyAll: true,
        claimConfidenceThreshold: 0.7,
        generateCitations: true,
        citationFormat: 'apa',
        checkSourceReliability: true,
        domain: 'real-estate',
    });

    console.log('Standalone Fact Check via QA Strand:');
    console.log(`- Claims analyzed: ${result.claims.length}`);
    console.log(`- Overall accuracy: ${(result.overallScore * 100).toFixed(0)}%`);

    // Show detailed results for each claim
    result.verifications.forEach((verification, i) => {
        console.log(`\nClaim ${i + 1}: "${verification.claim.claim}"`);
        console.log(`  Status: ${verification.status}`);
        console.log(`  Confidence: ${(verification.confidence * 100).toFixed(0)}%`);
        console.log(`  Explanation: ${verification.explanation}`);

        if (verification.sources.length > 0) {
            console.log(`  Sources:`);
            verification.sources.forEach(source => {
                console.log(`    - ${source.source} (${source.type}, reliability: ${(source.reliability * 100).toFixed(0)}%)`);
            });
        }
    });

    return result;
}

/**
 * Example 5: Handling problematic claims
 */
export async function problematicClaimsExample() {
    const factChecker = getFactChecker();

    const content = `
        This property is perfect for families with children, as the neighborhood 
        has no crime and only good schools. The home was built in 1950 and has 
        never had any structural issues. Property values in this area have 
        increased by 50% every year for the past decade.
    `;

    const config: FactCheckConfig = {
        verifyAll: true,
        claimConfidenceThreshold: 0.6,
        generateCitations: true,
        citationFormat: 'inline',
        checkSourceReliability: true,
        domain: 'real-estate',
    };

    const result = await factChecker.checkFacts(content, config);

    console.log('Problematic Claims Analysis:');

    if (result.problematicClaims.length > 0) {
        console.log(`\nFound ${result.problematicClaims.length} problematic claim(s):`);
        result.problematicClaims.forEach((verification, i) => {
            console.log(`\n${i + 1}. "${verification.claim.claim}"`);
            console.log(`   Status: ${verification.status}`);
            console.log(`   Issue: ${verification.explanation}`);
            if (verification.suggestedCorrection) {
                console.log(`   Suggested correction: ${verification.suggestedCorrection}`);
            }
        });
    }

    if (result.unverifiedClaims.length > 0) {
        console.log(`\nFound ${result.unverifiedClaims.length} unverified claim(s):`);
        result.unverifiedClaims.forEach((verification, i) => {
            console.log(`\n${i + 1}. "${verification.claim.claim}"`);
            console.log(`   Status: ${verification.status}`);
            console.log(`   Issue: ${verification.explanation}`);
            if (verification.suggestedCitation) {
                console.log(`   Suggested citation: ${verification.suggestedCitation}`);
            }
        });
    }

    console.log(`\nOverall fact-check score: ${(result.overallScore * 100).toFixed(0)}%`);

    return result;
}

/**
 * Example 6: Citation generation
 */
export async function citationGenerationExample() {
    const factChecker = getFactChecker();

    const content = `
        According to the U.S. Census Bureau, the homeownership rate in the 
        United States was 65.5% in Q2 2023. The National Association of 
        Realtors reports that the median existing-home price was $410,200 
        in June 2023.
    `;

    // Test different citation formats
    const formats: Array<'inline' | 'footnote' | 'endnote' | 'apa' | 'mla'> = [
        'inline',
        'apa',
        'mla',
    ];

    for (const format of formats) {
        console.log(`\n=== ${format.toUpperCase()} Format ===`);

        const result = await factChecker.checkFacts(content, {
            verifyAll: true,
            claimConfidenceThreshold: 0.7,
            generateCitations: true,
            citationFormat: format,
            checkSourceReliability: true,
            domain: 'real-estate',
        });

        if (result.citations.length > 0) {
            console.log('Generated Citations:');
            result.citations.forEach(citation => {
                console.log(`\n[${citation.id}] ${citation.text}`);
                console.log(`Supports ${citation.supportedClaims.length} claim(s)`);
            });
        }
    }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('='.repeat(60));
    console.log('FACT CHECKER EXAMPLES');
    console.log('='.repeat(60));

    try {
        console.log('\n--- Example 1: Basic Fact-Checking ---');
        await basicFactCheckExample();

        console.log('\n\n--- Example 2: Minimal Fact-Checking ---');
        await minimalFactCheckExample();

        console.log('\n\n--- Example 3: Integrated QA ---');
        await integratedQAExample();

        console.log('\n\n--- Example 4: Standalone Fact-Checking ---');
        await standaloneFactCheckExample();

        console.log('\n\n--- Example 5: Problematic Claims ---');
        await problematicClaimsExample();

        console.log('\n\n--- Example 6: Citation Generation ---');
        await citationGenerationExample();

        console.log('\n' + '='.repeat(60));
        console.log('ALL EXAMPLES COMPLETED');
        console.log('='.repeat(60));
    } catch (error) {
        console.error('Error running examples:', error);
        throw error;
    }
}

// Export for use in other modules
export {
    getFactChecker,
    getQualityAssuranceStrand,
};
