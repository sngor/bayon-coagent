import { redirect } from 'next/navigation';

export default function IntelligencePage() {
    // Redirect to the Research tab by default
    redirect('/intelligence/research');
}
