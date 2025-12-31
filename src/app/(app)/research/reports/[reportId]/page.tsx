import { redirect } from 'next/navigation';

interface ResearchReportPageProps {
    params: Promise<{
        reportId: string;
    }>;
}

export default async function ResearchReportPage({ params }: ResearchReportPageProps) {
    const { reportId } = await params;
    // Redirect to the knowledge-base report page
    redirect(`/knowledge-base/${reportId}`);
}