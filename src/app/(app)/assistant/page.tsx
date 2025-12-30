'use client';

/**
 * Enhanced Bayon AI Assistant Page
 * 
 * Context-aware chat interface with real estate expertise and workflow integration.
 */

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/bayon-assistant';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAgentProfile } from '@/app/profile-actions';
import { useUser } from '@/aws/auth';
import { 
    MessageSquare, 
    Info, 
    Loader2, 
    History, 
    Plus, 
    RotateCcw, 
    Trash2, 
    Edit2, 
    Check, 
    X,
    Sparkles,
    TrendingUp,
    Users,
    Home,
    Calculator,
    FileText,
    Lightbulb,
    Target,
    Clock
} from 'lucide-react';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import { useChatHistory } from '@/hooks/use-chat-history';
import { migrateChatHistoryToServer, hasLocalChatHistory } from '@/lib/migrate-chat-history';
import { toast } from '@/hooks/use-toast';
import type { Message } from '@/components/bayon-assistant/chat-interface';

// Quick action suggestions based on user context
const quickStartPrompts = [
    {
        id: 'market-analysis',
        title: 'Market Analysis',
        description: 'Get insights on current market trends',
        icon: TrendingUp,
        prompt: 'Analyze the current real estate market trends in my area and provide actionable insights for my business.'
    },
    {
        id: 'content-ideas',
        title: 'Content Ideas',
        description: 'Generate content ideas for social media',
        icon: Lightbulb,
        prompt: 'Suggest 5 engaging social media post ideas for real estate agents this week, including trending topics.'
    },
    {
        id: 'client-follow-up',
        title: 'Client Follow-up',
        description: 'Draft follow-up messages for clients',
        icon: Users,
        prompt: 'Help me create personalized follow-up messages for clients at different stages of the buying process.'
    },
    {
        id: 'listing-strategy',
        title: 'Listing Strategy',
        description: 'Optimize listing presentation',
        icon: Home,
        prompt: 'Review my recent listings and suggest improvements for better engagement and faster sales.'
    },
    {
        id: 'roi-calculation',
        title: 'ROI Analysis',
        description: 'Calculate investment returns',
        icon: Calculator,
        prompt: 'Help me analyze the ROI potential for a property investment and create a presentation for my client.'
    },
    {
        id: 'marketing-plan',
        title: 'Marketing Plan',
        description: 'Create targeted marketing strategies',
        icon: Target,
        prompt: 'Develop a comprehensive marketing plan for my real estate business based on my current performance and goals.'
    }
];

