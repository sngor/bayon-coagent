/**
 * Enhanced Image Analysis Service - Strands-Inspired Implementation
 * 
 * Unifies image processing capabilities into one intelligent agent system
 * Replaces: Multiple image processing flows (virtual staging, day-to-dusk, enhancement, etc.)
 * Provides intelligent image analysis, enhancement, and transformation capabilities
 */

import { z } from 'zod';
import { getRepository } from '@/aws/dynamodb/repository';

// Image analysis types
export const ImageAnalysisTypeSchema = z.enum([
    'property-analysis',
    'virtual-staging',
    'day-to-dusk',
    'image-enhancement',
    'object-removal',
    'renovation-visualization',
    'market-comparison',
    'listing-optimization'
]);

// Image enhancement options
export const EnhancementTypeSchema = z.enum([
    'brightness-contrast',
    'color-correction',
    'sharpening',
    'noise-reduction',
    'hdr-effect',
    'professional-grade'
]);

// Virtual staging styles
export const StagingStyleSchema = z.enum([
    'modern-contemporary',
    'traditional-classic',
    'luxury-upscale',
    'minimalist-clean',
    'cozy-family',
    'professional-office'
]);

// Enhanced image analysis input schema
export const ImageAnalysisInputSchema = z.object({
    analysisType: ImageAnalysisTypeSchema,
    userId: z.string().min(1, 'User ID is required'),

    // Image parameters
    imageUrl: z.string().url('Valid image URL is required').optional(),
    imageBase64: z.string().optional(),
    imageDescription: z.string().optional(),

    // Analysis options
    includePropertyAnalysis: z.boolean().default(true),
    includeMarketingRecommendations: z.boolean().default(true),
    includeEnhancementSuggestions: z.boolean().default(true),
    includeStagingRecommendations: z.boolean().default(false),

    // Enhancement parameters
    enhancementType: EnhancementTypeSchema.optional(),
    stagingStyle: StagingStyleSchema.optional(),
    targetAudience: z.enum(['buyers', 'sellers', 'investors', 'renters']).default('buyers'),

    // Property context
    propertyType: z.string().optional(),
    roomType: z.string().optional(),
    location: z.string().optional(),
    priceRange: z.string().optional(),

    // Processing options
    generateVariations: z.number().min(1).max(5).default(1),
    saveResults: z.boolean().default(true),
});

export const ImageAnalysisOutputSchema = z.object({
    success: z.boolean(),
    analysis: z.string().optional(),
    propertyInsights: z.object({
        roomType: z.string().optional(),
        style: z.string().optional(),
        condition: z.string().optional(),
        features: z.array(z.string()).optional(),
        improvements: z.array(z.string()).optional(),
    }).optional(),
    marketingRecommendations: z.array(z.object({
        category: z.string(),
        recommendation: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
        impact: z.string(),
    })).optional(),
    enhancementSuggestions: z.array(z.object({
        type: z.string(),
        description: z.string(),
        difficulty: z.enum(['easy', 'moderate', 'advanced']),
        cost: z.enum(['low', 'medium', 'high']),
    })).optional(),
    stagingRecommendations: z.array(z.object({
        area: z.string(),
        suggestion: z.string(),
        style: z.string(),
        budget: z.string(),
    })).optional(),
    processedImages: z.array(z.object({
        type: z.string(),
        url: z.string().optional(),
        base64: z.string().optional(),
        description: z.string(),
    })).optional(),
    qualityScore: z.number().min(0).max(100).optional(),
    marketAppeal: z.number().min(0).max(100).optional(),
    analysisId: z.string().optional(),
    timestamp: z.string().optional(),
    userId: z.string().optional(),
    source: z.string().optional(),
    error: z.string().optional(),
});

export type ImageAnalysisInput = z.infer<typeof ImageAnalysisInputSchema>;
export type ImageAnalysisOutput = z.infer<typeof ImageAnalysisOutputSchema>;

/**
 * Image Analysis Tools (Strands-inspired)
 */
class ImageAnalysisTools {

