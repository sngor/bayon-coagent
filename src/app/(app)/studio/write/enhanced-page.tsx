'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
    Sparkles,
    FileText,
    MessageSquare,
    Video,
    TrendingUp,
    MapPin,
    Globe,
    Copy,
    Download,
    Share2,
    Save,
    RefreshCw,
    Lightbulb,
    Target,
    Users,
    Calendar,
    Clock,
    Eye,
    ThumbsUp,
    BarChart3,
    Wand2,
    BookOpen,
    PenTool,
    Image,
    Hash,
    AtSign,
    CheckCircle2
} from 'lucide-react';
import { useUser } from '@/aws/auth';
import { generateBlogPostAction, generateSocialPostAction, generateMarketUpdateAction, generateVideoScriptAction, saveContentAction } from '@/app/actions';

interface ContentTemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'blog' | 'social' | 'marketing' | 'video' | 'email';
    fields: Array<{
        name: string;
        label: string;
        type: 'text' | 'textarea' | 'select' | 'number';
        required: boolean;
        placeholder?: string;
        options?: string[];
    }>;
    prompts: string[];
}

interface GeneratedContent {
    type: string;
    title: string;
    content: string;
    metadata: {
        wordCount: number;
        readingTime: number;
        seoScore: number;
        hashtags?: string[];
        mentions?: string[];
    };
    suggestions: string[];
}

