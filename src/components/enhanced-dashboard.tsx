'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Star,
    Award,
    TrendingUp,
    ArrowRight,
    MessageSquare,
    PenTool,
    Search,
    Calculator,
    Users,
    Target,
    Zap,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Activity,
    Sparkles,
    Eye,
    Heart,
    DollarSign,
} from 'lucide-react';

// Import our new 3D components
import { Dashboard3DLayout, Grid3DLayout, Section3D } from '@/components/ui/3d-dashboard-layout';
import { Metric3DCard, RevenueMetric3DCard, EngagementMetric3DCard, GrowthMetric3DCard } from '@/components/ui/3d-metric-cards';
import {
    House3DIcon,
    Chart3DIcon,
    AISparkle3DIcon,
    Success3DIcon,
    Target3DIcon,
    Users3DIcon,
    Content3DIcon
} from '@/components/ui/3d-interactive-icons';

// Import existing components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StandardCard, StandardSkeleton, StandardEmptyState } from '@/components/standard';
import { DashboardQuickActions } from '@/components/dashboard-quick-actions';
import { ProfileCompletionBanner } from '@/components/profile-completion-banner';
import { SuggestedNextSteps } from '@/components/suggested-next-steps';

// Types
import type { Review, Profile, MarketingPlan, MarketingTask, BrandAudit, Competitor as CompetitorType } from '@/lib/types';

interface EnhancedDashboardProps {
    user: any;
    dashboardData: {
        agentProfile: Profile | null;
        allReviews: Review[];
        recentReviews: Review[];
        latestPlan: MarketingPlan | null;
        brandAudit: BrandAudit | null;
        competitors: CompetitorType[];
    } | null;
    isLoading: boolean;
    error: string | null;
    completionPercentage: number;
    suggestedSteps: any[];
    isBannerDismissed: boolean;
    onBannerDismiss: () => void;
}

/**
 * Enhanced Dashboard with 3D Interactive Elements
 */
