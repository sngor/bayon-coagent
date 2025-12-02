/**
 * Integration test for open house follow-up generation
 * 
 * This test verifies that the Bedrock flow correctly generates follow-up content
 * with appropriate tone matching for different interest levels.
 * 
 * Feature: open-house-enhancement
 */

import { describe, it, expect } from '@jest/globals';
import { generateOpenHouseFollowUp } from '../generate-open-house-followup';
import type { GenerateOpenHouseFollowUpInput } from '../generate-open-house-followup';

describe('Open House Follow-up Generation', () => {
    // Base input that can be modified for different test cases
    const baseInput: GenerateOpenHouseFollowUpInput = {
        visitor: {
            visitorId: 'vis_test_123',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '555-1234',
            interestLevel: 'high',
            notes: 'Very interested in the backyard and school district',
            checkInTime: new Date().toISOString(),
        },
        session: {
            sessionId: 'sess_test_456',
            propertyAddress: '123 Main Street, Anytown, CA 12345',
            scheduledDate: new Date().toISOString().split('T')[0],
            actualStartTime: new Date(Date.now() - 3600000).toISOString(),
            actualEndTime: new Date().toISOString(),
            totalVisitors: 15,
            highInterestCount: 3,
        },
        property: {
            address: '123 Main Street, Anytown, CA 12345',
            price: '$750,000',
            bedrooms: 4,
            bathrooms: 3,
            squareFeet: 2500,
            features: ['Large backyard', 'Updated kitchen', 'Near top-rated schools'],
        },
        agent: {
            name: 'Sarah Smith',
            email: 'sarah.smith@realty.com',
            phone: '555-9876',
            brokerage: 'Premier Realty Group',
        },
        userId: 'user_test_789',
    };

    describe('Basic functionality', () => {
        it('should generate complete follow-up content for high interest visitor', async () => {
            const input = { ...baseInput, visitor: { ...baseInput.visitor, interestLevel: 'high' as const } };

            const output = await generateOpenHouseFollowUp(input);

            // Validate all required fields are present (Requirement 3.1)
            expect(output.emailSubject).toBeDefined();
            expect(output.emailBody).toBeDefined();
            expect(output.nextSteps).toBeDefined();
            expect(output.urgencyLevel).toBeDefined();
            expect(output.followUpTiming).toBeDefined();
            expect(output.personalizedTouchPoints).toBeDefined();
            expect(output.callToAction).toBeDefined();

            // Validate field constraints
            expect(output.emailSubject.length).toBeGreaterThanOrEqual(10);
            expect(output.emailSubject.length).toBeLessThanOrEqual(100);
            expect(output.emailBody.length).toBeGreaterThanOrEqual(200);
            expect(output.emailBody.length).toBeLessThanOrEqual(2000);
            expect(output.nextSteps.length).toBeGreaterThanOrEqual(3);
            expect(output.nextSteps.length).toBeLessThanOrEqual(5);
            expect(output.personalizedTouchPoints.length).toBeGreaterThanOrEqual(2);
            expect(output.personalizedTouchPoints.length).toBeLessThanOrEqual(4);

            // Validate SMS message if present
            if (output.smsMessage) {
                expect(output.smsMessage.length).toBeLessThanOrEqual(160);
            }

            // Validate urgency matches interest level (Requirement 3.3)
            expect(output.urgencyLevel).toBe('high');
        }, 60000); // 60 second timeout for API call

        it('should generate appropriate content for medium interest visitor', async () => {
            const input = { ...baseInput, visitor: { ...baseInput.visitor, interestLevel: 'medium' as const } };

            const output = await generateOpenHouseFollowUp(input);

            // Validate required fields
            expect(output.emailSubject).toBeDefined();
            expect(output.emailBody).toBeDefined();
            expect(output.nextSteps).toBeDefined();

            // Validate urgency matches interest level (Requirement 3.4)
            expect(output.urgencyLevel).toBe('medium');
        }, 60000);

        it('should generate appropriate content for low interest visitor', async () => {
            const input = { ...baseInput, visitor: { ...baseInput.visitor, interestLevel: 'low' as const } };

            const output = await generateOpenHouseFollowUp(input);

            // Validate required fields
            expect(output.emailSubject).toBeDefined();
            expect(output.emailBody).toBeDefined();
            expect(output.nextSteps).toBeDefined();

            // Validate urgency matches interest level (Requirement 3.5)
            expect(output.urgencyLevel).toBe('low');
        }, 60000);
    });

    describe('Input validation', () => {
        it('should reject empty visitor name', async () => {
            const input = { ...baseInput, visitor: { ...baseInput.visitor, name: '' } };

            await expect(generateOpenHouseFollowUp(input)).rejects.toThrow('Visitor name is required');
        });

        it('should reject empty visitor email', async () => {
            const input = { ...baseInput, visitor: { ...baseInput.visitor, email: '' } };

            await expect(generateOpenHouseFollowUp(input)).rejects.toThrow('Visitor email is required');
        });

        it('should reject invalid interest level', async () => {
            const input = { ...baseInput, visitor: { ...baseInput.visitor, interestLevel: 'invalid' as any } };

            await expect(generateOpenHouseFollowUp(input)).rejects.toThrow('Invalid interest level');
        });

        it('should reject empty property address', async () => {
            const input = { ...baseInput, property: { ...baseInput.property, address: '' } };

            await expect(generateOpenHouseFollowUp(input)).rejects.toThrow('Property address is required');
        });

        it('should reject incomplete agent information', async () => {
            const input = { ...baseInput, agent: { ...baseInput.agent, name: '' } };

            await expect(generateOpenHouseFollowUp(input)).rejects.toThrow('Complete agent information');
        });
    });

    describe('Content validation', () => {
        it('should include property address in email subject or body', async () => {
            const output = await generateOpenHouseFollowUp(baseInput);

            const propertyAddress = baseInput.property.address;
            const addressInSubject = output.emailSubject.includes('123 Main') || output.emailSubject.includes('Main Street');
            const addressInBody = output.emailBody.includes(propertyAddress) || output.emailBody.includes('123 Main');

            expect(addressInSubject || addressInBody).toBe(true);
        }, 60000);

        it('should include agent contact information in email body', async () => {
            const output = await generateOpenHouseFollowUp(baseInput);

            const hasAgentName = output.emailBody.includes(baseInput.agent.name);
            const hasAgentEmail = output.emailBody.includes(baseInput.agent.email);
            const hasAgentPhone = output.emailBody.includes(baseInput.agent.phone);

            // At least agent name should be present (Requirement 3.2)
            expect(hasAgentName).toBe(true);
        }, 60000);

        it('should reference visitor notes in personalized touch points', async () => {
            const input = {
                ...baseInput,
                visitor: {
                    ...baseInput.visitor,
                    notes: 'Asked about the school district and commute times',
                },
            };

            const output = await generateOpenHouseFollowUp(input);

            // Touch points should reference the notes
            const touchPointsText = output.personalizedTouchPoints.join(' ').toLowerCase();
            const hasSchoolReference = touchPointsText.includes('school');
            const hasCommuteReference = touchPointsText.includes('commute');

            // At least one reference should be present
            expect(hasSchoolReference || hasCommuteReference).toBe(true);
        }, 60000);
    });
});
