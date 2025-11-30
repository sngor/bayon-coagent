/**
 * Tests for Life Event Analyzer and Lead Scoring Engine
 */

import {
    LifeEventAnalyzer,
    createLifeEventAnalyzer,
    isLifeEvent,
    isProspect,
    getEventTypeDisplayName,
    getEventTypeDescription,
} from '../life-event-analyzer';
import type { LifeEvent, Prospect, MarketData, TargetArea } from '../types';

describe('Life Event Analyzer', () => {
    let analyzer: LifeEventAnalyzer;

    beforeEach(() => {
        analyzer = createLifeEventAnalyzer();
    });

    describe('calculateLeadScore', () => {
        const mockMarketData: MarketData = {
            neighborhood: 'Test Area',
            date: new Date().toISOString(),
            medianPrice: 450000,
            inventoryLevel: 4.2,
            avgDaysOnMarket: 28,
            salesVolume: 125,
        };

        it('should return 0 for empty events array', () => {
            const score = analyzer.calculateLeadScore([], mockMarketData);
            expect(score).toBe(0);
        });

        it('should calculate correct base score for marriage event', () => {
            const marriageEvent: LifeEvent = {
                id: '1',
                personId: 'person1',
                eventType: 'marriage',
                eventDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
                location: 'Test City',
                confidence: 90,
                source: 'public-records',
            };

            const score = analyzer.calculateLeadScore([marriageEvent], mockMarketData);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(100);
        });

        it('should apply timing multiplier correctly', () => {
            const recentEvent: LifeEvent = {
                id: '1',
                personId: 'person1',
                eventType: 'divorce',
                eventDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
                location: 'Test City',
                confidence: 90,
                source: 'public-records',
            };

            const oldEvent: LifeEvent = {
                ...recentEvent,
                id: '2',
                eventDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), // 400 days ago
            };

            const recentScore = analyzer.calculateLeadScore([recentEvent], mockMarketData);
            const oldScore = analyzer.calculateLeadScore([oldEvent], mockMarketData);

            expect(recentScore).toBeGreaterThan(oldScore);
        });

        it('should handle multiple events correctly', () => {
            const events: LifeEvent[] = [
                {
                    id: '1',
                    personId: 'person1',
                    eventType: 'marriage',
                    eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    location: 'Test City',
                    confidence: 90,
                    source: 'public-records',
                },
                {
                    id: '2',
                    personId: 'person1',
                    eventType: 'job-change',
                    eventDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                    location: 'Test City',
                    confidence: 85,
                    source: 'employment-records',
                },
            ];

            const singleEventScore = analyzer.calculateLeadScore([events[0]], mockMarketData);
            const multipleEventScore = analyzer.calculateLeadScore(events, mockMarketData);

            expect(multipleEventScore).toBeGreaterThan(singleEventScore);
        });

        it('should ensure score is within valid range', () => {
            const highWeightEvents: LifeEvent[] = Array.from({ length: 10 }, (_, i) => ({
                id: `${i}`,
                personId: 'person1',
                eventType: 'death' as const,
                eventDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                location: 'Test City',
                confidence: 100,
                source: 'public-records',
            }));

            const score = analyzer.calculateLeadScore(highWeightEvents, mockMarketData);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe('identifyMultipleEvents', () => {
        it('should return 0 for single event', () => {
            const prospect: Prospect = {
                id: 'prospect1',
                location: 'Test City',
                events: [{
                    id: '1',
                    personId: 'person1',
                    eventType: 'marriage',
                    eventDate: new Date().toISOString(),
                    location: 'Test City',
                    confidence: 90,
                    source: 'public-records',
                }],
                leadScore: 65,
                lastAnalyzed: new Date().toISOString(),
            };

            const bonus = analyzer.identifyMultipleEvents(prospect);
            expect(bonus).toBe(0);
        });

        it('should calculate correct bonus for multiple events within 90 days', () => {
            const baseDate = new Date();
            const prospect: Prospect = {
                id: 'prospect1',
                location: 'Test City',
                events: [
                    {
                        id: '1',
                        personId: 'person1',
                        eventType: 'marriage',
                        eventDate: baseDate.toISOString(),
                        location: 'Test City',
                        confidence: 90,
                        source: 'public-records',
                    },
                    {
                        id: '2',
                        personId: 'person1',
                        eventType: 'job-change',
                        eventDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        location: 'Test City',
                        confidence: 85,
                        source: 'employment-records',
                    },
                    {
                        id: '3',
                        personId: 'person1',
                        eventType: 'birth',
                        eventDate: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                        location: 'Test City',
                        confidence: 95,
                        source: 'public-records',
                    },
                ],
                leadScore: 85,
                lastAnalyzed: new Date().toISOString(),
            };

            const bonus = analyzer.identifyMultipleEvents(prospect);
            expect(bonus).toBe(30); // 2 additional events × 15 points each
        });

        it('should not count events outside 90-day window', () => {
            const baseDate = new Date();
            const prospect: Prospect = {
                id: 'prospect1',
                location: 'Test City',
                events: [
                    {
                        id: '1',
                        personId: 'person1',
                        eventType: 'marriage',
                        eventDate: baseDate.toISOString(),
                        location: 'Test City',
                        confidence: 90,
                        source: 'public-records',
                    },
                    {
                        id: '2',
                        personId: 'person1',
                        eventType: 'job-change',
                        eventDate: new Date(baseDate.getTime() + 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days later
                        location: 'Test City',
                        confidence: 85,
                        source: 'employment-records',
                    },
                ],
                leadScore: 70,
                lastAnalyzed: new Date().toISOString(),
            };

            const bonus = analyzer.identifyMultipleEvents(prospect);
            expect(bonus).toBe(0); // Event outside 90-day window
        });
    });

    describe('isHighIntentLead', () => {
        it('should return true for scores above 70', () => {
            expect(analyzer.isHighIntentLead(71)).toBe(true);
            expect(analyzer.isHighIntentLead(85)).toBe(true);
            expect(analyzer.isHighIntentLead(100)).toBe(true);
        });

        it('should return false for scores 70 and below', () => {
            expect(analyzer.isHighIntentLead(70)).toBe(false);
            expect(analyzer.isHighIntentLead(65)).toBe(false);
            expect(analyzer.isHighIntentLead(0)).toBe(false);
        });
    });

    describe('analyzeEvents', () => {
        it('should return empty array when no prospects found', async () => {
            const targetAreas: TargetArea[] = [{
                id: '1',
                type: 'zip',
                value: '12345',
                label: 'Test ZIP',
            }];

            const alerts = await analyzer.analyzeEvents(targetAreas);
            expect(Array.isArray(alerts)).toBe(true);
            expect(alerts).toHaveLength(0);
        });
    });
});

describe('Validation Functions', () => {
    describe('isLifeEvent', () => {
        it('should validate correct life event', () => {
            const validEvent = {
                id: '1',
                personId: 'person1',
                eventType: 'marriage',
                eventDate: new Date().toISOString(),
                location: 'Test City',
                confidence: 90,
                source: 'public-records',
            };

            expect(isLifeEvent(validEvent)).toBe(true);
        });

        it('should reject invalid life event', () => {
            const invalidEvent = {
                id: '1',
                // Missing personId
                eventType: 'invalid-type',
                eventDate: 'invalid-date',
                location: 123, // Should be string
                confidence: 150, // Out of range
                source: 'public-records',
            };

            expect(isLifeEvent(invalidEvent)).toBe(false);
        });

        it('should reject events with invalid event types', () => {
            const invalidEvent = {
                id: '1',
                personId: 'person1',
                eventType: 'invalid-event-type',
                eventDate: new Date().toISOString(),
                location: 'Test City',
                confidence: 90,
                source: 'public-records',
            };

            expect(isLifeEvent(invalidEvent)).toBe(false);
        });

        it('should reject events with confidence out of range', () => {
            const invalidEvent = {
                id: '1',
                personId: 'person1',
                eventType: 'marriage',
                eventDate: new Date().toISOString(),
                location: 'Test City',
                confidence: -10,
                source: 'public-records',
            };

            expect(isLifeEvent(invalidEvent)).toBe(false);
        });
    });

    describe('isProspect', () => {
        it('should validate correct prospect', () => {
            const validProspect = {
                id: 'prospect1',
                location: 'Test City',
                events: [{
                    id: '1',
                    personId: 'person1',
                    eventType: 'marriage',
                    eventDate: new Date().toISOString(),
                    location: 'Test City',
                    confidence: 90,
                    source: 'public-records',
                }],
                leadScore: 75,
                lastAnalyzed: new Date().toISOString(),
            };

            expect(isProspect(validProspect)).toBe(true);
        });

        it('should reject invalid prospect', () => {
            const invalidProspect = {
                // Missing id
                location: 123, // Should be string
                events: 'not-an-array',
                leadScore: 150, // Out of range
                lastAnalyzed: new Date().toISOString(),
            };

            expect(isProspect(invalidProspect)).toBe(false);
        });
    });
});

describe('Utility Functions', () => {
    describe('getEventTypeDisplayName', () => {
        it('should return correct display names', () => {
            expect(getEventTypeDisplayName('marriage')).toBe('Marriage');
            expect(getEventTypeDisplayName('divorce')).toBe('Divorce');
            expect(getEventTypeDisplayName('job-change')).toBe('Job Change');
            expect(getEventTypeDisplayName('retirement')).toBe('Retirement');
            expect(getEventTypeDisplayName('birth')).toBe('Birth');
            expect(getEventTypeDisplayName('death')).toBe('Death');
        });
    });

    describe('getEventTypeDescription', () => {
        it('should return meaningful descriptions', () => {
            const description = getEventTypeDescription('marriage');
            expect(typeof description).toBe('string');
            expect(description.length).toBeGreaterThan(0);
            expect(description).toContain('home');
        });
    });

    describe('createLifeEventAnalyzer', () => {
        it('should create a new analyzer instance', () => {
            const analyzer = createLifeEventAnalyzer();
            expect(analyzer).toBeInstanceOf(LifeEventAnalyzer);
        });
    });
});