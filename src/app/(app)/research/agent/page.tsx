'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { NoResultsEmptyState } from '@/components/ui/empty-states';
import { StandardEmptyState } from '@/components/standard/empty-state';
import { filterBySearch, highlightMatches } from '@/lib/utils/search-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { 
    Loader2, 
    BrainCircuit, 
    Library, 
    Calendar, 
    Search,
    BookOpen,
    TrendingUp,
    Users,
    Home,
    FileText,
    Lightbulb,
    Target,
    Clock,
    Star,
    Download,
    Share2,
    Bookmark,
    Eye,
    RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import type { ResearchReport } from '@/lib/types/common';
import type { RunResearchAgentOutput } from '@/aws/bedrock/flows';
import Link from 'next/link';
import { CardListSkeleton } from '@/components/ui/skeletons';
import { FeatureGate, UsageBadge } from '@/components/feature-gate';
import { useResearchAgent } from '@/hooks/use-research-agent';
import { runResearchAgentAction, getSavedContentAction } from '@/app/actions';

interface ResearchFormData {
  topic: string;
  depth?: 'basic' | 'comprehensive' | 'expert';
  focus?: 'market' | 'trends' | 'opportunities' | 'analysis';
}

interface ResearchState {
  message: string;
  data: (RunResearchAgentOutput & { reportId?: string }) | null;
  errors: Record<string, string[]>;
  isLoading: boolean;
}

interface SavedReport {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  category: string;
  readTime: number;
  bookmarked: boolean;
}

// Suggested research topics for real estate agents
const RESEARCH_SUGGESTIONS = [
    {
        category: 'Market Analysis',
        topics: [
            'Current mortgage rate trends and buyer impact',
            'First-time homebuyer market analysis 2024',
            'Luxury real estate market outlook',
            'Commercial real estate investment opportunities',
            'Housing inventory shortage solutions'
        ]
    },
    {
        category: 'Industry Trends',
        topics: [
            'PropTech innovations transforming real estate',
            'Remote work impact on housing preferences',
            'Sustainable building trends and buyer demand',
            'Virtual tour technology adoption rates',
            'AI tools for real estate professionals'
        ]
    },
    {
        category: 'Client Demographics',
        topics: [
            'Millennial homebuying patterns and preferences',
            'Gen Z real estate expectations and behaviors',
            'Baby boomer downsizing trends',
            'International buyer market analysis',
            'Investor vs owner-occupant market dynamics'
        ]
    },
    {
        category: 'Marketing & Strategy',
        topics: [
            'Social media marketing effectiveness for realtors',
            'Content marketing strategies that convert leads',
            'Local SEO best practices for real estate',
            'Video marketing trends in real estate',
            'Referral program optimization strategies'
        ]
    }
];

function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Researching...
        </>
      ) : (
        <>
          <Search className="mr-2 h-4 w-4" />
          Start Research
        </>
      )}
    </Button>
  );
}

