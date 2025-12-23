'use client';

/**
 * Hub Agent Chat Component
 * 
 * A specialized chat interface that uses hub-specific AI agents
 * for contextual assistance within each hub.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
    Send,
    Bot,
    User,
    Sparkles,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    Loader2,
    Lightbulb,
    Zap
} from 'lucide-react';
import { useEnhancedAgents } from '@/hooks/use-enhanced-agents';
import { HubAgentRegistry } from '@/aws/bedrock/hub-agents/hub-agent-registry';

/**
 * Message interface
 */
interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    agentUsed?: string;
    keyPoints?: string[];
}

/**
 * Component props
 */
interface HubAgentChatProps {
    hubContext: string;
    className?: string;
    placeholder?: string;
    maxHeight?: string;
    defaultExpanded?: boolean;
    showAgentInfo?: boolean;
}

/**
 * Hub Agent Chat Component
 */
export function HubAgentChat({
    hubContext,
    className,
    placeholder,
    maxHeight = '400px',
    defaultExpanded = false,
    showAgentInfo = true
}: HubAgentChatProps) {
    const { chatWithHubAgent, isProactiveMonitoringEnabled } = useEnhancedAgents();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Get hub agent info
    const hubAgent = HubAgentRegistry.getAgentByHub(hubContext);

    /**
     * Scroll to bottom of messages
     */
    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    };

    /**
     * Handle sending a message
     */
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await chatWithHubAgent(
                hubContext,
                userMessage.content,
                'general-query'
            );

            if (response) {
                const assistantMessage: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: response.response,
                    timestamp: new Date().toISOString(),
                    agentUsed: response.agentUsed,
                    keyPoints: response.keyPoints
                };

                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);

            // Provide more specific error messages based on error type
            let errorMessage = 'I apologize, but I encountered an error. Please try again.';
            
            if (error instanceof Error) {
                if (error.message.includes('Authentication')) {
                    errorMessage = 'Authentication error. Please refresh the page and try again.';
                } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                    errorMessage = 'Network error. Please check your connection and try again.';
                } else if (error.message.includes('Bedrock') || error.message.includes('model')) {
                    errorMessage = 'AI service temporarily unavailable. Please try again in a moment.';
                } else if (error.message.includes('rate limit') || error.message.includes('throttle')) {
                    errorMessage = 'Too many requests. Please wait a moment before trying again.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timed out. Please try a shorter message or try again.';
                }
            }

            const errorResponse: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: errorMessage,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle key press in textarea
     */
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    /**
     * Auto-scroll when messages change
     */
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * Focus textarea when expanded
     */
    useEffect(() => {
        if (isExpanded && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isExpanded]);

    /**
     * Add welcome message when first expanded
     */
    useEffect(() => {
        if (isExpanded && messages.length === 0 && hubAgent) {
            const welcomeMessage: ChatMessage = {
                id: 'welcome',
                role: 'assistant',
                content: `Hi! I'm ${hubAgent.name}, your ${hubAgent.hub} specialist. ${hubAgent.personality} How can I help you with ${hubContext} today?`,
                timestamp: new Date().toISOString(),
                agentUsed: hubAgent.name
            };
            setMessages([welcomeMessage]);
        }
    }, [isExpanded, messages.length, hubAgent, hubContext]);

    if (!hubAgent) {
        return null;
    }

    return (
        <Card className={cn("w-full", className)}>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-medium">
                                        {hubAgent.name}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Your {hubContext} AI assistant
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isProactiveMonitoringEnabled && (
                                    <Badge variant="outline" className="text-xs">
                                        <Zap className="w-3 h-3 mr-1" />
                                        Active
                                    </Badge>
                                )}
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        {showAgentInfo && (
                            <div className="mb-4 p-3 rounded-lg bg-muted/30 border">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium mb-1">About {hubAgent.name}</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {hubAgent.personality}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {hubAgent.expertise.slice(0, 3).map((skill) => (
                                                <Badge key={skill} variant="secondary" className="text-xs">
                                                    {skill.replace('-', ' ')}
                                                </Badge>
                                            ))}
                                            {hubAgent.expertise.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{hubAgent.expertise.length - 3} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <ScrollArea
                            ref={scrollAreaRef}
                            style={{ maxHeight }}
                            className="mb-4"
                        >
                            <div className="space-y-4 pr-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "flex gap-3",
                                            message.role === 'user' ? 'justify-end' : 'justify-start'
                                        )}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-4 h-4 text-primary" />
                                            </div>
                                        )}

                                        <div
                                            className={cn(
                                                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                                message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground ml-auto'
                                                    : 'bg-muted'
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap">{message.content}</p>

                                            {message.keyPoints && message.keyPoints.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-border/50">
                                                    <p className="text-xs font-medium mb-1 opacity-80">Key Points:</p>
                                                    <ul className="text-xs space-y-0.5 opacity-90">
                                                        {message.keyPoints.map((point, index) => (
                                                            <li key={index} className="flex items-start gap-1">
                                                                <span className="text-primary">•</span>
                                                                <span>{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs opacity-60">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </span>
                                                {message.agentUsed && (
                                                    <Badge variant="outline" className="text-xs opacity-80">
                                                        {message.agentUsed}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {message.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/10 to-green-500/10 flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-3 justify-start">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-muted-foreground">
                                                    {hubAgent.name} is thinking...
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="flex gap-2">
                            <Textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={placeholder || `Ask ${hubAgent.name} anything about ${hubContext}...`}
                                className="min-h-[40px] max-h-[120px] resize-none"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isLoading}
                                size="sm"
                                className="px-3"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        {/* Quick suggestions */}
                        {messages.length <= 1 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {hubContext === 'studio' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => setInputValue("Help me write a blog post about market trends")}
                                        >
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            Blog post ideas
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => setInputValue("Create social media content for this week")}
                                        >
                                            <MessageCircle className="w-3 h-3 mr-1" />
                                            Social media
                                        </Button>
                                    </>
                                )}
                                {hubContext === 'brand' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => setInputValue("Analyze my brand positioning")}
                                        >
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            Brand analysis
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => setInputValue("Help me improve my SEO")}
                                        >
                                            <Zap className="w-3 h-3 mr-1" />
                                            SEO tips
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}