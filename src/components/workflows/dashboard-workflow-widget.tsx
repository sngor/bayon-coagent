'use client';

/**
 * Dashboard Workflow Widget Component
 * 
 * Displays workflow presets and active workflow instances on the dashboard.
 * Allows users to browse, search, filter, start, resume, and restart workflows.
 * 
 * Features:
 * - Grid/list view toggle
 * - Category filtering
 * - Search with debouncing
 * - Workflow preset cards with metadata
 * - Active workflow instances with progress
 * - Resume/restart buttons
 * - Stale workflow handling
 * - Workflow detail modal
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablet } from '@/hooks/use-tablet';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Rocket,
    TrendingUp,
    Home,
    Target,
    Search,
    Grid3x3,
    List,
    Clock,
    CheckCircle2,
    Play,
    RotateCcw,
    Archive,
    Sparkles,
    ArrowRight,
    Calendar,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowPreset, WorkflowInstance, WorkflowCategory, WorkflowStatus } from '@/types/workflows';
import { calculateProgress, calculateRemainingTime } from '@/lib/workflow-state-manager';
import { ALL_WORKFLOW_PRESETS, getPresetsByCategory, searchPresets } from '@/lib/workflow-presets';

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

interface DashboardWorkflowWidgetProps {
    /** User ID for fetching workflow instances */
    userId: string;
    /** Active workflow instances */
    activeInstances: WorkflowInstance[];
    /** Callback when user starts a workflow */
    onStartWorkflow: (presetId: string) => void;
    /** Callback when user resumes a workflow */
    onResumeWorkflow: (instanceId: string) => void;
    /** Callback when user views workflow details */
    onViewDetails: (presetId: string) => void;
    /** Callback when user restarts a workflow */
    onRestartWorkflow?: (instanceId: string) => void;
    /** Callback when user archives a workflow */
    onArchiveWorkflow?: (instanceId: string) => void;
}

