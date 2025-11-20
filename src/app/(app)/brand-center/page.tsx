import { redirect } from 'next/navigation';

export default function BrandCenterPage() {
    // Redirect to the Profile tab by default
    redirect('/brand-center/profile');
}
