/**
 * Workflow Help Panel Component
 * 
 * Displays contextual help, tips, warnings, and documentation links for workflow steps.
 * The panel is collapsible/expandable to save screen space.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablet } from '@/hooks/use-tablet';
import {
    Info,
    Lightbulb,
    AlertTriangle,
    Sparkles,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { WorkflowStepDefinition } from '@/types/workflows';

export interface WorkflowHelpPanelProps {
    /** The current workflow step */
    step: WorkflowStepDefinition;
    /** Whether the panel is initially open */
    defaultOpen?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * Extended step definition with optional warnings and AI tips
 * These fields are optional extensions to the base WorkflowStepDefinition
 */
interface ExtendedStepDefinition extends WorkflowStepDefinition {
    /** Warnings about common mistakes (optional) */
    warnings?: string[];
    /** Tips for AI prompt writing (optional) */
    aiPromptTips?: string[];
    /** Documentation links (optional) */
    documentationLinks?: Array<{
        title: string;
        url: string;
    }>;
}

/**
 * Workflow Help Panel Component
 */
export function WorkflowHelpPanel({
    step,
    defaultOpen = true,
    className,
}: WorkflowHelpPanelProps) {
    // Responsive hooks
    const isMobile = useIsMobile();
    const { isTablet } = useTablet();

    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Cast to extended definition to access optional fields
    const extendedStep = step as ExtendedStepDefinition;

    // Determine if this step involves AI generation
    const isAIStep = extendedStep.aiPromptTips && extendedStep.aiPromptTips.length > 0;

    // Check if we have any warnings
    const hasWarnings = extendedStep.warnings && extendedStep.warnings.length > 0;

    // Check if we have documentation links
    const hasDocLinks = extendedStep.documentationLinks && extendedStep.documentationLinks.length > 0;

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className={cn(
                'workflow-help-panel',
                isMobile && 'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t bg-background shadow-2xl',
                className
            )}
            role="region"
            aria-label="Step guidance and help"
        >
            <div className={cn(
                "bg-card",
                isMobile ? "rounded-t-2xl" : "rounded-lg border shadow-sm"
            )}>
                {/* Header with collapse trigger */}
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-between hover:bg-accent",
                            isMobile ? "p-3" : "p-4"
                        )}
                        aria-expanded={isOpen}
                        aria-controls="help-panel-content"
                        aria-label={`${isOpen ? 'Collapse' : 'Expand'} step guide`}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-primary")} aria-hidden="true" />
                            <span className={cn("font-semibold", isMobile && "text-sm")}>Step Guide</span>
                            {isAIStep && (
                                <Badge variant="secondary" className="ml-2">
                                    <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
                                    AI Step
                                </Badge>
                            )}
                        </div>
                        {isOpen ? (
                            <ChevronUp className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-muted-foreground")} aria-hidden="true" />
                        ) : (
                            <ChevronDown className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-muted-foreground")} aria-hidden="true" />
                        )}
                    </Button>
                </CollapsibleTrigger>

                {/* Collapsible content */}
                <CollapsibleContent id="help-panel-content">
                    <div className={cn(
                        "space-y-4",
                        isMobile ? "px-3 pb-3 max-h-[60vh] overflow-y-auto" : "px-4 pb-4"
                    )}>
                        {/* Help text section */}
                        <HelpSection
                            icon={Info}
                            title="About this step"
                            iconColor="text-primary"
                        >
                            <p className="text-sm text-muted-foreground">
                                {step.helpText}
                            </p>
                        </HelpSection>

                        {/* Tips section */}
                        {step.tips && step.tips.length > 0 && (
                            <HelpSection
                                icon={Lightbulb}
                                title="Tips for success"
                                iconColor="text-warning"
                            >
                                <ul className="space-y-2">
                                    {step.tips.map((tip, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-sm text-muted-foreground"
                                        >
                                            <span className="text-warning mt-0.5">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </HelpSection>
                        )}

                        {/* Warnings section */}
                        {hasWarnings && (
                            <HelpSection
                                icon={AlertTriangle}
                                title="Common mistakes to avoid"
                                iconColor="text-destructive"
                            >
                                <ul className="space-y-2">
                                    {extendedStep.warnings!.map((warning, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-sm text-muted-foreground"
                                        >
                                            <span className="text-destructive mt-0.5">⚠</span>
                                            <span>{warning}</span>
                                        </li>
                                    ))}
                                </ul>
                            </HelpSection>
                        )}

                        {/* AI prompt tips section */}
                        {isAIStep && (
                            <HelpSection
                                icon={Sparkles}
                                title="AI prompt tips"
                                iconColor="text-purple-500"
                            >
                                <ul className="space-y-2">
                                    {extendedStep.aiPromptTips!.map((tip, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-sm text-muted-foreground"
                                        >
                                            <span className="text-purple-500 mt-0.5">✨</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </HelpSection>
                        )}

                        {/* Documentation links section */}
                        {hasDocLinks && (
                            <div className="pt-2 border-t">
                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                    Need more help?
                                </h4>
                                <div className="space-y-2">
                                    {extendedStep.documentationLinks!.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start"
                                            asChild
                                        >
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2"
                                            >
                                                <BookOpen className="h-4 w-4" />
                                                <span className="flex-1 text-left">{link.title}</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Default "Need more help?" button if no doc links */}
                        {!hasDocLinks && (
                            <div className="pt-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    asChild
                                >
                                    <a
                                        href="/support"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Need more help? Visit Support
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

/**
 * Help section component for consistent styling
 */
interface HelpSectionProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    iconColor: string;
    children: React.ReactNode;
}

function HelpSection({ icon: Icon, title, iconColor, children }: HelpSectionProps) {
    const isMobile = useIsMobile();

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "rounded-lg bg-muted/50",
                isMobile ? "p-3" : "p-4"
            )}
        >
            <div className="flex items-start gap-3">
                <Icon className={cn(
                    'mt-0.5 flex-shrink-0',
                    isMobile ? 'h-4 w-4' : 'h-5 w-5',
                    iconColor
                )} />
                <div className="flex-1">
                    <h4 className={cn(
                        "font-medium mb-2",
                        isMobile && "text-sm"
                    )}>{title}</h4>
                    {children}
                </div>
            </div>
        </motion.div>
    );
}
