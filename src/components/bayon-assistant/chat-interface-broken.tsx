'use client';

/**
 * Chat Interface Component - Simplified Working Version
 */

import React, { useState, useRef, useEffect, useCallback, useActionState } from 'react';
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
    Search,
    Bot,
    User,
    Sparkles,
    MessageCircle,
    Copy,
    ThumbsUp,
    ThumbsDown
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
    placeholder = "Hi! What's on your mind today? Ask about deals, market trends, clients, or anything real estate! 😊",
    maxHeight = 600,
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [state, formAction] = useActionState(handleChatQuery, initialState);
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

        // Create form data manually to ensure proper values
        const formData = new FormData();
        formData.set('query', userMessage.content);
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
                const systemMessage: Message = {
                    id: `system-${Date.now()}`,
                    role: 'assistant',
                    content: `⚠️ ${result.guardrailViolation.reason}\n\n${result.guardrailViolation.suggestion || ''}`,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, systemMessage]);
            } else if (result.error) {
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
    };

    // Handle textarea key press
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <div className={cn('flex flex-col h-full bg-gradient-to-b from-background to-muted/10', className)}>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" style={{ maxHeight }}>
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
                            {/* Animated AI Avatar */}
                            <div className="relative mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Bot className="w-10 h-10 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 text-white" />
                                </div>
                            </div>

                            {/* Welcome Message */}
                            <div className="max-w-md space-y-4">
                                <h2 className="font-headline text-2xl font-bold text-foreground">
                                    👋 Hi there! I'm your AI real estate assistant
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    I'm here to help you succeed in real estate! Ask me about market trends, deal strategies,
                                    client communication, financing, or anything else related to your business.
                                </p>
                            </div>

                            {/* Quick Start Suggestions */}
                            <div className="mt-8 w-full max-w-2xl">
                                <p className="text-sm font-medium text-muted-foreground mb-4">Try asking me about:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { icon: TrendingUp, text: "Current market trends", query: "What are the current market trends?" },
                                        { icon: MessageCircle, text: "Client communication tips", query: "How can I improve client communication?" },
                                        { icon: Search, text: "Lead generation strategies", query: "What are the best lead generation strategies?" },
                                        { icon: Info, text: "Deal closing techniques", query: "How do I close more deals?" }
                                    ].map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setInputValue(suggestion.query)}
                                            className="flex items-center gap-3 p-3 text-left bg-muted/50 hover:bg-muted rounded-lg transition-colors group"
                                        >
                                            <suggestion.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-medium">{suggestion.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))
                    )}

                    {/* Enhanced Loading indicator */}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            {/* Animated AI Avatar */}
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            {/* Typing Animation */}
                            <div className="flex-1">
                                <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm max-w-[85%]">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                        <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Enhanced Input Area */}
            <div className="border-t bg-gradient-to-r from-background to-muted/20 p-4">
                <form ref={formRef} onSubmit={handleSubmit} className="relative">
                    <div className="relative flex items-end gap-3">
                        <div className="flex-1 relative">
                            <Textarea
                                ref={textareaRef}
                                name="query"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                className={cn(
                                    "min-h-[60px] max-h-[200px] resize-none pr-12 transition-all duration-200",
                                    "border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                                    "bg-white dark:bg-gray-800 shadow-sm",
                                    isLoading && "opacity-50"
                                )}
                                disabled={isLoading}
                            />

                            {/* Character Counter */}
                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                                {inputValue.length}/1000
                            </div>
                        </div>

                        {/* Enhanced Send Button */}
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!inputValue.trim() || isLoading}
                            className={cn(
                                "h-[60px] w-[60px] flex-shrink-0 transition-all duration-200",
                                "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                                "shadow-lg hover:shadow-xl hover:scale-105",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            )}
                        >
                            {isLoading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </div>

                    {/* Enhanced Help Text */}
                    <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Press Enter to send, Shift+Enter for new line
                        </p>

                        {isLoading && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Sparkles className="w-3 h-3 animate-pulse" />
                                AI is thinking...
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

/**
 * Enhanced Message Bubble Component
 */
function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn('flex items-start gap-4 group', isUser && 'flex-row-reverse')}>
            {/* Enhanced Avatar */}
            <div className="flex-shrink-0">
                <div
                    className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200',
                        isUser
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                    )}
                >
                    {isUser ? (
                        <User className="w-5 h-5" />
                    ) : (
                        <Bot className="w-5 h-5" />
                    )}
                </div>
            </div>

            {/* Message Content */}
            <div className={cn('flex-1 space-y-2 min-w-0', isUser && 'flex flex-col items-end')}>
                <div className="relative group/message">
                    <Card
                        className={cn(
                            'p-4 max-w-[85%] shadow-sm transition-all duration-200 hover:shadow-md',
                            isUser
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        )}
                    >
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className={cn(
                                "whitespace-pre-wrap break-words m-0 leading-relaxed",
                                isUser ? "text-white" : "text-foreground"
                            )}>
                                {message.content}
                            </p>
                        </div>

                        {/* Message Actions */}
                        {!isUser && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={copyToClipboard}
                                                className="h-7 px-2 text-xs"
                                            >
                                                <Copy className="w-3 h-3 mr-1" />
                                                {copied ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Copy message</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                                <ThumbsUp className="w-3 h-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Helpful response</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                                <ThumbsDown className="w-3 h-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Not helpful</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                    </Card>
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
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs font-semibold mb-2">Sources</p>
                        <div className="space-y-2">
                            {message.citations.map((citation, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                        {idx + 1}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                        {citation.sourceType}
                                    </Badge>
                                    <span className="flex-1 truncate">{citation.title}</span>
                                    <a
                                        href={citation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="opacity-50 hover:opacity-100"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground px-2">
                {new Date(message.timestamp).toLocaleTimeString()}
            </p>
        </div>
        </div >
    );
}