'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Brain,
    Sparkles,
    TrendingUp,
    Target,
    Image,
    Workflow,
    CheckCircle,
    ArrowRight,
    Play,
    Zap
} from 'lucide-react';

interface StrandsFeature {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    benefits: string[];
    demoAction?: () => void;
    hubLocation: string;
    isNew?: boolean;
}

export default function StrandsFeaturesOnboarding() {
    const router = useRouter();
    const [currentFeature, setCurrentFeature] = useState(0);
    const [completedFeatures, setCompletedFeatures] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const strandsFeatures: StrandsFeature[] = [
        {
            id: 'enhanced-research',
            title: 'Enhanced Research Agent',
            description: 'Get comprehensive market research with web search, trend analysis, and actionable recommendations in minutes.',
            icon: <Brain className="h-8 w-8 text-blue-600" />,
            benefits: [
                'Real-time web search integration',
                'Market trend analysis with confidence scoring',
                'Actionable recommendations for your target audience',
                'Professional research reports with citations',
                'Automatic saving to your Knowledge Base'
            ],
            hubLocation: 'Research Hub → Research Agent',
        },
        {
            id: 'content-studio',
            title: 'Intelligent Content Studio',
            description: 'Create platform-optimized content with SEO, hashtags, and market intelligence built-in.',
            icon: <Sparkles className="h-8 w-8 text-purple-600" />,
            benefits: [
                'Platform-specific optimization (LinkedIn, Facebook, Instagram)',
                'Automatic SEO keyword generation',
                'Smart hashtag recommendations',
                'Market-aware content creation',
                'Multiple content variations'
            ],
            hubLocation: 'Studio Hub → Write',
        },
        {
            id: 'listing-optimization',
            title: 'Persona-Aware Listing Descriptions',
            description: 'Generate buyer-targeted listing descriptions with market intelligence and competitive positioning.',
            icon: <Target className="h-8 w-8 text-green-600" />,
            benefits: [
                'Buyer persona analysis and targeting',
                'Local market intelligence integration',
                'Competitive positioning insights',
                'SEO optimization for MLS platforms',
                'Neighborhood insights and amenities'
            ],
            hubLocation: 'Studio Hub → Describe',
        },
        {
            id: 'market-intelligence',
            title: 'Advanced Market Intelligence',
            description: 'Comprehensive market analysis with trend forecasting, opportunity identification, and predictive modeling.',
            icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
            benefits: [
                'Predictive market trend analysis',
                'Investment opportunity identification',
                'Competitive landscape assessment',
                'Market metrics and performance tracking',
                'Future forecasting with confidence scores'
            ],
            hubLocation: 'Market Hub → Insights',
        },
        {
            id: 'brand-strategy',
            title: 'Brand Strategy Agent',
            description: 'Complete marketing plans with competitive analysis, positioning, and implementation roadmaps.',
            icon: <Zap className="h-8 w-8 text-red-600" />,
            benefits: [
                'Comprehensive marketing plan generation',
                'Competitive landscape research',
                'Brand positioning and differentiation',
                'SWOT analysis and strategic recommendations',
                'Implementation roadmap with timelines'
            ],
            hubLocation: 'Brand Hub → Strategy',
            isNew: true,
        },
        {
            id: 'image-analysis',
            title: 'AI Image Analysis & Enhancement',
            description: 'Professional image analysis with virtual staging, enhancement suggestions, and marketing optimization.',
            icon: <Image className="h-8 w-8 text-indigo-600" />,
            benefits: [
                'Property feature detection and analysis',
                'Virtual staging recommendations',
                'Image enhancement suggestions',
                'Day-to-dusk conversion capabilities',
                'Marketing optimization recommendations'
            ],
            hubLocation: 'Studio Hub → Reimagine',
            isNew: true,
        },
        {
            id: 'workflow-orchestration',
            title: 'Multi-Agent Workflows',
            description: 'Orchestrated workflows that combine multiple AI agents for comprehensive task completion.',
            icon: <Workflow className="h-8 w-8 text-teal-600" />,
            benefits: [
                'Content Campaign: Research → Blog → Social → Market Analysis',
                'Listing Optimization: Market → Competition → Description → Images',
                'Brand Building: Research → Positioning → Strategy → Content',
                'Investment Analysis: Research → Trends → Opportunities → ROI',
                'Automatic workflow progress tracking'
            ],
            hubLocation: 'Available across all hubs',
            isNew: true,
        },
    ];

    const progress = ((currentFeature + 1) / strandsFeatures.length) * 100;

    const handleNext = () => {
        if (currentFeature < strandsFeatures.length - 1) {
            setCurrentFeature(currentFeature + 1);
        }
    };

    const handlePrevious = () => {
        if (currentFeature > 0) {
            setCurrentFeature(currentFeature - 1);
        }
    };

    const handleTryFeature = async (feature: StrandsFeature) => {
        setIsLoading(true);

        // Mark feature as completed
        if (!completedFeatures.includes(feature.id)) {
            setCompletedFeatures([...completedFeatures, feature.id]);
        }

        // Navigate to the appropriate hub
        setTimeout(() => {
            setIsLoading(false);

            // Navigate based on feature
            switch (feature.id) {
                case 'enhanced-research':
                    router.push('/research/agent');
                    break;
                case 'content-studio':
                    router.push('/studio/write');
                    break;
                case 'listing-optimization':
                    router.push('/studio/describe');
                    break;
                case 'market-intelligence':
                    router.push('/market/insights');
                    break;
                case 'brand-strategy':
                    router.push('/brand/strategy');
                    break;
                case 'image-analysis':
                    router.push('/studio/reimagine');
                    break;
                case 'workflow-orchestration':
                    router.push('/test-strands-complete');
                    break;
                default:
                    router.push('/dashboard');
            }
        }, 1000);
    };

    const handleCompleteOnboarding = () => {
        router.push('/dashboard');
    };

    const currentFeatureData = strandsFeatures[currentFeature];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Brain className="h-8 w-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Enhanced AI Capabilities</h1>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Powered by Strands AI
                        </Badge>
                    </div>
                    <p className="text-lg text-gray-600 mb-6">
                        Discover the advanced AI features that will transform your real estate business
                    </p>

                    {/* Progress */}
                    <div className="max-w-md mx-auto">
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                            <span>Feature {currentFeature + 1} of {strandsFeatures.length}</span>
                            <span>{Math.round(progress)}% Complete</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>

                {/* Feature Card */}
                <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="text-center pb-4">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            {currentFeatureData.icon}
                            <CardTitle className="text-2xl text-gray-900">
                                {currentFeatureData.title}
                            </CardTitle>
                            {currentFeatureData.isNew && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    NEW
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="text-lg text-gray-600">
                            {currentFeatureData.description}
                        </CardDescription>
                        <div className="text-sm text-gray-500 mt-2">
                            📍 {currentFeatureData.hubLocation}
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* Benefits */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Key Benefits:</h3>
                            <div className="space-y-2">
                                {currentFeatureData.benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={() => handleTryFeature(currentFeatureData)}
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Try This Feature
                                    </>
                                )}
                            </Button>

                            {completedFeatures.includes(currentFeatureData.id) && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 self-center">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Explored
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between items-center mb-8">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentFeature === 0}
                        className="px-6"
                    >
                        Previous
                    </Button>

                    {/* Feature Dots */}
                    <div className="flex gap-2">
                        {strandsFeatures.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentFeature(index)}
                                className={`w-3 h-3 rounded-full transition-colors ${index === currentFeature
                                        ? 'bg-blue-600'
                                        : completedFeatures.includes(strandsFeatures[index].id)
                                            ? 'bg-green-500'
                                            : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    {currentFeature === strandsFeatures.length - 1 ? (
                        <Button
                            onClick={handleCompleteOnboarding}
                            className="bg-green-600 hover:bg-green-700 text-white px-6"
                        >
                            Complete Tour
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            className="px-6"
                        >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>

                {/* Summary Stats */}
                <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold mb-2">7</div>
                                <div className="text-blue-100">AI Agents</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-2">75%</div>
                                <div className="text-blue-100">Faster Content Creation</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-2">100%</div>
                                <div className="text-blue-100">Backward Compatible</div>
                            </div>
                        </div>

                        <div className="text-center mt-6">
                            <p className="text-blue-100 mb-4">
                                All enhanced features include automatic fallback to ensure reliability
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/test-strands-complete')}
                                className="bg-white text-blue-600 hover:bg-blue-50"
                            >
                                <Workflow className="h-4 w-4 mr-2" />
                                Test All Features
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}