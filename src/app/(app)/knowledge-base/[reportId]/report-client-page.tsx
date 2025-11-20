
'use client';

import React, { useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useUser } from '@/aws/auth/use-user';
import { useItem } from '@/aws/dynamodb/hooks/use-item';
import type { ResearchReport } from '@/lib/types';
import { marked } from 'marked';
import { ExternalLink, ArrowLeft, Download, Copy, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function ReportSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
            </div>
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full mt-4" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function ReportClientPage({ reportId }: { reportId: string }) {
    const { user } = useUser();
    const reportContentRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);

    const { data: report, isLoading } = useItem<ResearchReport>({
        userId: user?.userId,
        sk: `REPORT#${reportId}`,
        enabled: !!user && !!reportId,
    });

    const handleDownload = async () => {
        if (!reportContentRef.current || !report) return;

        setIsDownloading(true);
        const topic = report.topic || 'research';
        const fileName = `${topic.toLowerCase().replace(/\s+/g, '-')}-report.pdf`;

        try {
            const canvas = await html2canvas(reportContentRef.current, {
                scale: 2, // Increase resolution
                useCORS: true, // For any images that might be in the report
                backgroundColor: null, // Use transparent background, will be white in PDF
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth;
            const height = width / ratio;

            let position = 0;
            let heightLeft = height;

            pdf.addImage(imgData, 'PNG', 0, position, width, height);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - height;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, width, height);
                heightLeft -= pdfHeight;
            }

            pdf.save(fileName);

            toast({ title: 'Report Downloaded', description: `Saved as ${fileName}` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not generate PDF.' });
            console.error(e);
        } finally {
            setIsDownloading(false);
        }
    };


    const handleCopy = () => {
        if (!report?.report) return;
        navigator.clipboard.writeText(report.report);
        toast({
            title: 'Report Copied!',
            description: 'The report content has been copied to your clipboard.',
        });
    };

    return (
        <div className="space-y-8 fade-in">
            <Link href="/knowledge-base">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Knowledge Base
                </Button>
            </Link>

            {isLoading && <ReportSkeleton />}

            {report && (
                <>
                    <PageHeader
                        title={report.topic}
                        description={`Generated on ${new Date(report.createdAt).toLocaleDateString()}`}
                    />

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={handleCopy}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Report
                        </Button>
                        <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {isDownloading ? 'Downloading...' : 'Download as PDF'}
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <div
                                ref={reportContentRef}
                                className="prose lg:prose-lg max-w-none text-foreground prose-headings:font-headline prose-h2:text-2xl prose-h3:text-xl dark:prose-invert bg-card p-4 rounded-md"
                                dangerouslySetInnerHTML={{ __html: marked(report.report) as string }}
                            />
                        </CardContent>
                        {report.citations && report.citations.length > 0 && (
                            <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                                <h3 className="font-headline text-lg font-semibold">Citations</h3>
                                <ul className="list-disc list-inside space-y-2">
                                    {report.citations.map((citation, index) => (
                                        <li key={index} className="text-sm">
                                            <a href={citation} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                                {citation} <ExternalLink className="inline-block ml-1 h-3 w-3" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </CardFooter>
                        )}
                    </Card>
                </>
            )}

            {!isLoading && !report && (
                <PageHeader
                    title="Report Not Found"
                    description="The requested research report could not be found."
                />
            )}
        </div>
    )
}
