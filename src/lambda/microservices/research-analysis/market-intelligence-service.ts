/**
 * Market Intelligence Service
 * 
 * Creates market intelligence with trend detection capabilities.
 * Processes large datasets and generates market insights with trend analysis.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface MarketIntelligenceRequest {
    geographicArea: {
        city?: string;
        state?: string;
        zipCodes?: string[];
        coordinates?: {
            lat: number;
            lng: number;
            radius: number; // in miles
        };
    };
    propertyTypes: ('single_family' | 'condo' | 'townhouse' | 'multi_family' | 'commercial')[];
    timeRange: {
        startDate: string;
        endDate: string;
        granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    };
    analysisTypes: ('trends' | 'predictions' | 'opportunities' | 'risks' | 'comparative')[];
    dataSources: {
        mls: boolean;
        publicRecords: boolean;
        economicIndicators: boolean;
        demographicData: boolean;
        marketReports: boolean;
    };
    trendDetectionConfig: {
        sensitivity: 'low' | 'medium' | 'high';
        minDataPoints: number;
        confidenceThreshold: number;
        seasonalAdjustment: boolean;
    };
}

export interface MarketIntelligenceResult {
    geographicArea: MarketIntelligenceRequest['geographicArea'];
    analysisMetadata: {
        timeRange: MarketIntelligenceRequest['timeRange'];
        dataPointsAnalyzed: number;
        sourcesUsed: string[];
        processingTime: number;
        generatedAt: string;
    };
    marketTrends: {
        pricetrends: TrendAnalysis;
        volumeTrends: TrendAnalysis;
        inventoryTrends: TrendAnalysis;
        daysOnMarketTrends: TrendAnalysis;
    };
    predictions: {
        shortTerm: MarketPrediction; // 3 months
        mediumTerm: MarketPrediction; // 12 months
        longTerm: MarketPrediction; // 24 months
    };
    opportunities: OpportunityAnalysis[];
    risks: RiskAnalysis[];
    comparativeAnalysis?: {
        similarMarkets: MarketComparison[];
        benchmarkMetrics: Record<string, number>;
        relativePerformance: 'underperforming' | 'average' | 'outperforming';
    };
    insights: {
        keyFindings: string[];
        marketConditions: 'buyer_market' | 'seller_market' | 'balanced_market';
        recommendedActions: string[];
        confidenceScore: number;
    };
}

export interface TrendAnalysis {
    direction: 'rising' | 'falling' | 'stable' | 'volatile';
    magnitude: number; // percentage change
    confidence: number; // 0-1
    dataPoints: Array<{
        date: string;
        value: number;
        trend: number;
    }>;
    seasonalFactors?: {
        pattern: 'seasonal' | 'cyclical' | 'irregular';
        peakMonths: number[];
        lowMonths: number[];
    };
    changePoints: Array<{
        date: string;
        type: 'acceleration' | 'deceleration' | 'reversal';
        significance: number;
    }>;
}

export interface MarketPrediction {
    timeframe: string;
    priceChange: {
        expected: number;
        range: { low: number; high: number };
        confidence: number;
    };
    volumeChange: {
        expected: number;
        range: { low: number; high: number };
        confidence: number;
    };
    keyDrivers: string[];
    scenarios: Array<{
        name: string;
        probability: number;
        impact: string;
    }>;
}

export interface OpportunityAnalysis {
    type: 'investment' | 'development' | 'market_entry' | 'pricing' | 'timing';
    title: string;
    description: string;
    potentialReturn: {
        expected: number;
        range: { low: number; high: number };
    };
    timeframe: string;
    riskLevel: 'low' | 'medium' | 'high';
    actionItems: string[];
    confidence: number;
}

export interface RiskAnalysis {
    type: 'market' | 'economic' | 'regulatory' | 'competitive' | 'environmental';
    title: string;
    description: string;
    probability: number; // 0-1
    impact: 'low' | 'medium' | 'high';
    timeframe: string;
    mitigationStrategies: string[];
    earlyWarningIndicators: string[];
}

export interface MarketComparison {
    marketName: string;
    location: string;
    similarityScore: number;
    keyMetrics: {
        medianPrice: number;
        priceGrowth: number;
        salesVolume: number;
        daysOnMarket: number;
    };
    differentiators: string[];
}

export class MarketIntelligenceService {

    async analyzeMarketIntelligence(request: MarketIntelligenceRequest): Promise<MarketIntelligenceResult> {
        const startTime = Date.now();

        try {
            // Gather and process market data
            const marketData = await this.gatherMarketData(request);

            // Analyze trends
            const marketTrends = await this.analyzeTrends(marketData, request);

            // Generate predictions
            const predictions = this.generatePredictions(marketTrends, request);

            // Identify opportunities and risks
            const opportunities = this.identifyOpportunities(marketTrends, marketData, request);
            const risks = this.identifyRisks(marketTrends, marketData, request);

            // Perform comparative analysis if requested
            const comparativeAnalysis = request.analysisTypes.includes('comparative')
                ? await this.performComparativeAnalysis(request, marketData)
                : undefined;

            // Generate insights
            const insights = this.generateInsights(marketTrends, predictions, opportunities, risks);

            const processingTime = Date.now() - startTime;

            return {
                geographicArea: request.geographicArea,
                analysisMetadata: {
                    timeRange: request.timeRange,
                    dataPointsAnalyzed: this.calculateDataPoints(marketData),
                    sourcesUsed: this.getUsedSources(request.dataSources),
                    processingTime,
                    generatedAt: new Date().toISOString(),
                },
                marketTrends,
                predictions,
                opportunities,
                risks,
                comparativeAnalysis,
                insights,
            };
        } catch (error) {
            console.error('Market intelligence analysis failed:', error);
            throw new Error('Failed to analyze market intelligence');
        }
    }

    private async gatherMarketData(request: MarketIntelligenceRequest): Promise<any> {
        // Simulate gathering data from various sources
        const data: any = {
            prices: [],
            volumes: [],
            inventory: [],
            daysOnMarket: [],
        };

        // Generate time series data
        const startDate = new Date(request.timeRange.startDate);
        const endDate = new Date(request.timeRange.endDate);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        for (let i = 0; i <= daysDiff; i += 7) { // Weekly data points
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

            // Simulate market data with trends and seasonality
            const basePrice = 400000;
            const trend = i / daysDiff * 0.1; // 10% annual growth
            const seasonal = Math.sin((i / 365) * 2 * Math.PI) * 0.05; // 5% seasonal variation
            const noise = (Math.random() - 0.5) * 0.02; // 2% random noise

            data.prices.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(basePrice * (1 + trend + seasonal + noise)),
            });

            data.volumes.push({
                date: date.toISOString().split('T')[0],
                value: Math.floor(50 + Math.random() * 30 + seasonal * 20),
            });

            data.inventory.push({
                date: date.toISOString().split('T')[0],
                value: Math.floor(200 + Math.random() * 100 - trend * 50),
            });

            data.daysOnMarket.push({
                date: date.toISOString().split('T')[0],
                value: Math.floor(30 + Math.random() * 20 - trend * 10),
            });
        }

        return data;
    }

    private async analyzeTrends(marketData: any, request: MarketIntelligenceRequest): Promise<MarketIntelligenceResult['marketTrends']> {
        return {
            pricesTrends: this.analyzeTrendSeries(marketData.prices, request.trendDetectionConfig),
            volumeTrends: this.analyzeTrendSeries(marketData.volumes, request.trendDetectionConfig),
            inventoryTrends: this.analyzeTrendSeries(marketData.inventory, request.trendDetectionConfig),
            daysOnMarketTrends: this.analyzeTrendSeries(marketData.daysOnMarket, request.trendDetectionConfig),
        };
    }

    private analyzeTrendSeries(data: any[], config: MarketIntelligenceRequest['trendDetectionConfig']): TrendAnalysis {
        if (data.length < config.minDataPoints) {
            return {
                direction: 'stable',
                magnitude: 0,
                confidence: 0.1,
                dataPoints: data.map(d => ({ ...d, trend: d.value })),
                changePoints: [],
            };
        }

        // Calculate trend direction and magnitude
        const firstValue = data[0].value;
        const lastValue = data[data.length - 1].value;
        const magnitude = ((lastValue - firstValue) / firstValue) * 100;

        let direction: TrendAnalysis['direction'];
        if (Math.abs(magnitude) < 2) {
            direction = 'stable';
        } else if (magnitude > 0) {
            direction = 'rising';
        } else {
            direction = 'falling';
        }

        // Calculate confidence based on data consistency
        const values = data.map(d => d.value);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const coefficient = Math.sqrt(variance) / mean;
        const confidence = Math.max(0.1, Math.min(0.95, 1 - coefficient));

        // Detect change points
        const changePoints = this.detectChangePoints(data, config.sensitivity);

        // Add trend line to data points
        const dataPoints = data.map((d, i) => ({
            ...d,
            trend: firstValue + (magnitude / 100 * firstValue * i / (data.length - 1)),
        }));

        return {
            direction,
            magnitude: Math.round(magnitude * 100) / 100,
            confidence: Math.round(confidence * 100) / 100,
            dataPoints,
            changePoints,
        };
    }

    private detectChangePoints(data: any[], sensitivity: string): TrendAnalysis['changePoints'] {
        const changePoints: TrendAnalysis['changePoints'] = [];
        const threshold = sensitivity === 'high' ? 0.05 : sensitivity === 'medium' ? 0.1 : 0.15;

        for (let i = 2; i < data.length - 2; i++) {
            const before = data.slice(Math.max(0, i - 2), i);
            const after = data.slice(i, Math.min(data.length, i + 3));

            const beforeTrend = this.calculateSlope(before);
            const afterTrend = this.calculateSlope(after);

            const trendChange = Math.abs(afterTrend - beforeTrend);

            if (trendChange > threshold) {
                let type: 'acceleration' | 'deceleration' | 'reversal';
                if (beforeTrend * afterTrend < 0) {
                    type = 'reversal';
                } else if (Math.abs(afterTrend) > Math.abs(beforeTrend)) {
                    type = 'acceleration';
                } else {
                    type = 'deceleration';
                }

                changePoints.push({
                    date: data[i].date,
                    type,
                    significance: Math.round(trendChange * 100) / 100,
                });
            }
        }

        return changePoints;
    }

    private calculateSlope(data: any[]): number {
        if (data.length < 2) return 0;

        const n = data.length;
        const sumX = data.reduce((sum, _, i) => sum + i, 0);
        const sumY = data.reduce((sum, d) => sum + d.value, 0);
        const sumXY = data.reduce((sum, d, i) => sum + i * d.value, 0);
        const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    private generatePredictions(trends: MarketIntelligenceResult['marketTrends'], request: MarketIntelligenceRequest): MarketIntelligenceResult['predictions'] {
        const basePriceChange = trends.pricesTrends?.magnitude || 0;
        const baseVolumeChange = trends.volumeTrends?.magnitude || 0;

        return {
            shortTerm: this.createPrediction('3 months', basePriceChange * 0.25, baseVolumeChange * 0.25),
            mediumTerm: this.createPrediction('12 months', basePriceChange, baseVolumeChange),
            longTerm: this.createPrediction('24 months', basePriceChange * 2, baseVolumeChange * 1.5),
        };
    }

    private createPrediction(timeframe: string, priceChange: number, volumeChange: number): MarketPrediction {
        return {
            timeframe,
            priceChange: {
                expected: Math.round(priceChange * 100) / 100,
                range: {
                    low: Math.round((priceChange - Math.abs(priceChange) * 0.3) * 100) / 100,
                    high: Math.round((priceChange + Math.abs(priceChange) * 0.3) * 100) / 100,
                },
                confidence: 0.7 + Math.random() * 0.2,
            },
            volumeChange: {
                expected: Math.round(volumeChange * 100) / 100,
                range: {
                    low: Math.round((volumeChange - Math.abs(volumeChange) * 0.4) * 100) / 100,
                    high: Math.round((volumeChange + Math.abs(volumeChange) * 0.4) * 100) / 100,
                },
                confidence: 0.6 + Math.random() * 0.2,
            },
            keyDrivers: [
                'Market trend continuation',
                'Economic conditions',
                'Seasonal factors',
                'Supply and demand dynamics',
            ],
            scenarios: [
                {
                    name: 'Optimistic',
                    probability: 0.25,
                    impact: 'Strong growth continues with favorable conditions',
                },
                {
                    name: 'Base Case',
                    probability: 0.50,
                    impact: 'Moderate growth with normal market conditions',
                },
                {
                    name: 'Conservative',
                    probability: 0.25,
                    impact: 'Slower growth due to market headwinds',
                },
            ],
        };
    }

    private identifyOpportunities(trends: any, marketData: any, request: MarketIntelligenceRequest): OpportunityAnalysis[] {
        const opportunities: OpportunityAnalysis[] = [];

        // Price trend opportunities
        if (trends.pricesTrends?.direction === 'rising' && trends.pricesTrends.confidence > 0.7) {
            opportunities.push({
                type: 'investment',
                title: 'Rising Price Trend Investment',
                description: 'Strong upward price trend presents investment opportunities',
                potentialReturn: {
                    expected: trends.pricesTrends.magnitude,
                    range: {
                        low: trends.pricesTrends.magnitude * 0.7,
                        high: trends.pricesTrends.magnitude * 1.3,
                    },
                },
                timeframe: '12-18 months',
                riskLevel: 'medium',
                actionItems: [
                    'Identify undervalued properties in the area',
                    'Monitor market conditions for optimal timing',
                    'Consider leveraging favorable financing conditions',
                ],
                confidence: trends.pricesTrends.confidence,
            });
        }

        // Inventory opportunities
        if (trends.inventoryTrends?.direction === 'falling') {
            opportunities.push({
                type: 'market_entry',
                title: 'Low Inventory Market Entry',
                description: 'Declining inventory creates seller-favorable conditions',
                potentialReturn: {
                    expected: 15,
                    range: { low: 10, high: 25 },
                },
                timeframe: '6-12 months',
                riskLevel: 'low',
                actionItems: [
                    'Prepare listings for quick market entry',
                    'Focus on competitive pricing strategies',
                    'Enhance marketing to capture buyer attention',
                ],
                confidence: 0.8,
            });
        }

        return opportunities;
    }

    private identifyRisks(trends: any, marketData: any, request: MarketIntelligenceRequest): RiskAnalysis[] {
        const risks: RiskAnalysis[] = [];

        // Market volatility risk
        if (trends.pricesTrends?.direction === 'volatile') {
            risks.push({
                type: 'market',
                title: 'Price Volatility Risk',
                description: 'High price volatility increases market uncertainty',
                probability: 0.6,
                impact: 'medium',
                timeframe: '3-6 months',
                mitigationStrategies: [
                    'Diversify property portfolio',
                    'Implement flexible pricing strategies',
                    'Monitor market indicators closely',
                ],
                earlyWarningIndicators: [
                    'Increased price swings',
                    'Rising days on market',
                    'Economic uncertainty indicators',
                ],
            });
        }

        // Inventory buildup risk
        if (trends.inventoryTrends?.direction === 'rising' && trends.inventoryTrends.magnitude > 20) {
            risks.push({
                type: 'market',
                title: 'Inventory Oversupply Risk',
                description: 'Rising inventory levels may lead to buyer market conditions',
                probability: 0.4,
                impact: 'medium',
                timeframe: '6-12 months',
                mitigationStrategies: [
                    'Adjust pricing strategies proactively',
                    'Enhance property differentiation',
                    'Focus on unique value propositions',
                ],
                earlyWarningIndicators: [
                    'Continued inventory growth',
                    'Increasing days on market',
                    'Price pressure indicators',
                ],
            });
        }

        return risks;
    }

    private async performComparativeAnalysis(request: MarketIntelligenceRequest, marketData: any): Promise<MarketIntelligenceResult['comparativeAnalysis']> {
        // Simulate finding similar markets
        const similarMarkets: MarketComparison[] = [
            {
                marketName: 'Similar Market A',
                location: 'Nearby City, ST',
                similarityScore: 0.85,
                keyMetrics: {
                    medianPrice: 420000,
                    priceGrowth: 8.5,
                    salesVolume: 65,
                    daysOnMarket: 28,
                },
                differentiators: ['Higher price point', 'Faster sales'],
            },
            {
                marketName: 'Similar Market B',
                location: 'Regional City, ST',
                similarityScore: 0.78,
                keyMetrics: {
                    medianPrice: 380000,
                    priceGrowth: 6.2,
                    salesVolume: 45,
                    daysOnMarket: 35,
                },
                differentiators: ['Lower volume', 'Slower appreciation'],
            },
        ];

        return {
            similarMarkets,
            benchmarkMetrics: {
                medianPrice: 400000,
                priceGrowth: 7.5,
                salesVolume: 55,
                daysOnMarket: 32,
            },
            relativePerformance: 'average',
        };
    }

    private generateInsights(
        trends: MarketIntelligenceResult['marketTrends'],
        predictions: MarketIntelligenceResult['predictions'],
        opportunities: OpportunityAnalysis[],
        risks: RiskAnalysis[]
    ): MarketIntelligenceResult['insights'] {
        const keyFindings: string[] = [];

        if (trends.pricesTrends?.direction === 'rising') {
            keyFindings.push(`Price trends show ${trends.pricesTrends.direction} pattern with ${trends.pricesTrends.magnitude}% change`);
        }

        if (opportunities.length > 0) {
            keyFindings.push(`${opportunities.length} market opportunities identified`);
        }

        if (risks.length > 0) {
            keyFindings.push(`${risks.length} potential risks require monitoring`);
        }

        // Determine market conditions
        let marketConditions: 'buyer_market' | 'seller_market' | 'balanced_market' = 'balanced_market';
        if (trends.inventoryTrends?.direction === 'falling' && trends.pricesTrends?.direction === 'rising') {
            marketConditions = 'seller_market';
        } else if (trends.inventoryTrends?.direction === 'rising' && trends.pricesTrends?.direction === 'falling') {
            marketConditions = 'buyer_market';
        }

        const recommendedActions = [
            'Monitor key trend indicators regularly',
            'Adjust strategies based on market conditions',
            'Consider identified opportunities and risks',
        ];

        const confidenceScore = Math.round(
            ((trends.pricesTrends?.confidence || 0.5) +
                (trends.volumeTrends?.confidence || 0.5) +
                (predictions.mediumTerm.priceChange.confidence)) / 3 * 100
        ) / 100;

        return {
            keyFindings,
            marketConditions,
            recommendedActions,
            confidenceScore,
        };
    }

    private calculateDataPoints(marketData: any): number {
        return Object.values(marketData).reduce((total: number, series: any) => {
            return total + (Array.isArray(series) ? series.length : 0);
        }, 0);
    }

    private getUsedSources(dataSources: MarketIntelligenceRequest['dataSources']): string[] {
        const sources: string[] = [];
        if (dataSources.mls) sources.push('MLS');
        if (dataSources.publicRecords) sources.push('Public Records');
        if (dataSources.economicIndicators) sources.push('Economic Indicators');
        if (dataSources.demographicData) sources.push('Demographic Data');
        if (dataSources.marketReports) sources.push('Market Reports');
        return sources;
    }
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const marketIntelligenceService = new MarketIntelligenceService();

        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Request body is required' }),
            };
        }

        const request: MarketIntelligenceRequest = JSON.parse(event.body);
        const result = await marketIntelligenceService.analyzeMarketIntelligence(request);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('Market intelligence service error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};