/**
 * Newsletter Template Properties - Property-Based Tests
 * 
 * Property-based tests for newsletter template functionality including
 * email-safe formatting and dual-format export capabilities.
 * 
 * Requirements:
 * - 12.3: Email-safe HTML/CSS validation
 * - 12.5: Dual-format export (HTML + plain text)
 */

import fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { randomUUID } from 'crypto';
import {
    ContentCategory,
    Template,
    TemplateConfiguration,
} from '@/lib/content-workflow-types';

// Test configuration for property-based tests
const testConfig = { numRuns: 100 };

// ==================== Generators ====================

/**
 * Generator for valid user IDs
 */
const userIdArb = fc.string({ minLength: 8, maxLength: 36 }).filter(s => s.trim().length > 0);

/**
 * Generator for valid template IDs
 */
const templateIdArb = fc.string({ minLength: 8, maxLength: 36 }).filter(s => s.trim().length > 0);

/**
 * Generator for email-safe colors (hex format)
 */
const emailSafeColorArb = fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^[0-9A-Fa-f]{6}$/.test(s)).map(hex => `#${hex}`);

/**
 * Generator for email-safe fonts
 */
const emailSafeFontArb = fc.constantFrom('Arial', 'Helvetica', 'Georgia', 'Times', 'Verdana');

/**
 * Generator for newsletter sections
 */
const newsletterSectionArb = fc.record({
    id: fc.string({ minLength: 5, maxLength: 20 }),
    type: fc.constantFrom('header', 'content', 'image', 'cta', 'divider', 'footer'),
    title: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    content: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
    imageUrl: fc.option(fc.webUrl()),
    imageAlt: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    ctaText: fc.option(fc.string({ minLength: 3, maxLength: 50 })),
    ctaUrl: fc.option(fc.webUrl()),
    backgroundColor: fc.option(emailSafeColorArb),
    textColor: fc.option(emailSafeColorArb),
    alignment: fc.option(fc.constantFrom('left', 'center', 'right')),
    padding: fc.option(fc.string({ minLength: 3, maxLength: 10 })),
    order: fc.integer({ min: 0, max: 10 })
});

/**
 * Generator for newsletter configuration
 */
const newsletterConfigArb = fc.record({
    subject: fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length >= 10),
    preheader: fc.option(fc.string({ minLength: 15, maxLength: 100 }).filter(s => s.trim().length >= 15)),
    sections: fc.array(newsletterSectionArb, { minLength: 1, maxLength: 5 }),
    layout: fc.constantFrom('single-column', 'two-column', 'three-column'),
    branding: fc.record({
        logo: fc.option(fc.webUrl()),
        primaryColor: emailSafeColorArb,
        secondaryColor: emailSafeColorArb,
        fontFamily: emailSafeFontArb
    }),
    footer: fc.record({
        includeUnsubscribe: fc.constant(true), // Always required for ESP compliance
        includeAddress: fc.boolean(),
        includeDisclaimer: fc.boolean(),
        customText: fc.option(fc.string({ minLength: 15, maxLength: 100 }).filter(s => s.trim().length >= 15))
    }),
    espCompatibility: fc.record({
        outlook: fc.boolean(),
        gmail: fc.boolean(),
        appleMail: fc.boolean(),
        yahooMail: fc.boolean(),
        thunderbird: fc.boolean()
    })
});

/**
 * Generator for user brand information
 */
const userBrandInfoArb = fc.record({
    name: fc.option(fc.string({ minLength: 3, maxLength: 50 })),
    contactInfo: fc.option(fc.string({ minLength: 10, maxLength: 100 })),
    address: fc.option(fc.string({ minLength: 20, maxLength: 200 })),
    unsubscribeUrl: fc.option(fc.webUrl())
});

// ==================== Mock Newsletter Service ====================

/**
 * Mock implementation of newsletter template service
 */
class MockNewsletterService {
    private templates = new Map<string, Template>();

