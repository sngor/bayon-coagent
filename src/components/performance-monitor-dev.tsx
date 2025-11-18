/**
 * Performance Monitor Component (Development Only)
 * 
 * Displays real-time FPS and animation performance metrics
 * Only renders in development mode
 */

"use client";

import { useEffect, useState } from "react";
import { useFPS, useJankyDetection } from "@/hooks/use-animation-performance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PerformanceStats {
    fps: number;
    memory?: number;
    paintTime?: number;
}

export function PerformanceMonitorDev() {
    const [isVisible, setIsVisible] = useState(false);
    const [stats, setStats] = useState<PerformanceStats>({ fps: 60 });
    const fps = useFPS();
    const isJanky = useJankyDetection();

    // Only show in development
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    useEffect(() => {
        // Toggle visibility with Ctrl+Shift+P
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === "P") {
                setIsVisible((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyPress);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, []);

    useEffect(() => {
        setStats((prev) => ({ ...prev, fps }));

        // Get memory info if available
        if ("memory" in performance) {
            const memory = (performance as any).memory;
            setStats((prev) => ({
                ...prev,
                memory: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
            }));
        }

        // Get paint timing if available
        if ("getEntriesByType" in performance) {
            const paintEntries = performance.getEntriesByType("paint");
            const lastPaint = paintEntries[paintEntries.length - 1];
            if (lastPaint) {
                setStats((prev) => ({
                    ...prev,
                    paintTime: Math.round(lastPaint.startTime),
                }));
            }
        }
    }, [fps]);

    if (!isVisible) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setIsVisible(true)}
                >
                    Show Performance
                </Badge>
            </div>
        );
    }

    const getFPSColor = (fps: number) => {
        if (fps >= 55) return "text-success";
        if (fps >= 30) return "text-warning";
        return "text-error";
    };

    const getFPSBadge = (fps: number) => {
        if (fps >= 55) return "success";
        if (fps >= 30) return "warning";
        return "destructive";
    };

    return (
        <Card className="fixed bottom-4 right-4 z-50 w-64 shadow-xl">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Performance Monitor</CardTitle>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* FPS */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">FPS</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getFPSColor(stats.fps)}`}>
                            {stats.fps}
                        </span>
                        <Badge variant={getFPSBadge(stats.fps) as any} className="text-xs">
                            {stats.fps >= 55 ? "Good" : stats.fps >= 30 ? "OK" : "Poor"}
                        </Badge>
                    </div>
                </div>

                {/* Janky Detection */}
                {isJanky && (
                    <div className="rounded-md bg-warning/10 p-2 text-xs text-warning">
                        ⚠️ Janky animations detected
                    </div>
                )}

                {/* Memory Usage */}
                {stats.memory !== undefined && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Memory</span>
                        <span className="text-sm font-medium">{stats.memory} MB</span>
                    </div>
                )}

                {/* Paint Time */}
                {stats.paintTime !== undefined && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Paint</span>
                        <span className="text-sm font-medium">{stats.paintTime}ms</span>
                    </div>
                )}

                {/* Tips */}
                <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                        Press <kbd className="rounded bg-muted px-1">Ctrl+Shift+P</kbd> to
                        toggle
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
