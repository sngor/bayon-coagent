
'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useUser } from '@/aws/auth';
import { useQuery } from '@/aws/dynamodb/hooks';
import { getRepository } from '@/aws/dynamodb';
import { getResearchReportKeys } from '@/aws/dynamodb/keys';
import type { ResearchReport } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Library, Calendar, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

function ReportListSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardFooter>
                        <Skeleton className="h-4 w-1/4" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export default function KnowledgeBasePage() {
    const { user } = useUser();
    const [reportToDelete, setReportToDelete] = useState<ResearchReport | null>(null);

    // Memoize DynamoDB keys
    const reportsPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const reportsSKPrefix = useMemo(() => 'REPORT#', []);

    const { data: reports, isLoading } = useQuery<ResearchReport>(reportsPK, reportsSKPrefix, {
        scanIndexForward: false, // descending order
    });

    const formatDate = (dateValue: any): string => {
        if (!dateValue) return 'Unknown date';
        // Handle Firestore timestamp
        if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            return new Date(dateValue.seconds * 1000).toLocaleDateString();
        }
        // Handle ISO string or number
        return new Date(dateValue).toLocaleDateString();
    };

    const handleDeleteReport = async () => {
        if (!reportToDelete || !user) return;
        try {
            const repository = getRepository();
            const keys = getResearchReportKeys(user.id, reportToDelete.id);
            await repository.delete(keys.PK, keys.SK);
            toast({
                title: 'Report Deleted',
                description: `"${reportToDelete.topic}" has been removed from your knowledge base.`,
            });
            setReportToDelete(null);
        } catch (error) {
            console.error('Failed to delete report:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete report.',
            });
        }
    };

    return (
        <div className="animate-fade-in-up space-y-8">
            <PageHeader
                title="Knowledge Base"
                description="A centralized library of all your saved AI-generated research reports."
            />

            {isLoading && <ReportListSkeleton />}

            {!isLoading && reports && reports.length > 0 && (
                <AlertDialog>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {reports.map(report => (
                            <Card key={report.id} className="h-full flex flex-col group/card card-interactive">
                                <Link href={`/knowledge-base/${report.id}`} passHref className="flex-grow flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="font-headline text-xl">{report.topic}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow" />
                                </Link>
                                <CardFooter className="flex justify-between items-center">
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDate(report.createdAt)}</span>
                                    </div>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover/card:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReportToDelete(report);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                            <span className="sr-only">Delete report</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the research report titled "{reportToDelete?.topic}" from your knowledge base.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteReport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {!isLoading && (!reports || reports.length === 0) && (
                <Card className="flex flex-col items-center justify-center text-center py-20">
                    <Library className="h-16 w-16 mb-4 text-muted-foreground" />
                    <CardTitle className="font-headline text-2xl">Your Knowledge Base is Empty</CardTitle>
                    <CardDescription className="mt-2">
                        You haven't saved any research reports yet.
                    </CardDescription>
                    <CardContent className="mt-6">
                        <Button asChild>
                            <Link href="/research-agent">
                                Go to the AI Research Agent
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
