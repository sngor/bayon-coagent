import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils/common';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showFirstLast?: boolean;
    maxVisiblePages?: number;
    className?: string;
    startIndex?: number;
    endIndex?: number;
    totalItems?: number;
}

/**
 * Pagination component for navigating through pages
 * Provides fallback for virtual scrolling
 */
export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    showFirstLast = true,
    maxVisiblePages = 5,
    className,
    startIndex,
    endIndex,
    totalItems,
}: PaginationProps) {
    // Calculate visible page numbers
    const getVisiblePages = () => {
        const pages: (number | string)[] = [];
        const halfVisible = Math.floor(maxVisiblePages / 2);

        let startPage = Math.max(1, currentPage - halfVisible);
        let endPage = Math.min(totalPages, currentPage + halfVisible);

        // Adjust if we're near the start or end
        if (currentPage <= halfVisible) {
            endPage = Math.min(totalPages, maxVisiblePages);
        }
        if (currentPage > totalPages - halfVisible) {
            startPage = Math.max(1, totalPages - maxVisiblePages + 1);
        }

        // Add first page and ellipsis
        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) {
                pages.push('...');
            }
        }

        // Add visible pages
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        // Add ellipsis and last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
            {/* Info text */}
            {startIndex !== undefined && endIndex !== undefined && totalItems !== undefined && (
                <div className="text-sm text-muted-foreground">
                    Showing {startIndex} to {endIndex} of {totalItems} items
                </div>
            )}

            {/* Pagination controls */}
            <div className="flex items-center gap-1">
                {/* First page button */}
                {showFirstLast && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        aria-label="First page"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                )}

                {/* Previous page button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                {visiblePages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                                ...
                            </span>
                        );
                    }

                    return (
                        <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => onPageChange(page as number)}
                            aria-label={`Page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                        >
                            {page}
                        </Button>
                    );
                })}

                {/* Next page button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last page button */}
                {showFirstLast && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        aria-label="Last page"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
