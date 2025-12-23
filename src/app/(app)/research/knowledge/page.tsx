import { redirect } from 'next/navigation';

export default function ResearchKnowledgePage() {
    // Redirect to the knowledge-base page (legacy route)
    redirect('/knowledge-base');
}