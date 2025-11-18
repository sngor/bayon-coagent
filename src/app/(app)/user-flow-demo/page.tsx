/**
 * User Flow Demo Page
 * 
 * Demonstrates the user flow management system with all components
 */

'use client';

import { useState } from 'react';
import { NextStepsCard, NextStepBanner } from '@/components/ui/next-steps-card';
import { ContextualHelp } from '@/components/ui/contextual-help';
import { PrerequisiteCheck } from '@/components/ui/prerequisite-check';
import { QuickActionsMenu, QuickActionsBar } from '@/components/ui/quick-actions-menu';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserFlow } from '@/hooks/use-user-flow';
import type { Profile } from '@/lib/types';

export default function UserFlowDemoPage() {
    // Mock profile data for demo
    const [profile] = useState<Partial<Profile>>({
        name: 'John Doe',
        agencyName: 'Doe Real Estate',
        phone: '555-0123',
        address: '123 Main St, City, State 12345',
        bio: 'Experienced real estate agent...',
    });

    const [hasMarketingPlan] = useState(false);
    const [hasBrandAudit] = useState(false);
    const [hasCompetitors] = useState(false);
    const [hasContent] = useState(false);

    // Use the user flow hook
    const {
        nextSteps,
        contextualHelp,
        quickActions,
        breadcrumbs,
        checkPrerequisites,
    } = useUserFlow({
        profile,
        hasMarketingPlan,
        hasBrandAudit,
        hasCompetitors,
        hasContent,
    });

    // Check prerequisites for marketing plan
    const marketingPlanPrereqs = checkPrerequisites('generate-marketing-plan');

    // Get the top next step
    const topNextStep = nextSteps[0];

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbs} />

            {/* Page Header with Quick Actions */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        User Flow Management Demo
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Explore the intelligent user flow guidance system
                    </p>
                </div>
                <QuickActionsMenu actions={quickActions} />
            </div>

            {/* Mobile Quick Actions Bar */}
            <div className="md:hidden">
                <QuickActionsBar actions={quickActions} />
            </div>

            {/* Top Next Step Banner */}
            {topNextStep && <NextStepBanner step={topNextStep} />}

            {/* Main Content */}
            <Tabs defaultValue="next-steps" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
                    <TabsTrigger value="help">Contextual Help</TabsTrigger>
                    <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
                    <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="next-steps" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <NextStepsCard
                            steps={nextSteps}
                            maxVisible={3}
                            showPrerequisites={true}
                        />

                        <Card>
                            <CardHeader>
                                <CardTitle>About Next Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    The Next Steps system intelligently suggests actions based on:
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Your profile completion status</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Previously completed actions</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Current page context</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Available features and prerequisites</span>
                                    </li>
                                </ul>
                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        <strong className="text-foreground">Priority Levels:</strong>
                                    </p>
                                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                        <li>
                                            <strong className="text-primary">High:</strong> Critical next
                                            steps for getting started
                                        </li>
                                        <li>
                                            <strong className="text-blue-500">Medium:</strong> Important
                                            actions to enhance your presence
                                        </li>
                                        <li>
                                            <strong className="text-muted-foreground">Low:</strong>{' '}
                                            Optional improvements and enhancements
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="help" className="space-y-6">
                    {contextualHelp ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            <ContextualHelp help={contextualHelp} />

                            <Card>
                                <CardHeader>
                                    <CardTitle>About Contextual Help</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Contextual help adapts to your current page and provides:
                                    </p>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <span>Page-specific guidance and tips</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <span>Best practices for using features</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <span>Links to related pages and resources</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <span>Context-aware recommendations</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">
                                    No contextual help available for this page
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="prerequisites" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <PrerequisiteCheck
                            actionTitle="Generate Marketing Plan"
                            prerequisites={marketingPlanPrereqs.prerequisites}
                            canProceed={marketingPlanPrereqs.canProceed}
                            onProceed={() => {
                                alert('Proceeding to marketing plan generation!');
                            }}
                            proceedLabel="Generate Plan"
                        />

                        <Card>
                            <CardHeader>
                                <CardTitle>About Prerequisites</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Prerequisites ensure you have everything needed before starting
                                    an action:
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Clear checklist of requirements</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Visual indicators for completion status</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Quick links to complete missing items</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Prevents errors from incomplete setup</span>
                                    </li>
                                </ul>
                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        <strong className="text-foreground">Example:</strong> To
                                        generate a marketing plan, you need a complete profile with
                                        name, agency, phone, address, and bio.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="quick-actions" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Quick actions provide fast access to common tasks:
                            </p>

                            <div className="space-y-3">
                                {quickActions.map((action) => (
                                    <div
                                        key={action.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{action.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {action.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Category: <strong>{action.category}</strong>
                                            </p>
                                        </div>
                                        <Button asChild size="sm" variant="outline">
                                            <a href={action.href}>Go</a>
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            {quickActions.length === 0 && (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No quick actions available
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        You're all caught up!
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Feature Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>User Flow Features</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">✓ Next Steps Suggestions</h4>
                            <p className="text-xs text-muted-foreground">
                                Intelligent recommendations based on your progress and context
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">✓ Prerequisite Checks</h4>
                            <p className="text-xs text-muted-foreground">
                                Ensure requirements are met before starting actions
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">✓ Contextual Help</h4>
                            <p className="text-xs text-muted-foreground">
                                Page-specific guidance and tips for success
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">✓ Breadcrumb Navigation</h4>
                            <p className="text-xs text-muted-foreground">
                                Track your journey through the application
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">✓ Quick Actions Menu</h4>
                            <p className="text-xs text-muted-foreground">
                                Fast access to common tasks and features
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">✓ Priority Levels</h4>
                            <p className="text-xs text-muted-foreground">
                                High, medium, and low priority action classification
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
