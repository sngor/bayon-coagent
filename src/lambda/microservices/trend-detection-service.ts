/**
 * Trend Detection Service
 * 
 * Analyzes patterns in market and user data to detect trends and opportunities.
 * Supports the data processing and analytics microservices architecture.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Types for trend detection
interface DataPoint {
    timestamp: string;
    value: number;
    metadata?: Record<string, any>;
}

interface TrendAnalysisRequest {
    dataPoints: DataPoint[];
    analysisType: 'linear' | 'exponential' | 'seasonal' | 'anomaly';
    timeWindow: {
        start: string;
        end: string;
    };
    sensitivity?: 'low' | 'medium' | 'high';
    parameters?: Record<string, any>;
}

interface TrendResult {
    trendType: 'upward' | 'downward' | 'stable' | 'volatile' | 'anomaly';
    confidence: number;
    strength: number;
    direction: number; // -1 to 1
    changeRate: number;
    patterns: Pattern[];
    predictions?: Prediction[];
    anomalies?: Anomaly[];
}

interface Pattern {
    type: 'seasonal' | 'cyclical' | 'linear' | 'exponential';
    period?: number;
    amplitude?: number;
    confidence: number;
    description: string;
}

interface Prediction {
    timestamp: string;
    predictedValue: number;
    confidence: number;
    range: {
        min: number;
        max: number;
    };
}

interface Anomaly {
    timestamp: string;
    actualValue: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
}

// Trend detection analyzer
class TrendAnalyzer {
    async analyzeTrends(request: TrendAnalysisRequest): Promise<TrendResult> {
        try {
            // Filter data points within time window
            const filteredData = this.filterByTimeWindow(request.dataPoints, request.timeWindow);

            if (filteredData.length < 2) {
                return this.createEmptyResult();
            }

            // Sort data by timestamp
            const sortedData = filteredData.sort((a, b) =>
                Date.parse(a.timestamp) - Date.parse(b.timestamp)
            );

            // Perform trend analysis based on type
            switch (request.analysisType) {
                case 'linear':
                    return this.analyzeLinearTrend(sortedData, request.sensitivity);
                case 'exponential':
                    return this.analyzeExponentialTrend(sortedData, request.sensitivity);
                case 'seasonal':
                    return this.analyzeSeasonalTrend(sortedData, request.sensitivity);
                case 'anomaly':
                    return this.detectAnomalies(sortedData, request.sensitivity);
                default:
                    return this.analyzeLinearTrend(sortedData, request.sensitivity);
            }

        } catch (error) {
            console.error('Trend analysis error:', error);
            return this.createEmptyResult();
        }
    }

    private filterByTimeWindow(
        dataPoints: DataPoint[],
        timeWindow: { start: string; end: string }
    ): DataPoint[] {
        const windowStart = Date.parse(timeWindow.start);
        const windowEnd = Date.parse(timeWindow.end);

        return dataPoints.filter(point => {
            const pointTime = Date.parse(point.timestamp);
            return pointTime >= windowStart && pointTime <= windowEnd;
        });
    }

    private analyzeLinearTrend(data: DataPoint[], sensitivity?: string): TrendResult {
        const values = data.map(point => point.value);
        const n = values.length;

        // Calculate linear regression
        const xValues = Array.from({ length: n }, (_, i) => i);
        const sumX = xValues.reduce((sum, x) => sum + x, 0);
        const sumY = values.reduce((sum, y) => sum + y, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate correlation coefficient
        const meanX = sumX / n;
        const meanY = sumY / n;
        const numerator = xValues.reduce((sum, x, i) => sum + (x - meanX) * (values[i] - meanY), 0);
        const denomX = Math.sqrt(xValues.reduce((sum, x) => sum + (x - meanX) ** 2, 0));
        const denomY = Math.sqrt(values.reduce((sum, y) => sum + (y - meanY) ** 2, 0));
        const correlation = numerator / (denomX * denomY);

        // Determine trend characteristics
        const confidence = Math.abs(correlation);
        const strength = Math.abs(slope) / (meanY || 1);
        const direction = Math.sign(slope);

        let trendType: 'upward' | 'downward' | 'stable' | 'volatile' | 'anomaly';
        if (Math.abs(slope) < 0.01) {
            trendType = 'stable';
        } else if (slope > 0) {
            trendType = 'upward';
        } else {
            trendType = 'downward';
        }

        // Generate predictions
        const predictions = this.generateLinearPredictions(data, slope, intercept, 5);

        return {
            trendType,
            confidence,
            strength,
            direction,
            changeRate: slope,
            patterns: [{
                type: 'linear',
                confidence,
                description: `Linear trend with slope ${slope.toFixed(4)}`,
            }],
            predictions,
        };
    }

    private analyzeExponentialTrend(data: DataPoint[], sensitivity?: string): TrendResult {
        const values = data.map(point => point.value);
        const n = values.length;

        // Transform to logarithmic scale for exponential analysis
        const logValues = values.map(v => Math.log(Math.max(v, 0.001))); // Avoid log(0)
        const xValues = Array.from({ length: n }, (_, i) => i);

        // Linear regression on log-transformed data
        const sumX = xValues.reduce((sum, x) => sum + x, 0);
        const sumLogY = logValues.reduce((sum, y) => sum + y, 0);
        const sumXLogY = xValues.reduce((sum, x, i) => sum + x * logValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const logSlope = (n * sumXLogY - sumX * sumLogY) / (n * sumXX - sumX * sumX);
        const logIntercept = (sumLogY - logSlope * sumX) / n;

        // Calculate exponential parameters
        const growthRate = logSlope;
        const baseValue = Math.exp(logIntercept);

        // Calculate confidence based on fit quality
        const meanLogY = sumLogY / n;
        const totalVariation = logValues.reduce((sum, y) => sum + (y - meanLogY) ** 2, 0);
        const explainedVariation = xValues.reduce((sum, x, i) => {
            const predicted = logIntercept + logSlope * x;
            return sum + (predicted - meanLogY) ** 2;
        }, 0);
        const rSquared = explainedVariation / totalVariation;

        const confidence = Math.sqrt(rSquared);
        const strength = Math.abs(growthRate);
        const direction = Math.sign(growthRate);

        let trendType: 'upward' | 'downward' | 'stable' | 'volatile' | 'anomaly';
        if (Math.abs(growthRate) < 0.01) {
            trendType = 'stable';
        } else if (growthRate > 0) {
            trendType = 'upward';
        } else {
            trendType = 'downward';
        }

        return {
            trendType,
            confidence,
            strength,
            direction,
            changeRate: growthRate,
            patterns: [{
                type: 'exponential',
                confidence,
                description: `Exponential trend with growth rate ${growthRate.toFixed(4)}`,
            }],
        };
    }

    private analyzeSeasonalTrend(data: DataPoint[], sensitivity?: string): TrendResult {
        const values = data.map(point => point.value);
        const n = values.length;

        // Detect potential seasonal periods
        const periods = [7, 30, 90, 365]; // Daily, monthly, quarterly, yearly patterns
        let bestPeriod = 0;
        let bestCorrelation = 0;

        for (const period of periods) {
            if (period < n / 2) {
                const correlation = this.calculateSeasonalCorrelation(values, period);
                if (correlation > bestCorrelation) {
                    bestCorrelation = correlation;
                    bestPeriod = period;
                }
            }
        }

        // Calculate seasonal amplitude
        const amplitude = bestPeriod > 0 ? this.calculateSeasonalAmplitude(values, bestPeriod) : 0;

        // Determine overall trend direction
        const firstHalf = values.slice(0, Math.floor(n / 2));
        const secondHalf = values.slice(Math.floor(n / 2));
        const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
        const direction = Math.sign(secondAvg - firstAvg);

        const confidence = bestCorrelation;
        const strength = amplitude / (firstAvg || 1);

        let trendType: 'upward' | 'downward' | 'stable' | 'volatile' | 'anomaly';
        if (bestCorrelation < 0.3) {
            trendType = 'volatile';
        } else if (Math.abs(direction) < 0.1) {
            trendType = 'stable';
        } else if (direction > 0) {
            trendType = 'upward';
        } else {
            trendType = 'downward';
        }

        return {
            trendType,
            confidence,
            strength,
            direction,
            changeRate: (secondAvg - firstAvg) / (firstAvg || 1),
            patterns: [{
                type: 'seasonal',
                period: bestPeriod,
                amplitude,
                confidence: bestCorrelation,
                description: `Seasonal pattern with period ${bestPeriod} and amplitude ${amplitude.toFixed(2)}`,
            }],
        };
    }

    private detectAnomalies(data: DataPoint[], sensitivity?: string): TrendResult {
        const values = data.map(point => point.value);
        const n = values.length;

        // Calculate moving average and standard deviation
        const windowSize = Math.min(10, Math.floor(n / 4));
        const anomalies: Anomaly[] = [];

        for (let i = windowSize; i < n - windowSize; i++) {
            const window = values.slice(i - windowSize, i + windowSize + 1);
            const mean = window.reduce((sum, v) => sum + v, 0) / window.length;
            const variance = window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / window.length;
            const stdDev = Math.sqrt(variance);

            const currentValue = values[i];
            const deviation = Math.abs(currentValue - mean);
            const zScore = stdDev > 0 ? deviation / stdDev : 0;

            // Determine sensitivity threshold
            let threshold = 2.0; // Default threshold
            if (sensitivity === 'low') threshold = 3.0;
            if (sensitivity === 'high') threshold = 1.5;

            if (zScore > threshold) {
                let severity: 'low' | 'medium' | 'high';
                if (zScore > 3.0) severity = 'high';
                else if (zScore > 2.5) severity = 'medium';
                else severity = 'low';

                anomalies.push({
                    timestamp: data[i].timestamp,
                    actualValue: currentValue,
                    expectedValue: mean,
                    deviation: zScore,
                    severity,
                });
            }
        }

        const confidence = anomalies.length > 0 ? 0.8 : 0.2;
        const strength = anomalies.length / n;

        return {
            trendType: 'anomaly',
            confidence,
            strength,
            direction: 0,
            changeRate: 0,
            patterns: [{
                type: 'linear',
                confidence: 0.5,
                description: `Anomaly detection found ${anomalies.length} outliers`,
            }],
            anomalies,
        };
    }

    private calculateSeasonalCorrelation(values: number[], period: number): number {
        const n = values.length;
        if (period >= n) return 0;

        let correlation = 0;
        let count = 0;

        for (let i = 0; i < n - period; i++) {
            correlation += values[i] * values[i + period];
            count++;
        }

        return count > 0 ? correlation / count : 0;
    }

    private calculateSeasonalAmplitude(values: number[], period: number): number {
        const n = values.length;
        const cycles = Math.floor(n / period);

        if (cycles < 2) return 0;

        let maxAmplitude = 0;
        for (let cycle = 0; cycle < cycles; cycle++) {
            const cycleStart = cycle * period;
            const cycleEnd = Math.min(cycleStart + period, n);
            const cycleValues = values.slice(cycleStart, cycleEnd);

            const min = Math.min(...cycleValues);
            const max = Math.max(...cycleValues);
            const amplitude = max - min;

            maxAmplitude = Math.max(maxAmplitude, amplitude);
        }

        return maxAmplitude;
    }

    private generateLinearPredictions(
        data: DataPoint[],
        slope: number,
        intercept: number,
        count: number
    ): Prediction[] {
        const predictions: Prediction[] = [];
        const lastIndex = data.length - 1;
        const lastTimestamp = Date.parse(data[lastIndex].timestamp);

        // Estimate time interval between data points
        const timeInterval = data.length > 1
            ? (Date.parse(data[lastIndex].timestamp) - Date.parse(data[0].timestamp)) / (data.length - 1)
            : 86400000; // Default to 1 day

        for (let i = 1; i <= count; i++) {
            const futureIndex = data.length + i - 1;
            const predictedValue = intercept + slope * futureIndex;
            const futureTimestamp = new Date(lastTimestamp + i * timeInterval).toISOString();

            // Calculate confidence interval (simplified)
            const confidence = Math.max(0.1, 1 - (i * 0.1)); // Decreasing confidence
            const errorMargin = Math.abs(predictedValue) * 0.1 * i; // Increasing uncertainty

            predictions.push({
                timestamp: futureTimestamp,
                predictedValue,
                confidence,
                range: {
                    min: predictedValue - errorMargin,
                    max: predictedValue + errorMargin,
                },
            });
        }

        return predictions;
    }

    private createEmptyResult(): TrendResult {
        return {
            trendType: 'stable',
            confidence: 0,
            strength: 0,
            direction: 0,
            changeRate: 0,
            patterns: [],
        };
    }
}

// Global analyzer instance
const analyzer = new TrendAnalyzer();

/**
 * Trend Detection Service Lambda Handler
 * 
 * Analyzes patterns in data to detect trends and anomalies
 */
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;

    try {
        // Parse request body
        const requestBody: TrendAnalysisRequest = JSON.parse(event.body || '{}');

        // Validate request
        if (!requestBody.dataPoints || !Array.isArray(requestBody.dataPoints)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId,
                },
                body: JSON.stringify({
                    error: {
                        errorId: traceId,
                        errorCode: 'VALIDATION_ERROR',
                        message: 'dataPoints array is required',
                        timestamp: new Date().toISOString(),
                        traceId,
                        service: 'trend-detection-service',
                        retryable: false,
                    },
                }),
            };
        }

        if (!requestBody.analysisType) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId,
                },
                body: JSON.stringify({
                    error: {
                        errorId: traceId,
                        errorCode: 'VALIDATION_ERROR',
                        message: 'analysisType is required (linear, exponential, seasonal, anomaly)',
                        timestamp: new Date().toISOString(),
                        traceId,
                        service: 'trend-detection-service',
                        retryable: false,
                    },
                }),
            };
        }

        // Perform trend analysis
        const result = await analyzer.analyzeTrends(requestBody);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                message: 'Trend analysis completed successfully',
                data: result,
            }),
        };

    } catch (error) {
        console.error('Trend detection service error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'INTERNAL_ERROR',
                    message: 'Failed to analyze trends',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'trend-detection-service',
                    retryable: true,
                },
            }),
        };
    }
};

// Export for testing
export { TrendAnalyzer, TrendAnalysisRequest, TrendResult, DataPoint };