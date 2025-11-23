/**
 * Animation Performance Demo Page
 * 
 * Demonstrates animation performance optimizations and monitoring tools
 */

import { AnimationPerformanceDemo } from "@/components/__tests__/animation-performance-demo";
import { PerformanceMonitorDev } from "@/components/performance-monitor-dev";

export default function AnimationPerformanceDemoPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="font-headline text-4xl font-bold mb-2">
                    Animation Performance Demo
                </h1>
                <p className="text-muted-foreground">
                    Explore animation performance optimizations and monitoring tools.
                    Press Ctrl+Shift+P to toggle the performance monitor.
                </p>
            </div>

            <AnimationPerformanceDemo />
            <PerformanceMonitorDev />
        </div>
    );
}
