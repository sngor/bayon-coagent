import { redirect } from 'next/navigation';

interface ResearchReportPageProps {
    params: {
        reportId: string;
    };
}

export default function ResearchReportPage({ params }: ResearchReportPageProps) {
    // Redirect to the knowledge-base report page
    redirect(`/knowledge-base/${params.reportId}`);
}