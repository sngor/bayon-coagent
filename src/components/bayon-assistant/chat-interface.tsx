'use client';

/**
 * Chat Interface Component - Enhanced UI/UX Version
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './avatar-animations.css';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/common';
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
    Square,
    Mic,
    MicOff,
    Image,
    Paperclip,
    MoreHorizontal,
    Zap,
    Clock,
    CheckCircle2,
    X
} from 'lucide-react';
import { handleChatQuery, type ChatQueryResponse } from '@/features/intelligence/actions/bayon-assistant-actions';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/aws/auth';

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
    attachments?: Array<{
        id: string;
        name: string;
        type: string;
        size: number;
        url?: string;
        content?: string; // For text files or extracted text
    }>;
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
 * Chat Interface Component
 */
export function ChatInterface({
    conversationId,
    initialMessages = [],
    className,
    onMessageSent,
    placeholder = "Hi! What's on your mind today? Ask about deals, market trends, clients, or anything real estate! 😊",
}: ChatInterfaceProps) {
    const { userName } = useUserProfile();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [messageCount, setMessageCount] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState<Array<{
        id: string;
        name: string;
        type: string;
        size: number;
        file: File;
        content?: string;
    }>>([]);
    const [isProcessingFiles, setIsProcessingFiles] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Handle typing indicator
    const handleInputChange = (value: string) => {
        setInputValue(value);
        setIsTyping(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 1000);

        // Hide suggestions when user starts typing
        if (value.trim() && showSuggestions) {
            setShowSuggestions(false);
        }
    };

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputValue, adjustTextareaHeight]);

    // Handle file upload
    const handleFileUpload = async (files: FileList) => {
        setIsProcessingFiles(true);
        const newFiles: Array<{
            id: string;
            name: string;
            type: string;
            size: number;
            file: File;
            content?: string;
        }> = [];

        for (const file of Array.from(files)) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                continue;
            }

            const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            let content: string | undefined;

            // Extract text content for text files
            if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                try {
                    content = await file.text();
                } catch (error) {
                    console.error('Error reading text file:', error);
                }
            }

            newFiles.push({
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                file,
                content,
            });
        }

        setUploadedFiles(prev => [...prev, ...newFiles]);
        setIsProcessingFiles(false);
    };

    // Handle file removal
    const handleRemoveFile = (fileId: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files);
        }
    };

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
            attachments: uploadedFiles.length > 0 ? uploadedFiles.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                size: f.size,
                content: f.content,
            })) : undefined,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setUploadedFiles([]);
        setIsLoading(true);
        setMessageCount(prev => prev + 1);
        setShowSuggestions(false);

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Create form data manually to ensure proper values
        const formData = new FormData();
        formData.set('query', userMessage.content);
        if (conversationId) {
            formData.set('conversationId', conversationId);
        }

        // Add file information
        if (userMessage.attachments && userMessage.attachments.length > 0) {
            formData.set('attachments', JSON.stringify(userMessage.attachments));
        }

        try {
            const result = await handleChatQuery({ success: false }, formData);

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

    // Quick action suggestions
    const quickActions = [
        { icon: TrendingUp, text: "Market Analysis", query: "What are the current market trends in my area?" },
        { icon: MessageCircle, text: "Client Scripts", query: "Give me a script for following up with potential buyers" },
        { icon: Search, text: "Lead Generation", query: "What are the best lead generation strategies for 2024?" },
        { icon: Zap, text: "Deal Strategy", query: "How can I structure a competitive offer in this market?" }
    ];

    const handleQuickAction = (query: string) => {
        setInputValue(query);
        setShowSuggestions(false);
        // Auto-focus textarea after setting value
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    return (
        <div
            className={cn('flex flex-col h-full bg-gradient-to-b from-background to-muted/10 relative ai-chatbot-context', className)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag and Drop Overlay */}
            {isDragOver && (
                <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 flex items-center justify-center">
                    <div className="text-center">
                        <Paperclip className="w-12 h-12 text-primary mx-auto mb-4" />
                        <p className="text-lg font-semibold text-primary">Drop files here to upload</p>
                        <p className="text-sm text-muted-foreground">Supports PDF, TXT, DOC, images, and more</p>
                    </div>
                </div>
            )}

            {/* Chat Header */}
            <div className="flex-shrink-0 border-b border-border/20 p-4 relative overflow-hidden">
                {/* Gradient blur background - strong at top, soft at bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/15 via-blue-500/8 to-transparent backdrop-blur-[20px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-transparent backdrop-blur-[12px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent dark:from-white/5 dark:via-white/2 dark:to-transparent"></div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">AI Assistant</h3>
                                <p className="text-xs text-muted-foreground">
                                    {isLoading ? 'Thinking...' : 'Online'}
                                </p>
                            </div>
                        </div>

                        {messageCount > 0 && (
                            <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/50">
                                {messageCount} messages
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-4 max-w-3xl mx-auto">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center py-8 px-4">
                                {/* Enhanced Animated AI Avatar */}
                                <div className="relative mb-4 group/avatar">
                                    {/* Outer Breathing Ring */}
                                    <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-20 animate-ping-slow"></div>

                                    {/* Middle Glow Ring */}
                                    <div className="absolute inset-1 w-14 h-14 rounded-full bg-gradient-to-br from-blue-300 to-purple-400 opacity-30 animate-pulse-gentle"></div>

                                    {/* Main Avatar */}
                                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-110 animate-float">
                                        <Bot className="w-8 h-8 text-white transition-transform duration-300 group-hover/avatar:rotate-12 group-hover/avatar:scale-110" />

                                        {/* Inner Sparkle Effect */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"></div>
                                    </div>

                                    {/* Status Indicator with Animation */}
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-gentle hover:animate-spin-slow">
                                        <Sparkles className="w-2.5 h-2.5 text-white animate-twinkle" />
                                    </div>

                                    {/* Floating Particles */}
                                    <div className="absolute -top-2 -left-2 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60 animate-float-delayed"></div>
                                    <div className="absolute -bottom-2 -right-2 w-1 h-1 bg-purple-400 rounded-full opacity-60 animate-float-delayed-2"></div>
                                    <div className="absolute top-1/2 -left-3 w-0.5 h-0.5 bg-green-400 rounded-full opacity-60 animate-float-delayed-3"></div>
                                </div>

                                {/* Welcome Message */}
                                <div className="max-w-lg space-y-3 text-center">
                                    <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
                                        👋 Hi there! I'm your AI real estate assistant
                                    </h2>
                                    <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                        I'm here to help you succeed in real estate! Ask me about market trends, deal strategies, client communication, or anything else.
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                {showSuggestions && (
                                    <div className="mt-6 w-full max-w-lg">
                                        <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
                                            Quick actions:
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {quickActions.map((action, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleQuickAction(action.query)}
                                                    className="flex items-center gap-2 p-3 text-left bg-muted/50 hover:bg-muted rounded-lg transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                                                        <action.icon className="w-3 h-3 text-primary group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-medium truncate">{action.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {messages.map((message) => (
                                    <MessageBubble key={message.id} message={message} userName={userName} />
                                ))}

                                {/* Show suggestions after first message */}
                                {messages.length > 0 && showSuggestions && !isLoading && (
                                    <div className="flex flex-wrap gap-2 px-4 py-2">
                                        <p className="text-xs text-muted-foreground w-full mb-2">Suggested follow-ups:</p>
                                        {quickActions.slice(0, 2).map((action, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleQuickAction(action.query)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-muted/50 hover:bg-muted rounded-full transition-colors"
                                            >
                                                <action.icon className="w-3 h-3" />
                                                {action.text}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
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
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                                <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
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
            <div className="flex-shrink-0 border-t bg-background/80 backdrop-blur-sm p-4">
                <form ref={formRef} onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
                    {/* File Upload Inputs */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.txt,.doc,.docx,.md,.csv,.json"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                        aria-label="Upload document files"
                        title="Upload document files"
                    />
                    <input
                        ref={imageInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                        aria-label="Upload image files"
                        title="Upload image files"
                    />

                    {/* File Processing Indicator */}
                    {isProcessingFiles && (
                        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>Processing files...</span>
                        </div>
                    )}

                    {/* Uploaded Files Display */}
                    {uploadedFiles.length > 0 && (
                        <div className="mb-3 space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Attached files ({uploadedFiles.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {uploadedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm border"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {file.type.startsWith('image/') ? (
                                                <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            ) : file.type.includes('pdf') ? (
                                                <div className="w-4 h-4 bg-red-500 rounded text-white text-xs flex items-center justify-center flex-shrink-0">
                                                    PDF
                                                </div>
                                            ) : (
                                                <Paperclip className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <span className="font-medium truncate block">{file.name}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                    {file.content && ` • ${file.content.split(/\s+/).length} words`}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
                                            onClick={() => handleRemoveFile(file.id)}
                                            title="Remove file"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative flex items-end gap-3">
                        {/* Input Actions */}
                        <div className="flex items-center gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                            disabled={isLoading || isProcessingFiles}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Attach file (PDF, TXT, DOC, etc.)</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                            disabled={isLoading || isProcessingFiles}
                                            onClick={() => imageInputRef.current?.click()}
                                        >
                                            <Image className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Add image (JPG, PNG, etc.)</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Enhanced Textarea */}
                        <div className="flex-1 relative">
                            <Textarea
                                ref={textareaRef}
                                name="query"
                                value={inputValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                className={cn(
                                    "min-h-[52px] max-h-[200px] resize-none pr-20 transition-all duration-200",
                                    "border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                                    "bg-white dark:bg-gray-800 shadow-sm rounded-xl",
                                    isLoading && "opacity-50"
                                )}
                                disabled={isLoading}
                                rows={1}
                            />

                            {/* Input Enhancements */}
                            <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                {inputValue.length > 800 && (
                                    <Badge
                                        variant={inputValue.length > 950 ? "destructive" : "secondary"}
                                        className="text-xs h-5"
                                    >
                                        {inputValue.length}/1000
                                    </Badge>
                                )}

                                {inputValue.trim() && !isLoading && (
                                    <div className="flex items-center gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Mic className="w-3 h-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Voice input (coming soon)</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Enhanced Send/Stop Button */}
                        {isLoading ? (
                            <Button
                                type="button"
                                size="icon"
                                onClick={handleStop}
                                className={cn(
                                    "h-[52px] w-[52px] flex-shrink-0 transition-all duration-200",
                                    "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                                    "shadow-lg hover:shadow-xl hover:scale-105 rounded-xl"
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
                                    "h-[52px] w-[52px] flex-shrink-0 transition-all duration-200",
                                    "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                                    "shadow-lg hover:shadow-xl hover:scale-105 rounded-xl",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                )}
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        )}
                    </div>

                    {/* Enhanced Help Text */}
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Press Enter to send, Shift+Enter for new line
                            </p>

                            {messageCount > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    {messageCount} messages sent
                                </div>
                            )}
                        </div>

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
function MessageBubble({ message, userName }: { message: Message; userName: string }) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState<boolean | null>(null);

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFeedback = (isPositive: boolean) => {
        setLiked(isPositive);
        // Here you could send feedback to your analytics service
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={cn('flex items-start gap-3 group animate-fade-in', isUser && 'flex-row-reverse')}>
            {/* Enhanced Animated Avatar */}
            <div className="flex-shrink-0">
                <div className="relative">
                    <div
                        className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-300',
                            isUser
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white animate-pulse-subtle'
                        )}
                    >
                        {isUser ? (
                            <User className="w-4 h-4" />
                        ) : (
                            <Bot className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
                        )}
                    </div>

                    {/* AI Avatar Breathing Ring */}
                    {!isUser && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-20 animate-ping-slow"></div>
                    )}

                    {/* Status Indicator */}
                    {!isUser && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm">
                            <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Content */}
            <div className={cn('flex-1 max-w-[80%] md:max-w-[70%]', isUser && 'flex justify-end')}>
                <div className="relative group/message w-full">
                    {/* Message Header - Only show for AI messages */}
                    {!isUser && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                AI Assistant
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatTime(message.timestamp)}
                            </span>
                        </div>
                    )}

                    <Card
                        className={cn(
                            'p-3 shadow-sm transition-all duration-200 hover:shadow-md relative',
                            isUser
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 rounded-2xl rounded-br-md'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md'
                        )}
                    >
                        <div className="max-w-none">
                            {isUser ? (
                                <p className={cn(
                                    "whitespace-pre-wrap break-words m-0 leading-relaxed text-sm text-white"
                                )}>
                                    {message.content}
                                </p>
                            ) : (
                                <div className={cn(
                                    "whitespace-pre-wrap break-words m-0 leading-relaxed text-sm text-foreground"
                                )}>
                                    {message.content}
                                </div>
                            )}
                        </div>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {message.attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border",
                                            isUser
                                                ? "bg-white/10 border-white/20 text-white"
                                                : "bg-muted/50 border-border"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {attachment.type.startsWith('image/') ? (
                                                <Image className="w-4 h-4 flex-shrink-0" />
                                            ) : (
                                                <Paperclip className="w-4 h-4 flex-shrink-0" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium truncate">{attachment.name}</p>
                                                <p className={cn(
                                                    "text-xs",
                                                    isUser ? "text-white/70" : "text-muted-foreground"
                                                )}>
                                                    {(attachment.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        {attachment.type.startsWith('image/') && attachment.url && (
                                            <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="w-8 h-8 object-cover rounded"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Key Points */}
                        {message.keyPoints && message.keyPoints.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/30">
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1 text-muted-foreground">
                                    <TrendingUp className="w-3 h-3" />
                                    Key Points
                                </p>
                                <ul className="text-xs space-y-1">
                                    {message.keyPoints.map((point, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0"></div>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Citations */}
                        {message.citations && message.citations.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/30">
                                <p className="text-xs font-semibold mb-2 text-muted-foreground">Sources</p>
                                <div className="space-y-1">
                                    {message.citations.map((citation, idx) => (
                                        <a
                                            key={idx}
                                            href={citation.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                        >
                                            {citation.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Message Actions */}
                    {!isUser && (
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={copyToClipboard}
                                            className="h-6 px-2 text-xs hover:bg-muted/50"
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
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleFeedback(true)}
                                            className={cn(
                                                "h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600",
                                                liked === true && "bg-green-100 text-green-600"
                                            )}
                                        >
                                            <ThumbsUp className="w-3 h-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Helpful response</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleFeedback(false)}
                                            className={cn(
                                                "h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600",
                                                liked === false && "bg-red-100 text-red-600"
                                            )}
                                        >
                                            <ThumbsDown className="w-3 h-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Not helpful</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreHorizontal className="w-3 h-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>More actions</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}