'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface SuperAdminPageHeaderProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    children?: ReactNode;
}

export function SuperAdminPageHeader({
    title,
    description,
    icon: Icon,
    action,
    children
}: SuperAdminPageHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    {Icon && <Icon className="h-8 w-8 text-blue-600" />}
                    {title}
                </h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-2">
                {children}
                {action && (
                    <Button onClick={action.onClick}>
                        {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                        {action.label}
                    </Button>
                )}
            </div>
        </div>
    );
}