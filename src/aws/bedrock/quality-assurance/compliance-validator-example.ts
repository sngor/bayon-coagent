/**
 * Compliance Validator Usage Examples
 * 
 * This file demonstrates how to use the ComplianceValidator to check
 * real estate content for Fair Housing Act violations, discriminatory
 * language, and legal compliance issues.
 */

import { getComplianceValidator } from './compliance-validator';
import type { ComplianceRules } from './types';

/**
 * Example 1: Basic compliance check
 */
async function basicComplianceCheck() {
    console.log('=== Example 1: Basic Compliance Check ===\n');

    const complianceValidator = getComplianceValidator();

    const content = `
Beautiful 3-bedroom home in a quiet neighborhood. 
Perfect for families with children. Close to excellent schools.
Features include wheelchair-accessible entrance and wide doorways.
    `.trim();

    const rules: ComplianceRules = {
        checkFairHousing: true,
        checkDiscriminatory: true,
        checkLegal: true,
    };

    const result = await complianceValidator.validateCompliance(content, rules);

    console.log('Compliant:', result.compliant);
    console.log('Compliance Score:', result.complianceScore);
    console.log('Violations Found:', result.violations.length);
    console.log('\nOverall Risk:', result.riskAssessment.overallRisk);
    console.log('Legal Risk:', result.riskAssessment.legalRisk);
    console.log('\nRecommendations:');
    result.riskAssessment.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
    });
}

/**
 * Example 2: Detecting Fair Housing violations
 */
async function detectFairHousingViolations() {
    console.log('\n=== Example 2: Fair Housing Violations ===\n');

    const complianceValidator = getComplianceValidator();

    // Content with potential Fair Housing violations
    const problematicContent = `
Luxury condo perfect for young professionals without kids.
Great neighborhood for Christian families.
No Section 8 or welfare recipients.
Must be able-bodied to access upper floors.
    `.trim();

    const rules: ComplianceRules = {
        checkFairHousing: true,
        checkDiscriminatory: true,
        checkLegal: false,
    };

    const result = await complianceValidator.validateCompliance(
        problematicContent,
        rules,
        {
            strictMode: true, // Use strict interpretation
            confidenceThreshold: 0.6,
            includeEducation: true,
        }
    );

    console.log('Compliant:', result.compliant);
    console.log('Violations Found:', result.violations.length);
    console.log('\nDetailed Violations:');

    result.detailedViolations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.type.toUpperCase()}`);
        console.log(`   Severity: ${violation.severity}`);
        console.log(`   Message: ${violation.message}`);
        console.log(`   Suggestion: ${violation.suggestion}`);
        if (violation.protectedClass) {
            console.log(`   Protected Class: ${violation.protectedClass}`);
        }
        console.log(`   Confidence: ${(violation.confidence * 100).toFixed(0)}%`);
    });

    if (result.education) {
        console.log('\n=== Educational Information ===');
        console.log('\nFair Housing Overview:');
        console.log(result.education.fairHousingOverview);
        console.log('\nBest Practices:');
        result.education.bestPractices.forEach(practice => {
            console.log(`  - ${practice}`);
        });
    }
}

/**
 * Example 3: Checking compliant content
 */
async function checkCompliantContent() {
    console.log('\n=== Example 3: Compliant Content ===\n');

    const complianceValidator = getComplianceValidator();

    const compliantContent = `
Stunning 4-bedroom, 3-bathroom home with modern updates throughout.
Features include granite countertops, hardwood floors, and stainless steel appliances.
The property offers a spacious backyard, two-car garage, and energy-efficient windows.
Located in a desirable neighborhood with easy access to shopping, dining, and parks.
The home includes accessibility features such as a no-step entry and wide hallways.
    `.trim();

    const rules: ComplianceRules = {
        checkFairHousing: true,
        checkDiscriminatory: true,
        checkLegal: true,
    };

    const result = await complianceValidator.validateCompliance(compliantContent, rules);

    console.log('Compliant:', result.compliant);
    console.log('Compliance Score:', result.complianceScore);
    console.log('Violations Found:', result.violations.length);
    console.log('Overall Risk:', result.riskAssessment.overallRisk);
    console.log('\nRecommendations:');
    result.riskAssessment.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
    });
}

/**
 * Example 4: Custom compliance patterns
 */
async function customCompliancePatterns() {
    console.log('\n=== Example 4: Custom Compliance Patterns ===\n');

    const complianceValidator = getComplianceValidator();

    const content = `
