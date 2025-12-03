'use client';

/**
 * Quick Actions Demo Component
 * 
 * Demonstrates the Quick Actions menu system with:
 * - Grid and list variants
 * - Usage analytics display
 * - Action execution feedback
 * - Customization options
 */

import { useState } from 'react';
import { QuickActionsMenu } from './quick-actions-menu';
import { useQuickActions } from '@/hooks/use-quick-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Clock, Zap } from 'lucide-react';

interface QuickActionsDemoProps {
    userId?: string;
}

export function QuickActionsDemo({ userId }: QuickActionsDemoProps) {
    const [variant, setVariant] = useState<'grid' | 'list'>('grid');
    const {
        actions,
        recentActions,
        pinnedActions,
        analytics,
        refresh,
    } = useQuickActions({ userId, maxActions: 8 });

    return (
        <div className="space-y-6 p-4 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold mb-2">Quick Actions Menu</h1>
                <p className="text-muted-foreground">
                    Mobile-optimized quick access to common agent workflows
                </p>
            </div>

            {/* Variant selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <Button
                    variant={variant === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVariant('grid')}
                >
                    Grid
                </Button>
                <Button
                    variant={variant === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVariant('list')}
                >
                    List
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    className="ml-auto"
                >
                    Refresh
                </Button>
            </div>

            {/* Quick Actions Menu */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Your most-used actions, prioritized by frequency
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <QuickActionsMenu
                        userId={userId}
                        maxVisible={8}
                        variant={variant}
                        showCustomize={true}
                    />
                </CardContent>
            </Card>

            {/* Analytics */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                    <TabsTrigger value="pinned">Pinned</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Usage Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-muted">
                                    <div className="text-2xl font-bold">{analytics.totalActions}</div>
                                    <div className="text-sm text-muted-foreground">Total Actions</div>
                                </div>
                                <div className="p-4 rounded-lg bg-muted">
                                    <div className="text-2xl font-bold">{pinnedActions.length}</div>
                                    <div className="text-sm text-muted-foreground">Pinned Actions</div>
                                </div>
                            </div>

                            {analytics.mostUsedAction && (
                                <div className="p-4 rounded-lg border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <span className="font-medium">Most Used Action</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Action ID: {analytics.mostUsedAction.actionId}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Used {analytics.mostUsedAction.usageCount} times
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="recent" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Recent Actions
                            </CardTitle>
                            <CardDescription>
                                Actions you've used recently, sorted by frequency
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentActions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No recent actions yet</p>
                                    <p className="text-xs">Start using quick actions to see them here</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentActions.map((action) => (
                                        <div
                                            key={action.id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div>
                                                <div className="font-medium text-sm">{action.label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {action.description}
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{action.category}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pinned" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pinned Actions</CardTitle>
                            <CardDescription>
                                Actions you've pinned for quick access
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pinnedActions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No pinned actions yet</p>
                                    <p className="text-xs">Pin actions to keep them at the top</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pinnedActions.map((action) => (
                                        <div
                                            key={action.id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div>
                                                <div className="font-medium text-sm">{action.label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {action.description}
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{action.category}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Usage Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>How to Use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-primary">1</span>
                        </div>
                        <div>
                            <strong>Tap an action</strong> to execute it. Actions will navigate to the appropriate page or trigger a server action.
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-primary">2</span>
                        </div>
                        <div>
                            <strong>Pin actions</strong> to keep them at the top of your quick menu. Pinned actions are always visible.
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-primary">3</span>
                        </div>
                        <div>
                            <strong>Frequently used actions</strong> are automatically prioritized and appear higher in the list.
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-primary">4</span>
                        </div>
                        <div>
                            <strong>Offline actions</strong> are queued automatically and will execute when you're back online.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
