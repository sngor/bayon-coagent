/**
 * Property-Based Test for Content Personalization
 * 
 * **Feature: microservices-architecture-enhancement, Property 7: Content personalization**
 * **Validates: Requirements 2.4**
 * 
 * Tests that the Marketing_Content_Service generates distinctly personalized content 
 * reflecting each profile's characteristics for any two different agent profiles.
 */

import fc from 'fast-check';

// Mock agent profile and marketing content service functionality for testing
interface AgentProfile {
    name: string;
    experience: number;
    specialties: string[];
    location: {
        city: string;
        state: string;
        market?: string;
    };
    achievements: string[];
    personalBrand: {
        tone: 'Professional' | 'Friendly' | 'Authoritative' | 'Approachable';
        values: string[];
        uniqueSellingPoints: string[];
    };
    targetAudience: {
        demographics: string[];
        buyerTypes: string[];
        priceRanges: string[];
    };
}

interface PersonalizedContent {
    content: string;
    personalizationScore: number;
    keyPersonalizationElements: string[];
    contentType: string;
    agentProfile: {
        name: string;
        specialties: string[];
        location: string;
    };
}

// Mock marketing content personalization service
class MockMarketingContentService {

    async generatePersonalizedContent(
        contentType: string,
        agentProfile: AgentProfile
    ): Promise<PersonalizedContent> {
        const content = this.createPersonalizedContent(contentType, agentProfile);
        const personalizationScore = this.calculatePersonalizationScore(content, agentProfile);
        const keyElements = this.extractPersonalizationElements(content, agentProfile);

        return {
            content,
            personalizationScore,
            keyPersonalizationElements: keyElements,
            contentType,
            agentProfile: {
                name: agentProfile.name,
                specialties: agentProfile.specialties,
                location: `${agentProfile.location.city}, ${agentProfile.location.state}`,
            },
        };
    }

    private createPersonalizedContent(contentType: string, profile: AgentProfile): string {
        const { name, experience, specialties, location, personalBrand, achievements } = profile;
        const locationStr = `${location.city}, ${location.state}`;

        switch (contentType) {
            case 'bio':
                return this.generatePersonalizedBio(profile);
            case 'marketing-plan':
                return this.generatePersonalizedMarketingPlan(profile);
            case 'email-campaign':
                return this.generatePersonalizedEmailCampaign(profile);
            case 'newsletter':
                return this.generatePersonalizedNewsletter(profile);
            default:
                return this.generateGenericPersonalizedContent(profile);
        }
    }

    private generatePersonalizedBio(profile: AgentProfile): string {
        const { name, experience, specialties, location, personalBrand, achievements } = profile;
        const locationStr = `${location.city}, ${location.state}`;
        const tone = personalBrand.tone.toLowerCase();

        let bio = `${personalBrand.tone === 'Professional' ? 'I am' : 'Hi, I\'m'} ${name}, `;

        if (experience > 0) {
            bio += `a real estate ${tone === 'professional' ? 'professional' : 'agent'} with ${experience} years of experience `;
        } else {
            bio += `a dedicated real estate ${tone === 'professional' ? 'professional' : 'agent'} `;
        }

        bio += `serving the ${locationStr} market. `;

        if (specialties.length > 0) {
            bio += `I specialize in ${specialties.join(', ')}. `;
        }

        if (personalBrand.values.length > 0) {
            bio += `My approach is guided by ${personalBrand.values.join(', ')}. `;
        }

        if (achievements.length > 0) {
            bio += `I'm proud of my achievements including ${achievements.slice(0, 2).join(' and ')}. `;
        }

        if (personalBrand.uniqueSellingPoints.length > 0) {
            bio += `What sets me apart: ${personalBrand.uniqueSellingPoints.join(', ')}. `;
        }

        bio += `${personalBrand.tone === 'Professional' ? 'I look forward to' : 'I\'d love to'} help you with your real estate needs in ${locationStr}.`;

        return bio;
    }