export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
    user,
    dashboardData,
    isLoading,
    error,
    completionPercentage,
    suggestedSteps,
    isBannerDismissed,
    onBannerDismiss,
}) => {
    // Extract data from state
    const agentProfile = dashboardData?.agentProfile || null;
    const allReviews = dashboardData?.allReviews || [];
    const recentReviews = dashboardData?.recentReviews || [];
    const latestPlanData = dashboardData?.latestPlan ? [dashboardData.latestPlan] : [];
    const brandAuditData = dashboardData?.brandAudit || null;
    const competitorsData = dashboardData?.competitors || [];

    // Calculate metrics
    const { averageRating, totalReviews, recentReviewsCount } = useMemo(() => {
        if (!allReviews || allReviews.length === 0) return { averageRating: '0.0', totalReviews: 0, recentReviewsCount: 0 };

        const total = allReviews.reduce((acc, review) => acc + review.rating, 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recent = allReviews.filter(review => new Date(review.date) > thirtyDaysAgo).length;

        return {
            averageRating: (total / allReviews.length).toFixed(1),
            totalReviews: allReviews.length,
            recentReviewsCount: recent,
        };
    }, [allReviews]);

    // Get time-based greeting
    const getTimeOfDayGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const firstName = agentProfile?.name ? agentProfile.name.split(' ')[0] : null;

    // Show error state if dashboard failed to load
    if (error && !dashboardData) {
        return (
            <Dashboard3DLayout>
                <StandardCard variant="elevated">
                    <StandardEmptyState
                        icon={<AlertCircle className="h-12 w-12 text-destructive" />}
                        title="Unable to Load Dashboard"
                        description={error}
                        action={{
                            label: "Try Again",
                            onClick: () => window.location.reload(),
                            variant: "default"
                        }}
                    />
                </StandardCard>
            </Dashboard3DLayout>
        );
    }

    return (
        <Dashboard3DLayout
            enableParallax={true}
            staggerDelay={0.15}
            floatingElements={true}
            className="min-h-screen"
        >
            {/* Welcome Message for New Users */}
            {!isLoading && (!agentProfile?.name || completionPercentage < 50) && (
                <Section3D depth="medium" className="mb-8">
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-2xl"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 opacity-50" />
                        <div className="relative flex items-start gap-6 p-8">
                            <motion.div
                                className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl"
                                animate={{
                                    rotate: [0, 5, -5, 0],
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Zap className="w-8 h-8 text-white" />
                            </motion.div>
                            <div className="flex-1">
                                <motion.h3
                                    className="font-bold text-2xl mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                >
                                    Welcome to Bayon Coagent! 🎉
                                </motion.h3>
                                <motion.p
                                    className="text-muted-foreground mb-8 text-lg leading-relaxed"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    Let's get you set up for success. Complete your profile to unlock personalized strategies and AI-powered tools.
                                </motion.p>
                                <motion.div
                                    className="flex flex-col sm:flex-row gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                >
                                    <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                                        <Link href="/brand/profile">
                                            <Target3DIcon className="w-5 h-5 mr-2" animated />
                                            Complete Your Profile
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow">
                                        <Link href="/assistant">
                                            <MessageSquare className="w-5 h-5 mr-2" />
                                            Get Help
                                        </Link>
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </Section3D>
            )}

            {/* Profile Completion Banner */}
            {agentProfile && completionPercentage >= 50 && completionPercentage < 100 && !isBannerDismissed && (
                <Section3D depth="shallow" className="mb-8">
                    <ProfileCompletionBanner
                        profile={agentProfile}
                        onDismiss={onBannerDismiss}
                    />
                </Section3D>
            )}

            {/* Profile Complete Celebration Banner */}
            {agentProfile && completionPercentage === 100 && (
                <Section3D depth="medium" className="mb-8">
                    <motion.div
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-950 dark:via-emerald-950 dark:to-green-900 border-green-200 dark:border-green-800 shadow-2xl"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10" />
                        <div className="relative flex items-center gap-6 p-8">
                            <Success3DIcon
                                className="w-16 h-16 text-green-600 dark:text-green-400"
                                animated
                                intensity="strong"
                                glowEffect
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-2xl text-green-700 dark:text-green-300 mb-3">
                                    🎉 Profile Complete!
                                </h3>
                                <p className="text-green-600 dark:text-green-400 leading-relaxed text-lg">
                                    Your profile is now complete and all AI features are unlocked. You're ready to maximize your marketing potential!
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button variant="outline" size="sm" asChild className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900 shadow-md">
                                    <Link href="/brand/strategy">
                                        <AISparkle3DIcon className="w-4 h-4 mr-2" animated />
                                        Generate Strategy
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="sm" asChild className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900">
                                    <Link href="/studio/write">
                                        <PenTool className="w-4 h-4 mr-2" />
                                        Create Content
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </Section3D>
            )}

            {/* Quick Actions */}
            <Section3D depth="shallow" className="mb-8">
                <DashboardQuickActions />
            </Section3D>

            {/* Main Dashboard Grid */}
            <Grid3DLayout columns={3} gap="lg" className="mb-8">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Overview with 3D Metrics */}
                    <Section3D
                        title="Performance Overview"
                        description="Track your progress and key metrics"
                        depth="medium"
                    >
                        {isLoading ? (
                            <StandardSkeleton variant="metric" count={2} />
                        ) : (
                            <div className="space-y-8">
                                {/* Profile Completion */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-lg">Profile Completion</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-bold text-primary">{completionPercentage}%</span>
                                            {completionPercentage === 100 && (
                                                <Success3DIcon className="w-6 h-6 text-green-500" animated />
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Progress value={completionPercentage} className="h-4 bg-muted/50" />
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-purple-600/20 opacity-50"
                                            animate={{
                                                opacity: [0.3, 0.6, 0.3],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* 3D Metrics Grid */}
                                <Grid3DLayout columns={3} gap="md">
                                    <GrowthMetric3DCard
                                        title="Strategy Tasks"
                                        icon={Target}
                                        current={latestPlanData.length > 0 ? latestPlanData[0].steps.length : 0}
                                        previous={Math.max(0, (latestPlanData.length > 0 ? latestPlanData[0].steps.length : 0) - 2)}
                                        animated
                                        intensity="medium"
                                        size="md"
                                    />

                                    <GrowthMetric3DCard
                                        title="Competitors Tracked"
                                        icon={Users}
                                        current={competitorsData.length}
                                        previous={Math.max(0, competitorsData.length - 1)}
                                        animated
                                        intensity="medium"
                                        size="md"
                                    />

                                    <Metric3DCard
                                        title="Brand Audit"
                                        value={brandAuditData ? '✓' : '○'}
                                        icon={CheckCircle2}
                                        trend={brandAuditData ? 'up' : 'neutral'}
                                        animated
                                        intensity="medium"
                                        size="md"
                                        glowColor={brandAuditData ? '#10b981' : '#6b7280'}
                                    />
                                </Grid3DLayout>
                            </div>
                        )}
                    </Section3D>

                    {/* Priority Actions */}
                    <Section3D
                        title="Priority Actions"
                        description="High-impact activities to accelerate growth"
                        depth="medium"
                    >
                        {isLoading ? (
                            <StandardSkeleton variant="list" count={2} />
                        ) : latestPlanData && latestPlanData.length > 0 ? (
                            <div className="space-y-6">
                                {latestPlanData[0].steps.slice(0, 3).map((task: MarketingTask, index: number) => (
                                    <motion.div
                                        key={index}
                                        className="group relative overflow-hidden rounded-2xl border-2 border-transparent bg-gradient-to-r from-primary/5 via-primary/3 to-transparent hover:border-primary/20 hover:from-primary/10 hover:via-primary/5 hover:to-primary/5 transition-all duration-300"
                                        whileHover={{
                                            scale: 1.02,
                                            rotateY: 2,
                                            rotateX: -1,
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        <div className="relative flex items-start gap-6 p-8">
                                            <motion.div
                                                className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-lg shadow-xl"
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                            >
                                                {index + 1}
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                    <h4 className="font-headline font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                                                        {task.task}
                                                    </h4>
                                                    <Badge
                                                        variant={index === 0 ? "default" : "outline"}
                                                        className={`text-sm shrink-0 ${index === 0 ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}`}
                                                    >
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        {index === 0 ? 'This Week' : index === 1 ? 'Next Week' : 'Later'}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground line-clamp-2 leading-relaxed mb-6">
                                                    {task.rationale}
                                                </p>
                                                <div className="flex items-center gap-4">
                                                    <Button size="sm" variant="ghost" className="h-10 px-6 hover:bg-primary/10 hover:text-primary">
                                                        Mark Complete
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-10 px-6 hover:bg-secondary">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Schedule
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <StandardEmptyState
                                icon={<AISparkle3DIcon animated className="h-10 w-10 text-primary" />}
                                title="No Strategy Yet"
                                description="Get a personalized game plan built around your strengths and opportunities."
                                action={{
                                    label: "Create Your Strategy",
                                    onClick: () => window.location.href = '/brand/strategy',
                                    variant: "ai"
                                }}
                                variant="compact"
                                className="bg-gradient-to-br from-primary/5 to-purple-600/5"
                            />
                        )}
                    </Section3D>

                    {/* Reputation Snapshot with 3D Metrics */}
                    <Section3D
                        title="Reputation Snapshot"
                        description="Client testimonials and reviews"
                        depth="medium"
                    >
                        {isLoading ? (
                            <StandardSkeleton variant="metric" count={3} className="mb-6" />
                        ) : (
                            <div className="space-y-8">
                                <Grid3DLayout columns={3} gap="md">
                                    <Metric3DCard
                                        title="Average Rating"
                                        value={averageRating}
                                        icon={Star}
                                        trend="up"
                                        change={2.5}
                                        changeLabel="vs last month"
                                        animated
                                        intensity="medium"
                                        glowColor="#f59e0b"
                                        particleEffect={parseFloat(averageRating) > 4.5}
                                    />

                                    <GrowthMetric3DCard
                                        title="Total Reviews"
                                        icon={Award}
                                        current={totalReviews}
                                        previous={Math.max(0, totalReviews - 3)}
                                        animated
                                        intensity="medium"
                                    />

                                    <GrowthMetric3DCard
                                        title="This Month"
                                        icon={TrendingUp}
                                        current={recentReviewsCount}
                                        previous={Math.max(0, recentReviewsCount - 1)}
                                        animated
                                        intensity="medium"
                                    />
                                </Grid3DLayout>

                                {/* Quick Actions for Reviews */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button size="sm" variant="outline" asChild className="shadow-md hover:shadow-lg transition-shadow">
                                        <Link href="/brand/audit">
                                            <Search className="w-4 h-4 mr-2" />
                                            Import Reviews
                                        </Link>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild className="shadow-md hover:shadow-lg transition-shadow">
                                        <Link href="/brand/audit">
                                            <Chart3DIcon className="w-4 h-4 mr-2" animated />
                                            View Analytics
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Section3D>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-8">
                    {/* Today's Focus */}
                    <Section3D
                        title="Today's Focus"
                        description="Your most important tasks for today"
                        depth="shallow"
                    >
                        {isLoading ? (
                            <StandardSkeleton variant="list" count={2} />
                        ) : suggestedSteps.length > 0 ? (
                            <div className="space-y-4">
                                {suggestedSteps.slice(0, 3).map((step, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                            <motion.div
                                                className="w-3 h-3 rounded-full bg-primary"
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.7, 1, 0.7],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    delay: index * 0.2,
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium leading-tight">{step.title}</p>
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{step.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                                <Button size="sm" variant="ghost" className="w-full mt-4" asChild>
                                    <Link href={suggestedSteps[0]?.href || '/brand/profile'}>
                                        <Target3DIcon className="w-4 h-4 mr-2" animated />
                                        Start First Task
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <StandardEmptyState
                                icon={<Success3DIcon className="h-10 w-10 text-green-500" animated />}
                                title="All Caught Up!"
                                description="You're doing great. Check back later for new suggestions."
                                variant="compact"
                                className="bg-green-50 dark:bg-green-950"
                            />
                        )}
                    </Section3D>

                    {/* Suggested Next Steps */}
                    {!isLoading && suggestedSteps.length > 3 && (
                        <Section3D depth="shallow">
                            <SuggestedNextSteps steps={suggestedSteps.slice(3)} />
                        </Section3D>
                    )}
                </div>
            </Grid3DLayout>
        </Dashboard3DLayout>
    );
};

export default EnhancedDashboard;