"use client";

/**
 * Feedback Cue System Demo Page
 * 
 * Demonstrates all feedback cue components and their usage patterns.
 */

import * as React from "react";
import { useState } from "react";
import {
    FeedbackCue,
    ProgressIndicator,
    LoadingFeedback,
    SuccessErrorFeedback,
    InlineTooltip,
} from "@/components/ui/feedback-cue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FeedbackCueDemoPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [progress, setProgress] = useState(0);

    const steps = [
        "Enter your information",
        "Review details",
        "Confirm submission",
        "Complete setup",
    ];

    const simulateLoading = () => {
        setIsLoading(true);
        setProgress(0);
        setShowSuccess(false);
        setShowError(false);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsLoading(false);
                    setShowSuccess(true);
                    return 100;
                }
                return prev + 10;
            });
        }, 500);
    };

    const simulateError = () => {
        setIsLoading(true);
        setProgress(0);
        setShowSuccess(false);
        setShowError(false);

        setTimeout(() => {
            setIsLoading(false);
            setShowError(true);
        }, 2000);
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold">Feedback Cue System Demo</h1>
                <p className="text-lg text-muted-foreground">
                    Comprehensive feedback components for inline guidance and user feedback
                </p>
            </div>

            <Tabs defaultValue="feedback-cues" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="feedback-cues">Feedback Cues</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="loading">Loading</TabsTrigger>
                    <TabsTrigger value="success-error">Success/Error</TabsTrigger>
                    <TabsTrigger value="inline">Inline Tooltips</TabsTrigger>
                </TabsList>

                {/* Feedback Cues Tab */}
                <TabsContent value="feedback-cues" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Feedback Cue Types</CardTitle>
                            <CardDescription>
                                Different types of feedback cues for various contexts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Info Cue</h3>
                                <FeedbackCue
                                    id="demo-info-cue"
                                    type="info"
                                    title="New feature available"
                                    description="We've added AI-powered content suggestions to help you create better marketing materials."
                                    action={{
                                        label: "Learn More",
                                        onClick: () => alert("Learn more clicked"),
                                    }}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Help Cue</h3>
                                <FeedbackCue
                                    id="demo-help-cue"
                                    type="help"
                                    title="Complete your profile"
                                    description="Adding more information helps us provide better recommendations."
                                    nextSteps={[
                                        "Add your business address",
                                        "Upload a profile photo",
                                        "Connect your Google Business Profile",
                                    ]}
                                    action={{
                                        label: "Complete Profile",
                                        onClick: () => alert("Complete profile clicked"),
                                    }}
                                    showOnce={false}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Warning Cue</h3>
                                <FeedbackCue
                                    id="demo-warning-cue"
                                    type="warning"
                                    title="Profile incomplete"
                                    description="Some features may be limited until you complete your profile."
                                    nextSteps={[
                                        "Add missing business information",
                                        "Verify your email address",
                                    ]}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Success Cue</h3>
                                <FeedbackCue
                                    id="demo-success-cue"
                                    type="success"
                                    title="Profile updated successfully"
                                    description="Your changes have been saved."
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Error Cue</h3>
                                <FeedbackCue
                                    id="demo-error-cue"
                                    type="error"
                                    title="Failed to save changes"
                                    description="We couldn't save your profile updates. Please try again."
                                    nextSteps={[
                                        "Check your internet connection",
                                        "Refresh the page and try again",
                                        "Contact support if the issue persists",
                                    ]}
                                    action={{
                                        label: "Try Again",
                                        onClick: () => alert("Try again clicked"),
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Progress Indicator Tab */}
                <TabsContent value="progress" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Progress Indicators</CardTitle>
                            <CardDescription>
                                Multi-step progress tracking with visual feedback
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ProgressIndicator
                                currentStep={currentStep}
                                totalSteps={steps.length}
                                stepLabels={steps}
                                showNumbers={true}
                            />

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                    disabled={currentStep === 0}
                                    variant="outline"
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() =>
                                        setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
                                    }
                                    disabled={currentStep === steps.length - 1}
                                >
                                    Next
                                </Button>
                                <Button
                                    onClick={() => setCurrentStep(0)}
                                    variant="ghost"
                                >
                                    Reset
                                </Button>
                            </div>

                            <div className="pt-6 border-t">
                                <h3 className="text-sm font-medium mb-4">Without Step Labels</h3>
                                <ProgressIndicator
                                    currentStep={currentStep}
                                    totalSteps={steps.length}
                                    showNumbers={false}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Loading Feedback Tab */}
                <TabsContent value="loading" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Loading Feedback</CardTitle>
                            <CardDescription>
                                Loading states with estimated time remaining
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!isLoading && !showSuccess && !showError && (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Click a button below to simulate a loading operation
                                    </p>
                                    <div className="flex gap-2">
                                        <Button onClick={simulateLoading}>
                                            Simulate Success
                                        </Button>
                                        <Button onClick={simulateError} variant="outline">
                                            Simulate Error
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {isLoading && (
                                <LoadingFeedback
                                    message="Generating your marketing plan..."
                                    estimatedTime={5}
                                    showProgress={true}
                                    progress={progress}
                                />
                            )}

                            {showSuccess && (
                                <SuccessErrorFeedback
                                    type="success"
                                    title="Operation completed successfully!"
                                    description="Your marketing plan has been generated."
                                    nextSteps={[
                                        "Review your action items",
                                        "Connect your social media accounts",
                                        "Start creating content",
                                    ]}
                                    primaryAction={{
                                        label: "View Plan",
                                        onClick: () => alert("View plan clicked"),
                                    }}
                                    secondaryAction={{
                                        label: "Generate Another",
                                        onClick: () => {
                                            setShowSuccess(false);
                                            setProgress(0);
                                        },
                                    }}
                                />
                            )}

                            {showError && (
                                <SuccessErrorFeedback
                                    type="error"
                                    title="Operation failed"
                                    description="We couldn't complete the operation. Please try again."
                                    nextSteps={[
                                        "Check your internet connection",
                                        "Ensure your profile is complete",
                                        "Contact support if the issue persists",
                                    ]}
                                    primaryAction={{
                                        label: "Try Again",
                                        onClick: () => {
                                            setShowError(false);
                                            simulateLoading();
                                        },
                                    }}
                                    secondaryAction={{
                                        label: "Contact Support",
                                        onClick: () => alert("Contact support clicked"),
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Success/Error Tab */}
                <TabsContent value="success-error" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Success & Error Feedback</CardTitle>
                            <CardDescription>
                                Clear feedback with actionable next steps
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Success Feedback</h3>
                                <SuccessErrorFeedback
                                    type="success"
                                    title="Marketing plan generated!"
                                    description="Your personalized 3-step marketing plan is ready."
                                    nextSteps={[
                                        "Review your action items",
                                        "Connect your social media accounts",
                                        "Start creating content",
                                    ]}
                                    primaryAction={{
                                        label: "View Plan",
                                        onClick: () => alert("View plan clicked"),
                                    }}
                                    secondaryAction={{
                                        label: "Generate Another",
                                        onClick: () => alert("Generate another clicked"),
                                    }}
                                    dismissible={false}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Error Feedback</h3>
                                <SuccessErrorFeedback
                                    type="error"
                                    title="Failed to generate plan"
                                    description="We couldn't generate your marketing plan. Please try again."
                                    nextSteps={[
                                        "Check your internet connection",
                                        "Ensure your profile is complete",
                                        "Contact support if the issue persists",
                                    ]}
                                    primaryAction={{
                                        label: "Try Again",
                                        onClick: () => alert("Try again clicked"),
                                    }}
                                    secondaryAction={{
                                        label: "Contact Support",
                                        onClick: () => alert("Contact support clicked"),
                                    }}
                                    dismissible={false}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Inline Tooltips Tab */}
                <TabsContent value="inline" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inline Tooltips</CardTitle>
                            <CardDescription>
                                Compact contextual hints that appear inline
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="business-name">Business Name</Label>
                                    <InlineTooltip
                                        id="demo-business-name-hint"
                                        content="Use your official business name as registered"
                                        showOnce={false}
                                    />
                                </div>
                                <Input id="business-name" placeholder="Enter business name" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="service-area">Service Area</Label>
                                    <InlineTooltip
                                        id="demo-service-area-hint"
                                        content="List the cities or neighborhoods you serve"
                                        showOnce={false}
                                    />
                                </div>
                                <Input id="service-area" placeholder="Enter service areas" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="target-audience">Target Audience</Label>
                                    <InlineTooltip
                                        id="demo-target-audience-hint"
                                        content="Describe your ideal client (e.g., first-time homebuyers, luxury buyers)"
                                        showOnce={false}
                                    />
                                </div>
                                <Input id="target-audience" placeholder="Describe your audience" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
