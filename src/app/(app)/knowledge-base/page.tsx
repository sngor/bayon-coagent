
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { StandardEmptyState } from '@/components/standard/empty-state';
import { useUser } from '@/aws/auth';
import { useQuery } from '@/aws/dynamodb/hooks';
import type { ResearchReport } from '@/lib/types/common/common';
import { deleteResearchReportAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Library, Calendar, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { NoResultsEmptyState } from '@/components/ui/empty-states';
import { filterBySearchAndFilters, highlightMatches, countFilterOptions } from '@/lib/utils/search-utils';
import { FilterControls, useFilters, type FilterGroup } from '@/components/ui/filter-controls';
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
    const router = useRouter();
    const { user } = useUser();
    const [reportToDelete, setReportToDelete] = useState<ResearchReport | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { selectedFilters, handleFilterChange, handleClearAll, hasActiveFilters } = useFilters();

    // Memoize DynamoDB keys
    const reportsPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const reportsSKPrefix = useMemo(() => 'REPORT#', []);

    const { data: reports, isLoading } = useQuery<ResearchReport>(reportsPK, reportsSKPrefix, {
        scanIndexForward: false, // descending order
    });

    // Helper to get time period from date
    const getTimePeriod = (dateValue: any): string => {
        if (!dateValue) return 'Unknown';
        let date: Date;
        if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            date = new Date(dateValue.seconds * 1000);
        } else {
            date = new Date(dateValue);
        }

        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) return 'Last 7 days';
        if (diffDays < 30) return 'Last 30 days';
        if (diffDays < 90) return 'Last 3 months';
        return 'Older';
    };

    // Calculate time period counts
    const timePeriodCounts = useMemo(() => {
        if (!reports) return {};
        return countFilterOptions(reports, (report) => getTimePeriod(report.createdAt));
    }, [reports]);

    // Define filter groups
    const filterGroups: FilterGroup[] = useMemo(() => [
        {
            id: 'timePeriod',
            label: 'Time Period',
            options: [
                { value: 'Last 7 days', label: 'Last 7 days', count: timePeriodCounts['Last 7 days'] || 0 },
                { value: 'Last 30 days', label: 'Last 30 days', count: timePeriodCounts['Last 30 days'] || 0 },
                { value: 'Last 3 months', label: 'Last 3 months', count: timePeriodCounts['Last 3 months'] || 0 },
                { value: 'Older', label: 'Older', count: timePeriodCounts['Older'] || 0 },
            ],
        },
    ], [timePeriodCounts]);

    // Filter reports based on search query and filters
    const filteredReports = useMemo(() => {
        if (!reports) return [];
        return filterBySearchAndFilters(
            reports,
            searchQuery,
            selectedFilters,
            (report) => [report.topic || ''],
            (report) => ({ timePeriod: getTimePeriod(report.createdAt) })
        );
    }, [reports, searchQuery, selectedFilters]);

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
        if (!reportToDelete) return;
        try {
            const result = await deleteResearchReportAction(reportToDelete.id);

            if (result.errors || !result.data) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message,
                });
            } else {
                toast({
                    title: 'Report Deleted',
                    description: `"${reportToDelete.topic}" has been removed from your knowledge base.`,
                });
                setReportToDelete(null);
            }
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
            <Card className="mb-6">
                <CardHeader>
                    <div>
                        <CardTitle className="font-headline text-2xl">Knowledge Base</CardTitle>
                        <CardDescription>A centralized library of all your saved AI-generated research reports.</CardDescription>
                    </div>
                </CardHeader>
                {!isLoading && reports && reports.length > 0 && (
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="max-w-md">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    onClear={() => setSearchQuery('')}
                                    placeholder="Search reports by topic..."
                                    aria-label="Search research reports"
                                />
                            </div>

                            {/* Filter Controls */}
                            <FilterControls
                                filterGroups={filterGroups}
                                selectedFilters={selectedFilters}
                                onFilterChange={handleFilterChange}
                                onClearAll={handleClearAll}
                            />
                        </div>
                    </CardContent>
                )}
            </Card>

            {isLoading && <ReportListSkeleton />}

            {/* No search results */}
            {!isLoading && reports && reports.length > 0 && (searchQuery || hasActiveFilters) && filteredReports.length === 0 && (
                <NoResultsEmptyState
                    searchTerm={searchQuery}
                    onClearSearch={() => {
                        setSearchQuery('');
                        handleClearAll();
                    }}
                    icon={<Search className="w-8 h-8 text-muted-foreground" />}
                />
            )}

            {!isLoading && filteredReports && filteredReports.length > 0 && (
                <AlertDialog>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredReports.map(report => (
                            <Card key={report.id} className="h-full flex flex-col group/card card-interactive">
                                <Link href={`/knowledge-base/${report.id}`} passHref className="flex-grow flex flex-col">
                                    <CardHeader>
                                        <CardTitle
                                            className="font-headline text-xl"
                                            dangerouslySetInnerHTML={{
                                                __html: searchQuery
                                                    ? highlightMatches(report.topic || '', searchQuery)
                                                    : report.topic || ''
                                            }}
                                        />
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
                <StandardEmptyState
                    icon={<Library className="h-16 w-16 text-muted-foreground" />}
                    title="Your Knowledge Base is Empty"
                    description="You haven't saved any research reports yet. Start by creating your first research report."
                    action={{
                        label: "Go to the AI Research Agent",
                        onClick: () => router.push('/research-agent'),
                        variant: 'default'
                    }}
                />
            )}
        </div>
    );
}
