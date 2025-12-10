'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
    subtitle?: ReactNode;
    badge?: ReactNode;
    progressBar?: {
        percentage: number;
        color: string;
    };
    action?: {
        href: string;
        label: string;
        color?: string;
    };
}

export function MetricCard({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
    subtitle,
    badge,
    progressBar,
    action,
}: MetricCardProps) {
    return (
        <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardGradientMesh>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className={`p-2 rounded-lg ${iconBgColor}`}>
                        <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">{value}</div>
                    {subtitle && (
                        <div className="flex items-center justify-between mt-3">
                            {subtitle}
                            {badge}
                        </div>
                    )}
                    {progressBar && (
                        <div className="mt-2 bg-muted rounded-full h-2">
                            <div
                                className={`${progressBar.color} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${progressBar.percentage}%` } as React.CSSProperties}
                            />
                        </div>
                    )}
                    {action && (
                        <div className="mt-3">
                            <Button variant="link" asChild className={`h-auto p-0 text-sm ${action.color || ''}`}>
                                <Link href={action.href} className="flex items-center gap-1">
                                    {action.label}
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}

export function MetricCardSkeleton() {
    return (
        <Card className="overflow-hidden bg-background/50 border-primary/20">
            <CardGradientMesh>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}