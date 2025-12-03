/**
 * Trend Analyzer
 * 
 * Analyzes market data to detect emerging trends, predict trend trajectories,
 * identify relevant trends for agents, and generate trend notifications.
 * 
 * Features:
 * - Trend detection from market data
 * - Statistical analysis and trend strength calculation
 * - Trend trajectory prediction
 * - Relevance scoring for agent profiles
 * - Trend notification generation
 */

import {
    MarketData,
    Trend,
    TrendPrediction,
    TrendAnalysisResult,
    TrendNotification,
    TrendDataPoint,
    TrendStatistics,
    TrendDirection,
    TrendStrength,
    PredictedValue,
    AgentProfile,
} from './types';

/**
 * Configuration for trend analysis
 */
export interface TrendAnalyzerConfig {
    /** Minimum data points required for trend detection */
    minDataPoints: number;

    /** Minimum confidence threshold (0-1) */
    minConfidence: number;

    /** Time window for analysis (in days) */
    analysisWindow: number;

    /** Prediction horizon (in days) */
    predictionHorizon: number;

    /** Volatility threshold for stable trends */
    volatilityThreshold: number;

    /** Minimum rate of change for trend detection */
    minRateOfChange: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: TrendAnalyzerConfig = {
    minDataPoints: 5,
    minConfidence: 0.6,
    analysisWindow: 90,
    predictionHorizon: 30,
    volatilityThreshold: 0.15,
    minRateOfChange: 0.02,
};

/**
 * TrendAnalyzer - Analyzes market data for emerging trends
 */
export class TrendAnalyzer {
    private config: TrendAnalyzerConfig;

