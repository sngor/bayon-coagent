'use client';

import { useState } from 'react';
import {
    IntelligentEmptyState,
    type SmartRecommendation,
    type ProfileCompletionStatus
} from '@/components/ui/empty-states';
import {
    Sparkles,
    FileText,
    Shield,
    Users,
    TrendingUp,
    Calendar,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Intelligent Empty State Demo Page
 * Demonstrates the enhanced empty state component with:
 * - Contextual guidance based on profile completion
 * - Smart recommendations for missing data
 * - Visual progress indicators
 * - Progressive disclosure of information
 * 
 * Requirements: 27.2, 27.4, 27.7
 */
export default function IntelligentEmptyStateDemoPage() {
    const [profileCompletion, setProfileCompletion] = useState(40);

    // Mock profile completion status
    const mockProfileCompletion: ProfileCompletionStatus = {
        percentage: profileCompletion,
        isComplete: profileCompletion === 100,
        hasRequiredFields: profileCompletion >= 60,
        missingFields: [
            { key: 'name', label: 'Full Name', benefit: 'Personalizes your marketing content', required: true },
            { key: 'phone', label: 'Phone Number', benefit: 'Enables NAP consistency checks', required: true },
            { key: 'bio', label: 'Professional Bio', benefit: 'Enhances your E-E-A-T profile', required: true },
        ],
        nextField: {
            key: 'name',
            label: 'Full Name',
            benefit: 'Personalizes your marketing content',
            required: true
        },
    };

    // Mock recommendations - incomplete profile
    const incompleteProfileRecommendations: SmartRecommendation[] = [
        {
            id: 'complete-profile',
            title: 'Complete Your Profile',
            description: 'Fill in required fields to unlock AI-powered features',
            href: '/profile',
            priority: 'high',
            estimatedTime: '5 min',
            prerequisitesMet: true,
        },
    ];

    // Mock recommendations - complete profile
    const completeProfileRecommendations: SmartRecommendation[] = [
        {
            id: 'generate-plan',
            title: 'Generate Marketing Plan',
            description: 'Create a personalized 3-step marketing strategy',
            href: '/marketing-plan',
            priority: 'high',
            icon: <Sparkles className="w-5 h-5" />,
            estimatedTime: '2 min',
            prerequisitesMet: true,
        },
        {
            id: 'run-audit',
            title: 'Run Brand Audit',
            description: 'Check your NAP consistency across the web',
            href: '/brand-audit',
            priority: 'high',
            icon: <Shield className="w-5 h-5" />,
            estimatedTime: '3 min',
            prerequisitesMet: true,
        },
        {
            id: 'analyze-competitors',
            title: 'Analyze Competitors',
            description: 'Discover and analyze your local competition',
            href: '/competitive-analysis',
            priority: 'medium',
            icon: <Users className="w-5 h-5" />,
            estimatedTime: '5 min',
            prerequisitesMet: true,
        },
        {
            id: 'create-content',
            title: 'Create Your First Content',
            description: 'Generate blog posts, social media content, and more',
            href: '/content-engine',
            priority: 'medium',
            icon: <FileText className="w-5 h-5" />,
            estimatedTime: '3 min',
            prerequisitesMet: true,
        },
    ];

    // Mock recommendations with blocked items
    const mixedRecommendations: SmartRecommendation[] = [
        {
            id: 'generate-plan',
            title: 'Generate Marketing Plan',
            description: 'Create a personalized 3-step marketing strategy',
            href: '/marketing-plan',
            priority: 'high',
            estimatedTime: '2 min',
            prerequisitesMet: true,
        },
        {
            id: 'track-rankings',
            title: 'Track Keyword Rankings',
            description: 'Monitor your position against competitors',
            href: '/competitive-analysis',
            priority: 'medium',
            estimatedTime: '2 min',
            prerequisitesMet: false,
            prerequisites: [
                {
                    description: 'You must have analyzed competitors first',
                    met: false,
                    actionHref: '/competitive-analysis',
                    actionLabel: 'Analyze Competitors',
                },
            ],
        },
        {
            id: 'schedule-content',
            title: 'Schedule Your Content',
            description: 'Plan when to publish your generated content',
            href: '/content-engine',
            priority: 'low',
            estimatedTime: '5 min',
            prerequisitesMet: false,
            prerequisites: [
                {
                    description: 'You must have created content first',
                    met: false,
                    actionHref: '/content-engine',
                    actionLabel: 'Create Content',
                },
            ],
        },
    ];

    const contextualTips = [
        'Complete your profile to unlock all AI-powered features',
        'Start with high-priority actions for maximum impact',
        'Each feature includes estimated completion time',
        'Prerequisites are automatically checked before you begin',
    ];

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                    Intelligent Empty States Demo
                </h1>
                <p className="text-lg text-muted-foreground">
                    Enhanced empty states with contextual guidance, smart recommendations, and visual progress indicators
                </p>
            </div>

            {/* Profile Completion Control */}
            <Card>
                <CardHeader>
                    <CardTitle>Demo Controls</CardTitle>
                    <CardDescription>
                        Adjust profile completion to see different states
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="profile-completion-slider" className="text-sm font-medium">
                            Profile Completion: {profileCompletion}%
                        </label>
                        <input
                            id="profile-completion-slider"
                            type="range"
                            min="0"
                            max="100"
                            step="20"
                            value={profileCompletion}
                            onChange={(e) => setProfileCompletion(Number(e.target.value))}
                            className="flex-1"
                            aria-label="Profile completion percentage"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProfileCompletion(0)}
                        >
                            0% (New User)
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProfileCompletion(40)}
                        >
                            40% (Incomplete)
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProfileCompletion(60)}
                        >
                            60% (Required Complete)
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProfileCompletion(100)}
                        >
                            100% (Complete)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Demo Tabs */}
            <Tabs defaultValue="incomplete" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="incomplete">Incomplete Profile</TabsTrigger>
                    <TabsTrigger value="complete">Complete Profile</TabsTrigger>
                    <TabsTrigger value="mixed">Mixed State</TabsTrigger>
                    <TabsTrigger value="minimal">Minimal</TabsTrigger>
                </TabsList>

                {/* Incomplete Profile State */}
                <TabsContent value="incomplete" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Marketing Plan - Incomplete Profile</CardTitle>
                            <CardDescription>
                                Shows profile completion progress and blocks access until requirements are met
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IntelligentEmptyState
                                icon={<Sparkles className="w-8 h-8 text-primary" />}
                                title="No Marketing Plan Yet"
                                description="Generate a personalized 3-step marketing strategy powered by AI. Complete your profile to get started."
                                recommendations={incompleteProfileRecommendations}
                                profileCompletion={mockProfileCompletion}
                                contextualTips={[
                                    'Your marketing plan will be tailored to your market and experience',
                                    'Each step includes actionable tasks and tool recommendations',
                                    'Plans are generated in under 2 minutes',
                                ]}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Complete Profile State */}
                <TabsContent value="complete" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dashboard - Complete Profile</CardTitle>
                            <CardDescription>
                                Shows multiple high-priority recommendations when profile is complete
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IntelligentEmptyState
                                icon={<TrendingUp className="w-8 h-8 text-primary" />}
                                title="Welcome to Your Dashboard"
                                description="You're all set! Here are the recommended next steps to maximize your marketing impact."
                                recommendations={completeProfileRecommendations}
                                contextualTips={contextualTips}
                                primaryAction={{
                                    label: 'Get Started',
                                    onClick: () => alert('Primary action clicked!'),
                                    variant: 'default',
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Mixed State */}
                <TabsContent value="mixed" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Engine - Mixed State</CardTitle>
                            <CardDescription>
                                Shows available actions and locked features with prerequisites
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IntelligentEmptyState
                                icon={<FileText className="w-8 h-8 text-primary" />}
                                title="No Content Yet"
                                description="Start creating high-quality marketing content with AI assistance. Some features require prerequisites."
                                recommendations={mixedRecommendations}
                                contextualTips={[
                                    'Generate blog posts, social media content, and more',
                                    'All content is saved to your library automatically',
                                    'Unlock advanced features by completing prerequisites',
                                ]}
                                primaryAction={{
                                    label: 'Create Content',
                                    onClick: () => alert('Create content clicked!'),
                                    variant: 'default',
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Minimal State */}
                <TabsContent value="minimal" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Research Agent - Minimal</CardTitle>
                            <CardDescription>
                                Simple empty state without recommendations or profile checks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IntelligentEmptyState
                                icon={<Search className="w-8 h-8 text-primary" />}
                                title="No Research Reports Yet"
                                description="Conduct deep-dive research on any real estate topic with AI-powered web search."
                                contextualTips={[
                                    'Be specific with your research topic for better results',
                                    'The AI will search the web and synthesize findings',
                                    'Save reports to your knowledge base for future reference',
                                ]}
                                primaryAction={{
                                    label: 'Start Research',
                                    onClick: () => alert('Start research clicked!'),
                                    variant: 'default',
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Feature Highlights */}
            <Card>
                <CardHeader>
                    <CardTitle>Features</CardTitle>
                    <CardDescription>
                        What makes these empty states intelligent
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                Contextual Guidance
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Recommendations adapt based on profile completion, existing data, and current page context
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Smart Prioritization
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Actions are prioritized by impact and automatically ordered by importance
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary" />
                                Prerequisite Checking
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Locked features show clear prerequisites and guide users to complete them
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                Visual Progress
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Progress bars and completion percentages provide clear feedback on user's journey
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
