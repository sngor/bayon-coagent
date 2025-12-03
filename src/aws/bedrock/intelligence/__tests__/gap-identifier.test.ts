/**
 * Gap Identifier Tests
 * 
 * Tests for content gap identification, topic suggestions,
 * and gap tracking functionality.
 */

import {
    GapIdentifier,
    ContentItem,
    ContentGap,
    GapAnalysisResult,
} from '../gap-identifier';
import { AgentProfile } from '../types';

describe('GapIdentifier', () => {
    let identifier: GapIdentifier;
    let agentProfile: AgentProfile;
    let contentLibrary: ContentItem[];

    beforeEach(() => {
        identifier = new GapIdentifier();

        agentProfile = {
            id: 'agent-123',
            agentName: 'Sarah Johnson',
            primaryMarket: 'Austin, TX',
            specialization: ['luxury homes', 'residential'],
        };

        // Create sample content library
        contentLibrary = [
            {
                id: 'content-1',
                type: 'blog-post',
                title: 'Market Update',
                content: 'Lorem ipsum '.repeat(100), // ~200 words
                topics: ['market trends', 'pricing'],
                keywords: ['real estate', 'market', 'trends', 'pricing', 'austin'],
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            },
            {
                id: 'content-2',
                type: 'social-media',
                title: 'Quick Tip',
                content: 'Short social media post about staging',
                topics: ['home staging'],
                keywords: ['staging', 'tips', 'selling'],
                createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
            },
            {
                id: 'content-3',
                type: 'blog-post',
                title: 'Neighborhood Guide',
                content: 'Lorem ipsum '.repeat(150), // ~300 words
                topics: ['neighborhoods', 'local schools'],
                keywords: ['neighborhood', 'schools', 'community', 'austin', 'guide'],
                targetAudience: ['buyers', 'first-time buyers'],
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            },
        ];
    });

    describe('analyzeLibrary', () => {
        it('should analyze content library and detect gaps', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);

            expect(result).toBeDefined();
            expect(result.gaps).toBeInstanceOf(Array);
            expect(result.totalGaps).toBeGreaterThan(0);
            expect(result.coverageScore).toBeGreaterThanOrEqual(0);
            expect(result.coverageScore).toBeLessThanOrEqual(1);
            expect(result.summary).toBeDefined();
            expect(result.metadata).toBeDefined();
        });

        it('should detect topic gaps for luxury homes specialization', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);

            const topicGaps = result.gaps.filter(g => g.type === 'topic');
            expect(topicGaps.length).toBeGreaterThan(0);

            const luxuryGap = topicGaps.find(g => g.title.includes('luxury homes'));
            expect(luxuryGap).toBeDefined();
            expect(luxuryGap!.missingElements.length).toBeGreaterThan(0);
        });

        it('should detect format gaps', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);

            const formatGaps = result.gaps.filter(g => g.type === 'format');
            expect(formatGaps.length).toBeGreaterThan(0);

            const formatGap = formatGaps[0];
            expect(formatGap.missingElements).toContain('video-script');
            expect(formatGap.missingElements).toContain('newsletter');
        });

        it('should detect audience gaps', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);

            const audienceGaps = result.gaps.filter(g => g.type === 'audience');
            expect(audienceGaps.length).toBeGreaterThan(0);

            const audienceGap = audienceGaps[0];
            expect(audienceGap.missingElements).toContain('sellers');
            expect(audienceGap.missingElements).toContain('investors');
        });

        it('should detect frequency gaps', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);

            const frequencyGaps = result.gaps.filter(g => g.type === 'frequency');
            expect(frequencyGaps.length).toBeGreaterThan(0);

            const frequencyGap = frequencyGaps[0];
            expect(frequencyGap.severity).toBe('high');
            expect(frequencyGap.impact).toBeGreaterThan(0);
        });

        it('should calculate coverage summary', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);

            expect(result.summary.topicCoverage).toBeGreaterThanOrEqual(0);
            expect(result.summary.topicCoverage).toBeLessThanOrEqual(1);
            expect(result.summary.formatDiversity).toBeGreaterThanOrEqual(0);
            expect(result.summary.formatDiversity).toBeLessThanOrEqual(1);
            expect(result.summary.audienceReach).toBeGreaterThanOrEqual(0);
            expect(result.summary.audienceReach).toBeLessThanOrEqual(1);
            expect(result.summary.contentFrequency).toBeGreaterThanOrEqual(0);
            expect(result.summary.contentFrequency).toBeLessThanOrEqual(1);
            expect(result.summary.overallHealth).toBeGreaterThanOrEqual(0);
            expect(result.summary.overallHealth).toBeLessThanOrEqual(1);
        });

        it('should filter gaps by confidence and impact thresholds', async () => {
            const strictIdentifier = new GapIdentifier({
                minConfidence: 0.9,
                minImpact: 0.7,
            });

            const result = await strictIdentifier.analyzeLibrary(contentLibrary, agentProfile);

            // Should have fewer gaps with stricter thresholds
            result.gaps.forEach(gap => {
                expect(gap.confidence).toBeGreaterThanOrEqual(0.9);
                expect(gap.impact).toBeGreaterThanOrEqual(0.7);
            });
        });

        it('should include recommendations for each gap', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);

            result.gaps.forEach(gap => {
                expect(gap.recommendations).toBeInstanceOf(Array);
                expect(gap.recommendations.length).toBeGreaterThan(0);

                gap.recommendations.forEach(rec => {
                    expect(rec.action).toBeDefined();
                    expect(rec.priority).toBeDefined();
                    expect(rec.expectedImpact).toBeDefined();
                    expect(rec.effort).toBeDefined();
                    expect(rec.timeline).toBeDefined();
                });
            });
        });

        it('should include evidence for each gap', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);

            result.gaps.forEach(gap => {
                expect(gap.evidence).toBeInstanceOf(Array);
                expect(gap.evidence.length).toBeGreaterThan(0);

                gap.evidence.forEach(evidence => {
                    expect(evidence.type).toBeDefined();
                    expect(evidence.description).toBeDefined();
                    expect(evidence.source).toBeDefined();
                    expect(evidence.relevance).toBeGreaterThanOrEqual(0);
                    expect(evidence.relevance).toBeLessThanOrEqual(1);
                });
            });
        });
    });

    describe('generateTopicSuggestions', () => {
        it('should generate topic suggestions for a gap', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);
            const topicGap = result.gaps.find(g => g.type === 'topic');

            if (topicGap) {
                const suggestions = await identifier.generateTopicSuggestions(
                    topicGap,
                    agentProfile
                );

                expect(suggestions).toBeInstanceOf(Array);
                expect(suggestions.length).toBeGreaterThan(0);
                suggestions.forEach(suggestion => {
                    expect(typeof suggestion).toBe('string');
                });
            }
        });

        it('should include missing elements in suggestions', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);
            const topicGap = result.gaps.find(g => g.type === 'topic');

            if (topicGap) {
                const suggestions = await identifier.generateTopicSuggestions(
                    topicGap,
                    agentProfile
                );

                topicGap.missingElements.forEach(element => {
                    expect(suggestions).toContain(element);
                });
            }
        });

        it('should include specialization topics in suggestions', async () => {
            const result = await identifier.analyzeLibrary(contentLibrary, agentProfile);
            const topicGap = result.gaps.find(g => g.type === 'topic');

            if (topicGap) {
                const suggestions = await identifier.generateTopicSuggestions(
                    topicGap,
                    agentProfile
                );

                // Should include luxury homes topics
                const hasLuxuryTopic = suggestions.some(s =>
                    s.toLowerCase().includes('luxury')
                );
                expect(hasLuxuryTopic).toBe(true);
            }
        });
    });

    describe('trackGapResolution', () => {
        it('should track gap resolution', async () => {
            const resolvedGap = await identifier.trackGapResolution(
                'gap-123',
                ['content-1', 'content-2'],
                'agent-123'
            );

            expect(resolvedGap).toBeDefined();
            expect(resolvedGap.status).toBe('resolved');
            expect(resolvedGap.resolution).toBeDefined();
            expect(resolvedGap.resolution!.contentCreated).toEqual(['content-1', 'content-2']);
            expect(resolvedGap.resolution!.resolvedBy).toBe('agent-123');
        });
    });

    describe('monitorGaps', () => {
        it('should monitor gaps over time', async () => {
            const historicalGaps: ContentGap[] = [
                {
                    id: 'gap-1',
                    type: 'topic',
                    title: 'Old Gap',
                    description: 'Old gap',
                    severity: 'medium',
                    impact: 0.5,
                    confidence: 0.8,
                    missingElements: [],
                    recommendations: [],
                    evidence: [],
                    detectedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
                    status: 'open',
                },
                {
                    id: 'gap-2',
                    type: 'format',
                    title: 'New Gap',
                    description: 'New gap',
                    severity: 'low',
                    impact: 0.3,
                    confidence: 0.7,
                    missingElements: [],
                    recommendations: [],
                    evidence: [],
                    detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                    status: 'open',
                },
                {
                    id: 'gap-3',
                    type: 'audience',
                    title: 'Resolved Gap',
                    description: 'Resolved gap',
                    severity: 'medium',
                    impact: 0.4,
                    confidence: 0.8,
                    missingElements: [],
                    recommendations: [],
                    evidence: [],
                    detectedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
                    status: 'resolved',
                },
            ];

            const monitoring = await identifier.monitorGaps('user-123', historicalGaps);

            expect(monitoring).toBeDefined();
            expect(monitoring.newGaps).toBeInstanceOf(Array);
            expect(monitoring.resolvedGaps).toBeInstanceOf(Array);
            expect(monitoring.persistentGaps).toBeInstanceOf(Array);
            expect(['improving', 'stable', 'declining']).toContain(monitoring.trend);
        });

        it('should identify persistent gaps', async () => {
            const historicalGaps: ContentGap[] = [
                {
                    id: 'gap-1',
                    type: 'topic',
                    title: 'Persistent Gap',
                    description: 'Old unresolved gap',
                    severity: 'high',
                    impact: 0.7,
                    confidence: 0.9,
                    missingElements: [],
                    recommendations: [],
                    evidence: [],
                    detectedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
                    status: 'open',
                },
            ];

            const monitoring = await identifier.monitorGaps('user-123', historicalGaps);

            expect(monitoring.persistentGaps.length).toBeGreaterThan(0);
            expect(monitoring.persistentGaps[0].id).toBe('gap-1');
        });

        it('should determine trend correctly', async () => {
            // Improving trend: fewer new gaps than old gaps
            const improvingGaps: ContentGap[] = [
                ...Array(5).fill(null).map((_, i) => ({
                    id: `gap-old-${i}`,
                    type: 'topic' as const,
                    title: 'Old Gap',
                    description: 'Old gap',
                    severity: 'medium' as const,
                    impact: 0.5,
                    confidence: 0.8,
                    missingElements: [],
                    recommendations: [],
                    evidence: [],
                    detectedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'open' as const,
                })),
                ...Array(2).fill(null).map((_, i) => ({
                    id: `gap-new-${i}`,
                    type: 'topic' as const,
                    title: 'New Gap',
                    description: 'New gap',
                    severity: 'low' as const,
                    impact: 0.3,
                    confidence: 0.7,
                    missingElements: [],
                    recommendations: [],
                    evidence: [],
                    detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'open' as const,
                })),
            ];

            const monitoring = await identifier.monitorGaps('user-123', improvingGaps);
            expect(monitoring.trend).toBe('improving');
        });
    });

    describe('edge cases', () => {
        it('should handle empty content library', async () => {
            const result = await identifier.analyzeLibrary([], agentProfile);

            expect(result.gaps.length).toBeGreaterThan(0); // Should detect many gaps
            expect(result.coverageScore).toBeLessThan(0.5); // Low coverage
        });

        it('should handle content with no topics', async () => {
            const contentWithoutTopics: ContentItem[] = [
                {
                    id: 'content-1',
                    type: 'blog-post',
                    title: 'Post',
                    content: 'Content',
                    topics: [],
                    keywords: [],
                    createdAt: new Date().toISOString(),
                },
            ];

            const result = await identifier.analyzeLibrary(contentWithoutTopics, agentProfile);

            expect(result).toBeDefined();
            expect(result.gaps.length).toBeGreaterThan(0);
        });

        it('should handle agent with no specialization', async () => {
            const genericAgent: AgentProfile = {
                id: 'agent-456',
                agentName: 'John Doe',
                primaryMarket: 'Dallas, TX',
                specialization: [],
            };

            const result = await identifier.analyzeLibrary(contentLibrary, genericAgent);

            expect(result).toBeDefined();
            // Should still detect format, audience, and frequency gaps
            expect(result.gaps.length).toBeGreaterThan(0);
        });

        it('should handle very recent content only', async () => {
            const recentContent: ContentItem[] = [
                {
                    id: 'content-1',
                    type: 'blog-post',
                    title: 'Recent Post',
                    content: 'Lorem ipsum '.repeat(100),
                    topics: ['market trends'],
                    keywords: ['real estate'],
                    createdAt: new Date().toISOString(), // Today
                },
            ];

            const result = await identifier.analyzeLibrary(recentContent, agentProfile);

            expect(result).toBeDefined();
            expect(result.metadata.itemsAnalyzed).toBe(1);
        });
    });
});
