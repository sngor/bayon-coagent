/**
 * Image Analysis Strand - Multi-Modal Processing for Property Images
 * 
 * This strand provides comprehensive image analysis capabilities for real estate properties,
 * including quality assessment, content identification, and improvement suggestions.
 * 
 * Features:
 * - Image quality assessment (resolution, lighting, composition, clarity)
 * - Content identification (room type, features, style, condition)
 * - Improvement suggestions with cost estimates and priorities
 * - Integration with Bedrock vision models via VisionAgent
 * 
 * Requirements validated:
 * - 5.1: Analyzes uploaded property images and suggests improvements
 * 
 * Property validated:
 * - Property 21: Image analysis completeness - For any uploaded property image,
 *   the analysis should include quality metrics, content identification, and improvement suggestions
 */

import type { AgentStrand, AgentCapabilities, AgentMemory, AgentMetrics } from '../agent-core';
import type { WorkerTask, WorkerResult } from '../worker-protocol';
import { getVisionAgent } from '../vision-agent';
import type { VisionAnalysisOutput } from '@/ai/schemas/vision-analysis-schemas';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Image quality metrics
 */
export interface ImageQualityMetrics {
    /** Resolution score (0-1) */
    resolution: number;

    /** Lighting quality score (0-1) */
    lighting: number;

    /** Composition quality score (0-1) */
    composition: number;

    /** Clarity/sharpness score (0-1) */
    clarity: number;

    /** Overall quality score (0-1) */
    overall: number;
}

/**
 * Image content identification
 */
export interface ImageContent {
    /** Type of room or space */
    roomType: string;

    /** Identified features */
    features: string[];

    /** Style or design aesthetic */
    style: string;

    /** Condition assessment */
    condition: string;

    /** Materials present */
    materials: string[];

    /** Color scheme */
    colors: string[];
}

/**
 * Image improvement suggestion
 */
export interface ImageImprovement {
    /** Type of improvement */
    type: 'staging' | 'lighting' | 'angle' | 'editing' | 'declutter' | 'repair' | 'enhancement';

    /** Description of the improvement */
    description: string;

    /** Rationale for the suggestion */
    rationale: string;

    /** Estimated cost category */
    estimatedCost: 'low' | 'medium' | 'high';

    /** Priority level */
    priority: 'high' | 'medium' | 'low';

    /** Expected impact on marketability */
    expectedImpact: string;
}

/**
 * Complete image analysis result
 */
export interface ImageAnalysis {
    /** Quality assessment metrics */
    quality: ImageQualityMetrics;

    /** Content identification */
    content: ImageContent;

    /** Improvement suggestions */
    suggestions: ImageImprovement[];

    /** Overall assessment */
    overallAssessment: string;

    /** Market alignment analysis */
    marketAlignment?: string;
}

/**
 * Image analysis task input
 */
export interface ImageAnalysisInput {
    /** Base64 encoded image data */
    imageData: string;

    /** Image format */
    imageFormat: 'jpeg' | 'png' | 'webp' | 'gif';

    /** Optional specific question or focus area */
    question?: string;

    /** Optional property type context */
    propertyType?: string;

    /** Agent profile for personalization */
    agentProfile?: AgentProfile;

    /** Analysis type */
    analysisType: 'quality' | 'content' | 'suggestions' | 'comprehensive';
}

/**
 * ImageAnalysisStrand - Specialized strand for property image analysis
 */
export class ImageAnalysisStrand implements AgentStrand {
    id: string;
    type: 'image-analyzer' = 'image-analyzer';
    capabilities: AgentCapabilities;
    state: 'idle' | 'active' | 'busy' | 'overloaded' | 'error' | 'maintenance';
    memory: AgentMemory;
    metrics: AgentMetrics;
    createdAt: string;
    lastActiveAt: string;

    private visionAgent = getVisionAgent();

    constructor(id?: string) {
        const now = new Date().toISOString();

        this.id = id || this.generateStrandId();
        this.state = 'idle';
        this.createdAt = now;
        this.lastActiveAt = now;

        this.capabilities = {
            expertise: [
                'image-analysis',
                'quality-assessment',
                'content-identification',
                'visual-recommendations',
                'property-photography',
                'staging-advice',
            ],
            taskTypes: [
                'image-quality-assessment',
                'content-identification',
                'improvement-suggestions',
                'comprehensive-analysis',
            ],
            qualityScore: 0.92,
            speedScore: 0.85,
            reliabilityScore: 0.95,
            maxConcurrentTasks: 3,
            preferredModel: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        };

        this.memory = {
            workingMemory: {},
            knowledgeBase: {},
            recentTasks: [],
            learnedPatterns: {},
        };

        this.metrics = {
            tasksCompleted: 0,
            successRate: 1.0,
            avgExecutionTime: 0,
            currentLoad: 0,
            recentQualityRatings: [],
            lastUpdated: now,
        };
    }

