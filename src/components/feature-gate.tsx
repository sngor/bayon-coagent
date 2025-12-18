'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, Zap, AlertTriangle } from 'lucide-react';
import { useFeatureGates, FeatureLimits } from '@/hooks/use-feature-gates';
import { useRouter } from 'next/navigation';

interface FeatureGateProps {
    feature: keyof FeatureLimits;
    children: ReactNode;
    fallback?: ReactNode;
    showUpgradePrompt?: boolean;
    className?: string;
}

export function FeatureGate({ 
    feature, 
    children, 
    fallback, 
    showUpgradePrompt = true,
    className 
}: FeatureGateProps) {
    const { canUseFeature, getUpgradeMessage, limits, subscription } = useFeatureGates();
    const router = useRouter();

    const canUse = canUseFeature(feature);

    if (canUse) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (!showUpgradePrompt) {
        return null;
    }

    const limit = limits[feature];
    const isUsageLimited = 'used' in limit && 'limit' in limit;

    return (
        <Card className={`border-amber-200 dark:border-amber-800 ${className}`}>
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    {subscription.plan === 'free' ? (
                        <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    ) : (
                        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    )}
                </div>
                <CardTitle className="text-lg">
                    {subscription.plan === 'free' ? 'Premium Feature' : 'Limit Reached'}
                </CardTitle>
                <CardDescription>
                    {getUpgradeMessage(feature)}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                {isUsageLimited && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>Usage this month</span>
                            <span className="font-medium">
                                {(limit as any).used} / {(limit as any).limit}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(((limit as any).used / (limit as any).limit) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                        onClick={() => router.push('/settings?tab=subscription')}
                        className="gap-2"
                    >
                        <Crown className="h-4 w-4" />
                        Upgrade Now
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/settings?tab=usage')}
                        className="gap-2"
                    >
                        <Zap className="h-4 w-4" />
                        View Usage
                    </Button>
                </div>

                <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                        Premium plans start at $49/month with unlimited usage
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

interface UsageBadgeProps {
    feature: keyof FeatureLimits;
    className?: string;
}

export function UsageBadge({ feature, className }: UsageBadgeProps) {
    const { limits, canUseFeature, getUsagePercentage } = useFeatureGates();
    
    const limit = limits[feature];
    const canUse = canUseFeature(feature);
    const percentage = getUsagePercentage(feature);

    if (!('used' in limit && 'limit' in limit)) {
        return null;
    }

    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    if (isAtLimit) {
        return (
            <Badge variant="destructive" className={className}>
                Limit Reached
            </Badge>
        );
    }

    if (isNearLimit) {
        return (
            <Badge variant="outline" className={`border-amber-300 text-amber-700 dark:text-amber-300 ${className}`}>
                Near Limit
            </Badge>
        );
    }

    return (
        <Badge variant="secondary" className={className}>
            {limit.used}/{limit.limit}
        </Badge>
    );
}

interface FeatureUsageProps {
    feature: keyof FeatureLimits;
    showUpgradeButton?: boolean;
    className?: string;
}

export function FeatureUsage({ feature, showUpgradeButton = true, className }: FeatureUsageProps) {
    const { limits, getUsagePercentage, getRemainingUsage, subscription } = useFeatureGates();
    const router = useRouter();
    
    const limit = limits[feature];
    const percentage = getUsagePercentage(feature);
    const remaining = getRemainingUsage(feature);

    if (!('used' in limit && 'limit' in limit)) {
        return null;
    }

    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                        {limit.used} / {limit.limit}
                    </span>
                    <UsageBadge feature={feature} />
                </div>
            </div>
            
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${
                        isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            {(isAtLimit || isNearLimit) && showUpgradeButton && subscription.plan === 'free' && (
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm text-amber-900 dark:text-amber-100">
                            {isAtLimit ? 'Limit reached' : `${remaining} remaining`}
                        </span>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => router.push('/settings?tab=subscription')}
                        className="gap-1"
                    >
                        <Crown className="h-3 w-3" />
                        Upgrade
                    </Button>
                </div>
            )}
        </div>
    );
}