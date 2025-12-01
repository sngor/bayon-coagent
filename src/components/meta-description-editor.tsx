'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils/common';

interface MetaDescriptionEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * MetaDescriptionEditor Component
 * 
 * Text area with character counter and validation warning
 * for length outside 150-160 characters.
 * 
 * Requirements: 7.4
 */
export function MetaDescriptionEditor({
    value,
    onChange,
    label = 'Meta Description',
    description = 'A brief summary of your content for search results',
    placeholder = 'Enter a compelling meta description...',
    disabled = false,
    className = '',
}: MetaDescriptionEditorProps) {
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        setCharCount(value.length);
    }, [value]);

    const getValidationStatus = () => {
        if (charCount === 0) {
            return {
                status: 'empty',
                message: 'Meta description is required',
                icon: <Info className="h-4 w-4" />,
                color: 'text-muted-foreground',
                badgeVariant: 'secondary' as const,
            };
        }

        if (charCount >= 150 && charCount <= 160) {
            return {
                status: 'optimal',
                message: 'Perfect length for search results',
                icon: <CheckCircle2 className="h-4 w-4" />,
                color: 'text-green-600',
                badgeVariant: 'default' as const,
            };
        }

        if (charCount < 120) {
            return {
                status: 'too-short',
                message: 'Too short - aim for 150-160 characters',
                icon: <AlertCircle className="h-4 w-4" />,
                color: 'text-yellow-600',
                badgeVariant: 'secondary' as const,
            };
        }

        if (charCount < 150) {
            return {
                status: 'short',
                message: 'A bit short - aim for 150-160 characters',
                icon: <Info className="h-4 w-4" />,
                color: 'text-blue-600',
                badgeVariant: 'secondary' as const,
            };
        }

        if (charCount > 160 && charCount <= 180) {
            return {
                status: 'long',
                message: 'Slightly long - may be truncated in search results',
                icon: <Info className="h-4 w-4" />,
                color: 'text-blue-600',
                badgeVariant: 'secondary' as const,
            };
        }

        return {
            status: 'too-long',
            message: 'Too long - will be truncated in search results',
            icon: <AlertCircle className="h-4 w-4" />,
            color: 'text-red-600',
            badgeVariant: 'destructive' as const,
        };
    };

    const validation = getValidationStatus();

    const getCharCountColor = () => {
        if (charCount >= 150 && charCount <= 160) {
            return 'text-green-600';
        }
        if (charCount < 150 || (charCount > 160 && charCount <= 180)) {
            return 'text-yellow-600';
        }
        return 'text-red-600';
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{label}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <Badge variant={validation.badgeVariant} className="shrink-0">
                        {charCount}/160
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Textarea */}
                <div className="space-y-2">
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={3}
                        className={cn(
                            'resize-none',
                            validation.status === 'optimal' && 'border-green-500 focus-visible:ring-green-500',
                            (validation.status === 'too-short' || validation.status === 'too-long') && 'border-red-500 focus-visible:ring-red-500'
                        )}
                    />
                </div>

                {/* Character Count Progress Bar */}
                <div className="space-y-2">
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        {/* Optimal range indicator (150-160) */}
                        <div
                            className="absolute h-full bg-green-200 dark:bg-green-900/30"
                            style={{
                                left: '93.75%', // 150/160 = 93.75%
                                width: '6.25%', // 10/160 = 6.25%
                            }}
                        />

                        {/* Current progress */}
                        <div
                            className={cn(
                                'h-full transition-all duration-300',
                                charCount >= 150 && charCount <= 160 && 'bg-green-600',
                                (charCount < 150 || (charCount > 160 && charCount <= 180)) && 'bg-yellow-600',
                                (charCount < 120 || charCount > 180) && 'bg-red-600'
                            )}
                            style={{
                                width: `${Math.min((charCount / 160) * 100, 100)}%`,
                            }}
                        />
                    </div>

                    {/* Character count and range markers */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span className="text-green-600 font-medium">150-160</span>
                        <span>160+</span>
                    </div>
                </div>

                {/* Validation Message */}
                <div className={cn('flex items-center gap-2 text-sm', validation.color)}>
                    {validation.icon}
                    <span>{validation.message}</span>
                </div>

                {/* Tips */}
                <div className="pt-4 border-t space-y-2">
                    <h4 className="text-sm font-medium">Tips for a great meta description:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Include your primary keyword naturally</li>
                        <li>Write a compelling call-to-action</li>
                        <li>Accurately describe the page content</li>
                        <li>Make it unique for each page</li>
                        <li>Aim for 150-160 characters for optimal display</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
