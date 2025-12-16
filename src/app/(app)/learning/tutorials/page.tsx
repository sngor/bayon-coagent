'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Play,
    Clock,
    Eye,
    ThumbsUp,
    Search,
    Filter,
    Target,
    Brain,
    TrendingUp,
    BarChart3,
    Sparkles,
    CheckCircle,
    ExternalLink,
    Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';
import { cn } from '@/lib/utils';

// Constants
const TUTORIAL_CATEGORIES = [
    { value: 'all', label: 'All Tutorials' },
    { value: 'getting-started', label: 'Getting Started' },
    { value: 'content-creation', label: 'Content Creation' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'advanced', label: 'Advanced' },
] as const;

const CATEGORY_COLORS = {
    'getting-started': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'content-creation': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'marketing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'analytics': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'advanced': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
} as const;

const DIFFICULTY_COLORS = {
    'Beginner': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Advanced': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
} as const;

const CATEGORY_ICONS = {
    'getting-started': Target,
    'content-creation': Sparkles,
    'marketing': TrendingUp,
    'analytics': BarChart3,
    'advanced': Brain,
    'default': CheckCircle,
} as const;

// Types
type Tutorial = {
    id: string;
    title: string;
    description: string;
    category: 'getting-started' | 'content-creation' | 'marketing' | 'analytics' | 'advanced';
    duration: number; // in minutes
    views: number;
    likes: number;
    thumbnail: string;
    videoUrl: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    tags: string[];
    isWatched: boolean;
    publishedAt: string;
    relatedFeatures: string[];
    transcript?: string;
};

// Tutorial Card Component
interface TutorialCardProps {
    tutorial: Tutorial;
    onSelect: (tutorial: Tutorial) => void;
    getCategoryIcon: (category: string) => JSX.Element;
    getCategoryColor: (category: string) => string;
    getDifficultyColor: (difficulty: string) => string;
    formatDuration: (minutes: number) => string;
    formatViews: (views: number) => string;
}

