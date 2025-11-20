"use client";

/**
 * Example usage of ProcessingProgress component
 * 
 * This demonstrates how to use the ProcessingProgress component
 * in different states for the Reimagine Image Toolkit.
 */

import { useState } from "react";
import { ProcessingProgress } from "./processing-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProcessingProgressExample() {
    const [status, setStatus] = useState<
        "idle" | "uploading" | "analyzing" | "processing" | "completed" | "failed"
    >("idle");
    const [progress, setProgress] = useState(0);

    const simulateUpload = () => {
        setStatus("uploading");
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setStatus("analyzing");
                    setTimeout(() => simulateProcessing(), 1000);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    const simulateProcessing = () => {
        setStatus("processing");
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setStatus("completed");
                    return 100;
                }
                return prev + 5;
            });
        }, 500);
    };

    const simulateError = () => {
        setStatus("failed");
    };

    const handleRetry = () => {
        setStatus("idle");
        setProgress(0);
    };

    const handleCancel = () => {
        setStatus("idle");
        setProgress(0);
    };

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Processing Progress Component Demo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button onClick={simulateUpload} disabled={status !== "idle"}>
                            Simulate Upload & Process
                        </Button>
                        <Button
                            onClick={simulateError}
                            variant="destructive"
                            disabled={status !== "idle"}
                        >
                            Simulate Error
                        </Button>
                        <Button onClick={handleRetry} variant="outline">
                            Reset
                        </Button>
                    </div>

                    <ProcessingProgress
                        status={status}
                        progress={progress}
                        estimatedTime={status === "processing" ? 30 : undefined}
                        error={
                            status === "failed"
                                ? "Failed to process image. The AI model encountered an error."
                                : undefined
                        }
                        onRetry={handleRetry}
                        onCancel={handleCancel}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All States</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium mb-2">Idle</h4>
                        <ProcessingProgress status="idle" />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium mb-2">Uploading (50%)</h4>
                        <ProcessingProgress status="uploading" progress={50} />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium mb-2">Analyzing</h4>
                        <ProcessingProgress status="analyzing" progress={75} />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium mb-2">Processing (30s estimated)</h4>
                        <ProcessingProgress
                            status="processing"
                            progress={60}
                            estimatedTime={30}
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium mb-2">Completed</h4>
                        <ProcessingProgress status="completed" progress={100} />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium mb-2">Failed with Error</h4>
                        <ProcessingProgress
                            status="failed"
                            error="The image could not be processed. Please try again with a different image."
                            onRetry={() => console.log("Retry clicked")}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
