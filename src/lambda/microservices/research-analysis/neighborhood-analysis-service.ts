/**
 * Neighborhood Analysis Service
 * 
 * Builds neighborhood analysis with multi-source data aggregation.
 * Aggregates data from multiple sources to provide comprehensive neighborhood insights.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface NeighborhoodAnalysisRequest {
    location: {
        address?: string;
        city: string;
        state: string;
        zipCode?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    analysisType: 'demographics' | 'market_trends' | 'amenities' | 'comprehensive';
    radius: number; // in miles
    dataSources: DataSourceConfig[];
    includeHistoricalData: boolean;
    timeRange?: {
        startDate: string;
        endDate: string;
    };
}

export interface DataSourceConfig {
    sourceId: string;
    sourceType: 'census' | 'mls' | 'crime' | 'schools' | 'amenities' | 'demographics' | 'economic';
    enabled: boolean;
    priority: number; // 1-10, higher is more important
    refreshInterval: number; // in hours
    apiEndpoint?: string;
    credibility: number; // 0-1
}

export interface NeighborhoodAnalysisResult {
    location: {
        normalizedAddress: string;
        city: string;
        state: string;
        zipCode: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    analysisType: string;
    aggregatedData: {
        demographics?: DemographicsData;
        marketTrends?: MarketTrendsData;
        amenities?: AmenitiesData;
        crimeData?: CrimeData;
        schoolData?: SchoolData;
        economicData?: EconomicData;
    };
    sourceContributions: Array<{
        sourceId: string;
        sourceType: string;
        dataPoints: number;
        lastUpdated: string;
        credibilityScore: number;
        contributionWeight: number;
    }>;
    aggregationMetadata: {
        totalSources: number;
        successfulSources: number;
        failedSources: string[];
        aggregationMethod: string;
        confidenceScore: number;
        lastAggregated: string;
    };
    summary: string;
    recommendations: string[];
}

export interface DemographicsData {
    population: number;
    medianAge: number;
    medianIncome: number;
    educationLevel: Record<string, number>;
    ethnicComposition: Record<string, number>;
}

export interface MarketTrendsData {
    medianHomePrice: number;
    priceChangeYoY: number;
    daysOnMarket: number;
    inventoryLevel: number;
    saleVolume: number;
}

export interface AmenitiesData {
    restaurants: number;
    shopping: number;
    parks: number;
    publicTransit: number;
    walkabilityScore: number;
}

export interface CrimeData {
    crimeRate: number;
    crimeTypes: Record<string, number>;
    safetyScore: number;
    trendDirection: 'improving' | 'stable' | 'declining';
}

export interface SchoolData {
    elementarySchools: number;
    middleSchools: number;
    highSchools: number;
    averageRating: number;
    testScores: Record<string, number>;
}

export interface EconomicData {
    unemploymentRate: number;
    jobGrowthRate: number;
    majorEmployers: string[];
    businessGrowth: number;
}

export class NeighborhoodAnalysisService {

    async analyzeNeighborhood(request: NeighborhoodAnalysisRequest): Promise<NeighborhoodAnalysisResult> {
        try {
            const enabledSources = request.dataSources.filter(source => source.enabled);
            const aggregatedData: NeighborhoodAnalysisResult['aggregatedData'] = {};
            const sourceContributions: NeighborhoodAnalysisResult['sourceContributions'] = [];
            const failedSources: string[] = [];

            // Aggregate data from each enabled source
            for (const source of enabledSources) {
                try {
                    const sourceData = await this.fetchDataFromSource(source, request);
                    this.aggregateSourceData(aggregatedData, sourceData, source);

                    sourceContributions.push({
                        sourceId: source.sourceId,
                        sourceType: source.sourceType,
                        dataPoints: this.calculateDataPoints(sourceData),
                        lastUpdated: new Date().toISOString(),
                        credibilityScore: source.credibility,
                        contributionWeight: source.priority / 10,
                    });
                } catch (error) {
                    console.error(`Failed to fetch data from source ${source.sourceId}:`, error);
                    failedSources.push(source.sourceId);
                }
            }

            const successfulSources = sourceContributions.length;
            const totalSources = enabledSources.length;
            const confidenceScore = this.calculateConfidenceScore(sourceContributions, totalSources);

            return {
                location: {
                    normalizedAddress: request.location.address || `${request.location.city}, ${request.location.state}`,
                    city: request.location.city,
                    state: request.location.state,
                    zipCode: request.location.zipCode || '00000',
                    coordinates: request.location.coordinates || { lat: 40.7128, lng: -74.0060 },
                },
                analysisType: request.analysisType,
                aggregatedData,
                sourceContributions,
                aggregationMetadata: {
                    totalSources,
                    successfulSources,
                    failedSources,
                    aggregationMethod: 'weighted_average',
                    confidenceScore,
                    lastAggregated: new Date().toISOString(),
                },
                summary: this.generateSummary(aggregatedData, request.analysisType),
                recommendations: this.generateRecommendations(aggregatedData, sourceContributions),
            };
        } catch (error) {
            console.error('Neighborhood analysis failed:', error);
            throw new Error('Failed to analyze neighborhood');
        }
    }

    private async fetchDataFromSource(source: DataSourceConfig, request: NeighborhoodAnalysisRequest): Promise<any> {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

        // Simulate occasional failures
        if (Math.random() < 0.02) {
            throw new Error(`Failed to fetch data from ${source.sourceId}`);
        }

        // Generate mock data based on source type
        switch (source.sourceType) {
            case 'census':
            case 'demographics':
                return {
                    population: Math.floor(Math.random() * 100000) + 10000,
                    medianAge: Math.floor(Math.random() * 30) + 25,
                    medianIncome: Math.floor(Math.random() * 100000) + 30000,
                    educationLevel: {
                        'high_school': Math.random() * 0.3 + 0.2,
                        'college': Math.random() * 0.4 + 0.3,
                        'graduate': Math.random() * 0.2 + 0.1,
                    },
                    ethnicComposition: {
                        'white': Math.random() * 0.6 + 0.2,
                        'hispanic': Math.random() * 0.3 + 0.1,
                        'black': Math.random() * 0.2 + 0.05,
                        'asian': Math.random() * 0.15 + 0.05,
                        'other': Math.random() * 0.1 + 0.02,
                    },
                };

            case 'mls':
                return {
                    medianHomePrice: Math.floor(Math.random() * 500000) + 200000,
                    priceChangeYoY: (Math.random() - 0.5) * 0.2,
                    daysOnMarket: Math.floor(Math.random() * 60) + 15,
                    inventoryLevel: Math.floor(Math.random() * 500) + 50,
                    saleVolume: Math.floor(Math.random() * 200) + 20,
                };

            case 'crime':
                return {
                    crimeRate: Math.random() * 50 + 5,
                    crimeTypes: {
                        'violent': Math.random() * 10 + 1,
                        'property': Math.random() * 30 + 10,
                        'drug': Math.random() * 15 + 2,
                        'other': Math.random() * 10 + 1,
                    },
                    safetyScore: Math.random() * 40 + 60,
                    trendDirection: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
                };

            case 'schools':
                return {
                    elementarySchools: Math.floor(Math.random() * 10) + 2,
                    middleSchools: Math.floor(Math.random() * 5) + 1,
                    highSchools: Math.floor(Math.random() * 3) + 1,
                    averageRating: Math.random() * 3 + 7,
                    testScores: {
                        'math': Math.random() * 200 + 400,
                        'reading': Math.random() * 200 + 400,
                        'science': Math.random() * 200 + 400,
                    },
                };

            case 'amenities':
                return {
                    restaurants: Math.floor(Math.random() * 100) + 10,
                    shopping: Math.floor(Math.random() * 50) + 5,
                    parks: Math.floor(Math.random() * 20) + 2,
                    publicTransit: Math.floor(Math.random() * 10) + 1,
                    walkabilityScore: Math.random() * 40 + 60,
                };

            case 'economic':
                return {
                    unemploymentRate: Math.random() * 0.08 + 0.02,
                    jobGrowthRate: (Math.random() - 0.3) * 0.1,
                    majorEmployers: ['Company A', 'Company B', 'Company C'].slice(0, Math.floor(Math.random() * 3) + 1),
                    businessGrowth: (Math.random() - 0.2) * 0.15,
                };

            default:
                return {};
        }
    }

    private aggregateSourceData(aggregatedData: any, sourceData: any, source: DataSourceConfig): void {
        const weight = source.priority / 10 * source.credibility;

        switch (source.sourceType) {
            case 'census':
            case 'demographics':
                if (!aggregatedData.demographics) {
                    aggregatedData.demographics = { ...sourceData };
                } else {
                    // Weighted average for numeric values
                    aggregatedData.demographics.population = this.weightedAverage(
                        aggregatedData.demographics.population, sourceData.population, weight
                    );
                    aggregatedData.demographics.medianAge = this.weightedAverage(
                        aggregatedData.demographics.medianAge, sourceData.medianAge, weight
                    );
                    aggregatedData.demographics.medianIncome = this.weightedAverage(
                        aggregatedData.demographics.medianIncome, sourceData.medianIncome, weight
                    );
                }
                break;

            case 'mls':
                if (!aggregatedData.marketTrends) {
                    aggregatedData.marketTrends = { ...sourceData };
                } else {
                    aggregatedData.marketTrends.medianHomePrice = this.weightedAverage(
                        aggregatedData.marketTrends.medianHomePrice, sourceData.medianHomePrice, weight
                    );
                    aggregatedData.marketTrends.daysOnMarket = this.weightedAverage(
                        aggregatedData.marketTrends.daysOnMarket, sourceData.daysOnMarket, weight
                    );
                }
                break;

            case 'crime':
                aggregatedData.crimeData = { ...sourceData };
                break;

            case 'schools':
                aggregatedData.schoolData = { ...sourceData };
                break;

            case 'amenities':
                aggregatedData.amenities = { ...sourceData };
                break;

            case 'economic':
                aggregatedData.economicData = { ...sourceData };
                break;
        }
    }

    private weightedAverage(current: number, newValue: number, weight: number): number {
        return Math.round((current * (1 - weight) + newValue * weight) * 100) / 100;
    }

    private calculateDataPoints(sourceData: any): number {
        const keys = Object.keys(sourceData);
        return Math.max(keys.length * 2, 1);
    }

    private calculateConfidenceScore(contributions: any[], totalSources: number): number {
        if (contributions.length === 0) return 0;

        const avgCredibility = contributions.reduce((sum, c) => sum + c.credibilityScore, 0) / contributions.length;
        const completionRate = contributions.length / totalSources;

        const baseScore = avgCredibility * completionRate;
        return Math.min(Math.round(baseScore * 100) / 100, 1.0);
    }

    private generateSummary(data: any, analysisType: string): string {
        const sections = Object.keys(data);
        return `${analysisType} analysis completed with data from ${sections.length} source categories: ${sections.join(', ')}.`;
    }

    private generateRecommendations(data: any, contributions: any[]): string[] {
        const recommendations: string[] = [];

        if (data.marketTrends?.medianHomePrice > 500000) {
            recommendations.push('High-value market with premium pricing opportunities');
        }

        if (data.schoolData?.averageRating > 8) {
            recommendations.push('Excellent school district appeals to families');
        }

        if (data.crimeData?.safetyScore > 80) {
            recommendations.push('Low crime rates enhance neighborhood desirability');
        }

        if (contributions.length >= 4) {
            recommendations.push('Comprehensive data coverage provides high confidence in analysis');
        }

        return recommendations;
    }
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const neighborhoodService = new NeighborhoodAnalysisService();

        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Request body is required' }),
            };
        }

        const request: NeighborhoodAnalysisRequest = JSON.parse(event.body);
        const result = await neighborhoodService.analyzeNeighborhood(request);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('Neighborhood analysis service error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};