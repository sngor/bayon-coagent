import { redirect } from 'next/navigation';

export default function ResearchPage() {
    // Redirect to the main research agent page
    redirect('/research/agent');
}