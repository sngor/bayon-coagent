import { AnalyticsDashboard } from '@/components/open-house/analytics-dashboard';

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-headline font-bold">Analytics Dashboard</h2>
                <p className="text-muted-foreground">
                    Track your open house performance and visitor engagement
                </p>
            </div>

            <AnalyticsDashboard />
        </div>
    );
}
