import * as React from "react";
import { ArrowRight, LucideIcon, CheckCircle2, Circle, AlertCircle, Lightbulb, TrendingUp } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Progress } from "./progress";
import { Badge } from "./badge";

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

// ============================================================================
// Intelligent Empty States with Contextual Guidance
// Requirements: 27.2, 27.4, 27.7
// ============================================================================

/**
 * Smart Recommendation Interface
 */
export interface SmartRecommendation {
    id: string;
    title: string;
    description: string;
    href: string;
    priority: 'high' | 'medium' | 'low';
    icon?: React.ReactNode;
    estimatedTime?: string;
    prerequisitesMet: boolean;
    prerequisites?: Array<{
        description: string;
        met: boolean;
        actionHref?: string;
        actionLabel?: string;
    }>;
}

/**
 * Profile Completion Status Interface
 */
export interface ProfileCompletionStatus {
    percentage: number;
    isComplete: boolean;
    hasRequiredFields: boolean;
    missingFields: Array<{
        key: string;
        label: string;
        benefit: string;
        required: boolean;
    }>;
    nextField?: {
        key: string;
        label: string;
        benefit: string;
        required: boolean;
    };
}

/**
 * Intelligent Empty State Props
 * Validates Requirements 27.2, 27.4, 27.7:
 * - 27.2: WHEN viewing dashboards THEN the Application SHALL use AI to highlight actionable insights
 * - 27.4: WHERE data is missing THEN the Application SHALL proactively guide the Agent to complete their profile
 * - 27.7: WHEN viewing content THEN the Application SHALL use progressive disclosure to reduce cognitive load
 */
export interface IntelligentEmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    recommendations?: SmartRecommendation[];
    profileCompletion?: ProfileCompletionStatus;
    contextualTips?: string[];
    primaryAction?: {
        label: string;
        onClick: () => void;
        variant?: "default" | "outline" | "ai";
    };
    className?: string;
}

/**
 * Intelligent Empty State Component
 * Provides contextual guidance, smart recommendations, and visual progress indicators
 */
export function IntelligentEmptyState({
    icon,
    title,
    description,
    recommendations = [],
    profileCompletion,
    contextualTips = [],
    primaryAction,
    className,
}: IntelligentEmptyStateProps) {
    // Filter recommendations by priority
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high' && r.prerequisitesMet);
    const mediumPriorityRecs = recommendations.filter(r => r.priority === 'medium' && r.prerequisitesMet);
    const blockedRecs = recommendations.filter(r => !r.prerequisitesMet);

    return (
        <Card className={cn("text-center py-12", className)}>
            <CardContent className="space-y-8">
                {/* Icon and Title */}
                <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        {icon}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-foreground">
                            {title}
                        </h3>
                        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Profile Completion Progress */}
                {profileCompletion && !profileCompletion.hasRequiredFields && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-left max-w-2xl mx-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                    Complete Your Profile to Get Started
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Fill in required fields to unlock AI-powered features
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-amber-700 dark:text-amber-300">
                                    Profile Completion
                                </span>
                                <span className="font-semibold text-amber-900 dark:text-amber-100">
                                    {profileCompletion.percentage}%
                                </span>
                            </div>
                            <Progress
                                value={profileCompletion.percentage}
                                className="h-2"
                            />

                            {profileCompletion.nextField && (
                                <div className="pt-2">
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        <span className="font-medium">Next step:</span> Add your {profileCompletion.nextField.label.toLowerCase()}
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                        {profileCompletion.nextField.benefit}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* High Priority Recommendations */}
                {highPriorityRecs.length > 0 && (
                    <div className="max-w-2xl mx-auto text-left space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold text-foreground">
                                Recommended Next Steps
                            </h4>
                        </div>
                        {highPriorityRecs.map((rec, index) => (
                            <RecommendationCard key={rec.id} recommendation={rec} index={index} />
                        ))}
                    </div>
                )}

                {/* Medium Priority Recommendations */}
                {mediumPriorityRecs.length > 0 && highPriorityRecs.length === 0 && (
                    <div className="max-w-2xl mx-auto text-left space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold text-foreground">
                                Suggestions
                            </h4>
                        </div>
                        {mediumPriorityRecs.slice(0, 3).map((rec, index) => (
                            <RecommendationCard key={rec.id} recommendation={rec} index={index} />
                        ))}
                    </div>
                )}

                {/* Blocked Recommendations (Prerequisites Not Met) */}
                {blockedRecs.length > 0 && (
                    <div className="max-w-2xl mx-auto text-left">
                        <details className="group">
                            <summary className="cursor-pointer list-none">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <Circle className="w-4 h-4 group-open:hidden" />
                                    <CheckCircle2 className="w-4 h-4 hidden group-open:block" />
                                    <span>View locked features ({blockedRecs.length})</span>
                                </div>
                            </summary>
                            <div className="mt-3 space-y-2 pl-6">
                                {blockedRecs.map((rec) => (
                                    <div key={rec.id} className="text-sm text-muted-foreground">
                                        <p className="font-medium">{rec.title}</p>
                                        {rec.prerequisites && rec.prerequisites.length > 0 && (
                                            <ul className="mt-1 space-y-1 text-xs">
                                                {rec.prerequisites.map((prereq, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-destructive">•</span>
                                                        <span>Requires: {prereq.description}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                )}

                {/* Contextual Tips */}
                {contextualTips.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-left max-w-2xl mx-auto">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                    Tips to Get Started
                                </h4>
                                <ul className="space-y-2">
                                    {contextualTips.map((tip, index) => (
                                        <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Primary Action */}
                {primaryAction && (
                    <div className="pt-4">
                        <Button
                            onClick={primaryAction.onClick}
                            size="lg"
                            variant={primaryAction.variant || "default"}
                            className="w-full sm:w-auto"
                        >
                            {primaryAction.label}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Recommendation Card Component
 * Displays individual recommendation with priority and estimated time
 */
function RecommendationCard({
    recommendation,
    index
}: {
    recommendation: SmartRecommendation;
    index: number;
}) {
    const priorityColors = {
        high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        low: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    };

    return (
        <a
            href={recommendation.href}
            className="block group"
        >
            <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-200">
                {/* Number Badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {recommendation.title}
                        </h5>
                        {recommendation.estimatedTime && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {recommendation.estimatedTime}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {recommendation.description}
                    </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
        </a>
    );
}

