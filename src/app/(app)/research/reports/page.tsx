'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { filterBySearch, highlightMatches } from '@/lib/search-utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Search, Calendar, FileText, Plus } from 'lucide-react';
import { useUser } from '@/aws/auth';
import type { ResearchReport } from '@/lib/types';
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Research Reports</h1>
                    <p className="text-muted-foreground">All your saved research reports in one place</p>
                </div>
                <Link href="/research/agent">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Research
                    </Button>
                </Link>
            </div>

            {/* Search Input */}
            {!isLoadingReports && savedReports && savedReports.length > 0 && (
                <div className="max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                        placeholder="Search reports..."
                        aria-label="Search research reports"
                    />
                </div>
            )}

            {isLoadingReports && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-20 bg-muted rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* No search results */}
            {!isLoadingReports && savedReports && savedReports.length > 0 && searchQuery && filteredReports.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No reports found for "{searchQuery}"</p>
                            <Button variant="ghost" onClick={() => setSearchQuery('')} className="mt-2">
                                Clear search
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isLoadingReports && filteredReports && filteredReports.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                </div>
            )}

            {!isLoadingReports && (!savedReports || savedReports.length === 0) && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-headline text-lg font-semibold mb-2">No Research Reports Yet</h3>
                            <p className="text-muted-foreground mb-4">Start your first research project to see reports here.</p>
                            <Link href="/research/agent">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create First Report
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}