'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/admin/role-badge';
import {
    Shield,
    Clock,
    RefreshCw,
    BarChart3,
    UserPlus,
} from 'lucide-react';
import { UserRole } from '@/types/admin';

interface AdminHeaderProps {
    role: UserRole;
    lastUpdated: string;
    isRefreshing: boolean;
    onRefresh: () => void;
}

export function AdminHeader({ role, lastUpdated, isRefreshing, onRefresh }: AdminHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <RoleBadge role={role} size="sm" />
                            {lastUpdated && (
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Updated {lastUpdated}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                    {role === 'superadmin'
                        ? 'Platform-wide management and monitoring overview'
                        : 'Team management and monitoring overview'
                    }
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
                <Button asChild variant="outline">
                    <Link href="/admin/analytics" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                    </Link>
                </Button>
                <Button asChild className="gap-2">
                    <Link href="/admin/users">
                        <UserPlus className="h-4 w-4" />
                        Invite Member
                    </Link>
                </Button>
            </div>
        </div>
    );
}