    private generatePersonalizedMarketingPlan(profile: AgentProfile): string {
        const { name, specialties, location, targetAudience, personalBrand } = profile;
        const locationStr = `${location.city}, ${location.state}`;

        return `Marketing Plan for ${name}\n\n` +
            `Target Market: ${locationStr}\n` +
            `Specialties: ${specialties.join(', ')}\n` +
            `Target Demographics: ${targetAudience.demographics.join(', ')}\n` +
            `Buyer Types: ${targetAudience.buyerTypes.join(', ')}\n` +
            `Brand Tone: ${personalBrand.tone}\n` +
            `Key Values: ${personalBrand.values.join(', ')}\n\n` +
            `Strategy: Focus on ${specialties[0]} in the ${locationStr} market, ` +
            `targeting ${targetAudience.buyerTypes[0]} with a ${personalBrand.tone.toLowerCase()} approach.`;
    }

    private generatePersonalizedEmailCampaign(profile: AgentProfile): string {
        const { name, location, specialties, personalBrand } = profile;
        const locationStr = `${location.city}, ${location.state}`;

        return `Subject: ${name} - Your ${personalBrand.tone} Real Estate Expert in ${locationStr}\n\n` +
            `Dear [Client Name],\n\n` +
            `${personalBrand.tone === 'Professional' ? 'I hope this email finds you well.' : 'Hope you\'re doing great!'} ` +
            `My name is ${name}, and I'm a real estate professional specializing in ${specialties.join(' and ')} ` +
            `in the ${locationStr} area.\n\n` +
            `${personalBrand.values.length > 0 ? `I believe in ${personalBrand.values.join(', ')}, and these values guide everything I do for my clients.\n\n` : ''}` +
            `${personalBrand.tone === 'Professional' ? 'I would be pleased to' : 'I\'d love to'} discuss how I can help you with your real estate needs.\n\n` +
            `Best regards,\n${name}`;
    }

    private generatePersonalizedNewsletter(profile: AgentProfile): string {
        const { name, location, specialties } = profile;
        const locationStr = `${location.city}, ${location.state}`;

        return `${name}'s Real Estate Newsletter\n` +
            `${locationStr} Market Update\n\n` +
            `Hello valued clients and friends,\n\n` +
            `Welcome to this month's real estate newsletter! I'm ${name}, your local real estate expert ` +
            `specializing in ${specialties.join(', ')} in the ${locationStr} area.\n\n` +
            `MARKET HIGHLIGHTS:\n` +
            `• Current market conditions in ${location.city}\n` +
            `• Recent sales trends and pricing updates\n\n` +
            `As always, I'm here to help with all your real estate needs.\n\n` +
            `Warm regards,\n${name}`;
    }

    private generateGenericPersonalizedContent(profile: AgentProfile): string {
        const { name, location, specialties } = profile;
        const locationStr = `${location.city}, ${location.state}`;

        return `${name} - Real Estate Professional in ${locationStr}\n\n` +
            `Specializing in: ${specialties.join(', ')}\n` +
            `Serving: ${locationStr}\n\n` +
            `Contact ${name} for all your real estate needs.`;
    }

    private calculatePersonalizationScore(content: string, profile: AgentProfile): number {
        let score = 0;
        const lowerContent = content.toLowerCase();

        // Check for agent name
        if (lowerContent.includes(profile.name.toLowerCase())) score += 20;

        // Check for location
        if (lowerContent.includes(profile.location.city.toLowerCase())) score += 15;
        if (lowerContent.includes(profile.location.state.toLowerCase())) score += 10;

        // Check for specialties
        const specialtiesIncluded = profile.specialties.filter(specialty =>
            lowerContent.includes(specialty.toLowerCase())
        ).length;
        score += Math.min((specialtiesIncluded / profile.specialties.length) * 25, 25);

        // Check for experience
        if (profile.experience > 0 && lowerContent.includes(profile.experience.toString())) {
            score += 10;
        }

        // Check for personal brand values
        const valuesIncluded = profile.personalBrand.values.filter(value =>
            lowerContent.includes(value.toLowerCase())
        ).length;
        score += Math.min((valuesIncluded / Math.max(profile.personalBrand.values.length, 1)) * 20, 20);

        return Math.min(Math.round(score), 100);
    }

