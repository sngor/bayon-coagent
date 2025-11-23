'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface Step {
    title: string;
    description: string;
    status?: 'active' | 'completed' | 'pending';
}

export interface StepListProps {
    title?: string;
    description?: string;
    steps: Step[];
    variant?: 'default' | 'card' | 'minimal';
    className?: string;
}

export function StepList({
    title,
    description,
    steps,
    variant = 'default',
    className,
}: StepListProps) {
    const getStepStyles = (index: number, step: Step) => {
        const isActive = step.status === 'active' || (!step.status && index === 0);
        const isCompleted = step.status === 'completed';

        if (isCompleted) {
            return {
                circle: 'bg-success text-success-foreground',
                content: 'text-foreground',
            };
        }

        if (isActive) {
            return {
                circle: 'bg-primary text-primary-foreground',
                content: 'text-foreground',
            };
        }

        return {
            circle: 'bg-muted text-muted-foreground',
            content: 'text-muted-foreground',
        };
    };

    const content = (
        <div className="space-y-4">
            {steps.map((step, index) => {
                const styles = getStepStyles(index, step);

                return (
                    <div key={index} className="flex items-start gap-3">
                        <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                            styles.circle
                        )}>
                            {index + 1}
                        </div>
                        <div className={cn('flex-1', styles.content)}>
                            <h4 className="font-medium">{step.title}</h4>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    if (variant === 'card') {
        return (
            <Card className={className}>
                {(title || description) && (
                    <CardHeader>
                        {title && <CardTitle>{title}</CardTitle>}
                        {description && <CardDescription>{description}</CardDescription>}
                    </CardHeader>
                )}
                <CardContent>
                    {content}
                </CardContent>
            </Card>
        );
    }

    if (variant === 'minimal') {
        return (
            <div className={className}>
                {content}
            </div>
        );
    }

    return (
        <div className={className}>
            {(title || description) && (
                <div className="mb-6">
                    {title && <h3 className="font-headline text-lg font-semibold mb-2">{title}</h3>}
                    {description && <p className="text-muted-foreground">{description}</p>}
                </div>
            )}
            {content}
        </div>
    );
}