export function DashboardWorkflowWidget({
    userId,
    activeInstances,
    onStartWorkflow,
    onResumeWorkflow,
    onViewDetails,
    onRestartWorkflow,
    onArchiveWorkflow,
}: DashboardWorkflowWidgetProps) {
    // Responsive hooks
    const isMobile = useIsMobile();
    const { isTablet } = useTablet();

    // View mode state - force list view on mobile
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const effectiveViewMode = isMobile ? 'list' : viewMode;

    // Filter and search state
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter workflow presets
    const filteredPresets = useMemo(() => {
        let presets = ALL_WORKFLOW_PRESETS;

        // Filter by category
        if (selectedCategory !== 'all') {
            presets = getPresetsByCategory(selectedCategory as WorkflowCategory);
        }

        // Filter by search query
        if (debouncedSearchQuery.trim()) {
            presets = searchPresets(debouncedSearchQuery);
        }

        return presets;
    }, [selectedCategory, debouncedSearchQuery]);

    // Separate active and stale workflows
    const { activeWorkflows, staleWorkflows, completedWorkflows } = useMemo(() => {
        const active: WorkflowInstance[] = [];
        const stale: WorkflowInstance[] = [];
        const completed: WorkflowInstance[] = [];

        activeInstances.forEach(instance => {
            if (instance.status === WorkflowStatus.COMPLETED) {
                completed.push(instance);
            } else if (instance.status === WorkflowStatus.STALE) {
                stale.push(instance);
            } else if (instance.status === WorkflowStatus.ACTIVE) {
                active.push(instance);
            }
        });

        return { activeWorkflows: active, staleWorkflows: stale, completedWorkflows: completed };
    }, [activeInstances]);

    // Get preset for an instance
    const getPresetForInstance = useCallback((instance: WorkflowInstance): WorkflowPreset | null => {
        return ALL_WORKFLOW_PRESETS.find(p => p.id === instance.presetId) || null;
    }, []);

    // Calculate days since last active
    const getDaysSinceActive = useCallback((lastActiveAt: string): number => {
        const lastActive = new Date(lastActiveAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastActive.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, []);

    return (
        <div className="space-y-6">
            {/* Header with controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2
                        className={cn(
                            "font-bold mb-1",
                            isMobile ? "text-xl" : "text-2xl"
                        )}
                        id="workflows-heading"
                    >
                        Guided Workflows
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Step-by-step processes to accomplish complex tasks
                    </p>
                </div>

                {/* Hide view toggle on mobile (always list view) */}
                {!isMobile && (
                    <div className="flex items-center gap-2" role="group" aria-label="View mode toggle">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="w-9 h-9 p-0"
                            aria-label="Grid view"
                            aria-pressed={viewMode === 'grid'}
                        >
                            <Grid3x3 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="w-9 h-9 p-0"
                            aria-label="List view"
                            aria-pressed={viewMode === 'list'}
                        >
                            <List className="w-4 h-4" aria-hidden="true" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Active Workflows Section */}
            {activeWorkflows.length > 0 && (
                <section aria-labelledby="active-workflows-heading" className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                        <h3 id="active-workflows-heading" className="font-semibold text-lg">In Progress</h3>
                        <Badge variant="secondary" aria-label={`${activeWorkflows.length} workflows in progress`}>{activeWorkflows.length}</Badge>
                    </div>

                    <div className={cn(
                        "grid gap-4",
                        effectiveViewMode === 'grid'
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            : "grid-cols-1"
                    )}>
                        {activeWorkflows.map(instance => {
                            const preset = getPresetForInstance(instance);
                            if (!preset) return null;

                            const progress = calculateProgress(instance, preset);
                            const remainingTime = calculateRemainingTime(instance, preset);
                            const Icon = ICON_MAP[preset.icon] || Rocket;

                            return (
                                <motion.div
                                    key={instance.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ y: -4, scale: 1.02 }}
                                >
                                    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-primary/20">
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                        <CardContent className="relative p-6">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-base mb-1 truncate">{preset.title}</h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center justify-between text-sm mb-2">
                                                        <span className="text-muted-foreground">Progress</span>
                                                        <motion.span
                                                            className="font-semibold"
                                                            key={progress}
                                                            initial={{ scale: 1.2, color: 'rgb(var(--primary))' }}
                                                            animate={{ scale: 1, color: 'inherit' }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            {progress}%
                                                        </motion.span>
                                                    </div>
                                                    <motion.div
                                                        initial={{ scaleX: 0 }}
                                                        animate={{ scaleX: 1 }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                        style={{ transformOrigin: 'left' }}
                                                    >
                                                        <Progress value={progress} className="h-2" />
                                                    </motion.div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{remainingTime} min left</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>{instance.completedSteps.length}/{preset.steps.length} steps</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => onResumeWorkflow(instance.id)}
                                                    className="w-full"
                                                    size="sm"
                                                    aria-label={`Resume ${preset.title} workflow, ${progress}% complete`}
                                                >
                                                    <Play className="w-4 h-4 mr-2" aria-hidden="true" />
                                                    Resume Workflow
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Completed Workflows Section */}
            {completedWorkflows.length > 0 && (
                <section aria-labelledby="completed-workflows-heading" className="space-y-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" aria-hidden="true" />
                        <h3 id="completed-workflows-heading" className="font-semibold text-lg">Completed</h3>
                        <Badge variant="secondary" aria-label={`${completedWorkflows.length} completed workflows`}>{completedWorkflows.length}</Badge>
                    </div>

                    <div className="grid gap-3 grid-cols-1">
                        {completedWorkflows.slice(0, 3).map(instance => {
                            const preset = getPresetForInstance(instance);
                            if (!preset) return null;

                            const Icon = ICON_MAP[preset.icon] || Rocket;

                            return (
                                <motion.div
                                    key={instance.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ x: 4 }}
                                >
                                    <Card className="group hover:shadow-md transition-all duration-300">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm truncate">{preset.title}</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            Completed {new Date(instance.completedAt!).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                {onRestartWorkflow && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onRestartWorkflow(instance.id)}
                                                        className="flex-shrink-0"
                                                    >
                                                        <RotateCcw className="w-3 h-3 mr-1" />
                                                        Restart
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Stale Workflows Section */}
            {staleWorkflows.length > 0 && (
                <section aria-labelledby="stale-workflows-heading" className="space-y-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" aria-hidden="true" />
                        <h3 id="stale-workflows-heading" className="font-semibold text-lg">Inactive</h3>
                        <Badge variant="secondary" aria-label={`${staleWorkflows.length} inactive workflows`}>{staleWorkflows.length}</Badge>
                    </div>

                    <div className="grid gap-3 grid-cols-1">
                        {staleWorkflows.map((instance, index) => {
                            const preset = getPresetForInstance(instance);
                            if (!preset) return null;

                            const daysSinceActive = getDaysSinceActive(instance.lastActiveAt);
                            const Icon = ICON_MAP[preset.icon] || Rocket;

                            return (
                                <motion.div
                                    key={instance.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ x: 4 }}
                                >
                                    <Card className="group hover:shadow-md transition-all duration-300 border-orange-500/20">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm truncate">{preset.title}</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            Inactive for {daysSinceActive} days
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onResumeWorkflow(instance.id)}
                                                    >
                                                        <Play className="w-3 h-3 mr-1" />
                                                        Resume
                                                    </Button>
                                                    {onArchiveWorkflow && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onArchiveWorkflow(instance.id)}
                                                        >
                                                            <Archive className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-3" role="search" aria-label="Filter workflows">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        placeholder="Search workflows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        aria-label="Search workflows by name or description"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by category">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.entries(CATEGORY_NAMES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Available Workflows */}
            <section aria-labelledby="available-workflows-heading" className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 id="available-workflows-heading" className="font-semibold text-lg">Available Workflows</h3>
                    <Badge variant="outline" aria-label={`${filteredPresets.length} workflows available`}>{filteredPresets.length}</Badge>
                </div>

                {filteredPresets.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-12 text-center">
                            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                            <h4 className="font-semibold mb-2">No workflows found</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Try adjusting your search or filters
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className={cn(
                        "grid gap-4",
                        effectiveViewMode === 'grid'
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            : "grid-cols-1"
                    )}>
                        {filteredPresets.map(preset => {
                            const Icon = ICON_MAP[preset.icon] || Rocket;
                            const hasActiveInstance = activeWorkflows.some(i => i.presetId === preset.id);

                            return (
                                <motion.div
                                    key={preset.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{
                                        duration: 0.3,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20
                                    }}
                                >
                                    <Card
                                        className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
                                        onClick={() => onViewDetails(preset.id)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View details for ${preset.title} workflow`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onViewDetails(preset.id);
                                            }
                                        }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent"
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                        <CardContent className="relative p-6 h-full flex flex-col">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex flex-col gap-2 items-end">
                                                    {preset.isRecommended && (
                                                        <Badge variant="default" className="text-xs">
                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                            Recommended
                                                        </Badge>
                                                    )}
                                                    {hasActiveInstance && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            In Progress
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <h4 className="font-semibold text-base mb-2">{preset.title}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                    {preset.description}
                                                </p>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <Badge variant="outline" className="text-xs">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {preset.estimatedMinutes} min
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {preset.steps.length} steps
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {CATEGORY_NAMES[preset.category]}
                                                    </Badge>
                                                </div>

                                                {/* Hover preview with outcomes */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div className="text-xs font-semibold mb-2 text-muted-foreground">Key Outcomes:</div>
                                                    <ul className="space-y-1">
                                                        {preset.outcomes.slice(0, 3).map((outcome, idx) => (
                                                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                                                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                                                                <span className="line-clamp-1">{outcome}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onStartWorkflow(preset.id);
                                                }}
                                                className="w-full mt-4"
                                                size="sm"
                                            >
                                                Start Workflow
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
