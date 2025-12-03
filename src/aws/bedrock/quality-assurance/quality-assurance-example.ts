/**
 * Quality Assurance Strand - Usage Examples
 * 
 * This file demonstrates how to use the QualityAssuranceStrand for
 * comprehensive content validation.
 */

import { getQualityAssuranceStrand } from './quality-assurance-strand';
import type {
    QualityAssuranceInput,
    ComplianceRules,
    BrandGuidelines,
} from './types';

/**
 * Example 1: Basic content validation
 */
export async function example1_BasicValidation() {
    const qaStrand = getQualityAssuranceStrand();

    const input: QualityAssuranceInput = {
        content: `Welcome to this beautiful 3-bedroom home in the heart of downtown! 
        This property features hardwood floors, granite countertops, and a spacious backyard. 
        Perfect for families looking for a quiet neighborhood with great schools nearby.`,
        validationTypes: ['factual', 'grammar'],
        contentType: 'listing',
    };

    const result = await qaStrand.validateContent(input);

    console.log('Validation Result:', {
        passed: result.validation.passed,
        score: result.validation.overallScore,
        issues: result.validation.issues.length,
        recommendation: result.finalRecommendation,
    });

    return result;
}

/**
 * Example 2: Compliance checking
 */
export async function example2_ComplianceCheck() {
    const qaStrand = getQualityAssuranceStrand();

    const complianceRules: ComplianceRules = {
        checkFairHousing: true,
        checkDiscriminatory: true,
        checkLegal: true,
    };

    const input: QualityAssuranceInput = {
        content: `Charming family home in a quiet Christian neighborhood. 
        Perfect for young couples without children. Close to churches and community centers.`,
        validationTypes: ['compliance'],
        complianceRules,
        contentType: 'listing',
    };

    const result = await qaStrand.validateContent(input);

    console.log('Compliance Result:', {
        compliant: result.compliance?.compliant,
        violations: result.compliance?.violations.length,
        score: result.compliance?.complianceScore,
    });

    if (result.compliance && !result.compliance.compliant) {
        console.log('Violations found:');
        result.compliance.violations.forEach(v => {
            console.log(`- ${v.type}: ${v.message}`);
            console.log(`  Suggestion: ${v.suggestion}`);
        });
    }

    return result;
}

/**
 * Example 3: Brand validation
 */
export async function example3_BrandValidation() {
    const qaStrand = getQualityAssuranceStrand();

    const brandGuidelines: BrandGuidelines = {
        voice: {
            tone: 'professional',
            formality: 'semi-formal',
            personality: ['trustworthy', 'knowledgeable', 'approachable'],
        },
        messaging: {
            keyMessages: [
                'Expert local knowledge',
                'Client-first approach',
                'Proven track record',
            ],
            avoidPhrases: ['cheap', 'deal of a lifetime', 'act now'],
            preferredTerminology: {
                'house': 'home',
                'buy': 'invest in',
                'sell': 'market',
            },
        },
        style: {
            sentenceLength: 'medium',
            paragraphLength: 'short',
            useOfEmojis: false,
            useOfExclamation: 'minimal',
        },
    };

    const input: QualityAssuranceInput = {
        content: `OMG!!! This house is AMAZING!!! 🏠✨ 
        You won't believe this deal of a lifetime! 
        Buy now before it's gone! Cheap price, great location!!!`,
        validationTypes: ['brand'],
        brandGuidelines,
        contentType: 'social',
    };

    const result = await qaStrand.validateContent(input);

    console.log('Brand Validation Result:', {
        matchesBrand: result.brand?.matchesBrand,
        voiceAlignment: result.brand?.voiceAlignment,
        messagingAlignment: result.brand?.messagingAlignment,
        styleAlignment: result.brand?.styleAlignment,
        overallScore: result.brand?.overallBrandScore,
    });

    if (result.brand && !result.brand.matchesBrand) {
        console.log('Brand issues found:');
        result.brand.issues.forEach(issue => {
            console.log(`- ${issue.category}: ${issue.message}`);
            console.log(`  Suggestion: ${issue.suggestion}`);
        });
    }

    return result;
}

