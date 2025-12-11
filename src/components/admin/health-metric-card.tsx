/**
 * Reusable health metric card component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';

interface HealthMetricCardProps {
    title: string;
    value: string;
    subtitle: string;
    progress: number;
    icon: LucideIcon;
    iconColor: string;
    gradientFrom: string;
    gradientTo: string;
}

export function HealthMetricCard({
    title,
    value,
    subtitle,
    progress,
    icon: Icon,
    iconColor,
    gradientFrom,
    gradientTo
}: HealthMetricCardProps) {
    return (
        <Card className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo}`} />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${iconColor}`} />
            </CardHeader>
            <CardContent className="relative">
                <div className={`text-3xl font-bold ${iconColor}`}>{value}</div>
                <p className={`text-xs ${iconColor} mt-1`}>{subtitle}</p>
                <Progress value={progress} className="mt-3 h-2" />
            </CardContent>
        </Card>
    );
}