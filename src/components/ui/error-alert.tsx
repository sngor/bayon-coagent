import { XCircle } from 'lucide-react';

interface ErrorAlertProps {
    title?: string;
    message: string;
    className?: string;
}

export function ErrorAlert({
    title = "Connection Error",
    message,
    className = ""
}: ErrorAlertProps) {
    return (
        <div className={`p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 ${className}`}>
            <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">{title}</h4>
                    <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
                </div>
            </div>
        </div>
    );
}