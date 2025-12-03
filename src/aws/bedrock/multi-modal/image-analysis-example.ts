/**
 * Image Analysis Strand - Usage Examples
 * 
 * This file demonstrates how to use the ImageAnalysisStrand for various
 * property image analysis tasks.
 */

import { getImageAnalysisStrand } from './image-analysis-strand';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example 1: Comprehensive Image Analysis
 * 
 * Analyzes a property image for quality, content, and improvement suggestions
 */
export async function comprehensiveAnalysisExample() {
    const strand = getImageAnalysisStrand();

    // Load image (in real usage, this would come from user upload)
    const imagePath = path.join(process.cwd(), 'test-images', 'property-kitchen.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageData = imageBuffer.toString('base64');

    // Agent profile for personalization
    const agentProfile: AgentProfile = {
        id: 'agent-123',
        userId: 'user-123',
        agentName: 'Sarah Johnson',
        primaryMarket: 'Austin, TX',
        specialization: 'luxury',
        preferredTone: 'warm-consultative',
        corePrinciple: 'Exceptional service and attention to detail',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Perform comprehensive analysis
    const analysis = await strand.analyzeImage({
        imageData,
        imageFormat: 'jpeg',
        analysisType: 'comprehensive',
        propertyType: 'Single Family Home',
        agentProfile,
    }, 'user-123');

    console.log('=== Comprehensive Image Analysis ===');
    console.log('\nQuality Metrics:');
    console.log(`  Overall: ${(analysis.quality.overall * 100).toFixed(1)}%`);
    console.log(`  Resolution: ${(analysis.quality.resolution * 100).toFixed(1)}%`);
    console.log(`  Lighting: ${(analysis.quality.lighting * 100).toFixed(1)}%`);
    console.log(`  Composition: ${(analysis.quality.composition * 100).toFixed(1)}%`);
    console.log(`  Clarity: ${(analysis.quality.clarity * 100).toFixed(1)}%`);

    console.log('\nContent Identification:');
    console.log(`  Room Type: ${analysis.content.roomType}`);
    console.log(`  Style: ${analysis.content.style}`);
    console.log(`  Condition: ${analysis.content.condition}`);
    console.log(`  Materials: ${analysis.content.materials.join(', ')}`);
    console.log(`  Colors: ${analysis.content.colors.join(', ')}`);
    console.log(`  Features: ${analysis.content.features.join(', ')}`);

    console.log('\nImprovement Suggestions:');
    analysis.suggestions.forEach((suggestion, index) => {
        console.log(`\n  ${index + 1}. ${suggestion.description}`);
        console.log(`     Type: ${suggestion.type}`);
        console.log(`     Priority: ${suggestion.priority}`);
        console.log(`     Cost: ${suggestion.estimatedCost}`);
        console.log(`     Rationale: ${suggestion.rationale}`);
        console.log(`     Impact: ${suggestion.expectedImpact}`);
    });

    console.log('\nOverall Assessment:');
    console.log(`  ${analysis.overallAssessment}`);

    if (analysis.marketAlignment) {
        console.log('\nMarket Alignment:');
        console.log(`  ${analysis.marketAlignment}`);
    }

    return analysis;
}

/**
 * Example 2: Quality Assessment Only
 * 
 * Quickly assesses image quality without full analysis
 */
export async function qualityAssessmentExample() {
    const strand = getImageAnalysisStrand();

    const imagePath = path.join(process.cwd(), 'test-images', 'property-exterior.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageData = imageBuffer.toString('base64');

    const quality = await strand.assessQuality(imageData, 'jpeg', 'user-123');

    console.log('=== Quality Assessment ===');
    console.log(`Overall Quality: ${(quality.overall * 100).toFixed(1)}%`);
    console.log(`Resolution: ${(quality.resolution * 100).toFixed(1)}%`);
    console.log(`Lighting: ${(quality.lighting * 100).toFixed(1)}%`);
    console.log(`Composition: ${(quality.composition * 100).toFixed(1)}%`);
    console.log(`Clarity: ${(quality.clarity * 100).toFixed(1)}%`);

    // Determine if image meets quality standards
    if (quality.overall >= 0.8) {
        console.log('\n✓ Image meets quality standards for listing');
    } else if (quality.overall >= 0.6) {
        console.log('\n⚠ Image is acceptable but could be improved');
    } else {
        console.log('\n✗ Image quality is below standards - retake recommended');
    }

    return quality;
}

/**
 * Example 3: Content Identification
 * 
 * Identifies what's in the image without quality assessment
 */
export async function contentIdentificationExample() {
    const strand = getImageAnalysisStrand();

    const imagePath = path.join(process.cwd(), 'test-images', 'property-bathroom.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageData = imageBuffer.toString('base64');

    const content = await strand.identifyContent(
        imageData,
        'jpeg',
        'Condominium',
        'user-123'
    );

    console.log('=== Content Identification ===');
    console.log(`Room Type: ${content.roomType}`);
    console.log(`Style: ${content.style}`);
    console.log(`Condition: ${content.condition}`);
    console.log(`\nMaterials Found:`);
    content.materials.forEach(material => console.log(`  - ${material}`));
    console.log(`\nColor Scheme:`);
    content.colors.forEach(color => console.log(`  - ${color}`));
    console.log(`\nNotable Features:`);
    content.features.forEach(feature => console.log(`  - ${feature}`));

    return content;
}

/**
 * Example 4: Improvement Suggestions
 * 
 * Gets actionable recommendations for improving the image or space
 */
export async function improvementSuggestionsExample() {
    const strand = getImageAnalysisStrand();

    const imagePath = path.join(process.cwd(), 'test-images', 'property-living-room.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageData = imageBuffer.toString('base64');

    const agentProfile: AgentProfile = {
        id: 'agent-456',
        userId: 'user-456',
        agentName: 'Michael Chen',
        primaryMarket: 'San Francisco, CA',
        specialization: 'first-time-buyers',
        preferredTone: 'direct-data-driven',
        corePrinciple: 'Data-driven decisions for first-time buyers',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const suggestions = await strand.suggestImprovements(
        imageData,
        'jpeg',
        agentProfile,
        'user-456'
    );

    console.log('=== Improvement Suggestions ===');
    console.log(`Found ${suggestions.length} recommendations:\n`);

    // Group by priority
    const highPriority = suggestions.filter(s => s.priority === 'high');
    const mediumPriority = suggestions.filter(s => s.priority === 'medium');
    const lowPriority = suggestions.filter(s => s.priority === 'low');

    if (highPriority.length > 0) {
        console.log('HIGH PRIORITY:');
        highPriority.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.description}`);
            console.log(`     Cost: ${s.estimatedCost} | Type: ${s.type}`);
            console.log(`     ${s.rationale}\n`);
        });
    }

    if (mediumPriority.length > 0) {
        console.log('MEDIUM PRIORITY:');
        mediumPriority.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.description}`);
            console.log(`     Cost: ${s.estimatedCost} | Type: ${s.type}`);
            console.log(`     ${s.rationale}\n`);
        });
    }

    if (lowPriority.length > 0) {
        console.log('LOW PRIORITY:');
        lowPriority.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.description}`);
            console.log(`     Cost: ${s.estimatedCost} | Type: ${s.type}`);
            console.log(`     ${s.rationale}\n`);
        });
    }

    return suggestions;
}

/**
 * Example 5: Batch Image Analysis
 * 
 * Analyzes multiple images for a property listing
 */
export async function batchAnalysisExample() {
    const strand = getImageAnalysisStrand();

    const imageFiles = [
        'property-exterior.jpg',
        'property-kitchen.jpg',
        'property-living-room.jpg',
        'property-bathroom.jpg',
        'property-bedroom.jpg',
    ];

    console.log('=== Batch Image Analysis ===');
    console.log(`Analyzing ${imageFiles.length} images...\n`);

    const results = [];

    for (const filename of imageFiles) {
        const imagePath = path.join(process.cwd(), 'test-images', filename);
        const imageBuffer = fs.readFileSync(imagePath);
        const imageData = imageBuffer.toString('base64');

        const analysis = await strand.analyzeImage({
            imageData,
            imageFormat: 'jpeg',
            analysisType: 'comprehensive',
        }, 'user-123');

        results.push({
            filename,
            analysis,
        });

        console.log(`✓ ${filename}`);
        console.log(`  Room: ${analysis.content.roomType}`);
        console.log(`  Quality: ${(analysis.quality.overall * 100).toFixed(1)}%`);
        console.log(`  Suggestions: ${analysis.suggestions.length}`);
        console.log('');
    }

    // Summary statistics
    const avgQuality = results.reduce((sum, r) => sum + r.analysis.quality.overall, 0) / results.length;
    const totalSuggestions = results.reduce((sum, r) => sum + r.analysis.suggestions.length, 0);
    const highPrioritySuggestions = results.reduce(
        (sum, r) => sum + r.analysis.suggestions.filter(s => s.priority === 'high').length,
        0
    );

    console.log('=== Summary ===');
    console.log(`Average Quality Score: ${(avgQuality * 100).toFixed(1)}%`);
    console.log(`Total Improvement Suggestions: ${totalSuggestions}`);
    console.log(`High Priority Items: ${highPrioritySuggestions}`);

    return results;
}

/**
 * Example 6: Integration with AgentCore
 * 
 * Shows how to register and use ImageAnalysisStrand with AgentCore
 */
export async function agentCoreIntegrationExample() {
    const { getAgentCore } = await import('../agent-core');
    const agentCore = getAgentCore();

    // Create and register the image analysis strand
    const imageStrand = getImageAnalysisStrand();

    console.log('=== AgentCore Integration ===');
    console.log(`Strand ID: ${imageStrand.id}`);
    console.log(`Strand Type: ${imageStrand.type}`);
    console.log(`Capabilities: ${imageStrand.capabilities.expertise.join(', ')}`);
    console.log(`Max Concurrent Tasks: ${imageStrand.capabilities.maxConcurrentTasks}`);
    console.log(`Quality Score: ${imageStrand.capabilities.qualityScore}`);
    console.log(`Speed Score: ${imageStrand.capabilities.speedScore}`);
    console.log(`Reliability Score: ${imageStrand.capabilities.reliabilityScore}`);

    // The strand can now be used by AgentCore for task allocation
    console.log('\n✓ ImageAnalysisStrand ready for task allocation');

    return imageStrand;
}

// Run examples if this file is executed directly
if (require.main === module) {
    (async () => {
        try {
            console.log('Running Image Analysis Strand Examples\n');
            console.log('='.repeat(60));

            // Run each example
            await comprehensiveAnalysisExample();
            console.log('\n' + '='.repeat(60) + '\n');

            await qualityAssessmentExample();
            console.log('\n' + '='.repeat(60) + '\n');

            await contentIdentificationExample();
            console.log('\n' + '='.repeat(60) + '\n');

            await improvementSuggestionsExample();
            console.log('\n' + '='.repeat(60) + '\n');

            await batchAnalysisExample();
            console.log('\n' + '='.repeat(60) + '\n');

            await agentCoreIntegrationExample();

        } catch (error) {
            console.error('Error running examples:', error);
            process.exit(1);
        }
    })();
}
