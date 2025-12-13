'use client';

import React, { useState } from 'react';
import { EnhancedCard, AICard } from '@/components/ui/enhanced-card';
import { EnhancedFormField, EnhancedFormSection, EnhancedFormActions } from '@/components/ui/enhanced-form';
import { EnhancedInput, EnhancedTextarea } from '@/components/ui/enhanced-form';
import { AIProcessingIndicator, EnhancedLoading } from '@/components/ui/enhanced-loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    PenTool,
    Sparkles,
    Copy,
    Save,
    RefreshCw,
    Eye,
    Settings,
    Wand2,
    Target,
    Users,
    Calendar,
    Hash,
    MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils/common';

interface ContentCreationInterfaceProps {
    contentType: 'blog-post' | 'social-media' | 'market-update' | 'video-script' | 'neighborhood-guide';
    onGenerate: (formData: FormData) => void;
    isGenerating?: boolean;
    generatedContent?: string;
    className?: string;
}

export function ContentCreationInterface({
    contentType,
    onGenerate,
    isGenerating = false,
    generatedContent,
    className
}: ContentCreationInterfaceProps) {
    const [activeTab, setActiveTab] = useState('create');
    const [formData, setFormData] = useState<Record<string, string>>({});

    const contentTypeConfig = {
        'blog-post': {
            title: 'Blog Post Generator',
            description: 'Create engaging, SEO-optimized blog posts that establish your expertise',
            icon: PenTool,
            fields: [
                { id: 'topic', label: 'Blog Topic', type: 'text', required: true, placeholder: 'e.g., "First-time homebuyer tips for Seattle market"' },
                { id: 'audience', label: 'Target Audience', type: 'select', required: true, options: ['First-time buyers', 'Sellers', 'Investors', 'General audience'] },
                { id: 'keywords', label: 'Target Keywords', type: 'text', placeholder: 'e.g., "Seattle real estate, home buying tips"' },
                { id: 'wordCount', label: 'Word Count', type: 'select', options: ['500-750 words', '750-1000 words', '1000-1500 words'] }
            ]
        },
        'social-media': {
            title: 'Social Media Generator',
            description: 'Create platform-optimized posts that engage your audience',
            icon: MessageSquare,
            fields: [
                { id: 'topic', label: 'Post Topic', type: 'text', required: true, placeholder: 'e.g., "Market update for downtown Seattle"' },
                { id: 'platforms', label: 'Platforms', type: 'multiselect', required: true, options: ['LinkedIn', 'Facebook', 'Instagram', 'Twitter'] },
                { id: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Friendly', 'Informative', 'Motivational'] },
                { id: 'includeHashtags', label: 'Include Hashtags', type: 'select', options: ['Yes', 'No'] }
            ]
        },
        'market-update': {
            title: 'Market Update Generator',
            description: 'Share timely market insights that position you as a local expert',
            icon: Target,
            fields: [
                { id: 'location', label: 'Market Location', type: 'text', required: true, placeholder: 'e.g., "Seattle, WA"' },
                { id: 'timePeriod', label: 'Time Period', type: 'select', required: true, options: ['This month', 'This quarter', 'Year-to-date'] },
                { id: 'propertyType', label: 'Property Type', type: 'select', options: ['All properties', 'Single-family homes', 'Condos', 'Luxury homes'] },
                { id: 'audience', label: 'Target Audience', type: 'select', options: ['Buyers', 'Sellers', 'Investors', 'General'] }
            ]
        },
        'video-script': {
            title: 'Video Script Generator',
            description: 'Create compelling scripts for your video marketing content',
            icon: Calendar,
            fields: [
                { id: 'topic', label: 'Video Topic', type: 'text', required: true, placeholder: 'e.g., "Why now is a great time to buy in Seattle"' },
                { id: 'videoLength', label: 'Video Length', type: 'select', required: true, options: ['30 seconds', '1 minute', '2-3 minutes', '5+ minutes'] },
                { id: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Conversational', 'Educational', 'Motivational'] },
                { id: 'callToAction', label: 'Call to Action', type: 'text', placeholder: 'e.g., "Contact me for a free consultation"' }
            ]
        },
        'neighborhood-guide': {
            title: 'Neighborhood Guide Generator',
            description: 'Create comprehensive guides that showcase your local expertise',
            icon: Users,
            fields: [
                { id: 'neighborhood', label: 'Neighborhood', type: 'text', required: true, placeholder: 'e.g., "Capitol Hill, Seattle"' },
                { id: 'buyerType', label: 'Target Buyer', type: 'select', required: true, options: ['First-time buyers', 'Families', 'Young professionals', 'Retirees'] },
                { id: 'highlights', label: 'Key Highlights', type: 'textarea', placeholder: 'e.g., "Great restaurants, walkable, near transit"' },
                { id: 'priceRange', label: 'Price Range', type: 'select', options: ['Under $500K', '$500K-$750K', '$750K-$1M', '$1M+'] }
            ]
        }
    };

    const config = contentTypeConfig[contentType];

    const handleInputChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            form.append(key, value);
        });
        onGenerate(form);
    };

    const renderField = (field: any) => {
        const commonProps = {
            id: field.id,
            value: formData[field.id] || '',
            onChange: (e: any) => handleInputChange(field.id, e.target.value),
            placeholder: field.placeholder
        };

        switch (field.type) {
            case 'textarea':
                return (
                    <EnhancedFormField
                        key={field.id}
                        label={field.label}
                        id={field.id}
                        required={field.required}
                    >
                        <EnhancedTextarea {...commonProps} rows={3} />
                    </EnhancedFormField>
                );

            case 'select':
                return (
                    <EnhancedFormField
                        key={field.id}
                        label={field.label}
                        id={field.id}
                        required={field.required}
                    >
                        <Select value={formData[field.id] || ''} onValueChange={(value) => handleInputChange(field.id, value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option: string) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </EnhancedFormField>
                );

            default:
                return (
                    <EnhancedFormField
                        key={field.id}
                        label={field.label}
                        id={field.id}
                        required={field.required}
                    >
                        <EnhancedInput {...commonProps} />
                    </EnhancedFormField>
                );
        }
    };

    return (
        <div className={cn("space-y-8", className)}>
            {/* Header */}
            <AICard
                title={config.title}
                description={config.description}
                icon={config.icon}
                processing={isGenerating}
                size="lg"
            >
                <div className="flex items-center gap-2 mt-4">
                    <Badge variant="secondary" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Powered
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        SEO Optimized
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Brand Consistent
                    </Badge>
                </div>
            </AICard>

            {/* Main Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create" className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        Create
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!generatedContent}>
                        <Eye className="w-4 h-4" />
                        Preview
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-6">
                    {/* Generation Form */}
                    <EnhancedCard variant="elevated" size="lg">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <EnhancedFormSection
                                title="Content Parameters"
                                description="Provide details to generate personalized content"
                                icon={Settings}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {config.fields.map(renderField)}
                                </div>
                            </EnhancedFormSection>

                            {/* AI Processing Indicator */}
                            {isGenerating && (
                                <AIProcessingIndicator stage="Generating" />
                            )}

                            <EnhancedFormActions
                                primaryAction={{
                                    label: isGenerating ? 'Generating...' : 'Generate Content',
                                    type: 'submit',
                                    variant: 'ai',
                                    loading: isGenerating,
                                    disabled: isGenerating || !formData.topic
                                }}
                                secondaryAction={{
                                    label: 'Reset Form',
                                    onClick: () => setFormData({}),
                                    variant: 'outline'
                                }}
                            />
                        </form>
                    </EnhancedCard>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                    {/* Generated Content Preview */}
                    {generatedContent ? (
                        <EnhancedCard
                            title="Generated Content"
                            description="Review and edit your AI-generated content"
                            icon={Eye}
                            variant="elevated"
                            size="lg"
                            actions={
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Regenerate
                                    </Button>
                                    <Button size="sm">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save
                                    </Button>
                                </div>
                            }
                        >
                            <div className="prose prose-sm max-w-none">
                                <div className="whitespace-pre-wrap bg-muted/30 rounded-xl p-6 border border-border/50">
                                    {generatedContent}
                                </div>
                            </div>
                        </EnhancedCard>
                    ) : (
                        <EnhancedCard variant="elevated" size="lg">
                            <div className="text-center py-12">
                                <PenTool className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Content Generated Yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Fill out the form and generate content to see the preview here.
                                </p>
                                <Button onClick={() => setActiveTab('create')} variant="outline">
                                    Go to Create Tab
                                </Button>
                            </div>
                        </EnhancedCard>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}