import { redirect } from 'next/navigation';

export default function StudioPage() {
    // Redirect to the Write tab by default
    redirect('/studio/write');
}