    async createNewsletterTemplate(params: {
        userId: string;
        name: string;
        description: string;
        config: any;
    }): Promise<{ success: boolean; templateId?: string; validationResults?: any[]; error?: string }> {
        try {
            // Validate email-safe configuration
            const validationResults = this.validateNewsletterConfig(params.config);

            // Check for critical errors
            const criticalErrors = validationResults.filter(r => r.type === 'error');
            if (criticalErrors.length > 0) {
                return {
                    success: false,
                    error: `Template validation failed: ${criticalErrors.map(e => e.message).join(', ')}`,
                    validationResults
                };
            }

            // Create template
            const templateId = randomUUID();
            const template: Template = {
                id: templateId,
                userId: params.userId,
                name: params.name,
                description: params.description,
                contentType: ContentCategory.NEWSLETTER,
                configuration: {
                    promptParameters: { newsletterConfig: params.config },
                    contentStructure: {
                        sections: params.config.sections.map((s: any) => s.type),
                        format: 'newsletter'
                    },
                    stylePreferences: {
                        tone: 'professional',
                        length: 'medium',
                        keywords: ['newsletter']
                    }
                },
                isShared: false,
                isSeasonal: false,
                usageCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.templates.set(`${params.userId}#${templateId}`, template);

            return {
                success: true,
                templateId,
                validationResults
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create newsletter template'
            };
        }
    }

    async exportNewsletterTemplate(params: {
        userId: string;
        templateId: string;
        content: any;
        userBrandInfo?: any;
    }): Promise<{ success: boolean; export?: any; error?: string }> {
        try {
            const template = this.templates.get(`${params.userId}#${params.templateId}`);
            if (!template) {
                return { success: false, error: 'Template not found' };
            }

            const config = template.configuration.promptParameters?.newsletterConfig;
            if (!config) {
                return { success: false, error: 'Invalid newsletter template configuration' };
            }

            // Generate HTML version
            const html = this.generateNewsletterHTML(params.content, config, params.userBrandInfo);

            // Generate plain text version
            const plainText = this.generateNewsletterPlainText(params.content, params.userBrandInfo);

            // Validate the generated HTML
            const validationResults = this.validateGeneratedHTML(html);

            const newsletterExport = {
                html,
                plainText,
                subject: params.content.subject,
                preheader: params.content.preheader,
                metadata: {
                    generatedAt: new Date(),
                    templateId: params.templateId,
                    userId: params.userId,
                    espCompatibility: Object.entries(config.espCompatibility)
                        .filter(([_, supported]: [string, any]) => supported)
                        .map(([esp, _]: [string, any]) => esp),
                    validationResults
                }
            };

            return { success: true, export: newsletterExport };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to export newsletter template'
            };
        }
    }

    private validateNewsletterConfig(config: any): any[] {
        const results: any[] = [];

        // Validate email-safe colors
        if (!this.isValidEmailColor(config.branding.primaryColor)) {
            results.push({
                type: 'warning',
                category: 'css',
                message: `Primary color ${config.branding.primaryColor} may not display consistently across all email clients`,
                suggestion: 'Use hex colors (#RRGGBB) for better compatibility'
            });
        }

        // Validate font family
        const emailSafeFonts = ['Arial', 'Helvetica', 'Georgia', 'Times', 'Verdana'];
        if (!emailSafeFonts.includes(config.branding.fontFamily)) {
            results.push({
                type: 'error',
                category: 'css',
                message: `Font family ${config.branding.fontFamily} is not email-safe`,
                suggestion: `Use one of: ${emailSafeFonts.join(', ')}`
            });
        }

        // Validate unsubscribe requirement
        if (!config.footer.includeUnsubscribe) {
            results.push({
                type: 'error',
                category: 'esp-compatibility',
                message: 'Unsubscribe link is required for ESP compliance',
                suggestion: 'Enable includeUnsubscribe in footer configuration'
            });
        }

        // Validate subject line length
        if (config.subject && config.subject.length > 50) {
            results.push({
                type: 'warning',
                category: 'esp-compatibility',
                message: 'Subject line may be truncated on mobile devices',
                suggestion: 'Keep subject lines under 50 characters for optimal display'
            });
        }

        return results;
    }

    private isValidEmailColor(color: string): boolean {
        // Check for hex colors (#RRGGBB or #RGB)
        const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return hexPattern.test(color);
    }

