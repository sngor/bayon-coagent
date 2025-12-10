'use client';

/**
 * Workflow Detail Modal Component
 * 
 * Displays detailed information about a workflow preset before starting.
 * Shows title, description, estimated time, steps, outcomes, prerequisites,
 * and required integrations with connection status.
 * 
 * Requirements: 1.2, 8.1, 8.2, 13.2, 13.3, 13.4, 13.5
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablet } from '@/hooks/use-tablet';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Info,
    Sparkles,
    ArrowRight,
    X,
    Rocket,
    TrendingUp,
    Home,
    Target,
    Link as LinkIcon,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowPreset, WorkflowCategory } from '@/types/workflows';

// Icon mapping for workflow presets
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Rocket,
    TrendingUp,
    Home,
    Target,
};

// Category display names
const CATEGORY_NAMES: Record<WorkflowCategory, string> = {
    [WorkflowCategory.BRAND_BUILDING]: 'Brand Building',
    [WorkflowCategory.CONTENT_CREATION]: 'Content Creation',
    [WorkflowCategory.MARKET_ANALYSIS]: 'Market Analysis',
    [WorkflowCategory.CLIENT_ACQUISITION]: 'Client Acquisition',
};

/**
 * Integration connection status
 */
export interface IntegrationStatus {
    /** Integration identifier (e.g., 'google-business-profile') */
    id: string;
    /** Display name */
    name: string;
    /** Whether the integration is connected */
    isConnected: boolean;
}

export interface WorkflowDetailModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when modal should close */
    onOpenChange: (open: boolean) => void;
    /** Workflow preset to display */
    preset: WorkflowPreset | null;
    /** Callback when user starts the workflow */
    onStartWorkflow: (presetId: string) => void;
    /** Integration connection statuses (optional) */
    integrationStatuses?: IntegrationStatus[];
}

