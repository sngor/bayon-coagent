'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AdminMetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
    subtitle?: string;
    subtitleIcon?: LucideIcon;
    subtitleColor?: string;
    actionLabel?: string;
    actionHref?: string;
    actionColor?: string;
    isLoading?: boolean;
}

export function AdminMetricCard({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
    subtitle,
    subtitleIcon: SubtitleIcon,
    subtitleColor = 'text-muted-foreground',
    actionLabel,
    actionHref,
    actionColor = 'text-blue-600',
    isLoading = false
}: AdminMetricCardProps) {
    return (
        <Card className="overflow-hidden bg-background/50 border-primary/20">
            <CardGradientMesh>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className={`p-2 ${iconBgColor} rounded-lg`}>
                        <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">
                        {isLoading ? '-' : value}
                    </div>
                    {subtitle && (
                        <div className="flex items-center gap-2 mt-2">
                            {SubtitleIcon && <SubtitleIcon className={`h-4 w-4 ${subtitleColor}`} />}
                            <span className={`text-sm ${subtitleColor} font-medium`}>
                                {subtitle}
                            </span>
                        </div>
                    )}
                    {actionLabel && actionHref && (
                        <div className="flex items-center gap-2 mt-2">
                            <Button variant="link" asChild className={`h-auto p-0 text-sm ${actionColor}`}>
                                <Link href={actionHref}>{actionLabel}</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}