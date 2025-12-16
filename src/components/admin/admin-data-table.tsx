'use client';

import { ReactNode, useMemo, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search } from 'lucide-react';
import { AdminLoading } from './admin-loading';

export interface TableColumn<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => ReactNode;
    sortable?: boolean;
    className?: string;
}

export interface TableAction<T> {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive';
    disabled?: (item: T) => boolean;
}

interface AdminDataTableProps<T extends Record<string, any>> {
    data: T[];
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    loading?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyState?: ReactNode;
    onRowClick?: (item: T) => void;
    className?: string;
}

export function AdminDataTable<T extends Record<string, any>>({
    data,
    columns,
    actions = [],
    loading = false,
    searchable = false,
    searchPlaceholder = "Search...",
    emptyState,
    onRowClick,
    className
}: AdminDataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        if (!searchable || !searchTerm.trim()) return data;

        const lowercaseSearch = searchTerm.toLowerCase();
        return data.filter(item =>
            Object.values(item).some(value =>
                value && String(value).toLowerCase().includes(lowercaseSearch)
            )
        );
    }, [data, searchTerm, searchable]);

    if (loading) {
        return <AdminLoading type="table" count={5} />;
    }

    if (data.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {searchable && (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={String(column.key)}
                                    className={column.className}
                                >
                                    {column.header}
                                </TableHead>
                            ))}
                            {actions.length > 0 && (
                                <TableHead className="text-right">Actions</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((item, index) => (
                            <TableRow
                                key={item.id || index}
                                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((column) => (
                                    <TableCell
                                        key={String(column.key)}
                                        className={column.className}
                                    >
                                        {column.render
                                            ? column.render(item)
                                            : String(item[column.key] || '')
                                        }
                                    </TableCell>
                                ))}
                                {actions.length > 0 && (
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                {actions.map((action, actionIndex) => (
                                                    <div key={actionIndex}>
                                                        {actionIndex > 0 && action.variant === 'destructive' && (
                                                            <DropdownMenuSeparator />
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                action.onClick(item);
                                                            }}
                                                            disabled={action.disabled?.(item)}
                                                            className={action.variant === 'destructive' ? 'text-red-600' : ''}
                                                        >
                                                            {action.icon && (
                                                                <action.icon className="h-4 w-4 mr-2" />
                                                            )}
                                                            {action.label}
                                                        </DropdownMenuItem>
                                                    </div>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {searchable && filteredData.length === 0 && searchTerm && (
                <div className="text-center py-8 text-muted-foreground">
                    No results found for "{searchTerm}"
                </div>
            )}
        </div>
    );
}