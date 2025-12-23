'use client';

/**
 * Enhanced Agent Integration Component
 * 
 * A lightweight component that adds enhanced AI agent features to existing pages
 * without disrupting the current UI. Provides floating agent assistance and
 * proactive suggestions.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
    Bot,
    Sparkles,
    MessageCircle,
    Lightbulb,
    Zap,
    X,
    ChevronRight,
    Bell,
    BellOff
} from 'lucide-react';
import { HubAgentChat } from './hub-agent-chat';
import { AgentErrorBoundary } from './agent-error-boundary';
import { useEnhancedAgents } from '@/hooks/use-enhanced-agents';
import { getProactiveSuggestionsAction } from '@/app/enhanced-agent-actions';
import { HubAgentRegistry } from '@/aws/bedrock/hub-agents/hub-agent-registry';

/**
 * Component props
 */
interface EnhancedAgentIntegrationProps {
    hubContext: string;
    className?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    showNotifications?: boolean;
}

/**
 * Suggestion interface (simplified)
 */
interface SimpleSuggestion {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    type: string;
    actions?: Array<{
        label: string;
        target: string;
    }>;
}

/**
 * Enhanced Agent Integration Component
 */
export function EnhancedAgentIntegration({
    hubContext,
    className,
    position = 'bottom-right',
    showNotifications = true
}: EnhancedAgentIntegrationProps) {
    const { isProactiveMonitoringEnabled, initializeProactiveMonitoring } = useEnhancedAgents();
    const [suggestions, setSuggestions] = useState<SimpleSuggestion[]>([]);
    const [isAgentOpen, setIsAgentOpen] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [hasNewSuggestions, setHasNewSuggestions] = useState(false);

    // Get hub agent info
    const hubAgent = HubAgentRegistry.getAgentByHub(hubContext);

    /**
     * Load suggestions for this hub with error resilience
     */
    const loadSuggestions = async () => {
        if (!isProactiveMonitoringEnabled) return;

        try {
            const response = await getProactiveSuggestionsAction({
                limit: 3,
                priority: 'medium'
            });

            if (response.success && response.data) {
                // Filter suggestions relevant to current hub
                const hubRelevantSuggestions = response.data
                    .filter((s: any) =>
                        s.type.includes(hubContext) ||
                        s.metadata?.hubContext === hubContext ||
                        s.type === 'content-opportunity' && hubContext === 'studio' ||
                        s.type === 'seo-optimization' && hubContext === 'brand'
                    )
                    .slice(0, 3)
                    .map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        description: s.description,
                        priority: s.priority,
                        type: s.type,
                        actions: s.actions?.slice(0, 1) // Only show primary action
                    }));

                setSuggestions(hubRelevantSuggestions);

                // Show notification if there are new suggestions
                if (hubRelevantSuggestions.length > 0 && !showSuggestions) {
                    setHasNewSuggestions(true);
                }
            }
        } catch (error) {
            console.error('Failed to load suggestions:', error);
            // Fail silently - suggestions are enhancement, not critical
            setSuggestions([]);
        }
    };

    /**
     * Initialize proactive monitoring if not enabled
     */
    const handleEnableProactiveMonitoring = async () => {
        const success = await initializeProactiveMonitoring();
        if (success) {
            setTimeout(loadSuggestions, 1000);
        }
    };

    /**
     * Handle suggestion click
     */
    const handleSuggestionClick = (suggestion: SimpleSuggestion) => {
        if (suggestion.actions && suggestion.actions[0]) {
            window.location.href = suggestion.actions[0].target;
        }
        setShowSuggestions(false);
        setHasNewSuggestions(false);
    };

    /**
     * Position classes
     */
    const positionClasses = {
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4'
    };

    /**
     * Load suggestions on mount and periodically
     */
    useEffect(() => {
        if (isProactiveMonitoringEnabled) {
            loadSuggestions();

            // Refresh suggestions every 5 minutes
            const interval = setInterval(loadSuggestions, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [isProactiveMonitoringEnabled, hubContext]);

    if (!hubAgent) {
        return null;
    }

    return (
        <AgentErrorBoundary>
            <div className={cn("fixed z-50 flex flex-col gap-2", positionClasses[position], className)}>
                {/* Suggestions Popover */}
                {showNotifications && (
                    <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-10 px-3 bg-background/95 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300",
                                    hasNewSuggestions && "animate-pulse border-primary/50"
                                )}
                                onClick={() => {
                                    setShowSuggestions(!showSuggestions);
                                    setHasNewSuggestions(false);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {hasNewSuggestions ? (
                                        <Bell className="w-4 h-4 text-primary" />
                                    ) : (
                                        <Lightbulb className="w-4 h-4" />
                                    )}
                                    <span className="text-sm">
                                        {suggestions.length > 0 ? `${suggestions.length} suggestions` : 'Suggestions'}
                                    </span>
                                    {hasNewSuggestions && (
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    )}
                                </div>
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent
                            className="w-80 p-0"
                            align="end"
                            side={position.includes('top') ? 'bottom' : 'top'}
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-sm">AI Suggestions</h4>
                                    {!isProactiveMonitoringEnabled && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleEnableProactiveMonitoring}
                                            className="text-xs h-6"
                                        >
                                            <Zap className="w-3 h-3 mr-1" />
                                            Enable
                                        </Button>
                                    )}
                                </div>

                                {!isProactiveMonitoringEnabled ? (
                                    <div className="text-center py-4">
                                        <BellOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Enable AI monitoring to get proactive suggestions
                                        </p>
                                        <Button size="sm" onClick={handleEnableProactiveMonitoring}>
                                            <Zap className="w-4 h-4 mr-2" />
                                            Enable AI Suggestions
                                        </Button>
                                    </div>
                                ) : suggestions.length === 0 ? (
                                    <div className="text-center py-4">
                                        <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            No suggestions right now. Your AI agents are monitoring for opportunities.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {suggestions.map((suggestion) => (
                                            <div
                                                key={suggestion.id}
                                                className="group cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h5 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                        {suggestion.title}
                                                    </h5>
                                                    <Badge
                                                        variant={suggestion.priority === 'high' ? 'default' : 'secondary'}
                                                        className="text-xs shrink-0"
                                                    >
                                                        {suggestion.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                    {suggestion.description}
                                                </p>
                                                {suggestion.actions && suggestion.actions[0] && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-primary font-medium">
                                                            {suggestion.actions[0].label}
                                                        </span>
                                                        <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                {/* Agent Chat Sheet */}
                <Sheet open={isAgentOpen} onOpenChange={setIsAgentOpen}>
                    <SheetTrigger asChild>
                        <Button
                            className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            <Bot className="w-6 h-6 text-white" />
                        </Button>
                    </SheetTrigger>

                    <SheetContent
                        side="right"
                        className="w-[400px] sm:w-[500px] p-0"
                    >
                        <SheetHeader className="p-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <SheetTitle className="text-left">{hubAgent.name}</SheetTitle>
                                    <SheetDescription className="text-left">
                                        Your {hubContext} AI specialist
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        <div className="px-6 pb-6">
                            <HubAgentChat
                                hubContext={hubContext}
                                defaultExpanded={true}
                                showAgentInfo={true}
                                maxHeight="calc(100vh - 200px)"
                                placeholder={`Ask ${hubAgent.name} anything about ${hubContext}...`}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </AgentErrorBoundary>
    );
}