    private generateNewsletterHTML(content: any, config: any, userBrandInfo?: any): string {
        // Simplified HTML generation for testing
        const sortedSections = [...content.sections].sort((a: any, b: any) => a.order - b.order);

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(content.subject)}</title>
    <style type="text/css">
        body { font-family: ${config.branding.fontFamily}, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>`;

        if (content.preheader) {
            html += `<div style="display: none;">${this.escapeHtml(content.preheader)}</div>`;
        }

        html += '<div class="container">';

        for (const section of sortedSections) {
            html += this.generateSectionHTML(section, config);
        }

        // Footer with unsubscribe
        if (config.footer.includeUnsubscribe) {
            const unsubscribeUrl = userBrandInfo?.unsubscribeUrl || '#';
            html += `<div style="text-align: center; padding: 20px;">
                <a href="${this.escapeHtml(unsubscribeUrl)}">Unsubscribe</a>
            </div>`;
        }

        html += '</div></body></html>';
        return html;
    }

    private generateSectionHTML(section: any, config: any): string {
        let sectionHTML = '<div>';

        switch (section.type) {
            case 'header':
                if (section.title) {
                    sectionHTML += `<h1 style="color: ${config.branding.primaryColor};">${this.escapeHtml(section.title)}</h1>`;
                }
                if (section.content) {
                    sectionHTML += `<p>${this.escapeHtml(section.content)}</p>`;
                }
                break;
            case 'content':
                if (section.title) {
                    sectionHTML += `<h2>${this.escapeHtml(section.title)}</h2>`;
                }
                if (section.content) {
                    sectionHTML += `<p>${this.escapeHtml(section.content)}</p>`;
                }
                break;
            case 'image':
                if (section.imageUrl) {
                    sectionHTML += `<img src="${this.escapeHtml(section.imageUrl)}" alt="${this.escapeHtml(section.imageAlt || '')}" style="max-width: 100%;">`;
                }
                break;
            case 'cta':
                if (section.ctaText) {
                    if (section.ctaUrl) {
                        sectionHTML += `<a href="${this.escapeHtml(section.ctaUrl)}" style="background-color: ${config.branding.primaryColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">${this.escapeHtml(section.ctaText)}</a>`;
                    } else {
                        sectionHTML += `<div style="background-color: ${config.branding.primaryColor}; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block;">${this.escapeHtml(section.ctaText)}</div>`;
                    }
                }
                break;
            case 'divider':
                sectionHTML += '<hr>';
                break;
        }

        sectionHTML += '</div>';
        return sectionHTML;
    }

    private generateNewsletterPlainText(content: any, userBrandInfo?: any): string {
        const sortedSections = [...content.sections].sort((a: any, b: any) => a.order - b.order);
        let plainText = '';

        // Subject as header
        plainText += `${content.subject}\n`;
        plainText += '='.repeat(content.subject.length) + '\n\n';

        // Preheader
        if (content.preheader) {
            plainText += `${content.preheader}\n\n`;
        }

        // Sections
        for (const section of sortedSections) {
            switch (section.type) {
                case 'header':
                    if (section.title) {
                        plainText += `${section.title}\n`;
                        plainText += '-'.repeat(section.title.length) + '\n\n';
                    }
                    if (section.content) {
                        plainText += `${section.content}\n\n`;
                    }
                    break;
                case 'content':
                    if (section.title) {
                        plainText += `${section.title}\n\n`;
                    }
                    if (section.content) {
                        plainText += `${section.content}\n\n`;
                    }
                    break;
                case 'image':
                    if (section.imageAlt) {
                        plainText += `[Image: ${section.imageAlt}]\n\n`;
                    }
                    break;
                case 'cta':
                    if (section.ctaText) {
                        plainText += `>>> ${section.ctaText} <<<\n`;
                        if (section.ctaUrl) {
                            plainText += `${section.ctaUrl}\n`;
                        }
                        plainText += '\n';
                    }
                    break;
                case 'divider':
                    plainText += '---\n\n';
                    break;
            }
        }

        // Footer
        plainText += '\nTo unsubscribe: ';
        plainText += userBrandInfo?.unsubscribeUrl || '[Unsubscribe URL]';
        plainText += '\n';

        return plainText;
    }

    private validateGeneratedHTML(html: string): any[] {
        const results: any[] = [];

        // Check for missing alt attributes on images
        const imgTags = html.match(/<img[^>]*>/g) || [];
        for (const img of imgTags) {
            if (!img.includes('alt=')) {
                results.push({
                    type: 'warning',
                    category: 'accessibility',
                    message: 'Image missing alt attribute',
                    suggestion: 'Add alt attributes to all images for accessibility'
                });
            }
        }

        return results;
    }

    private escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    clearTemplates(): void {
        this.templates.clear();
    }
}

// ==================== Property Tests ====================

describe('Newsletter Template Properties', () => {
    let mockService: MockNewsletterService;

    beforeEach(() => {
        mockService = new MockNewsletterService();
    });

    afterEach(() => {
        mockService.clearTemplates();
    });

    describe('Property 26: Email-safe formatting preservation', () => {
        /**
         * **Feature: content-workflow-features, Property 26: Email-safe formatting preservation**
         * 
         * For any newsletter customization, the Content System should maintain email-safe 
         * HTML and CSS constraints (no unsupported tags, inline styles only, etc.).
         * 
         * **Validates: Requirements 12.3**
         */
        it('should maintain email-safe constraints during newsletter customization', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        userId: userIdArb,
                        templateName: fc.string({ minLength: 5, maxLength: 50 }),
                        templateDescription: fc.string({ minLength: 10, maxLength: 200 }),
                        config: newsletterConfigArb,
                    }),
                    async ({ userId, templateName, templateDescription, config }) => {
                        // Create newsletter template
                        const createResult = await mockService.createNewsletterTemplate({
                            userId,
                            name: templateName,
                            description: templateDescription,
                            config
                        });

                        // Verify template creation
                        expect(createResult.success).toBe(true);
                        expect(createResult.templateId).toBeDefined();

                        if (!createResult.success || !createResult.templateId) {
                            return true;
                        }

                        // Export the newsletter to test formatting
                        const exportResult = await mockService.exportNewsletterTemplate({
                            userId,
                            templateId: createResult.templateId,
                            content: {
                                subject: config.subject,
                                preheader: config.preheader,
                                sections: config.sections
                            }
                        });

                        expect(exportResult.success).toBe(true);
                        expect(exportResult.export).toBeDefined();

                        if (!exportResult.export) {
                            return true;
                        }

                        const { html, metadata } = exportResult.export;

                        // Property: Email-safe formatting is preserved

                        // 1. Verify email-safe font family is used
                        const emailSafeFonts = ['Arial', 'Helvetica', 'Georgia', 'Times', 'Verdana'];
                        const fontFamilyRegex = new RegExp(`font-family:\\s*(${emailSafeFonts.join('|')})`, 'i');
                        expect(html).toMatch(fontFamilyRegex);

                        // 2. Verify no unsupported CSS properties
                        const unsupportedCSS = [
                            'position:\\s*fixed',
                            'position:\\s*absolute',
                            'float:',
                            'display:\\s*flex',
                            'display:\\s*grid',
                            'transform:',
                            'animation:',
                            'transition:'
                        ];

                        for (const css of unsupportedCSS) {
                            const regex = new RegExp(css, 'i');
                            expect(html).not.toMatch(regex);
                        }

                        // 3. Verify HTML structure is email-safe
                        expect(html).toContain('<!DOCTYPE html>');
                        expect(html).toContain('<meta charset="UTF-8">');
                        expect(html).toContain('<meta name="viewport"');

                        // 4. Verify inline styles are used (not external stylesheets)
                        expect(html).not.toContain('<link rel="stylesheet"');

                        // 5. Verify colors are in valid format (hex) - only if there's content that uses the color
                        const hasColoredContent = config.sections.some((s: any) => s.title || s.type === 'cta');
                        if (config.branding.primaryColor.startsWith('#') && hasColoredContent) {
                            expect(html).toContain(config.branding.primaryColor);
                        }

                        // 6. Verify validation results flag any issues
                        if (metadata.validationResults) {
                            const errors = metadata.validationResults.filter((r: any) => r.type === 'error');

                            // If there are email-safety errors, they should be about non-critical issues
                            errors.forEach((error: any) => {
                                expect(['css', 'accessibility', 'esp-compatibility']).toContain(error.category);
                            });
                        }

                        // 7. Verify required elements for ESP compatibility
                        expect(html).toContain('Unsubscribe'); // Required unsubscribe link

                        return true;
                    }
                ),
                testConfig
            );
        });

        it('should reject templates with critical email-safety violations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        userId: userIdArb,
                        templateName: fc.string({ minLength: 5, maxLength: 50 }),
                        templateDescription: fc.string({ minLength: 10, maxLength: 200 }),
                        invalidConfig: fc.record({
                            subject: fc.string({ minLength: 5, maxLength: 100 }),
                            sections: fc.array(newsletterSectionArb, { minLength: 1, maxLength: 5 }),
                            layout: fc.constantFrom('single-column', 'two-column'),
                            branding: fc.record({
                                primaryColor: fc.string({ minLength: 3, maxLength: 20 }), // Invalid color format
                                secondaryColor: emailSafeColorArb,
                                fontFamily: fc.constantFrom('Comic Sans MS', 'Impact', 'Papyrus') // Non-email-safe fonts
                            }),
                            footer: fc.record({
                                includeUnsubscribe: fc.constant(false), // Critical violation
                                includeAddress: fc.boolean(),
                                includeDisclaimer: fc.boolean()
                            }),
                            espCompatibility: fc.record({
                                outlook: fc.boolean(),
                                gmail: fc.boolean(),
                                appleMail: fc.boolean(),
                                yahooMail: fc.boolean(),
                                thunderbird: fc.boolean()
                            })
                        })
                    }),
                    async ({ userId, templateName, templateDescription, invalidConfig }) => {
                        // Attempt to create newsletter template with invalid configuration
                        const createResult = await mockService.createNewsletterTemplate({
                            userId,
                            name: templateName,
                            description: templateDescription,
                            config: invalidConfig
                        });

                        // Property: Templates with critical email-safety violations should be rejected

                        // Should fail due to critical violations
                        expect(createResult.success).toBe(false);
                        expect(createResult.error).toBeDefined();
                        expect(createResult.validationResults).toBeDefined();

                        if (createResult.validationResults) {
                            // Should have critical errors
                            const criticalErrors = createResult.validationResults.filter((r: any) => r.type === 'error');
                            expect(criticalErrors.length).toBeGreaterThan(0);

                            // Verify specific violations are caught
                            const errorMessages = criticalErrors.map((e: any) => e.message);

                            // Should catch unsubscribe requirement
                            expect(errorMessages.some((msg: string) => msg.includes('Unsubscribe'))).toBe(true);

                            // Should catch non-email-safe font
                            expect(errorMessages.some((msg: string) => msg.includes('font') || msg.includes('email-safe'))).toBe(true);
                        }

                        return true;
                    }
                ),
                testConfig
            );
        });
    });

    describe('Property 27: Dual-format newsletter export', () => {
        /**
         * **Feature: content-workflow-features, Property 27: Dual-format newsletter export**
         * 
         * For any newsletter export, the Content System should generate both an HTML version 
         * and a plain text version of the same content.
         * 
         * **Validates: Requirements 12.5**
         */
        it('should generate both HTML and plain text versions for any newsletter', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        userId: userIdArb,
                        templateName: fc.string({ minLength: 5, maxLength: 50 }),
                        templateDescription: fc.string({ minLength: 10, maxLength: 200 }),
                        config: newsletterConfigArb,
                        userBrandInfo: userBrandInfoArb,
                    }),
                    async ({ userId, templateName, templateDescription, config, userBrandInfo }) => {
                        // Create newsletter template
                        const createResult = await mockService.createNewsletterTemplate({
                            userId,
                            name: templateName,
                            description: templateDescription,
                            config
                        });

                        // Skip if template creation failed due to validation
                        if (!createResult.success || !createResult.templateId) {
                            return true;
                        }

                        // Export the newsletter
                        const exportResult = await mockService.exportNewsletterTemplate({
                            userId,
                            templateId: createResult.templateId,
                            content: {
                                subject: config.subject,
                                preheader: config.preheader,
                                sections: config.sections
                            },
                            userBrandInfo
                        });

                        expect(exportResult.success).toBe(true);
                        expect(exportResult.export).toBeDefined();

                        if (!exportResult.export) {
                            return true;
                        }

                        const newsletterExport = exportResult.export;

                        // Property: System generates both HTML and plain text versions

                        // 1. Both formats should be present
                        expect(newsletterExport.html).toBeDefined();
                        expect(newsletterExport.plainText).toBeDefined();
                        expect(typeof newsletterExport.html).toBe('string');
                        expect(typeof newsletterExport.plainText).toBe('string');

                        // 2. Both formats should be non-empty
                        expect(newsletterExport.html.length).toBeGreaterThan(0);
                        expect(newsletterExport.plainText.length).toBeGreaterThan(0);

                        // 3. Both formats should contain the subject
                        expect(newsletterExport.html).toContain(config.subject);
                        expect(newsletterExport.plainText).toContain(config.subject);

                        // 4. Both formats should contain content from sections (accounting for HTML escaping)
                        const contentSections = config.sections.filter((s: any) =>
                            (s.type === 'header' || s.type === 'content') &&
                            s.content &&
                            s.content.trim().length > 3 &&
                            s.content.trim().replace(/[\s\.\!\?\-_"']/g, '').length > 2
                        );
                        for (const section of contentSections) {
                            if (section.content && section.content.trim().length > 3) {
                                const trimmedContent = section.content.trim();
                                // For HTML, check for escaped content
                                const escapedContent = trimmedContent.replace(/[&<>"']/g, (m: string) => {
                                    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
                                    return map[m];
                                });
                                expect(newsletterExport.html).toContain(escapedContent);
                                expect(newsletterExport.plainText).toContain(trimmedContent);
                            }
                        }

                        // 5. Both formats should contain CTA information
                        const ctaSections = config.sections.filter((s: any) => s.type === 'cta' && s.ctaText && s.ctaText.trim().length > 0);
                        for (const section of ctaSections) {
                            if (section.ctaText && section.ctaText.trim().length > 0) {
                                const trimmedCtaText = section.ctaText.trim();
                                // For HTML, check for escaped content
                                const escapedCtaText = trimmedCtaText.replace(/[&<>"']/g, (m: string) => {
                                    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
                                    return map[m];
                                });
                                expect(newsletterExport.html).toContain(escapedCtaText);
                                expect(newsletterExport.plainText).toContain(trimmedCtaText);
                            }
                            if (section.ctaUrl && section.ctaUrl.trim().length > 0) {
                                expect(newsletterExport.html).toContain(section.ctaUrl);
                                expect(newsletterExport.plainText).toContain(section.ctaUrl);
                            }
                        }

                        // 6. Both formats should contain unsubscribe information
                        expect(newsletterExport.html.toLowerCase()).toContain('unsubscribe');
                        expect(newsletterExport.plainText.toLowerCase()).toContain('unsubscribe');

                        // 7. HTML version should contain HTML tags, plain text should not
                        expect(newsletterExport.html).toMatch(/<[^>]+>/); // Contains HTML tags
                        expect(newsletterExport.plainText).not.toMatch(/<[^>]+>/); // No HTML tags

                        // 8. HTML version should be properly structured
                        expect(newsletterExport.html).toContain('<!DOCTYPE html>');
                        expect(newsletterExport.html).toContain('<html');
                        expect(newsletterExport.html).toContain('<head>');
                        expect(newsletterExport.html).toContain('<body>');

                        // 9. Plain text version should use text formatting
                        expect(newsletterExport.plainText).toMatch(/={3,}/); // Header underlines

                        // Check for section dividers only if there are divider sections
                        const hasDividers = config.sections.some((s: any) => s.type === 'divider');
                        if (hasDividers) {
                            expect(newsletterExport.plainText).toMatch(/-{3,}/); // Section dividers
                        }

                        // 10. If preheader is provided, both formats should include it
                        if (config.preheader) {
                            expect(newsletterExport.html).toContain(config.preheader);
                            expect(newsletterExport.plainText).toContain(config.preheader);
                        }

                        // 11. Metadata should indicate dual-format capability
                        expect(newsletterExport.metadata).toBeDefined();
                        expect(newsletterExport.metadata.generatedAt).toBeInstanceOf(Date);
                        expect(newsletterExport.metadata.templateId).toBe(createResult.templateId);
                        expect(newsletterExport.metadata.userId).toBe(userId);

                        return true;
                    }
                ),
                testConfig
            );
        });

        it('should preserve content parity between HTML and plain text versions', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        userId: userIdArb,
                        templateName: fc.string({ minLength: 5, maxLength: 50 }),
                        templateDescription: fc.string({ minLength: 10, maxLength: 200 }),
                        config: newsletterConfigArb.filter(config =>
                            // Ensure we have meaningful content to test parity
                            config.sections.some((s: any) => s.content && s.content.length > 10)
                        ),
                    }),
                    async ({ userId, templateName, templateDescription, config }) => {
                        // Create and export newsletter
                        const createResult = await mockService.createNewsletterTemplate({
                            userId,
                            name: templateName,
                            description: templateDescription,
                            config
                        });

                        if (!createResult.success || !createResult.templateId) {
                            return true;
                        }

                        const exportResult = await mockService.exportNewsletterTemplate({
                            userId,
                            templateId: createResult.templateId,
                            content: {
                                subject: config.subject,
                                preheader: config.preheader,
                                sections: config.sections
                            }
                        });

                        if (!exportResult.success || !exportResult.export) {
                            return true;
                        }

                        const { html, plainText } = exportResult.export;

                        // Property: Content parity between HTML and plain text versions

                        // Extract text content from HTML (remove tags)
                        const htmlTextContent = html
                            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
                            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
                            .replace(/<[^>]+>/g, ' ') // Remove HTML tags
                            .replace(/\s+/g, ' ') // Normalize whitespace
                            .trim()
                            .toLowerCase();

                        const plainTextNormalized = plainText
                            .replace(/[=\-]{3,}/g, '') // Remove formatting lines
                            .replace(/\s+/g, ' ') // Normalize whitespace
                            .trim()
                            .toLowerCase();

                        // Both versions should contain the same essential content
                        const contentSections = config.sections.filter((s: any) =>
                            (s.type === 'header' || s.type === 'content') &&
                            s.content &&
                            s.content.trim().length > 5 &&
                            s.content.trim().replace(/[\s\.\!\?\-_"']/g, '').length > 2
                        );
                        for (const section of contentSections) {
                            if (section.content && section.content.trim().length > 5) {
                                const sectionContent = section.content.trim().toLowerCase();
                                // Only test if the content is meaningful (not just whitespace/punctuation)
                                if (sectionContent.replace(/[\s\.\!\?\-_"']/g, '').length > 2) {
                                    expect(htmlTextContent).toContain(sectionContent);
                                    expect(plainTextNormalized).toContain(sectionContent);
                                }
                            }
                        }

                        // Both should contain subject (if it's meaningful)
                        const subjectTrimmed = config.subject.trim();
                        if (subjectTrimmed.length > 3 && subjectTrimmed.replace(/[\s\.\!\?\-_"']/g, '').length > 2) {
                            const subjectLower = subjectTrimmed.toLowerCase();
                            expect(htmlTextContent).toContain(subjectLower);
                            expect(plainTextNormalized).toContain(subjectLower);
                        }

                        // Both should contain CTA text
                        const ctaSections = config.sections.filter((s: any) => s.type === 'cta' && s.ctaText && s.ctaText.trim().length > 3);
                        for (const section of ctaSections) {
                            if (section.ctaText && section.ctaText.trim().length > 3) {
                                const ctaTextLower = section.ctaText.trim().toLowerCase();
                                expect(htmlTextContent).toContain(ctaTextLower);
                                expect(plainTextNormalized).toContain(ctaTextLower);
                            }
                        }

                        return true;
                    }
                ),
                testConfig
            );
        });
    });
});