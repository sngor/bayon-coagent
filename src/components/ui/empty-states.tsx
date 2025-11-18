import * as React from "react";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { Button } from "./button";

/**
 * Empty State Variants
 * Different visual styles for different contexts
 */
const emptyStateVariants = cva(
    "text-center py-12",
    {
        variants: {
            variant: {
                default: "",
                subtle: "py-8",
                prominent: "py-16",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

/**
 * Empty State Props
 */
export interface EmptyStateProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: "default" | "outline" | "ai";
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * Empty State Component
 * Displays when no data exists with clear guidance on next steps
 * 
 * Validates Requirements 3.3, 19.4:
 * - 3.3: WHEN no data exists for a feature THEN the Application SHALL display an informative empty state with clear next steps
 * - 19.4: WHEN no data exists THEN the Application SHALL explain how to get started
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    (
        {
            icon,
            title,
            description,
            action,
            secondaryAction,
            variant,
            className,
            ...props
        },
        ref
    ) => {
        return (
            <Card
                ref={ref}
                className={cn(emptyStateVariants({ variant }), className)}
                {...props}
            >
                <CardContent className="space-y-4">
                    {/* Icon container */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        {icon}
                    </div>

                    {/* Text content */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            {description}
                        </p>
                    </div>

                    {/* Action buttons */}
                    {(action || secondaryAction) && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                            {action && (
                                <Button
                                    onClick={action.onClick}
                                    size="lg"
                                    variant={action.variant || "default"}
                                    className="w-full sm:w-auto"
                                >
                                    {action.label}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                            {secondaryAction && (
                                <Button
                                    onClick={secondaryAction.onClick}
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                >
                                    {secondaryAction.label}
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }
);

EmptyState.displayName = "EmptyState";

/**
 * Preset Empty State Variants for Common Contexts
 */

/**
 * No Data Empty State
 * Used when a feature has no data yet
 */
interface NoDataEmptyStateProps {
    title?: string;
    description?: string;
    icon: React.ReactNode;
    action?: EmptyStateProps["action"];
    className?: string;
}

export function NoDataEmptyState({
    title = "No data yet",
    description = "Get started by creating your first item.",
    icon,
    action,
    className,
}: NoDataEmptyStateProps) {
    return (
        <EmptyState
            variant="default"
            icon={icon}
            title={title}
            description={description}
            action={action}
            className={className}
        />
    );
}

/**
 * No Results Empty State
 * Used when a search or filter returns no results
 */
interface NoResultsEmptyStateProps {
    searchTerm?: string;
    onClearSearch?: () => void;
    icon: React.ReactNode;
    className?: string;
}

export function NoResultsEmptyState({
    searchTerm,
    onClearSearch,
    icon,
    className,
}: NoResultsEmptyStateProps) {
    const title = searchTerm
        ? `No results for "${searchTerm}"`
        : "No results found";
    const description = searchTerm
        ? "Try adjusting your search or filters to find what you're looking for."
        : "Try a different search term or adjust your filters.";

    return (
        <EmptyState
            variant="subtle"
            icon={icon}
            title={title}
            description={description}
            action={
                onClearSearch
                    ? {
                        label: "Clear search",
                        onClick: onClearSearch,
                        variant: "outline",
                    }
                    : undefined
            }
            className={className}
        />
    );
}

/**
 * First Time Use Empty State
 * Used for onboarding and first-time feature use
 */
interface FirstTimeUseEmptyStateProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    action: EmptyStateProps["action"];
    secondaryAction?: EmptyStateProps["secondaryAction"];
    className?: string;
}

export function FirstTimeUseEmptyState({
    title,
    description,
    icon,
    action,
    secondaryAction,
    className,
}: FirstTimeUseEmptyStateProps) {
    return (
        <EmptyState
            variant="prominent"
            icon={icon}
            title={title}
            description={description}
            action={action}
            secondaryAction={secondaryAction}
            className={className}
        />
    );
}

