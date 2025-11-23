"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Celebration,
    SuccessPing,
    SparkleEffect,
    useCelebration,
} from "@/components/ui/celebration";
import { Separator } from "@/components/ui/separator";

/**
 * Demo page for celebration animations
 * Shows all celebration types and their usage
 */
export function CelebrationDemo() {
    const [showConfetti, setShowConfetti] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showMilestone, setShowMilestone] = useState(false);
    const [showAchievement, setShowAchievement] = useState(false);
    const [showSuccessPing, setShowSuccessPing] = useState(false);
    const [showSparkle, setShowSparkle] = useState(false);

    const { celebration, celebrate, handleComplete } = useCelebration();

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="font-headline text-3xl font-bold">Celebration Animations Demo</h1>
                <p className="text-muted-foreground">
                    Test all celebration animations for milestones and achievements
                </p>
            </div>

            <Separator />

            {/* Major Celebrations */}
            <Card>
                <CardHeader>
                    <CardTitle>Major Celebrations</CardTitle>
                    <CardDescription>
                        Full-screen confetti animations for significant completions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={() => setShowConfetti(true)}
                            variant="default"
                            size="lg"
                            className="w-full"
                        >
                            🎉 Confetti Celebration
                        </Button>

                        <Button
                            onClick={() => setShowSuccess(true)}
                            variant="default"
                            size="lg"
                            className="w-full bg-success hover:bg-success-hover"
                        >
                            ✅ Success Celebration
                        </Button>

                        <Button
                            onClick={() => setShowMilestone(true)}
                            variant="default"
                            size="lg"
                            className="w-full"
                        >
                            🏆 Milestone Celebration
                        </Button>

                        <Button
                            onClick={() => setShowAchievement(true)}
                            variant="default"
                            size="lg"
                            className="w-full bg-warning hover:bg-warning-hover"
                        >
                            ⭐ Achievement Celebration
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Subtle Celebrations */}
            <Card>
                <CardHeader>
                    <CardTitle>Subtle Celebrations</CardTitle>
                    <CardDescription>
                        Brief animations for smaller achievements without confetti
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={() => setShowSuccessPing(true)}
                            variant="outline"
                            size="lg"
                            className="w-full"
                        >
                            ✓ Success Ping
                        </Button>

                        <Button
                            onClick={() => setShowSparkle(true)}
                            variant="outline"
                            size="lg"
                            className="w-full"
                        >
                            ✨ Sparkle Effect
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Hook-based Celebrations */}
            <Card>
                <CardHeader>
                    <CardTitle>Hook-based Celebrations</CardTitle>
                    <CardDescription>
                        Using the useCelebration hook for programmatic control
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={() => celebrate("confetti", "🎉 You did it!")}
                            variant="default"
                            size="lg"
                            className="w-full"
                        >
                            Celebrate with Hook
                        </Button>

                        <Button
                            onClick={() => celebrate("success", "✅ Task completed!")}
                            variant="default"
                            size="lg"
                            className="w-full bg-success hover:bg-success-hover"
                        >
                            Success with Hook
                        </Button>

                        <Button
                            onClick={() => celebrate("milestone", "🏆 Milestone reached!")}
                            variant="default"
                            size="lg"
                            className="w-full"
                        >
                            Milestone with Hook
                        </Button>

                        <Button
                            onClick={() => celebrate("achievement", "⭐ Achievement unlocked!")}
                            variant="default"
                            size="lg"
                            className="w-full bg-warning hover:bg-warning-hover"
                        >
                            Achievement with Hook
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Usage Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage Examples</CardTitle>
                    <CardDescription>
                        When to use each celebration type
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                        <div>
                            <strong className="text-primary">🎉 Confetti:</strong> Major completions like
                            generating a full marketing plan, completing onboarding, or finishing a complex
                            workflow
                        </div>
                        <div>
                            <strong className="text-success">✅ Success:</strong> Successful form submissions,
                            data saves, or AI operations completing successfully
                        </div>
                        <div>
                            <strong className="text-primary">🏆 Milestone:</strong> Reaching significant
                            milestones like first marketing plan, 10th blog post, or profile completion
                        </div>
                        <div>
                            <strong className="text-warning">⭐ Achievement:</strong> Unlocking features,
                            completing tutorials, or reaching usage goals
                        </div>
                        <div>
                            <strong>✓ Success Ping:</strong> Quick confirmations like saving settings, copying
                            text, or toggling preferences
                        </div>
                        <div>
                            <strong>✨ Sparkle:</strong> AI processing complete, content generated, or special
                            moments
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Code Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                    <CardDescription>
                        How to implement celebrations in your components
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-xs font-mono mb-2 text-muted-foreground">
                // Using the component directly
                            </p>
                            <pre className="text-xs font-mono overflow-x-auto">
                                {`<Celebration
  show={showCelebration}
  type="confetti"
  message="🎉 Marketing plan generated!"
  onComplete={() => setShowCelebration(false)}
/>`}
                            </pre>
                        </div>

                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-xs font-mono mb-2 text-muted-foreground">
                // Using the hook
                            </p>
                            <pre className="text-xs font-mono overflow-x-auto">
                                {`const { celebration, celebrate, handleComplete } = useCelebration();

// Trigger celebration
celebrate("success", "✅ Saved successfully!");

// Render component
<Celebration {...celebration} onComplete={handleComplete} />`}
                            </pre>
                        </div>

                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-xs font-mono mb-2 text-muted-foreground">
                // Subtle success ping
                            </p>
                            <pre className="text-xs font-mono overflow-x-auto">
                                {`<SuccessPing
  show={showSuccess}
  onComplete={() => setShowSuccess(false)}
/>`}
                            </pre>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Render all celebration components */}
            <Celebration
                show={showConfetti}
                type="confetti"
                message="🎉 Congratulations!"
                onComplete={() => setShowConfetti(false)}
            />

            <Celebration
                show={showSuccess}
                type="success"
                message="✅ Success!"
                onComplete={() => setShowSuccess(false)}
            />

            <Celebration
                show={showMilestone}
                type="milestone"
                message="🏆 Milestone Reached!"
                onComplete={() => setShowMilestone(false)}
            />

            <Celebration
                show={showAchievement}
                type="achievement"
                message="⭐ Achievement Unlocked!"
                onComplete={() => setShowAchievement(false)}
            />

            <SuccessPing show={showSuccessPing} onComplete={() => setShowSuccessPing(false)} />

            <SparkleEffect
                show={showSparkle}
                message="✨ AI magic complete!"
                onComplete={() => setShowSparkle(false)}
            />

            <Celebration {...celebration} onComplete={handleComplete} />
        </div>
    );
}
