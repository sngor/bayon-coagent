import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

/**
 * Breadcrumbs Component
 * Provides contextual navigation showing the current page's location in the site hierarchy
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={cn("flex items-center space-x-1 text-sm", className)}
        >
            <ol className="flex items-center space-x-1">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center">
                            {index > 0 && (
                                <ChevronRight
                                    className="h-4 w-4 text-muted-foreground mx-1"
                                    aria-hidden="true"
                                />
                            )}
                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    className={cn(
                                        isLast
                                            ? "text-foreground font-medium"
                                            : "text-muted-foreground"
                                    )}
                                    aria-current={isLast ? "page" : undefined}
                                >
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
