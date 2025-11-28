'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { filterBySearch, highlightMatches } from '@/lib/search-utils';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import {
    PageHeader,
    DataGrid,
    EmptySection,
} from '@/components/ui';
import { StandardSkeleton } from '@/components/ui/reusable';
import { Search, Calendar, FileText, Plus, Library } from 'lucide-react';
import { useUser } from '@/aws/auth';
import type { ResearchReport } from '@/lib/types';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageConfig } from '@/components/dashboard-quick-actions';
import Link from 'next/link';

export default function ResearchReportsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const { user, isUserLoading } = useUser();
    const [savedReports, setSavedReports] = useState<ResearchReport[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);

    // Fetch reports from API
    useEffect(() => {
        async function fetchReports() {
            if (!user) {
                setIsLoadingReports(false);
                return;
            }

            try {
                // TODO: Implement research-reports API route
                // For now, just set empty reports to prevent hanging
                setSavedReports([]);
            } catch (error) {
                console.error('Failed to fetch reports:', error);
                setSavedReports([]);
            } finally {
                setIsLoadingReports(false);
            }
        }

        fetchReports();
    }, [user]);

    // Filter reports based on search query
    const filteredReports = useMemo(() => {
        if (!savedReports) return [];
        return filterBySearch(savedReports, searchQuery, (report) => [
            report.topic || '',
        ]);
    }, [savedReports, searchQuery]);

    return (
        <div className="space-y-8">
            <Card className="mb-6">
                <CardHeader className="pb-0">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold font-headline">Research Reports</h1>
                            <p className="text-muted-foreground">All your saved research reports in one place</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/research/agent">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Research
                                </Button>
                            </Link>
                            {(() => {
                                const pageConfig = getPageConfig('/intelligence/reports');
                                return pageConfig ? <FavoritesButton item={pageConfig} /> : null;
                            })()}
                        </div>
                    </div>
                </CardHeader>
                {!isLoadingReports && savedReports && savedReports.length > 0 && (
                    <CardContent className="pt-6">
                        <div className="max-w-md">
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClear={() => setSearchQuery('')}
                                placeholder="Search reports..."
                                aria-label="Search research reports"
                            />
                        </div>
                    </CardContent>
                )}
            </Card>

            {isLoadingReports && (
                <DataGrid columns={3}>
                    {[1, 2, 3].map((i) => (
                        <StandardSkeleton key={i} variant="card" />
                    ))}
                </DataGrid>
            )}

            {/* No search results */}
            {!isLoadingReports && savedReports && savedReports.length > 0 && searchQuery && filteredReports.length === 0 && (
                <EmptySection
                    title={`No reports found for "${searchQuery}"`}
                    description="Try adjusting your search terms or browse all reports"
                    icon={Search}
                    action={{
                        label: "Clear search",
                        onClick: () => setSearchQuery(''),
                        variant: "outline"
                    }}
                    variant="default"
                />
            )}

            {!isLoadingReports && filteredReports && filteredReports.length > 0 && (
                <DataGrid columns={3}>
                    {filteredReports.map(report => (
                        <Link key={report.id} href={`/research/reports/${report.id}`} passHref>
                            <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader>
                                    <CardTitle
                                        className="font-headline text-xl line-clamp-2"
                                        dangerouslySetInnerHTML={{
                                            __html: searchQuery
                                                ? highlightMatches(report.topic || '', searchQuery)
                                                : report.topic || ''
                                        }}
                                    />
                                </CardHeader>
                                <CardContent className="flex-grow" />
                                <CardFooter>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </DataGrid>
            )}

            {!isLoadingReports && (!savedReports || savedReports.length === 0) && (
                <EmptySection
                    title="No Research Reports Yet"
                    description="Start your first research project to see reports here."
                    icon={FileText}
                    action={{
                        label: "Create First Report",
                        onClick: () => router.push('/research/agent'),
                        variant: "default"
                    }}
                    variant="default"
                />
            )}
        </div>
    );
}