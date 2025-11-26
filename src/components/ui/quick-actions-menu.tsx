/**
 * Quick Actions Menu Component
 * 
 * Displays a menu of quick actions for common next steps
 * Requirement 20.5: Add quick actions menu for common next steps
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Zap,
    User,
    Sparkles,
    FileText,
    Search,
    Users,
    Shield,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { QuickAction } from '@/lib/user-flow';

interface QuickActionsMenuProps {
    actions: QuickAction[];
    className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    User,
    Sparkles,
    FileText,
    Search,
    Users,
    Shield,
};

const categoryLabels: Record<string, string> = {
    profile: 'Profile',
    marketing: 'Marketing',
    content: 'Content',
    analysis: 'Analysis',
};

export function QuickActionsMenu({ actions, className }: QuickActionsMenuProps) {
    const [open, setOpen] = useState(false);

    // Group actions by category
    const groupedActions = actions.reduce((acc, action) => {
        if (!acc[action.category]) {
            acc[action.category] = [];
        }
        acc[action.category].push(action);
        return acc;
    }, {} as Record<string, QuickAction[]>);

    const categories = Object.keys(groupedActions);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn('gap-2', className)}>
                    <Zap className="h-4 w-4" />
                    Quick Actions
                    {actions.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {actions.length}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {actions.length === 0 ? (
                    <div className="px-2 py-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            No quick actions available
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            You're all caught up!
                        </p>
                    </div>
                ) : (
                    categories.map((category, categoryIndex) => (
                        <div key={category}>
                            {categoryIndex > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
                                {categoryLabels[category] || category}
                            </DropdownMenuLabel>
                            <DropdownMenuGroup>
                                {groupedActions[category].map((action) => {
                                    const Icon = action.icon ? iconMap[action.icon] : null;
                                    return (
                                        <DropdownMenuItem key={action.id} asChild>
                                                <Link
                                                    href={action.href}
                                                    className="flex items-start gap-3 py-3 cursor-pointer text-popover-foreground"
                                                    onClick={() => setOpen(false)}
                                                >
                                                {Icon && (
                                                    <div className="flex-shrink-0 rounded-full p-1.5 bg-primary/10">
                                                        <Icon className="h-4 w-4 text-primary" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-popover-foreground">{action.label}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {action.description}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                            </Link>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuGroup>
                        </div>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Compact quick actions bar for mobile
 */
export function QuickActionsBar({ actions, className }: QuickActionsMenuProps) {
    if (actions.length === 0) return null;

    // Show top 3 actions
    const topActions = actions.slice(0, 3);

    return (
        <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
            {topActions.map((action) => {
                const Icon = action.icon ? iconMap[action.icon] : null;
                return (
                    <Button
                        key={action.id}
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                    >
                        <Link href={action.href} className="gap-2">
                            {Icon && <Icon className="h-3.5 w-3.5" />}
                            {action.label}
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
}