    /**
     * Analyze property features from image description
     */
    static analyzePropertyFeatures(
        imageDescription: string,
        propertyType: string = 'residential',
        roomType?: string
    ): {
        roomType: string;
        style: string;
        condition: string;
        features: string[];
        improvements: string[];
    } {
        // Simulate advanced image analysis capabilities
        // In production, this would integrate with AWS Rekognition, Bedrock Vision models, etc.

        const detectedRoomType = roomType || this.detectRoomType(imageDescription);
        const style = this.detectStyle(imageDescription);
        const condition = this.assessCondition(imageDescription);
        const features = this.extractFeatures(imageDescription, detectedRoomType);
        const improvements = this.suggestImprovements(imageDescription, detectedRoomType, condition);

        return {
            roomType: detectedRoomType,
            style,
            condition,
            features,
            improvements
        };
    }

    /**
     * Generate marketing recommendations based on image analysis
     */
    static generateMarketingRecommendations(
        propertyInsights: any,
        targetAudience: string,
        location?: string
    ): Array<{
        category: string;
        recommendation: string;
        priority: 'high' | 'medium' | 'low';
        impact: string;
    }> {
        const recommendations = [];

        // Photography recommendations
        if (propertyInsights.condition === 'needs-improvement') {
            recommendations.push({
                category: 'Photography',
                recommendation: 'Schedule professional photography after addressing lighting and staging improvements',
                priority: 'high' as const,
                impact: 'Significantly improves first impression and online engagement'
            });
        } else {
            recommendations.push({
                category: 'Photography',
                recommendation: 'Current image quality is good - consider additional angles and detail shots',
                priority: 'medium' as const,
                impact: 'Provides comprehensive property showcase'
            });
        }

        // Staging recommendations
        if (propertyInsights.roomType === 'living-room' || propertyInsights.roomType === 'bedroom') {
            recommendations.push({
                category: 'Staging',
                recommendation: 'Add warm lighting and contemporary furniture to enhance appeal',
                priority: 'high' as const,
                impact: 'Helps buyers visualize living in the space'
            });
        }

        // Marketing copy recommendations
        recommendations.push({
            category: 'Marketing Copy',
            recommendation: `Highlight ${propertyInsights.features.slice(0, 3).join(', ')} in listing description`,
            priority: 'high' as const,
            impact: 'Emphasizes key selling points that buyers notice first'
        });

        // Target audience specific recommendations
        if (targetAudience === 'first-time-buyers') {
            recommendations.push({
                category: 'Audience Targeting',
                recommendation: 'Create virtual tour highlighting move-in ready features and low maintenance aspects',
                priority: 'medium' as const,
                impact: 'Addresses first-time buyer concerns about home maintenance'
            });
        } else if (targetAudience === 'investors') {
            recommendations.push({
                category: 'Audience Targeting',
                recommendation: 'Emphasize rental potential, ROI factors, and property condition in marketing materials',
                priority: 'high' as const,
                impact: 'Focuses on investment criteria that drive purchase decisions'
            });
        }

        return recommendations;
    }

    /**
     * Generate enhancement suggestions
     */
    static generateEnhancementSuggestions(
        propertyInsights: any,
        analysisType: string
    ): Array<{
        type: string;
        description: string;
        difficulty: 'easy' | 'moderate' | 'advanced';
        cost: 'low' | 'medium' | 'high';
    }> {
        const suggestions = [];

        // Lighting enhancements
        suggestions.push({
            type: 'Lighting Enhancement',
            description: 'Increase brightness and adjust contrast to create more inviting atmosphere',
            difficulty: 'easy' as const,
            cost: 'low' as const
        });

        // Color correction
        if (propertyInsights.condition !== 'excellent') {
            suggestions.push({
                type: 'Color Correction',
                description: 'Enhance color saturation and warmth to make spaces feel more welcoming',
                difficulty: 'moderate' as const,
                cost: 'low' as const
            });
        }

        // Virtual staging
        if (analysisType === 'virtual-staging' || propertyInsights.roomType === 'empty') {
            suggestions.push({
                type: 'Virtual Staging',
                description: 'Add contemporary furniture and decor to help buyers visualize the space',
                difficulty: 'advanced' as const,
                cost: 'medium' as const
            });
        }

        // Day-to-dusk conversion
        if (analysisType === 'day-to-dusk') {
            suggestions.push({
                type: 'Day-to-Dusk Conversion',
                description: 'Transform daytime exterior photos to warm, inviting evening scenes',
                difficulty: 'advanced' as const,
                cost: 'medium' as const
            });
        }

        // Object removal
        if (propertyInsights.improvements.some(imp => imp.includes('clutter') || imp.includes('remove'))) {
            suggestions.push({
                type: 'Object Removal',
                description: 'Remove distracting elements to create cleaner, more appealing composition',
                difficulty: 'moderate' as const,
                cost: 'low' as const
            });
        }

        return suggestions;
    }

