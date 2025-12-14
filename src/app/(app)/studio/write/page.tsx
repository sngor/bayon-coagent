'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

// Simple icon components
const Sparkles = ({ className }: { className?: string }) => <span className={className}>✨</span>;
const FileText = ({ className }: { className?: string }) => <span className={className}>📄</span>;
const MessageSquare = ({ className }: { className?: string }) => <span className={className}>💬</span>;
const Video = ({ className }: { className?: string }) => <span className={className}>🎥</span>;
const TrendingUp = ({ className }: { className?: string }) => <span className={className}>📈</span>;
const MapPin = ({ className }: { className?: string }) => <span className={className}>📍</span>;
const Globe = ({ className }: { className?: string }) => <span className={className}>🌐</span>;

// Import API functions
import {
    generateBlogPost,
    generateMarketUpdate,
    generateSocialMediaPost,
    generateVideoScript,
    generateNeighborhoodGuide,
    generateWebsiteContent
} from '@/lib/api-client';


import { AEOOptimizationPanel } from '@/components/aeo-optimization-panel';

// Helper function to clean and format content
function cleanAndFormatContent(content: string): string {
    if (!content) return '';

    // Remove any JSON artifacts
    let cleaned = content.trim();

    // If it still looks like JSON, try to extract readable content
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        try {
            const parsed = JSON.parse(cleaned);

            // Handle neighborhood guide structure specifically
            if (parsed.guide && typeof parsed.guide === 'object') {
                let guideContent = '';
                if (parsed.guide.title) {
                    guideContent = `# ${parsed.guide.title}\n\n`;
                }
                if (parsed.guide.content) {
                    guideContent += parsed.guide.content;
                } else if (parsed.guide.description) {
                    guideContent += parsed.guide.description;
                }

                // Add structured sections
                const sections = ['overview', 'highlights', 'amenities', 'schools', 'transportation', 'dining', 'recreation', 'summary'];
                sections.forEach(section => {
                    if (parsed.guide[section]) {
                        guideContent += `\n\n## ${section.charAt(0).toUpperCase() + section.slice(1)}\n${parsed.guide[section]}`;
                    }
                });

                if (guideContent.trim()) {
                    cleaned = guideContent;
                }
            } else {
                // Extract the main content field
                const contentFields = ['content', 'text', 'post', 'script', 'guide', 'update', 'article', 'description', 'websiteContent'];
                for (const field of contentFields) {
                    if (parsed[field] && typeof parsed[field] === 'string') {
                        cleaned = parsed[field];
                        break;
                    }
                }

                // If no main content field found, format all string fields
                if (cleaned.startsWith('{')) {
                    const stringFields = Object.entries(parsed)
                        .filter(([key, value]) => typeof value === 'string' && value.length > 20)
                        .sort(([, a], [, b]) => (b as string).length - (a as string).length) // Sort by length, longest first
                        .map(([key, value]) => {
                            if (key === 'title') {
                                return `# ${value}`;
                            } else {
                                return `**${key.charAt(0).toUpperCase() + key.slice(1)}:**\n${value}`;
                            }
                        })
                        .join('\n\n');

                    if (stringFields) {
                        cleaned = stringFields;
                    }
                }
            }
        } catch (e) {
            // If parsing fails, keep as is
        }
    }

    // Clean up formatting
    cleaned = cleaned
        .replace(/\\n/g, '\n')  // Replace escaped newlines
        .replace(/\\""/g, '"')   // Replace escaped quotes
        .replace(/\\'/g, "'")    // Replace escaped apostrophes
        .replace(/\\\\/g, '\\')  // Replace double backslashes
        .trim();

    return cleaned;
}

// Helper function to extract keywords from content
function extractKeywordsFromContent(content: string): string[] {
    if (!content) return [];

    // Extract potential keywords from content (simple approach)
    const words = content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can', 'still', 'should', 'after', 'being', 'now', 'made', 'before', 'here', 'through', 'when', 'where', 'much', 'some', 'these', 'many', 'would', 'there'].includes(word));

    // Count frequency and return top keywords
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
}

