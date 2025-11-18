/**
 * AI Dashboard Integration Example
 * 
 * This file demonstrates how to integrate the AI Dashboard component
 * into the main dashboard page alongside existing content.
 * 
 * This is an example file - not meant to be used directly in production.
 */

'use client';

import { AIDashboard } from '@/components/ai-dashboard';
import { useUser } from '@/aws/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Example 1: AI Dashboard as a separate tab
 */
export function DashboardWithAITab() {
    const { user } = useUser();

    if (!user) return null;

    return (
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
                {/* Existing dashboard content */}
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Stats content */}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="ai-insights">
                {/* AI Dashboard */}
                <AIDashboard
                    userId={user.id}
                    userName={user.attributes?.name || user.email?.split('@')[0]}
                />
            </TabsContent>

            <TabsContent value="analytics">
                {/* Analytics content */}
            </TabsContent>
        </Tabs>
    );
}

/**
 * Example 2: AI Dashboard as a sidebar widget
 */
export function DashboardWithAISidebar() {
    const { user } = useUser();

    if (!user) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Main dashboard content */}
                    </CardContent>
                </Card>
            </div>

            {/* AI Sidebar */}
            <div className="lg:col-span-1">
                <AIDashboard
                    userId={user.id}
                    userName={user.attributes?.name || user.email?.split('@')[0]}
                />
            </div>
        </div>
    );
}

/**
 * Example 3: AI Dashboard at the top of the page
 */
export function DashboardWithAIHeader() {
    const { user } = useUser();

    if (!user) return null;

    return (
        <div className="space-y-6">
            {/* AI Dashboard at top */}
            <AIDashboard
                userId={user.id}
                userName={user.attributes?.name || user.email?.split('@')[0]}
            />

            {/* Existing dashboard content below */}
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Stats content */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/**
 * Example 4: Conditional AI Dashboard (only show if user has enough data)
 */
export function DashboardWithConditionalAI() {
    const { user } = useUser();
    const [showAI, setShowAI] = useState(false);

    useEffect(() => {
        // Check if user has enough activity to show AI recommendations
        async function checkActivity() {
            if (!user) return;

            const engine = getPersonalizationEngine();
            const profile = await engine.getProfile(user.id);

            // Show AI dashboard if user has used at least 3 features
            const featureCount = Object.keys(profile.frequentFeatures).length;
            setShowAI(featureCount >= 3);
        }

        checkActivity();
    }, [user]);

    if (!user) return null;

    return (
        <div className="space-y-6">
            {/* Show AI Dashboard only if user has enough activity */}
            {showAI && (
                <AIDashboard
                    userId={user.id}
                    userName={user.attributes?.name || user.email?.split('@')[0]}
                />
            )}

            {/* Regular dashboard content */}
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Dashboard content */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/**
 * Example 5: AI Dashboard with custom sections
 */
export function DashboardWithCustomAI() {
    const { user } = useUser();
    const [dashboardData, setDashboardData] = useState<PersonalizedDashboard | null>(null);

    useEffect(() => {
        async function loadData() {
            if (!user) return;

            const engine = getPersonalizationEngine();
            const data = await engine.getPersonalizedDashboard(user.id);
            setDashboardData(data);
        }

        loadData();
    }, [user]);

    if (!user || !dashboardData) return null;

    return (
        <div className="space-y-6">
            {/* Show only priority actions in a compact card */}
            {dashboardData.priorityActions.length > 0 && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Today's Priorities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {dashboardData.priorityActions.slice(0, 3).map((action, i) => (
                                <Link key={i} href={action.href}>
                                    <div className="p-3 rounded-lg hover:bg-primary/10 transition-colors">
                                        <p className="font-medium text-sm">{action.title}</p>
                                        <p className="text-xs text-muted-foreground">{action.reason}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Regular dashboard content */}
            <div className="grid gap-6">
                {/* ... */}
            </div>
        </div>
    );
}

// Import statements needed for Example 4 and 5
import { useState, useEffect } from 'react';
import { getPersonalizationEngine, type PersonalizedDashboard } from '@/lib/ai-personalization';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
