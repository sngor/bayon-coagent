'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CheckCircle,
    BookOpen,
    Lightbulb,
    TrendingUp,
    Target,
    Users,
    MessageSquare,
    Camera,
    BarChart3,
    Sparkles,
    Search,
    Filter,
    ExternalLink,
    Clock,
    Star,
    ThumbsUp,
    Share2,
    Download,
    Bookmark,
    AlertTriangle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';
import { cn } from '@/lib/utils';

type BestPractice = {
    id: string;
    title: string;
    description: string;
    category: 'content' | 'marketing' | 'client-relations' | 'technology' | 'business';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    readTime: number; // in minutes
    rating: number;
    votes: number;
    tags: string[];
    isBookmarked: boolean;
    publishedAt: string;
    lastUpdated: string;
    author: string;
    content: {
        overview: string;
        keyPoints: string[];
        actionItems: string[];
        commonMistakes: string[];
        resources: Array<{
            title: string;
            url: string;
            type: 'article' | 'video' | 'tool' | 'template';
        }>;
    };
};

const practiceCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'content', label: 'Content Creation' },
    { value: 'marketing', label: 'Marketing & Branding' },
    { value: 'client-relations', label: 'Client Relations' },
    { value: 'technology', label: 'Technology & Tools' },
    { value: 'business', label: 'Business Development' },
];

