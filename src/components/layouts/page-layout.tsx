import * as React from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumbs";

interface PageLayoutProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
    className?: string;
}

/**
 * Page Layout Component
 * Provides a consistent page structure with title, description, breadcrumbs, and action area
 * Includes fade-in-up animation on mount for a polished user experience
 */
export function PageLayout({
    title,
    description,
    action,
    breadcrumbs,
    children,
    className,
}: PageLayoutProps) {
    return (
        <div className={cn("space-y-6 animate-fade-in-up", className)}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumbs items={breadcrumbs} />
            )}

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 flex-1">
                    <h1 className="text-3xl font-bold font-headline tracking-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-muted-foreground text-base">{description}</p>
                    )}
                </div>
                {action && <div className="flex-shrink-0">{action}</div>}
            </div>

            {/* Page Content */}
            <div>{children}</div>
        </div>
    );
}
