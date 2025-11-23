'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { featureToggleManager } from '@/lib/feature-toggles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

interface FeatureGuardProps {
    featureId: string;
    children: React.ReactNode;
    fallbackPath?: string;
}

/**
 * FeatureGuard component that protects routes based on feature toggles
 * Redirects or shows a message when a feature is disabled
 */
export function FeatureGuard({ featureId, children, fallbackPath = '/dashboard' }: FeatureGuardProps) {
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check if feature is enabled
        const enabled = featureToggleManager.isEnabled(featureId);
        setIsEnabled(enabled);
        setIsLoading(false);

        // Listen for feature toggle changes
        const handleToggleChange = (event: CustomEvent) => {
            if (event.detail.featureId === featureId) {
                setIsEnabled(event.detail.enabled);

                // If feature was disabled while user is on the page, redirect
                if (!event.detail.enabled && pathname.includes(featureId)) {
                    router.push(fallbackPath);
                }
            }
        };

        const handleReset = () => {
            const newEnabled = featureToggleManager.isEnabled(featureId);
            setIsEnabled(newEnabled);

            if (!newEnabled && pathname.includes(featureId)) {
                router.push(fallbackPath);
            }
        };

        window.addEventListener('featureToggleChanged', handleToggleChange as EventListener);
        window.addEventListener('featureToggleReset', handleReset);

        return () => {
            window.removeEventListener('featureToggleChanged', handleToggleChange as EventListener);
            window.removeEventListener('featureToggleReset', handleReset);
        };
    }, [featureId, pathname, router, fallbackPath]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    // Show feature disabled message
    if (!isEnabled) {
        const feature = featureToggleManager.getFeature(featureId);

        return (
            <div className="container mx-auto py-8 px-4 max-w-2xl">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle>Feature Not Available</CardTitle>
                        <CardDescription>
                            {feature?.name || 'This feature'} is currently disabled in your workspace settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <Settings className="h-4 w-4" />
                            <AlertDescription>
                                You can enable this feature in your settings under the "Features" tab.
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button asChild>
                                <Link href="/settings?tab=features" className="gap-2">
                                    <Settings className="h-4 w-4" />
                                    Enable in Settings
                                </Link>
                            </Button>

                            <Button variant="outline" asChild>
                                <Link href={fallbackPath} className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Go Back
                                </Link>
                            </Button>
                        </div>

                        {feature && (
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-headline font-medium mb-2">About {feature.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Feature is enabled, render children
    return <>{children}</>;
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeatureEnabled(featureId: string): boolean {
    const [isEnabled, setIsEnabled] = useState(() =>
        featureToggleManager.isEnabled(featureId)
    );

    useEffect(() => {
        const handleToggleChange = (event: CustomEvent) => {
            if (event.detail.featureId === featureId) {
                setIsEnabled(event.detail.enabled);
            }
        };

        const handleReset = () => {
            setIsEnabled(featureToggleManager.isEnabled(featureId));
        };

        window.addEventListener('featureToggleChanged', handleToggleChange as EventListener);
        window.addEventListener('featureToggleReset', handleReset);

        return () => {
            window.removeEventListener('featureToggleChanged', handleToggleChange as EventListener);
            window.removeEventListener('featureToggleReset', handleReset);
        };
    }, [featureId]);

    return isEnabled;
}