Beautiful home in an exclusive gated community.
HOA requires background checks and credit score minimum of 700.
No short-term rentals allowed.
    `.trim();

    const rules: ComplianceRules = {
        checkFairHousing: true,
        checkDiscriminatory: true,
        checkLegal: true,
        customPatterns: [
            {
                pattern: 'exclusive',
                message: 'The word "exclusive" may suggest discrimination',
                severity: 'warning',
            },
            {
                pattern: 'credit score minimum',
                message: 'Specific credit score requirements may be discriminatory',
                severity: 'warning',
            },
        ],
    };

    const result = await complianceValidator.validateCompliance(content, rules);

    console.log('Compliant:', result.compliant);
    console.log('Violations Found:', result.violations.length);
    console.log('\nViolations by Type:');
    Object.entries(result.violationsByType).forEach(([type, violations]) => {
        if (violations.length > 0) {
            console.log(`  ${type}: ${violations.length}`);
        }
    });

    console.log('\nDetailed Violations:');
    result.detailedViolations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.message}`);
        console.log(`   Suggestion: ${violation.suggestion}`);
    });
}

/**
 * Example 5: Analyzing violations by protected class
 */
async function analyzeByProtectedClass() {
    console.log('\n=== Example 5: Violations by Protected Class ===\n');

    const complianceValidator = getComplianceValidator();

    const content = `
Perfect for mature adults without children.
Great for Christian families near the church.
Ideal for able-bodied residents - stairs to second floor.
    `.trim();

    const rules: ComplianceRules = {
        checkFairHousing: true,
        checkDiscriminatory: false,
        checkLegal: false,
    };

    const result = await complianceValidator.validateCompliance(content, rules);

    console.log('Violations by Protected Class:');
    Object.entries(result.violationsByClass).forEach(([protectedClass, violations]) => {
        if (violations.length > 0) {
            console.log(`\n${protectedClass.toUpperCase()}: ${violations.length} violation(s)`);
            violations.forEach(v => {
                console.log(`  - ${v.message}`);
                console.log(`    Fix: ${v.suggestion}`);
            });
        }
    });
}

/**
 * Example 6: Strict mode vs. normal mode
 */
async function compareStrictModes() {
    console.log('\n=== Example 6: Strict Mode Comparison ===\n');

    const complianceValidator = getComplianceValidator();

    const content = `
Charming home in a family-friendly neighborhood.
Close to places of worship and community centers.
    `.trim();

    const rules: ComplianceRules = {
        checkFairHousing: true,
        checkDiscriminatory: true,
        checkLegal: false,
    };

    // Normal mode
    console.log('NORMAL MODE:');
    const normalResult = await complianceValidator.validateCompliance(content, rules, {
        strictMode: false,
    });
    console.log(`  Violations: ${normalResult.violations.length}`);
    console.log(`  Risk: ${normalResult.riskAssessment.overallRisk}`);

    // Strict mode
    console.log('\nSTRICT MODE:');
    const strictResult = await complianceValidator.validateCompliance(content, rules, {
        strictMode: true,
    });
    console.log(`  Violations: ${strictResult.violations.length}`);
    console.log(`  Risk: ${strictResult.riskAssessment.overallRisk}`);

    if (strictResult.violations.length > normalResult.violations.length) {
        console.log('\nStrict mode detected additional potential issues:');
        const additionalViolations = strictResult.violations.slice(normalResult.violations.length);
        additionalViolations.forEach(v => {
            console.log(`  - ${v.message}`);
        });
    }
}

/**
 * Run all examples
 */
async function runAllExamples() {
    try {
        await basicComplianceCheck();
        await detectFairHousingViolations();
        await checkCompliantContent();
        await customCompliancePatterns();
        await analyzeByProtectedClass();
        await compareStrictModes();

        console.log('\n=== All Examples Completed ===\n');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Export for use in other files
export {
    basicComplianceCheck,
    detectFairHousingViolations,
    checkCompliantContent,
    customCompliancePatterns,
    analyzeByProtectedClass,
    compareStrictModes,
    runAllExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples();
}
