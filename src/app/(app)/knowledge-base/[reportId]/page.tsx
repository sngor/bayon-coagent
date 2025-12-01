import ReportClientPage from './report-client-page';

// This is now a Server Component
export default async function KnowledgeBaseReportPage({ params }: { params: Promise<{ reportId: string }> }) {
    const { reportId } = await params;
    // We access the param here on the server and pass it as a simple prop
    // to the client component. This avoids the Promise-related warning.
    return <ReportClientPage reportId={reportId} />;
}
