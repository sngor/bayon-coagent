'use client';

/**
 * Export Dialog Component
 * 
 * Provides a detailed export interface with progress indicators and options
 * Validates Requirements: 6.4
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Table, CheckCircle2, AlertCircle } from 'lucide-react';
import { exportSessionPDF, exportVisitorCSV } from '@/app/(app)/open-house/actions';
import { useToast } from '@/hooks/use-toast';
import type { CsvExportFields } from '@/lib/open-house/csv-export';

interface ExportDialogProps {
    sessionId: string;
    visitorCount: number;
    trigger?: React.ReactNode;
}

type ExportFormat = 'pdf' | 'csv';
type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export function ExportDialog({
    sessionId,
    visitorCount,
    trigger,
}: ExportDialogProps) {
    const [open, setOpen] = useState(false);
    const [format, setFormat] = useState<ExportFormat>('pdf');
    const [status, setStatus] = useState<ExportStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { toast } = useToast();

    // CSV field selection
    const [csvFields, setCsvFields] = useState<Partial<CsvExportFields>>({
        name: true,
        email: true,
        phone: true,
        interestLevel: true,
        checkInTime: true,
        source: true,
        notes: true,
        followUpGenerated: true,
        followUpSent: true,
    });

    const handleExport = async () => {
        setStatus('exporting');
        setProgress(0);
        setErrorMessage(null);
        setDownloadUrl(null);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 100);

            let result;

            if (format === 'pdf') {
                result = await exportSessionPDF(sessionId);
            } else {
                result = await exportVisitorCSV(sessionId, csvFields);
            }

            clearInterval(progressInterval);
            setProgress(100);

            if (result.success && result.url) {
                setStatus('success');
                setDownloadUrl(result.url);

                toast({
                    title: 'Export successful',
                    description: `Your ${format.toUpperCase()} file is ready for download.`,
                });
            } else {
                setStatus('error');
                setErrorMessage(result.error || 'Export failed');

                toast({
                    title: 'Export failed',
                    description: result.error || 'An error occurred during export.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error exporting:', error);
            setStatus('error');
            setErrorMessage('An unexpected error occurred');

            toast({
                title: 'Export failed',
                description: 'An unexpected error occurred during export.',
                variant: 'destructive',
            });
        }
    };

    const handleDownload = () => {
        if (downloadUrl) {
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `open-house-${format}-${sessionId}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Close dialog after download
            setTimeout(() => {
                setOpen(false);
                resetDialog();
            }, 500);
        }
    };

    const resetDialog = () => {
        setStatus('idle');
        setProgress(0);
        setDownloadUrl(null);
        setErrorMessage(null);
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset when closing
            setTimeout(resetDialog, 300);
        }
    };

    const canExportCSV = visitorCount > 0;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Export Session Data</DialogTitle>
                    <DialogDescription>
                        Choose a format and customize your export options.
                    </DialogDescription>
                </DialogHeader>

                {status === 'idle' && (
                    <div className="space-y-6 py-4">
                        {/* Format Selection */}
                        <div className="space-y-3">
                            <Label>Export Format</Label>
                            <RadioGroup
                                value={format}
                                onValueChange={(value) => setFormat(value as ExportFormat)}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="pdf" id="pdf" />
                                    <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                                        <FileText className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium">PDF Report</div>
                                            <div className="text-sm text-muted-foreground">
                                                Complete session report with statistics
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="csv"
                                        id="csv"
                                        disabled={!canExportCSV}
                                    />
                                    <Label
                                        htmlFor="csv"
                                        className={`flex items-center gap-2 ${canExportCSV ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    >
                                        <Table className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium">CSV Data</div>
                                            <div className="text-sm text-muted-foreground">
                                                {canExportCSV
                                                    ? 'Visitor data for spreadsheets'
                                                    : 'No visitors to export'}
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* CSV Field Selection */}
                        {format === 'csv' && canExportCSV && (
                            <div className="space-y-3">
                                <Label>Include Fields</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'name', label: 'Name' },
                                        { key: 'email', label: 'Email' },
                                        { key: 'phone', label: 'Phone' },
                                        { key: 'interestLevel', label: 'Interest Level' },
                                        { key: 'checkInTime', label: 'Check-in Time' },
                                        { key: 'source', label: 'Source' },
                                        { key: 'notes', label: 'Notes' },
                                        { key: 'followUpGenerated', label: 'Follow-up Generated' },
                                        { key: 'followUpSent', label: 'Follow-up Sent' },
                                    ].map((field) => (
                                        <div key={field.key} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={field.key}
                                                checked={csvFields[field.key as keyof CsvExportFields]}
                                                onCheckedChange={(checked) => {
                                                    setCsvFields({
                                                        ...csvFields,
                                                        [field.key]: checked === true,
                                                    });
                                                }}
                                            />
                                            <Label
                                                htmlFor={field.key}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {field.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Performance Note */}
                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <strong>Note:</strong> Export typically completes in under 10 seconds
                            for sessions with up to 100 visitors.
                        </div>
                    </div>
                )}

                {status === 'exporting' && (
                    <div className="space-y-4 py-8">
                        <div className="text-center">
                            <div className="text-lg font-medium mb-2">
                                Generating {format.toUpperCase()}...
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Please wait while we prepare your export
                            </div>
                        </div>
                        <Progress value={progress} className="w-full" />
                        <div className="text-center text-sm text-muted-foreground">
                            {progress}%
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4 py-8 text-center">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-green-500/10 p-3">
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-medium mb-1">Export Complete!</div>
                            <div className="text-sm text-muted-foreground">
                                Your {format.toUpperCase()} file is ready for download
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4 py-8 text-center">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-red-500/10 p-3">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-medium mb-1">Export Failed</div>
                            <div className="text-sm text-muted-foreground">
                                {errorMessage || 'An error occurred during export'}
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {status === 'idle' && (
                        <>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleExport}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </>
                    )}

                    {status === 'exporting' && (
                        <Button disabled>
                            Exporting...
                        </Button>
                    )}

                    {status === 'success' && (
                        <>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Close
                            </Button>
                            <Button onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Close
                            </Button>
                            <Button onClick={handleExport}>
                                Try Again
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