    /**
     * Analyzes a property image and provides comprehensive results
     * 
     * @param input - Image analysis input
     * @param userId - Optional user ID for tracking
     * @returns Complete image analysis
     */
    async analyzeImage(input: ImageAnalysisInput, userId?: string): Promise<ImageAnalysis> {
        const startTime = Date.now();

        try {
            this.state = 'active';
            this.lastActiveAt = new Date().toISOString();

            // Determine the question based on analysis type
            const question = this.constructQuestion(input);

            // Use VisionAgent for the analysis
            const visionResult = await this.visionAgent.analyze({
                imageData: input.imageData,
                imageFormat: input.imageFormat,
                question,
                agentProfile: input.agentProfile ? this.convertAgentProfile(input.agentProfile) : this.getDefaultAgentProfile(),
                propertyType: input.propertyType,
            }, userId);

            // Convert vision result to ImageAnalysis format
            const analysis = this.convertToImageAnalysis(visionResult, input.analysisType);

            // Update metrics
            const executionTime = Date.now() - startTime;
            this.updateMetrics(true, executionTime);

            return analysis;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.updateMetrics(false, executionTime);
            this.state = 'error';
            throw error;
        } finally {
            this.state = this.metrics.currentLoad > 0.8 ? 'busy' :
                this.metrics.currentLoad > 0 ? 'active' : 'idle';
        }
    }

    /**
     * Assesses image quality metrics
     * 
     * @param imageData - Base64 encoded image data
     * @param imageFormat - Image format
     * @returns Quality metrics
     */
    async assessQuality(
        imageData: string,
        imageFormat: 'jpeg' | 'png' | 'webp' | 'gif',
        userId?: string
    ): Promise<ImageQualityMetrics> {
        const analysis = await this.analyzeImage({
            imageData,
            imageFormat,
            analysisType: 'quality',
        }, userId);

        return analysis.quality;
    }

    /**
     * Identifies content in the image
     * 
     * @param imageData - Base64 encoded image data
     * @param imageFormat - Image format
     * @param propertyType - Optional property type
     * @returns Content identification
     */
    async identifyContent(
        imageData: string,
        imageFormat: 'jpeg' | 'png' | 'webp' | 'gif',
        propertyType?: string,
        userId?: string
    ): Promise<ImageContent> {
        const analysis = await this.analyzeImage({
            imageData,
            imageFormat,
            analysisType: 'content',
            propertyType,
        }, userId);

        return analysis.content;
    }

    /**
     * Generates improvement suggestions
     * 
     * @param imageData - Base64 encoded image data
     * @param imageFormat - Image format
     * @param agentProfile - Optional agent profile for personalization
     * @returns Improvement suggestions
     */
    async suggestImprovements(
        imageData: string,
        imageFormat: 'jpeg' | 'png' | 'webp' | 'gif',
        agentProfile?: AgentProfile,
        userId?: string
    ): Promise<ImageImprovement[]> {
        const analysis = await this.analyzeImage({
            imageData,
            imageFormat,
            analysisType: 'suggestions',
            agentProfile,
        }, userId);

        return analysis.suggestions;
    }

    /**
     * Constructs the appropriate question based on analysis type
     */
    private constructQuestion(input: ImageAnalysisInput): string {
        if (input.question) {
            return input.question;
        }

        switch (input.analysisType) {
            case 'quality':
                return 'Please assess the quality of this property image, including resolution, lighting, composition, and clarity. Provide specific quality scores and identify any technical issues.';

            case 'content':
                return 'Please identify and describe the content of this property image, including the room type, features, style, condition, materials, and color scheme.';

            case 'suggestions':
                return 'Please provide specific, actionable recommendations for improving this property image or the space it shows. Focus on staging, lighting, angles, and other improvements that would enhance marketability.';

            case 'comprehensive':
            default:
                return 'Please provide a comprehensive analysis of this property image, including quality assessment, content identification, and actionable improvement recommendations.';
        }
    }

