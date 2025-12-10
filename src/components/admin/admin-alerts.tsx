'use client';

import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface AdminAlert {
    message: string;
    severity: 'critical' | 'warning' | 'info';
    action?: {
        href: string;
        label: string;
    };
}

interface AdminAlertsProps {
    alerts: AdminAlert[];
}

export function AdminAlerts({ alerts }: AdminAlertsProps) {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">Active Alerts</h3>
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/20 text-xs font-medium">
                    {alerts.length}
                </div>
            </div>
            {alerts.map((alert, index) => (
                <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{alert.message}</span>
                            {alert.action && (
                                <Button variant="link" asChild className="h-auto p-0 text-sm">
                                    <Link href={alert.action.href}>{alert.action.label}</Link>
                                </Button>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    );
}