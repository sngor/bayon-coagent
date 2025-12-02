'use client';

/**
 * Export Buttons Component
 * 
 * Provides UI for exporting session data as PDF or CSV
 * Validates Requirements: 6.4
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { exportSessionPDF, exportVisitorCSV } from '@/app/(app)/open-house/actions';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonsProps {
    sessionId: string;
    visitorCount: number;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showLabel?: boolean;
}

export function ExportButtons({
    sessionId,
    visitorCount,
    variant = 'outline',
    size = 'default',
    showLabel = true,
}: ExportButtonsProps) {
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const { toast } = useToast();

    const handleExportPDF = async () => {
        setIsExportingPDF(true);

        try {
            const result = await exportSessionPDF(sessionId);

            if (result.success && result.url) {
                // Download the file
                const link = document.createElement('a');
                link.href = result.url;
                link.download = `open-house-report-${sessionId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast({
                    title: 'PDF exported successfully',
                    description: 'Your session report has been downloaded.',
                });
            } else {
                toast({
                    title: 'Export failed',
                    description: result.error || 'Failed to export PDF report.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast({
                title: 'Export failed',
                description: 'An unexpected error occurred while exporting the PDF.',
                variant: 'destructive',
            });
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleExportCSV = async () => {
        setIsExportingCSV(true);

        try {
            const result = await exportVisitorCSV(sessionId);

            if (result.success && result.url) {
                // Download the file
                const link = document.createElement('a');
                link.href = result.url;
                link.download = `visitors-${sessionId}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast({
                    title: 'CSV exported successfully',
                    description: 'Your visitor data has been downloaded.',
                });
            } else {
                toast({
                    title: 'Export failed',
                    description: result.error || 'Failed to export visitor CSV.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error exporting CSV:', error);
            toast({
                title: 'Export failed',
                description: 'An unexpected error occurred while exporting the CSV.',
                variant: 'destructive',
            });
        } finally {
            setIsExportingCSV(false);
        }
    };

    const isExporting = isExportingPDF || isExportingCSV;

    // If no visitors, disable CSV export
    const canExportCSV = visitorCount > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {showLabel && size !== 'icon' && (
                        <span className="ml-2">
                            {isExporting ? 'Exporting...' : 'Export'}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                >
                    {isExportingPDF ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileText className="mr-2 h-4 w-4" />
                    )}
                    Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleExportCSV}
                    disabled={isExportingCSV || !canExportCSV}
                >
                    {isExportingCSV ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Table className="mr-2 h-4 w-4" />
                    )}
                    Export as CSV
                    {!canExportCSV && (
                        <span className="ml-2 text-xs text-muted-foreground">
                            (No visitors)
                        </span>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