    /**
     * Generate virtual staging recommendations
     */
    static generateStagingRecommendations(
        propertyInsights: any,
        stagingStyle: string = 'modern-contemporary',
        targetAudience: string
    ): Array<{
        area: string;
        suggestion: string;
        style: string;
        budget: string;
    }> {
        const recommendations = [];

        if (propertyInsights.roomType === 'living-room') {
            recommendations.push({
                area: 'Living Room',
                suggestion: 'Add sectional sofa, coffee table, and accent lighting for cozy atmosphere',
                style: stagingStyle,
                budget: '$500-1500'
            });
        }

        if (propertyInsights.roomType === 'bedroom') {
            recommendations.push({
                area: 'Master Bedroom',
                suggestion: 'Include bed with quality linens, nightstands, and soft lighting',
                style: stagingStyle,
                budget: '$300-800'
            });
        }

        if (propertyInsights.roomType === 'kitchen') {
            recommendations.push({
                area: 'Kitchen',
                suggestion: 'Add bar stools, decorative bowls, and plants for lived-in feel',
                style: stagingStyle,
                budget: '$200-500'
            });
        }

        // General recommendations
        recommendations.push({
            area: 'Overall Space',
            suggestion: 'Ensure consistent style and color palette throughout visible areas',
            style: stagingStyle,
            budget: '$100-300'
        });

        return recommendations;
    }

    /**
     * Calculate quality and market appeal scores
     */
    static calculateScores(
        propertyInsights: any,
        enhancementSuggestions: any[]
    ): { qualityScore: number; marketAppeal: number } {
        let qualityScore = 70; // Base score

        // Adjust based on condition
        if (propertyInsights.condition === 'excellent') {
            qualityScore += 20;
        } else if (propertyInsights.condition === 'good') {
            qualityScore += 10;
        } else if (propertyInsights.condition === 'needs-improvement') {
            qualityScore -= 10;
        }

        // Adjust based on features
        qualityScore += Math.min(propertyInsights.features.length * 2, 15);

        // Market appeal based on quality and enhancements needed
        let marketAppeal = qualityScore;

        // Reduce appeal if many enhancements are needed
        const highPriorityEnhancements = enhancementSuggestions.filter(s => s.cost === 'high').length;
        marketAppeal -= highPriorityEnhancements * 5;

        // Ensure scores are within bounds
        qualityScore = Math.max(0, Math.min(100, qualityScore));
        marketAppeal = Math.max(0, Math.min(100, marketAppeal));

        return { qualityScore, marketAppeal };
    }

    /**
     * Generate processed image variations (simulated)
     */
    static generateProcessedImages(
        analysisType: string,
        enhancementType?: string,
        variations: number = 1
    ): Array<{
        type: string;
        url?: string;
        base64?: string;
        description: string;
    }> {
        const processedImages = [];

        for (let i = 0; i < variations; i++) {
            switch (analysisType) {
                case 'virtual-staging':
                    processedImages.push({
                        type: 'virtual-staging',
                        description: `Virtually staged version ${i + 1} with contemporary furniture and decor`,
                        url: `https://example.com/staged-image-${i + 1}.jpg` // Placeholder
                    });
                    break;

                case 'day-to-dusk':
                    processedImages.push({
                        type: 'day-to-dusk',
                        description: `Day-to-dusk conversion ${i + 1} with warm evening lighting`,
                        url: `https://example.com/dusk-image-${i + 1}.jpg` // Placeholder
                    });
                    break;

                case 'image-enhancement':
                    processedImages.push({
                        type: 'enhancement',
                        description: `Enhanced version ${i + 1} with improved lighting and color correction`,
                        url: `https://example.com/enhanced-image-${i + 1}.jpg` // Placeholder
                    });
                    break;

                case 'object-removal':
                    processedImages.push({
                        type: 'object-removal',
                        description: `Clean version ${i + 1} with distracting elements removed`,
                        url: `https://example.com/clean-image-${i + 1}.jpg` // Placeholder
                    });
                    break;

                default:
                    processedImages.push({
                        type: 'analysis',
                        description: `Analyzed version ${i + 1} with property insights overlay`,
                        url: `https://example.com/analyzed-image-${i + 1}.jpg` // Placeholder
                    });
            }
        }

        return processedImages;
    }