export default function StudioWritePage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'blog-post');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);

    const handleSubmit = async (formData: FormData, contentType: string) => {
        setIsLoading(true);
        setError(null);
        setGeneratedContent('');
        setLoadingStep(0);

        // Simulate loading steps for better UX
        const loadingSteps = [
            'Analyzing your request...',
            'Researching current information...',
            'Generating AI content...',
            'Optimizing for your audience...',
            'Finalizing content...'
        ];

        const stepInterval = setInterval(() => {
            setLoadingStep(prev => {
                if (prev < loadingSteps.length - 1) {
                    return prev + 1;
                }
                return prev;
            });
        }, 2000); // Change step every 2 seconds

        try {
            let result;

            switch (contentType) {
                case 'blog-post':
                    result = await generateBlogPost({
                        topic: formData.get('topic') as string,
                        audience: formData.get('audience') as string,
                        tone: 'Professional',
                        keywords: formData.get('keywords') as string || undefined,
                        includeWebSearch: formData.get('includeWebSearch') === 'on'
                    });
                    break;

                case 'market-update':
                    result = await generateMarketUpdate({
                        location: formData.get('location') as string,
                        timeframe: formData.get('timePeriod') as string,
                        focus: formData.get('propertyType') as string,
                        includeWebSearch: formData.get('includeWebSearch') === 'on'
                    });
                    break;

                case 'social-media':
                    result = await generateSocialMediaPost({
                        topic: formData.get('topic') as string,
                        platform: formData.get('platform') as string,
                        tone: formData.get('tone') as string
                    });
                    break;

                case 'video-script':
                    result = await generateVideoScript({
                        topic: formData.get('topic') as string,
                        duration: formData.get('duration') as string,
                        style: formData.get('style') as string,
                        includeWebSearch: formData.get('includeWebSearch') === 'on'
                    });
                    break;

                case 'neighborhood-guide':
                    result = await generateNeighborhoodGuide({
                        neighborhood: formData.get('neighborhood') as string,
                        city: formData.get('city') as string,
                        focus: formData.get('focus') as string,
                        includeWebSearch: formData.get('includeWebSearch') === 'on'
                    });
                    break;

                case 'website-content':
                    result = await generateWebsiteContent({
                        contentType: formData.get('websiteContentType') as string,
                        businessName: formData.get('businessName') as string,
                        location: formData.get('location') as string,
                        specialties: formData.get('specialties') as string,
                        experience: formData.get('experience') as string,
                        tone: formData.get('tone') as string,
                        targetAudience: formData.get('targetAudience') as string,
                        includeWebSearch: formData.get('includeWebSearch') === 'on'
                    });
                    break;

                default:
                    throw new Error('Unknown content type');
            }

            if (result.success && result.data) {
                // Handle structured response from API
                let content = '';
                const data = result.data as any;

                console.log('Raw API response data:', data); // Debug log
                console.log('Data type:', typeof data);
                console.log('Data keys:', data && typeof data === 'object' ? Object.keys(data) : 'N/A');

                // First, try to parse if it's a JSON string
                let parsedData = data;
                if (typeof data === 'string') {
                    try {
                        // Check if it's a JSON string that needs parsing
                        if (data.trim().startsWith('{') && data.trim().endsWith('}')) {
                            parsedData = JSON.parse(data);
                        } else {
                            // It's already a plain text string
                            content = data;
                        }
                    } catch (e) {
                        // If parsing fails, treat as plain text
                        content = data;
                    }
                }

                // If we have parsed data or original data is an object
                if (content === '' && parsedData && typeof parsedData === 'object') {
                    // Handle structured JSON response with priority order
                    if (parsedData.title && parsedData.content) {
                        // Blog post with title and content
                        content = `# ${parsedData.title}\n\n${parsedData.content}`;

                        // Add meta description if available
                        if (parsedData.metaDescription) {
                            content += `\n\n---\n**Meta Description:** ${parsedData.metaDescription}`;
                        }
                    } else if (parsedData.guide && typeof parsedData.guide === 'object') {
                        // Neighborhood guide with structured data
                        if (parsedData.guide.title) {
                            content = `# ${parsedData.guide.title}\n\n`;
                        }
                        if (parsedData.guide.content) {
                            content += parsedData.guide.content;
                        } else if (parsedData.guide.description) {
                            content += parsedData.guide.description;
                        }
                        // Add other guide sections
                        const guideSections = ['overview', 'highlights', 'amenities', 'schools', 'transportation', 'dining', 'recreation'];
                        guideSections.forEach(section => {
                            if (parsedData.guide[section]) {
                                content += `\n\n## ${section.charAt(0).toUpperCase() + section.slice(1)}\n${parsedData.guide[section]}`;
                            }
                        });
                    } else if (parsedData.guide && typeof parsedData.guide === 'string') {
                        // Neighborhood guide as string
                        content = parsedData.guide;
                    } else if (parsedData.websiteContent) {
                        // Website content
                        content = parsedData.websiteContent;
                    } else if (parsedData.content) {
                        // Just content field
                        content = parsedData.content;
                    } else if (parsedData.text) {
                        // Alternative text field
                        content = parsedData.text;
                    } else if (parsedData.post) {
                        // Social media post
                        content = parsedData.post;
                    } else if (parsedData.script) {
                        // Video script
                        content = parsedData.script;
                    } else if (parsedData.update) {
                        // Market update
                        content = parsedData.update;
                    } else {
                        // Try to find the longest string value (likely the main content)
                        const stringValues = Object.entries(parsedData)
                            .filter(([key, value]) =>
                                typeof value === 'string' &&
                                value.length > 50 &&
                                !['id', 'timestamp', 'type', 'status'].includes(key.toLowerCase())
                            )
                            .sort(([, a], [, b]) => (b as string).length - (a as string).length);

                        if (stringValues.length > 0) {
                            const [mainKey, mainContent] = stringValues[0];
                            content = mainContent as string;

                            // If there are other meaningful fields, add them
                            const otherFields = Object.entries(parsedData)
                                .filter(([key, value]) =>
                                    typeof value === 'string' &&
                                    value.length > 10 &&
                                    value.length <= 200 &&
                                    key !== mainKey &&
                                    !['id', 'timestamp', 'type', 'status'].includes(key.toLowerCase())
                                );

                            if (otherFields.length > 0) {
                                content += '\n\n---\n';
                                otherFields.forEach(([key, value]) => {
                                    content += `**${key.charAt(0).toUpperCase() + key.slice(1)}:** ${value}\n`;
                                });
                            }
                        } else {
                            // Last resort: format all fields as readable text
                            content = Object.entries(parsedData)
                                .filter(([key, value]) =>
                                    typeof value === 'string' &&
                                    !['id', 'timestamp', 'type', 'status'].includes(key.toLowerCase())
                                )
                                .map(([key, value]) => `**${key.charAt(0).toUpperCase() + key.slice(1)}:**\n${value}`)
                                .join('\n\n');
                        }
                    }
                }

                // If still no content, convert to string
                if (content === '') {
                    content = String(parsedData);
                }

                // Clean and format the final content
                const cleanedContent = cleanAndFormatContent(content);
                setGeneratedContent(cleanedContent);
                toast({
                    title: '✨ Content Generated!',
                    description: 'Your content is ready.',
                });
            } else {
                throw new Error(result.error?.message || 'Generation failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Generation failed';
            setError(errorMessage);
            toast({
                title: 'Generation Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            clearInterval(stepInterval);
            setIsLoading(false);
            setLoadingStep(0);
        }
    };

    const contentTypes = [
        {
            id: 'blog-post',
            title: 'Blog Posts',
            description: 'Publish blog posts that rank and convert',
            icon: FileText,
        },
        {
            id: 'social-media',
            title: 'Social Media',
            description: 'Create engaging posts that stop the scroll',
            icon: MessageSquare,
        },
        {
            id: 'video-script',
            title: 'Video Scripts',
            description: 'Script videos that stop the scroll and start conversations',
            icon: Video,
        },
        {
            id: 'market-update',
            title: 'Market Updates',
            description: 'Share market insights that position you as the local expert',
            icon: TrendingUp,
        },
        {
            id: 'neighborhood-guide',
            title: 'Neighborhood Guides',
            description: 'Become the go-to expert for every neighborhood you serve',
            icon: MapPin,
        },
        {
            id: 'website-content',
            title: 'Website Content',
            description: 'Build SEO-optimized pages that establish your authority',
            icon: Globe,
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Studio Write</h1>
                        <p className="text-muted-foreground">
                            Create high-quality content with AI assistance
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="content-type" className="text-sm font-medium whitespace-nowrap">
                            Content Type:
                        </Label>
                        <Select value={activeTab} onValueChange={setActiveTab}>
                            <SelectTrigger id="content-type" className="w-full max-w-md">
                                <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                            <SelectContent>
                                {contentTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <SelectItem key={type.id} value={type.id}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4" />
                                                <span>{type.title}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Content Generation Forms */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>
                            {contentTypes.find(t => t.id === activeTab)?.title} Generator
                        </CardTitle>
                        <CardDescription>
                            {contentTypes.find(t => t.id === activeTab)?.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleSubmit(formData, activeTab);
                            }}
                            className="space-y-4"
                        >
                            {activeTab === 'blog-post' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="topic">Blog Topic</Label>
                                        <Textarea
                                            id="topic"
                                            name="topic"
                                            placeholder="e.g., First-time homebuyer tips for Seattle market, How to stage your home for quick sale"
                                            required
                                            rows={3}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="audience">Target Audience</Label>
                                            <Select name="audience" defaultValue="First-Time Buyers">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="First-Time Buyers">First-Time Buyers</SelectItem>
                                                    <SelectItem value="Sellers">Sellers</SelectItem>
                                                    <SelectItem value="Investors">Investors</SelectItem>
                                                    <SelectItem value="Luxury Buyers">Luxury Buyers</SelectItem>
                                                    <SelectItem value="Downsizers">Downsizers</SelectItem>
                                                    <SelectItem value="Relocating Families">Relocating Families</SelectItem>
                                                    <SelectItem value="Young Professionals">Young Professionals</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tone">Writing Tone</Label>
                                            <Select name="tone" defaultValue="Professional">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Professional">Professional</SelectItem>
                                                    <SelectItem value="Friendly">Friendly & Conversational</SelectItem>
                                                    <SelectItem value="Expert">Expert & Authoritative</SelectItem>
                                                    <SelectItem value="Helpful">Helpful & Supportive</SelectItem>
                                                    <SelectItem value="Casual">Casual & Approachable</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="length">Content Length</Label>
                                            <Select name="length" defaultValue="Medium">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Short">Short (500-800 words)</SelectItem>
                                                    <SelectItem value="Medium">Medium (800-1200 words)</SelectItem>
                                                    <SelectItem value="Long">Long (1200-1800 words)</SelectItem>
                                                    <SelectItem value="Comprehensive">Comprehensive (1800+ words)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location Focus (optional)</Label>
                                            <Input
                                                id="location"
                                                name="location"
                                                placeholder="e.g., Seattle, WA"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="keywords">SEO Keywords (optional)</Label>
                                        <Input
                                            id="keywords"
                                            name="keywords"
                                            placeholder="e.g., Seattle real estate, home buying tips, mortgage rates"
                                        />
                                        <p className="text-xs text-muted-foreground">Separate multiple keywords with commas</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeWebSearchBlog"
                                                name="includeWebSearch"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include current web research"
                                            />
                                            <Label htmlFor="includeWebSearchBlog" className="text-sm">
                                                Include current web research (recommended)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeCTA"
                                                name="includeCTA"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include call-to-action"
                                            />
                                            <Label htmlFor="includeCTA" className="text-sm">
                                                Include call-to-action at the end
                                            </Label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'market-update' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Market Location</Label>
                                        <Input
                                            id="location"
                                            name="location"
                                            placeholder="e.g., Seattle, WA or King County or Greater Seattle Area"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="timePeriod">Time Period</Label>
                                            <Select name="timePeriod" defaultValue="Current Month">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Current Month">Current Month</SelectItem>
                                                    <SelectItem value="Last Month">Last Month</SelectItem>
                                                    <SelectItem value="Quarter">This Quarter</SelectItem>
                                                    <SelectItem value="Year to Date">Year to Date</SelectItem>
                                                    <SelectItem value="Last 12 Months">Last 12 Months</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="updateType">Update Type</Label>
                                            <Select name="updateType" defaultValue="General Market">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="General Market">General Market Update</SelectItem>
                                                    <SelectItem value="Buyer Market">Buyer's Market Focus</SelectItem>
                                                    <SelectItem value="Seller Market">Seller's Market Focus</SelectItem>
                                                    <SelectItem value="Investment">Investment Opportunities</SelectItem>
                                                    <SelectItem value="Luxury">Luxury Market</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="propertyType">Property Type</Label>
                                            <Select name="propertyType" defaultValue="All Properties">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="All Properties">All Properties</SelectItem>
                                                    <SelectItem value="Single-Family Homes">Single-Family Homes</SelectItem>
                                                    <SelectItem value="Condos">Condominiums</SelectItem>
                                                    <SelectItem value="Townhomes">Townhomes</SelectItem>
                                                    <SelectItem value="Luxury Homes">Luxury Homes ($1M+)</SelectItem>
                                                    <SelectItem value="Starter Homes">Starter Homes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="priceRange">Price Range (optional)</Label>
                                            <Select name="priceRange">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All price ranges" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Under 500K">Under $500K</SelectItem>
                                                    <SelectItem value="500K-750K">$500K - $750K</SelectItem>
                                                    <SelectItem value="750K-1M">$750K - $1M</SelectItem>
                                                    <SelectItem value="1M-2M">$1M - $2M</SelectItem>
                                                    <SelectItem value="Over 2M">Over $2M</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeWebSearchMarket"
                                                name="includeWebSearch"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include current market data"
                                            />
                                            <Label htmlFor="includeWebSearchMarket" className="text-sm">
                                                Include current market data (recommended)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeStats"
                                                name="includeStats"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include key statistics"
                                            />
                                            <Label htmlFor="includeStats" className="text-sm">
                                                Include key market statistics
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeForecast"
                                                name="includeForecast"
                                                defaultChecked={false}
                                                className="rounded border-gray-300"
                                                title="Include market forecast"
                                            />
                                            <Label htmlFor="includeForecast" className="text-sm">
                                                Include market forecast & predictions
                                            </Label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'social-media' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="topic">Post Topic</Label>
                                        <Textarea
                                            id="topic"
                                            name="topic"
                                            placeholder="e.g., Home staging tips for quick sales, Market update for downtown Seattle, New listing showcase"
                                            required
                                            rows={3}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="platform">Platform</Label>
                                            <Select name="platform" defaultValue="Instagram">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Instagram">Instagram</SelectItem>
                                                    <SelectItem value="Facebook">Facebook</SelectItem>
                                                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                                    <SelectItem value="Twitter">Twitter/X</SelectItem>
                                                    <SelectItem value="TikTok">TikTok</SelectItem>
                                                    <SelectItem value="YouTube">YouTube Community</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="postType">Post Type</Label>
                                            <Select name="postType" defaultValue="Educational">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Educational">Educational Tips</SelectItem>
                                                    <SelectItem value="Market Update">Market Update</SelectItem>
                                                    <SelectItem value="Listing Showcase">Listing Showcase</SelectItem>
                                                    <SelectItem value="Behind the Scenes">Behind the Scenes</SelectItem>
                                                    <SelectItem value="Client Success">Client Success Story</SelectItem>
                                                    <SelectItem value="Community">Community Spotlight</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="tone">Tone</Label>
                                            <Select name="tone" defaultValue="Professional">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Professional">Professional</SelectItem>
                                                    <SelectItem value="Casual">Casual & Fun</SelectItem>
                                                    <SelectItem value="Friendly">Friendly & Warm</SelectItem>
                                                    <SelectItem value="Authoritative">Expert & Authoritative</SelectItem>
                                                    <SelectItem value="Inspirational">Inspirational</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="length">Post Length</Label>
                                            <Select name="length" defaultValue="Medium">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Short">Short & Punchy</SelectItem>
                                                    <SelectItem value="Medium">Medium Length</SelectItem>
                                                    <SelectItem value="Long">Detailed & Comprehensive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location (optional)</Label>
                                        <Input
                                            id="location"
                                            name="location"
                                            placeholder="e.g., Seattle, Capitol Hill, Downtown"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeHashtags"
                                                name="includeHashtags"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include relevant hashtags"
                                            />
                                            <Label htmlFor="includeHashtags" className="text-sm">
                                                Include relevant hashtags
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeEmojis"
                                                name="includeEmojis"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include emojis"
                                            />
                                            <Label htmlFor="includeEmojis" className="text-sm">
                                                Include emojis for engagement
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeCTASocial"
                                                name="includeCTA"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include call-to-action"
                                            />
                                            <Label htmlFor="includeCTASocial" className="text-sm">
                                                Include call-to-action
                                            </Label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'video-script' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="topic">Video Topic</Label>
                                        <Textarea
                                            id="topic"
                                            name="topic"
                                            placeholder="e.g., Virtual home tour walkthrough, First-time buyer tips, Market update for Q4 2024"
                                            required
                                            rows={3}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="duration">Duration</Label>
                                            <Select name="duration" defaultValue="2-3 minutes">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="30 seconds">30 seconds (Social)</SelectItem>
                                                    <SelectItem value="1 minute">1 minute (Short Form)</SelectItem>
                                                    <SelectItem value="2-3 minutes">2-3 minutes (Standard)</SelectItem>
                                                    <SelectItem value="5-10 minutes">5-10 minutes (Detailed)</SelectItem>
                                                    <SelectItem value="10+ minutes">10+ minutes (Comprehensive)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="platform">Platform</Label>
                                            <Select name="platform" defaultValue="YouTube">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="YouTube">YouTube</SelectItem>
                                                    <SelectItem value="Instagram">Instagram Reels</SelectItem>
                                                    <SelectItem value="TikTok">TikTok</SelectItem>
                                                    <SelectItem value="Facebook">Facebook Video</SelectItem>
                                                    <SelectItem value="LinkedIn">LinkedIn Video</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="style">Video Style</Label>
                                            <Select name="style" defaultValue="Educational">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Educational">Educational/Tutorial</SelectItem>
                                                    <SelectItem value="Promotional">Promotional</SelectItem>
                                                    <SelectItem value="Testimonial">Client Testimonial</SelectItem>
                                                    <SelectItem value="Behind-the-scenes">Behind-the-scenes</SelectItem>
                                                    <SelectItem value="Property Tour">Property Tour</SelectItem>
                                                    <SelectItem value="Market Analysis">Market Analysis</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tone">Presentation Tone</Label>
                                            <Select name="tone" defaultValue="Professional">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Professional">Professional</SelectItem>
                                                    <SelectItem value="Conversational">Conversational</SelectItem>
                                                    <SelectItem value="Energetic">Energetic & Upbeat</SelectItem>
                                                    <SelectItem value="Calm">Calm & Reassuring</SelectItem>
                                                    <SelectItem value="Expert">Expert & Authoritative</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location Focus (optional)</Label>
                                        <Input
                                            id="location"
                                            name="location"
                                            placeholder="e.g., Seattle, Bellevue, King County"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeWebSearchVideo"
                                                name="includeWebSearch"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include current trends and data"
                                            />
                                            <Label htmlFor="includeWebSearchVideo" className="text-sm">
                                                Include current trends & data (recommended)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeHooks"
                                                name="includeHooks"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include attention-grabbing hooks"
                                            />
                                            <Label htmlFor="includeHooks" className="text-sm">
                                                Include attention-grabbing hooks
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeCues"
                                                name="includeCues"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include visual and timing cues"
                                            />
                                            <Label htmlFor="includeCues" className="text-sm">
                                                Include visual and timing cues
                                            </Label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'neighborhood-guide' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="neighborhood">Neighborhood</Label>
                                            <Input
                                                id="neighborhood"
                                                name="neighborhood"
                                                placeholder="e.g., Capitol Hill, Ballard, Fremont"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City/Region</Label>
                                            <Input
                                                id="city"
                                                name="city"
                                                placeholder="e.g., Seattle, WA"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="focus">Primary Focus</Label>
                                            <Select name="focus" defaultValue="Comprehensive">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Comprehensive">Comprehensive Guide</SelectItem>
                                                    <SelectItem value="Family Living">Family Living</SelectItem>
                                                    <SelectItem value="Young Professionals">Young Professionals</SelectItem>
                                                    <SelectItem value="Luxury Living">Luxury Living</SelectItem>
                                                    <SelectItem value="Investment">Investment Potential</SelectItem>
                                                    <SelectItem value="Walkability">Walkability & Transit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="audience">Target Audience</Label>
                                            <Select name="audience" defaultValue="General">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="General">General Buyers</SelectItem>
                                                    <SelectItem value="First-Time Buyers">First-Time Buyers</SelectItem>
                                                    <SelectItem value="Families">Families with Children</SelectItem>
                                                    <SelectItem value="Professionals">Young Professionals</SelectItem>
                                                    <SelectItem value="Retirees">Retirees/Downsizers</SelectItem>
                                                    <SelectItem value="Investors">Investors</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Include Sections (select multiple)</Label>
                                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="includeOverview" name="sections" value="overview" defaultChecked className="rounded border-gray-300" title="Include overview and history section" />
                                                <Label htmlFor="includeOverview" className="text-sm">Overview & History</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="includeHousing" name="sections" value="housing" defaultChecked className="rounded border-gray-300" title="Include housing and prices section" />
                                                <Label htmlFor="includeHousing" className="text-sm">Housing & Prices</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="includeSchools" name="sections" value="schools" defaultChecked className="rounded border-gray-300" title="Include schools and education section" />
                                                <Label htmlFor="includeSchools" className="text-sm">Schools & Education</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="includeDining" name="sections" value="dining" defaultChecked className="rounded border-gray-300" title="Include dining and shopping section" />
                                                <Label htmlFor="includeDining" className="text-sm">Dining & Shopping</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="includeTransport" name="sections" value="transportation" defaultChecked className="rounded border-gray-300" title="Include transportation section" />
                                                <Label htmlFor="includeTransport" className="text-sm">Transportation</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="includeRecreation" name="sections" value="recreation" defaultChecked className="rounded border-gray-300" title="Include recreation and parks section" />
                                                <Label htmlFor="includeRecreation" className="text-sm">Recreation & Parks</Label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeWebSearchGuide"
                                                name="includeWebSearch"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include current neighborhood information"
                                            />
                                            <Label htmlFor="includeWebSearchGuide" className="text-sm">
                                                Include current neighborhood info (recommended)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includePhotos"
                                                name="includePhotos"
                                                defaultChecked={false}
                                                className="rounded border-gray-300"
                                                title="Include photo suggestions"
                                            />
                                            <Label htmlFor="includePhotos" className="text-sm">
                                                Include photo suggestions
                                            </Label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'website-content' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="websiteContentType">Website Page Type</Label>
                                        <Select name="websiteContentType" defaultValue="about-me">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="about-me">About Me Page</SelectItem>
                                                <SelectItem value="services">Services Page</SelectItem>
                                                <SelectItem value="faq">FAQ Page</SelectItem>
                                                <SelectItem value="testimonial-request">Testimonial Request</SelectItem>
                                                <SelectItem value="landing-page">Landing Page</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="businessName">Business/Agent Name</Label>
                                            <Input
                                                id="businessName"
                                                name="businessName"
                                                placeholder="e.g., Sarah Johnson Real Estate"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Primary Location</Label>
                                            <Input
                                                id="location"
                                                name="location"
                                                placeholder="e.g., Seattle, WA"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="experience">Years of Experience</Label>
                                            <Select name="experience" defaultValue="5-10">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1-2">1-2 years</SelectItem>
                                                    <SelectItem value="3-5">3-5 years</SelectItem>
                                                    <SelectItem value="5-10">5-10 years</SelectItem>
                                                    <SelectItem value="10-15">10-15 years</SelectItem>
                                                    <SelectItem value="15+">15+ years</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="targetAudience">Target Audience</Label>
                                            <Select name="targetAudience" defaultValue="General">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="General">General Buyers & Sellers</SelectItem>
                                                    <SelectItem value="First-Time Buyers">First-Time Buyers</SelectItem>
                                                    <SelectItem value="Luxury Clients">Luxury Clients</SelectItem>
                                                    <SelectItem value="Investors">Real Estate Investors</SelectItem>
                                                    <SelectItem value="Relocating Families">Relocating Families</SelectItem>
                                                    <SelectItem value="Downsizers">Downsizers & Retirees</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="specialties">Specialties & Services</Label>
                                        <Textarea
                                            id="specialties"
                                            name="specialties"
                                            placeholder="e.g., Luxury homes, First-time buyers, Investment properties, Relocation services"
                                            rows={3}
                                        />
                                        <p className="text-xs text-muted-foreground">List your key specialties, certifications, or unique services</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tone">Website Tone</Label>
                                        <Select name="tone" defaultValue="Professional & Approachable">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Professional & Approachable">Professional & Approachable</SelectItem>
                                                <SelectItem value="Warm & Personal">Warm & Personal</SelectItem>
                                                <SelectItem value="Expert & Authoritative">Expert & Authoritative</SelectItem>
                                                <SelectItem value="Friendly & Conversational">Friendly & Conversational</SelectItem>
                                                <SelectItem value="Luxury & Sophisticated">Luxury & Sophisticated</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeWebSearchWebsite"
                                                name="includeWebSearch"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include current market information"
                                            />
                                            <Label htmlFor="includeWebSearchWebsite" className="text-sm">
                                                Include current market information (recommended)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeSEO"
                                                name="includeSEO"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Optimize for search engines"
                                            />
                                            <Label htmlFor="includeSEO" className="text-sm">
                                                Optimize for search engines (SEO)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="includeLocalKeywords"
                                                name="includeLocalKeywords"
                                                defaultChecked={true}
                                                className="rounded border-gray-300"
                                                title="Include local keywords"
                                            />
                                            <Label htmlFor="includeLocalKeywords" className="text-sm">
                                                Include local keywords for area dominance
                                            </Label>
                                        </div>
                                    </div>
                                </>
                            )}

                            <Button type="submit" disabled={isLoading} className="w-full ai-gradient text-white shadow-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                                {isLoading ? (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate Content
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Generated Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center space-y-4">
                                    {/* Animated AI Icon */}
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse"></div>
                                        <Sparkles className="relative mx-auto h-12 w-12 text-blue-600 animate-spin" />
                                    </div>

                                    {/* Dynamic Loading Text */}
                                    <div className="space-y-2">
                                        <p className="text-lg font-medium text-foreground">
                                            {[
                                                'Analyzing your request...',
                                                'Researching current information...',
                                                'Generating AI content...',
                                                'Optimizing for your audience...',
                                                'Finalizing content...'
                                            ][loadingStep]}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            This may take a few moments while we create high-quality content for you
                                        </p>
                                    </div>

                                    {/* Progress Indicator */}
                                    <div className="w-64 mx-auto">
                                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                            <span>Step {loadingStep + 1} of 5</span>
                                            <span>{Math.round(((loadingStep + 1) / 5) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${((loadingStep + 1) / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : generatedContent ? (
                            <div className="space-y-6">
                                {/* Editable Content */}
                                <div className="space-y-2">
                                    <Label htmlFor="generated-content">Generated Content (Editable)</Label>
                                    <Textarea
                                        id="generated-content"
                                        value={generatedContent}
                                        onChange={(e) => setGeneratedContent(e.target.value)}
                                        className="min-h-[400px] font-mono text-sm"
                                        placeholder="Your generated content will appear here..."
                                    />
                                </div>

                                {/* AEO Optimization Panel */}
                                <AEOOptimizationPanel
                                    content={generatedContent}
                                    contentType={activeTab === 'blog-post' ? 'blog' : 'article'}
                                    targetKeywords={extractKeywordsFromContent(generatedContent)}
                                    onOptimized={(optimizedContent) => {
                                        setGeneratedContent(optimizedContent);
                                    }}
                                />

                                <div className="flex gap-2">
                                    <Button onClick={() => navigator.clipboard.writeText(generatedContent)}>
                                        Copy Content
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            toast({
                                                title: 'Content Saved!',
                                                description: 'Added to your library.'
                                            });
                                        }}
                                    >
                                        Save to Library
                                    </Button>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-600 py-12">
                                <p>Error: {error}</p>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-12">
                                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p>Your generated content will appear here</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}