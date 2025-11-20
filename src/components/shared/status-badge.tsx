'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Circle } from 'lucide-react';

export type StatusType =
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'pending'
    | 'processing'
    | 'active'
    | 'inactive'
    | 'draft'
    | 'published';

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    showIcon?: boolean;
    className?: string;
}

const statusConfig: Record<StatusType, {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
    className: string;
}> = {
    success: {
        label: 'Success',
        variant: 'default',
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    },
    error: {
        label: 'Error',
        variant: 'destructive',
        icon: <XCircle className="h-3 w-3" />,
        className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    },
    warning: {
        label: 'Warning',
        variant: 'outline',
        icon: <AlertCircle className="h-3 w-3" />,
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    },
    info: {
        label: 'Info',
        variant: 'secondary',
        icon: <AlertCircle className="h-3 w-3" />,
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    },
    pending: {
        label: 'Pending',
        variant: 'outline',
        icon: <Clock className="h-3 w-3" />,
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
    },
    processing: {
        label: 'Processing',
        variant: 'outline',
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    },
    active: {
        label: 'Active',
        variant: 'default',
        icon: <Circle className="h-3 w-3 fill-current" />,
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    },
    inactive: {
        label: 'Inactive',
        variant: 'outline',
        icon: <Circle className="h-3 w-3" />,
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
    },
    draft: {
        label: 'Draft',
        variant: 'secondary',
        icon: <Circle className="h-3 w-3" />,
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
    },
    published: {
        label: 'Published',
        variant: 'default',
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    },
};

/**
 * Standardized status badge with consistent colors and icons
 */
export function StatusBadge({ status, label, showIcon = true, className }: StatusBadgeProps) {
    const config = statusConfig[status];
    const displayLabel = label || config.label;

    return (
        <Badge variant={config.variant} className={cn(config.className, className)}>
            {showIcon && <span className="mr-1">{config.icon}</span>}
            {displayLabel}
        </Badge>
    );
}
