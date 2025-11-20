'use server';

import { getRepository } from '@/aws/dynamodb/repository';
import type { Review, Profile, MarketingPlan, BrandAudit, Competitor } from '@/lib/types';

export async function getDashboardData(userId: string) {
  const repository = getRepository();

  try {
    // Fetch all dashboard data in parallel
    const [
      agentProfile,
      allReviews,
      recentReviews,
      latestPlan,
      brandAudit,
      competitors,
    ] = await Promise.all([
      // Agent profile
      repository.get<Profile>(`USER#${userId}`, 'AGENT#main'),
      
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
    ]);

    return {
      success: true,
      data: {
        agentProfile,
        allReviews: allReviews.items,
        recentReviews: recentReviews.items,
        latestPlan: latestPlan.items[0] || null,
        brandAudit,
        competitors: competitors.items,
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
