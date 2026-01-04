'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    ChevronDown, 
    ChevronRight, 
    Code, 
    ExternalLink, 
    Target, 
    TrendingUp,
    Zap,
    Users,
    Globe,
    Search,
    X,
    Play
} from 'lucide-react';
import type { OptimizationRecommendation, RecommendationCategory, RecommendationPriority } from '@/lib/ai-visibility/types';

interface RecommendationsInterfaceProps {
    recommendations: OptimizationRecommendation[];
    onUpdateRecommendation?: (id: string, status: OptimizationRecommendation['status']) => void;
    onTrackImpact?: (id: string) => void;
}

export function RecommendationsInterface({ 
    recommendations, 
    onUpdateRecommendation,
    onTrackImpact 
}: RecommendationsInterfaceProps) {
    const [selectedCategory, setSelectedCategory] = useState<RecommendationCategory | 'all'>('all');
    const [selectedPriority, setSelectedPriority] = useState<RecommendationPriority | 'all'>('all');
    const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());

    // Filter recommendations
    const filteredRecommendations = recommendations.filter(rec => {
        const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory;
        const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
        return categoryMatch && priorityMatch;
    });

    // Group by status
    const groupedRecommendations = {
        pending: filteredRecommendations.filter(r => r.status === 'pending'),
        'in-progress': filteredRecommendations.filter(r => r.status === 'in-progress'),
        completed: filteredRecommendations.filter(r => r.status === 'completed'),
        dismissed: filteredRecommendations.filter(r => r.status === 'dismissed'),
    };

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedRecommendations);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRecommendations(newExpanded);
    };

    const getCategoryIcon = (category: RecommendationCategory) => {
        switch (category) {
            case 'schema': return <Code className="h-4 w-4" />;
            case 'content': return <Globe className="h-4 w-4" />;
            case 'technical': return <Zap className="h-4 w-4" />;
            case 'social': return <Users className="h-4 w-4" />;
            case 'competitive': return <Target className="h-4 w-4" />;
            default: return <Search className="h-4 w-4" />;
        }
    };

    const getPriorityColor = (priority: RecommendationPriority) => {
        switch (priority) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'outline';
        }
    };

    const getDifficultyColor = (difficulty: OptimizationRecommendation['implementationDifficulty']) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: OptimizationRecommendation['status']) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
            case 'dismissed': return <X className="h-4 w-4 text-gray-600" />;
            default: return <AlertTriangle className="h-4 w-4 text-orange-600" />;
        }
    };

    const RecommendationCard = ({ recommendation }: { recommendation: OptimizationRecommendation }) => {
        const isExpanded = expandedRecommendations.has(recommendation.id);

        return (
            <Card className="mb-4">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            {getCategoryIcon(recommendation.category)}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <CardTitle className="text-base">{recommendation.title}</CardTitle>
                                    {getStatusIcon(recommendation.status)}
                                </div>
                                <CardDescription className="text-sm">
                                    {recommendation.description}
                                </CardDescription>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={getPriorityColor(recommendation.priority)}>
                                        {recommendation.priority} priority
                                    </Badge>
                                    <Badge variant="outline" className={getDifficultyColor(recommendation.implementationDifficulty)}>
                                        {recommendation.implementationDifficulty}
                                    </Badge>
                                    <Badge variant="outline">
                                        +{recommendation.estimatedImpact} points
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(recommendation.id)}
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardHeader>

                <Collapsible open={isExpanded}>
                    <CollapsibleContent>
                        <CardContent className="pt-0">
                            <div className="space-y-4">
                                {/* Action Items */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Implementation Steps</h4>
                                    <ul className="space-y-1">
                                        {recommendation.actionItems.map((item, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <span className="text-muted-foreground mt-1">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Code Example */}
                                {recommendation.codeExample && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Code Example</h4>
                                        <div className="bg-muted p-3 rounded-md">
                                            <pre className="text-sm overflow-x-auto">
                                                <code>{recommendation.codeExample}</code>
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Resources */}
                                {recommendation.resources && recommendation.resources.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Additional Resources</h4>
                                        <ul className="space-y-1">
                                            {recommendation.resources.map((resource, index) => (
                                                <li key={index} className="flex items-center gap-2 text-sm">
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                    <a 
                                                        href={resource} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline"
                                                    >
                                                        {resource}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    {recommendation.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            onClick={() => onUpdateRecommendation?.(recommendation.id, 'in-progress')}
                                        >
                                            <Play className="h-3 w-3 mr-1" />
                                            Start Implementation
                                        </Button>
                                    )}
                                    
                                    {recommendation.status === 'in-progress' && (
                                        <Button
                                            size="sm"
                                            onClick={() => onUpdateRecommendation?.(recommendation.id, 'completed')}
                                        >
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Mark Complete
                                        </Button>
                                    )}

                                    {recommendation.status === 'completed' && onTrackImpact && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onTrackImpact(recommendation.id)}
                                        >
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            Track Impact
                                        </Button>
                                    )}

                                    {recommendation.status !== 'dismissed' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onUpdateRecommendation?.(recommendation.id, 'dismissed')}
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            Dismiss
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        );
    };

    const ProgressOverview = () => {
        const totalRecommendations = recommendations.length;
        const completedCount = recommendations.filter(r => r.status === 'completed').length;
        const inProgressCount = recommendations.filter(r => r.status === 'in-progress').length;
        const completionPercentage = totalRecommendations > 0 ? (completedCount / totalRecommendations) * 100 : 0;

        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Implementation Progress
                    </CardTitle>
                    <CardDescription>
                        Track your optimization progress and impact
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Overall Progress</span>
                            <span className="text-sm text-muted-foreground">
                                {completedCount} of {totalRecommendations} completed
                            </span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                        
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                                <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
                                <div className="text-xs text-muted-foreground">In Progress</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {totalRecommendations - completedCount - inProgressCount}
                                </div>
                                <div className="text-xs text-muted-foreground">Pending</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (recommendations.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">
                        No recommendations available. Run a new analysis to get fresh optimization suggestions.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div id="recommendations" className="space-y-6">
            <ProgressOverview />

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as RecommendationCategory | 'all')}
                                className="px-3 py-2 border rounded-md text-sm"
                                aria-label="Filter by category"
                            >
                                <option value="all">All Categories</option>
                                <option value="schema">Schema Markup</option>
                                <option value="content">Content Optimization</option>
                                <option value="technical">Technical SEO</option>
                                <option value="social">Social Signals</option>
                                <option value="competitive">Competitive</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Priority</label>
                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value as RecommendationPriority | 'all')}
                                className="px-3 py-2 border rounded-md text-sm"
                                aria-label="Filter by priority"
                            >
                                <option value="all">All Priorities</option>
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations by Status */}
            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Pending ({groupedRecommendations.pending.length})
                    </TabsTrigger>
                    <TabsTrigger value="in-progress" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        In Progress ({groupedRecommendations['in-progress'].length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed ({groupedRecommendations.completed.length})
                    </TabsTrigger>
                    <TabsTrigger value="dismissed" className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Dismissed ({groupedRecommendations.dismissed.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {groupedRecommendations.pending.length > 0 ? (
                        groupedRecommendations.pending.map((recommendation) => (
                            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <p className="text-muted-foreground">No pending recommendations</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="in-progress" className="space-y-4">
                    {groupedRecommendations['in-progress'].length > 0 ? (
                        groupedRecommendations['in-progress'].map((recommendation) => (
                            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                <p className="text-muted-foreground">No recommendations in progress</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    {groupedRecommendations.completed.length > 0 ? (
                        groupedRecommendations.completed.map((recommendation) => (
                            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Target className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-muted-foreground">No completed recommendations yet</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="dismissed" className="space-y-4">
                    {groupedRecommendations.dismissed.length > 0 ? (
                        groupedRecommendations.dismissed.map((recommendation) => (
                            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <X className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-muted-foreground">No dismissed recommendations</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}