    constructor(config: Partial<TrendAnalyzerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Analyze market data for emerging trends
     */
    async analyzeTrends(
        marketData: MarketData[],
        timeframe: string
    ): Promise<Trend[]> {
        if (marketData.length < this.config.minDataPoints) {
            return [];
        }

        // Group data by market and metric
        const groupedData = this.groupMarketData(marketData);

        // Detect trends for each group
        const trends: Trend[] = [];

        for (const [key, dataPoints] of Object.entries(groupedData)) {
            const [market, metric] = key.split('::');

            const trend = await this.detectTrend(
                market,
                metric,
                dataPoints,
                timeframe
            );

            if (trend && trend.confidence >= this.config.minConfidence) {
                trends.push(trend);
            }
        }

        return trends;
    }

    /**
     * Predict trend trajectory
     */
    async predictTrendTrajectory(
        trend: Trend,
        historicalData: any[]
    ): Promise<TrendPrediction> {
        const dataPoints = trend.dataPoints;

        if (dataPoints.length < this.config.minDataPoints) {
            throw new Error('Insufficient data points for prediction');
        }

        // Use linear regression for prediction
        const predictions = this.linearRegressionPredict(
            dataPoints,
            this.config.predictionHorizon
        );

        // Determine predicted direction
        const predictedDirection = this.determinePredictedDirection(predictions);

        // Calculate confidence based on R-squared and volatility
        const confidence = this.calculatePredictionConfidence(
            trend.statistics.rSquared || 0,
            trend.statistics.volatility
        );

        // Identify influencing factors
        const influencingFactors = this.identifyInfluencingFactors(
            trend,
            historicalData
        );

        // Identify risk factors
        const riskFactors = this.identifyRiskFactors(trend, predictions);

        return {
            trendId: trend.id,
            predictedDirection,
            predictions,
            confidence,
            methodology: 'linear-regression',
            influencingFactors,
            riskFactors,
            predictedAt: new Date().toISOString(),
            horizon: `${this.config.predictionHorizon} days`,
        };
    }

    /**
     * Identify relevant trends for an agent
     */
    getRelevantTrends(trends: Trend[], agentProfile: AgentProfile): Trend[] {
        return trends
            .map(trend => ({
                ...trend,
                relevance: this.calculateRelevance(trend, agentProfile),
            }))
            .filter(trend => trend.relevance > 0.3)
            .sort((a, b) => b.relevance - a.relevance);
    }

    /**
     * Generate trend notification
     */
    async generateNotification(
        userId: string,
        trend: Trend,
        type: TrendNotification['type']
    ): Promise<TrendNotification> {
        const message = this.generateNotificationMessage(trend, type);
        const priority = this.determineNotificationPriority(trend);
        const actionItems = this.generateActionItems(trend);

        return {
            id: this.generateNotificationId(),
            userId,
            trend,
            type,
            message,
            priority,
            actionItems,
            createdAt: new Date().toISOString(),
            read: false,
            expiresAt: this.calculateExpirationDate(trend),
        };
    }

    /**
     * Detect trend from data points
     */
    private async detectTrend(
        market: string,
        metric: string,
        dataPoints: MarketData[],
        timeframe: string
    ): Promise<Trend | null> {
        if (dataPoints.length < this.config.minDataPoints) {
            return null;
        }

        // Sort by timestamp
        const sortedData = dataPoints.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Convert to trend data points
        const trendDataPoints: TrendDataPoint[] = sortedData.map(d => ({
            timestamp: d.timestamp,
            value: typeof d.value === 'number' ? d.value : parseFloat(String(d.value)),
            source: d.source,
            context: d.metadata?.context,
        }));

        // Calculate statistics
        const statistics = this.calculateStatistics(trendDataPoints);

        // Determine direction
        const direction = this.determineTrendDirection(statistics);

        // Determine strength
        const strength = this.determineTrendStrength(statistics);

        // Calculate confidence
        const confidence = this.calculateTrendConfidence(statistics, trendDataPoints.length);

        // Skip if rate of change is too small
        if (Math.abs(statistics.rateOfChange) < this.config.minRateOfChange) {
            return null;
        }

        // Determine category
        const category = this.determineCategory(dataPoints[0].dataType);

        return {
            id: this.generateTrendId(),
            name: `${market} ${metric} Trend`,
            description: this.generateTrendDescription(
                market,
                metric,
                direction,
                strength,
                statistics
            ),
            market,
            category,
            direction,
            strength,
            confidence,
            relevance: 0.5, // Will be calculated when matched with agent profile
            dataPoints: trendDataPoints,
            statistics,
            detectedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            predictedDuration: this.estimateDuration(statistics),
        };
    }

    /**
     * Group market data by market and metric
     */
    private groupMarketData(
        marketData: MarketData[]
    ): Record<string, MarketData[]> {
        const grouped: Record<string, MarketData[]> = {};

        for (const data of marketData) {
            const key = `${data.market}::${data.metric}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(data);
        }

        return grouped;
    }

    /**
     * Calculate statistical metrics
     */
    private calculateStatistics(dataPoints: TrendDataPoint[]): TrendStatistics {
        const values = dataPoints.map(d => d.value);

        // Calculate mean
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

        // Calculate standard deviation
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
        const standardDeviation = Math.sqrt(variance);

        // Calculate rate of change (per day)
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        const firstTime = new Date(dataPoints[0].timestamp).getTime();
        const lastTime = new Date(dataPoints[dataPoints.length - 1].timestamp).getTime();
        const daysDiff = (lastTime - firstTime) / (1000 * 60 * 60 * 24);
        const rateOfChange = daysDiff > 0 ? (lastValue - firstValue) / daysDiff : 0;

        // Calculate percent change
        const percentChange = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

        // Calculate volatility (coefficient of variation)
        const volatility = mean !== 0 ? standardDeviation / Math.abs(mean) : 0;

        // Calculate R-squared (goodness of fit for linear trend)
        const rSquared = this.calculateRSquared(dataPoints);

        // Calculate momentum (recent rate vs overall rate)
        const momentum = this.calculateMomentum(dataPoints);

        return {
            mean,
            standardDeviation,
            rateOfChange,
            percentChange,
            volatility,
            rSquared,
            momentum,
        };
    }

    /**
     * Calculate R-squared for linear regression
     */
    private calculateRSquared(dataPoints: TrendDataPoint[]): number {
        const n = dataPoints.length;
        const values = dataPoints.map(d => d.value);
        const mean = values.reduce((sum, v) => sum + v, 0) / n;

        // Calculate linear regression
        const x = Array.from({ length: n }, (_, i) => i);
        const sumX = x.reduce((sum, v) => sum + v, 0);
        const sumY = values.reduce((sum, v) => sum + v, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
        const sumX2 = x.reduce((sum, v) => sum + v * v, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R-squared
        const predictions = x.map(xi => slope * xi + intercept);
        const ssRes = values.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
        const ssTot = values.reduce((sum, yi) => sum + Math.pow(yi - mean, 2), 0);

        return ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
    }

    /**
     * Calculate momentum indicator
     */
    private calculateMomentum(dataPoints: TrendDataPoint[]): number {
        if (dataPoints.length < 4) return 0;

        // Compare recent rate (last 25%) vs overall rate
        const recentCount = Math.max(2, Math.floor(dataPoints.length * 0.25));
        const recentPoints = dataPoints.slice(-recentCount);

        const recentFirst = recentPoints[0].value;
        const recentLast = recentPoints[recentPoints.length - 1].value;
        const recentRate = (recentLast - recentFirst) / recentCount;

        const overallFirst = dataPoints[0].value;
        const overallLast = dataPoints[dataPoints.length - 1].value;
        const overallRate = (overallLast - overallFirst) / dataPoints.length;

        return overallRate !== 0 ? recentRate / overallRate : 0;
    }

    /**
     * Determine trend direction
     */
    private determineTrendDirection(statistics: TrendStatistics): TrendDirection {
        const { rateOfChange, volatility } = statistics;

        if (volatility > this.config.volatilityThreshold) {
            return 'volatile';
        }

        if (Math.abs(rateOfChange) < this.config.minRateOfChange) {
            return 'stable';
        }

        return rateOfChange > 0 ? 'rising' : 'falling';
    }

    /**
     * Determine trend strength
     */
    private determineTrendStrength(statistics: TrendStatistics): TrendStrength {
        const absPercentChange = Math.abs(statistics.percentChange);
        const rSquared = statistics.rSquared || 0;

        // Combine percent change and R-squared for strength
        const strengthScore = (absPercentChange / 100) * rSquared;

        if (strengthScore > 0.5) return 'very-strong';
        if (strengthScore > 0.3) return 'strong';
        if (strengthScore > 0.15) return 'moderate';
        return 'weak';
    }

    /**
     * Calculate trend confidence
     */
    private calculateTrendConfidence(
        statistics: TrendStatistics,
        dataPointCount: number
    ): number {
        const rSquared = statistics.rSquared || 0;
        const dataPointScore = Math.min(dataPointCount / 20, 1); // More data = higher confidence
        const volatilityPenalty = Math.max(0, 1 - statistics.volatility);

        return (rSquared * 0.5 + dataPointScore * 0.3 + volatilityPenalty * 0.2);
    }

    /**
     * Linear regression prediction
     */
    private linearRegressionPredict(
        dataPoints: TrendDataPoint[],
        horizonDays: number
    ): PredictedValue[] {
        const n = dataPoints.length;
        const values = dataPoints.map(d => d.value);

        // Calculate linear regression
        const x = Array.from({ length: n }, (_, i) => i);
        const sumX = x.reduce((sum, v) => sum + v, 0);
        const sumY = values.reduce((sum, v) => sum + v, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
        const sumX2 = x.reduce((sum, v) => sum + v * v, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate standard error
        const predictions = x.map(xi => slope * xi + intercept);
        const residuals = values.map((yi, i) => yi - predictions[i]);
        const sse = residuals.reduce((sum, r) => sum + r * r, 0);
        const standardError = Math.sqrt(sse / (n - 2));

        // Generate predictions
        const lastTimestamp = new Date(dataPoints[dataPoints.length - 1].timestamp);
        const predictedValues: PredictedValue[] = [];

        for (let i = 1; i <= horizonDays; i++) {
            const futureX = n + i - 1;
            const predictedValue = slope * futureX + intercept;

            // Calculate confidence interval (95%)
            const margin = 1.96 * standardError * Math.sqrt(1 + 1 / n + Math.pow(futureX - sumX / n, 2) / sumX2);

            const futureDate = new Date(lastTimestamp);
            futureDate.setDate(futureDate.getDate() + i);

            predictedValues.push({
                timestamp: futureDate.toISOString(),
                value: predictedValue,
                lowerBound: predictedValue - margin,
                upperBound: predictedValue + margin,
                confidenceLevel: 0.95,
            });
        }

        return predictedValues;
    }

    /**
     * Determine predicted direction from predictions
     */
    private determinePredictedDirection(predictions: PredictedValue[]): TrendDirection {
        if (predictions.length < 2) return 'stable';

        const firstValue = predictions[0].value;
        const lastValue = predictions[predictions.length - 1].value;
        const change = lastValue - firstValue;
        const percentChange = (change / firstValue) * 100;

        if (Math.abs(percentChange) < 2) return 'stable';
        return change > 0 ? 'rising' : 'falling';
    }

    /**
     * Calculate prediction confidence
     */
    private calculatePredictionConfidence(rSquared: number, volatility: number): number {
        const volatilityPenalty = Math.max(0, 1 - volatility * 2);
        return rSquared * 0.7 + volatilityPenalty * 0.3;
    }

    /**
     * Identify influencing factors
     */
    private identifyInfluencingFactors(trend: Trend, historicalData: any[]): string[] {
        const factors: string[] = [];

        // Add category-specific factors
        switch (trend.category) {
            case 'price':
                factors.push('Interest rates', 'Inventory levels', 'Economic conditions');
                break;
            case 'inventory':
                factors.push('New construction', 'Seller activity', 'Seasonal patterns');
                break;
            case 'demand':
                factors.push('Employment rates', 'Population growth', 'Affordability');
                break;
            case 'demographic':
                factors.push('Migration patterns', 'Age distribution', 'Income levels');
                break;
            case 'economic':
                factors.push('GDP growth', 'Inflation', 'Consumer confidence');
                break;
        }

        // Add direction-specific factors
        if (trend.direction === 'rising') {
            factors.push('Increasing demand', 'Limited supply');
        } else if (trend.direction === 'falling') {
            factors.push('Decreasing demand', 'Increased supply');
        }

        return factors;
    }

    /**
     * Identify risk factors
     */
    private identifyRiskFactors(trend: Trend, predictions: PredictedValue[]): string[] {
        const risks: string[] = [];

        // High volatility risk
        if (trend.statistics.volatility > 0.2) {
            risks.push('High market volatility may affect prediction accuracy');
        }

        // Low confidence risk
        if (trend.confidence < 0.7) {
            risks.push('Limited historical data reduces prediction confidence');
        }

        // Wide confidence intervals
        const avgInterval = predictions.reduce((sum, p) =>
            sum + (p.upperBound - p.lowerBound), 0) / predictions.length;
        const avgValue = predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length;

        if (avgInterval / avgValue > 0.3) {
            risks.push('Wide confidence intervals indicate uncertainty');
        }

        // External factors
        risks.push('External economic events may disrupt trend');
        risks.push('Policy changes could impact market dynamics');

        return risks;
    }

    /**
     * Calculate relevance to agent profile
     */
    private calculateRelevance(trend: Trend, agentProfile: AgentProfile): number {
        let relevance = 0;

        // Market match
        if (trend.market === agentProfile.primaryMarket) {
            relevance += 0.4;
        }

        // Specialization match
        const specializationMatch = agentProfile.specialization.some(spec =>
            trend.description.toLowerCase().includes(spec.toLowerCase())
        );
        if (specializationMatch) {
            relevance += 0.3;
        }

        // Strength bonus
        const strengthBonus = {
            'very-strong': 0.2,
            'strong': 0.15,
            'moderate': 0.1,
            'weak': 0.05,
        };
        relevance += strengthBonus[trend.strength];

        // Confidence bonus
        relevance += trend.confidence * 0.1;

        return Math.min(relevance, 1.0);
    }

    /**
     * Generate notification message
     */
    private generateNotificationMessage(
        trend: Trend,
        type: TrendNotification['type']
    ): string {
        const directionText = {
            'rising': 'increasing',
            'falling': 'decreasing',
            'stable': 'remaining stable',
            'volatile': 'showing volatility',
        };

        switch (type) {
            case 'new-trend':
                return `New ${trend.strength} trend detected: ${trend.name} is ${directionText[trend.direction]} in ${trend.market}`;

            case 'trend-change':
                return `Trend update: ${trend.name} direction changed to ${trend.direction}`;

            case 'trend-alert':
                return `Alert: ${trend.name} shows ${trend.strength} ${trend.direction} movement`;

            case 'trend-opportunity':
                return `Opportunity: ${trend.name} trend suggests potential for action in ${trend.market}`;

            default:
                return `Trend notification: ${trend.name}`;
        }
    }

    /**
     * Determine notification priority
     */
    private determineNotificationPriority(trend: Trend): TrendNotification['priority'] {
        const score = trend.confidence * (trend.relevance || 0.5);

        if (trend.strength === 'very-strong' && score > 0.7) return 'urgent';
        if (trend.strength === 'strong' && score > 0.6) return 'high';
        if (score > 0.4) return 'medium';
        return 'low';
    }

    /**
     * Generate action items
     */
    private generateActionItems(trend: Trend): string[] {
        const actions: string[] = [];

        if (trend.direction === 'rising') {
            actions.push('Consider creating content about this growing trend');
            actions.push('Update marketing materials to highlight this opportunity');
        } else if (trend.direction === 'falling') {
            actions.push('Adjust strategy to address declining trend');
            actions.push('Communicate market changes to clients');
        }

        actions.push('Monitor trend development over next 30 days');
        actions.push('Share insights with clients in affected market');

        return actions;
    }

    /**
     * Determine category from data type
     */
    private determineCategory(dataType: MarketData['dataType']): Trend['category'] {
        const mapping: Record<MarketData['dataType'], Trend['category']> = {
            'price': 'price',
            'inventory': 'inventory',
            'demand': 'demand',
            'demographic': 'demographic',
            'economic': 'economic',
        };

        return mapping[dataType] || 'economic';
    }

    /**
     * Generate trend description
     */
    private generateTrendDescription(
        market: string,
        metric: string,
        direction: TrendDirection,
        strength: TrendStrength,
        statistics: TrendStatistics
    ): string {
        const changeText = statistics.percentChange > 0 ? 'increased' : 'decreased';
        const percentText = Math.abs(statistics.percentChange).toFixed(1);

        return `${metric} in ${market} has ${changeText} by ${percentText}% showing a ${strength} ${direction} trend`;
    }

    /**
     * Estimate trend duration
     */
    private estimateDuration(statistics: TrendStatistics): string {
        const momentum = statistics.momentum || 0;

        if (Math.abs(momentum) > 1.5) return '1-2 months';
        if (Math.abs(momentum) > 1.0) return '2-3 months';
        if (Math.abs(momentum) > 0.5) return '3-6 months';
        return '6+ months';
    }

    /**
     * Calculate expiration date for notification
     */
    private calculateExpirationDate(trend: Trend): string {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // 30 days
        return expirationDate.toISOString();
    }

    /**
     * Generate unique IDs
     */
    private generateTrendId(): string {
        return `trend_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private generateNotificationId(): string {
        return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Create a TrendAnalyzer instance with default configuration
 */
export function createTrendAnalyzer(config?: Partial<TrendAnalyzerConfig>): TrendAnalyzer {
    return new TrendAnalyzer(config);
}
