'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface PageAction {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'ghost' | 'ai';
    icon?: LucideIcon;
}

export interface PageLayoutProps {
    title: string;
    description?: string;
    actions?: PageAction[];
    children: React.ReactNode;
    className?: string;
}

export function PageLayout({
    title,
    description,
    actions = [],
    children,
    className,
}: PageLayoutProps) {
    return (
        <div className={cn('space-y-8', className)}>
            {/* Page Header */}
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h1 className="font-headline text-3xl font-bold">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground mt-1">{description}</p>
                    )}
                </div>

                {actions.length > 0 && (
                    <div className="flex items-center gap-2 ml-4">
                        {actions.map((action, index) => {
                            const ActionIcon = action.icon;
                            const button = (
                                <Button
                                    key={index}
                                    variant={action.variant || 'default'}
                                    onClick={action.onClick}
                                >
                                    {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
                                    {action.label}
                                </Button>
                            );

                            if (action.href) {
                                return (
                                    <Link key={index} href={action.href}>
                                        {button}
                                    </Link>
                                );
                            }

                            return button;
                        })}
                    </div>
                )}
            </div>

            {/* Page Content */}
            {children}
        </div>
    );
}

export interface SectionProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function Section({
    title,
    description,
    children,
    className,
}: SectionProps) {
    return (
        <section className={cn('space-y-6', className)}>
            {(title || description) && (
                <div>
                    {title && <h2 className="font-headline text-2xl font-semibold">{title}</h2>}
                    {description && <p className="text-muted-foreground mt-1">{description}</p>}
                </div>
            )}
            {children}
        </section>
    );
}