const CONTENT_TEMPLATES: ContentTemplate[] = [
    {
        id: 'blog-post',
        name: 'Blog Post',
        description: 'Professional blog posts for your website and SEO',
        icon: FileText,
        category: 'blog',
        fields: [
            { name: 'topic', label: 'Topic', type: 'text', required: true, placeholder: 'e.g., First-time homebuyer tips' },
            { name: 'audience', label: 'Target Audience', type: 'select', required: true, options: ['First-time buyers', 'Sellers', 'Investors', 'General'] },
            { name: 'tone', label: 'Tone', type: 'select', required: true, options: ['Professional', 'Friendly', 'Educational', 'Conversational'] },
            { name: 'keywords', label: 'SEO Keywords', type: 'text', required: false, placeholder: 'home buying, real estate tips' },
            { name: 'length', label: 'Length', type: 'select', required: true, options: ['Short (300-500 words)', 'Medium (500-800 words)', 'Long (800+ words)'] }
        ],
        prompts: [
            'Top 10 mistakes first-time homebuyers make',
            'How to price your home competitively in 2024',
            'The complete guide to home staging',
            'Understanding mortgage rates and how they affect you',
            'Why now is a great time to invest in real estate'
        ]
    },
    {
        id: 'social-media',
        name: 'Social Media Post',
        description: 'Engaging posts for Facebook, Instagram, and LinkedIn',
        icon: MessageSquare,
        category: 'social',
        fields: [
            { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'All platforms'] },
            { name: 'content_type', label: 'Content Type', type: 'select', required: true, options: ['Market update', 'Property highlight', 'Tips & advice', 'Personal story', 'Industry news'] },
            { name: 'tone', label: 'Tone', type: 'select', required: true, options: ['Professional', 'Casual', 'Inspirational', 'Educational'] },
            { name: 'include_hashtags', label: 'Include Hashtags', type: 'select', required: true, options: ['Yes', 'No'] },
            { name: 'call_to_action', label: 'Call to Action', type: 'select', required: false, options: ['Contact me', 'Learn more', 'Schedule consultation', 'Visit website', 'Share your thoughts'] }
        ],
        prompts: [
            'Just sold another home in [neighborhood]! Market insights',
            'Home staging tip that adds $10k+ to your sale price',
            'Why working with a local agent matters',
            'Market update: What buyers need to know right now',
            'Behind the scenes of a successful closing'
        ]
    },
    {
        id: 'market-update',
        name: 'Market Update',
        description: 'Data-driven market analysis and reports',
        icon: TrendingUp,
        category: 'marketing',
        fields: [
            { name: 'location', label: 'Market Area', type: 'text', required: true, placeholder: 'e.g., Downtown Springfield' },
            { name: 'time_period', label: 'Time Period', type: 'select', required: true, options: ['Monthly', 'Quarterly', 'Year-over-year'] },
            { name: 'focus', label: 'Focus Area', type: 'select', required: true, options: ['Overall market', 'Buyer trends', 'Seller trends', 'Price analysis', 'Inventory levels'] },
            { name: 'audience', label: 'Audience', type: 'select', required: true, options: ['General public', 'Potential buyers', 'Potential sellers', 'Investors'] }
        ],
        prompts: [
            'Q4 2024 market recap and 2025 predictions',
            'Why inventory is low and what it means for buyers',
            'Interest rate impact on local home sales',
            'Best neighborhoods for first-time buyers',
            'Investment opportunities in the current market'
        ]
    },
    {
        id: 'video-script',
        name: 'Video Script',
        description: 'Scripts for property tours, market updates, and educational videos',
        icon: Video,
        category: 'video',
        fields: [
            { name: 'video_type', label: 'Video Type', type: 'select', required: true, options: ['Property tour', 'Market update', 'Educational', 'Personal introduction', 'Testimonial'] },
            { name: 'duration', label: 'Target Duration', type: 'select', required: true, options: ['30 seconds', '1 minute', '2-3 minutes', '5+ minutes'] },
            { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['YouTube', 'Instagram Reels', 'TikTok', 'Facebook', 'Website'] },
            { name: 'topic', label: 'Topic/Property', type: 'text', required: true, placeholder: 'e.g., 123 Main St tour or Home buying process' }
        ],
        prompts: [
            'Property walkthrough highlighting key features',
            '60-second market update for social media',
            'Why choose me as your real estate agent',
            'Home buying process explained simply',
            'Neighborhood spotlight and amenities tour'
        ]
    },
    {
        id: 'email-campaign',
        name: 'Email Campaign',
        description: 'Professional email newsletters and campaigns',
        icon: AtSign,
        category: 'email',
        fields: [
            { name: 'campaign_type', label: 'Campaign Type', type: 'select', required: true, options: ['Newsletter', 'Market update', 'New listing', 'Follow-up', 'Holiday greeting'] },
            { name: 'audience', label: 'Audience', type: 'select', required: true, options: ['All contacts', 'Past clients', 'Potential buyers', 'Potential sellers', 'Sphere of influence'] },
            { name: 'tone', label: 'Tone', type: 'select', required: true, options: ['Professional', 'Personal', 'Informative', 'Promotional'] },
            { name: 'subject_focus', label: 'Subject Focus', type: 'text', required: false, placeholder: 'Main topic or property address' }
        ],
        prompts: [
            'Monthly market newsletter with local insights',
            'New listing announcement with virtual tour',
            'Holiday greetings with year-end market recap',
            'Follow-up email for recent home viewers',
            'Seller tips to maximize home value'
        ]
    }
];

const CONTENT_SUGGESTIONS = {
    trending: [
        'Spring 2024 home buying trends',
        'How AI is changing real estate',
        'Sustainable home features buyers want',
        'Remote work impact on housing choices',
        'First-time buyer programs available now'
    ],
    seasonal: [
        'Spring home selling checklist',
        'Summer market predictions',
        'Fall home maintenance tips',
        'Winter real estate opportunities',
        'Holiday home staging ideas'
    ],
    local: [
        'New developments in [your city]',
        'School district guide for families',
        'Best neighborhoods for young professionals',
        'Investment properties with high ROI',
        'Local market vs national trends'
    ]
};

