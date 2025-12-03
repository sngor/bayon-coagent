'use client';

/**
 * Quick Actions Menu Component
 * 
 * Mobile-optimized menu for quick access to common agent workflows:
 * - Displays prioritized actions based on usage
 * - Supports customization and pinning
 * - Integrates with offline queue
 * - Provides visual feedback for action execution
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Camera,
    PenTool,
    Mic,
    Share2,
    TrendingUp,
    Calculator,
    Calendar,
    Search,
    Users,
    FolderOpen,
    Pin,
    PinOff,
    Plus,
    Settings,
    Zap,
    WifiOff,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/common';
import { toast } from '@/hooks/use-toast';
import {
    quickActionsRegistry,
    type QuickActionDefinition,
} from '@/lib/mobile/quick-actions-registry';
import { quickActionsExecutor } from '@/lib/mobile/quick-actions-executor';
import { offlineQueue } from '@/lib/mobile/offline-queue';

// Icon mapping
const iconMap = {
    Camera,
    PenTool,
    Mic,
    Share2,
    TrendingUp,
    Calculator,
    Calendar,
    Search,
    Users,
    FolderOpen,
    Zap,
};

interface QuickActionsMenuProps {
    userId?: string;
    maxVisible?: number;
    variant?: 'grid' | 'list';
    showCustomize?: boolean;
}

export function QuickActionsMenu({
    userId,
    maxVisible = 8,
    variant = 'grid',
    showCustomize = true,
}: QuickActionsMenuProps) {
    const router = useRouter();
    const [actions, setActions] = useState<QuickActionDefinition[]>([]);
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    const [executingAction, setExecutingAction] = useState<string | null>(null);

    // Initialize registry and load actions
    useEffect(() => {
        if (userId) {
            quickActionsRegistry.initialize(userId);
        }

        loadActions();

        // Set up event listeners
        const handleConfigUpdated = () => {
            loadActions();
        };

        const handleOnline = () => {
            setIsOnline(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        const handleQueueUpdated = () => {
            setPendingCount(offlineQueue.getPendingCount());
        };

        const handleNavigate = (e: Event) => {
            const customEvent = e as CustomEvent;
            router.push(customEvent.detail.route);
        };

        window.addEventListener('quick-actions:config-updated', handleConfigUpdated);
        window.addEventListener('offline-queue:online', handleOnline);
        window.addEventListener('offline-queue:offline', handleOffline);
        window.addEventListener('offline-queue:updated', handleQueueUpdated);
        window.addEventListener('quick-actions:navigate', handleNavigate);

        // Initial state
        setIsOnline(navigator.onLine);
        setPendingCount(offlineQueue.getPendingCount());

        return () => {
            window.removeEventListener('quick-actions:config-updated', handleConfigUpdated);
            window.removeEventListener('offline-queue:online', handleOnline);
            window.removeEventListener('offline-queue:offline', handleOffline);
            window.removeEventListener('offline-queue:updated', handleQueueUpdated);
            window.removeEventListener('quick-actions:navigate', handleNavigate);
        };
    }, [userId, router]);

    const loadActions = () => {
        const prioritized = quickActionsRegistry.getPrioritizedActions(maxVisible);
        setActions(prioritized);
    };

    const handleActionClick = async (action: QuickActionDefinition) => {
        // Check if action can be executed
        const { canExecute, reason } = quickActionsExecutor.canExecuteAction(action.id);

        if (!canExecute) {
            toast({
                title: 'Cannot execute action',
                description: reason,
                variant: 'destructive',
            });
            return;
        }

        setExecutingAction(action.id);

        try {
            const result = await quickActionsExecutor.executeAction(action.id);

            if (result.success) {
                toast({
                    title: action.label,
                    description: result.message || 'Action completed',
                });
            } else {
                toast({
                    title: 'Action failed',
                    description: result.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to execute action',
                variant: 'destructive',
            });
        } finally {
            setExecutingAction(null);
        }
    };

    const handleTogglePin = (actionId: string, event: React.MouseEvent) => {
        event.stopPropagation();

        const wasPinned = quickActionsRegistry.isPinned(actionId);
        quickActionsRegistry.togglePin(actionId);

        toast({
            title: wasPinned ? 'Unpinned' : 'Pinned',
            description: wasPinned ? 'Action removed from quick menu' : 'Action added to quick menu',
        });
    };

    if (variant === 'list') {
        return (
            <div className="space-y-2">
                {actions.map((action) => {
                    const Icon = iconMap[action.icon as keyof typeof iconMap] || Zap;
                    const isPinned = quickActionsRegistry.isPinned(action.id);
                    const isExecuting = executingAction === action.id;

                    return (
                        <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            disabled={isExecuting}
                            className={cn(
                                'w-full flex items-center gap-3 p-3 rounded-lg',
                                'bg-card border hover:bg-accent hover:border-primary/50',
                                'transition-all duration-200',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                isExecuting && 'animate-pulse'
                            )}
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="font-medium text-sm">{action.label}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {action.description}
                                </div>
                            </div>
                            {action.requiresOnline && !isOnline && (
                                <WifiOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            {action.badge && (
                                <Badge variant="secondary" className="flex-shrink-0">
                                    {action.badge}
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 flex-shrink-0"
                                onClick={(e) => handleTogglePin(action.id, e)}
                            >
                                {isPinned ? (
                                    <PinOff className="w-4 h-4" />
                                ) : (
                                    <Pin className="w-4 h-4" />
                                )}
                            </Button>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Offline indicator */}
            {!isOnline && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <WifiOff className="w-4 h-4 text-yellow-600" />
                    <div className="flex-1 text-sm text-yellow-600">
                        You're offline. {pendingCount > 0 && `${pendingCount} actions queued.`}
                    </div>
                </div>
            )}

            {/* Actions grid */}
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => {
                    const Icon = iconMap[action.icon as keyof typeof iconMap] || Zap;
                    const isPinned = quickActionsRegistry.isPinned(action.id);
                    const isExecuting = executingAction === action.id;

                    return (
                        <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            disabled={isExecuting}
                            className={cn(
                                'relative group p-4 rounded-xl',
                                'bg-card border hover:shadow-lg',
                                'transition-all duration-300 hover:scale-[1.02]',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                isExecuting && 'animate-pulse'
                            )}
                        >
                            {/* Pin indicator */}
                            {isPinned && (
                                <div className="absolute top-2 right-2">
                                    <Pin className="w-3 h-3 text-primary fill-current" />
                                </div>
                            )}

                            {/* Icon */}
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                                <Icon className="w-6 h-6 text-primary" />
                            </div>

                            {/* Label */}
                            <div className="text-sm font-medium text-left mb-1">
                                {action.label}
                            </div>

                            {/* Description */}
                            <div className="text-xs text-muted-foreground text-left line-clamp-2">
                                {action.description}
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2 mt-2">
                                {action.requiresOnline && !isOnline && (
                                    <Badge variant="outline" className="text-xs">
                                        <WifiOff className="w-3 h-3 mr-1" />
                                        Offline
                                    </Badge>
                                )}
                                {action.badge && (
                                    <Badge variant="secondary" className="text-xs">
                                        {action.badge}
                                    </Badge>
                                )}
                            </div>
                        </button>
                    );
                })}

                {/* Customize button */}
                {showCustomize && (
                    <Sheet open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                        <SheetTrigger asChild>
                            <button
                                className={cn(
                                    'p-4 rounded-xl',
                                    'border-2 border-dashed border-muted hover:border-primary/50',
                                    'bg-muted/30 hover:bg-muted/50',
                                    'transition-all duration-300',
                                    'flex flex-col items-center justify-center',
                                    'min-h-[140px]'
                                )}
                            >
                                <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                                <div className="text-sm font-medium text-muted-foreground">
                                    Customize
                                </div>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh]">
                            <SheetHeader>
                                <SheetTitle>Customize Quick Actions</SheetTitle>
                                <SheetDescription>
                                    Pin your most-used actions for quick access
                                </SheetDescription>
                            </SheetHeader>
                            <CustomizeQuickActions onClose={() => setIsCustomizeOpen(false)} />
                        </SheetContent>
                    </Sheet>
                )}
            </div>
        </div>
    );
}

