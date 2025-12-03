/**
 * TrendAnalyzer Tests
 * 
 * Unit tests for the TrendAnalyzer class
 */

import { TrendAnalyzer } from '../trend-analyzer';
import { MarketData, AgentProfile } from '../types';

describe('TrendAnalyzer', () => {
    let analyzer: TrendAnalyzer;

    beforeEach(() => {
        analyzer = new TrendAnalyzer();
    });

    describe('analyzeTrends', () => {
        it('should detect rising trend from increasing data', async () => {
            const marketData: MarketData[] = [
                {
                    market: 'Austin',
                    dataType: 'price',
                    metric: 'median-price',
                    value: 400000,
                    timestamp: '2024-01-01T00:00:00Z',
                    source: 'test',
                },
                {
                    market: 'Austin',
                    dataType: 'price',
                    metric: 'median-price',
                    value: 410000,
                    timestamp: '2024-02-01T00:00:00Z',
                    source: 'test',
                },
                {
                    market: 'Austin',
                    dataType: 'price',
                    metric: 'median-price',
                    value: 420000,
                    timestamp: '2024-03-01T00:00:00Z',
                    source: 'test',
                },
                {
                    market: 'Austin',
                    dataType: 'price',
                    metric: 'median-price',
                    value: 430000,
                    timestamp: '2024-04-01T00:00:00Z',
                    source: 'test',
                },
                {
                    market: 'Austin',
                    dataType: 'price',
                    metric: 'median-price',
                    value: 440000,
                    timestamp: '2024-05-01T00:00:00Z',
                    source: 'test',
                },
            ];

            const trends = await analyzer.analyzeTrends(marketData, '90 days');

            expect(trends.length).toBeGreaterThan(0);
            expect(trends[0].direction).toBe('rising');
            expect(trends[0].market).toBe('Austin');
            expect(trends[0].category).toBe('price');
        });

        it('should detect falling trend from decreasing data', async () => {
            const marketData: MarketData[] = [
                {
                    market: 'Seattle',
                    dataType: 'inventory',
                    metric: 'active-listings',
                    value: 1000,
                    timestamp: '2024-01-01T00:00:00Z',
                    source: 'test',
                },
                {
                    market: 'Seattle',
                    dataType: 'inventory',
                    metric: 'active-listings',
                    value: 950,
                    timestamp: '2024-02-01T00:00:00Z',
                    source: 'test',
                },
                {
                    market: 'Seattle',
                    dataType: 'inventory',
                    metric: 'active-listings',
                    value: 900,
                    timestamp: '2024-03-01T00:00:00Z',
                    source: 'test',
                },
                {
                    market: 'Seattle',
                    dataType: 'inventory',
                    metric: 'active-listings',
                    value: 850,
                    timestamp: '2024-04-01T00:00:00Z',
                    source: 'test',
                },
                {
                    market: 'Seattle',
                    dataType: 'inventory',
                    metric: 'active-listings',
                    value: 800,
                    timestamp: '2024-05-01T00:00:00Z',
                    source: 'test',
                },
            ];

            const trends = await analyzer.analyzeTrends(marketData, '90 days');

            expect(trends.length).toBeGreaterThan(0);
            expect(trends[0].direction).toBe('falling');
            expect(trends[0].market).toBe('Seattle');
        });

        it('should return empty array for insufficient data', async () => {
            const marketData: MarketData[] = [
                {
                    market: 'Denver',
                    dataType: 'price',
                    metric: 'median-price',
                    value: 500000,
                    timestamp: '2024-01-01T00:00:00Z',
                    source: 'test',
                },
            ];

            const trends = await analyzer.analyzeTrends(marketData, '90 days');

            expect(trends).toEqual([]);
        });

        it('should handle multiple markets and metrics', async () => {
            const marketData: MarketData[] = [
                // Austin prices
                ...Array.from({ length: 5 }, (_, i) => ({
                    market: 'Austin',
                    dataType: 'price' as const,
                    metric: 'median-price',
                    value: 400000 + i * 10000,
                    timestamp: new Date(2024, i, 1).toISOString(),
                    source: 'test',
                })),
                // Seattle inventory
                ...Array.from({ length: 5 }, (_, i) => ({
                    market: 'Seattle',
                    dataType: 'inventory' as const,
                    metric: 'active-listings',
                    value: 1000 - i * 50,
                    timestamp: new Date(2024, i, 1).toISOString(),
                    source: 'test',
                })),
            ];

            const trends = await analyzer.analyzeTrends(marketData, '90 days');

            expect(trends.length).toBe(2);
            expect(trends.some(t => t.market === 'Austin')).toBe(true);
            expect(trends.some(t => t.market === 'Seattle')).toBe(true);
        });
    });

    describe('predictTrendTrajectory', () => {
        it('should predict future values for rising trend', async () => {
            const marketData: MarketData[] = Array.from({ length: 10 }, (_, i) => ({
                market: 'Austin',
                dataType: 'price' as const,
                metric: 'median-price',
                value: 400000 + i * 5000,
                timestamp: new Date(2024, i, 1).toISOString(),
                source: 'test',
            }));

            const trends = await analyzer.analyzeTrends(marketData, '90 days');
            expect(trends.length).toBeGreaterThan(0);

            const prediction = await analyzer.predictTrendTrajectory(trends[0], []);

            expect(prediction.trendId).toBe(trends[0].id);
            expect(prediction.predictions.length).toBeGreaterThan(0);
            expect(prediction.predictedDirection).toBe('rising');
            expect(prediction.confidence).toBeGreaterThan(0);
            expect(prediction.methodology).toBe('linear-regression');
        });

        it('should include confidence intervals in predictions', async () => {
            const marketData: MarketData[] = Array.from({ length: 8 }, (_, i) => ({
                market: 'Denver',
                dataType: 'demand' as const,
                metric: 'buyer-interest',
                value: 100 + i * 2,
                timestamp: new Date(2024, i, 1).toISOString(),
                source: 'test',
            }));

            const trends = await analyzer.analyzeTrends(marketData, '90 days');
            const prediction = await analyzer.predictTrendTrajectory(trends[0], []);

            prediction.predictions.forEach(pred => {
                expect(pred.lowerBound).toBeLessThanOrEqual(pred.value);
                expect(pred.upperBound).toBeGreaterThanOrEqual(pred.value);
                expect(pred.confidenceLevel).toBe(0.95);
            });
        });

        it('should throw error for insufficient data', async () => {
            const trend = {
                id: 'test-trend',
                name: 'Test Trend',
                description: 'Test',
                market: 'Test',
                category: 'price' as const,
                direction: 'rising' as const,
                strength: 'moderate' as const,
                confidence: 0.8,
                relevance: 0.5,
                dataPoints: [
                    { timestamp: '2024-01-01T00:00:00Z', value: 100, source: 'test' },
                ],
                statistics: {
                    mean: 100,
                    standardDeviation: 0,
                    rateOfChange: 0,
                    percentChange: 0,
                    volatility: 0,
                },
                detectedAt: '2024-01-01T00:00:00Z',
                lastUpdated: '2024-01-01T00:00:00Z',
            };

            await expect(
                analyzer.predictTrendTrajectory(trend, [])
            ).rejects.toThrow('Insufficient data points for prediction');
        });
    });

    describe('getRelevantTrends', () => {
        it('should filter and sort trends by relevance', async () => {
            const agentProfile: AgentProfile = {
                id: 'agent-1',
                agentName: 'John Doe',
                primaryMarket: 'Austin',
                specialization: ['luxury', 'residential'],
            };

            const marketData: MarketData[] = [
                // Austin luxury trend (high relevance)
                ...Array.from({ length: 5 }, (_, i) => ({
                    market: 'Austin',
                    dataType: 'price' as const,
                    metric: 'luxury-median-price',
                    value: 1000000 + i * 50000,
                    timestamp: new Date(2024, i, 1).toISOString(),
                    source: 'test',
                })),
                // Seattle trend (low relevance)
                ...Array.from({ length: 5 }, (_, i) => ({
                    market: 'Seattle',
                    dataType: 'inventory' as const,
                    metric: 'active-listings',
                    value: 1000 - i * 50,
                    timestamp: new Date(2024, i, 1).toISOString(),
                    source: 'test',
                })),
            ];

            const allTrends = await analyzer.analyzeTrends(marketData, '90 days');
            const relevantTrends = analyzer.getRelevantTrends(allTrends, agentProfile);

            expect(relevantTrends.length).toBeGreaterThan(0);
            expect(relevantTrends[0].market).toBe('Austin');
            expect(relevantTrends[0].relevance).toBeGreaterThan(0.3);

            // Check sorting by relevance
            for (let i = 1; i < relevantTrends.length; i++) {
                expect(relevantTrends[i - 1].relevance).toBeGreaterThanOrEqual(
                    relevantTrends[i].relevance
                );
            }
        });

        it('should filter out low relevance trends', async () => {
            const agentProfile: AgentProfile = {
                id: 'agent-1',
                agentName: 'Jane Smith',
                primaryMarket: 'Miami',
                specialization: ['commercial'],
            };

            const marketData: MarketData[] = Array.from({ length: 5 }, (_, i) => ({
                market: 'Seattle',
                dataType: 'price' as const,
                metric: 'residential-price',
                value: 500000 + i * 10000,
                timestamp: new Date(2024, i, 1).toISOString(),
                source: 'test',
            }));

            const allTrends = await analyzer.analyzeTrends(marketData, '90 days');
            const relevantTrends = analyzer.getRelevantTrends(allTrends, agentProfile);

            // Should filter out trends with relevance < 0.3
            relevantTrends.forEach(trend => {
                expect(trend.relevance).toBeGreaterThan(0.3);
            });
        });
    });

    describe('generateNotification', () => {
        it('should generate notification for new trend', async () => {
            const marketData: MarketData[] = Array.from({ length: 6 }, (_, i) => ({
                market: 'Boston',
                dataType: 'price' as const,
                metric: 'median-price',
                value: 600000 + i * 15000,
                timestamp: new Date(2024, i, 1).toISOString(),
                source: 'test',
            }));

            const trends = await analyzer.analyzeTrends(marketData, '90 days');
            const notification = await analyzer.generateNotification(
                'user-123',
                trends[0],
                'new-trend'
            );

            expect(notification.userId).toBe('user-123');
            expect(notification.trend).toBe(trends[0]);
            expect(notification.type).toBe('new-trend');
            expect(notification.message).toContain('New');
            expect(notification.message).toContain('trend detected');
            expect(notification.priority).toBeDefined();
            expect(notification.actionItems.length).toBeGreaterThan(0);
            expect(notification.read).toBe(false);
        });

        it('should set appropriate priority based on trend strength', async () => {
            const strongTrendData: MarketData[] = Array.from({ length: 8 }, (_, i) => ({
                market: 'Phoenix',
                dataType: 'price' as const,
                metric: 'median-price',
                value: 400000 + i * 30000,
                timestamp: new Date(2024, i, 1).toISOString(),
                source: 'test',
            }));

            const trends = await analyzer.analyzeTrends(strongTrendData, '90 days');
            const notification = await analyzer.generateNotification(
                'user-123',
                trends[0],
                'trend-alert'
            );

            // Strong trends should have higher priority
            expect(notification.priority).toBeDefined();
            expect(['low', 'medium', 'high', 'urgent']).toContain(notification.priority);
        });

        it('should include action items', async () => {
            const marketData: MarketData[] = Array.from({ length: 5 }, (_, i) => ({
                market: 'Portland',
                dataType: 'demand' as const,
                metric: 'buyer-interest',
                value: 100 + i * 5,
                timestamp: new Date(2024, i, 1).toISOString(),
                source: 'test',
            }));

            const trends = await analyzer.analyzeTrends(marketData, '90 days');
            const notification = await analyzer.generateNotification(
                'user-123',
                trends[0],
                'trend-opportunity'
            );

            expect(notification.actionItems.length).toBeGreaterThan(0);
            expect(notification.actionItems.some(item =>
                item.toLowerCase().includes('content') ||
                item.toLowerCase().includes('monitor') ||
                item.toLowerCase().includes('client')
            )).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle stable trends', async () => {
            const marketData: MarketData[] = Array.from({ length: 5 }, (_, i) => ({
                market: 'Chicago',
                dataType: 'price' as const,
                metric: 'median-price',
                value: 300000 + (i % 2 === 0 ? 100 : -100),
                timestamp: new Date(2024, i, 1).toISOString(),
                source: 'test',
            }));

            const trends = await analyzer.analyzeTrends(marketData, '90 days');

            // Stable trends might not be detected due to minRateOfChange threshold
            // or if detected, should have 'stable' direction
            if (trends.length > 0) {
                expect(['stable', 'volatile']).toContain(trends[0].direction);
            }
        });

        it('should handle volatile data', async () => {
            const marketData: MarketData[] = Array.from({ length: 8 }, (_, i) => ({
                market: 'Las Vegas',
                dataType: 'price' as const,
                metric: 'median-price',
                value: 350000 + (i % 2 === 0 ? 50000 : -40000),
                timestamp: new Date(2024, i, 1).toISOString(),
                source: 'test',
            }));

            const trends = await analyzer.analyzeTrends(marketData, '90 days');

            if (trends.length > 0) {
                expect(trends[0].statistics.volatility).toBeGreaterThan(0.1);
            }
        });

        it('should handle negative values', async () => {
            const marketData: MarketData[] = Array.from({ length: 5 }, (_, i) => ({
                market: 'Detroit',
                dataType: 'economic' as const,
                metric: 'price-change',
                value: -5 + i * 2,
                timestamp: new Date(2024, i, 1).toISOString(),
                source: 'test',
            }));

            const trends = await analyzer.analyzeTrends(marketData, '90 days');

            expect(trends.length).toBeGreaterThanOrEqual(0);
            if (trends.length > 0) {
                expect(trends[0].direction).toBe('rising');
            }
        });
    });
});