const mockBestPractices: BestPractice[] = [
    {
        id: 'ai-content-optimization',
        title: 'Optimizing AI-Generated Content for Maximum Engagement',
        description: 'Learn how to refine and enhance AI-generated content to create compelling, authentic marketing materials that resonate with your audience.',
        category: 'content',
        difficulty: 'Intermediate',
        readTime: 8,
        rating: 4.8,
        votes: 156,
        tags: ['AI Tools', 'Content Strategy', 'Engagement', 'Optimization'],
        isBookmarked: true,
        publishedAt: '2024-01-20',
        lastUpdated: '2024-01-20',
        author: 'Sarah Johnson',
        content: {
            overview: 'AI-generated content is a powerful tool, but it requires human refinement to truly connect with your audience. This guide covers proven techniques for optimizing AI output.',
            keyPoints: [
                'Always review and edit AI-generated content for accuracy and brand voice',
                'Add personal anecdotes and local market insights to make content authentic',
                'Use AI as a starting point, not the final product',
                'Optimize for SEO while maintaining readability and engagement',
                'Test different content formats to see what resonates with your audience'
            ],
            actionItems: [
                'Create a content review checklist for all AI-generated materials',
                'Develop a brand voice guide to ensure consistency',
                'Set up A/B testing for different content approaches',
                'Build a library of personal stories and local insights to incorporate',
                'Establish a content approval workflow'
            ],
            commonMistakes: [
                'Publishing AI content without human review',
                'Using generic content that could apply to any market',
                'Ignoring local SEO opportunities',
                'Not maintaining consistent brand voice',
                'Failing to fact-check AI-generated information'
            ],
            resources: [
                { title: 'Content Optimization Checklist', url: '#', type: 'template' },
                { title: 'Brand Voice Development Guide', url: '#', type: 'article' },
                { title: 'AI Content Review Process', url: '#', type: 'video' }
            ]
        }
    },
    {
        id: 'social-media-strategy',
        title: 'Building a Consistent Social Media Presence',
        description: 'Develop a sustainable social media strategy that builds your brand authority and generates quality leads over time.',
        category: 'marketing',
        difficulty: 'Beginner',
        readTime: 12,
        rating: 4.6,
        votes: 203,
        tags: ['Social Media', 'Brand Building', 'Lead Generation', 'Consistency'],
        isBookmarked: false,
        publishedAt: '2024-01-18',
        lastUpdated: '2024-01-18',
        author: 'Michael Chen',
        content: {
            overview: 'Consistency is key to social media success. Learn how to create a sustainable posting schedule and content strategy that builds long-term results.',
            keyPoints: [
                'Post consistently rather than frequently',
                'Focus on quality content that provides value',
                'Engage authentically with your community',
                'Share behind-the-scenes content to build trust',
                'Use local hashtags and location tags strategically'
            ],
            actionItems: [
                'Create a content calendar for the next 30 days',
                'Identify your top 3 social media platforms',
                'Develop content pillars for consistent messaging',
                'Set up social media scheduling tools',
                'Create templates for common post types'
            ],
            commonMistakes: [
                'Posting too frequently without strategy',
                'Only sharing listings without providing value',
                'Ignoring comments and engagement',
                'Using irrelevant or overused hashtags',
                'Not maintaining a consistent brand aesthetic'
            ],
            resources: [
                { title: 'Social Media Content Calendar Template', url: '#', type: 'template' },
                { title: 'Engagement Strategy Guide', url: '#', type: 'article' },
                { title: 'Social Media Analytics Tutorial', url: '#', type: 'video' }
            ]
        }
    },
    {
        id: 'client-communication',
        title: 'Mastering Client Communication in the Digital Age',
        description: 'Effective communication strategies that build trust, manage expectations, and create lasting client relationships.',
        category: 'client-relations',
        difficulty: 'Intermediate',
        readTime: 15,
        rating: 4.9,
        votes: 189,
        tags: ['Communication', 'Client Relations', 'Trust Building', 'Expectations'],
        isBookmarked: true,
        publishedAt: '2024-01-15',
        lastUpdated: '2024-01-16',
        author: 'Dr. Emily Rodriguez',
        content: {
            overview: 'Strong communication is the foundation of successful real estate relationships. Learn proven techniques for clear, effective client communication.',
            keyPoints: [
                'Set clear expectations from the first interaction',
                'Use multiple communication channels appropriately',
                'Provide regular updates even when there\'s no news',
                'Listen actively and ask clarifying questions',
                'Document important conversations and decisions'
            ],
            actionItems: [
                'Create a client communication timeline template',
                'Develop scripts for common scenarios',
                'Set up automated update systems',
                'Establish preferred communication methods with each client',
                'Create a client onboarding packet'
            ],
            commonMistakes: [
                'Assuming clients understand the process',
                'Only communicating when there are problems',
                'Using too much industry jargon',
                'Not confirming understanding',
                'Failing to document agreements'
            ],
            resources: [
                { title: 'Client Communication Templates', url: '#', type: 'template' },
                { title: 'Active Listening Techniques', url: '#', type: 'article' },
                { title: 'Difficult Conversation Management', url: '#', type: 'video' }
            ]
        }
    },
    {
        id: 'market-analysis-techniques',
        title: 'Advanced Market Analysis for Competitive Advantage',
        description: 'Leverage data and AI tools to conduct thorough market analysis that positions you as the local expert.',
        category: 'business',
        difficulty: 'Advanced',
        readTime: 20,
        rating: 4.7,
        votes: 134,
        tags: ['Market Analysis', 'Data Analytics', 'Competitive Intelligence', 'Expertise'],
        isBookmarked: false,
        publishedAt: '2024-01-12',
        lastUpdated: '2024-01-14',
        author: 'Robert Kim',
        content: {
            overview: 'Deep market analysis sets you apart from the competition. Learn advanced techniques for gathering, analyzing, and presenting market data.',
            keyPoints: [
                'Use multiple data sources for comprehensive analysis',
                'Identify leading and lagging market indicators',
                'Create visual presentations of market trends',
                'Develop neighborhood-specific expertise',
                'Track competitor activity and pricing strategies'
            ],
            actionItems: [
                'Set up automated market data collection',
                'Create monthly market analysis reports',
                'Develop neighborhood expertise profiles',
                'Build relationships with local data sources',
                'Create client-facing market update templates'
            ],
            commonMistakes: [
                'Relying on single data sources',
                'Presenting data without context',
                'Ignoring micro-market variations',
                'Not updating analysis regularly',
                'Overwhelming clients with too much data'
            ],
            resources: [
                { title: 'Market Analysis Template', url: '#', type: 'template' },
                { title: 'Data Visualization Best Practices', url: '#', type: 'article' },
                { title: 'Advanced Analytics Tutorial', url: '#', type: 'video' }
            ]
        }
    },
    {
        id: 'listing-photography',
        title: 'Professional Listing Photography on Any Budget',
        description: 'Create stunning property photos that sell homes faster, even with basic equipment and limited budget.',
        category: 'technology',
        difficulty: 'Beginner',
        readTime: 10,
        rating: 4.5,
        votes: 267,
        tags: ['Photography', 'Listings', 'Visual Marketing', 'Budget-Friendly'],
        isBookmarked: false,
        publishedAt: '2024-01-10',
        lastUpdated: '2024-01-10',
        author: 'Amanda Foster',
        content: {
            overview: 'Great listing photos don\'t require expensive equipment. Learn professional techniques that work with any camera or smartphone.',
            keyPoints: [
                'Lighting is more important than expensive equipment',
                'Composition and angles make the biggest difference',
                'Staging and preparation are crucial for great shots',
                'Consistency in style builds your brand',
                'Post-processing can enhance but not fix poor photos'
            ],
            actionItems: [
                'Create a pre-shoot checklist for property preparation',
                'Practice composition techniques in your own home',
                'Develop a consistent editing workflow',
                'Build a kit of basic photography accessories',
                'Create shot lists for different property types'
            ],
            commonMistakes: [
                'Shooting in poor lighting conditions',
                'Not preparing the space before shooting',
                'Using too many filters or heavy editing',
                'Inconsistent photo styles within a listing',
                'Not taking enough shots from different angles'
            ],
            resources: [
                { title: 'Photography Checklist', url: '#', type: 'template' },
                { title: 'Smartphone Photography Guide', url: '#', type: 'article' },
                { title: 'Lighting Techniques Tutorial', url: '#', type: 'video' }
            ]
        }
    },
    {
        id: 'lead-nurturing-automation',
        title: 'Automated Lead Nurturing That Feels Personal',
        description: 'Set up automated systems that nurture leads effectively while maintaining the personal touch that builds relationships.',
        category: 'technology',
        difficulty: 'Advanced',
        readTime: 18,
        rating: 4.8,
        votes: 145,
        tags: ['Lead Nurturing', 'Automation', 'CRM', 'Personalization'],
        isBookmarked: true,
        publishedAt: '2024-01-08',
        lastUpdated: '2024-01-09',
        author: 'Jessica Martinez',
        content: {
            overview: 'Automation can enhance, not replace, personal relationships. Learn to create automated systems that feel authentic and build genuine connections.',
            keyPoints: [
                'Segment leads based on behavior and preferences',
                'Create personalized content for different lead types',
                'Use triggers based on specific actions',
                'Maintain human touchpoints in automated sequences',
                'Regularly review and optimize automation performance'
            ],
            actionItems: [
                'Audit your current lead management process',
                'Set up lead scoring and segmentation',
                'Create email templates for different scenarios',
                'Implement behavioral triggers',
                'Schedule regular automation reviews'
            ],
            commonMistakes: [
                'Over-automating without human interaction',
                'Using generic messages for all leads',
                'Not testing automation sequences',
                'Ignoring lead feedback and preferences',
                'Setting up automation and forgetting to maintain it'
            ],
            resources: [
                { title: 'Lead Nurturing Workflow Templates', url: '#', type: 'template' },
                { title: 'CRM Setup Guide', url: '#', type: 'article' },
                { title: 'Automation Best Practices', url: '#', type: 'video' }
            ]
        }
    }
];

