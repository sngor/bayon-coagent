/**
 * Market Notifications Demo Page
 * 
 * Demonstrates the market notifications system with AI-powered insights
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationList } from '@/components/ui/market-notifications';
import { NotificationPreferencesForm } from '@/components/ui/notification-preferences';
import { useMarketNotifications } from '@/hooks/use-market-notifications';
import { useUser } from '@/aws/auth/use-user';
import { showSuccessToast, showAIToast } from '@/hooks/use-toast';
import {
    getMarketNotificationsService,
    MarketChangeEvent,
} from '@/lib/market-notifications';
import { getPersonalizationEngine } from '@/lib/ai-personalization';

export default function MarketNotificationsDemoPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = React.useState('notifications');
    const [generating, setGenerating] = React.useState(false);

    const {
        notifications,
        unreadCount,
        preferences,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        updatePreferences,
    } = useMarketNotifications(user?.id, {
        autoRefresh: true,
        refreshInterval: 30000, // 30 seconds
    });

    /**
     * Simulates a market change event for demo purposes
     */
    const simulateMarketChange = async () => {
        if (!user?.id) return;

        setGenerating(true);
        showAIToast('Analyzing Market Changes', 'AI is evaluating market data...');

        try {
            const service = getMarketNotificationsService();
            const personalizationEngine = getPersonalizationEngine();

            // Get user profile for context
            const profile = await personalizationEngine.getProfile(user.id);

            // Simulate a market change event
            const event: MarketChangeEvent = {
                type: 'price_change',
                market: profile.marketFocus[0] || 'Downtown',
                data: {
                    change: Math.random() > 0.5 ? 5.2 : -3.8,
                    averagePrice: 450000,
                    inventoryLevel: 'low',
                },
                timestamp: Date.now(),
            };

            // Analyze and potentially send notification
            const analysis = await service.analyzeMarketChange(user.id, event, {
                marketFocus: profile.marketFocus,
                recentActivity: [],
                goals: profile.goals.shortTerm,
            });

            if (analysis.shouldNotify && analysis.notification) {
                await service.sendNotification(user.id, analysis.notification);
                showSuccessToast(
                    'Notification Created',
                    'AI detected a significant market change'
                );
                await refreshNotifications();
            } else {
                showSuccessToast(
                    'No Notification Needed',
                    'AI determined this change is not significant enough'
                );
            }
        } catch (error) {
            console.error('Failed to simulate market change:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="container max-w-6xl py-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                            <Bell className="h-8 w-8" />
                            Market Notifications
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2">
                            AI-powered notifications about market changes and opportunities
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={refreshNotifications}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            onClick={simulateMarketChange}
                            disabled={generating || !user}
                            className="bg-gradient-to-r from-primary to-purple-600"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Simulate Market Change
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Unread Notifications</CardDescription>
                            <CardTitle className="text-3xl">{unreadCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Notifications</CardDescription>
                            <CardTitle className="text-3xl">{notifications.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Notifications Enabled</CardDescription>
                            <CardTitle className="text-3xl">
                                {preferences?.enabled ? 'Yes' : 'No'}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            </motion.div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="notifications" className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                            {unreadCount > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="notifications" className="mt-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Your Notifications</CardTitle>
                                        <CardDescription>
                                            AI-powered insights about your market
                                        </CardDescription>
                                    </div>
                                    {unreadCount > 0 && (
                                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                                            Mark All Read
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading && notifications.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <NotificationList
                                        notifications={notifications}
                                        onMarkAsRead={markAsRead}
                                        onDismiss={dismissNotification}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-6">
                        {preferences ? (
                            <NotificationPreferencesForm
                                preferences={preferences}
                                onUpdate={updatePreferences}
                                loading={loading}
                            />
                        ) : (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </motion.div>

            {/* Feature explanation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            How It Works
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold">AI-Powered Analysis</h4>
                                <p className="text-sm text-muted-foreground">
                                    Our AI continuously monitors market changes and analyzes their
                                    relevance to your business, only notifying you about what matters.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">Smart Prioritization</h4>
                                <p className="text-sm text-muted-foreground">
                                    Notifications are automatically prioritized based on urgency,
                                    relevance, and potential impact on your business.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">Actionable Insights</h4>
                                <p className="text-sm text-muted-foreground">
                                    Each notification includes AI-generated insights and recommended
                                    actions to help you respond effectively.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">Customizable Preferences</h4>
                                <p className="text-sm text-muted-foreground">
                                    Control when, how, and what notifications you receive with
                                    granular settings including quiet hours and frequency limits.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