export default function AssistantPage() {
    const { user } = useUser();
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'insights'>('chat');
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [chatKey, setChatKey] = useState(0);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const {
        sessions,
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
                migrateChatHistoryToServer(user.id).then((result) => {
                    if (result.success) {
                        toast({
                            title: "Chat history migrated",
                            description: `Successfully migrated ${result.migrated} chat sessions.`,
                        });
                        // refreshSessions() - method not available
                    }
                }).catch(console.error);
            }
        }
    }, [user]);

    // Chat history management
    const handleNewChat = () => {
        if (!currentChatId || isLoading) {
            setCurrentChatId(null);
        }
        
        if (currentChatId && !isLoading) {
            setCurrentChatId(null);
            setChatMessages([]);
            setChatKey(prev => prev + 1);
            setActiveTab('chat');
        }
    };

    const handleLoadChat = async (chatId: string) => {
        try {
            setCurrentChatId(chatId);
            const session = sessions.find(s => s.id === chatId);
            if (session?.messages) {
                const formattedMessages = session.messages.map((msg: any) => ({
                    id: msg.id || Date.now(),
                    content: msg.content,
                    role: msg.role,
                    timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString(),
                }));
                setChatMessages(formattedMessages);
                setChatKey(prev => prev + 1);
            }
            setActiveTab('chat');
        } catch (error) {
            console.error('Failed to load chat:', error);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            if (currentChatId === chatId) {
                setCurrentChatId(null);
            }
            await deleteSession(chatId);
            setDeletingChatId(null);
            
            if (currentChatId === chatId) {
                setCurrentChatId(null);
                setChatMessages([]);
                setChatKey(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to delete chat:', error);
        }
    };

    const handleEditTitle = () => {
        if (editingChatId && editingTitle.trim()) {
            updateTitle(editingChatId, editingTitle.trim());
        }
        setEditingChatId(null);
        setEditingTitle('');
    };

    const handleCancelEdit = () => {
        setEditingChatId(null);
        setEditingTitle('');
    };

    const handleDeleteAllChats = async () => {
        try {
            await deleteAllSessions();
            if (user) {
                setCurrentChatId(null);
                setChatMessages([]);
                setChatKey(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to delete all chats:', error);
        }
    };

    if (!user || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading your assistant...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">AI Assistant</h1>
                        <p className="text-muted-foreground">Your intelligent real estate companion</p>
                    </div>
                </div>
                
                {profile && (
                    <div className="flex items-center gap-2 mt-4">
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Personalized for {profile.agentName || 'You'}
                        </Badge>
                        {profile.specialization && (
                            <Badge variant="outline">
                                {profile.specialization}
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'history' | 'insights')} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Chat
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        History
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Insights
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Chat with Your AI Assistant</h2>
                        <Button 
                            onClick={handleNewChat}
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Chat
                        </Button>
                    </div>

                    {/* Quick Start Prompts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {quickStartPrompts.map((prompt, index) => (
                            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <prompt.icon className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-sm">{prompt.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-xs">
                                        {prompt.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="border rounded-lg">
                        <ChatInterface
                            key={chatKey}
                            initialMessages={chatMessages}
                            profile={profile}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Chat History</h2>
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => {/* refreshSessions() */}}
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Refresh
                            </Button>
                            {sessions.length > 0 && (
                                <Button 
                                    onClick={handleDeleteAllChats}
                                    variant="destructive" 
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </div>

                    {sessions.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <History className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No chat history yet</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Start a conversation with your AI assistant to see your chat history here.
                                </p>
                                <Button onClick={() => setActiveTab('chat')}>
                                    Start Chatting
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {sessions.map((session) => (
                                <Card key={session.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                {editingChatId === session.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            value={editingTitle}
                                                            onChange={(e) => setEditingTitle(e.target.value)}
                                                            className="flex-1"
                                                            placeholder="Enter chat title..."
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={handleEditTitle}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={handleCancelEdit}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <h3 className="font-semibold text-sm">
                                                            {session.title || 'Untitled Chat'}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(session.updatedAt).toLocaleDateString()} • {session.messages?.length || 0} messages
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleLoadChat(session.id)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <MessageSquare className="h-3 w-3" />
                                                    Open
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingChatId(session.id);
                                                        setEditingTitle(session.title || '');
                                                    }}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setDeletingChatId(session.id)}
                                                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="insights" className="space-y-6">
                    <h2 className="text-xl font-semibold">AI Insights & Analytics</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    <CardTitle className="text-sm">Usage Trends</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>This Week</span>
                                        <span className="font-semibold">12 chats</span>
                                    </div>
                                    <Progress value={75} className="h-2" />
                                    <p className="text-xs text-muted-foreground">
                                        +25% from last week
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    <CardTitle className="text-sm">Top Topics</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Market Analysis</span>
                                        <span className="font-semibold">8</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Content Creation</span>
                                        <span className="font-semibold">5</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Client Questions</span>
                                        <span className="font-semibold">3</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-purple-600" />
                                    <CardTitle className="text-sm">Response Time</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold">1.2s</div>
                                    <p className="text-xs text-muted-foreground">
                                        Average response time
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                        <TrendingUp className="h-3 w-3" />
                                        15% faster than average
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Personalized Recommendations
                            </CardTitle>
                            <CardDescription>
                                Based on your recent conversations and profile
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        You've been asking about market trends frequently. Consider setting up market alerts in the Market Intelligence hub to stay updated automatically.
                                    </AlertDescription>
                                </Alert>
                                
                                <Alert>
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertDescription>
                                        Your content creation requests show interest in social media. Try the Studio hub's social media templates for faster content generation.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingChatId} onOpenChange={() => setDeletingChatId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this chat? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deletingChatId) {
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

            {/* Enhanced Agent Integration */}
            <EnhancedAgentIntegration
                hubContext="assistant"
                position="bottom-left"
                showNotifications={true}
            />
        </div>
    );
}