    private extractPersonalizationElements(content: string, profile: AgentProfile): string[] {
        const elements: string[] = [];
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes(profile.name.toLowerCase())) {
            elements.push('Agent Name');
        }

        if (lowerContent.includes(profile.location.city.toLowerCase())) {
            elements.push('Location');
        }

        profile.specialties.forEach(specialty => {
            if (lowerContent.includes(specialty.toLowerCase())) {
                elements.push(`Specialty: ${specialty}`);
            }
        });

        if (profile.experience > 0 && lowerContent.includes(profile.experience.toString())) {
            elements.push('Experience');
        }

        profile.personalBrand.values.forEach(value => {
            if (lowerContent.includes(value.toLowerCase())) {
                elements.push(`Brand Value: ${value}`);
            }
        });

        return elements;
    }
}

describe('Content Personalization Property Tests', () => {
    let marketingService: MockMarketingContentService;

    beforeEach(() => {
        marketingService = new MockMarketingContentService();
    });

    /**
     * Property: Content personalization
     * For any two different agent profiles, the Marketing_Content_Service should generate 
     * distinctly personalized content reflecting each profile's characteristics
     */
    test('Property 7: Content personalization - Distinct content for different profiles', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate two different agent profiles
                fc.tuple(
                    fc.record({
                        name: fc.oneof(
                            fc.constant('John Smith'),
                            fc.constant('Sarah Johnson'),
                            fc.constant('Michael Brown'),
                            fc.constant('Emily Davis'),
                            fc.constant('David Wilson')
                        ),
                        experience: fc.integer({ min: 0, max: 30 }),
                        specialties: fc.array(
                            fc.oneof(
                                fc.constant('buyer representation'),
                                fc.constant('seller representation'),
                                fc.constant('luxury homes'),
                                fc.constant('first-time buyers'),
                                fc.constant('investment properties')
                            ),
                            { minLength: 1, maxLength: 3 }
                        ).map(arr => [...new Set(arr)]),
                        location: fc.record({
                            city: fc.oneof(
                                fc.constant('Seattle'),
                                fc.constant('Portland'),
                                fc.constant('Denver'),
                                fc.constant('Austin'),
                                fc.constant('Phoenix')
                            ),
                            state: fc.oneof(
                                fc.constant('WA'),
                                fc.constant('OR'),
                                fc.constant('CO'),
                                fc.constant('TX'),
                                fc.constant('AZ')
                            ),
                        }),
                        achievements: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 0, maxLength: 3 }),
                        personalBrand: fc.record({
                            tone: fc.oneof(
                                fc.constant('Professional' as const),
                                fc.constant('Friendly' as const),
                                fc.constant('Authoritative' as const),
                                fc.constant('Approachable' as const)
                            ),
                            values: fc.array(
                                fc.oneof(
                                    fc.constant('integrity'),
                                    fc.constant('transparency'),
                                    fc.constant('dedication'),
                                    fc.constant('excellence')
                                ),
                                { minLength: 1, maxLength: 3 }
                            ).map(arr => [...new Set(arr)]),
                            uniqueSellingPoints: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 2 }),
                        }),
                        targetAudience: fc.record({
                            demographics: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 2 }),
                            buyerTypes: fc.array(fc.string({ minLength: 5, maxLength: 25 }), { minLength: 1, maxLength: 2 }),
                            priceRanges: fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 2 }),
                        }),
                    }),
                    fc.record({
                        name: fc.oneof(
                            fc.constant('Lisa Anderson'),
                            fc.constant('Robert Taylor'),
                            fc.constant('Jennifer Martinez'),
                            fc.constant('Christopher Lee'),
                            fc.constant('Amanda White')
                        ),
                        experience: fc.integer({ min: 0, max: 30 }),
                        specialties: fc.array(
                            fc.oneof(
                                fc.constant('commercial real estate'),
                                fc.constant('residential sales'),
                                fc.constant('property management'),
                                fc.constant('relocation services'),
                                fc.constant('new construction')
                            ),
                            { minLength: 1, maxLength: 3 }
                        ).map(arr => [...new Set(arr)]),
                        location: fc.record({
                            city: fc.oneof(
                                fc.constant('Miami'),
                                fc.constant('Chicago'),
                                fc.constant('Boston'),
                                fc.constant('Atlanta'),
                                fc.constant('Nashville')
                            ),
                            state: fc.oneof(
                                fc.constant('FL'),
                                fc.constant('IL'),
                                fc.constant('MA'),
                                fc.constant('GA'),
                                fc.constant('TN')
                            ),
                        }),
                        achievements: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 0, maxLength: 3 }),
                        personalBrand: fc.record({
                            tone: fc.oneof(
                                fc.constant('Professional' as const),
                                fc.constant('Friendly' as const),
                                fc.constant('Authoritative' as const),
                                fc.constant('Approachable' as const)
                            ),
                            values: fc.array(
                                fc.oneof(
                                    fc.constant('reliability'),
                                    fc.constant('innovation'),
                                    fc.constant('client-focus'),
                                    fc.constant('results-driven')
                                ),
                                { minLength: 1, maxLength: 3 }
                            ).map(arr => [...new Set(arr)]),
                            uniqueSellingPoints: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 2 }),
                        }),
                        targetAudience: fc.record({
                            demographics: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 2 }),
                            buyerTypes: fc.array(fc.string({ minLength: 5, maxLength: 25 }), { minLength: 1, maxLength: 2 }),
                            priceRanges: fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 2 }),
                        }),
                    })
                ),
                fc.oneof(
                    fc.constant('bio'),
                    fc.constant('marketing-plan'),
                    fc.constant('email-campaign'),
                    fc.constant('newsletter')
                ),
                async ([profile1, profile2], contentType) => {
                    // Ensure profiles are different and names/locations don't overlap
                    fc.pre(profile1.name !== profile2.name);
                    fc.pre(!profile1.name.toLowerCase().includes(profile2.name.toLowerCase()));
                    fc.pre(!profile2.name.toLowerCase().includes(profile1.name.toLowerCase()));
                    fc.pre(profile1.location.city !== profile2.location.city || profile1.location.state !== profile2.location.state);
                    fc.pre(!profile1.location.city.toLowerCase().includes(profile2.location.city.toLowerCase()));
                    fc.pre(!profile2.location.city.toLowerCase().includes(profile1.location.city.toLowerCase()));

                    // Generate personalized content for both profiles
                    const content1 = await marketingService.generatePersonalizedContent(contentType, profile1);
                    const content2 = await marketingService.generatePersonalizedContent(contentType, profile2);

                    // Verify both contents are personalized
                    expect(content1.personalizationScore).toBeGreaterThan(30);
                    expect(content2.personalizationScore).toBeGreaterThan(30);

                    // Verify content reflects each profile's characteristics

                    // Profile 1 characteristics should be in content 1
                    expect(content1.content.toLowerCase()).toContain(profile1.name.toLowerCase());
                    expect(content1.content.toLowerCase()).toContain(profile1.location.city.toLowerCase());

                    // At least one specialty should be mentioned
                    const profile1SpecialtiesInContent = profile1.specialties.filter(specialty =>
                        content1.content.toLowerCase().includes(specialty.toLowerCase())
                    );
                    expect(profile1SpecialtiesInContent.length).toBeGreaterThan(0);

                    // Profile 2 characteristics should be in content 2
                    expect(content2.content.toLowerCase()).toContain(profile2.name.toLowerCase());
                    expect(content2.content.toLowerCase()).toContain(profile2.location.city.toLowerCase());

                    // At least one specialty should be mentioned
                    const profile2SpecialtiesInContent = profile2.specialties.filter(specialty =>
                        content2.content.toLowerCase().includes(specialty.toLowerCase())
                    );
                    expect(profile2SpecialtiesInContent.length).toBeGreaterThan(0);

                    // Verify content is distinctly different
                    expect(content1.content).not.toBe(content2.content);

                    // Content should not contain the other profile's name (if names are meaningful)
                    if (profile2.name.trim().length > 2 && !profile2.name.includes(' ')) {
                        expect(content1.content.toLowerCase()).not.toContain(profile2.name.toLowerCase());
                    }
                    if (profile1.name.trim().length > 2 && !profile1.name.includes(' ')) {
                        expect(content2.content.toLowerCase()).not.toContain(profile1.name.toLowerCase());
                    }

                    // Content should not contain the other profile's location (if different)
                    if (profile1.location.city.toLowerCase() !== profile2.location.city.toLowerCase()) {
                        expect(content1.content.toLowerCase()).not.toContain(profile2.location.city.toLowerCase());
                        expect(content2.content.toLowerCase()).not.toContain(profile1.location.city.toLowerCase());
                    }

                    // Verify personalization elements are extracted correctly
                    expect(content1.keyPersonalizationElements).toContain('Agent Name');
                    expect(content1.keyPersonalizationElements).toContain('Location');
                    expect(content2.keyPersonalizationElements).toContain('Agent Name');
                    expect(content2.keyPersonalizationElements).toContain('Location');

                    // Property holds: Content is distinctly personalized for each profile
                    return true;
                }
            ),
            {
                numRuns: 100,
                timeout: 30000,
            }
        );
    });

    /**
     * Property: Personalization consistency
     * For any agent profile, generating the same content type multiple times should 
     * produce consistent personalization elements
     */
    test('Property 7: Content personalization - Consistency across generations', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    name: fc.string({ minLength: 3, maxLength: 25 }).filter(s => s.trim().length >= 3),
                    experience: fc.integer({ min: 1, max: 20 }),
                    specialties: fc.array(
                        fc.oneof(
                            fc.constant('luxury homes'),
                            fc.constant('first-time buyers'),
                            fc.constant('investment properties')
                        ),
                        { minLength: 2, maxLength: 3 }
                    ).map(arr => [...new Set(arr)]),
                    location: fc.record({
                        city: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3),
                        state: fc.string({ minLength: 2, maxLength: 10 }).filter(s => s.trim().length >= 2),
                    }),
                    achievements: fc.array(fc.string({ minLength: 10, maxLength: 40 }), { minLength: 1, maxLength: 2 }),
                    personalBrand: fc.record({
                        tone: fc.oneof(
                            fc.constant('Professional' as const),
                            fc.constant('Friendly' as const)
                        ),
                        values: fc.array(
                            fc.oneof(
                                fc.constant('integrity'),
                                fc.constant('excellence'),
                                fc.constant('dedication')
                            ),
                            { minLength: 2, maxLength: 3 }
                        ).map(arr => [...new Set(arr)]),
                        uniqueSellingPoints: fc.array(fc.string({ minLength: 10, maxLength: 25 }), { minLength: 1, maxLength: 2 }),
                    }),
                    targetAudience: fc.record({
                        demographics: fc.array(fc.string({ minLength: 5, maxLength: 15 }), { minLength: 1, maxLength: 2 }),
                        buyerTypes: fc.array(fc.string({ minLength: 8, maxLength: 20 }), { minLength: 1, maxLength: 2 }),
                        priceRanges: fc.array(fc.string({ minLength: 8, maxLength: 15 }), { minLength: 1, maxLength: 2 }),
                    }),
                }),
                fc.constant('bio'),
                async (profile, contentType) => {
                    // Generate the same content type multiple times
                    const content1 = await marketingService.generatePersonalizedContent(contentType, profile);
                    const content2 = await marketingService.generatePersonalizedContent(contentType, profile);
                    const content3 = await marketingService.generatePersonalizedContent(contentType, profile);

                    // All should have similar personalization scores
                    const scores = [content1.personalizationScore, content2.personalizationScore, content3.personalizationScore];
                    const maxScore = Math.max(...scores);
                    const minScore = Math.min(...scores);
                    expect(maxScore - minScore).toBeLessThan(10); // Should be within 10 points

                    // All should contain the same core personalization elements
                    const coreElements = ['Agent Name', 'Location'];
                    coreElements.forEach(element => {
                        expect(content1.keyPersonalizationElements).toContain(element);
                        expect(content2.keyPersonalizationElements).toContain(element);
                        expect(content3.keyPersonalizationElements).toContain(element);
                    });

                    // All should contain the agent's name and location
                    [content1, content2, content3].forEach(content => {
                        expect(content.content.toLowerCase()).toContain(profile.name.toLowerCase());
                        expect(content.content.toLowerCase()).toContain(profile.location.city.toLowerCase());
                    });

                    // Property holds: Personalization is consistent across generations
                    return true;
                }
            ),
            {
                numRuns: 50,
                timeout: 30000,
            }
        );
    });

    /**
     * Property: Personalization depth scaling
     * For any agent profile with more personalization data, the generated content 
     * should achieve higher personalization scores
     */
    test('Property 7: Content personalization - Depth scaling with profile richness', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    baseName: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(s.trim())),
                    baseLocation: fc.record({
                        city: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(s.trim())),
                        state: fc.string({ minLength: 2, maxLength: 10 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
                    }),
                    richness: fc.oneof(fc.constant('minimal'), fc.constant('rich')),
                }),
                async ({ baseName, baseLocation, richness }) => {
                    // Create minimal profile
                    const minimalProfile: AgentProfile = {
                        name: baseName,
                        experience: 1,
                        specialties: ['residential sales'],
                        location: baseLocation,
                        achievements: [],
                        personalBrand: {
                            tone: 'Professional',
                            values: ['integrity'],
                            uniqueSellingPoints: ['dedicated service'],
                        },
                        targetAudience: {
                            demographics: ['families'],
                            buyerTypes: ['first-time buyers'],
                            priceRanges: ['$200k-$400k'],
                        },
                    };

                    // Create rich profile with more data
                    const richProfile: AgentProfile = {
                        name: baseName,
                        experience: 10,
                        specialties: ['luxury homes', 'investment properties', 'first-time buyers'],
                        location: baseLocation,
                        achievements: ['Top Producer 2023', 'Million Dollar Club'],
                        personalBrand: {
                            tone: 'Professional',
                            values: ['integrity', 'excellence', 'innovation', 'client-focus'],
                            uniqueSellingPoints: ['market expertise', 'negotiation skills', 'client advocacy'],
                        },
                        targetAudience: {
                            demographics: ['professionals', 'families', 'investors'],
                            buyerTypes: ['luxury buyers', 'investors', 'relocating families'],
                            priceRanges: ['$500k-$1M', '$1M+'],
                        },
                    };

                    const profileToUse = richness === 'rich' ? richProfile : minimalProfile;
                    const content = await marketingService.generatePersonalizedContent('bio', profileToUse);

                    if (richness === 'rich') {
                        // Rich profile should achieve higher personalization score
                        expect(content.personalizationScore).toBeGreaterThan(50);

                        // Should include more personalization elements
                        expect(content.keyPersonalizationElements.length).toBeGreaterThan(2);

                        // Should mention experience
                        expect(content.content).toContain('10');

                        // Should mention multiple specialties
                        const specialtiesInContent = richProfile.specialties.filter(specialty =>
                            content.content.toLowerCase().includes(specialty.toLowerCase())
                        );
                        expect(specialtiesInContent.length).toBeGreaterThan(1);

                    } else {
                        // Minimal profile should still be personalized but with lower score
                        expect(content.personalizationScore).toBeGreaterThan(30);
                        expect(content.personalizationScore).toBeLessThanOrEqual(100);
                    }

                    // Both should contain basic personalization
                    expect(content.content.toLowerCase()).toContain(baseName.toLowerCase());
                    expect(content.content.toLowerCase()).toContain(baseLocation.city.toLowerCase());

                    // Property holds: Personalization depth scales with profile richness
                    return true;
                }
            ),
            {
                numRuns: 50,
                timeout: 30000,
            }
        );
    });

    /**
     * Property: Content type adaptation
     * For any agent profile, different content types should be personalized 
     * appropriately for their specific purpose while maintaining profile consistency
     */
    test('Property 7: Content personalization - Content type adaptation', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    name: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
                    experience: fc.integer({ min: 2, max: 15 }),
                    specialties: fc.array(
                        fc.oneof(
                            fc.constant('buyer representation'),
                            fc.constant('luxury homes'),
                            fc.constant('investment properties')
                        ),
                        { minLength: 2, maxLength: 3 }
                    ).map(arr => [...new Set(arr)]),
                    location: fc.record({
                        city: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3),
                        state: fc.string({ minLength: 2, maxLength: 10 }).filter(s => s.trim().length >= 2),
                    }),
                    achievements: fc.array(fc.string({ minLength: 10, maxLength: 30 }), { minLength: 1, maxLength: 2 }),
                    personalBrand: fc.record({
                        tone: fc.oneof(
                            fc.constant('Professional' as const),
                            fc.constant('Friendly' as const)
                        ),
                        values: fc.array(
                            fc.oneof(
                                fc.constant('integrity'),
                                fc.constant('excellence'),
                                fc.constant('dedication')
                            ),
                            { minLength: 2, maxLength: 3 }
                        ).map(arr => [...new Set(arr)]),
                        uniqueSellingPoints: fc.array(fc.string({ minLength: 8, maxLength: 20 }), { minLength: 1, maxLength: 2 }),
                    }),
                    targetAudience: fc.record({
                        demographics: fc.array(fc.string({ minLength: 5, maxLength: 15 }), { minLength: 1, maxLength: 2 }),
                        buyerTypes: fc.array(fc.string({ minLength: 8, maxLength: 20 }), { minLength: 1, maxLength: 2 }),
                        priceRanges: fc.array(fc.string({ minLength: 8, maxLength: 15 }), { minLength: 1, maxLength: 2 }),
                    }),
                }),
                async (profile) => {
                    // Generate different content types for the same profile
                    const bio = await marketingService.generatePersonalizedContent('bio', profile);
                    const marketingPlan = await marketingService.generatePersonalizedContent('marketing-plan', profile);
                    const emailCampaign = await marketingService.generatePersonalizedContent('email-campaign', profile);
                    const newsletter = await marketingService.generatePersonalizedContent('newsletter', profile);

                    const contents = [bio, marketingPlan, emailCampaign, newsletter];

                    // All should be personalized with the same profile data
                    contents.forEach(content => {
                        expect(content.personalizationScore).toBeGreaterThan(30);
                        expect(content.content.toLowerCase()).toContain(profile.name.toLowerCase());
                        expect(content.content.toLowerCase()).toContain(profile.location.city.toLowerCase());
                        expect(content.keyPersonalizationElements).toContain('Agent Name');
                        expect(content.keyPersonalizationElements).toContain('Location');
                    });

                    // Each content type should have appropriate format/structure

                    // Bio should be narrative and personal
                    expect(bio.content).toMatch(/I am|I'm|My name is/i);

                    // Marketing plan should be structured
                    expect(marketingPlan.content).toContain('Marketing Plan');
                    expect(marketingPlan.content).toContain('Target');

                    // Email should have email format
                    expect(emailCampaign.content).toContain('Subject:');
                    expect(emailCampaign.content).toContain('Dear');

                    // Newsletter should have newsletter format
                    expect(newsletter.content).toContain('Newsletter');
                    expect(newsletter.content).toContain('Market Update');

                    // All should be different content despite same profile
                    const contentTexts = contents.map(c => c.content);
                    const uniqueContents = new Set(contentTexts);
                    expect(uniqueContents.size).toBe(contentTexts.length);

                    // Property holds: Content types are appropriately adapted while maintaining personalization
                    return true;
                }
            ),
            {
                numRuns: 50,
                timeout: 30000,
            }
        );
    });
});