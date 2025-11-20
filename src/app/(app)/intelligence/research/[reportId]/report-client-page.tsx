
'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ResearchReport } from '@/lib/types';
import { marked } from 'marked';
import { Calendar, ExternalLink, ArrowLeft } from 'lucide-react';
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
    const firestore = useFirestore();

    const reportDocRef = useMemoFirebase(() => {
        if (!user || !firestore || !reportId) return null;
        return doc(firestore, `users/${user.uid}/researchReports`, reportId);
    }, [user, firestore, reportId]);

    const { data: report, isLoading } = useDoc<ResearchReport>(reportDocRef);

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
                    <PageHeader
                        title={report.topic}
                        description={`Generated on ${new Date(report.createdAt).toLocaleDateString()}`}
                    />

                    <Card>
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
                 <PageHeader
                    title="Report Not Found"
                    description="The requested research report could not be found."
                />
            )}
        </div>
    )
}
