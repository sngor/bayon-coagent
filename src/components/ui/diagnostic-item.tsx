import { StatusIcon, StatusBadge, type DiagnosticStatus } from '@/components/ui/status-indicators';
import { type LucideIcon } from 'lucide-react';

interface DiagnosticItemProps {
    id: string;
    label: string;
    status: DiagnosticStatus;
    message: string;
    icon: LucideIcon;
    className?: string;
}

export function DiagnosticItem({
    label,
    status,
    message,
    icon: Icon,
    className = ""
}: DiagnosticItemProps) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${className}`}>
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <StatusIcon status={status} />
                <StatusBadge status={status} />
            </div>
        </div>
    );
}