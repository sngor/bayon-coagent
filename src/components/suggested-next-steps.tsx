'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowRight,
    Sparkles,
    Search,
    FileText,
    CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/common';

export interface NextStep {
    title: string;
    description: string;
    href: string;
    priority: 'high' | 'medium' | 'low';
}

export interface SuggestedNextStepsProps {
    steps: NextStep[];
    className?: string;
}

const priorityConfig = {
    high: {
        badge: 'Recommended',
        badgeVariant: 'default' as const,
        icon: Sparkles,
        iconColor: 'text-primary',
    },
    medium: {
        badge: 'Suggested',
        badgeVariant: 'secondary' as const,
        icon: CheckCircle2,
        iconColor: 'text-blue-500',
    },
    low: {
        badge: 'Optional',
        badgeVariant: 'outline' as const,
        icon: FileText,
        iconColor: 'text-muted-foreground',
    },
};

export function SuggestedNextSteps({
    steps,
    className,
}: SuggestedNextStepsProps) {
    if (steps.length === 0) {
        return null;
    }

    // Show top 3 steps
    const topSteps = steps.slice(0, 3);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Suggested Next Steps
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {topSteps.map((step, index) => {
                    const config = priorityConfig[step.priority];
                    const Icon = config.icon;

                    return (
                        <Link key={index} href={step.href}>
                            <div
                                className={cn(
                                    'group relative rounded-lg border p-4 transition-all duration-300 hover:shadow-md',
                                    step.priority === 'high' &&
                                    'bg-gradient-to-r from-primary/5 to-transparent border-primary/20 hover:from-primary/10',
                                    step.priority === 'medium' &&
                                    'bg-gradient-to-r from-blue-500/5 to-transparent border-blue-500/20 hover:from-blue-500/10',
                                    step.priority === 'low' && 'hover:bg-muted/50'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            'flex-shrink-0 rounded-full p-2',
                                            step.priority === 'high' && 'bg-primary/10',
                                            step.priority === 'medium' && 'bg-blue-500/10',
                                            step.priority === 'low' && 'bg-muted'
                                        )}
                                    >
                                        <Icon className={cn('h-4 w-4', config.iconColor)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-headline font-semibold text-sm group-hover:text-primary transition-colors">
                                                {step.title}
                                            </h4>
                                            <Badge variant={config.badgeVariant} className="text-xs">
                                                {config.badge}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {step.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </CardContent>
        </Card>
    );
}
