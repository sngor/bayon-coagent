/**
 * Performance metrics component for health monitoring
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Cpu, HardDrive, Wifi } from 'lucide-react';

interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    status: string;
    color: string;
}

interface PerformanceMetricsProps {
    metrics: PerformanceMetric[];
}

const iconMap = {
    'CPU Usage': Cpu,
    'Memory Usage': HardDrive,
    'Network I/O': Wifi
};

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">System Performance</CardTitle>
                <CardDescription>Real-time performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {metrics.map((metric) => {
                    const Icon = iconMap[metric.name as keyof typeof iconMap] || Cpu;

                    return (
                        <div key={metric.name} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon className={`h-4 w-4 ${metric.color}`} />
                                    <span className="text-sm font-medium">{metric.name}</span>
                                </div>
                                <span className="text-sm font-medium">{metric.value}{metric.unit}</span>
                            </div>
                            <Progress value={metric.value} className="h-3" />
                            <div className="text-xs text-muted-foreground">{metric.status}</div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}