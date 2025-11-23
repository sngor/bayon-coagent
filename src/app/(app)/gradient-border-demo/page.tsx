"use client";

import { GradientBorder } from "@/components/ui/gradient-border";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, Star, Heart } from "lucide-react";

export default function GradientBorderDemoPage() {
    return (
        <div className="container mx-auto p-6 space-y-12">
            <div className="space-y-4">
                <h1 className="font-headline text-4xl font-bold">Gradient Borders & Glows Demo</h1>
                <p className="text-muted-foreground text-lg">
                    Showcase of gradient border utilities and glow effects for premium UI components
                </p>
            </div>

            {/* Gradient Border Variants */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-2xl font-semibold mb-2">Gradient Border Variants</h2>
                    <p className="text-muted-foreground">Different gradient border styles and colors</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <GradientBorder variant="default" borderWidth="medium" rounded="lg">
                        <div className="p-6">
                            <h3 className="font-headline font-semibold mb-2">Default Gradient</h3>
                            <p className="text-sm text-muted-foreground">
                                Subtle gradient border with primary colors
                            </p>
                        </div>
                    </GradientBorder>

                    <GradientBorder variant="primary" borderWidth="medium" rounded="lg">
                        <div className="p-6">
                            <h3 className="font-headline font-semibold mb-2">Primary Gradient</h3>
                            <p className="text-sm text-muted-foreground">
                                Bold primary color gradient border
                            </p>
                        </div>
                    </GradientBorder>

                    <GradientBorder variant="accent" borderWidth="medium" rounded="lg">
                        <div className="p-6">
                            <h3 className="font-headline font-semibold mb-2">Accent Gradient</h3>
                            <p className="text-sm text-muted-foreground">
                                Vibrant accent color gradient border
                            </p>
                        </div>
                    </GradientBorder>

                    <GradientBorder variant="success" borderWidth="medium" rounded="lg">
                        <div className="p-6">
                            <h3 className="font-headline font-semibold mb-2">Success Gradient</h3>
                            <p className="text-sm text-muted-foreground">
                                Success state gradient border
                            </p>
                        </div>
                    </GradientBorder>

                    <GradientBorder variant="animated" borderWidth="medium" rounded="lg" animate>
                        <div className="p-6">
                            <h3 className="font-headline font-semibold mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Animated Gradient
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Animated rotating gradient border
                            </p>
                        </div>
                    </GradientBorder>

                    <GradientBorder variant="primary" borderWidth="thick" rounded="xl">
                        <div className="p-6">
                            <h3 className="font-headline font-semibold mb-2">Thick Border</h3>
                            <p className="text-sm text-muted-foreground">
                                Thicker gradient border for emphasis
                            </p>
                        </div>
                    </GradientBorder>
                </div>
            </section>

            {/* Gradient Borders with Glow */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-2xl font-semibold mb-2">Gradient Borders with Glow Effects</h2>
                    <p className="text-muted-foreground">Combining gradient borders with glow effects</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <GradientBorder variant="primary" glow="sm" rounded="lg">
                        <div className="p-6">
                            <Zap className="w-8 h-8 mb-3 text-primary" />
                            <h3 className="font-headline font-semibold mb-2">Small Glow</h3>
                            <p className="text-sm text-muted-foreground">
                                Subtle glow effect around the border
                            </p>
                        </div>
                    </GradientBorder>

                    <GradientBorder variant="accent" glow="md" rounded="lg">
                        <div className="p-6">
                            <Star className="w-8 h-8 mb-3 text-primary" />
                            <h3 className="font-headline font-semibold mb-2">Medium Glow</h3>
                            <p className="text-sm text-muted-foreground">
                                Moderate glow effect for emphasis
                            </p>
                        </div>
                    </GradientBorder>

                    <GradientBorder variant="animated" glow="lg" rounded="lg" animate>
                        <div className="p-6">
                            <Heart className="w-8 h-8 mb-3 text-primary" />
                            <h3 className="font-headline font-semibold mb-2">Large Glow</h3>
                            <p className="text-sm text-muted-foreground">
                                Strong glow effect with animation
                            </p>
                        </div>
                    </GradientBorder>
                </div>
            </section>

            {/* Button Glow Variants */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-2xl font-semibold mb-2">Button Glow Effects</h2>
                    <p className="text-muted-foreground">Premium button variants with glow effects</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Button variant="premium" size="lg">
                        <Sparkles className="w-4 h-4" />
                        Premium Button
                    </Button>

                    <Button variant="glow" size="lg">
                        <Zap className="w-4 h-4" />
                        Glow Button
                    </Button>

                    <Button variant="glow-success" size="lg">
                        <Star className="w-4 h-4" />
                        Success Glow
                    </Button>

                    <Button variant="gradient-border" size="lg">
                        <Heart className="w-4 h-4" />
                        Gradient Border
                    </Button>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Button variant="premium">Premium Default</Button>
                    <Button variant="glow">Glow Default</Button>
                    <Button variant="glow-success">Success Default</Button>
                    <Button variant="gradient-border">Border Default</Button>
                </div>
            </section>

            {/* Card with Gradient Borders */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-2xl font-semibold mb-2">Cards with Gradient Borders</h2>
                    <p className="text-muted-foreground">Premium card designs with gradient borders</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GradientBorder variant="primary" glow="md" rounded="xl">
                        <Card className="border-0">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    Premium Feature
                                </CardTitle>
                                <CardDescription>
                                    Enhanced with gradient border and glow
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This card uses a gradient border with a medium glow effect to create
                                    a premium, eye-catching design.
                                </p>
                                <Button variant="premium" className="w-full">
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>
                    </GradientBorder>

                    <GradientBorder variant="animated" glow="lg" rounded="xl" animate>
                        <Card className="border-0">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5" />
                                    Animated Premium
                                </CardTitle>
                                <CardDescription>
                                    Animated gradient with large glow
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This card features an animated rotating gradient border with a large
                                    glow effect for maximum visual impact.
                                </p>
                                <Button variant="glow" className="w-full">
                                    Learn More
                                </Button>
                            </CardContent>
                        </Card>
                    </GradientBorder>
                </div>
            </section>

            {/* Hover Glow Effects */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-2xl font-semibold mb-2">Hover Glow Effects</h2>
                    <p className="text-muted-foreground">Interactive glow effects on hover</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="hover-glow-sm cursor-pointer transition-all">
                        <CardHeader>
                            <CardTitle className="text-lg">Small Hover Glow</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Hover to see a subtle glow effect
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover-glow-md cursor-pointer transition-all">
                        <CardHeader>
                            <CardTitle className="text-lg">Medium Hover Glow</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Hover to see a moderate glow effect
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover-glow-lg cursor-pointer transition-all">
                        <CardHeader>
                            <CardTitle className="text-lg">Large Hover Glow</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Hover to see a strong glow effect
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Premium Glow */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-2xl font-semibold mb-2">Premium Multi-Layer Glow</h2>
                    <p className="text-muted-foreground">
                        Multi-layered glow effects for premium components
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="premium-glow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="w-5 h-5" />
                                Premium Glow
                            </CardTitle>
                            <CardDescription>Multi-layer glow effect</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                This card has a permanent multi-layer glow effect for premium features.
                            </p>
                            <Button variant="premium" className="w-full">
                                Premium Action
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="premium-glow-hover cursor-pointer">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5" />
                                Premium Hover Glow
                            </CardTitle>
                            <CardDescription>Hover for enhanced glow</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Hover over this card to see an enhanced multi-layer glow effect.
                            </p>
                            <Button variant="glow" className="w-full">
                                Hover Me
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Usage Examples */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-2xl font-semibold mb-2">Usage Examples</h2>
                    <p className="text-muted-foreground">Code examples for implementing these effects</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>GradientBorder Component</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <code className="text-sm">
                                {`<GradientBorder variant="primary" glow="md" rounded="lg">
  <div className="p-6">
    <h3>Your Content</h3>
  </div>
</GradientBorder>`}
                            </code>
                        </div>

                        <div className="bg-muted p-4 rounded-lg">
                            <code className="text-sm">
                                {`<Button variant="premium" size="lg">
  Premium Button
</Button>`}
                            </code>
                        </div>

                        <div className="bg-muted p-4 rounded-lg">
                            <code className="text-sm">
                                {`<Card className="hover-glow-md">
  <CardContent>Hover for glow</CardContent>
</Card>`}
                            </code>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
