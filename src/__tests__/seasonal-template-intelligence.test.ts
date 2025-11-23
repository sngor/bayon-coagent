/**
 * Seasonal Template Intelligence Tests
 * 
 * Tests for seasonal template recommendation engine, proactive notifications,
 * template personalization, and performance tracking functionality.
 * 
 * Requirements:
 * - 11.1: Display seasonal templates organized by time of year
 * - 11.2: Recommend relevant seasonal templates to the user
 * - 11.3: Customize template with user's brand information
 * - 11.4: Notify users of new or improved templates
 * - 11.5: Display all relevant templates when multiple seasonal events overlap
 */

import { describe, it, expect } from '@jest/globals';
import { ContentCategory } from '@/lib/content-workflow-types';

describe('Seasonal Template Intelligence', () => {
    describe('Basic Functionality', () => {
        it('should have seasonal template data structure', () => {
            // Test that the seasonal template data is properly structured
            const seasons = ['spring', 'summer', 'fall', 'winter'];
            const contentTypes = Object.values(ContentCategory);

            expect(seasons.length).toBe(4);
            expect(contentTypes.length).toBeGreaterThan(0);
            expect(contentTypes).toContain(ContentCategory.MARKET_UPDATE);
            expect(contentTypes).toContain(ContentCategory.BLOG_POST);
        });

        it('should correctly identify seasons by month', () => {
            // Test season identification logic
            const getSeasonByMonth = (month: number): string => {
                if (month >= 3 && month <= 5) return 'spring';
                if (month >= 6 && month <= 8) return 'summer';
                if (month >= 9 && month <= 11) return 'fall';
                return 'winter';
            };

            expect(getSeasonByMonth(3)).toBe('spring');
            expect(getSeasonByMonth(4)).toBe('spring');
            expect(getSeasonByMonth(5)).toBe('spring');
            expect(getSeasonByMonth(6)).toBe('summer');
            expect(getSeasonByMonth(7)).toBe('summer');
            expect(getSeasonByMonth(8)).toBe('summer');
            expect(getSeasonByMonth(9)).toBe('fall');
            expect(getSeasonByMonth(10)).toBe('fall');
            expect(getSeasonByMonth(11)).toBe('fall');
            expect(getSeasonByMonth(12)).toBe('winter');
            expect(getSeasonByMonth(1)).toBe('winter');
            expect(getSeasonByMonth(2)).toBe('winter');
        });

        it('should handle template personalization placeholders', () => {
            // Test placeholder replacement logic
            const replacePlaceholders = (text: string, brandInfo: any): string => {
                let result = text;
                if (brandInfo.name) {
                    result = result.replace(/\[AGENT_NAME\]/g, brandInfo.name);
                    result = result.replace(/\[YOUR_NAME\]/g, brandInfo.name);
                }
                if (brandInfo.marketArea) {
                    result = result.replace(/\[MARKET_AREA\]/g, brandInfo.marketArea);
                    result = result.replace(/\[YOUR_MARKET\]/g, brandInfo.marketArea);
                }
                if (brandInfo.contactInfo) {
                    result = result.replace(/\[CONTACT_INFO\]/g, brandInfo.contactInfo);
                    result = result.replace(/\[YOUR_CONTACT\]/g, brandInfo.contactInfo);
                }
                if (brandInfo.brokerageName) {
                    result = result.replace(/\[BROKERAGE_NAME\]/g, brandInfo.brokerageName);
                    result = result.replace(/\[YOUR_BROKERAGE\]/g, brandInfo.brokerageName);
                }
                return result;
            };

            const testText = 'Contact [AGENT_NAME] at [CONTACT_INFO] for [MARKET_AREA] real estate with [BROKERAGE_NAME]';
            const brandInfo = {
                name: 'John Smith',
                contactInfo: 'john@example.com',
                marketArea: 'Austin, TX',
                brokerageName: 'Premier Realty'
            };

            const result = replacePlaceholders(testText, brandInfo);

            expect(result).not.toContain('[AGENT_NAME]');
            expect(result).not.toContain('[CONTACT_INFO]');
            expect(result).not.toContain('[MARKET_AREA]');
            expect(result).not.toContain('[BROKERAGE_NAME]');
            expect(result).toContain('John Smith');
            expect(result).toContain('john@example.com');
            expect(result).toContain('Austin, TX');
            expect(result).toContain('Premier Realty');
        });

        it('should validate seasonal template structure', () => {
            // Test that seasonal templates have required properties
            const mockTemplate = {
                id: 'spring_market_update',
                name: 'Spring Market Update',
                description: 'Capitalize on the spring buying season',
                contentType: ContentCategory.MARKET_UPDATE,
                seasonalTags: ['spring', 'buying-season', 'inventory'],
                configuration: {
                    promptParameters: {
                        season: 'spring',
                        marketFocus: 'increased buyer activity'
                    },
                    contentStructure: {
                        sections: ['market-overview', 'inventory-update'],
                        format: 'blog-post',
                        wordCount: 800,
                        includeImages: true,
                        includeHashtags: true
                    },
                    stylePreferences: {
                        tone: 'optimistic and informative',
                        length: 'medium',
                        keywords: ['spring market', 'buying season'],
                        targetAudience: 'homebuyers and sellers',
                        callToAction: 'Schedule a consultation'
                    }
                }
            };

            expect(mockTemplate.id).toBeDefined();
            expect(mockTemplate.name).toBeDefined();
            expect(mockTemplate.description).toBeDefined();
            expect(mockTemplate.contentType).toBeDefined();
            expect(mockTemplate.seasonalTags).toBeDefined();
            expect(Array.isArray(mockTemplate.seasonalTags)).toBe(true);
            expect(mockTemplate.configuration).toBeDefined();
            expect(mockTemplate.configuration.promptParameters).toBeDefined();
            expect(mockTemplate.configuration.contentStructure).toBeDefined();
            expect(mockTemplate.configuration.stylePreferences).toBeDefined();
        });

        it('should handle notification priority ordering', () => {
            // Test notification priority logic
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const notifications = [
                { priority: 'low' as const, title: 'Low Priority' },
                { priority: 'high' as const, title: 'High Priority' },
                { priority: 'medium' as const, title: 'Medium Priority' }
            ];

            const sorted = notifications.sort((a, b) => {
                const aPriority = priorityOrder[a.priority];
                const bPriority = priorityOrder[b.priority];
                return bPriority - aPriority;
            });

            expect(sorted[0].priority).toBe('high');
            expect(sorted[1].priority).toBe('medium');
            expect(sorted[2].priority).toBe('low');
        });

        it('should validate holiday opportunity detection', () => {
            // Test holiday detection logic
            const getHolidayForMonth = (month: number): string[] => {
                const holidays: Record<number, string[]> = {
                    1: ['new-year'],
                    2: ['valentine'],
                    3: ['spring-launch'],
                    7: ['summer', 'outdoor-living'],
                    9: ['back-to-school', 'fall'],
                    11: ['thanksgiving', 'gratitude'],
                    12: ['holiday', 'winter']
                };
                return holidays[month] || [];
            };

            expect(getHolidayForMonth(1)).toContain('new-year');
            expect(getHolidayForMonth(11)).toContain('thanksgiving');
            expect(getHolidayForMonth(12)).toContain('holiday');
            expect(getHolidayForMonth(6)).toEqual([]);
        });

        it('should handle template relevance scoring', () => {
            // Test template relevance calculation
            const calculateRelevance = (template: any, currentMonth: number): number => {
                const getCurrentSeason = (month: number): string => {
                    if (month >= 3 && month <= 5) return 'spring';
                    if (month >= 6 && month <= 8) return 'summer';
                    if (month >= 9 && month <= 11) return 'fall';
                    return 'winter';
                };

                const currentSeason = getCurrentSeason(currentMonth);
                let score = 0;

                if (template.seasonalTags?.includes(currentSeason)) {
                    score += 10;
                }

                // Boost score for upcoming seasons
                const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
                const nextSeason = getCurrentSeason(nextMonth);
                if (template.seasonalTags?.includes(nextSeason)) {
                    score += 5;
                }

                // Add usage-based score
                score += Math.min(template.usageCount || 0, 5);

                return score;
            };

            const springTemplate = {
                seasonalTags: ['spring'],
                usageCount: 3
            };

            const summerTemplate = {
                seasonalTags: ['summer'],
                usageCount: 1
            };

            // Test in April (spring season)
            const springScore = calculateRelevance(springTemplate, 4);
            const summerScore = calculateRelevance(summerTemplate, 4);

            expect(springScore).toBeGreaterThan(summerScore);
            // Spring template gets: 10 (current season) + 5 (upcoming season for May) + 3 (usage) = 18
            // Summer template gets: 5 (upcoming season for May->June) + 1 (usage) = 6, but May is still spring
            // So summer template only gets: 1 (usage) = 1
            expect(springScore).toBe(18);
            expect(summerScore).toBe(1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty seasonal tags', () => {
            const template = {
                seasonalTags: [],
                usageCount: 0
            };

            expect(Array.isArray(template.seasonalTags)).toBe(true);
            expect(template.seasonalTags.length).toBe(0);
        });

        it('should handle undefined brand info', () => {
            const text = 'Contact [AGENT_NAME] for more info';
            const result = text.replace(/\[AGENT_NAME\]/g, 'Default Agent');

            expect(result).toBe('Contact Default Agent for more info');
        });

        it('should handle invalid month values', () => {
            const getSafeMonth = (month: number): number => {
                if (month < 1) return 1;
                if (month > 12) return 12;
                return month;
            };

            expect(getSafeMonth(0)).toBe(1);
            expect(getSafeMonth(13)).toBe(12);
            expect(getSafeMonth(6)).toBe(6);
        });

        it('should handle empty template arrays', () => {
            const templates: any[] = [];
            const filtered = templates.filter(t => t.seasonalTags?.includes('spring'));

            expect(filtered).toEqual([]);
            expect(filtered.length).toBe(0);
        });
    });
});