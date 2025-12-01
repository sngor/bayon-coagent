/**
 * Workflow Optimization Panel Component
 * 
 * Displays workflow shortcuts, stuck detection, and task guidance
 */

'use client';

// Force update

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb,
    Zap,
    HelpCircle,
    ChevronRight,
    X,
    CheckCircle,
    Clock,
    TrendingUp,
    BookOpen,
    MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type {
    WorkflowShortcut,
    StuckDetection,
    WorkflowOptimization,
} from '@/lib/workflow-optimization';

interface WorkflowOptimizationPanelProps {
    shortcuts: WorkflowShortcut[];
    stuckDetection: StuckDetection;
    optimizations: WorkflowOptimization[];
    efficiencyScore: number;
    onDismiss?: () => void;
}

export function WorkflowOptimizationPanel({
    shortcuts,
    stuckDetection,
    optimizations,
    efficiencyScore,
    onDismiss,
}: WorkflowOptimizationPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const hasContent = shortcuts.length > 0 || stuckDetection.isStuck || optimizations.length > 0;

    if (!hasContent) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 max-w-md"
        >
            <Card className="shadow-2xl border-primary/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                <Lightbulb className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm">Workflow Assistant</CardTitle>
                                <CardDescription className="text-xs">
                                    Efficiency Score: {efficiencyScore}%
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                <ChevronRight
                                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''
                                        }`}
                                />
                            </Button>
                            {onDismiss && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onDismiss}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <Progress value={efficiencyScore} className="h-1 mt-2" />
                </CardHeader>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                                {/* Stuck Detection */}
                                {stuckDetection.isStuck && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                            <HelpCircle className="w-4 h-4" />
                                            Need Help?
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {stuckDetection.reason}
                                        </p>
                                        <div className="space-y-2">
                                            {stuckDetection.suggestions.map((suggestion) => (
                                                <Button
                                                    key={suggestion.id}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-start text-xs"
                                                    onClick={() => {
                                                        if (suggestion.action?.href) {
                                                            window.location.href = suggestion.action.href;
                                                        } else if (suggestion.action?.onClick) {
                                                            suggestion.action.onClick();
                                                        }
                                                    }}
                                                >
                                                    {suggestion.type === 'tutorial' && (
                                                        <BookOpen className="w-3 h-3 mr-2" />
                                                    )}
                                                    {suggestion.type === 'contact' && (
                                                        <MessageCircle className="w-3 h-3 mr-2" />
                                                    )}
                                                    {suggestion.type === 'help' && (
                                                        <HelpCircle className="w-3 h-3 mr-2" />
                                                    )}
                                                    {suggestion.title}
                                                </Button>
                                            ))}
                                        </div>
                                        <Separator className="my-3" />
                                    </div>
                                )}

                                {/* Workflow Shortcuts */}
                                {shortcuts.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Zap className="w-4 h-4 text-primary" />
                                            Quick Actions
                                        </div>
                                        <div className="space-y-2">
                                            {shortcuts.slice(0, 3).map((shortcut) => (
                                                <motion.div
                                                    key={shortcut.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        window.location.href = shortcut.action.href;
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{shortcut.title}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {shortcut.description}
                                                            </p>
                                                            <div className="flex items-center gap-1 mt-2">
                                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    Saves {shortcut.estimatedTimeSaved}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        {shortcuts.length > 3 && (
                                            <Button variant="ghost" size="sm" className="w-full text-xs">
                                                View {shortcuts.length - 3} more shortcuts
                                            </Button>
                                        )}
                                        <Separator className="my-3" />
                                    </div>
                                )}

                                {/* Other Optimizations */}
                                {optimizations.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            Optimization Tips
                                        </div>
                                        <div className="space-y-2">
                                            {optimizations.slice(0, 2).map((opt, index) => (
                                                <div
                                                    key={index}
                                                    className="p-2 rounded-lg bg-muted/50 text-xs"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <Badge
                                                            variant={
                                                                opt.impact === 'high'
                                                                    ? 'default'
                                                                    : opt.impact === 'medium'
                                                                        ? 'secondary'
                                                                        : 'outline'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {opt.impact}
                                                        </Badge>
                                                        <div className="flex-1">
                                                            <p className="font-medium">{opt.title}</p>
                                                            <p className="text-muted-foreground mt-1">
                                                                {opt.description}
                                                            </p>
                                                            {opt.action.href && (
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="h-auto p-0 mt-1 text-xs"
                                                                    onClick={() => {
                                                                        if (opt.action.href) {
                                                                            window.location.href = opt.action.href;
                                                                        } else if (opt.action.onClick) {
                                                                            opt.action.onClick();
                                                                        }
                                                                    }}
                                                                >
                                                                    {opt.action.label}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}
