'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Typewriter,
    LoadingDots,
    SuccessAnimation,
    StaggeredText,
    GradientText,
    TextReveal,
    TextShimmer
} from '@/components/ui/text-animations';
import { useTextAnimations, useTypewriter, useStaggeredAnimation, useMessageAnimation } from '@/hooks/use-text-animations';
import { Sparkles, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';

/**
 * Text Animation Showcase Component
 * Demonstrates all available text animations and their use cases
 */
export function TextAnimationShowcase() {
    const [showDemo, setShowDemo] = useState(false);
    const { showMessage, message, isVisible } = useMessageAnimation();
    const { triggerAnimation, isAnimating } = useTextAnimations();

    const demoTypewriter = useTypewriter(
        "This is a demonstration of our typewriter effect with realistic typing speed and cursor.",
        { speed: 50, autoStart: false }
    );

    const demoStaggered = useStaggeredAnimation(6, { autoStart: false });

    const handleStartDemo = () => {
        setShowDemo(true);
        demoTypewriter.start();
        demoStaggered.start();
        triggerAnimation('demo-card');
    };

    const handleShowSuccess = () => {
        showMessage("Profile saved successfully! All features are now unlocked.", 'success');
    };

    const handleShowError = () => {
        showMessage("Failed to save changes. Please try again.", 'error');
    };

    return (
        <div className="space-y-8 p-6">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">
                    <GradientText text="Text Animation Showcase" />
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    <Typewriter
                        text="Explore the comprehensive text animation system that enhances user experience throughout the Bayon Coagent platform."
                        speed={30}
                        delay={1000}
                        cursor={false}
                    />
                </p>
            </div>

            {/* Demo Controls */}
            <div className="flex justify-center gap-4">
                <Button onClick={handleStartDemo} variant="ai">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Demo
                </Button>
                <Button onClick={handleShowSuccess} variant="outline">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Success Message
                </Button>
                <Button onClick={handleShowError} variant="destructive">
                    Show Error
                </Button>
            </div>

            {/* Message Display */}
            {message && isVisible && (
                <div className="flex justify-center">
                    <SuccessAnimation
                        message={message.text}
                        duration={3000}
                    />
                </div>
            )}

            {/* Animation Examples Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Typewriter Effect */}
                <Card className={`card-hover-lift ${isAnimating('demo-card') ? 'animate-scale-in' : ''}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            Typewriter Effect
                        </CardTitle>
                        <CardDescription>
                            Realistic typing animation for engaging content reveals
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                {showDemo && (
                                    <Typewriter
                                        text={demoTypewriter.displayText}
                                        speed={0}
                                        cursor={!demoTypewriter.isComplete}
                                    />
                                )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                Use Case: Welcome messages, AI responses
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Staggered Text */}
                <Card className="card-hover-lift">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Staggered Animation
                        </CardTitle>
                        <CardDescription>
                            Words or characters animate in sequence
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                {showDemo && (
                                    <StaggeredText
                                        text="Welcome to Bayon Coagent Platform"
                                        staggerBy="word"
                                        delay={0}
                                        staggerDelay={150}
                                        animation="slideUp"
                                    />
                                )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                Use Case: Headlines, navigation items
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Animated Counter */}
                <Card className="card-hover-lift">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Animated Counter
                        </CardTitle>
                        <CardDescription>
                            Smooth number animations for metrics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg text-center">
                                <div className="text-3xl font-bold text-primary">
                                    {showDemo && (
                                        <span>1247</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">Total Reviews</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                Use Case: Dashboard metrics, statistics
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Loading Dots */}
                <Card className="card-hover-lift">
                    <CardHeader>
                        <CardTitle>Loading Animations</CardTitle>
                        <CardDescription>
                            Enhanced loading states with animated dots
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                                <LoadingDots className="text-primary" size="md" />
                                <span className="generating-text">AI is thinking</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                Use Case: AI generation, form submissions
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Gradient Text */}
                <Card className="card-hover-lift">
                    <CardHeader>
                        <CardTitle>Gradient Text</CardTitle>
                        <CardDescription>
                            Animated gradient effects for emphasis
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg text-center">
                                <div className="text-xl font-bold">
                                    <GradientText text="Premium Feature" />
                                </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                Use Case: CTAs, premium features, branding
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Text Reveal */}
                <Card className="card-hover-lift">
                    <CardHeader>
                        <CardTitle>Text Reveal</CardTitle>
                        <CardDescription>
                            Sliding mask reveal animations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                {showDemo && (
                                    <TextReveal
                                        text="Content revealed with style"
                                        delay={1000}
                                        duration={800}
                                        direction="left"
                                    />
                                )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                Use Case: Section headers, feature reveals
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Implementation Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>Implementation Examples</CardTitle>
                    <CardDescription>
                        See how these animations are used throughout the platform
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="font-semibold">Chat Interface</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Typewriter effect for AI responses</li>
                                <li>• Staggered welcome message animation</li>
                                <li>• Loading dots during AI thinking</li>
                                <li>• Animated quick action buttons</li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-semibold">Dashboard</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Animated counters for metrics</li>
                                <li>• Staggered welcome messages</li>
                                <li>• Success animations for completions</li>
                                <li>• Gradient text for emphasis</li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-semibold">Studio (Content Creation)</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Loading animations during generation</li>
                                <li>• Success feedback for saves</li>
                                <li>• Button hover animations</li>
                                <li>• Template application feedback</li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-semibold">Navigation</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Staggered page title animations</li>
                                <li>• Hover effects on menu items</li>
                                <li>• Smooth transitions between pages</li>
                                <li>• Animated user status indicators</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance & Accessibility</CardTitle>
                    <CardDescription>
                        Built with performance and accessibility in mind
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                    Reduced Motion Support
                                </h5>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Respects user's motion preferences and disables animations when requested
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                    GPU Optimized
                                </h5>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Uses transform and opacity for smooth 60fps animations
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                                    Lightweight
                                </h5>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    Minimal JavaScript with CSS-based animations where possible
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}