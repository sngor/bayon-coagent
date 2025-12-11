import { AnalyticsClient } from './analytics-client';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
    return <AnalyticsClient />;
}