import { redirect } from 'next/navigation';

export default function ResearchReportsPage() {
    // Redirect to the knowledge-base page where reports are managed
    redirect('/knowledge-base');
}