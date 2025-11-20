'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import { LoadingDots } from '@/components/ui/loading-dots';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface DataTableColumn<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    className?: string;
    mobileHidden?: boolean;
}

export interface DataTableAction<T> {
    label: string;
    icon?: React.ReactNode;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive';
}

interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    actions?: DataTableAction<T>[];
    searchable?: boolean;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    emptyState?: React.ReactNode;
    loading?: boolean;
    className?: string;
}

/**
 * Standardized data table with sorting, search, and actions
 * Automatically responsive with mobile card view
 */
export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    actions,
    searchable = false,
    searchPlaceholder = 'Search...',
    onSearch,
    emptyState,
    loading = false,
    className,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const isMobile = useIsMobile();

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        onSearch?.(query);
    };

    const sortedData = sortKey
        ? [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            const modifier = sortDirection === 'asc' ? 1 : -1;
            return aVal > bVal ? modifier : -modifier;
        })
        : data;

    const filteredData = searchQuery
        ? sortedData.filter((item) =>
            Object.values(item).some((val) =>
                String(val).toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : sortedData;

    if (isMobile) {
        return (
            <div className={cn('space-y-4', className)}>
                {searchable && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                )}
                {filteredData.length === 0 ? (
                    emptyState || <div className="text-center py-8 text-muted-foreground">No data</div>
                ) : (
                    filteredData.map((item, idx) => (
                        <Card key={idx} className="p-4 space-y-3">
                            {columns
                                .filter((col) => !col.mobileHidden)
                                .map((col) => (
                                    <div key={col.key} className="flex justify-between items-start">
                                        <span className="text-sm font-medium text-muted-foreground">{col.label}</span>
                                        <span className="text-sm text-right">
                                            {col.render ? col.render(item) : item[col.key]}
                                        </span>
                                    </div>
                                ))}
                            {actions && actions.length > 0 && (
                                <div className="flex gap-2 pt-2 border-t">
                                    {actions.map((action, actionIdx) => (
                                        <Button
                                            key={actionIdx}
                                            variant={action.variant || 'outline'}
                                            size="sm"
                                            onClick={() => action.onClick(item)}
                                            className="flex-1"
                                        >
                                            {action.icon}
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {searchable && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9 max-w-sm"
                    />
                </div>
            )}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className={col.className}>
                                    {col.sortable ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort(col.key)}
                                            className="-ml-3 h-8"
                                        >
                                            {col.label}
                                            {sortKey === col.key ? (
                                                sortDirection === 'asc' ? (
                                                    <ArrowUp className="ml-2 h-4 w-4" />
                                                ) : (
                                                    <ArrowDown className="ml-2 h-4 w-4" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                                            )}
                                        </Button>
                                    ) : (
                                        col.label
                                    )}
                                </TableHead>
                            ))}
                            {actions && actions.length > 0 && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <LoadingDots />
                                        <span>Loading...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                                    {emptyState || <span className="text-muted-foreground">No data</span>}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item, idx) => (
                                <TableRow key={idx}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key} className={col.className}>
                                            {col.render ? col.render(item) : item[col.key]}
                                        </TableCell>
                                    ))}
                                    {actions && actions.length > 0 && (
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {actions.map((action, actionIdx) => (
                                                        <DropdownMenuItem
                                                            key={actionIdx}
                                                            onClick={() => action.onClick(item)}
                                                            className={action.variant === 'destructive' ? 'text-destructive' : ''}
                                                        >
                                                            {action.icon}
                                                            {action.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
