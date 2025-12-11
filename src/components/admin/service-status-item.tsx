/**
 * Reusable service status item component
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ServiceStatusItemProps {
    name: string;
    description: string;
    status: 'operational' | 'warning' | 'error';
    statusText: string;
    metric?: string;
}

const statusConfig = {
    operational: {
        icon: CheckCircle,
        bgColor: 'bg-green-50 dark:bg-green-950/50',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600',
        badgeColor: 'text-green-600 border-green-600'
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/50',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        iconColor: 'text-yellow-600',
        badgeColor: 'text-yellow-600 border-yellow-600'
    },
    error: {
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-950/50',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600',
        badgeColor: 'text-red-600 border-red-600'
    }
};

export function ServiceStatusItem({
    name,
    description,
    status,
    statusText,
    metric
}: ServiceStatusItemProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={`flex items-center justify-between p-4 ${config.bgColor} rounded-lg border ${config.borderColor}`}>
            <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
                <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                </div>
            </div>
            <div className="text-right">
                <Badge variant="outline" className={config.badgeColor}>
                    {statusText}
                </Badge>
                {metric && (
                    <div className="text-xs text-muted-foreground mt-1">{metric}</div>
                )}
            </div>
        </div>
    );
}