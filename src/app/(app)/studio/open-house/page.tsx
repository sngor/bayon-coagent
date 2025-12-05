'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, FileText, Share2, Mail } from 'lucide-react';
import { OpenHouseMarketingForm } from '@/components/open-house/open-house-marketing-form';
import { FlyerGenerator } from '@/components/open-house/flyer-generator';
import { SocialPostGenerator } from '@/components/open-house/social-post-generator';
import { EmailInviteGenerator } from '@/components/open-house/email-invite-generator';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageMetadata } from '@/lib/page-metadata';

/**
 * Studio Hub - Open House Marketing Materials Page
 * 
 * Allows agents to generate professional marketing materials for their open house sessions:
 * - Flyers with property details and QR codes
 * - Social media posts optimized for different platforms
 * - Email invitations with calendar attachments
 * 
 * Validates Requirements: 16.1, 16.2, 16.3, 16.4
 */
export default function OpenHouseMarketingPage() {
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('flyer');
    const pageMetadata = getPageMetadata('/studio/open-house');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Open House Marketing</h1>
                    <p className="text-muted-foreground mt-2">
                        Create professional marketing materials for your open house sessions
                    </p>
                </div>
                {pageMetadata && <FavoritesButton item={pageMetadata} variant="outline" size="sm" />}
            </div>

            {/* Session Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Select Open House Session
                    </CardTitle>
                    <CardDescription>
                        Choose a session to generate marketing materials
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OpenHouseMarketingForm
                        selectedSessionId={selectedSessionId}
                        onSessionSelect={setSelectedSessionId}
                    />
                </CardContent>
            </Card>

            {/* Marketing Material Generators */}
            {selectedSessionId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Marketing Materials</CardTitle>
                        <CardDescription>
                            Create flyers, social posts, and email invitations for your open house
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="flyer" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Flyer
                                </TabsTrigger>
                                <TabsTrigger value="social" className="flex items-center gap-2">
                                    <Share2 className="h-4 w-4" />
                                    Social Posts
                                </TabsTrigger>
                                <TabsTrigger value="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email Invite
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="flyer" className="mt-6">
                                <FlyerGenerator sessionId={selectedSessionId} />
                            </TabsContent>

                            <TabsContent value="social" className="mt-6">
                                <SocialPostGenerator sessionId={selectedSessionId} />
                            </TabsContent>

                            <TabsContent value="email" className="mt-6">
                                <EmailInviteGenerator sessionId={selectedSessionId} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!selectedSessionId && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Home className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Session Selected</h3>
                        <p className="text-muted-foreground max-w-md">
                            Select an open house session above to start generating professional marketing materials.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