/**
 * Example 4: SEO optimization
 */
export async function example4_SEOOptimization() {
    const qaStrand = getQualityAssuranceStrand();

    const input: QualityAssuranceInput = {
        content: `This is a nice property. It has rooms and a yard. 
        The location is good. You should check it out.`,
        validationTypes: ['seo'],
        targetKeywords: ['luxury homes', 'downtown real estate', 'modern living'],
        contentType: 'blog',
    };

    const result = await qaStrand.validateContent(input);

    console.log('SEO Optimization Result:', {
        currentScore: result.seo?.currentScore,
        hasH1: result.seo?.structure.hasH1,
        readabilityScore: result.seo?.structure.readabilityScore,
        suggestions: result.seo?.contentSuggestions.length,
    });

    if (result.seo) {
        console.log('SEO Suggestions:');
        result.seo.contentSuggestions.forEach(suggestion => {
            console.log(`- [${suggestion.priority}] ${suggestion.message}`);
        });
    }

    return result;
}

/**
 * Example 5: Comprehensive quality assurance
 */
export async function example5_ComprehensiveQA() {
    const qaStrand = getQualityAssuranceStrand();

    const complianceRules: ComplianceRules = {
        checkFairHousing: true,
        checkDiscriminatory: true,
        checkLegal: true,
    };

    const brandGuidelines: BrandGuidelines = {
        voice: {
            tone: 'professional',
            formality: 'semi-formal',
            personality: ['trustworthy', 'expert', 'helpful'],
        },
        messaging: {
            keyMessages: ['Local expertise', 'Personalized service'],
            avoidPhrases: ['cheap', 'bargain'],
            preferredTerminology: {},
        },
        style: {
            sentenceLength: 'varied',
            paragraphLength: 'medium',
            useOfEmojis: false,
            useOfExclamation: 'minimal',
        },
    };

    const input: QualityAssuranceInput = {
        content: `Discover Your Dream Home in Downtown
        
        Looking for the perfect place to call home? This stunning 3-bedroom, 2-bathroom 
        property offers everything you need and more. Located in the heart of downtown, 
        you'll enjoy easy access to shopping, dining, and entertainment.
        
        Features include:
        - Spacious open floor plan
        - Modern kitchen with stainless steel appliances
        - Hardwood floors throughout
        - Private backyard perfect for entertaining
        
        Don't miss this opportunity to own a piece of downtown living. Contact us today 
        to schedule a viewing!`,
        validationTypes: ['factual', 'grammar', 'compliance', 'brand', 'seo'],
        complianceRules,
        brandGuidelines,
        targetKeywords: ['downtown homes', 'modern living', 'real estate'],
        contentType: 'blog',
    };

    const result = await qaStrand.validateContent(input);

    console.log('Comprehensive QA Result:');
    console.log('- Final Recommendation:', result.finalRecommendation);
    console.log('- Overall Score:', result.validation.overallScore);
    console.log('- Summary:', result.summary);
    console.log('\nAction Items:');
    result.actionItems.forEach((item, index) => {
        console.log(`${index + 1}. [${item.priority}] ${item.action}`);
        console.log(`   Rationale: ${item.rationale}`);
    });

    return result;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('=== Example 1: Basic Validation ===');
    await example1_BasicValidation();

    console.log('\n=== Example 2: Compliance Check ===');
    await example2_ComplianceCheck();

    console.log('\n=== Example 3: Brand Validation ===');
    await example3_BrandValidation();

    console.log('\n=== Example 4: SEO Optimization ===');
    await example4_SEOOptimization();

    console.log('\n=== Example 5: Comprehensive QA ===');
    await example5_ComprehensiveQA();
}
