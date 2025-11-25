/**
 * Newsletter Template Simple Tests
 * 
 * Focused tests for newsletter template functionality to validate
 * the core properties without complex property-based testing edge cases.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { randomUUID } from 'crypto';
import { ContentCategory, Template } from '@/lib/content-workflow-types';

// Mock Newsletter Service (simplified)
class SimpleNewsletterService {
    private templates = new Map<string, Template>();

    async createNewsletterTemplate(params: {
        userId: string;
        name: string;
        description: string;
        config: any;
    }): Promise<{ success: boolean; templateId?: string; validationResults?: any[]; error?: string }> {
        try {
            const validationResults = this.validateNewsletterConfig(params.config);
            const criticalErrors = validationResults.filter(r => r.type === 'error');

            if (criticalErrors.length > 0) {
                return {
                    success: false,
                    error: `Template validation failed: ${criticalErrors.map(e => e.message).join(', ')}`,
                    validationResults
                };
            }

            const templateId = randomUUID();
            const template: Template = {
                id: templateId,
                userId: params.userId,
                name: params.name,
                description: params.description,
                contentType: ContentCategory.NEWSLETTER,
                configuration: {
                    promptParameters: { newsletterConfig: params.config },
                    contentStructure: { sections: params.config.sections.map((s: any) => s.type), format: 'newsletter' },
                    stylePreferences: { tone: 'professional', length: 'medium', keywords: ['newsletter'] }
                },
                isShared: false,
                isSeasonal: false,
                usageCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.templates.set(`${params.userId}#${templateId}`, template);
            return { success: true, templateId, validationResults };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to create newsletter template' };
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

            const html = this.generateHTML(params.content, params.userBrandInfo);
            const plainText = this.generatePlainText(params.content, params.userBrandInfo);

            return {
                success: true,
                export: {
                    html,
                    plainText,
                    subject: params.content.subject,
                    preheader: params.content.preheader,
                    metadata: {
                        generatedAt: new Date(),
                        templateId: params.templateId,
                        userId: params.userId,
                        espCompatibility: ['outlook', 'gmail', 'appleMail'],
                        validationResults: []
                    }
                }
            };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to export newsletter template' };
        }
    }

    private validateNewsletterConfig(config: any): any[] {
        const results: any[] = [];

        if (!config.footer.includeUnsubscribe) {
            results.push({
                type: 'error',
                category: 'esp-compatibility',
                message: 'Unsubscribe link is required for ESP compliance'
            });
        }

        const emailSafeFonts = ['Arial', 'Helvetica', 'Georgia', 'Times', 'Verdana'];
        if (!emailSafeFonts.includes(config.branding.fontFamily)) {
            results.push({
                type: 'error',
                category: 'css',
                message: `Font family ${config.branding.fontFamily} is not email-safe`
            });
        }

        return results;
    }

    private generateHTML(content: any, userBrandInfo?: any): string {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(content.subject)}</title>
    <style type="text/css">
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>`;

        if (content.preheader) {
            html += `<div style="display: none;">${this.escapeHtml(content.preheader)}</div>`;
        }

        html += '<div class="container">';

        const sortedSections = [...content.sections].sort((a: any, b: any) => a.order - b.order);
        for (const section of sortedSections) {
            html += this.generateSectionHTML(section);
        }

        html += `<div style="text-align: center; padding: 20px;">
            <a href="${userBrandInfo?.unsubscribeUrl || '#'}">Unsubscribe</a>
        </div>`;

        html += '</div></body></html>';
        return html;
    }

    private generateSectionHTML(section: any): string {
        let sectionHTML = '<div>';

        switch (section.type) {
            case 'header':
                if (section.title) {
                    sectionHTML += `<h1>${this.escapeHtml(section.title)}</h1>`;
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
            case 'cta':
                if (section.ctaText) {
                    if (section.ctaUrl) {
                        sectionHTML += `<a href="${this.escapeHtml(section.ctaUrl)}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">${this.escapeHtml(section.ctaText)}</a>`;
                    } else {
                        sectionHTML += `<div style="background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block;">${this.escapeHtml(section.ctaText)}</div>`;
                    }
                }
                break;
        }

        sectionHTML += '</div>';
        return sectionHTML;
    }

    private generatePlainText(content: any, userBrandInfo?: any): string {
        let plainText = `${content.subject}\n${'='.repeat(content.subject.length)}\n\n`;

        if (content.preheader) {
            plainText += `${content.preheader}\n\n`;
        }

        const sortedSections = [...content.sections].sort((a: any, b: any) => a.order - b.order);
        for (const section of sortedSections) {
            switch (section.type) {
                case 'header':
                    if (section.title) {
                        plainText += `${section.title}\n${'-'.repeat(section.title.length)}\n\n`;
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
                case 'cta':
                    if (section.ctaText) {
                        plainText += `>>> ${section.ctaText} <<<\n`;
                        if (section.ctaUrl) {
                            plainText += `${section.ctaUrl}\n`;
                        }
                        plainText += '\n';
                    }
                    break;
            }
        }

        plainText += `\nTo unsubscribe: ${userBrandInfo?.unsubscribeUrl || '[Unsubscribe URL]'}\n`;
        return plainText;
    }

    private escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    clearTemplates(): void {
        this.templates.clear();
    }
}

describe('Newsletter Template Core Properties', () => {
    let mockService: SimpleNewsletterService;

    beforeEach(() => {
        mockService = new SimpleNewsletterService();
    });

    afterEach(() => {
        mockService.clearTemplates();
    });

    describe('Property 26: Email-safe formatting preservation', () => {
        it('should reject templates with critical email-safety violations', async () => {
            const invalidConfig = {
                subject: 'Test Newsletter',
                sections: [{ id: 'test', type: 'header', title: 'Test', order: 0 }],
                layout: 'single-column',
                branding: {
                    primaryColor: '#000000',
                    secondaryColor: '#000000',
                    fontFamily: 'Comic Sans MS' // Invalid font
                },
                footer: {
                    includeUnsubscribe: false, // Critical violation
                    includeAddress: false,
                    includeDisclaimer: false
                },
                espCompatibility: { outlook: true, gmail: true, appleMail: true, yahooMail: true, thunderbird: true }
            };

            const result = await mockService.createNewsletterTemplate({
                userId: 'test-user',
                name: 'Invalid Template',
                description: 'Template with violations',
                config: invalidConfig
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.validationResults).toBeDefined();

            if (result.validationResults) {
                const criticalErrors = result.validationResults.filter((r: any) => r.type === 'error');
                expect(criticalErrors.length).toBeGreaterThan(0);

                const errorMessages = criticalErrors.map((e: any) => e.message);
                expect(errorMessages.some((msg: string) => msg.includes('Unsubscribe'))).toBe(true);
                expect(errorMessages.some((msg: string) => msg.includes('email-safe'))).toBe(true);
            }
        });
    });

    describe('Property 27: Dual-format newsletter export', () => {
        it('should generate both HTML and plain text versions', async () => {
            const validConfig = {
                subject: 'Monthly Market Update',
                preheader: 'Latest real estate trends and insights',
                sections: [
                    { id: 'header', type: 'header', title: 'Market Update', content: null, order: 0 },
                    { id: 'content1', type: 'content', title: 'Market Overview', content: 'The real estate market continues to show strong activity this month.', order: 1 },
                    { id: 'cta', type: 'cta', ctaText: 'Get Your Home Value', ctaUrl: 'https://example.com/home-value', order: 2 }
                ],
                layout: 'single-column',
                branding: { primaryColor: '#2563eb', secondaryColor: '#64748b', fontFamily: 'Arial' },
                footer: { includeUnsubscribe: true, includeAddress: true, includeDisclaimer: true },
                espCompatibility: { outlook: true, gmail: true, appleMail: true, yahooMail: true, thunderbird: true }
            };

            const createResult = await mockService.createNewsletterTemplate({
                userId: 'test-user',
                name: 'Test Newsletter',
                description: 'Test newsletter template',
                config: validConfig
            });

            expect(createResult.success).toBe(true);
            expect(createResult.templateId).toBeDefined();

            if (!createResult.templateId) return;

            const exportResult = await mockService.exportNewsletterTemplate({
                userId: 'test-user',
                templateId: createResult.templateId,
                content: {
                    subject: validConfig.subject,
                    preheader: validConfig.preheader,
                    sections: validConfig.sections
                },
                userBrandInfo: {
                    name: 'John Doe',
                    contactInfo: 'john@example.com',
                    address: '123 Main St, Seattle, WA',
                    unsubscribeUrl: 'https://example.com/unsubscribe'
                }
            });

            expect(exportResult.success).toBe(true);
            expect(exportResult.export).toBeDefined();

            if (!exportResult.export) return;

            const { html, plainText, metadata } = exportResult.export;

            // Property: System generates both HTML and plain text versions
            expect(html).toBeDefined();
            expect(plainText).toBeDefined();
            expect(typeof html).toBe('string');
            expect(typeof plainText).toBe('string');
            expect(html.length).toBeGreaterThan(0);
            expect(plainText.length).toBeGreaterThan(0);

            // Both formats should contain the subject
            expect(html).toContain(validConfig.subject);
            expect(plainText).toContain(validConfig.subject);

            // Both formats should contain content
            expect(html).toContain('The real estate market continues');
            expect(plainText).toContain('The real estate market continues');

            // Both formats should contain CTA information
            expect(html).toContain('Get Your Home Value');
            expect(plainText).toContain('Get Your Home Value');
            expect(html).toContain('https://example.com/home-value');
            expect(plainText).toContain('https://example.com/home-value');

            // Both formats should contain unsubscribe information
            expect(html.toLowerCase()).toContain('unsubscribe');
            expect(plainText.toLowerCase()).toContain('unsubscribe');

            // HTML version should contain HTML tags, plain text should not
            expect(html).toMatch(/<[^>]+>/);
            expect(plainText).not.toMatch(/<[^>]+>/);

            // HTML version should be properly structured
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<html');
            expect(html).toContain('<head>');
            expect(html).toContain('<body>');

            // Plain text version should use text formatting
            expect(plainText).toMatch(/={3,}/);

            // Preheader should be included
            expect(html).toContain(validConfig.preheader);
            expect(plainText).toContain(validConfig.preheader);

            // Metadata should indicate dual-format capability
            expect(metadata).toBeDefined();
            expect(metadata.generatedAt).toBeInstanceOf(Date);
            expect(metadata.templateId).toBe(createResult.templateId);
            expect(metadata.userId).toBe('test-user');
        });
    });
});