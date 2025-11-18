"use client";

import React, { useState, useEffect } from "react";
import {
    SkeletonCard,
    AILoader,
    StepLoader,
    Skeleton,
} from "../loading-states";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";

/**
 * Demo component to showcase all loading state components
 * This can be used to visually verify the components work correctly
 */
export default function LoadingStatesDemo() {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = [
        "Analyzing your profile",
        "Researching competitors",
        "Generating strategies",
        "Finalizing your plan",
    ];

    useEffect(() => {
        if (currentStep < steps.length) {
            const timer = setTimeout(() => {
                setCurrentStep((prev) => prev + 1);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [currentStep, steps.length]);

    const resetSteps = () => setCurrentStep(0);

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Loading States Demo</h1>
                <p className="text-muted-foreground">
                    Visual demonstration of all loading state components
                </p>
            </div>

            {/* Skeleton Card Demo */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Skeleton Card</h2>
                <p className="text-sm text-muted-foreground">
                    Used for loading card content with matching layout
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonCard />
                    <Card>
                        <CardHeader>
                            <CardTitle>Loaded Card</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>This is what the content looks like when loaded.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* AI Loader Demo */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">AI Loader</h2>
                <p className="text-sm text-muted-foreground">
                    Used for AI operations with animated sparkles
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent>
                            <AILoader />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <AILoader message="Generating your marketing plan..." />
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Step Loader Demo */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Step Loader</h2>
                <p className="text-sm text-muted-foreground">
                    Used for multi-step processes with progress indication
                </p>
                <Card>
                    <CardContent>
                        <StepLoader steps={steps} currentStep={currentStep} />
                        <div className="mt-4 flex justify-center">
                            <Button onClick={resetSteps} variant="outline" size="sm">
                                Reset Steps
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Generic Skeleton Demo */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Generic Skeleton</h2>
                <p className="text-sm text-muted-foreground">
                    Flexible skeleton loader for various content types
                </p>
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