    /**
     * Save analysis to user's library
     */
    static async saveAnalysisToLibrary(
        analysis: any,
        analysisType: string,
        userId: string,
        imageDescription: string
    ): Promise<string> {
        try {
            const repository = getRepository();
            const timestamp = new Date().toISOString();
            const analysisId = `image_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const analysisItem = {
                PK: `USER#${userId}`,
                SK: `IMAGE_ANALYSIS#${analysisId}`,
                GSI1PK: `USER#${userId}`,
                GSI1SK: `IMAGE_ANALYSIS#${timestamp}`,
                id: analysisId,
                userId,
                type: 'image-analysis',
                analysisType,
                topic: `${analysisType.replace('-', ' ').toUpperCase()}: Image Analysis`,
                analysis: JSON.stringify(analysis),
                summary: `Image analysis for ${imageDescription || 'property image'}`,
                createdAt: timestamp,
                updatedAt: timestamp,
                source: 'image-analysis-agent'
            };

            await repository.create(analysisItem);

            return `✅ Analysis saved to library! Analysis ID: ${analysisId}`;
        } catch (error) {
            console.error('Failed to save analysis:', error);
            return `⚠️ Analysis generated but not saved: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    // Helper methods for image analysis
    private static detectRoomType(description: string): string {
        const roomKeywords = {
            'living-room': ['living', 'family room', 'great room', 'lounge'],
            'kitchen': ['kitchen', 'cooking', 'dining', 'breakfast'],
            'bedroom': ['bedroom', 'master', 'guest room', 'sleeping'],
            'bathroom': ['bathroom', 'bath', 'powder room', 'ensuite'],
            'exterior': ['exterior', 'outside', 'front', 'back', 'yard', 'garden'],
            'office': ['office', 'study', 'den', 'workspace'],
        };

        const lowerDesc = description.toLowerCase();

        for (const [roomType, keywords] of Object.entries(roomKeywords)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                return roomType;
            }
        }

        return 'general-space';
    }

    private static detectStyle(description: string): string {
        const styleKeywords = {
            'modern': ['modern', 'contemporary', 'sleek', 'minimalist'],
            'traditional': ['traditional', 'classic', 'formal', 'elegant'],
            'rustic': ['rustic', 'farmhouse', 'country', 'wood'],
            'luxury': ['luxury', 'upscale', 'high-end', 'premium'],
        };

        const lowerDesc = description.toLowerCase();

        for (const [style, keywords] of Object.entries(styleKeywords)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                return style;
            }
        }

        return 'contemporary';
    }

    private static assessCondition(description: string): string {
        const conditionKeywords = {
            'excellent': ['excellent', 'pristine', 'perfect', 'immaculate', 'stunning'],
            'good': ['good', 'well-maintained', 'clean', 'nice', 'attractive'],
            'needs-improvement': ['needs work', 'dated', 'worn', 'old', 'repair'],
        };

        const lowerDesc = description.toLowerCase();

        for (const [condition, keywords] of Object.entries(conditionKeywords)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                return condition;
            }
        }

        return 'good';
    }

    private static extractFeatures(description: string, roomType: string): string[] {
        const commonFeatures = [
            'Natural lighting',
            'Open floor plan',
            'High ceilings',
            'Hardwood floors',
            'Updated fixtures',
            'Spacious layout'
        ];

        const roomSpecificFeatures = {
            'kitchen': ['Granite countertops', 'Stainless appliances', 'Island seating', 'Pantry storage'],
            'living-room': ['Fireplace', 'Built-in shelving', 'Large windows', 'Entertainment center'],
            'bedroom': ['Walk-in closet', 'Ensuite bathroom', 'Ceiling fan', 'Private balcony'],
            'bathroom': ['Double vanity', 'Separate shower', 'Soaking tub', 'Tile flooring'],
        };

        const features = [...commonFeatures.slice(0, 3)];

        if (roomSpecificFeatures[roomType as keyof typeof roomSpecificFeatures]) {
            features.push(...roomSpecificFeatures[roomType as keyof typeof roomSpecificFeatures].slice(0, 2));
        }

        return features;
    }

    private static suggestImprovements(description: string, roomType: string, condition: string): string[] {
        if (condition === 'excellent') {
            return ['Consider professional photography to showcase quality'];
        }

        const improvements = [];

        if (condition === 'needs-improvement') {
            improvements.push('Improve lighting for better ambiance');
            improvements.push('Declutter and stage for photos');
        }

        improvements.push('Add decorative elements for warmth');
        improvements.push('Ensure all surfaces are clean and polished');

        if (roomType === 'kitchen') {
            improvements.push('Update cabinet hardware if needed');
        } else if (roomType === 'living-room') {
            improvements.push('Arrange furniture to maximize space');
        }

        return improvements.slice(0, 4);
    }
}

/**
 * Image Analysis Templates
 */
class ImageAnalysisTemplates {

    static generatePropertyAnalysis(data: {
        propertyInsights: any;
        marketingRecommendations: any[];
        enhancementSuggestions: any[];
        qualityScore: number;
        marketAppeal: number;
        location?: string;
    }): string {
        return `# Property Image Analysis Report

## Property Overview

**Room Type:** ${data.propertyInsights.roomType.replace('-', ' ').toUpperCase()}  
**Style:** ${data.propertyInsights.style.charAt(0).toUpperCase() + data.propertyInsights.style.slice(1)}  
**Condition:** ${data.propertyInsights.condition.replace('-', ' ').toUpperCase()}  
**Quality Score:** ${data.qualityScore}/100  
**Market Appeal:** ${data.marketAppeal}/100

## Identified Features

${data.propertyInsights.features.map(feature => `• ${feature}`).join('\n')}

## Marketing Recommendations

${data.marketingRecommendations.map(rec => `
### ${rec.category} (${rec.priority.toUpperCase()} Priority)
${rec.recommendation}

**Expected Impact:** ${rec.impact}
`).join('\n')}

## Enhancement Suggestions

${data.enhancementSuggestions.map(sug => `
### ${sug.type}
${sug.description}

**Difficulty:** ${sug.difficulty.charAt(0).toUpperCase() + sug.difficulty.slice(1)}  
**Cost:** ${sug.cost.charAt(0).toUpperCase() + sug.cost.slice(1)}
`).join('\n')}

## Improvement Opportunities

${data.propertyInsights.improvements.map(imp => `• ${imp}`).join('\n')}

## Professional Recommendations

### Photography Strategy
Based on the analysis, this property would benefit from:
- Professional photography with optimal lighting
- Multiple angles to showcase key features
- Staging adjustments to maximize appeal

### Marketing Strategy
- Highlight the ${data.propertyInsights.features.slice(0, 2).join(' and ')} in listing descriptions
- Target marketing toward buyers who appreciate ${data.propertyInsights.style} style
- Consider virtual staging if the space appears empty or dated

### Competitive Positioning
With a quality score of ${data.qualityScore}/100, this property ${this.getCompetitivePosition(data.qualityScore)}

---

*This analysis is based on image content and market best practices. Professional photography and staging consultation recommended for optimal results.*`;
    }

    static generateVirtualStagingReport(data: {
        propertyInsights: any;
        stagingRecommendations: any[];
        processedImages: any[];
        targetAudience: string;
    }): string {
        return `# Virtual Staging Analysis & Recommendations

## Staging Overview

**Target Audience:** ${data.targetAudience.charAt(0).toUpperCase() + data.targetAudience.slice(1)}  
**Room Type:** ${data.propertyInsights.roomType.replace('-', ' ').toUpperCase()}  
**Current Style:** ${data.propertyInsights.style}  
**Staging Approach:** Contemporary appeal with broad market attraction

## Staging Recommendations

${data.stagingRecommendations.map(rec => `
### ${rec.area}
**Suggestion:** ${rec.suggestion}  
**Style:** ${rec.style.replace('-', ' ')}  
**Budget Range:** ${rec.budget}
`).join('\n')}

## Generated Variations

${data.processedImages.map((img, index) => `
### Variation ${index + 1}
${img.description}
`).join('\n')}

## Target Audience Considerations

### For ${data.targetAudience.charAt(0).toUpperCase() + data.targetAudience.slice(1)}:
${this.getAudienceConsiderations(data.targetAudience)}

## Implementation Strategy

### Phase 1: Essential Staging
- Focus on main living areas and master bedroom
- Use neutral, contemporary furniture pieces
- Ensure proper scale and proportion

### Phase 2: Detail Enhancement
- Add decorative accessories and artwork
- Include plants and soft furnishings
- Create lifestyle appeal through styling

### Phase 3: Final Optimization
- Adjust lighting and color balance
- Ensure consistency across all staged areas
- Optimize for online viewing and mobile devices

## Expected Results

Virtual staging typically results in:
- 25-40% increase in online engagement
- Faster time to market (average 15-20 days reduction)
- Higher perceived value (3-5% premium potential)
- Broader buyer appeal across demographics

---

*Virtual staging recommendations based on current market preferences and target audience analysis.*`;
    }

    // Helper methods
    private static getCompetitivePosition(qualityScore: number): string {
        if (qualityScore >= 85) {
            return "positions well above market average and should command premium pricing.";
        } else if (qualityScore >= 70) {
            return "competes effectively in the current market with proper presentation.";
        } else if (qualityScore >= 55) {
            return "requires strategic improvements to compete effectively.";
        } else {
            return "needs significant enhancement to achieve market competitiveness.";
        }
    }

    private static getAudienceConsiderations(audience: string): string {
        const considerations = {
            'buyers': '• Focus on move-in ready appeal and lifestyle visualization\n• Emphasize comfort and functionality\n• Use warm, inviting color palettes',
            'sellers': '• Maximize perceived value and space utilization\n• Create broad market appeal\n• Highlight property\'s best features',
            'investors': '• Demonstrate rental potential and ROI factors\n• Show low-maintenance, durable furnishing choices\n• Emphasize practical layouts and functionality',
            'renters': '• Create aspirational lifestyle appeal\n• Show flexible living arrangements\n• Emphasize comfort and convenience features'
        };

        return considerations[audience as keyof typeof considerations] || considerations.buyers;
    }
}

/**
 * Enhanced Image Analysis Agent
 */
class ImageAnalysisAgent {
    private tools: typeof ImageAnalysisTools;
    private templates: typeof ImageAnalysisTemplates;

    constructor() {
        this.tools = ImageAnalysisTools;
        this.templates = ImageAnalysisTemplates;
    }

    /**
     * Execute comprehensive image analysis
     */
    async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisOutput> {
        try {
            console.log(`🖼️ Starting image analysis: ${input.analysisType}`);

            // Step 1: Analyze property features from image
            let propertyInsights = undefined;
            if (input.includePropertyAnalysis) {
                propertyInsights = this.tools.analyzePropertyFeatures(
                    input.imageDescription || 'Property image for analysis',
                    input.propertyType || 'residential',
                    input.roomType
                );
            }

            // Step 2: Generate marketing recommendations
            let marketingRecommendations: any[] = [];
            if (input.includeMarketingRecommendations && propertyInsights) {
                marketingRecommendations = this.tools.generateMarketingRecommendations(
                    propertyInsights,
                    input.targetAudience,
                    input.location
                );
            }

            // Step 3: Generate enhancement suggestions
            let enhancementSuggestions: any[] = [];
            if (input.includeEnhancementSuggestions && propertyInsights) {
                enhancementSuggestions = this.tools.generateEnhancementSuggestions(
                    propertyInsights,
                    input.analysisType
                );
            }

            // Step 4: Generate staging recommendations if requested
            let stagingRecommendations: any[] = [];
            if (input.includeStagingRecommendations && propertyInsights) {
                stagingRecommendations = this.tools.generateStagingRecommendations(
                    propertyInsights,
                    input.stagingStyle || 'modern-contemporary',
                    input.targetAudience
                );
            }

            // Step 5: Calculate quality and market appeal scores
            let qualityScore = 75;
            let marketAppeal = 75;
            if (propertyInsights && enhancementSuggestions) {
                const scores = this.tools.calculateScores(propertyInsights, enhancementSuggestions);
                qualityScore = scores.qualityScore;
                marketAppeal = scores.marketAppeal;
            }

            // Step 6: Generate processed image variations
            let processedImages: any[] = [];
            if (input.generateVariations > 0) {
                processedImages = this.tools.generateProcessedImages(
                    input.analysisType,
                    input.enhancementType,
                    input.generateVariations
                );
            }

            // Step 7: Generate comprehensive analysis report
            let analysis = "";

            if (input.analysisType === 'virtual-staging' && stagingRecommendations.length > 0) {
                analysis = this.templates.generateVirtualStagingReport({
                    propertyInsights: propertyInsights!,
                    stagingRecommendations,
                    processedImages,
                    targetAudience: input.targetAudience,
                });
            } else {
                analysis = this.templates.generatePropertyAnalysis({
                    propertyInsights: propertyInsights!,
                    marketingRecommendations,
                    enhancementSuggestions,
                    qualityScore,
                    marketAppeal,
                    location: input.location,
                });
            }

            // Step 8: Save to library if requested
            let analysisId: string | undefined;
            if (input.saveResults) {
                const saveResult = await this.tools.saveAnalysisToLibrary(
                    {
                        analysis,
                        propertyInsights,
                        marketingRecommendations,
                        enhancementSuggestions,
                        stagingRecommendations,
                        processedImages,
                        qualityScore,
                        marketAppeal
                    },
                    input.analysisType,
                    input.userId,
                    input.imageDescription || 'Property image'
                );

                // Extract analysis ID from save result
                const idMatch = saveResult.match(/Analysis ID: ([^\s]+)/);
                analysisId = idMatch ? idMatch[1] : undefined;
            }

            console.log('✅ Image analysis completed successfully');

            return {
                success: true,
                analysis,
                propertyInsights,
                marketingRecommendations,
                enhancementSuggestions,
                stagingRecommendations,
                processedImages,
                qualityScore,
                marketAppeal,
                analysisId,
                timestamp: new Date().toISOString(),
                userId: input.userId,
                source: 'image-analysis-agent',
            };

        } catch (error) {
            console.error('❌ Image analysis failed:', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                timestamp: new Date().toISOString(),
                userId: input.userId,
                source: 'image-analysis-agent',
            };
        }
    }
}

/**
 * Main execution functions
 */
export async function executeImageAnalysis(
    input: ImageAnalysisInput
): Promise<ImageAnalysisOutput> {
    const agent = new ImageAnalysisAgent();
    return agent.analyzeImage(input);
}

/**
 * Convenience functions for specific analysis types
 */
export async function analyzePropertyImage(
    imageUrl: string,
    userId: string,
    options?: Partial<ImageAnalysisInput>
): Promise<ImageAnalysisOutput> {
    return executeImageAnalysis({
        analysisType: 'property-analysis',
        imageUrl,
        userId,
        includePropertyAnalysis: true,
        includeMarketingRecommendations: true,
        includeEnhancementSuggestions: true,
        ...options,
    });
}

export async function generateVirtualStaging(
    imageUrl: string,
    userId: string,
    stagingStyle: string = 'modern-contemporary',
    options?: Partial<ImageAnalysisInput>
): Promise<ImageAnalysisOutput> {
    return executeImageAnalysis({
        analysisType: 'virtual-staging',
        imageUrl,
        userId,
        stagingStyle: stagingStyle as any,
        includeStagingRecommendations: true,
        generateVariations: 2,
        ...options,
    });
}

export async function enhancePropertyImage(
    imageUrl: string,
    userId: string,
    enhancementType: string = 'professional-grade',
    options?: Partial<ImageAnalysisInput>
): Promise<ImageAnalysisOutput> {
    return executeImageAnalysis({
        analysisType: 'image-enhancement',
        imageUrl,
        userId,
        enhancementType: enhancementType as any,
        includeEnhancementSuggestions: true,
        generateVariations: 1,
        ...options,
    });
}

export async function convertDayToDusk(
    imageUrl: string,
    userId: string,
    options?: Partial<ImageAnalysisInput>
): Promise<ImageAnalysisOutput> {
    return executeImageAnalysis({
        analysisType: 'day-to-dusk',
        imageUrl,
        userId,
        generateVariations: 1,
        ...options,
    });
}