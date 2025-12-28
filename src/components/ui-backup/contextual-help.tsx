/**
 * Contextual Help Component
 * 
 * Displays contextual help information based on the current page
 * Requirement 20.4: Add contextual help based on current page and user state
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Lightbulb, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/common';
import type { ContextualHelp as ContextualHelpType } from '@/lib/user-flow';

interface ContextualHelpProps {
    help: ContextualHelpType;
    className?: string;
    collapsible?: boolean;
}

export function ContextualHelp({
    help,
    className,
    collapsible = false,
}: ContextualHelpProps) {
    return (
        <Card className={cn('border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900', className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    {help.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{help.description}</p>

                {help.tips.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <span>Tips</span>
                        </div>
                        <ul className="space-y-1.5 ml-6">
                            {help.tips.map((tip, index) => (
                                <li key={index} className="text-sm text-muted-foreground list-disc">
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {help.relatedLinks.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Related Pages</p>
                        <div className="flex flex-wrap gap-2">
                            {help.relatedLinks.map((link, index) => (
                                <Button
                                    key={index}
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                >
                                    <Link href={link.href}>
                                        {link.label}
                                        <ExternalLink className="ml-1.5 h-3 w-3" />
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