export default function LearningBestPracticesPage() {
    const { user } = useUser();
    const [practices, setPractices] = useState<BestPractice[]>(mockBestPractices);
    const [filteredPractices, setFilteredPractices] = useState<BestPractice[]>(mockBestPractices);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPractice, setSelectedPractice] = useState<BestPractice | null>(null);
    const [showPracticeDetail, setShowPracticeDetail] = useState(false);

    // Filter practices based on category and search
    useEffect(() => {
        let filtered = practices;

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(practice => practice.category === selectedCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(practice =>
                practice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                practice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                practice.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredPractices(filtered);
    }, [practices, selectedCategory, searchQuery]);

    const handleBookmark = (practiceId: string) => {
        setPractices(prev => prev.map(practice =>
            practice.id === practiceId
                ? { ...practice, isBookmarked: !practice.isBookmarked }
                : practice
        ));

        const practice = practices.find(p => p.id === practiceId);
        const isBookmarked = !practice?.isBookmarked;

        toast({
            title: isBookmarked ? 'Bookmarked!' : 'Bookmark Removed',
            description: isBookmarked
                ? 'Added to your bookmarked best practices.'
                : 'Removed from your bookmarks.',
        });
    };

    const handleVote = (practiceId: string) => {
        setPractices(prev => prev.map(practice =>
            practice.id === practiceId
                ? { ...practice, votes: practice.votes + 1 }
                : practice
        ));

        toast({
            title: 'Vote Recorded',
            description: 'Thank you for your feedback!',
        });
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'content': return <Sparkles className="h-4 w-4" />;
            case 'marketing': return <TrendingUp className="h-4 w-4" />;
            case 'client-relations': return <Users className="h-4 w-4" />;
            case 'technology': return <BarChart3 className="h-4 w-4" />;
            case 'business': return <Target className="h-4 w-4" />;
            default: return <BookOpen className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'content': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'marketing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'client-relations': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'technology': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
            case 'business': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'Intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'Advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'article': return <BookOpen className="h-4 w-4" />;
            case 'video': return <Camera className="h-4 w-4" />;
            case 'tool': return <BarChart3 className="h-4 w-4" />;
            case 'template': return <Download className="h-4 w-4" />;
            default: return <ExternalLink className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Best Practices</CardTitle>
                    <CardDescription>
                        Proven strategies and techniques from top-performing real estate professionals
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search best practices..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[200px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {practiceCategories.map((category) => (
                                        <SelectItem key={category.value} value={category.value}>
                                            {category.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Best Practices List */}
            <div className="space-y-4">
                {filteredPractices.map((practice) => (
                    <Card
                        key={practice.id}
                        className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-lg",
                            practice.isBookmarked && "ring-2 ring-primary/20"
                        )}
                        onClick={() => {
                            setSelectedPractice(practice);
                            setShowPracticeDetail(true);
                        }}
                    >
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg">{practice.title}</h3>
                                            {practice.isBookmarked && (
                                                <Bookmark className="h-4 w-4 text-primary fill-primary" />
                                            )}
                                        </div>
                                        <p className="text-muted-foreground line-clamp-2">{practice.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className={getCategoryColor(practice.category)}>
                                            {getCategoryIcon(practice.category)}
                                            <span className="ml-1 capitalize">{practice.category.replace('-', ' ')}</span>
                                        </Badge>
                                        <Badge className={getDifficultyColor(practice.difficulty)}>
                                            {practice.difficulty}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {practice.readTime}m read
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            {practice.rating}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <ThumbsUp className="h-4 w-4" />
                                            {practice.votes}
                                        </div>
                                        <div className="text-xs">
                                            by {practice.author}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        {practice.tags.slice(0, 3).map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {practice.tags.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{practice.tags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredPractices.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Search className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">No Best Practices Found</h3>
                                <p className="text-muted-foreground">
                                    Try adjusting your search or filter criteria to find relevant best practices.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Best Practice Detail Dialog */}
            <Dialog open={showPracticeDetail} onOpenChange={setShowPracticeDetail}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    {selectedPractice && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{selectedPractice.title}</DialogTitle>
                                <DialogDescription className="text-base">
                                    {selectedPractice.description}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-auto space-y-6">
                                {/* Practice Info */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Badge className={getCategoryColor(selectedPractice.category)}>
                                            {getCategoryIcon(selectedPractice.category)}
                                            <span className="ml-1 capitalize">{selectedPractice.category.replace('-', ' ')}</span>
                                        </Badge>
                                        <Badge className={getDifficultyColor(selectedPractice.difficulty)}>
                                            {selectedPractice.difficulty}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            {selectedPractice.readTime}m read
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBookmark(selectedPractice.id);
                                            }}
                                        >
                                            <Bookmark className={cn(
                                                "h-4 w-4",
                                                selectedPractice.isBookmarked && "fill-current"
                                            )} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleVote(selectedPractice.id);
                                            }}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            {selectedPractice.votes}
                                        </Button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-lg mb-3">Overview</h4>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {selectedPractice.content.overview}
                                        </p>
                                    </div>

                                    <Accordion type="multiple" className="w-full">
                                        <AccordionItem value="key-points">
                                            <AccordionTrigger className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb className="h-5 w-5" />
                                                    Key Points ({selectedPractice.content.keyPoints.length})
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <ul className="space-y-2">
                                                    {selectedPractice.content.keyPoints.map((point, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm">{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="action-items">
                                            <AccordionTrigger className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-5 w-5" />
                                                    Action Items ({selectedPractice.content.actionItems.length})
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <ul className="space-y-2">
                                                    {selectedPractice.content.actionItems.map((item, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                                                                <span className="text-xs font-semibold text-primary">{index + 1}</span>
                                                            </div>
                                                            <span className="text-sm">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="common-mistakes">
                                            <AccordionTrigger className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5" />
                                                    Common Mistakes ({selectedPractice.content.commonMistakes.length})
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <ul className="space-y-2">
                                                    {selectedPractice.content.commonMistakes.map((mistake, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm">{mistake}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="resources">
                                            <AccordionTrigger className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-5 w-5" />
                                                    Resources ({selectedPractice.content.resources.length})
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-2">
                                                    {selectedPractice.content.resources.map((resource, index) => (
                                                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                                                            <div className="flex-shrink-0">
                                                                {getResourceIcon(resource.type)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">{resource.title}</div>
                                                                <div className="text-xs text-muted-foreground capitalize">{resource.type}</div>
                                                            </div>
                                                            <Button variant="ghost" size="sm">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>

                                {/* Tags */}
                                <div>
                                    <h4 className="font-semibold mb-2">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPractice.tags.map((tag) => (
                                            <Badge key={tag} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Author & Date */}
                                <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                                    <div>By {selectedPractice.author}</div>
                                    <div>
                                        Published {new Date(selectedPractice.publishedAt).toLocaleDateString()}
                                        {selectedPractice.lastUpdated !== selectedPractice.publishedAt && (
                                            <span> • Updated {new Date(selectedPractice.lastUpdated).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowPracticeDetail(false)}>
                                    Close
                                </Button>
                                <Button>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}