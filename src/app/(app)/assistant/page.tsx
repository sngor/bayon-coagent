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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
            <StandardPageLayout
                title="AI Assistant"
                description="Your intelligent real estate assistant"
                spacing="default"
            >
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Please sign in to use the AI assistant.
                    </AlertDescription>
                </Alert>
            </StandardPageLayout>
        );
    }

    if (isLoading) {
        return (
            <StandardPageLayout
                title="AI Assistant"
                description="Your intelligent real estate assistant"
                spacing="default"
            >
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title="AI Assistant"
            description="Get instant answers, research insights, and personalized content recommendations"
            spacing="default"
        >
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
                                    Setup Profile
                                </Button>
                            </div>
                        </GlassCardContent>
                    </GlassCard>
                )}

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'profile')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="chat">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
                        </TabsTrigger>
                        <TabsTrigger value="profile">
                            <Settings className="h-4 w-4 mr-2" />
                            Profile
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
                                        <Link href="/brand-center/profile">
                                            Go to Brand Center to Setup Profile
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </StandardPageLayout>
    );
}
