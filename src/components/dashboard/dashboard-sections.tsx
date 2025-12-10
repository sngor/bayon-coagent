// Extract dashboard sections into separate components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentSection } from '@/components/ui';
import { Activity, Star, Zap, Target, CheckCircle2, Megaphone } from 'lucide-react';

interface DashboardSectionProps {
    isLoading: boolean;
    data: any;
    className?: string;
}

export function PerformanceOverviewSection({ isLoading, data, className }: DashboardSectionProps) {
    // Move performance overview logic here
    return (
        <Card className={`animate-fade-in-up animate-delay-150 border-0 shadow-xl bg-gradient-to-br from-card to-muted/20 overflow-hidden ${className}`}>
            {/* Performance overview content */}
        </Card>
    );
}

export function PriorityActionsSection({ isLoading, data, className }: DashboardSectionProps) {
    // Move priority actions logic here
    return (
        <Card className={`animate-fade-in-up animate-delay-200 border-0 shadow-xl bg-gradient-to-br from-card to-orange-500/5 overflow-hidden ${className}`}>
            {/* Priority actions content */}
        </Card>
    );
}

export function ReputationSnapshotSection({ isLoading, data, className }: DashboardSectionProps) {
    // Move reputation snapshot logic here
    return (
        <Card className={`animate-fade-in-up animate-delay-250 border-0 shadow-xl bg-gradient-to-br from-card to-yellow-500/5 overflow-hidden ${className}`}>
            {/* Reputation snapshot content */}
        </Card>
    );
}

export function TodaysFocusSection({ isLoading, data, className }: DashboardSectionProps) {
    // Move today's focus logic here
    return (
        <Card className={`animate-fade-in-up animate-delay-200 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/5 to-card ${className}`}>
            {/* Today's focus content */}
        </Card>
    );
}