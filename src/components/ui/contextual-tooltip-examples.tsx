"use client";

/**
 * Contextual Tooltip Examples
 * 
 * Demonstrates how to use the contextual tooltip system for first-time feature hints.
 */

import * as React from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { FeatureTooltip, FeatureTooltipWithHover } from "./feature-tooltip";
import { HelpHint } from "./contextual-tooltip";
import { Sparkles, Target, Users } from "lucide-react";

/**
 * Example 1: Basic feature tooltip on a button
 */
export function BasicFeatureTooltipExample() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Feature Tooltip</h3>
            <p className="text-sm text-muted-foreground">
                This tooltip appears the first time a user sees this button. Once dismissed,
                it won't show again.
            </p>
            <FeatureTooltip
                id="marketing-plan-generate"
                content="Click here to generate a personalized marketing plan based on your profile and goals. This usually takes 30-60 seconds."
                side="right"
            >
                <Button variant="ai" size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Marketing Plan
                </Button>
            </FeatureTooltip>
        </div>
    );
}

/**
 * Example 2: Feature tooltip with hover fallback
 */
export function FeatureTooltipWithHoverExample() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Feature Tooltip with Hover</h3>
            <p className="text-sm text-muted-foreground">
                After dismissal, this tooltip shows on hover so users can reference it again.
            </p>
            <FeatureTooltipWithHover
                id="brand-audit-run"
                content="Run a comprehensive audit of your online presence. We'll check your NAP consistency, review distribution, and brand visibility across platforms."
                side="bottom"
            >
                <Button variant="outline" size="lg">
                    <Target className="mr-2 h-4 w-4" />
                    Run Brand Audit
                </Button>
            </FeatureTooltipWithHover>
        </div>
    );
}

/**
 * Example 3: Feature tooltip on a card
 */
export function CardFeatureTooltipExample() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Card Feature Tooltip</h3>
            <p className="text-sm text-muted-foreground">
                Tooltips can be attached to any element, including cards.
            </p>
            <FeatureTooltip
                id="competitive-analysis-card"
                content="This tool helps you analyze your competitors' online presence and identify opportunities to stand out in your market."
                side="top"
            >
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Competitive Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Discover what your competitors are doing and find your unique advantage.
                        </p>
                    </CardContent>
                </Card>
            </FeatureTooltip>
        </div>
    );
}

/**
 * Example 4: Simple help hint (always available)
 */
export function HelpHintExample() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Help Hint</h3>
            <p className="text-sm text-muted-foreground">
                For features that don't need first-time guidance, use a simple help hint.
            </p>
            <div className="flex items-center gap-2">
                <span className="text-sm">Advanced Settings</span>
                <HelpHint
                    content="These settings control how AI generates content. Most users don't need to change these."
                    side="right"
                />
            </div>
        </div>
    );
}

/**
 * Example 5: Multiple tooltips in a workflow
 */
export function WorkflowTooltipsExample() {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Workflow Tooltips</h3>
            <p className="text-sm text-muted-foreground">
                Guide users through a multi-step process with sequential tooltips.
            </p>
            <div className="space-y-4">
                <FeatureTooltip
                    id="workflow-step-1"
                    content="Step 1: Start by completing your profile with your business information."
                    side="right"
                >
                    <Button variant="outline" className="w-full justify-start">
                        1. Complete Profile
                    </Button>
                </FeatureTooltip>
                <FeatureTooltip
                    id="workflow-step-2"
                    content="Step 2: Connect your Google Business Profile to import reviews and insights."
                    side="right"
                >
                    <Button variant="outline" className="w-full justify-start">
                        2. Connect Integrations
                    </Button>
                </FeatureTooltip>
                <FeatureTooltip
                    id="workflow-step-3"
                    content="Step 3: Generate your first marketing plan to get personalized action items."
                    side="right"
                >
                    <Button variant="outline" className="w-full justify-start">
                        3. Generate Marketing Plan
                    </Button>
                </FeatureTooltip>
            </div>
        </div>
    );
}

/**
 * Complete demo page
 */
export function ContextualTooltipDemo() {
    return (
        <div className="container max-w-4xl py-8 space-y-12">
            <div>
                <h1 className="text-3xl font-bold mb-2">Contextual Tooltip System</h1>
                <p className="text-muted-foreground">
                    Examples of how to use contextual tooltips for first-time feature guidance.
                </p>
            </div>

            <BasicFeatureTooltipExample />
            <FeatureTooltipWithHoverExample />
            <CardFeatureTooltipExample />
            <HelpHintExample />
            <WorkflowTooltipsExample />
        </div>
    );
}
