'use client';

/**
 * Bayon AI Assistant Demo Page
 * 
 * Demonstrates the agent profile management UI components.
 * Shows both the form and preview components in action.
 */

import { useState, useEffect } from 'react';
import { StandardPageLayout } from '@/components/standard';
import { AgentProfileForm, AgentProfilePreview } from '@/components/bayon-assistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAgentProfile } from '@/app/profile-actions';
import { useUser } from '@/aws/auth';
import { Sparkles, Info, Loader2 } from 'lucide-react';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

export default function BayonAssistantDemoPage() {
    const { user } = useUser();
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                setError('Failed to load profile');
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
                title="AI Assistant Demo"
                description="Agent Profile Management"
                spacing="default"
            >
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Please sign in to manage your agent profile.
                    </AlertDescription>
                </Alert>
            </StandardPageLayout>
        );
    }

    if (isLoading) {
        return (
            <StandardPageLayout
                title="AI Assistant Demo"
                description="Agent Profile Management"
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
            title="AI Assistant Demo"
            description="Personalize your AI assistant with your professional profile"
            spacing="default"
        >
            <div className="space-y-6">
                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle className="font-headline">About Agent Profiles</CardTitle>
                        </div>
                        <CardDescription>
                            Your agent profile personalizes all AI responses to match your market, specialization, and communication style.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>All AI-generated content will incorporate your name, market, and core principle</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Property suggestions will prioritize your primary market</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Content tone will match your preferred communication style</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Updates apply immediately to all subsequent AI interactions</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Main Content */}
                {profile ? (
                    <Tabs defaultValue="preview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="preview">Profile Preview</TabsTrigger>
                            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                        </TabsList>
                        <TabsContent value="preview" className="mt-6">
                            <AgentProfilePreview
                                profile={profile}
                                onUpdate={handleProfileUpdate}
                                showEditButton={false}
                            />
                        </TabsContent>
                        <TabsContent value="edit" className="mt-6">
                            <AgentProfileForm
                                profile={profile}
                                onSuccess={handleProfileUpdate}
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                You haven't created an agent profile yet. Create one now to personalize your AI assistant.
                            </AlertDescription>
                        </Alert>
                        <AgentProfileForm onSuccess={handleProfileUpdate} />
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </div>
        </StandardPageLayout>
    );
}
