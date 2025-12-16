/**
 * Feature Categorization Service
 * 
 * Analyzes existing features and categorizes them by their suitability for 
 * microservices architecture extraction based on computational requirements,
 * data dependencies, and integration complexity.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Types for feature analysis
interface FeatureAnalysis {
    featureId: string;
    name: string;
    description: string;
    computationalRequirements: ComputationalRequirements;
    dataDependencies: DataDependency[];
    integrationPoints: IntegrationPoint[];
    currentImplementation: ImplementationDetails;
    scalabilityNeeds: ScalabilityAssessment;
}

interface ComputationalRequirements {
    cpuIntensive: boolean;
    memoryUsage: 'low' | 'medium' | 'high';
    ioOperations: 'minimal' | 'moderate' | 'heavy';
    processingTime: 'fast' | 'medium' | 'slow';
    concurrencyNeeds: number;
}

interface DataDependency {
    dependencyId: string;
    type: 'database' | 'external_api' | 'file_system' | 'cache' | 'message_queue';
    frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
    criticality: 'low' | 'medium' | 'high';
    dataVolume: 'small' | 'medium' | 'large';
}

interface IntegrationPoint {
    integrationId: string;
    type: 'rest_api' | 'graphql' | 'websocket' | 'message_queue' | 'database' | 'file_system';
    direction: 'inbound' | 'outbound' | 'bidirectional';
    protocol: string;
    frequency: 'low' | 'medium' | 'high';
    latencyRequirement: 'relaxed' | 'moderate' | 'strict';
}

interface ImplementationDetails {
    currentLocation: 'monolith' | 'microservice' | 'lambda' | 'container';
    codeComplexity: 'simple' | 'moderate' | 'complex';
    testCoverage: number;
    maintainabilityScore: number;
    performanceMetrics: PerformanceMetrics;
}

interface PerformanceMetrics {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    resourceUtilization: number;
}

interface ScalabilityAssessment {
    loadPattern: 'steady' | 'spiky' | 'seasonal' | 'unpredictable';
    growthProjection: 'stable' | 'linear' | 'exponential';
    resourceBottlenecks: string[];
    scalingStrategy: 'horizontal' | 'vertical' | 'hybrid';
}

interface CategorizationResult {
    featureId: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string[];
    score: number;
    recommendedAction: 'extract_immediately' | 'extract_later' | 'keep_in_monolith' | 'refactor_first';
    estimatedEffort: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
    extractionPlan?: ExtractionPlan;
}

interface ExtractionPlan {
    phases: ExtractionPhase[];
    estimatedDuration: string;
    requiredResources: string[];
    riskMitigation: string[];
    successMetrics: string[];
}

interface ExtractionPhase {
    phaseId: string;
    name: string;
    description: string;
    tasks: string[];
    dependencies: string[];
    estimatedDuration: string;
}

// Feature categorization service implementation
class FeatureCategorizationService {
    private categorizations: Map<string, CategorizationResult> = new Map();

    async categorizeFeature(analysis: FeatureAnalysis): Promise<CategorizationResult> {
        // Check for existing categorization to ensure consistency
        const signature = this.getFeatureSignature(analysis);
        const existing = this.categorizations.get(signature);
        if (existing) {
            return existing;
        }

        // Calculate categorization score
        const score = this.calculateCategorizationScore(analysis);
        const priority = this.determinePriority(score, analysis);
        const reasoning = this.generateReasoning(analysis, score);
        const recommendedAction = this.determineRecommendedAction(priority, analysis);
        const estimatedEffort = this.estimateEffort(analysis);
        const riskLevel = this.assessRisk(analysis);
        const extractionPlan = this.generateExtractionPlan(analysis, priority, estimatedEffort);

        const result: CategorizationResult = {
            featureId: analysis.featureId,
            priority,
            reasoning,
            score,
            recommendedAction,
            estimatedEffort,
            riskLevel,
            extractionPlan,
        };

        // Cache result for consistency
        this.categorizations.set(signature, result);
        return result;
    }

    async categorizeBatch(analyses: FeatureAnalysis[]): Promise<CategorizationResult[]> {
        const results = await Promise.all(
            analyses.map(analysis => this.categorizeFeature(analysis))
        );

        // Sort by priority and score for better decision making
        return results.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            return priorityDiff !== 0 ? priorityDiff : b.score - a.score;
        });
    }

    private getFeatureSignature(analysis: FeatureAnalysis): string {
        // Create consistent signature for identical feature characteristics
        return JSON.stringify({
            name: analysis.name,
            computationalRequirements: analysis.computationalRequirements,
            dataDependenciesCount: analysis.dataDependencies.length,
            integrationPointsCount: analysis.integrationPoints.length,
            currentLocation: analysis.currentImplementation.currentLocation,
            codeComplexity: analysis.currentImplementation.codeComplexity,
            loadPattern: analysis.scalabilityNeeds.loadPattern,
        });
    }

    private calculateCategorizationScore(analysis: FeatureAnalysis): number {
        let score = 0;

        // Computational requirements scoring (0-40 points)
        if (analysis.computationalRequirements.cpuIntensive) score += 20;
        if (analysis.computationalRequirements.memoryUsage === 'high') score += 15;
        if (analysis.computationalRequirements.ioOperations === 'heavy') score += 15;
        if (analysis.computationalRequirements.processingTime === 'slow') score += 10;
        if (analysis.computationalRequirements.concurrencyNeeds > 50) score += 10;

        // Data dependencies scoring (0-20 points)
        const highCriticalityDeps = analysis.dataDependencies.filter(d => d.criticality === 'high').length;
        const frequentDeps = analysis.dataDependencies.filter(d =>
            d.frequency === 'frequent' || d.frequency === 'constant'
        ).length;
        score += Math.min(10, highCriticalityDeps * 3);
        score += Math.min(10, frequentDeps * 2);

        // Integration points scoring (0-15 points)
        const complexIntegrations = analysis.integrationPoints.filter(i =>
            i.type === 'websocket' || i.type === 'message_queue'
        ).length;
        const strictLatencyReqs = analysis.integrationPoints.filter(i =>
            i.latencyRequirement === 'strict'
        ).length;
        score += Math.min(8, complexIntegrations * 4);
        score += Math.min(7, strictLatencyReqs * 3);

        // Current implementation scoring (0-15 points)
        if (analysis.currentImplementation.currentLocation === 'monolith') score += 8;
        if (analysis.currentImplementation.codeComplexity === 'complex') score += 5;
        if (analysis.currentImplementation.testCoverage < 0.7) score += 3;
        if (analysis.currentImplementation.maintainabilityScore < 5) score += 4;

        // Performance metrics scoring (0-10 points)
        if (analysis.currentImplementation.performanceMetrics.averageResponseTime > 1000) score += 3;
        if (analysis.currentImplementation.performanceMetrics.errorRate > 0.05) score += 4;
        if (analysis.currentImplementation.performanceMetrics.resourceUtilization > 0.8) score += 3;

        return Math.min(100, Math.max(0, score));
    }

    private determinePriority(score: number, analysis: FeatureAnalysis): 'high' | 'medium' | 'low' {
        // High priority: Score >= 60 or critical business factors
        if (score >= 60 ||
            analysis.scalabilityNeeds.growthProjection === 'exponential' ||
            analysis.currentImplementation.performanceMetrics.errorRate > 0.1) {
            return 'high';
        }

        // Medium priority: Score >= 30
        if (score >= 30) {
            return 'medium';
        }

        return 'low';
    }

    private generateReasoning(analysis: FeatureAnalysis, score: number): string[] {
        const reasons: string[] = [];

        // Computational reasons
        if (analysis.computationalRequirements.cpuIntensive) {
            reasons.push('CPU-intensive operations would benefit from dedicated compute resources');
        }
        if (analysis.computationalRequirements.memoryUsage === 'high') {
            reasons.push('High memory usage requires independent resource allocation');
        }

        // Architecture reasons
        if (analysis.currentImplementation.currentLocation === 'monolith') {
            reasons.push('Currently embedded in monolith, extraction would improve modularity');
        }
        if (analysis.currentImplementation.codeComplexity === 'complex') {
            reasons.push('Complex codebase would benefit from isolation and focused maintenance');
        }

        // Scalability reasons
        if (analysis.scalabilityNeeds.loadPattern === 'spiky' || analysis.scalabilityNeeds.loadPattern === 'unpredictable') {
            reasons.push('Variable load patterns require independent scaling capabilities');
        }
        if (analysis.scalabilityNeeds.growthProjection === 'exponential') {
            reasons.push('Exponential growth projection necessitates scalable architecture');
        }

        // Performance reasons
        if (analysis.currentImplementation.performanceMetrics.errorRate > 0.05) {
            reasons.push('High error rate indicates need for improved fault isolation');
        }
        if (analysis.currentImplementation.performanceMetrics.averageResponseTime > 1000) {
            reasons.push('Slow response times could be improved with dedicated service optimization');
        }

        // Data and integration reasons
        if (analysis.dataDependencies.some(d => d.criticality === 'high')) {
            reasons.push('High-criticality data dependencies require careful service boundary design');
        }
        if (analysis.integrationPoints.some(i => i.latencyRequirement === 'strict')) {
            reasons.push('Strict latency requirements benefit from optimized service interfaces');
        }

        return reasons.length > 0 ? reasons : ['Standard categorization based on comprehensive feature analysis'];
    }

    private determineRecommendedAction(
        priority: 'high' | 'medium' | 'low',
        analysis: FeatureAnalysis
    ): 'extract_immediately' | 'extract_later' | 'keep_in_monolith' | 'refactor_first' {
        if (priority === 'high') {
            // Check readiness for extraction
            if (analysis.currentImplementation.testCoverage > 0.8 &&
                analysis.currentImplementation.codeComplexity !== 'complex') {
                return 'extract_immediately';
            } else {
                return 'refactor_first';
            }
        } else if (priority === 'medium') {
            return 'extract_later';
        } else {
            return 'keep_in_monolith';
        }
    }

    private estimateEffort(analysis: FeatureAnalysis): 'low' | 'medium' | 'high' {
        let effortScore = 0;

        // Code complexity impact
        if (analysis.currentImplementation.codeComplexity === 'complex') effortScore += 3;
        else if (analysis.currentImplementation.codeComplexity === 'moderate') effortScore += 1;

        // Test coverage impact
        if (analysis.currentImplementation.testCoverage < 0.5) effortScore += 3;
        else if (analysis.currentImplementation.testCoverage < 0.8) effortScore += 1;

        // Dependencies impact
        if (analysis.dataDependencies.length > 5) effortScore += 2;
        else if (analysis.dataDependencies.length > 3) effortScore += 1;

        // Integration complexity impact
        if (analysis.integrationPoints.length > 8) effortScore += 2;
        else if (analysis.integrationPoints.length > 5) effortScore += 1;

        // Performance issues impact
        if (analysis.currentImplementation.performanceMetrics.errorRate > 0.05) effortScore += 1;

        if (effortScore >= 7) return 'high';
        if (effortScore >= 4) return 'medium';
        return 'low';
    }

    private assessRisk(analysis: FeatureAnalysis): 'low' | 'medium' | 'high' {
        let riskScore = 0;

        // Test coverage risk
        if (analysis.currentImplementation.testCoverage < 0.6) riskScore += 3;
        else if (analysis.currentImplementation.testCoverage < 0.8) riskScore += 1;

        // Data dependency risk
        const highCriticalityDeps = analysis.dataDependencies.filter(d => d.criticality === 'high').length;
        if (highCriticalityDeps > 2) riskScore += 3;
        else if (highCriticalityDeps > 0) riskScore += 1;

        // Integration risk
        const strictLatencyReqs = analysis.integrationPoints.filter(i => i.latencyRequirement === 'strict').length;
        if (strictLatencyReqs > 2) riskScore += 2;
        else if (strictLatencyReqs > 0) riskScore += 1;

        // Performance risk
        if (analysis.currentImplementation.performanceMetrics.errorRate > 0.05) riskScore += 2;

        // Complexity risk
        if (analysis.currentImplementation.codeComplexity === 'complex') riskScore += 2;

        if (riskScore >= 7) return 'high';
        if (riskScore >= 4) return 'medium';
        return 'low';
    }

    private generateExtractionPlan(
        analysis: FeatureAnalysis,
        priority: 'high' | 'medium' | 'low',
        effort: 'low' | 'medium' | 'high'
    ): ExtractionPlan | undefined {
        if (priority === 'low') return undefined;

        const phases: ExtractionPhase[] = [];

        // Phase 1: Preparation
        phases.push({
            phaseId: 'prep',
            name: 'Preparation and Analysis',
            description: 'Detailed analysis and preparation for extraction',
            tasks: [
                'Conduct detailed code analysis',
                'Identify all dependencies',
                'Design service interfaces',
                'Plan data migration strategy',
                'Set up monitoring and observability'
            ],
            dependencies: [],
            estimatedDuration: effort === 'high' ? '2-3 weeks' : effort === 'medium' ? '1-2 weeks' : '3-5 days'
        });

        // Phase 2: Implementation
        phases.push({
            phaseId: 'impl',
            name: 'Service Implementation',
            description: 'Extract and implement the microservice',
            tasks: [
                'Create service skeleton',
                'Implement core functionality',
                'Set up data access layer',
                'Implement service interfaces',
                'Add error handling and resilience'
            ],
            dependencies: ['prep'],
            estimatedDuration: effort === 'high' ? '4-6 weeks' : effort === 'medium' ? '2-3 weeks' : '1-2 weeks'
        });

        // Phase 3: Integration and Testing
        phases.push({
            phaseId: 'test',
            name: 'Integration and Testing',
            description: 'Integrate service and conduct thorough testing',
            tasks: [
                'Integration testing',
                'Performance testing',
                'Security testing',
                'End-to-end testing',
                'Load testing'
            ],
            dependencies: ['impl'],
            estimatedDuration: effort === 'high' ? '2-3 weeks' : effort === 'medium' ? '1-2 weeks' : '3-5 days'
        });

        // Phase 4: Deployment
        phases.push({
            phaseId: 'deploy',
            name: 'Deployment and Migration',
            description: 'Deploy service and migrate traffic',
            tasks: [
                'Deploy to staging environment',
                'Conduct user acceptance testing',
                'Deploy to production',
                'Gradual traffic migration',
                'Monitor and optimize'
            ],
            dependencies: ['test'],
            estimatedDuration: '1-2 weeks'
        });

        const totalDuration = effort === 'high' ? '10-14 weeks' : effort === 'medium' ? '6-8 weeks' : '3-5 weeks';

        return {
            phases,
            estimatedDuration: totalDuration,
            requiredResources: [
                'Senior backend developer',
                'DevOps engineer',
                'QA engineer',
                effort === 'high' ? 'Architecture consultant' : null
            ].filter(Boolean) as string[],
            riskMitigation: [
                'Comprehensive testing strategy',
                'Gradual rollout with feature flags',
                'Rollback procedures',
                'Monitoring and alerting',
                'Performance benchmarking'
            ],
            successMetrics: [
                'Service availability > 99.9%',
                'Response time improvement',
                'Error rate reduction',
                'Independent scalability',
                'Reduced deployment coupling'
            ]
        };
    }
}

// Lambda handler
const service = new FeatureCategorizationService();

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    try {
        const { httpMethod, body, pathParameters } = event;

        if (httpMethod === 'POST') {
            if (!body) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Request body is required' })
                };
            }

            const requestData = JSON.parse(body);

            if (Array.isArray(requestData)) {
                // Batch categorization
                const results = await service.categorizeBatch(requestData);
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ results })
                };
            } else {
                // Single feature categorization
                const result = await service.categorizeFeature(requestData);
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result)
                };
            }
        }

        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Feature categorization error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};