function TutorialCard({
    tutorial,
    onSelect,
    getCategoryIcon,
    getCategoryColor,
    getDifficultyColor,
    formatDuration,
    formatViews
}: TutorialCardProps) {
    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                tutorial.isWatched && "ring-2 ring-green-200 dark:ring-green-800"
            )}
            onClick={() => onSelect(tutorial)}
        >
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20" />
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-3 right-3">
                    <Badge variant="secondary" className="bg-black/70 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(tutorial.duration)}
                    </Badge>
                </div>

                {/* Watched indicator */}
                {tutorial.isWatched && (
                    <div className="absolute top-3 left-3">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Watched
                        </Badge>
                    </div>
                )}

                {/* Category badge */}
                <div className="absolute top-3 right-3">
                    <Badge className={getCategoryColor(tutorial.category)}>
                        {getCategoryIcon(tutorial.category)}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{tutorial.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">{tutorial.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <Badge className={getDifficultyColor(tutorial.difficulty)}>
                            {tutorial.difficulty}
                        </Badge>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {formatViews(tutorial.views)}
                            </div>
                            <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                {tutorial.likes}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {tutorial.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {tutorial.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{tutorial.tags.length - 3}
                            </Badge>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Published {new Date(tutorial.publishedAt).toLocaleDateString()}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}



const mockTutorials: Tutorial[] = [
    {
        id: 'getting-started-bayon',
        title: 'Getting Started with Bayon Coagent',
        description: 'A comprehensive walkthrough of the platform, covering all major features and how to set up your profile for success.',
        category: 'getting-started',
        duration: 12,
        views: 5420,
        likes: 342,
        thumbnail: '/api/placeholder/400/225',
        videoUrl: '#',
        difficulty: 'Beginner',
        tags: ['Platform Overview', 'Setup', 'Profile'],
        isWatched: true,
        publishedAt: '2024-01-20',
        relatedFeatures: ['Profile Setup', 'Dashboard'],
        transcript: 'Welcome to Bayon Coagent! In this tutorial, we\'ll walk through the entire platform...',
    },
    {
        id: 'ai-content-generation',
        title: 'AI Content Generation Masterclass',
        description: 'Learn advanced techniques for creating compelling blog posts, social media content, and marketing materials using AI.',
        category: 'content-creation',
        duration: 18,
        views: 3890,
        likes: 287,
        thumbnail: '/api/placeholder/400/225',
        videoUrl: '#',
        difficulty: 'Intermediate',
        tags: ['AI Tools', 'Content Strategy', 'Blog Posts'],
        isWatched: false,
        publishedAt: '2024-01-18',
        relatedFeatures: ['Studio Write', 'Content Library'],
    },
    {
        id: 'listing-descriptions',
        title: 'Creating Perfect Listing Descriptions',
        description: 'Master the art of writing compelling property descriptions that attract buyers and generate leads.',
        category: 'content-creation',
        duration: 15,
        views: 4250,
        likes: 198,
        thumbnail: '/api/placeholder/400/225',
        videoUrl: '#',
        difficulty: 'Beginner',
        tags: ['Listings', 'Descriptions', 'AI Tools'],
        isWatched: true,
        publishedAt: '2024-01-15',
        relatedFeatures: ['Studio Describe'],
    },
    {
        id: 'brand-audit-guide',
        title: 'Complete Brand Audit Walkthrough',
        description: 'Step-by-step guide to auditing your online presence and ensuring NAP consistency across all platforms.',
        category: 'marketing',
        duration: 22,
        views: 2890,
        likes: 156,
        thumbnail: '/api/placeholder/400/225',
        videoUrl: '#',
        difficulty: 'Intermediate',
        tags: ['Brand Audit', 'NAP Consistency', 'Online Presence'],
        isWatched: false,
        publishedAt: '2024-01-12',
        relatedFeatures: ['Brand Audit', 'Integrations'],
    },
    {
        id: 'competitor-analysis',
        title: 'AI-Powered Competitor Analysis',
        description: 'Discover how to use AI tools to analyze your competition and identify market opportunities.',
        category: 'analytics',
        duration: 20,
        views: 3120,
        likes: 234,
        thumbnail: '/api/placeholder/400/225',
        videoUrl: '#',
        difficulty: 'Advanced',
        tags: ['Competitor Analysis', 'Market Research', 'AI Tools'],
        isWatched: false,
        publishedAt: '2024-01-10',
        relatedFeatures: ['Brand Competitors', 'Market Analytics'],
    },
    {
        id: 'image-enhancement',
        title: 'AI Image Enhancement & Virtual Staging',
        description: 'Transform your property photos with AI-powered enhancement, virtual staging, and day-to-dusk conversion.',
        category: 'content-creation',
        duration: 16,
        views: 4680,
        likes: 312,
        thumbnail: '/api/placeholder/400/225',
        videoUrl: '#',
        difficulty: 'Intermediate',
        tags: ['Image Enhancement', 'Virtual Staging', 'Photography'],
        isWatched: false,
        publishedAt: '2024-01-08',
        relatedFeatures: ['Studio Reimagine'],
    },
    {
        id: 'market-intelligence',
        title: 'Market Intelligence & Trend Analysis',
        description: 'Learn to leverage market data and AI insights to identify trends and opportunities in your area.',
        category: 'analytics',
        duration: 25,
        views: 2340,
        likes: 189,
        thumbnail: '/api/placeholder/400/225',
        videoUrl: '#',
        difficulty: 'Advanced',
        tags: ['Market Analysis', 'Trends', 'Data Analytics'],
        isWatched: false,
        publishedAt: '2024-01-05',
        relatedFeatures: ['Market Hub', 'Analytics'],
    },
    {
        id: 'social-media-strategy',
        title: 'Social Media Content Strategy',
        description: 'Build a comprehensive social media strategy that generates leads and builds your brand authority.',
        category: 'marketing',
        duration: 19,
        views: 3560,
        likes: 267,
        thumbnail: '/api/placeholder/400/225',
        videoUrl: '#',
        difficulty: 'Intermediate',
        tags: ['Social Media', 'Content Strategy', 'Lead Generation'],
        isWatched: true,
        publishedAt: '2024-01-03',
        relatedFeatures: ['Studio Write', 'Content Library'],
    },
];

export default function LearningTutorialsPage() {
    const { user } = useUser();
    const [tutorials, setTutorials] = useState<Tutorial[]>(mockTutorials);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
    const [showTutorialDetail, setShowTutorialDetail] = useState(false);

    // Memoize filtered tutorials for better performance
    const filteredTutorials = useMemo(() => {
        let filtered = tutorials;

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(tutorial => tutorial.category === selectedCategory);
        }

        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            filtered = filtered.filter(tutorial =>
                tutorial.title.toLowerCase().includes(searchLower) ||
                tutorial.description.toLowerCase().includes(searchLower) ||
                tutorial.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        return filtered;
    }, [tutorials, selectedCategory, searchQuery]);

    const handleWatchTutorial = useCallback((tutorialId: string) => {
        setTutorials(prev => prev.map(tutorial =>
            tutorial.id === tutorialId
                ? { ...tutorial, isWatched: true, views: tutorial.views + 1 }
                : tutorial
        ));

        toast({
            title: 'Tutorial Started',
            description: 'Your progress will be tracked automatically.',
        });

        // In a real app, this would open the video player or navigate to the tutorial
        setShowTutorialDetail(false);
    }, [toast]);

    const getCategoryIcon = useCallback((category: string) => {
        const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.default;
        return <IconComponent className="h-4 w-4" />;
    }, []);

    const getCategoryColor = useCallback((category: string) => {
        return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default;
    }, []);

    const getDifficultyColor = useCallback((difficulty: string) => {
        return DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || DIFFICULTY_COLORS.default;
    }, []);

    const formatDuration = useCallback((minutes: number) => {
        return `${minutes}m`;
    }, []);

    const formatViews = useCallback((views: number) => {
        if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}k`;
        }
        return views.toString();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Video Tutorials</CardTitle>
                    <CardDescription>
                        Step-by-step video guides to master every feature of the platform
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
                                    placeholder="Search tutorials..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TUTORIAL_CATEGORIES.map((category) => (
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

            {/* Tutorial Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTutorials.map((tutorial) => (
                    <TutorialCard
                        key={tutorial.id}
                        tutorial={tutorial}
                        onSelect={(tutorial) => {
                            setSelectedTutorial(tutorial);
                            setShowTutorialDetail(true);
                        }}
                        getCategoryIcon={getCategoryIcon}
                        getCategoryColor={getCategoryColor}
                        getDifficultyColor={getDifficultyColor}
                        formatDuration={formatDuration}
                        formatViews={formatViews}
                    />
                ))}
            </div>

            {filteredTutorials.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Search className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">No Tutorials Found</h3>
                                <p className="text-muted-foreground">
                                    Try adjusting your search or filter criteria to find relevant tutorials.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tutorial Detail Dialog */}
            <Dialog open={showTutorialDetail} onOpenChange={setShowTutorialDetail}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    {selectedTutorial && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{selectedTutorial.title}</DialogTitle>
                                <DialogDescription className="text-base">
                                    {selectedTutorial.description}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-auto space-y-6">
                                {/* Tutorial Info */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <Badge className={getCategoryColor(selectedTutorial.category)}>
                                                {getCategoryIcon(selectedTutorial.category)}
                                                <span className="ml-1 capitalize">{selectedTutorial.category.replace('-', ' ')}</span>
                                            </Badge>
                                            <Badge className={getDifficultyColor(selectedTutorial.difficulty)}>
                                                {selectedTutorial.difficulty}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{formatDuration(selectedTutorial.duration)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedTutorial.views.toLocaleString()} views</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedTutorial.likes} likes</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>{new Date(selectedTutorial.publishedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">Related Features</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTutorial.relatedFeatures.map((feature) => (
                                                    <Badge key={feature} variant="outline">
                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                        {feature}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">Tags</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTutorial.tags.map((tag) => (
                                                    <Badge key={tag} variant="outline">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {selectedTutorial.isWatched && (
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                    <span className="font-semibold text-green-800 dark:text-green-200">
                                                        You've watched this tutorial
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Video Preview */}
                                        <div className="aspect-video bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20" />
                                            <div className="relative z-10">
                                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                                                    <Play className="h-10 w-10 text-white ml-1" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 right-4">
                                                <Badge variant="secondary" className="bg-black/70 text-white">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {formatDuration(selectedTutorial.duration)}
                                                </Badge>
                                            </div>
                                        </div>

                                        {selectedTutorial.transcript && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Transcript Preview</h4>
                                                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                                    <p className="line-clamp-4">{selectedTutorial.transcript}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowTutorialDetail(false)}>
                                    Close
                                </Button>
                                <Button onClick={() => handleWatchTutorial(selectedTutorial.id)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    {selectedTutorial.isWatched ? 'Watch Again' : 'Watch Tutorial'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}