export default function EnhancedStudioWritePage() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'create' | 'templates' | 'suggestions' | 'analytics'>('create');
    const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [recentContent, setRecentContent] = useState<any[]>([]);

    // Initialize with template from URL params
    useEffect(() => {
        const templateId = searchParams.get('template');
        if (templateId) {
            const template = CONTENT_TEMPLATES.find(t => t.id === templateId);
            if (template) {
                setSelectedTemplate(template);
                setActiveTab('create');
            }
        }
    }, [searchParams]);

    // Load recent content
    useEffect(() => {
        if (user) {
            loadRecentContent();
        }
    }, [user]);

    const loadRecentContent = async () => {
        try {
            // Mock recent content - replace with actual API call
            const mockContent = [
                {
                    id: '1',
                    type: 'Blog Post',
                    title: 'Spring Home Buying Tips',
                    createdAt: '2024-01-10T10:00:00Z',
                    performance: { views: 245, shares: 12, engagement: 8.5 }
                },
                {
                    id: '2',
                    type: 'Social Media',
                    title: 'Market Update Post',
                    createdAt: '2024-01-09T15:30:00Z',
                    performance: { views: 89, shares: 5, engagement: 12.3 }
                }
            ];
            setRecentContent(mockContent);
        } catch (error) {
            console.error('Failed to load recent content:', error);
        }
    };

    const handleTemplateSelect = (template: ContentTemplate) => {
        setSelectedTemplate(template);
        setFormData({});
        setGeneratedContent(null);
        setActiveTab('create');
    };

    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleGenerate = async () => {
        if (!selectedTemplate) return;

        // Validate required fields
        const missingFields = selectedTemplate.fields
            .filter(field => field.required && !formData[field.name])
            .map(field => field.label);

        if (missingFields.length > 0) {
            toast({
                title: "Missing required fields",
                description: `Please fill in: ${missingFields.join(', ')}`,
                variant: "destructive"
            });
            return;
        }

        setIsGenerating(true);
        try {
            let result;
            const formDataObj = new FormData();
            
            // Add form data to FormData object
            Object.entries(formData).forEach(([key, value]) => {
                formDataObj.append(key, value.toString());
            });

            switch (selectedTemplate.id) {
                case 'blog-post':
                    formDataObj.append('topic', formData.topic);
                    formDataObj.append('audience', formData.audience);
                    formDataObj.append('tone', formData.tone);
                    result = await generateBlogPostAction(null, formDataObj);
                    break;
                case 'social-media':
                    formDataObj.append('platform', formData.platform);
                    formDataObj.append('content_type', formData.content_type);
                    formDataObj.append('tone', formData.tone);
                    result = await generateSocialPostAction(null, formDataObj);
                    break;
                case 'market-update':
                    formDataObj.append('location', formData.location);
                    formDataObj.append('time_period', formData.time_period);
                    result = await generateMarketUpdateAction(null, formDataObj);
                    break;
                case 'video-script':
                    formDataObj.append('video_type', formData.video_type);
                    formDataObj.append('duration', formData.duration);
                    formDataObj.append('topic', formData.topic);
                    result = await generateVideoScriptAction(null, formDataObj);
                    break;
                default:
                    throw new Error('Unsupported template type');
            }

            if (result.data) {
                let content = '';
                
                // Handle different response structures
                if (typeof result.data === 'string') {
                    content = result.data;
                } else if (typeof result.data === 'object' && result.data !== null) {
                    // Try different possible content properties
                    content = (result.data as any).content || 
                             (result.data as any).post || 
                             (result.data as any).script || 
                             (result.data as any).update ||
                             (result.data as any).description ||
                             '';
                }
                
                const wordCount = content.split(' ').length;
                const readingTime = Math.ceil(wordCount / 200);
                
                setGeneratedContent({
                    type: selectedTemplate.name,
                    title: formData.topic || `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
                    content,
                    metadata: {
                        wordCount,
                        readingTime,
                        seoScore: Math.floor(Math.random() * 40) + 60, // Mock SEO score
                        hashtags: extractHashtags(content),
                        mentions: extractMentions(content)
                    },
                    suggestions: [
                        'Consider adding more local market data',
                        'Include a call-to-action at the end',
                        'Add relevant hashtags for social media',
                        'Consider creating a video version'
                    ]
                });

                toast({
                    title: "Content generated successfully",
                    description: `Your ${selectedTemplate.name.toLowerCase()} is ready!`,
                    variant: "success"
                });
            }
        } catch (error) {
            console.error('Generation failed:', error);
            toast({
                title: "Generation failed",
                description: "Please try again or contact support.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveContent = async () => {
        if (!generatedContent) return;

        try {
            const result = await saveContentAction(
                user?.id || '',
                generatedContent.content,
                selectedTemplate?.id || 'content',
                generatedContent.title
            );

            if (result.data) {
                setShowSaveDialog(false);
                toast({
                    title: "Content saved",
                    description: "Your content has been saved to the library.",
                    variant: "success"
                });
                loadRecentContent(); // Refresh recent content
            }
        } catch (error) {
            toast({
                title: "Failed to save content",
                description: "Please try again later.",
                variant: "destructive"
            });
        }
    };

    const handleCopyContent = () => {
        if (generatedContent) {
            navigator.clipboard.writeText(generatedContent.content);
            toast({
                title: "Content copied",
                description: "Content has been copied to clipboard.",
                variant: "success"
            });
        }
    };

    const extractHashtags = (content: string): string[] => {
        const hashtags = content.match(/#\w+/g) || [];
        return hashtags.slice(0, 10); // Limit to 10 hashtags
    };

    const extractMentions = (content: string): string[] => {
        const mentions = content.match(/@\w+/g) || [];
        return mentions.slice(0, 5); // Limit to 5 mentions
    };

    const contentStats = useMemo(() => {
        const totalContent = recentContent.length;
        const totalViews = recentContent.reduce((sum, content) => sum + (content.performance?.views || 0), 0);
        const avgEngagement = totalContent > 0 ? 
            recentContent.reduce((sum, content) => sum + (content.performance?.engagement || 0), 0) / totalContent : 0;

        return { totalContent, totalViews, avgEngagement };
    }, [recentContent]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Content Studio"
                description="Create professional content with AI-powered writing assistance"
                icon={PenTool}
                actions={
                    <div className="flex gap-2">
                        {generatedContent && (
                            <>
                                <Button variant="outline" onClick={handleCopyContent}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy
                                </Button>
                                <Button onClick={() => setShowSaveDialog(true)}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save to Library
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            {/* Content Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{contentStats.totalContent}</div>
                        <div className="text-sm text-muted-foreground">Content Created</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{contentStats.totalViews}</div>
                        <div className="text-sm text-muted-foreground">Total Views</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">{contentStats.avgEngagement.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Avg Engagement</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'create' | 'templates' | 'suggestions' | 'analytics')}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="create">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Create Content
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="suggestions">
                        <Lightbulb className="mr-2 h-4 w-4" />
                        Suggestions
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Content Creation Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {!selectedTemplate ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Choose a Content Type</CardTitle>
                                        <CardDescription>
                                            Select the type of content you want to create
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {CONTENT_TEMPLATES.map((template) => (
                                                <Card 
                                                    key={template.id} 
                                                    className="hover:shadow-md transition-shadow cursor-pointer"
                                                    onClick={() => handleTemplateSelect(template)}
                                                >
                                                    <CardContent className="pt-6">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <template.icon className="h-8 w-8 text-primary" />
                                                            <div>
                                                                <h3 className="font-semibold">{template.name}</h3>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {template.category}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {template.description}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    {/* Template Form */}
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <selectedTemplate.icon className="h-6 w-6 text-primary" />
                                                    <div>
                                                        <CardTitle>{selectedTemplate.name}</CardTitle>
                                                        <CardDescription>{selectedTemplate.description}</CardDescription>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => setSelectedTemplate(null)}
                                                >
                                                    Change Type
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {selectedTemplate.fields.map((field) => (
                                                <div key={field.name}>
                                                    <Label htmlFor={field.name}>
                                                        {field.label}
                                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                                    </Label>
                                                    {field.type === 'text' && (
                                                        <Input
                                                            id={field.name}
                                                            value={formData[field.name] || ''}
                                                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                            placeholder={field.placeholder}
                                                        />
                                                    )}
                                                    {field.type === 'textarea' && (
                                                        <Textarea
                                                            id={field.name}
                                                            value={formData[field.name] || ''}
                                                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                            placeholder={field.placeholder}
                                                            rows={3}
                                                        />
                                                    )}
                                                    {field.type === 'select' && (
                                                        <Select 
                                                            value={formData[field.name] || ''} 
                                                            onValueChange={(value) => handleFieldChange(field.name, value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {field.options?.map((option) => (
                                                                    <SelectItem key={option} value={option}>
                                                                        {option}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                    {field.type === 'number' && (
                                                        <Input
                                                            id={field.name}
                                                            type="number"
                                                            value={formData[field.name] || ''}
                                                            onChange={(e) => handleFieldChange(field.name, Number(e.target.value))}
                                                            placeholder={field.placeholder}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            <div className="flex justify-end pt-4">
                                                <Button 
                                                    onClick={handleGenerate} 
                                                    disabled={isGenerating}
                                                    className="min-w-32"
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="mr-2 h-4 w-4" />
                                                            Generate Content
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Quick Prompts */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Lightbulb className="h-5 w-5" />
                                                Quick Prompts
                                            </CardTitle>
                                            <CardDescription>
                                                Popular {selectedTemplate.name.toLowerCase()} ideas to get you started
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-2">
                                                {selectedTemplate.prompts.map((prompt, index) => (
                                                    <Button
                                                        key={index}
                                                        variant="ghost"
                                                        className="justify-start h-auto p-3 text-left"
                                                        onClick={() => {
                                                            const topicField = selectedTemplate.fields.find(f => f.name === 'topic');
                                                            if (topicField) {
                                                                handleFieldChange('topic', prompt);
                                                            }
                                                        }}
                                                    >
                                                        <div className="text-sm">{prompt}</div>
                                                    </Button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {/* Generated Content */}
                            {generatedContent && (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                Generated {generatedContent.type}
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={handleCopyContent}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copy
                                                </Button>
                                                <Button size="sm" onClick={() => setShowSaveDialog(true)}>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Word Count</div>
                                                    <div className="font-semibold">{generatedContent.metadata.wordCount}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Reading Time</div>
                                                    <div className="font-semibold">{generatedContent.metadata.readingTime} min</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground">SEO Score</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold">{generatedContent.metadata.seoScore}/100</div>
                                                        <Progress value={generatedContent.metadata.seoScore} className="w-16 h-2" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Hashtags</div>
                                                    <div className="font-semibold">{generatedContent.metadata.hashtags?.length || 0}</div>
                                                </div>
                                            </div>
                                            <div className="prose max-w-none">
                                                <div className="whitespace-pre-wrap">{generatedContent.content}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Recent Content */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Recent Content
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recentContent.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No recent content</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentContent.slice(0, 5).map((content) => (
                                                <div key={content.id} className="p-3 border rounded-lg">
                                                    <h4 className="font-medium text-sm mb-1">{content.title}</h4>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>{content.type}</span>
                                                        <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {content.performance && (
                                                        <div className="flex items-center gap-3 mt-2 text-xs">
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="h-3 w-3" />
                                                                {content.performance.views}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Share2 className="h-3 w-3" />
                                                                {content.performance.shares}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <ThumbsUp className="h-3 w-3" />
                                                                {content.performance.engagement}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Content Suggestions */}
                            {generatedContent && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="h-5 w-5" />
                                            Suggestions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {generatedContent.suggestions.map((suggestion, index) => (
                                                <div key={index} className="flex items-start gap-2">
                                                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm">{suggestion}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Templates</CardTitle>
                            <CardDescription>
                                Choose from our library of professional content templates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {CONTENT_TEMPLATES.map((template) => (
                                    <Card 
                                        key={template.id} 
                                        className="hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => handleTemplateSelect(template)}
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-3 mb-3">
                                                <template.icon className="h-8 w-8 text-primary" />
                                                <div>
                                                    <h3 className="font-semibold">{template.name}</h3>
                                                    <Badge variant="outline" className="text-xs">
                                                        {template.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {template.description}
                                            </p>
                                            <div className="text-xs text-muted-foreground">
                                                {template.fields.length} fields • {template.prompts.length} prompts
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-4">
                    <div className="grid gap-6">
                        {Object.entries(CONTENT_SUGGESTIONS).map(([category, suggestions]) => (
                            <Card key={category}>
                                <CardHeader>
                                    <CardTitle className="capitalize">{category} Content Ideas</CardTitle>
                                    <CardDescription>
                                        {category === 'trending' && 'Popular topics in real estate right now'}
                                        {category === 'seasonal' && 'Timely content for the current season'}
                                        {category === 'local' && 'Location-specific content ideas'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-2">
                                        {suggestions.map((suggestion, index) => (
                                            <Button
                                                key={index}
                                                variant="ghost"
                                                className="justify-start h-auto p-3 text-left"
                                                onClick={() => {
                                                    // Auto-select blog post template and fill topic
                                                    const blogTemplate = CONTENT_TEMPLATES.find(t => t.id === 'blog-post');
                                                    if (blogTemplate) {
                                                        setSelectedTemplate(blogTemplate);
                                                        setFormData({ topic: suggestion });
                                                        setActiveTab('create');
                                                    }
                                                }}
                                            >
                                                <div>
                                                    <div className="font-medium">{suggestion}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Click to create content
                                                    </div>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Performance</CardTitle>
                            <CardDescription>
                                Track how your content is performing across platforms
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentContent.length === 0 ? (
                                <div className="text-center py-12">
                                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
                                    <p className="text-muted-foreground">
                                        Create some content to see performance analytics here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 border rounded-lg text-center">
                                            <div className="text-2xl font-bold text-blue-600">{contentStats.totalViews}</div>
                                            <div className="text-sm text-muted-foreground">Total Views</div>
                                        </div>
                                        <div className="p-4 border rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-600">{contentStats.avgEngagement.toFixed(1)}%</div>
                                            <div className="text-sm text-muted-foreground">Avg Engagement</div>
                                        </div>
                                        <div className="p-4 border rounded-lg text-center">
                                            <div className="text-2xl font-bold text-purple-600">{contentStats.totalContent}</div>
                                            <div className="text-sm text-muted-foreground">Content Pieces</div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Recent Performance</h4>
                                        {recentContent.map((content) => (
                                            <div key={content.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h5 className="font-medium">{content.title}</h5>
                                                    <Badge variant="outline">{content.type}</Badge>
                                                </div>
                                                {content.performance && (
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <div className="text-muted-foreground">Views</div>
                                                            <div className="font-semibold">{content.performance.views}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground">Shares</div>
                                                            <div className="font-semibold">{content.performance.shares}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground">Engagement</div>
                                                            <div className="font-semibold">{content.performance.engagement}%</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Content Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Content to Library</DialogTitle>
                        <DialogDescription>
                            Save this content to your library for future reference and sharing.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="save-title">Title</Label>
                            <Input
                                id="save-title"
                                value={generatedContent?.title || ''}
                                onChange={(e) => {
                                    if (generatedContent) {
                                        setGeneratedContent({
                                            ...generatedContent,
                                            title: e.target.value
                                        });
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <Label>Content Type</Label>
                            <div className="text-sm text-muted-foreground">
                                {generatedContent?.type}
                            </div>
                        </div>
                        <div>
                            <Label>Content Preview</Label>
                            <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto border rounded p-2">
                                {generatedContent?.content.substring(0, 200)}...
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveContent}>
                            Save to Library
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}