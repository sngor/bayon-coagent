'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StandardSkeleton } from '@/components/standard/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { useUser } from '@/aws/auth';
import type { ResearchReport } from '@/lib/types';
import { FileSearch, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function LibraryReportsPage() {
    const router = useRouter();
    const { user } = useUser();
    const [reports, setReports] = useState<ResearchReport[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch reports
    useEffect(() => {
        if (!user) {
            setReports([]);
            setIsLoading(false);
            return;
        }

        // For now, set empty array to show empty state
        // TODO: Implement proper data fetching via Server Actions
        setReports([]);
        setIsLoading(false);
    }, [user]);

    const formatDate = (dateValue: any): string => {
        if (!dateValue) return 'Unknown date';
        if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            return new Date(dateValue.seconds * 1000).toLocaleDateString();
        }
        return new Date(dateValue).toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {isLoading && <StandardSkeleton variant="list" count={3} />}

            {!isLoading && reports && reports.length > 0 && (
                <div className="grid gap-4">
                    {reports.map(report => (
                        <Card key={report.id} className="bg-secondary/30 hover:bg-secondary/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg font-semibold line-clamp-2">
                                            {report.topic}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline">Research Report</Badge>
                                            <span>Created {formatDate(report.createdAt)}</span>
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/market/research/${report.id}`}>
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            {report.summary && (
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {report.summary}
                                    </p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && (!reports || reports.length === 0) && (
                <IntelligentEmptyState
                    icon={FileSearch}
                    title="No Research Reports Yet"
                    description="Your saved research reports will appear here. Start by running a deep-dive research in the Market hub."
                    actions={[
                        {
                            label: "Go to Research",
                            onClick: () => router.push('/market/research'),
                            icon: FileSearch,
                        },
                    ]}
                    variant="card"
                />
            )}
        </div>
    );
}
