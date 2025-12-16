import { Loader2 } from 'lucide-react';

interface LoadingDiagnosticProps {
    message?: string;
}

export function LoadingDiagnostic({ message = "Running diagnostics..." }: LoadingDiagnosticProps) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}