    /**
     * Converts VisionAnalysisOutput to ImageAnalysis format
     */
    private convertToImageAnalysis(
        visionResult: VisionAnalysisOutput,
        analysisType: string
    ): ImageAnalysis {
        // Extract quality metrics from the analysis
        const quality = this.extractQualityMetrics(visionResult);

        // Extract content information
        const content: ImageContent = {
            roomType: this.inferRoomType(visionResult),
            features: visionResult.visualElements.notableFeatures || [],
            style: this.inferStyle(visionResult),
            condition: this.inferCondition(visionResult),
            materials: visionResult.visualElements.materials,
            colors: visionResult.visualElements.colors,
        };

        // Convert recommendations to improvement suggestions
        const suggestions: ImageImprovement[] = visionResult.recommendations.map(rec => ({
            type: this.categorizeImprovement(rec.action),
            description: rec.action,
            rationale: rec.rationale,
            estimatedCost: rec.estimatedCost,
            priority: rec.priority,
            expectedImpact: rec.expectedImpact || 'Improved marketability and visual appeal',
        }));

        return {
            quality,
            content,
            suggestions,
            overallAssessment: visionResult.overallAssessment,
            marketAlignment: visionResult.marketAlignment,
        };
    }

    /**
     * Extracts quality metrics from vision analysis
     */
    private extractQualityMetrics(visionResult: VisionAnalysisOutput): ImageQualityMetrics {
        // Analyze the visual elements and recommendations to infer quality scores
        const lightingScore = this.assessLightingQuality(visionResult.visualElements.lighting);
        const compositionScore = this.assessCompositionQuality(visionResult);
        const clarityScore = this.assessClarityQuality(visionResult);
        const resolutionScore = this.assessResolutionQuality(visionResult);

        const overall = (lightingScore + compositionScore + clarityScore + resolutionScore) / 4;

        return {
            resolution: resolutionScore,
            lighting: lightingScore,
            composition: compositionScore,
            clarity: clarityScore,
            overall,
        };
    }

    /**
     * Assesses lighting quality from lighting type
     */
    private assessLightingQuality(lighting: 'natural' | 'artificial' | 'mixed'): number {
        // Natural and mixed lighting typically score higher
        switch (lighting) {
            case 'natural':
                return 0.9;
            case 'mixed':
                return 0.85;
            case 'artificial':
                return 0.7;
            default:
                return 0.75;
        }
    }

    /**
     * Assesses composition quality from overall analysis
     */
    private assessCompositionQuality(visionResult: VisionAnalysisOutput): number {
        // Check for composition-related recommendations
        const hasCompositionIssues = visionResult.recommendations.some(rec =>
            rec.action.toLowerCase().includes('angle') ||
            rec.action.toLowerCase().includes('framing') ||
            rec.action.toLowerCase().includes('composition')
        );

        return hasCompositionIssues ? 0.6 : 0.85;
    }

    /**
     * Assesses clarity quality from recommendations
     */
    private assessClarityQuality(visionResult: VisionAnalysisOutput): number {
        const hasClarityIssues = visionResult.recommendations.some(rec =>
            rec.action.toLowerCase().includes('blur') ||
            rec.action.toLowerCase().includes('focus') ||
            rec.action.toLowerCase().includes('sharp')
        );

        return hasClarityIssues ? 0.5 : 0.9;
    }

    /**
     * Assesses resolution quality from recommendations
     */
    private assessResolutionQuality(visionResult: VisionAnalysisOutput): number {
        const hasResolutionIssues = visionResult.recommendations.some(rec =>
            rec.action.toLowerCase().includes('resolution') ||
            rec.action.toLowerCase().includes('quality') ||
            rec.action.toLowerCase().includes('pixelated')
        );

        return hasResolutionIssues ? 0.6 : 0.9;
    }

    /**
     * Infers room type from visual elements
     */
    private inferRoomType(visionResult: VisionAnalysisOutput): string {
        const layout = visionResult.visualElements.layout.toLowerCase();
        const features = (visionResult.visualElements.notableFeatures || []).join(' ').toLowerCase();

        if (layout.includes('kitchen') || features.includes('kitchen')) return 'Kitchen';
        if (layout.includes('bathroom') || features.includes('bathroom')) return 'Bathroom';
        if (layout.includes('bedroom') || features.includes('bedroom')) return 'Bedroom';
        if (layout.includes('living') || features.includes('living')) return 'Living Room';
        if (layout.includes('dining') || features.includes('dining')) return 'Dining Room';
        if (layout.includes('exterior') || features.includes('exterior')) return 'Exterior';

        return 'General Space';
    }

