/**
 * Example: NAP Comparison Integration
 * 
 * This file demonstrates how to integrate the NAP comparison logic
 * into the website analysis flow.
 * 
 * This is an example file, not a test file.
 */

import { compareNAPData, generateDiscrepancyReport, checkInternalConsistency } from '../website-analysis-nap-comparison';
import type { NAPData } from '@/ai/schemas/website-analysis-schemas';

/**
 * Example: Using NAP comparison in the website analysis flow
 */
export function exampleNAPComparison() {
    // Step 1: Extract NAP data from website (this would come from the crawler)
    const extractedNAP: NAPData = {
        names: ['John Doe Real Estate'],
        phones: ['(555) 123-4567', '555.123.4567'], // Multiple formats
        emails: ['john@example.com', 'contact@johndoe.com'],
        addresses: ['123 Main Street, Suite 100, City, ST 12345'],
    };

    // Step 2: Get profile data (this would come from the user's profile)
    const profileNAP = {
        name: 'John Doe Real Estate',
        phone: '555-123-4567',
        address: '123 Main St, Ste 100, City, ST 12345',
        email: 'john@example.com',
    };

    // Step 3: Check for internal inconsistencies on the website
    const internalInconsistencies = checkInternalConsistency(extractedNAP);

    if (internalInconsistencies.length > 0) {
        console.log('Warning: Found internal inconsistencies on website:');
        internalInconsistencies.forEach(inc => {
            console.log(`  ${inc.field}: ${inc.values.join(', ')}`);
            console.log(`  Reason: ${inc.reason}`);
        });
    }

    // Step 4: Compare extracted NAP with profile NAP
    const comparisonResult = compareNAPData(extractedNAP, profileNAP);

    // Step 5: Access the results
    console.log('NAP Consistency Results:');
    console.log(`  Overall Score: ${comparisonResult.napConsistency.overallConsistency}/100`);
    console.log(`  Name Match: ${comparisonResult.napConsistency.name.matches} (confidence: ${comparisonResult.napConsistency.name.confidence})`);
    console.log(`  Address Match: ${comparisonResult.napConsistency.address.matches} (confidence: ${comparisonResult.napConsistency.address.confidence})`);
    console.log(`  Phone Match: ${comparisonResult.napConsistency.phone.matches} (confidence: ${comparisonResult.napConsistency.phone.confidence})`);

    // Step 6: Generate discrepancy report if needed
    if (comparisonResult.discrepancies.length > 0) {
        const report = generateDiscrepancyReport(comparisonResult.discrepancies);
        console.log('\n' + report);
    }

    // Step 7: Use the napConsistency object in the WebsiteAnalysisResult
    // This would be part of the full analysis result
    const websiteAnalysisResult = {
        // ... other fields ...
        napConsistency: comparisonResult.napConsistency,
        // ... other fields ...
    };

    return websiteAnalysisResult;
}

/**
 * Example: Integration in Bedrock flow
 * 
 * This shows how the NAP comparison would be integrated into the
 * website analysis Bedrock flow.
 */
export function exampleBedrockFlowIntegration() {
    // In src/aws/bedrock/flows/website-analysis.ts:

    // After extracting NAP data from HTML:
    const napData: NAPData = {
        names: ['John Doe Real Estate'],
        phones: ['555-123-4567'],
        emails: ['john@example.com'],
        addresses: ['123 Main St'],
    };

    // Get profile data from input:
    const profileData = {
        name: 'John Doe Real Estate',
        phone: '555-123-4567',
        address: '123 Main St',
        email: 'john@example.com',
    };

    // Compare NAP data:
    const napComparison = compareNAPData(napData, profileData);

    // Use the result in the AI prompt or directly in the result:
    const analysisInput = {
        url: 'https://example.com',
        schemaData: {},
        metaTagData: {},
        napData: napData,
        napComparison: napComparison, // Include comparison result
        profileData: profileData,
    };

    // The napConsistency can be used directly in the WebsiteAnalysisResult
    // or passed to the AI for generating recommendations

    return {
        napConsistency: napComparison.napConsistency,
        // AI can use napComparison.discrepancies to generate specific recommendations
    };
}

/**
 * Example: Using in server actions
 * 
 * This shows how to use NAP comparison in server actions.
 */
export async function exampleServerActionUsage() {
    // In src/app/actions.ts:

    // After crawling and extracting data:
    const extractedNAP: NAPData = {
        names: ['John Doe Real Estate'],
        phones: ['555-123-4567'],
        emails: ['john@example.com'],
        addresses: ['123 Main St'],
    };

    // Get user profile:
    const userProfile = {
        name: 'John Doe Real Estate',
        phone: '555-123-4567',
        address: '123 Main St',
        email: 'john@example.com',
    };

    // Compare NAP:
    const napComparison = compareNAPData(extractedNAP, userProfile);

    // Check if there are discrepancies to report to user:
    if (napComparison.discrepancies.length > 0) {
        const report = generateDiscrepancyReport(napComparison.discrepancies);
        console.log('NAP Discrepancies found:', report);

        // Could send notification to user about discrepancies
    }

    // Return as part of analysis result:
    return {
        success: true,
        data: {
            napConsistency: napComparison.napConsistency,
            napDiscrepancies: napComparison.discrepancies,
        },
    };
}
