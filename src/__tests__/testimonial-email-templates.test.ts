/**
 * Testimonial Email Templates Tests
 * 
 * Tests for testimonial email template generation
 */

import {
    generateTestimonialRequestEmail,
    generateTestimonialReminderEmail,
    generateTestimonialConfirmationEmail,
    generateTestimonialSubmittedNotification,
} from '@/lib/email-templates/testimonial-reminder';

describe('Testimonial Email Templates', () => {
    const mockData = {
        clientName: 'John Doe',
        agentName: 'Jane Smith',
        agencyName: 'Smith Realty',
        submissionLink: 'https://example.com/submit/abc123',
        expiresAt: '2024-12-31T23:59:59Z',
    };

    describe('generateTestimonialRequestEmail', () => {
        it('should generate email with all required fields', () => {
            const result = generateTestimonialRequestEmail(mockData);

            expect(result.subject).toBeTruthy();
            expect(result.html).toBeTruthy();
            expect(result.text).toBeTruthy();
        });

        it('should include client name in email', () => {
            const result = generateTestimonialRequestEmail(mockData);

            expect(result.html).toContain(mockData.clientName);
            expect(result.text).toContain(mockData.clientName);
        });

        it('should include submission link in email', () => {
            const result = generateTestimonialRequestEmail(mockData);

            expect(result.html).toContain(mockData.submissionLink);
            expect(result.text).toContain(mockData.submissionLink);
        });

        it('should include agent name in subject', () => {
            const result = generateTestimonialRequestEmail(mockData);

            expect(result.subject).toContain(mockData.agentName);
        });
    });

    describe('generateTestimonialReminderEmail', () => {
        it('should generate email with all required fields', () => {
            const result = generateTestimonialReminderEmail(mockData);

            expect(result.subject).toBeTruthy();
            expect(result.html).toBeTruthy();
            expect(result.text).toBeTruthy();
        });

        it('should include reminder context in subject', () => {
            const result = generateTestimonialReminderEmail(mockData);

            expect(result.subject.toLowerCase()).toContain('reminder');
        });

        it('should include submission link in email', () => {
            const result = generateTestimonialReminderEmail(mockData);

            expect(result.html).toContain(mockData.submissionLink);
            expect(result.text).toContain(mockData.submissionLink);
        });
    });

    describe('generateTestimonialConfirmationEmail', () => {
        const confirmationData = {
            clientName: 'John Doe',
            agentName: 'Jane Smith',
            agencyName: 'Smith Realty',
        };

        it('should generate email with all required fields', () => {
            const result = generateTestimonialConfirmationEmail(confirmationData);

            expect(result.subject).toBeTruthy();
            expect(result.html).toBeTruthy();
            expect(result.text).toBeTruthy();
        });

        it('should include thank you message', () => {
            const result = generateTestimonialConfirmationEmail(confirmationData);

            expect(result.subject.toLowerCase()).toContain('thank');
            expect(result.html.toLowerCase()).toContain('thank');
        });

        it('should include client name in email', () => {
            const result = generateTestimonialConfirmationEmail(confirmationData);

            expect(result.html).toContain(confirmationData.clientName);
            expect(result.text).toContain(confirmationData.clientName);
        });
    });

    describe('generateTestimonialSubmittedNotification', () => {
        const notificationData = {
            agentName: 'Jane Smith',
            agentEmail: 'jane@example.com',
            clientName: 'John Doe',
            testimonialText: 'Jane was amazing! She helped us find our dream home and made the process so smooth.',
            submittedAt: '2024-01-15T10:30:00Z',
            testimonialUrl: 'https://example.com/brand/testimonials',
        };

        it('should generate email with all required fields', () => {
            const result = generateTestimonialSubmittedNotification(notificationData);

            expect(result.subject).toBeTruthy();
            expect(result.html).toBeTruthy();
            expect(result.text).toBeTruthy();
        });

        it('should include client name in subject', () => {
            const result = generateTestimonialSubmittedNotification(notificationData);

            expect(result.subject).toContain(notificationData.clientName);
        });

        it('should include testimonial preview in email', () => {
            const result = generateTestimonialSubmittedNotification(notificationData);

            expect(result.html).toContain('Jane was amazing');
            expect(result.text).toContain('Jane was amazing');
        });

        it('should include testimonial URL when provided', () => {
            const result = generateTestimonialSubmittedNotification(notificationData);

            expect(result.html).toContain(notificationData.testimonialUrl);
        });

        it('should truncate long testimonials in preview', () => {
            const longTestimonial = 'A'.repeat(300);
            const result = generateTestimonialSubmittedNotification({
                ...notificationData,
                testimonialText: longTestimonial,
            });

            // Should be truncated to ~200 chars + "..."
            const htmlMatch = result.html.match(/"([A.]+)"/);
            expect(htmlMatch).toBeTruthy();
            if (htmlMatch) {
                expect(htmlMatch[1].length).toBeLessThan(210);
                expect(htmlMatch[1]).toContain('...');
            }
        });

        it('should work without testimonial URL', () => {
            const dataWithoutUrl = {
                ...notificationData,
                testimonialUrl: undefined,
            };
            const result = generateTestimonialSubmittedNotification(dataWithoutUrl);

            expect(result.subject).toBeTruthy();
            expect(result.html).toBeTruthy();
            expect(result.text).toBeTruthy();
        });
    });
});
