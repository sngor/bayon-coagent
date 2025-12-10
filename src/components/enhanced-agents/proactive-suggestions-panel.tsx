'use client';

/**
 * Proactive Suggestions Panel
 * 
 * Displays AI-generated proactive suggestions and insights to users
 * with actionable recommendations and smart notifications.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
    Sparkles,
    TrendingUp,
    Users,
    Target,
    Clock,
    CheckCircle2,
    X,
    MoreHorizontal,
    ExternalLink,
    Lightbulb,
    AlertTriangle,
    Info,
    Zap,
    ArrowRight,
    Filter,
    RefreshCw
} from 'lucide-react';
import {
    getProactiveSuggestionsAction,
    dismissSuggestionAction,
    actOnSuggestionAction
} from '@/app/enhanced-agent-actions';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

/**
 * Suggestion interface (matches backend)
 */
interface ProactiveSuggestion {
    id: string;
    userId: string;
    agentId: string;
    type: 'content-opportunity' | 'market-alert' | 'competitor-update' | 'seo-optimization' | 'client-follow-up' | 'seasonal-content' | 'performance-insight' | 'workflow-optimization';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    description: string;
    actionable: boolean;
    actions?: Array<{
        label: string;
        type: 'navigate' | 'create' | 'update' | 'external';
        target: string;
        data?: Record<string, any>;
    }>;
    metadata: Record<string, any>;
    createdAt: string;
    expiresAt?: string;
    dismissed?: boolean;
    actedUpon?: boolean;
}

/**
 * Component props
 */
interface ProactiveSuggestionsPanelProps {
    className?: string;
    maxHeight?: string;
    showFilters?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number; // seconds
}

/**
 * Priority colors and icons
 */
const priorityConfig = {
    low: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Info },
    medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Lightbulb },
    high: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
    urgent: { color: 'bg-red-100 text-red-800 border-red-200', icon: Zap }
};

/**
 * Suggestion type icons
 */
const typeIcons = {
    'content-opportunity': Sparkles,
    'market-alert': TrendingUp,
    'competitor-update': Users,
    'seo-optimization': Target,
    'client-follow-up': Clock,
    'seasonal-content': Sparkles,
    'performance-insight': TrendingUp,
    'workflow-optimization': Zap
};

/**
 * Proactive Suggestions Panel Component
 */
