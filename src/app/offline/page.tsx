'use client';

import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi } from "lucide-react";

export default function OfflinePage() {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 p-6 max-w-md">
                <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-4">
                        <Wifi className="h-8 w-8 text-muted-foreground" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        You're offline
                    </h1>
                    <p className="text-muted-foreground">
                        Please check your internet connection and try again.
                    </p>
                </div>

                <Button
                    onClick={handleRetry}
                    className="gap-2"
                    aria-label="Retry connection"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </Button>
            </div>
        </div>
    );
}