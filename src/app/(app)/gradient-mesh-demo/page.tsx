'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    GradientMesh,
    SubtleGradientMesh,
    HeroGradientMesh,
    CardGradientMesh,
} from '@/components/ui/gradient-mesh';
import { Sparkles, Zap, TrendingUp } from 'lucide-react';

export default function GradientMeshDemoPage() {
    return (
        <div className="space-y-12 pb-12">
            {/* Hero Section with Gradient Mesh */}
            <section className="relative min-h-[400px] flex items-center justify-center rounded-2xl overflow-hidden">
                <HeroGradientMesh>
                    <div className="text-center space-y-6 p-12">
                        <h1 className="font-headline text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Gradient Mesh Backgrounds
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Beautiful, animated gradient meshes that add depth and visual interest to your UI
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button size="lg" className="gap-2">
                                <Sparkles className="w-5 h-5" />
                                Get Started
                            </Button>
                            <Button size="lg" variant="outline">
                                Learn More
                            </Button>
                        </div>
                    </div>
                </HeroGradientMesh>
            </section>

            {/* Subtle Background Section */}
            <section className="relative rounded-2xl overflow-hidden">
                <SubtleGradientMesh>
                    <div className="p-12 space-y-6">
                        <h2 className="font-headline text-3xl font-bold">Subtle Gradient Mesh</h2>
                        <p className="text-muted-foreground max-w-2xl">
                            Perfect for page backgrounds. Uses minimal opacity for a refined, professional look
                            that doesn't distract from your content.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-primary" />
                                        Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Optimized with CSS transforms for smooth 60fps animations
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        Customizable
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Control blur, opacity, colors, and animation speed
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                        Beautiful
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Adds depth and sophistication to any interface
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </SubtleGradientMesh>
            </section>

            {/* Card Gradient Mesh Examples */}
            <section className="space-y-6">
                <h2 className="font-headline text-3xl font-bold">Card Gradient Mesh</h2>
                <p className="text-muted-foreground">
                    Subtle gradient meshes designed specifically for card backgrounds
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative rounded-xl overflow-hidden border">
                        <CardGradientMesh>
                            <div className="p-8 space-y-4">
                                <h3 className="font-headline text-2xl font-bold">Premium Feature</h3>
                                <p className="text-muted-foreground">
                                    This card has a subtle gradient mesh background that adds visual interest
                                    without overwhelming the content.
                                </p>
                                <Button>Learn More</Button>
                            </div>
                        </CardGradientMesh>
                    </div>

                    <div className="relative rounded-xl overflow-hidden border">
                        <CardGradientMesh>
                            <div className="p-8 space-y-4">
                                <h3 className="font-headline text-2xl font-bold">Another Card</h3>
                                <p className="text-muted-foreground">
                                    The gradient mesh creates depth and makes cards feel more premium and polished.
                                </p>
                                <Button variant="outline">Explore</Button>
                            </div>
                        </CardGradientMesh>
                    </div>
                </div>
            </section>

            {/* Custom Gradient Mesh */}
            <section className="space-y-6">
                <h2 className="font-headline text-3xl font-bold">Custom Configuration</h2>
                <p className="text-muted-foreground">
                    Create your own gradient mesh with custom orbs, colors, and animations
                </p>
                <div className="relative rounded-xl overflow-hidden border min-h-[300px]">
                    <GradientMesh
                        orbs={[
                            {
                                id: 'custom-1',
                                color: 'hsl(280, 70%, 60%)',
                                size: 400,
                                x: 20,
                                y: 20,
                                blur: 70,
                                opacity: 0.2,
                                animationDuration: 15,
                            },
                            {
                                id: 'custom-2',
                                color: 'hsl(200, 70%, 60%)',
                                size: 350,
                                x: 80,
                                y: 80,
                                blur: 70,
                                opacity: 0.15,
                                animationDuration: 20,
                            },
                        ]}
                        blur="xl"
                        animate
                    >
                        <div className="p-12 flex items-center justify-center min-h-[300px]">
                            <div className="text-center space-y-4">
                                <h3 className="font-headline text-3xl font-bold">Fully Customizable</h3>
                                <p className="text-muted-foreground max-w-md">
                                    Define your own orbs with custom colors, sizes, positions, and animation speeds
                                </p>
                            </div>
                        </div>
                    </GradientMesh>
                </div>
            </section>

            {/* Usage Examples */}
            <section className="space-y-6">
                <h2 className="font-headline text-3xl font-bold">Usage Examples</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Code Examples</CardTitle>
                        <CardDescription>How to use gradient mesh in your components</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-headline font-semibold">Hero Section</h4>
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{`<HeroGradientMesh>
  <YourHeroContent />
</HeroGradientMesh>`}</code>
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-headline font-semibold">Page Background</h4>
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{`<SubtleGradientMesh>
  <YourPageContent />
</SubtleGradientMesh>`}</code>
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-headline font-semibold">Card Background</h4>
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{`<CardGradientMesh>
  <YourCardContent />
</CardGradientMesh>`}</code>
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-headline font-semibold">Custom Configuration</h4>
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{`<GradientMesh
  orbs={customOrbs}
  blur="xl"
  opacity={0.15}
  animate
>
  <YourContent />
</GradientMesh>`}</code>
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
