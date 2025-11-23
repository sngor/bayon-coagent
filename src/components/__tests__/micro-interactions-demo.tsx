"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard, EnhancedCardContent, EnhancedCardDescription, EnhancedCardHeader, EnhancedCardTitle } from "@/components/ui/enhanced-card";
import { Check, Sparkles, Heart, Star, Zap } from "lucide-react";

export function MicroInteractionsDemo() {
    const [successStates, setSuccessStates] = React.useState<Record<string, boolean>>({});

    const handleSuccess = (id: string) => {
        setSuccessStates((prev) => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setSuccessStates((prev) => ({ ...prev, [id]: false }));
        }, 1000);
    };

    return (
        <div className="space-y-8 p-8">
            <div>
                <h1 className="font-headline text-3xl font-bold mb-2">Micro-Interactions Demo</h1>
                <p className="text-muted-foreground">
                    Showcasing enhanced button clicks, card hovers, and success feedback
                </p>
            </div>

            {/* Button Micro-Interactions */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Button Interactions</h2>
                <p className="text-sm text-muted-foreground">
                    Click buttons to see ripple effects and scale transforms
                </p>

                <div className="flex flex-wrap gap-4">
                    <Button variant="default">
                        Default Button
                    </Button>

                    <Button variant="default" onClick={() => handleSuccess("btn1")}>
                        <Check className={successStates["btn1"] ? "animate-pulse-success" : ""} />
                        Click for Success
                    </Button>

                    <Button variant="success">
                        <Check />
                        Success Button
                    </Button>

                    <Button variant="destructive">
                        Destructive Button
                    </Button>

                    <Button variant="outline">
                        Outline Button
                    </Button>

                    <Button variant="secondary">
                        Secondary Button
                    </Button>

                    <Button variant="ghost">
                        Ghost Button
                    </Button>

                    <Button variant="ai">
                        <Sparkles />
                        AI Button
                    </Button>

                    <Button variant="shimmer">
                        <Zap />
                        Shimmer Button
                    </Button>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra Large</Button>
                </div>
            </section>

            {/* Card Micro-Interactions */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Card Interactions</h2>
                <p className="text-sm text-muted-foreground">
                    Hover over cards to see subtle lift and scale effects
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card interactive>
                        <CardHeader>
                            <CardTitle>Interactive Card</CardTitle>
                            <CardDescription>Hover to see the effect</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                This card has subtle hover effects with scale and shadow transitions.
                            </p>
                        </CardContent>
                    </Card>

                    <EnhancedCard variant="default" interactive>
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Default Enhanced</EnhancedCardTitle>
                            <EnhancedCardDescription>Interactive variant</EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            <p className="text-sm">
                                Enhanced card with improved hover interactions.
                            </p>
                        </EnhancedCardContent>
                    </EnhancedCard>

                    <EnhancedCard variant="elevated" interactive>
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Elevated Card</EnhancedCardTitle>
                            <EnhancedCardDescription>Lifts on hover</EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            <p className="text-sm">
                                This card lifts up when you hover over it.
                            </p>
                        </EnhancedCardContent>
                    </EnhancedCard>

                    <EnhancedCard variant="bordered" interactive>
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Bordered Card</EnhancedCardTitle>
                            <EnhancedCardDescription>Border highlights</EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            <p className="text-sm">
                                Border color intensifies on hover.
                            </p>
                        </EnhancedCardContent>
                    </EnhancedCard>

                    <EnhancedCard variant="glass" interactive>
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Glass Card</EnhancedCardTitle>
                            <EnhancedCardDescription>Frosted glass effect</EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            <p className="text-sm">
                                Glass morphism with hover effects.
                            </p>
                        </EnhancedCardContent>
                    </EnhancedCard>

                    <EnhancedCard variant="gradient" interactive>
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Gradient Card</EnhancedCardTitle>
                            <EnhancedCardDescription>Gradient intensifies</EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            <p className="text-sm">
                                Gradient becomes more vibrant on hover.
                            </p>
                        </EnhancedCardContent>
                    </EnhancedCard>
                </div>
            </section>

            {/* Success Feedback */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Success Feedback</h2>
                <p className="text-sm text-muted-foreground">
                    Click buttons to see satisfying completion animations
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card
                        className={successStates["card1"] ? "success-feedback" : ""}
                        onClick={() => handleSuccess("card1")}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className={successStates["card1"] ? "text-success animate-pulse-success" : ""} />
                                Like Action
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">Click to see success feedback</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={successStates["card2"] ? "success-feedback" : ""}
                        onClick={() => handleSuccess("card2")}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className={successStates["card2"] ? "text-success animate-pulse-success" : ""} />
                                Favorite Action
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">Click to see success feedback</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={successStates["card3"] ? "success-feedback" : ""}
                        onClick={() => handleSuccess("card3")}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Check className={successStates["card3"] ? "text-success animate-pulse-success" : ""} />
                                Complete Action
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">Click to see success feedback</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Animation Showcase */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Animation Utilities</h2>
                <p className="text-sm text-muted-foreground">
                    Various animation utilities available for use
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                        className="animate-pulse-success"
                        onClick={(e) => {
                            e.currentTarget.classList.remove("animate-pulse-success");
                            setTimeout(() => e.currentTarget.classList.add("animate-pulse-success"), 10);
                        }}
                    >
                        Pulse Success
                    </Button>

                    <Button
                        className="animate-shake"
                        onClick={(e) => {
                            e.currentTarget.classList.remove("animate-shake");
                            setTimeout(() => e.currentTarget.classList.add("animate-shake"), 10);
                        }}
                    >
                        Shake
                    </Button>

                    <Button
                        className="animate-bounce-in"
                        onClick={(e) => {
                            e.currentTarget.classList.remove("animate-bounce-in");
                            setTimeout(() => e.currentTarget.classList.add("animate-bounce-in"), 10);
                        }}
                    >
                        Bounce In
                    </Button>

                    <Button
                        className="animate-glow"
                    >
                        Glow Effect
                    </Button>
                </div>
            </section>
        </div>
    );
}
