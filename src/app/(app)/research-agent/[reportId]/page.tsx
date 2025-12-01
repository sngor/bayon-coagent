import ReportClientPage from './report-client-page';

// This is now a Server Component
export default async function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
    const resolvedParams = await params;
    return <ReportClientPage reportId={resolvedParams.reportId} />;
}
