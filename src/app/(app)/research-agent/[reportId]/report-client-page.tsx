
'use client';


import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useUser } from '@/aws/auth/use-user';
import { useItem } from '@/aws/dynamodb/hooks/use-item';
import type { ResearchReport } from '@/lib/types/common/common';
import { marked } from 'marked';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    const { data: report, isLoading } = useItem<ResearchReport>(
        user ? `USER#${user.id}` : null,
        `REPORT#${reportId}`
    );

    return (
        <div className="space-y-8 fade-in">
            <Button variant="outline" asChild>
                <Link href="/research-agent">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Research Agent
                </Link>
            </Button>

            {isLoading && <ReportSkeleton />}

            {report && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold font-headline">{report.topic}</CardTitle>
                            <p className="text-muted-foreground">{`Generated on ${new Date(report.createdAt).toLocaleDateString()}`}</p>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div
                                className="prose prose-lg max-w-none text-foreground prose-headings:font-headline prose-h2:text-2xl prose-h3:text-xl dark:prose-invert"
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
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold font-headline">Report Not Found</CardTitle>
                        <p className="text-muted-foreground">The requested research report could not be found.</p>
                    </CardHeader>
                </Card>
            )}
        </div>
    )
}