export function WorkflowDetailModal({
    open,
    onOpenChange,
    preset,
    onStartWorkflow,
    integrationStatuses = [],
}: WorkflowDetailModalProps) {
    // Responsive hooks
    const isMobile = useIsMobile();
    const { isTablet } = useTablet();

    // Get icon component for preset
    const Icon = preset ? (ICON_MAP[preset.icon] || Rocket) : Rocket;

    // Calculate total estimated time
    const totalEstimatedTime = useMemo(() => {
        if (!preset) return 0;
        return preset.estimatedMinutes;
    }, [preset]);

    // Check if all required integrations are connected
    const allIntegrationsConnected = useMemo(() => {
        if (!preset?.requiredIntegrations || preset.requiredIntegrations.length === 0) {
            return true;
        }

        return preset.requiredIntegrations.every(integrationId => {
            const status = integrationStatuses.find(s => s.id === integrationId);
            return status?.isConnected === true;
        });
    }, [preset, integrationStatuses]);

    // Get integration status for a required integration
    const getIntegrationStatus = (integrationId: string): IntegrationStatus | undefined => {
        return integrationStatuses.find(s => s.id === integrationId);
    };

    // Handle start workflow
    const handleStartWorkflow = () => {
        if (preset) {
            onStartWorkflow(preset.id);
            onOpenChange(false);
        }
    };

    if (!preset) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "max-h-[90vh] p-0",
                    isMobile ? "max-w-[95vw] w-full" : isTablet ? "max-w-xl" : "max-w-2xl"
                )}
                aria-describedby="workflow-description"
            >
                {/* Header */}
                <DialogHeader className={cn(isMobile ? "p-4 pb-3" : "p-6 pb-4")}>
                    <motion.div
                        className="flex items-start gap-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className={cn(
                                "rounded-xl bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center flex-shrink-0",
                                isMobile ? "w-10 h-10" : "w-14 h-14"
                            )}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                        >
                            <Icon className={cn(isMobile ? "w-5 h-5" : "w-7 h-7", "text-primary")} />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <DialogTitle className={cn(
                                    "font-bold",
                                    isMobile ? "text-lg" : "text-2xl"
                                )}>
                                    {preset.title}
                                </DialogTitle>
                                {preset.isRecommended && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                    >
                                        <Badge variant="default" className="flex-shrink-0">
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            Recommended
                                        </Badge>
                                    </motion.div>
                                )}
                            </div>
                            <DialogDescription id="workflow-description" className={cn(isMobile ? "text-sm" : "text-base")}>
                                {preset.description}
                            </DialogDescription>
                        </div>
                    </motion.div>

                    {/* Metadata badges */}
                    <motion.div
                        className={cn("flex flex-wrap gap-2", isMobile ? "mt-3" : "mt-4")}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        {[
                            { icon: Clock, text: `${totalEstimatedTime} minutes` },
                            { icon: null, text: `${preset.steps.length} steps` },
                            { icon: null, text: CATEGORY_NAMES[preset.category] }
                        ].map((badge, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                            >
                                <Badge variant="outline" className={cn(isMobile ? "text-xs" : "text-sm")}>
                                    {badge.icon && <badge.icon className={cn(isMobile ? "w-3 h-3 mr-1" : "w-4 h-4 mr-1.5")} />}
                                    {badge.text}
                                </Badge>
                            </motion.div>
                        ))}
                    </motion.div>
                </DialogHeader>

                <Separator />

                {/* Scrollable content */}
                <ScrollArea className={cn(
                    "max-h-[50vh]",
                    isMobile ? "px-4" : "px-6"
                )}>
                    <div className={cn(
                        "space-y-6",
                        isMobile ? "py-3" : "py-4"
                    )}>
                        {/* Steps Section */}
                        <section aria-labelledby="workflow-steps-heading">
                            <h3
                                id="workflow-steps-heading"
                                className={cn(
                                    "font-semibold mb-3 flex items-center gap-2",
                                    isMobile ? "text-base" : "text-lg"
                                )}
                            >
                                <Info className={cn(isMobile ? "w-4 h-4" : "w-5 h-5", "text-primary")} aria-hidden="true" />
                                Workflow Steps
                            </h3>
                            <div className="space-y-3">
                                {preset.steps.map((step, index) => (
                                    <motion.div
                                        key={step.id}
                                        className={cn(
                                            "flex items-start gap-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors",
                                            isMobile ? "p-2" : "p-3"
                                        )}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        whileHover={{ x: 4, backgroundColor: 'hsl(var(--muted))' }}
                                    >
                                        <motion.div
                                            className={cn(
                                                "rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5",
                                                isMobile ? "w-6 h-6" : "w-8 h-8"
                                            )}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <span className={cn(
                                                "font-semibold text-primary",
                                                isMobile ? "text-xs" : "text-sm"
                                            )}>
                                                {index + 1}
                                            </span>
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-sm">
                                                    {step.title}
                                                </h4>
                                                {step.isOptional && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Optional
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                {step.description}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                <span>{step.estimatedMinutes} min</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Expected Outcomes Section */}
                        <section aria-labelledby="expected-outcomes-heading">
                            <h3
                                id="expected-outcomes-heading"
                                className={cn(
                                    "font-semibold mb-3 flex items-center gap-2",
                                    isMobile ? "text-base" : "text-lg"
                                )}
                            >
                                <CheckCircle2 className={cn(isMobile ? "w-4 h-4" : "w-5 h-5", "text-green-500")} aria-hidden="true" />
                                Expected Outcomes
                            </h3>
                            <ul className="space-y-2">
                                {preset.outcomes.map((outcome, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-2 text-sm"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{outcome}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Prerequisites Section */}
                        {preset.prerequisites && preset.prerequisites.length > 0 && (
                            <section aria-labelledby="prerequisites-heading">
                                <h3
                                    id="prerequisites-heading"
                                    className={cn(
                                        "font-semibold mb-3 flex items-center gap-2",
                                        isMobile ? "text-base" : "text-lg"
                                    )}
                                >
                                    <AlertCircle className={cn(isMobile ? "w-4 h-4" : "w-5 h-5", "text-orange-500")} aria-hidden="true" />
                                    Prerequisites
                                </h3>
                                <ul className="space-y-2">
                                    {preset.prerequisites.map((prerequisite, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-sm"
                                        >
                                            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                            <span>{prerequisite}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Required Integrations Section */}
                        {preset.requiredIntegrations && preset.requiredIntegrations.length > 0 && (
                            <section aria-labelledby="required-integrations-heading">
                                <h3
                                    id="required-integrations-heading"
                                    className={cn(
                                        "font-semibold mb-3 flex items-center gap-2",
                                        isMobile ? "text-base" : "text-lg"
                                    )}
                                >
                                    <LinkIcon className={cn(isMobile ? "w-4 h-4" : "w-5 h-5", "text-blue-500")} aria-hidden="true" />
                                    Required Integrations
                                </h3>
                                <div className="space-y-2">
                                    {preset.requiredIntegrations.map((integrationId) => {
                                        const status = getIntegrationStatus(integrationId);
                                        const isConnected = status?.isConnected ?? false;
                                        const displayName = status?.name ?? integrationId;

                                        return (
                                            <div
                                                key={integrationId}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border",
                                                    isConnected
                                                        ? "border-green-500/20 bg-green-500/5"
                                                        : "border-orange-500/20 bg-orange-500/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isConnected ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-orange-500" />
                                                    )}
                                                    <span className="text-sm font-medium">
                                                        {displayName}
                                                    </span>
                                                </div>
                                                <Badge
                                                    variant={isConnected ? "default" : "secondary"}
                                                    className={cn(
                                                        "text-xs",
                                                        isConnected
                                                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                                            : "bg-orange-500/10 text-orange-700 dark:text-orange-400"
                                                    )}
                                                >
                                                    {isConnected ? "Connected" : "Not Connected"}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                                {!allIntegrationsConnected && (
                                    <p className="text-xs text-muted-foreground mt-3 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>
                                            Some integrations are not connected. You can still start the workflow,
                                            but you may need to connect them during the process.
                                        </span>
                                    </p>
                                )}
                            </section>
                        )}
                    </div>
                </ScrollArea>

                <Separator />

                {/* Footer */}
                <DialogFooter className={cn(
                    "pt-4",
                    isMobile ? "p-4 flex-col gap-2" : "p-6"
                )}>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className={cn(isMobile && "w-full")}
                        aria-label="Cancel and close dialog"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStartWorkflow}
                        className={cn(isMobile ? "w-full" : "min-w-[140px]")}
                        aria-label={`Start ${preset.title} workflow`}
                    >
                        Start Workflow
                        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
