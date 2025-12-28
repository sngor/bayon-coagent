'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/common';

export interface ComingSoonCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    timeline?: string;
    priority?: 'high' | 'medium' | 'low';
    className?: string;
}

export function ComingSoonCard({
    icon: Icon,
    title,
    description,
    timeline,
    priority,
    className,
}: ComingSoonCardProps) {
    const priorityColors = {
        high: 'bg-red-100 text-red-800 border-red-200',
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        low: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
        <Card className={cn('h-full flex flex-col', className)}>
            <CardHeader className="flex-grow">
                <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {title}
                    </CardTitle>
                    {priority && (
                        <Badge
                            variant="outline"
                            className={priorityColors[priority]}
                        >
                            {priority}
                        </Badge>
                    )}
                </div>
                <CardDescription>{description}</CardDescription>
                {timeline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="w-4 h-4" />
                        <span>{timeline}</span>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                </Button>
            </CardContent>
        </Card>
    );
}

export interface ComingSoonGridProps {
    cards: ComingSoonCardProps[];
    columns?: 1 | 2 | 3 | 4;
    className?: string;
}

export function ComingSoonGrid({
    cards,
    columns = 3,
    className,
}: ComingSoonGridProps) {
    const gridClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    }[columns];

    return (
        <div className={cn('grid gap-6', gridClass, className)}>
            {cards.map((card, index) => (
                <ComingSoonCard key={index} {...card} />
            ))}
        </div>
    );
}