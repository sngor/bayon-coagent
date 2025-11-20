'use client';

/**
 * Bayon AI Assistant Page
 * 
 * Main chat interface for the AI assistant with agent profile integration.
 */

import { useState, useEffect } from 'react';
import { StandardPageLayout } from '@/components/standard';
import { ChatInterface, AgentProfilePreview } from '@/components/bayon-assistant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { MessageSquare, Info, Loader2, Settings } from 'lucide-react';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import Link from 'next/link';

export default function AssistantPage() {
    const { user } = useUser();
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chat' | 'profile'>('chat');

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

    const handleProfileUpdate = (updatedProfile: AgentProfile) => {
        setProfile(updatedProfile);
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
            <div className="space-y-6">
                {/* Profile Setup Alert with Glass Effect */}
                {!profile && (
                    <GlassCard blur="lg" tint="light">
                        <GlassCardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Info className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-medium">Set up your agent profile to get personalized responses.</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveTab('profile')}
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    <span>Setup Profile</span>
                                </Button>
                            </div>
                        </GlassCardContent>
                    </GlassCard>
                )}

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'profile')} className="w-full">
                    <TabsList>
                        <TabsTrigger value="chat">
                            <MessageSquare className="h-4 w-4" />
                            <span className="whitespace-nowrap">Chat</span>
                        </TabsTrigger>
                        <TabsTrigger value="profile">
                            <Settings className="h-4 w-4" />
                            <span className="whitespace-nowrap">Profile</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="mt-6">
                        <ChatInterface profile={profile} />
                    </TabsContent>

                    <TabsContent value="profile" className="mt-6">
                        {profile ? (
                            <AgentProfilePreview
                                profile={profile}
                                onUpdate={handleProfileUpdate}
                                showEditButton={true}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Agent Profile</CardTitle>
                                    <CardDescription>
                                        Create your profile to personalize AI responses
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild>
                                        <Link href="/brand/profile">Go to Brand to Setup Profile</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