    /**
     * Infers style from visual elements
     */
    private inferStyle(visionResult: VisionAnalysisOutput): string {
        const materials = visionResult.visualElements.materials.join(' ').toLowerCase();
        const colors = visionResult.visualElements.colors.join(' ').toLowerCase();

        if (materials.includes('modern') || colors.includes('minimalist')) return 'Modern';
        if (materials.includes('traditional') || materials.includes('wood')) return 'Traditional';
        if (materials.includes('industrial') || materials.includes('metal')) return 'Industrial';
        if (colors.includes('neutral') || colors.includes('white')) return 'Contemporary';

        return 'Mixed Style';
    }

    /**
     * Infers condition from recommendations
     */
    private inferCondition(visionResult: VisionAnalysisOutput): string {
        const highPriorityRepairs = visionResult.recommendations.filter(
            rec => rec.priority === 'high' && rec.estimatedCost === 'high'
        ).length;

        if (highPriorityRepairs > 2) return 'Needs Significant Work';
        if (highPriorityRepairs > 0) return 'Needs Some Updates';

        const mediumPriorityImprovements = visionResult.recommendations.filter(
            rec => rec.priority === 'medium'
        ).length;

        if (mediumPriorityImprovements > 3) return 'Good with Minor Improvements';

        return 'Excellent Condition';
    }

    /**
     * Categorizes improvement type from action description
     */
    private categorizeImprovement(action: string): ImageImprovement['type'] {
        const actionLower = action.toLowerCase();

        if (actionLower.includes('stage') || actionLower.includes('furniture')) return 'staging';
        if (actionLower.includes('light') || actionLower.includes('bright')) return 'lighting';
        if (actionLower.includes('angle') || actionLower.includes('perspective')) return 'angle';
        if (actionLower.includes('edit') || actionLower.includes('photo')) return 'editing';
        if (actionLower.includes('clutter') || actionLower.includes('clean')) return 'declutter';
        if (actionLower.includes('repair') || actionLower.includes('fix')) return 'repair';

        return 'enhancement';
    }

    /**
     * Converts AgentProfile to vision agent format
     */
    private convertAgentProfile(profile: AgentProfile) {
        return {
            agentName: profile.agentName,
            primaryMarket: profile.primaryMarket,
            specialization: profile.specialization,
            preferredTone: profile.preferredTone,
            corePrinciple: profile.corePrinciple,
        };
    }

    /**
     * Gets default agent profile when none is provided
     */
    private getDefaultAgentProfile() {
        return {
            agentName: 'Real Estate Professional',
            primaryMarket: 'General Market',
            specialization: 'general' as const,
            preferredTone: 'professional' as const,
            corePrinciple: 'Providing exceptional service and value',
        };
    }

    /**
     * Updates strand metrics after task completion
     */
    private updateMetrics(success: boolean, executionTime: number): void {
        this.metrics.tasksCompleted += 1;

        // Update success rate (weighted average of last 20 tasks)
        const recentSuccesses = this.memory.recentTasks.slice(0, 19).filter(t => t.success).length;
        this.metrics.successRate = (recentSuccesses + (success ? 1 : 0)) / Math.min(this.metrics.tasksCompleted, 20);

        // Update average execution time (weighted average of last 10 tasks)
        const recentTimes = this.memory.recentTasks.slice(0, 9).map(t => t.executionTime);
        const totalTime = recentTimes.reduce((sum, t) => sum + t, 0) + executionTime;
        this.metrics.avgExecutionTime = totalTime / Math.min(this.metrics.tasksCompleted, 10);

        // Update current load
        const activeTasks = Object.keys(this.memory.workingMemory).length;
        this.metrics.currentLoad = activeTasks / this.capabilities.maxConcurrentTasks;

        this.metrics.lastUpdated = new Date().toISOString();
    }

    /**
     * Generates a unique strand ID
     */
    private generateStrandId(): string {
        return `image-analysis-strand_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Singleton instance
 */
let imageAnalysisStrandInstance: ImageAnalysisStrand | null = null;

/**
 * Gets the singleton ImageAnalysisStrand instance
 */
export function getImageAnalysisStrand(): ImageAnalysisStrand {
    if (!imageAnalysisStrandInstance) {
        imageAnalysisStrandInstance = new ImageAnalysisStrand();
    }
    return imageAnalysisStrandInstance;
}

/**
 * Resets the ImageAnalysisStrand singleton (useful for testing)
 */
export function resetImageAnalysisStrand(): void {
    imageAnalysisStrandInstance = null;
}
