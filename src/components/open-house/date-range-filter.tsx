'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, Filter, X } from 'lucide-react';

interface DateRangeFilterProps {
    filters: {
        startDate?: string;
        endDate?: string;
        status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
        propertyId?: string;
    };
    onFilterChange: (filters: DateRangeFilterProps['filters']) => void;
}

export function DateRangeFilter({ filters, onFilterChange }: DateRangeFilterProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);

    function handleApplyFilters() {
        onFilterChange(localFilters);
        setIsExpanded(false);
    }

    function handleClearFilters() {
        const emptyFilters = {};
        setLocalFilters(emptyFilters);
        onFilterChange(emptyFilters);
        setIsExpanded(false);
    }

    function handleQuickFilter(days: number) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

        const newFilters = { ...localFilters, startDate, endDate };
        setLocalFilters(newFilters);
        onFilterChange(newFilters);
        setIsExpanded(false);
    }

    const hasActiveFilters = Object.keys(filters).length > 0;

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Filter Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filters</span>
                            {hasActiveFilters && (
                                <span className="text-xs text-muted-foreground">
                                    ({Object.keys(filters).length} active)
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? 'Hide' : 'Show'} Filters
                            </Button>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickFilter(7)}
                        >
                            Last 7 Days
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickFilter(30)}
                        >
                            Last 30 Days
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickFilter(90)}
                        >
                            Last 90 Days
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickFilter(365)}
                        >
                            Last Year
                        </Button>
                    </div>

                    {/* Expanded Filters */}
                    {isExpanded && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Start Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={localFilters.startDate || ''}
                                            onChange={(e) =>
                                                setLocalFilters({
                                                    ...localFilters,
                                                    startDate: e.target.value,
                                                })
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={localFilters.endDate || ''}
                                            onChange={(e) =>
                                                setLocalFilters({
                                                    ...localFilters,
                                                    endDate: e.target.value,
                                                })
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Session Status</Label>
                                <Select
                                    value={localFilters.status || 'all'}
                                    onValueChange={(value) =>
                                        setLocalFilters({
                                            ...localFilters,
                                            status: value === 'all' ? undefined : value as any,
                                        })
                                    }
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Apply Button */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleApplyFilters}>
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
