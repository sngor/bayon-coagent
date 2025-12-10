'use server';

import { getRepository } from '@/aws/dynamodb/repository';
import type { Review, Profile, MarketingPlan, BrandAudit, Competitor } from '@/lib/types/common';

export async function getDashboardData(userId: string) {
  const repository = getRepository();

  try {
    // 1. Fetch Agent Profile first to get teamId
    const agentProfile = await repository.get<Profile>(`USER#${userId}`, 'AGENT#main');

    // 2. Fetch all other data in parallel
    const [
      allReviews,
      recentReviews,
      latestPlan,
      brandAudit,
      competitors,
      teamAnnouncements,
      globalAnnouncements
    ] = await Promise.all([
      // All reviews
      repository.query<Review>(`REVIEW#${userId}`, 'REVIEW#'),

      // Recent reviews (last 3)
      repository.query<Review>(`REVIEW#${userId}`, 'REVIEW#', {
        limit: 3,
        scanIndexForward: false,
      }),

      // Latest marketing plan
      repository.query<MarketingPlan>(`USER#${userId}`, 'PLAN#', {
        limit: 1,
        scanIndexForward: false,
      }),

      // Brand audit
      repository.get<BrandAudit>(`USER#${userId}`, 'AUDIT#main'),

      // Competitors
      repository.query<Competitor>(`USER#${userId}`, 'COMPETITOR#'),

      // Team Announcements (if teamId exists)
      agentProfile?.teamId
        ? repository.query(`TEAM#${agentProfile.teamId}`, 'ANNOUNCEMENT#', { limit: 5, scanIndexForward: false })
        : Promise.resolve({ items: [] }),

      // Global Announcements
      repository.query('TEAM#GLOBAL', 'ANNOUNCEMENT#', { limit: 5, scanIndexForward: false })
    ]);

    // Merge and sort announcements
    const announcements = [...teamAnnouncements.items, ...globalAnnouncements.items]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      success: true,
      data: {
        agentProfile,
        allReviews: allReviews.items,
        recentReviews: recentReviews.items,
        latestPlan: latestPlan.items[0] || null,
        brandAudit,
        competitors: competitors.items,
        announcements
      },
    };
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard data',
      data: null,
    };
  }
}
