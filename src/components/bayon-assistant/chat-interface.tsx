'use client';

/**
 * Chat Interface Component
 * 
 * Main chat interface for the Bayon AI Assistant.
 * Features:
 * - Message list with virtual scrolling for performance
 * - Input field with submit handling
 * - Loading states and progress indicators
 * - Citation display in messages
 * - Parallel search results display
 * 
 * Requirements: 7.1, 10.1, 10.4, 5.4, 5.5
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFormState } from 'react-dom';
import { VirtualList } from '@/components/ui/virtual-list';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    Send,
    AlertCircle,
    CheckCircle,
    Loader2,
    ExternalLink,
    Info,
    TrendingUp,
    Search
} from 'lucide-react';
import { handleChatQuery, type ChatQueryResponse } from '@/app/bayon-assistant-actions';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Message type
 */
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    citations?: Array<{
        url: string;
        title: string;
        sourceType: string;
    }>;
    keyPoints?: string[];
    parallelSearchResults?: {
        platforms: string[];
        consensus: string[];
        discrepancies: string[];
        agentVisibility?: {
            platform: string;
            mentioned: boolean;
            ranking?: number;
        }[];
    };
}

/**
 * Chat Interface Props
 */
export interface ChatInterfaceProps {
    profile?: AgentProfile | null;
    conversationId?: string;
    initialMessages?: Message[];
    className?: string;
    onMessageSent?: (message: Message) => void;
    placeholder?: string;
    maxHeight?: number;
}

/**
 * Initial form state
 */
const initialState: ChatQueryResponse = {
    success: false,
};

/**
 * Chat Interface Component
 */
export function ChatInterface({
    profile,
    conversationId,
    initialMessages = [],
    className,
    onMessageSent,
    placeholder = 'Ask me anything about real estate...',
    maxHeight = 600,
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [state, formAction] = useFormState(handleChatQuery, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputValue.trim() || isLoading) {
            return;
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: inputValue,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Submit form programmatically
        if (formRef.current) {
            const formData = new FormData(formRef.current);
            formData.set('query', inputValue);
            if (conversationId) {
                formData.set('conversationId', conversationId);
            }

            try {
                const result = await handleChatQuery(initialState, formData);

                if (result.success && result.data) {
                    const assistantMessage: Message = {
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: result.data.response,
                        timestamp: new Date().toISOString(),
                        citations: result.data.citations,
                        keyPoints: result.data.keyPoints,
                    };

                    setMessages(prev => [...prev, assistantMessage]);

                    if (onMessageSent) {
                        onMessageSent(assistantMessage);
                    }
                } else if (result.guardrailViolation) {
                    // Show guardrail violation as system message
                    const systemMessage: Message = {
                        id: `system-${Date.now()}`,
                        role: 'assistant',
                        content: `⚠️ ${result.guardrailViolation.reason}\n\n${result.guardrailViolation.suggestion || ''}`,
                        timestamp: new Date().toISOString(),
                    };
                    setMessages(prev => [...prev, systemMessage]);
                } else if (result.error) {
                    // Show error as system message
                    const errorMessage: Message = {
                        id: `error-${Date.now()}`,
                        role: 'assistant',
                        content: `❌ Error: ${result.error}`,
                        timestamp: new Date().toISOString(),
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
            } catch (error) {
                console.error('Chat submission error:', error);
                const errorMessage: Message = {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content: '❌ An unexpected error occurred. Please try again.',
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Handle textarea key press (Enter to submit, Shift+Enter for new line)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" style={{ maxHeight }}>
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground py-12">
                            <div>
                                <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">Start a conversation</p>
                                <p className="text-sm">Ask me anything about real estate, market trends, or property analysis.</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))
                    )}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-background">
                <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        ref={textareaRef}
                        name="query"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="min-h-[60px] max-h-[200px] resize-none"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!inputValue.trim() || isLoading}
                        className="h-[60px] w-[60px] flex-shrink-0"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </Button>
                </form>

                <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}

/**
 * Message Bubble Component
 * Displays individual messages with citations and metadata
 */
function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';

    return (
        <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
            {/* Avatar */}
            <div
                className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
            >
                {isUser ? (
                    <span className="text-sm font-medium">You</span>
                ) : (
                    <span className="text-sm font-medium">AI</span>
                )}
            </div>

            {/* Message Content */}
            <div className={cn('flex-1 space-y-2', isUser && 'flex flex-col items-end')}>
                <Card
                    className={cn(
                        'p-4 max-w-[85%]',
                        isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                    )}
                >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap break-words m-0">{message.content}</p>
                    </div>

                    {/* Key Points */}
                    {message.keyPoints && message.keyPoints.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Key Points
                            </p>
                            <ul className="text-xs space-y-1 list-disc list-inside">
                                {message.keyPoints.map((point, idx) => (
                                    <li key={idx}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                        <CitationList citations={message.citations} />
                    )}

                    {/* Parallel Search Results */}
                    {message.parallelSearchResults && (
                        <ParallelSearchResults results={message.parallelSearchResults} />
                    )}
                </Card>

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground px-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
}

/**
 * Citation List Component
 * Displays citations with tooltips and source type badges
 * 
 * Requirements: 10.1, 10.4
 */
function CitationList({
    citations,
}: {
    citations: Array<{
        url: string;
        title: string;
        sourceType: string;
    }>;
}) {
    return (
        <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs font-semibold mb-2">Sources</p>
            <div className="space-y-2">
                {citations.map((citation, idx) => (
                    <TooltipProvider key={idx}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs hover:underline group"
                                >
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                        {idx + 1}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                        {citation.sourceType}
                                    </Badge>
                                    <span className="flex-1 truncate">{citation.title}</span>
                                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs font-medium mb-1">{citation.title}</p>
                                <p className="text-xs text-muted-foreground break-all">{citation.url}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    );
}

/**
 * Parallel Search Results Component
 * Displays cross-platform search results with consensus and discrepancies
 * 
 * Requirements: 5.4, 5.5
 */
function ParallelSearchResults({
    results,
}: {
    results: {
        platforms: string[];
        consensus: string[];
        discrepancies: string[];
        agentVisibility?: {
            platform: string;
            mentioned: boolean;
            ranking?: number;
        }[];
    };
}) {
    return (
        <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs font-semibold mb-3 flex items-center gap-1">
                <Search className="w-3 h-3" />
                Cross-Platform Validation
            </p>

            {/* Platforms Queried */}
            <div className="mb-3">
                <p className="text-[10px] text-muted-foreground mb-1">Platforms Queried:</p>
                <div className="flex flex-wrap gap-1">
                    {results.platforms.map((platform) => (
                        <Badge key={platform} variant="outline" className="text-[10px] px-1.5 py-0.5">
                            {platform}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Consensus Points */}
            {results.consensus.length > 0 && (
                <div className="mb-3">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Consensus:
                    </p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                        {results.consensus.map((point, idx) => (
                            <li key={idx} className="text-green-600 dark:text-green-400">
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Discrepancies */}
            {results.discrepancies.length > 0 && (
                <div className="mb-3">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        Discrepancies:
                    </p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                        {results.discrepancies.map((point, idx) => (
                            <li key={idx} className="text-amber-600 dark:text-amber-400">
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Agent Visibility */}
            {results.agentVisibility && results.agentVisibility.length > 0 && (
                <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Your Visibility:</p>
                    <div className="space-y-1">
                        {results.agentVisibility.map((visibility, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                                <span>{visibility.platform}</span>
                                {visibility.mentioned ? (
                                    <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                                        {visibility.ranking ? `Rank #${visibility.ranking}` : 'Mentioned'}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                        Not found
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
