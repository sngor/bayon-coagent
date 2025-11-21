'use client';

/**
 * Chat Interface Component - Enhanced UI/UX Version
 */

import React, { useState, useRef, useEffect, useCallback, useActionState } from 'react';
import './avatar-animations.css';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    Send,
    Info,
    TrendingUp,
    Search,
    Bot,
    User,
    Sparkles,
    MessageCircle,
    Copy,
    ThumbsUp,
    ThumbsDown,
    Square
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
    conversationId,
    initialMessages = [],
    className,
    onMessageSent,
    placeholder = "Hi! What's on your mind today? Ask about deals, market trends, clients, or anything real estate! 😊",
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [state, formAction] = useActionState(handleChatQuery, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Handle stopping the chat
    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);

        // Add a system message indicating the chat was stopped
        const stopMessage: Message = {
            id: `stop-${Date.now()}`,
            role: 'assistant',
            content: '⏹️ Response stopped by user.',
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, stopMessage]);
    };

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

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Create form data manually to ensure proper values
        const formData = new FormData();
        formData.set('query', userMessage.content);
        if (conversationId) {
            formData.set('conversationId', conversationId);
        }

        try {
            const result = await handleChatQuery(initialState, formData);

            // Check if request was aborted
            if (abortControllerRef.current?.signal.aborted) {
                return;
            }

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
            // Don't show error if request was aborted
            if (abortControllerRef.current?.signal.aborted) {
                return;
            }

            console.error('Chat submission error:', error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: '❌ An unexpected error occurred. Please try again.',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                setIsLoading(false);
            }
            abortControllerRef.current = null;
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
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-6">
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
                                {/* Enhanced Animated AI Avatar */}
                                <div className="relative mb-6 group/avatar">
                                    {/* Outer Breathing Ring */}
                                    <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-20 animate-ping-slow"></div>

                                    {/* Middle Glow Ring */}
                                    <div className="absolute inset-1 w-18 h-18 rounded-full bg-gradient-to-br from-blue-300 to-purple-400 opacity-30 animate-pulse-gentle"></div>

                                    {/* Main Avatar */}
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-110 animate-float">
                                        <Bot className="w-10 h-10 text-white transition-transform duration-300 group-hover/avatar:rotate-12 group-hover/avatar:scale-110" />

                                        {/* Inner Sparkle Effect */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"></div>
                                    </div>

                                    {/* Status Indicator with Animation */}
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-gentle hover:animate-spin-slow">
                                        <Sparkles className="w-3 h-3 text-white animate-twinkle" />
                                    </div>

                                    {/* Floating Particles */}
                                    <div className="absolute -top-2 -left-2 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-float-delayed"></div>
                                    <div className="absolute -bottom-2 -right-2 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-60 animate-float-delayed-2"></div>
                                    <div className="absolute top-1/2 -left-3 w-1 h-1 bg-green-400 rounded-full opacity-60 animate-float-delayed-3"></div>
                                </div>

                                {/* Welcome Message */}
                                <div className="max-w-md space-y-4">
                                    <h2 className="text-2xl font-bold text-foreground">
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

                        {/* Enhanced Loading indicator with Animated Avatar */}
                        {isLoading && (
                            <div className="flex items-start gap-4">
                                {/* Super Animated AI Avatar */}
                                <div className="flex-shrink-0 relative">
                                    {/* Thinking Pulse Ring */}
                                    <div className="absolute inset-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-30 animate-ping"></div>

                                    {/* Main Avatar */}
                                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm animate-pulse-thinking">
                                        <Bot className="w-5 h-5 text-white animate-wiggle" />
                                    </div>

                                    {/* Thinking Indicator */}
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse">
                                        <div className="w-full h-full bg-yellow-300 rounded-full animate-ping"></div>
                                    </div>
                                </div>

                                {/* Enhanced Typing Animation */}
                                <div className="flex-1">
                                    <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm max-w-[85%] animate-fade-in">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce-typing" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-bounce-typing" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-purple-500 rounded-full animate-bounce-typing" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className="text-sm text-muted-foreground ml-2 animate-pulse">AI is thinking...</span>
                                                <Sparkles className="w-4 h-4 text-purple-500 animate-spin-slow" />
                                            </div>

                                            {/* Stop Button in Loading Indicator */}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={handleStop}
                                                            className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                                                        >
                                                            <Square className="w-3 h-3 fill-current" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Stop generating</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

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

                        {/* Enhanced Send/Stop Button */}
                        {isLoading ? (
                            <Button
                                type="button"
                                size="icon"
                                onClick={handleStop}
                                className={cn(
                                    "h-[60px] w-[60px] flex-shrink-0 transition-all duration-200",
                                    "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                                    "shadow-lg hover:shadow-xl hover:scale-105"
                                )}
                            >
                                <Square className="w-5 h-5 fill-current" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!inputValue.trim()}
                                className={cn(
                                    "h-[60px] w-[60px] flex-shrink-0 transition-all duration-200",
                                    "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                                    "shadow-lg hover:shadow-xl hover:scale-105",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                )}
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        )}
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
                                AI is thinking... Click stop to cancel
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
            {/* Enhanced Animated Avatar */}
            <div className="flex-shrink-0">
                <div className="relative">
                    <div
                        className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 hover:scale-110',
                            isUser
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-blue-200'
                                : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-purple-200 animate-pulse-subtle'
                        )}
                    >
                        {isUser ? (
                            <User className="w-5 h-5 transition-transform duration-200" />
                        ) : (
                            <Bot className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" />
                        )}
                    </div>

                    {/* AI Avatar Breathing Ring */}
                    {!isUser && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-20 animate-ping-slow"></div>
                    )}

                    {/* Status Indicator */}
                    {!isUser && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-bounce-gentle">
                            <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Content */}
            <div className={cn('flex-1', isUser && 'flex justify-end')}>
                <div className="relative group/message max-w-[85%] w-fit">
                    <Card
                        className={cn(
                            'p-4 shadow-sm transition-all duration-200 hover:shadow-md',
                            isUser
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        )}
                    >
                        <div className="max-w-none">
                            <p className={cn(
                                "whitespace-pre-wrap break-words m-0 leading-relaxed word-break-break-word",
                                isUser ? "text-white" : "text-foreground"
                            )}>
                                {message.content}
                            </p>
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
                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground px-2 mt-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </div>
    );
}