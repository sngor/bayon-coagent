'use client';

/**
 * Bayon AI Assistant Page
 * 
 * Main chat interface for the AI assistant with agent profile integration.
 */

import { useState, useEffect } from 'react';
import { StandardPageLayout } from '@/components/standard';
import { ChatInterface, AgentProfilePreview } from '@/components/bayon-assistant';

import { FavoritesButton } from '@/components/favorites-button';
import { getPageMetadata } from '@/lib/page-metadata';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
    GlassCard,
    GlassCardHeader,
    GlassCardTitle,
    GlassCardDescription,
    GlassCardContent,
} from '@/components/ui/glass-card';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAgentProfile } from '@/app/profile-actions';
import { useUser } from '@/aws/auth';
import { MessageSquare, Info, Loader2, Settings, History, Plus, RotateCcw, Trash2, Edit2, Check, X, MoreVertical, Cloud, HardDrive } from 'lucide-react';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import Link from 'next/link';
import { useChatHistory } from '@/hooks/use-chat-history';
import { migrateChatHistoryToServer, hasLocalChatHistory, getLocalChatHistoryCount } from '@/lib/migrate-chat-history';
import { toast } from '@/hooks/use-toast';

export default function AssistantPage() {
    const { user } = useUser();
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatKey, setChatKey] = useState<number>(0); // Force re-render of ChatInterface
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState<string>('');
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
    const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);

    // Use server-side chat history hook
    const {
        sessions: chatHistory,
        currentSession,
        isLoading: isLoadingHistory,
        saveSession,
        loadSession,
        updateTitle,
        deleteSession,
        deleteAllSessions,
    } = useChatHistory();

    // Load existing profile on mount
    useEffect(() => {
        async function loadProfile() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                // Call the server action directly - it doesn't need form data
                const result = await getAgentProfile();
                if (result.success && result.data) {
                    setProfile(result.data);
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadProfile();
    }, [user]);

    // Check for localStorage data that needs migration
    useEffect(() => {
        if (user?.id && typeof window !== 'undefined') {
            if (hasLocalChatHistory(user.id)) {
                setShowMigrationPrompt(true);
            }
        }
    }, [user?.id]);

    // Handle migration from localStorage to server
    const handleMigration = async () => {
        if (!user?.id) return;

        setIsMigrating(true);
        try {
            const result = await migrateChatHistoryToServer(user.id);

            if (result.success) {
                toast({
                    title: '✨ Migration Complete!',
                    description: `Successfully migrated ${result.migrated} chat sessions to cloud storage`,
                });
                setShowMigrationPrompt(false);
                // Reload sessions to show migrated data
                window.location.reload();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Migration Failed',
                    description: result.errors.join(', '),
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Migration Error',
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsMigrating(false);
        }
    };

    // Initialize with a new chat on first load
    useEffect(() => {
        if (!currentChatId && !isLoading) {
            const initialChatId = `chat-${Date.now()}`;
            setCurrentChatId(initialChatId);
        }
    }, [currentChatId, isLoading]);

    const handleProfileUpdate = (updatedProfile: AgentProfile) => {
        setProfile(updatedProfile);
    };

    const handleNewChat = () => {
        // Save current chat to history if it exists and has messages
        if (currentChatId && chatMessages.length > 0) {
            const lastMessage = chatMessages[chatMessages.length - 1];
            const newHistoryItem = {
                id: currentChatId,
                title: `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                lastMessage: lastMessage?.content || "No messages",
                timestamp: new Date().toISOString(),
                messageCount: chatMessages.length,
                messages: [...chatMessages]
            };
            setChatHistory(prev => [newHistoryItem, ...prev]);
        }

        // Start new chat
        const newChatId = `chat-${Date.now()}`;
        setCurrentChatId(newChatId);
        setChatMessages([]);
        setChatKey(prev => prev + 1); // Force ChatInterface to re-render
        setActiveTab('chat');
    };

    const handleEndChat = () => {
        if (currentChatId && chatMessages.length > 0) {
            // Save current chat to history
            const lastMessage = chatMessages[chatMessages.length - 1];
            const newHistoryItem = {
                id: currentChatId,
                title: `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                lastMessage: lastMessage?.content || "Chat ended",
                timestamp: new Date().toISOString(),
                messageCount: chatMessages.length,
                messages: [...chatMessages]
            };
            setChatHistory(prev => [newHistoryItem, ...prev]);
        }
        setCurrentChatId(null);
        setChatMessages([]);
        setChatKey(prev => prev + 1); // Force ChatInterface to re-render
    };

    const handleLoadChat = (chatId: string) => {
        // Save current chat first if it exists and has messages
        if (currentChatId && chatMessages.length > 0 && currentChatId !== chatId) {
            const lastMessage = chatMessages[chatMessages.length - 1];
            const newHistoryItem = {
                id: currentChatId,
                title: `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                lastMessage: lastMessage?.content || "No messages",
                timestamp: new Date().toISOString(),
                messageCount: chatMessages.length,
                messages: [...chatMessages]
            };
            setChatHistory(prev => [newHistoryItem, ...prev]);
        }

        // Load the selected chat
        const selectedChat = chatHistory.find(chat => chat.id === chatId);
        if (selectedChat) {
            setCurrentChatId(chatId);
            setChatMessages(selectedChat.messages || []);
            setChatKey(prev => prev + 1); // Force ChatInterface to re-render
        }
        setActiveTab('chat');
    };

    const handleMessageSent = (message: any) => {
        setChatMessages(prev => {
            const newMessages = [...prev, message];

            // Auto-update current chat in history if it exists
            if (currentChatId) {
                setChatHistory(prevHistory => {
                    const existingChatIndex = prevHistory.findIndex(chat => chat.id === currentChatId);
                    if (existingChatIndex >= 0) {
                        const updatedHistory = [...prevHistory];
                        updatedHistory[existingChatIndex] = {
                            ...updatedHistory[existingChatIndex],
                            lastMessage: message.content,
                            timestamp: new Date().toISOString(),
                            messageCount: newMessages.length,
                            messages: newMessages
                        };
                        return updatedHistory;
                    }
                    return prevHistory;
                });
            }

            return newMessages;
        });

        // Auto-generate chat ID if this is the first message
        if (!currentChatId) {
            const newChatId = `chat-${Date.now()}`;
            setCurrentChatId(newChatId);
        }
    };

    const handleDeleteChat = (chatId: string) => {
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        setDeletingChatId(null);

        // If we're deleting the current chat, reset to new chat
        if (currentChatId === chatId) {
            setCurrentChatId(null);
            setChatMessages([]);
            setChatKey(prev => prev + 1);
        }
    };

    const handleStartRename = (chatId: string, currentTitle: string) => {
        setEditingChatId(chatId);
        setEditingTitle(currentTitle);
    };

    const handleSaveRename = () => {
        if (editingChatId && editingTitle.trim()) {
            setChatHistory(prev =>
                prev.map(chat =>
                    chat.id === editingChatId
                        ? { ...chat, title: editingTitle.trim() }
                        : chat
                )
            );
        }
        setEditingChatId(null);
        setEditingTitle('');
    };

    const handleCancelRename = () => {
        setEditingChatId(null);
        setEditingTitle('');
    };

    const handleClearAllHistory = () => {
        setChatHistory([]);
        if (user?.id) {
            localStorage.removeItem(`chat-history-${user.id}`);
        }
    };

    if (!user) {
        return (
            <div className="space-y-6">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Please sign in to use the AI assistant.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-headline text-2xl">AI Assistant</CardTitle>
                            <CardDescription>Chat with your AI assistant</CardDescription>
                        </div>
                        {(() => {
                            const pageMetadata = getPageMetadata('/assistant');
                            return pageMetadata ? <FavoritesButton item={pageMetadata} /> : null;
                        })()}
                    </div>
                </CardHeader>
            </Card>
            {/* Profile Setup Alert */}
            {!profile && (
                <GlassCard blur="lg" tint="light" className="border-l-4 border-l-primary animate-fade-in">
                    <GlassCardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                                    <Info className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">🚀 Personalize your AI experience</p>
                                    <p className="text-xs text-muted-foreground">Set up your profile to get responses tailored to your market and expertise</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                            >
                                <Link href="/brand/profile">
                                    <Settings className="h-4 w-4 mr-2" />
                                    <span>Setup Profile</span>
                                </Link>
                            </Button>
                        </div>
                    </GlassCardContent>
                </GlassCard>
            )}

            {/* Chat Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'history')}>
                    <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                        <TabsTrigger value="chat" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">Chat</span>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            <span className="hidden sm:inline">History</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {activeTab === 'chat' && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNewChat}
                            className="flex items-center gap-2 flex-1 sm:flex-none hover:scale-105 transition-transform"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Chat</span>
                        </Button>
                        {currentChatId && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEndChat}
                                className="flex items-center gap-2 flex-1 sm:flex-none hover:scale-105 transition-transform"
                            >
                                <RotateCcw className="h-4 w-4" />
                                <span className="hidden sm:inline">End Chat</span>
                                <span className="sm:hidden">End</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Tab Content */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'history')}>
                <TabsContent value="chat" className="mt-8">
                    <Card className="h-[700px] overflow-hidden shadow-lg border-2 border-border/50 hover:border-primary/20 transition-all duration-300">
                        <ChatInterface
                            key={chatKey} // Force re-render when chat changes
                            profile={profile}
                            conversationId={currentChatId || undefined}
                            initialMessages={chatMessages}
                            onMessageSent={handleMessageSent}
                            className="h-full"
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Chat History</CardTitle>
                                    <CardDescription>
                                        View and continue your previous conversations
                                    </CardDescription>
                                </div>
                                {chatHistory.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDeletingChatId('all')}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Clear All
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {chatHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No chat history yet</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Start a conversation to see your chat history here
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {chatHistory.map((chat) => (
                                        <div
                                            key={chat.id}
                                            className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 hover:shadow-sm"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {/* Chat Icon */}
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <MessageSquare className="w-5 h-5 text-purple-600" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {editingChatId === chat.id ? (
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Input
                                                                value={editingTitle}
                                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                                className="h-8"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveRename();
                                                                    if (e.key === 'Escape') handleCancelRename();
                                                                }}
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={handleSaveRename}
                                                                className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={handleCancelRename}
                                                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <h3 className="font-headline font-medium truncate group-hover:text-primary transition-colors">{chat.title}</h3>
                                                    )}
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {chat.lastMessage}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(chat.timestamp).toLocaleDateString()}
                                                        </p>
                                                        <span className="text-xs text-muted-foreground">•</span>
                                                        <div className="flex items-center gap-1">
                                                            <MessageSquare className="w-3 h-3 text-muted-foreground" />
                                                            <span className="text-xs text-muted-foreground">{chat.messageCount}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleLoadChat(chat.id)}
                                                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Continue
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleStartRename(chat.id, chat.title)}
                                                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                                    title="Rename chat"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeletingChatId(chat.id)}
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    title="Delete chat"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={!!deletingChatId} onOpenChange={() => setDeletingChatId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {deletingChatId === 'all' ? 'Clear All Chat History' : 'Delete Chat'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    {deletingChatId === 'all'
                                        ? 'This will permanently delete all your chat history. This action cannot be undone.'
                                        : 'This will permanently delete this chat conversation. This action cannot be undone.'
                                    }
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        if (deletingChatId === 'all') {
                                            handleClearAllHistory();
                                        } else if (deletingChatId) {
                                            handleDeleteChat(deletingChatId);
                                        }
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TabsContent>
            </Tabs>
        </div>
    );
}
