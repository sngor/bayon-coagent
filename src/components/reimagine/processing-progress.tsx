"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StandardErrorDisplay } from "@/components/standard";

export type ProcessingStatus =
    | "idle"
    | "uploading"
    | "analyzing"
    | "processing"
    | "completed"
    | "failed";

interface ProcessingProgressProps {
    status: ProcessingStatus;
    progress?: number; // 0-100
    estimatedTime?: number; // in seconds
    error?: string;
    onRetry?: () => void;
    onCancel?: () => void;
    className?: string;
}

const STATUS_CONFIG = {
    idle: {
        icon: Clock,
        label: "Ready",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
    },
    uploading: {
        icon: Loader2,
        label: "Uploading image...",
        color: "text-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    analyzing: {
        icon: Loader2,
        label: "Analyzing image...",
        color: "text-purple-500",
        bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    processing: {
        icon: Loader2,
        label: "Processing edit...",
        color: "text-primary",
        bgColor: "bg-primary/10",
    },
    completed: {
        icon: CheckCircle2,
        label: "Completed successfully",
        color: "text-green-500",
        bgColor: "bg-green-50 dark:bg-green-950",
    },
    failed: {
        icon: XCircle,
        label: "Processing failed",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
    },
} as const;

// Timeout threshold in seconds (60 seconds as per design doc)
const TIMEOUT_WARNING_THRESHOLD = 45;
const EXPECTED_COMPLETION_TIME = 60;

export function ProcessingProgress({
    status,
    progress = 0,
    estimatedTime,
    error,
    onRetry,
    onCancel,
    className,
}: ProcessingProgressProps) {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    const isProcessing = ["uploading", "analyzing", "processing"].includes(
        status
    );
    const isAnimating = isProcessing;

    // Track elapsed time for timeout warnings
    useEffect(() => {
        if (!isProcessing) {
            setElapsedTime(0);
            setShowTimeoutWarning(false);
            return;
        }

        const interval = setInterval(() => {
            setElapsedTime((prev) => {
                const newTime = prev + 1;
                if (newTime >= TIMEOUT_WARNING_THRESHOLD && !showTimeoutWarning) {
                    setShowTimeoutWarning(true);
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isProcessing, showTimeoutWarning]);

    // Calculate display progress
    const displayProgress = progress > 0 ? progress : elapsedTime * 1.5;
    const cappedProgress = Math.min(displayProgress, 95);

    // Format time display
    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Status Header */}
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full",
                                config.bgColor
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-5 w-5",
                                    config.color,
                                    isAnimating && "animate-spin"
                                )}
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-headline font-semibold text-sm">{config.label}</h3>
                            {isProcessing && (
                                <p className="text-xs text-muted-foreground">
                                    {estimatedTime
                                        ? `Estimated time: ${formatTime(estimatedTime)}`
                                        : `Elapsed: ${formatTime(elapsedTime)}`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <AnimatePresence>
                        {isProcessing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="space-y-2">
                                    <Progress value={cappedProgress} className="h-2" />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{Math.round(cappedProgress)}%</span>
                                        {estimatedTime && (
                                            <span>
                                                {Math.max(0, estimatedTime - elapsedTime)}s remaining
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Timeout Warning */}
                    <AnimatePresence>
                        {showTimeoutWarning && isProcessing && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Processing is taking longer than expected</AlertTitle>
                                    <AlertDescription>
                                        This operation is taking longer than usual. Please wait a
                                        moment longer, or you can cancel and try again with a
                                        different image or adjusted parameters.
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Message */}
                    <AnimatePresence>
                        {status === "failed" && error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <StandardErrorDisplay
                                    title="Processing Failed"
                                    message={`${error}\n\nSuggested next steps:\n• Try uploading a different image\n• Adjust the edit parameters\n• Check your internet connection\n• Wait a moment and try again`}
                                    variant="error"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <AnimatePresence>
                        {(status === "failed" || (isProcessing && onCancel)) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex gap-2 justify-end"
                            >
                                {status === "failed" && onRetry && (
                                    <Button onClick={onRetry} variant="default" size="sm">
                                        Retry
                                    </Button>
                                )}
                                {isProcessing && onCancel && (
                                    <Button onClick={onCancel} variant="outline" size="sm">
                                        Cancel
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Success Message */}
                    <AnimatePresence>
                        {status === "completed" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
                                    Your edit has been processed successfully. Review the result
                                    below.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