// Customize panel component
function CustomizeQuickActions({ onClose }: { onClose: () => void }) {
    const [allActions, setAllActions] = useState<QuickActionDefinition[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setAllActions(quickActionsRegistry.getAllActions());
    }, []);

    const filteredActions = allActions.filter(
        (action) =>
            searchQuery === '' ||
            action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            action.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedActions = filteredActions.reduce((acc, action) => {
        if (!acc[action.category]) {
            acc[action.category] = [];
        }
        acc[action.category].push(action);
        return acc;
    }, {} as Record<string, QuickActionDefinition[]>);

    const handleTogglePin = (actionId: string) => {
        const wasPinned = quickActionsRegistry.isPinned(actionId);
        quickActionsRegistry.togglePin(actionId);

        toast({
            title: wasPinned ? 'Unpinned' : 'Pinned',
            description: wasPinned ? 'Action removed from quick menu' : 'Action added to quick menu',
        });

        // Refresh the list
        setAllActions(quickActionsRegistry.getAllActions());
    };

    const categoryLabels: Record<string, string> = {
        capture: 'Capture',
        content: 'Content',
        market: 'Market',
        client: 'Client',
        tools: 'Tools',
    };

    return (
        <div className="flex flex-col h-full pt-6">
            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search actions..."
                    className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Actions list */}
            <div className="flex-1 overflow-y-auto space-y-4">
                {Object.entries(groupedActions).map(([category, actions]) => (
                    <div key={category}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                            {categoryLabels[category] || category}
                        </h4>
                        <div className="space-y-1">
                            {actions.map((action) => {
                                const Icon = iconMap[action.icon as keyof typeof iconMap] || Zap;
                                const isPinned = quickActionsRegistry.isPinned(action.id);

                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => handleTogglePin(action.id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm">{action.label}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {action.description}
                                            </div>
                                        </div>
                                        {isPinned && (
                                            <Pin className="w-4 h-4 text-primary fill-current flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Close button */}
            <div className="pt-4 border-t">
                <Button onClick={onClose} className="w-full">
                    Done
                </Button>
            </div>
        </div>
    );
}