export default function ResearchAgentPage() {
    const { user } = useUser();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'research' | 'reports' | 'knowledge'>('research');
    const [searchQuery, setSearchQuery] = useState('');
    const [researchState, setResearchState] = useState<ResearchState>({
        message: '',
        data: null,
        errors: {},
        isLoading: false
    });
    const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [selectedDepth, setSelectedDepth] = useState<'basic' | 'comprehensive' | 'expert'>('comprehensive');
    const [selectedFocus, setSelectedFocus] = useState<'market' | 'trends' | 'opportunities' | 'analysis'>('market');

    // Load saved reports
    useEffect(() => {
        if (user && activeTab === 'reports') {
            loadSavedReports();
        }
    }, [user, activeTab]);

    const loadSavedReports = async () => {
        setReportsLoading(true);
        try {
            const result = await getSavedContentAction();
            if (result.data) {
                // Filter for research reports
                const reports = result.data
                    .filter((item: any) => item.type === 'research_report')
                    .map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        summary: item.summary || item.content?.substring(0, 200) + '...',
                        createdAt: item.createdAt,
                        category: item.category || 'General',
                        readTime: Math.ceil((item.content?.length || 0) / 1000),
                        bookmarked: item.bookmarked || false
                    }));
                setSavedReports(reports);
            }
        } catch (error) {
            console.error('Failed to load saved reports:', error);
        } finally {
            setReportsLoading(false);
        }
    };

    const handleResearch = async (formData: FormData) => {
        const topic = formData.get('topic') as string;
        if (!topic?.trim()) {
            toast({
                title: "Topic required",
                description: "Please enter a research topic.",
                variant: "destructive"
            });
            return;
        }

        setResearchState(prev => ({ ...prev, isLoading: true, errors: {} }));

        try {
            const result = await runResearchAgentAction(null, formData);
            setResearchState({
                message: result.message,
                data: result.data,
                errors: result.errors || {},
                isLoading: false
            });

            if (result.data) {
                toast({
                    title: "Research completed",
                    description: "Your research report is ready.",
                    variant: "success"
                });
            }
        } catch (error) {
            setResearchState(prev => ({
                ...prev,
                isLoading: false,
                errors: { general: ['Failed to complete research'] }
            }));
        }
    };

    const handleSuggestedTopic = (topic: string) => {
        const form = document.getElementById('research-form') as HTMLFormElement;
        const topicInput = form?.querySelector('textarea[name="topic"]') as HTMLTextAreaElement;
        if (topicInput) {
            topicInput.value = topic;
            topicInput.focus();
        }
    };

    const filteredReports = useMemo(() => {
        if (!searchQuery) return savedReports;
        return savedReports.filter(report =>
            report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [savedReports, searchQuery]);

    const reportsByCategory = useMemo(() => {
        const grouped = filteredReports.reduce((acc, report) => {
            const category = report.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(report);
            return acc;
        }, {} as Record<string, SavedReport[]>);

        // Sort by creation date within each category
        Object.keys(grouped).forEach(category => {
            grouped[category].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });

        return grouped;
    }, [filteredReports]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Research Hub</h1>
                    <p className="text-muted-foreground">
                        AI-powered research and market intelligence for real estate professionals
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadSavedReports}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'research' | 'reports' | 'knowledge')}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="research">
                        <Search className="mr-2 h-4 w-4" />
                        Research Agent
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                        <FileText className="mr-2 h-4 w-4" />
                        Saved Reports ({savedReports.length})
                    </TabsTrigger>
                    <TabsTrigger value="knowledge">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Knowledge Base
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="research" className="space-y-6">
                    {/* Research Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5" />
                                AI Research Agent
                            </CardTitle>
                            <CardDescription>
                                Get comprehensive research on any real estate topic with AI-powered analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form id="research-form" action={handleResearch} className="space-y-4">
                                <div>
                                    <Label htmlFor="topic">Research Topic</Label>
                                    <Textarea
                                        id="topic"
                                        name="topic"
                                        placeholder="Enter your research topic or question..."
                                        className="min-h-[100px]"
                                        disabled={researchState.isLoading}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="depth">Research Depth</Label>
                                        <select
                                            id="depth"
                                            name="depth"
                                            value={selectedDepth}
                                            onChange={(e) => setSelectedDepth(e.target.value as any)}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="basic">Basic Overview</option>
                                            <option value="comprehensive">Comprehensive Analysis</option>
                                            <option value="expert">Expert Deep Dive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="focus">Research Focus</Label>
                                        <select
                                            id="focus"
                                            name="focus"
                                            value={selectedFocus}
                                            onChange={(e) => setSelectedFocus(e.target.value as any)}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="market">Market Analysis</option>
                                            <option value="trends">Trend Analysis</option>
                                            <option value="opportunities">Opportunities</option>
                                            <option value="analysis">Data Analysis</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <SubmitButton isLoading={researchState.isLoading} />
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Research Suggestions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Research Suggestions
                            </CardTitle>
                            <CardDescription>
                                Popular research topics for real estate professionals
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {RESEARCH_SUGGESTIONS.map((category) => (
                                    <div key={category.category}>
                                        <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                                            {category.category}
                                        </h4>
                                        <div className="grid gap-2">
                                            {category.topics.map((topic, index) => (
                                                <Button
                                                    key={index}
                                                    variant="ghost"
                                                    className="justify-start h-auto p-3 text-left"
                                                    onClick={() => handleSuggestedTopic(topic)}
                                                >
                                                    <div>
                                                        <div className="font-medium">{topic}</div>
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Research Results */}
                    {researchState.data && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Research Results
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Share
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <Bookmark className="mr-2 h-4 w-4" />
                                        Save
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="prose max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: researchState.data.content }} />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    {/* Search and Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <SearchInput
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                className="max-w-md"
                            />
                        </CardContent>
                    </Card>

                    {/* Reports List */}
                    {reportsLoading ? (
                        <CardListSkeleton count={3} />
                    ) : Object.keys(reportsByCategory).length === 0 ? (
                        <StandardEmptyState
                            icon={FileText}
                            title="No research reports"
                            description="Your saved research reports will appear here"
                            action={{
                                label: "Start Research",
                                onClick: () => setActiveTab('research')
                            }}
                        />
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(reportsByCategory).map(([category, reports]) => (
                                <div key={category}>
                                    <h3 className="text-lg font-semibold mb-4">{category}</h3>
                                    <div className="grid gap-4">
                                        {reports.map((report) => (
                                            <Card key={report.id} className="hover:shadow-md transition-shadow">
                                                <CardContent className="pt-6">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold mb-2 line-clamp-2">
                                                                {highlightMatches(report.title, searchQuery)}
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                                                                {highlightMatches(report.summary, searchQuery)}
                                                            </p>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {report.readTime} min read
                                                                </span>
                                                                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                                                {report.bookmarked && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        <Star className="h-3 w-3 mr-1" />
                                                                        Bookmarked
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-4">
                                                            <Button size="sm" variant="ghost">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost">
                                                                <Share2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="knowledge" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Knowledge Base
                            </CardTitle>
                            <CardDescription>
                                Curated real estate knowledge and best practices
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Knowledge Base Coming Soon</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    We're building a comprehensive knowledge base with real estate best practices, 
                                    market insights, and industry resources.
                                </p>
                                <div className="flex justify-center gap-2">
                                    <Button onClick={() => setActiveTab('research')}>
                                        <Search className="mr-2 h-4 w-4" />
                                        Start Research
                                    </Button>
                                    <Button variant="outline" onClick={() => setActiveTab('reports')}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Reports
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}