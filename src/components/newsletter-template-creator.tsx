'use client';

/**
 * Newsletter Template Creator Component
 * 
 * Provides a user interface for creating and managing newsletter templates
 * with email-safe validation and ESP compatibility testing.
 * 
 * Requirements:
 * - 12.1: Newsletter-specific templates with responsive design
 * - 12.2: Email-safe HTML/CSS validation
 * - 12.3: ESP compatibility testing
 * - 12.4, 12.5: Dual-format export
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    createNewsletterTemplateAction,
    exportNewsletterTemplateAction,
    testESPCompatibilityAction,
    validateSpamScoreAction
} from '@/app/content-workflow-actions';
import type { NewsletterTemplateConfig, NewsletterSection } from '@/services/template-service';

interface ValidationResult {
    type: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    suggestion?: string;
}

export function NewsletterTemplateCreator() {
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [config, setConfig] = useState<NewsletterTemplateConfig>({
        subject: '',
        preheader: '',
        sections: [],
        layout: 'single-column',
        branding: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            fontFamily: 'Arial'
        },
        footer: {
            includeUnsubscribe: true,
            includeAddress: true,
            includeDisclaimer: true
        },
        espCompatibility: {
            outlook: true,
            gmail: true,
            appleMail: true,
            yahooMail: true,
            thunderbird: true
        }
    });
    const [sections, setSections] = useState<NewsletterSection[]>([]);
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [exportResult, setExportResult] = useState<any>(null);
    const [espResults, setEspResults] = useState<any[]>([]);

    const addSection = (type: NewsletterSection['type']) => {
        const newSection: NewsletterSection = {
            id: `section_${Date.now()}`,
            type,
            title: '',
            content: '',
            order: sections.length + 1,
            alignment: 'left'
        };
        setSections([...sections, newSection]);
    };

    const updateSection = (id: string, updates: Partial<NewsletterSection>) => {
        setSections(sections.map(section =>
            section.id === id ? { ...section, ...updates } : section
        ));
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(section => section.id !== id));
    };

    const handleCreateTemplate = async () => {
        setIsCreating(true);
        try {
            const formData = new FormData();
            formData.append('name', templateName);
            formData.append('description', templateDescription);
            formData.append('config', JSON.stringify({
                ...config,
                sections
            }));

            const result = await createNewsletterTemplateAction(formData);

            if (result.success) {
                setValidationResults(result.data?.validationResults || []);
                alert('Newsletter template created successfully!');
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to create template:', error);
            alert('Failed to create template');
        } finally {
            setIsCreating(false);
        }
    };

    const handleExportTemplate = async () => {
        setIsExporting(true);
        try {
            const formData = new FormData();
            formData.append('templateId', 'temp_id'); // Would be actual template ID
            formData.append('content', JSON.stringify({
                subject: config.subject,
                preheader: config.preheader,
                sections
            }));
            formData.append('userBrandInfo', JSON.stringify({
                name: 'John Doe',
                contactInfo: 'john@example.com',
                address: '123 Main St, City, State 12345',
                unsubscribeUrl: 'https://example.com/unsubscribe'
            }));

            const result = await exportNewsletterTemplateAction(formData);

            if (result.success) {
                setExportResult(result.data);
            } else {
                alert(`Export error: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to export template:', error);
            alert('Failed to export template');
        } finally {
            setIsExporting(false);
        }
    };

    const handleTestESPCompatibility = async () => {
        if (!exportResult) {
            alert('Please export the template first');
            return;
        }

        setIsTesting(true);
        try {
            const formData = new FormData();
            formData.append('html', exportResult.html);
            formData.append('plainText', exportResult.plainText);

            const result = await testESPCompatibilityAction(formData);

            if (result.success) {
                setEspResults(result.data || []);
            } else {
                alert(`ESP test error: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to test ESP compatibility:', error);
            alert('Failed to test ESP compatibility');
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Newsletter Template Creator</CardTitle>
                    <CardDescription>
                        Create professional newsletter templates with email-safe validation and ESP compatibility
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="sections">Sections</TabsTrigger>
                            <TabsTrigger value="branding">Branding</TabsTrigger>
                            <TabsTrigger value="export">Export & Test</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Template Name</Label>
                                    <Input
                                        id="name"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        placeholder="Monthly Market Update"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="layout">Layout</Label>
                                    <Select value={config.layout} onValueChange={(value: any) =>
                                        setConfig({ ...config, layout: value })
                                    }>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single-column">Single Column</SelectItem>
                                            <SelectItem value="two-column">Two Column</SelectItem>
                                            <SelectItem value="three-column">Three Column</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    placeholder="Professional market analysis newsletter for clients"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject Line</Label>
                                    <Input
                                        id="subject"
                                        value={config.subject}
                                        onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                                        placeholder="[MARKET_AREA] Market Update - [MONTH] [YEAR]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="preheader">Preheader Text</Label>
                                    <Input
                                        id="preheader"
                                        value={config.preheader}
                                        onChange={(e) => setConfig({ ...config, preheader: e.target.value })}
                                        placeholder="Latest market trends and insights"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="sections" className="space-y-4">
                            <div className="flex gap-2 mb-4">
                                <Button onClick={() => addSection('header')} variant="outline" size="sm">
                                    Add Header
                                </Button>
                                <Button onClick={() => addSection('content')} variant="outline" size="sm">
                                    Add Content
                                </Button>
                                <Button onClick={() => addSection('image')} variant="outline" size="sm">
                                    Add Image
                                </Button>
                                <Button onClick={() => addSection('cta')} variant="outline" size="sm">
                                    Add CTA
                                </Button>
                                <Button onClick={() => addSection('divider')} variant="outline" size="sm">
                                    Add Divider
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {sections.map((section) => (
                                    <Card key={section.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-center">
                                                <Badge variant="secondary">{section.type}</Badge>
                                                <Button
                                                    onClick={() => removeSection(section.id)}
                                                    variant="destructive"
                                                    size="sm"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {(section.type === 'header' || section.type === 'content') && (
                                                <>
                                                    <div>
                                                        <Label>Title</Label>
                                                        <Input
                                                            value={section.title || ''}
                                                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                                            placeholder="Section title"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Content</Label>
                                                        <Textarea
                                                            value={section.content || ''}
                                                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                                            placeholder="Section content"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            {section.type === 'image' && (
                                                <>
                                                    <div>
                                                        <Label>Image URL</Label>
                                                        <Input
                                                            value={section.imageUrl || ''}
                                                            onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                                                            placeholder="https://example.com/image.jpg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Alt Text</Label>
                                                        <Input
                                                            value={section.imageAlt || ''}
                                                            onChange={(e) => updateSection(section.id, { imageAlt: e.target.value })}
                                                            placeholder="Descriptive alt text"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            {section.type === 'cta' && (
                                                <>
                                                    <div>
                                                        <Label>Button Text</Label>
                                                        <Input
                                                            value={section.ctaText || ''}
                                                            onChange={(e) => updateSection(section.id, { ctaText: e.target.value })}
                                                            placeholder="Get Your Home Value"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Button URL</Label>
                                                        <Input
                                                            value={section.ctaUrl || ''}
                                                            onChange={(e) => updateSection(section.id, { ctaUrl: e.target.value })}
                                                            placeholder="https://example.com/home-value"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="branding" className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primaryColor">Primary Color</Label>
                                    <Input
                                        id="primaryColor"
                                        type="color"
                                        value={config.branding.primaryColor}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            branding: { ...config.branding, primaryColor: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                                    <Input
                                        id="secondaryColor"
                                        type="color"
                                        value={config.branding.secondaryColor}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            branding: { ...config.branding, secondaryColor: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fontFamily">Font Family</Label>
                                    <Select
                                        value={config.branding.fontFamily}
                                        onValueChange={(value: any) => setConfig({
                                            ...config,
                                            branding: { ...config.branding, fontFamily: value }
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Arial">Arial</SelectItem>
                                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                                            <SelectItem value="Georgia">Georgia</SelectItem>
                                            <SelectItem value="Times">Times</SelectItem>
                                            <SelectItem value="Verdana">Verdana</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium">Footer Options</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeUnsubscribe"
                                            checked={config.footer.includeUnsubscribe}
                                            onCheckedChange={(checked) => setConfig({
                                                ...config,
                                                footer: { ...config.footer, includeUnsubscribe: !!checked }
                                            })}
                                        />
                                        <Label htmlFor="includeUnsubscribe">Include Unsubscribe Link (Required)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeAddress"
                                            checked={config.footer.includeAddress}
                                            onCheckedChange={(checked) => setConfig({
                                                ...config,
                                                footer: { ...config.footer, includeAddress: !!checked }
                                            })}
                                        />
                                        <Label htmlFor="includeAddress">Include Business Address</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeDisclaimer"
                                            checked={config.footer.includeDisclaimer}
                                            onCheckedChange={(checked) => setConfig({
                                                ...config,
                                                footer: { ...config.footer, includeDisclaimer: !!checked }
                                            })}
                                        />
                                        <Label htmlFor="includeDisclaimer">Include Legal Disclaimer</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium">ESP Compatibility</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(config.espCompatibility).map(([esp, enabled]) => (
                                        <div key={esp} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={esp}
                                                checked={enabled}
                                                onCheckedChange={(checked) => setConfig({
                                                    ...config,
                                                    espCompatibility: { ...config.espCompatibility, [esp]: !!checked }
                                                })}
                                            />
                                            <Label htmlFor={esp} className="capitalize">
                                                {esp.replace(/([A-Z])/g, ' $1').trim()}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="export" className="space-y-4">
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleCreateTemplate}
                                    disabled={isCreating || !templateName || !templateDescription}
                                >
                                    {isCreating ? 'Creating...' : 'Create Template'}
                                </Button>
                                <Button
                                    onClick={handleExportTemplate}
                                    disabled={isExporting}
                                    variant="outline"
                                >
                                    {isExporting ? 'Exporting...' : 'Export Newsletter'}
                                </Button>
                                <Button
                                    onClick={handleTestESPCompatibility}
                                    disabled={isTesting || !exportResult}
                                    variant="outline"
                                >
                                    {isTesting ? 'Testing...' : 'Test ESP Compatibility'}
                                </Button>
                            </div>

                            {validationResults.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium">Validation Results</h4>
                                    {validationResults.map((result, index) => (
                                        <Alert key={index} variant={result.type === 'error' ? 'destructive' : 'default'}>
                                            <AlertDescription>
                                                <strong>{result.type.toUpperCase()}:</strong> {result.message}
                                                {result.suggestion && (
                                                    <div className="mt-1 text-sm opacity-80">
                                                        Suggestion: {result.suggestion}
                                                    </div>
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                    ))}
                                </div>
                            )}

                            {exportResult && (
                                <div className="space-y-2">
                                    <h4 className="font-medium">Export Results</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">HTML Version</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <pre className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">
                                                    {exportResult.html.substring(0, 500)}...
                                                </pre>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Plain Text Version</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <pre className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">
                                                    {exportResult.plainText}
                                                </pre>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {espResults.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium">ESP Compatibility Results</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {espResults.map((result, index) => (
                                            <Card key={index}>
                                                <CardHeader>
                                                    <CardTitle className="text-sm flex items-center gap-2">
                                                        {result.esp}
                                                        <Badge variant={result.compatible ? 'default' : 'destructive'}>
                                                            {result.compatible ? 'Compatible' : 'Issues Found'}
                                                        </Badge>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {result.issues.length > 0 && (
                                                        <div className="space-y-1">
                                                            {result.issues.map((issue: any, issueIndex: number) => (
                                                                <div key={issueIndex} className="text-xs">
                                                                    <Badge variant="outline" className="mr-1">
                                                                        {issue.type}
                                                                    </Badge>
                                                                    {issue.message}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {result.recommendations.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            <div className="text-xs font-medium">Recommendations:</div>
                                                            {result.recommendations.map((rec: string, recIndex: number) => (
                                                                <div key={recIndex} className="text-xs opacity-80">
                                                                    • {rec}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}