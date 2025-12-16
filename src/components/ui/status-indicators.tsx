import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type DiagnosticStatus = 'success' | 'error' | 'warning';

interface StatusIconProps {
    status: DiagnosticStatus;
    className?: string;
}

interface StatusBadgeProps {
    status: DiagnosticStatus;
    className?: string;
}

export function StatusIcon({ status, className = "h-4 w-4" }: StatusIconProps) {
    switch (status) {
        case 'success':
            return <CheckCircle className={`${className} text-green-600`} />;
        case 'error':
            return <XCircle className={`${className} text-red-600`} />;
        default:
            return <AlertTriangle className={`${className} text-yellow-600`} />;
    }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const statusConfig = {
        success: {
            className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            label: "OK"
        },
        error: {
            className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            label: "Error"
        },
        warning: {
            className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            label: "Warning"
        }
    };

    const config = statusConfig[status];
    return <Badge className={`${config.className} ${className || ''}`}>{config.label}</Badge>;
}