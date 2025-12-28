'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/common';

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ElementType;
}

interface EnhancedBreadcrumbsProps {
    items?: BreadcrumbItem[];
    className?: string;
    showHome?: boolean;
}

export function EnhancedBreadcrumbs({
    items,
    className,
    showHome = true
}: EnhancedBreadcrumbsProps) {
    const pathname = usePathname();

    // Auto-generate breadcrumbs from pathname if items not provided
    const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

    if (breadcrumbItems.length === 0) return null;

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn(
                "flex items-center space-x-1 text-sm text-muted-foreground",
                className
            )}
        >
            {showHome && (
                <>
                    <Link
                        href="/dashboard"
                        className="flex items-center hover:text-foreground transition-colors"
                        aria-label="Dashboard"
                    >
                        <Home className="h-4 w-4" />
                    </Link>
                    {breadcrumbItems.length > 0 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    )}
                </>
            )}

            {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                const Icon = item.icon;

                return (
                    <React.Fragment key={index}>
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                <span>{item.label}</span>
                            </Link>
                        ) : (
                            <span
                                className={cn(
                                    "flex items-center gap-1",
                                    isLast && "text-foreground font-medium"
                                )}
                                aria-current={isLast ? "page" : undefined}
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                <span>{item.label}</span>
                            </span>
                        )}

                        {!isLast && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Hub mapping for better labels
    const hubLabels: Record<string, string> = {
        'studio': 'Studio',
        'brand': 'Brand',
        'research': 'Research',
        'market': 'Market',
        'tools': 'Tools',
        'library': 'Library',
        'dashboard': 'Dashboard',
        'assistant': 'Assistant',
        'settings': 'Settings'
    };

    // Section mapping for better labels
    const sectionLabels: Record<string, string> = {
        'write': 'Write',
        'describe': 'Describe',
        'reimagine': 'Reimagine',
        'profile': 'Profile',
        'audit': 'Audit',
        'competitors': 'Competitors',
        'strategy': 'Strategy',
        'agent': 'Research Agent',
        'reports': 'Reports',
        'knowledge': 'Knowledge Base',
        'insights': 'Insights',
        'opportunities': 'Opportunities',
        'analytics': 'Analytics',
        'calculator': 'Calculator',
        'roi': 'ROI Calculator',
        'valuation': 'Valuation',
        'content': 'Content',
        'media': 'Media',
        'templates': 'Templates'
    };

    let currentPath = '';

    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;

        // Skip if this is the last segment (current page)
        if (index === segments.length - 1) {
            breadcrumbs.push({
                label: sectionLabels[segment] || hubLabels[segment] || formatSegment(segment)
            });
        } else {
            breadcrumbs.push({
                label: hubLabels[segment] || sectionLabels[segment] || formatSegment(segment),
                href: currentPath
            });
        }
    });

    return breadcrumbs;
}

function formatSegment(segment: string): string {
    return segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}