export function ProactiveSuggestionsPanel({
    className,
    maxHeight = '600px',
    showFilters = true,
    autoRefresh = true,
    refreshInterval = 300 // 5 minutes
}: ProactiveSuggestionsPanelProps) {
    const router = useRouter();
    const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [dismissingId, setDismissingId] = useState<string | null>(null);

    /**
     * Load suggestions from server
     */
    const loadSuggestions = async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            const response = await getProactiveSuggestionsAction({
                limit: 20,
                priority: selectedPriority === 'all' ? undefined : selectedPriority as any,
                type: selectedType === 'all' ? undefined : selectedType,
                includeDismissed: false
            });

            if (response.success && response.data) {
                setSuggestions(response.data);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to load suggestions',
                    description: response.error || 'Unknown error occurred'
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error loading suggestions',
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    /**
     * Handle suggestion action
     */
    const handleSuggestionAction = async (suggestion: ProactiveSuggestion, action: any) => {
        try {
            // Mark as acted upon
            await actOnSuggestionAction(suggestion.id);

            // Navigate or perform action
            switch (action.type) {
                case 'navigate':
                    router.push(action.target);
                    break;
                case 'external':
                    window.open(action.target, '_blank');
                    break;
                default:
                    // Handle other action types as needed
                    break;
            }

            // Update local state
            setSuggestions(prev =>
                prev.map(s => s.id === suggestion.id ? { ...s, actedUpon: true } : s)
            );

            toast({
                title: 'Action completed',
                description: `Navigated to ${action.label}`
            });

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Action failed',
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Handle suggestion dismissal
     */
    const handleDismissSuggestion = async (suggestionId: string) => {
        try {
            await dismissSuggestionAction(suggestionId);

            // Remove from local state
            setSuggestions(prev => prev.filter(s => s.id !== suggestionId));

            toast({
                title: 'Suggestion dismissed',
                description: 'The suggestion has been removed from your list'
            });

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to dismiss suggestion',
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setDismissingId(null);
        }
    };

    /**
     * Filter suggestions based on selected filters
     */
    const filteredSuggestions = suggestions.filter(suggestion => {
        if (selectedPriority !== 'all' && suggestion.priority !== selectedPriority) {
            return false;
        }
        if (selectedType !== 'all' && suggestion.type !== selectedType) {
            return false;
        }
        return true;
    });

    /**
     * Group suggestions by priority
     */
    const groupedSuggestions = filteredSuggestions.reduce((groups, suggestion) => {
        const priority = suggestion.priority;
        if (!groups[priority]) {
            groups[priority] = [];
        }
        groups[priority].push(suggestion);
        return groups;
    }, {} as Record<string, ProactiveSuggestion[]>);

    // Sort priority groups
    const priorityOrder: Array<keyof typeof priorityConfig> = ['urgent', 'high', 'medium', 'low'];
    const sortedGroups = priorityOrder.filter(priority => groupedSuggestions[priority]?.length > 0);

    /**
     * Auto-refresh effect
     */
    useEffect(() => {
        loadSuggestions();

        if (autoRefresh && refreshInterval > 0) {
            const interval = setInterval(() => {
                loadSuggestions(true);
            }, refreshInterval * 1000);

            return () => clearInterval(interval);
        }
    }, [selectedPriority, selectedType, autoRefresh, refreshInterval]);

    /**
     * Render suggestion card
     */
    const renderSuggestionCard = (suggestion: ProactiveSuggestion) => {
        const priorityInfo = priorityConfig[suggestion.priority];
        const TypeIcon = typeIcons[suggestion.type];
        const PriorityIcon = priorityInfo.icon;

        return (
            <Card
                key={suggestion.id}
                className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    suggestion.actedUpon && "opacity-60"
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <TypeIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-medium">{suggestion.title}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant="outline"
                                        className={cn("text-xs", priorityInfo.color)}
                                    >
                                        <PriorityIcon className="h-3 w-3 mr-1" />
                                        {suggestion.priority}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(suggestion.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => setDismissingId(suggestion.id)}
                                    className="text-destructive"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Dismiss
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <CardDescription className="text-sm mb-3">
                        {suggestion.description}
                    </CardDescription>

                    {suggestion.actionable && suggestion.actions && suggestion.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {suggestion.actions.map((action, index) => (
                                <Button
                                    key={index}
                                    size="sm"
                                    variant={index === 0 ? "default" : "outline"}
                                    onClick={() => handleSuggestionAction(suggestion, action)}
                                    className="text-xs"
                                    disabled={suggestion.actedUpon}
                                >
                                    {action.label}
                                    {action.type === 'external' ? (
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                    ) : (
                                        <ArrowRight className="h-3 w-3 ml-1" />
                                    )}
                                </Button>
                            ))}
                        </div>
                    )}

                    {suggestion.actedUpon && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Action completed
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Suggestions
                        </CardTitle>
                        <CardDescription>
                            Proactive insights and recommendations from your AI agents
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadSuggestions(true)}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        </Button>

                        {showFilters && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filter
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <div className="p-2">
                                        <div className="text-xs font-medium mb-2">Priority</div>
                                        {['all', 'urgent', 'high', 'medium', 'low'].map(priority => (
                                            <DropdownMenuItem
                                                key={priority}
                                                onClick={() => setSelectedPriority(priority)}
                                                className={cn(
                                                    "text-xs",
                                                    selectedPriority === priority && "bg-accent"
                                                )}
                                            >
                                                {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                    <Separator />
                                    <div className="p-2">
                                        <div className="text-xs font-medium mb-2">Type</div>
                                        {['all', 'content-opportunity', 'market-alert', 'seo-optimization'].map(type => (
                                            <DropdownMenuItem
                                                key={type}
                                                onClick={() => setSelectedType(type)}
                                                className={cn(
                                                    "text-xs",
                                                    selectedType === type && "bg-accent"
                                                )}
                                            >
                                                {type === 'all' ? 'All Types' : type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <ScrollArea style={{ maxHeight }} className="pr-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredSuggestions.length === 0 ? (
                        <div className="text-center py-8">
                            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No suggestions available</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Your AI agents are monitoring for opportunities
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sortedGroups.map(priority => (
                                <div key={priority}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs", priorityConfig[priority].color)}
                                        >
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {groupedSuggestions[priority].length} suggestion{groupedSuggestions[priority].length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        {groupedSuggestions[priority].map(renderSuggestionCard)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>

            {/* Dismiss Confirmation Dialog */}
            <AlertDialog open={!!dismissingId} onOpenChange={() => setDismissingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Dismiss Suggestion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to dismiss this suggestion? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => dismissingId && handleDismissSuggestion(dismissingId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Dismiss
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}