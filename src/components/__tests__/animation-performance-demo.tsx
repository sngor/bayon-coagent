/**
 * Animation Performance Demo Component
 * 
 * Demonstrates optimized animation techniques and performance monitoring
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    useAnimationPerformance,
    useFPS,
    useJankyDetection,
    useOptimizedAnimation,
    useReducedMotion,
    useGPUAcceleration,
} from "@/hooks/use-animation-performance";

export function AnimationPerformanceDemo() {
    const [showOptimized, setShowOptimized] = useState(false);
    const [showUnoptimized, setShowUnoptimized] = useState(false);
    const [isMonitoring, setIsMonitoring] = useState(false);

    const { metrics, isGood, start, stop } = useAnimationPerformance();
    const fps = useFPS();
    const isJanky = useJankyDetection();
    const prefersReduced = useReducedMotion();

    // Optimized animation ref
    const optimizedRef = useOptimizedAnimation<HTMLDivElement>(
        "animate-fade-in-up",
        showOptimized,
        300
    );

    // GPU acceleration ref
    const gpuRef = useGPUAcceleration<HTMLDivElement>();

    const handleStartMonitoring = () => {
        start();
        setIsMonitoring(true);
    };

    const handleStopMonitoring = () => {
        const finalMetrics = stop();
        setIsMonitoring(false);
        console.log("Final metrics:", finalMetrics);
    };

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Animation Performance Demo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Performance Metrics */}
                    <div className="space-y-3">
                        <h3 className="font-headline text-lg font-semibold">Real-Time Metrics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4">
                                <div className="text-sm text-muted-foreground">FPS</div>
                                <div className="text-2xl font-bold">{fps}</div>
                                {isJanky && (
                                    <Badge variant="destructive" className="mt-2">
                                        Janky!
                                    </Badge>
                                )}
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="text-sm text-muted-foreground">
                                    Reduced Motion
                                </div>
                                <div className="text-2xl font-bold">
                                    {prefersReduced ? "Yes" : "No"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monitoring Controls */}
                    <div className="space-y-3">
                        <h3 className="font-headline text-lg font-semibold">Performance Monitoring</h3>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleStartMonitoring}
                                disabled={isMonitoring}
                                variant="default"
                            >
                                Start Monitoring
                            </Button>
                            <Button
                                onClick={handleStopMonitoring}
                                disabled={!isMonitoring}
                                variant="outline"
                            >
                                Stop Monitoring
                            </Button>
                        </div>
                        {metrics && (
                            <div className="rounded-lg border p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm">Average FPS:</span>
                                    <span className="font-medium">{metrics.fps.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Avg Frame Time:</span>
                                    <span className="font-medium">
                                        {metrics.averageFrameTime.toFixed(2)}ms
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Dropped Frames:</span>
                                    <span className="font-medium">
                                        {metrics.droppedFrames}/{metrics.totalFrames}
                                    </span>
                                </div>
                                <Badge variant={isGood ? "default" : "destructive"} className={isGood ? "bg-success text-white" : ""}>
                                    {isGood ? "Good Performance" : "Poor Performance"}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Optimized Animation Demo */}
                    <div className="space-y-3">
                        <h3 className="font-headline text-lg font-semibold">Optimized Animation</h3>
                        <p className="text-sm text-muted-foreground">
                            Uses GPU acceleration, will-change hints, and transform/opacity
                        </p>
                        <Button onClick={() => setShowOptimized(!showOptimized)}>
                            Toggle Optimized Animation
                        </Button>
                        {showOptimized && (
                            <Card ref={optimizedRef} className="p-4">
                                <p className="text-sm">
                                    ✅ This animation uses GPU acceleration and will-change hints
                                    for optimal performance.
                                </p>
                            </Card>
                        )}
                    </div>

                    {/* Unoptimized Animation Demo */}
                    <div className="space-y-3">
                        <h3 className="font-headline text-lg font-semibold">Unoptimized Animation</h3>
                        <p className="text-sm text-muted-foreground">
                            Uses width/height changes (causes reflow)
                        </p>
                        <Button onClick={() => setShowUnoptimized(!showUnoptimized)}>
                            Toggle Unoptimized Animation
                        </Button>
                        {showUnoptimized && (
                            <Card
                                className="p-4 transition-all duration-300"
                                style={{
                                    width: showUnoptimized ? "100%" : "0",
                                    height: showUnoptimized ? "auto" : "0",
                                }}
                            >
                                <p className="text-sm">
                                    ❌ This animation changes width/height which causes layout
                                    reflow and poor performance.
                                </p>
                            </Card>
                        )}
                    </div>

                    {/* GPU Acceleration Demo */}
                    <div className="space-y-3">
                        <h3 className="font-headline text-lg font-semibold">GPU Acceleration</h3>
                        <Card
                            ref={gpuRef}
                            className="p-4 card-hover-lift cursor-pointer"
                        >
                            <p className="text-sm">
                                Hover over this card. It uses GPU acceleration for smooth
                                animations.
                            </p>
                        </Card>
                    </div>

                    {/* Animation Classes Demo */}
                    <div className="space-y-3">
                        <h3 className="font-headline text-lg font-semibold">Animation Classes</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4 animate-fade-in">
                                <p className="text-sm">animate-fade-in</p>
                            </Card>
                            <Card className="p-4 animate-scale-in">
                                <p className="text-sm">animate-scale-in</p>
                            </Card>
                            <Card className="p-4 animate-slide-in-right">
                                <p className="text-sm">animate-slide-in-right</p>
                            </Card>
                            <Card className="p-4 animate-bounce-in">
                                <p className="text-sm">animate-bounce-in</p>
                            </Card>
                        </div>
                    </div>

                    {/* Best Practices */}
                    <div className="space-y-3">
                        <h3 className="font-headline text-lg font-semibold">Best Practices</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Use transform and opacity for animations</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Apply will-change hints strategically</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Enable GPU acceleration with translateZ(0)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Respect reduced motion preferences</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-error">✗</span>
                                <span>Avoid animating width, height, or position</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-error">✗</span>
                                <span>Don't overuse will-change (max 3-4 properties)</span>
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
