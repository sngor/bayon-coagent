'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { HubBreadcrumbsProps } from './types';
import { cn } from '@/lib/utils';

export function HubBreadcrumbs({ items, separator }: HubBreadcrumbsProps) {
    const Separator = separator || <ChevronRight className="h-4 w-4 text-muted-foreground" />;

    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const Icon = item.icon;

                    return (
                        <li key={index} className="flex items-center gap-2">
                            {index > 0 && <span className="flex-shrink-0">{Separator}</span>}
                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-1.5 hover:text-foreground transition-colors',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1'
                                    )}
                                >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    <span>{item.label}</span>
                                </Link>
                            ) : (
                                <span
                                    className={cn(
                                        'flex items-center gap-1.5',
                                        isLast && 'text-foreground font-medium'
                                    )}
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    <span>{item.label}</span>
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
