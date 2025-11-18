import * as React from 'react';
import { X, Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

export interface FilterGroup {
    id: string;
    label: string;
    options: FilterOption[];
}

export interface FilterControlsProps {
    filterGroups: FilterGroup[];
    selectedFilters: Record<string, string[]>;
    onFilterChange: (groupId: string, values: string[]) => void;
    onClearAll?: () => void;
    className?: string;
}

/**
 * A reusable filter controls component for lists with multiple categories.
 * Features:
 * - Multiple filter groups with dropdown menus
 * - Clear filter indicators with badges
 * - Active filter count display
 * - Clear all filters functionality
 * - Accessible keyboard navigation
 */
export function FilterControls({
    filterGroups,
    selectedFilters,
    onFilterChange,
    onClearAll,
    className,
}: FilterControlsProps) {
    // Calculate total active filters
    const activeFilterCount = React.useMemo(() => {
        return Object.values(selectedFilters).reduce(
            (sum, filters) => sum + filters.length,
            0
        );
    }, [selectedFilters]);

    // Handle filter toggle
    const handleFilterToggle = (groupId: string, value: string) => {
        const currentFilters = selectedFilters[groupId] || [];
        const newFilters = currentFilters.includes(value)
            ? currentFilters.filter((v) => v !== value)
            : [...currentFilters, value];
        onFilterChange(groupId, newFilters);
    };

    // Handle clear specific filter group
    const handleClearGroup = (groupId: string) => {
        onFilterChange(groupId, []);
    };

    // Handle clear all filters
    const handleClearAll = () => {
        if (onClearAll) {
            onClearAll();
        } else {
            // Clear all groups individually
            filterGroups.forEach((group) => {
                onFilterChange(group.id, []);
            });
        }
    };

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {/* Filter Dropdowns */}
            {filterGroups.map((group) => {
                const activeCount = selectedFilters[group.id]?.length || 0;
                const hasActiveFilters = activeCount > 0;

                return (
                    <DropdownMenu key={group.id}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={hasActiveFilters ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    'gap-2',
                                    hasActiveFilters && 'pr-2'
                                )}
                            >
                                <Filter className="h-4 w-4" />
                                {group.label}
                                {hasActiveFilters && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                    >
                                        {activeCount}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                {group.label}
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-1 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClearGroup(group.id);
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {group.options.map((option) => {
                                const isSelected = selectedFilters[group.id]?.includes(
                                    option.value
                                );
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={option.value}
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                            handleFilterToggle(group.id, option.value)
                                        }
                                    >
                                        <span className="flex-1">{option.label}</span>
                                        {option.count !== undefined && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({option.count})
                                            </span>
                                        )}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            })}

            {/* Active Filter Badges */}
            {activeFilterCount > 0 && (
                <>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex flex-wrap items-center gap-2">
                        {filterGroups.map((group) => {
                            const activeFilters = selectedFilters[group.id] || [];
                            if (activeFilters.length === 0) return null;

                            return activeFilters.map((value) => {
                                const option = group.options.find((o) => o.value === value);
                                if (!option) return null;

                                return (
                                    <Badge
                                        key={`${group.id}-${value}`}
                                        variant="secondary"
                                        className="gap-1 pr-1"
                                    >
                                        {option.label}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => handleFilterToggle(group.id, value)}
                                            aria-label={`Remove ${option.label} filter`}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                );
                            });
                        })}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={handleClearAll}
                        >
                            Clear all
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Hook to manage filter state
 */
export function useFilters(initialFilters: Record<string, string[]> = {}) {
    const [selectedFilters, setSelectedFilters] =
        React.useState<Record<string, string[]>>(initialFilters);

    const handleFilterChange = React.useCallback(
        (groupId: string, values: string[]) => {
            setSelectedFilters((prev) => ({
                ...prev,
                [groupId]: values,
            }));
        },
        []
    );

    const handleClearAll = React.useCallback(() => {
        setSelectedFilters({});
    }, []);

    const hasActiveFilters = React.useMemo(() => {
        return Object.values(selectedFilters).some(
            (filters) => filters.length > 0
        );
    }, [selectedFilters]);

    return {
        selectedFilters,
        handleFilterChange,
        handleClearAll,
        hasActiveFilters,
    };
}
