'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface FeatureCardAction {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'ghost' | 'ai';
    disabled?: boolean;
}

export interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: FeatureCardAction;
    badge?: {
        label: string;
        variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    };
    className?: string;
    comingSoon?: boolean;
}

export function FeatureCard({
    icon: Icon,
    title,
    description,
    action,
    badge,
    className,
    comingSoon = false,
}: FeatureCardProps) {
    const defaultAction = comingSoon ? {
        label: 'Coming Soon',
        disabled: true,
        variant: 'outline' as const,
    } : action;

    const ActionButton = () => {
        if (!defaultAction) return null;

        const button = (
            <Button
                variant={defaultAction.variant || 'outline'}
                className="w-full"
                disabled={defaultAction.disabled}
                onClick={defaultAction.onClick}
            >
                {defaultAction.label}
            </Button>
        );

        if (defaultAction.href && !defaultAction.disabled) {
            return <Link href={defaultAction.href}>{button}</Link>;
        }

        return button;
    };

    return (
        <Card className={cn('h-full flex flex-col', className)}>
            <CardHeader className="flex-grow">
                <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {title}
                    </CardTitle>
                    {badge && (
                        <Badge variant={badge.variant || 'outline'}>
                            {badge.label}
                        </Badge>
                    )}
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ActionButton />
            </CardContent>
        </Card>
    );
}

export interface FeatureCardGridProps {
    cards: FeatureCardProps[];
    columns?: 1 | 2 | 3 | 4;
    className?: string;
}

export function FeatureCardGrid({
    cards,
    columns = 3,
    className,
}: FeatureCardGridProps) {
    const gridClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    }[columns];

    return (
        <div className={cn('grid gap-6', gridClass, className)}>
            {cards.map((card, index) => (
                <FeatureCard key={index} {...card} />
            ))}
        </div>
    );
}