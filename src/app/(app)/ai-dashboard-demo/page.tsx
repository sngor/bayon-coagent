'use client';

/**
 * AI Dashboard Demo Page
 * 
 * Demonstrates the AI-powered dashboard component with personalized recommendations.
 */

import { AIDashboard } from '@/components/ai-dashboard';
import { PageHeader } from '@/components/page-header';
import { useUser } from '@/aws/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AIDashboardDemoPage() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="AI-Powered Dashboard"
                    description="Loading your personalized experience..."
                />
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-64" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="AI-Powered Dashboard"
                    description="Please sign in to view your personalized dashboard"
                />
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">
                            You need to be signed in to view personalized recommendations.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI-Powered Dashboard Demo"
                description="Experience personalized recommendations powered by AI"
            />

            <AIDashboard
                userId={user.id}
                userName={user.attributes?.name || user.email?.split('@')[0]}
            />

            {/* Info card */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">About This Dashboard</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        This AI-powered dashboard learns from your behavior and provides personalized recommendations:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li>Priority actions based on your goals and usage patterns</li>
                        <li>Market insights relevant to your focus areas</li>
                        <li>Content suggestions based on what works for you</li>
                        <li>Next best actions predicted from your workflow</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-4 italic">
                        The more you use the platform, the better the recommendations become.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
