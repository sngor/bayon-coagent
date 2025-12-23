'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ContentSection } from '@/components/ui';

const PLAN_FEATURES = [
    {
        category: 'Content & Studio',
        features: [
            {
                name: 'AI Content Generation',
                free: '10/month',
                starter: '50/month',
                professional: 'Unlimited',
                omnia: 'Unlimited'
            },
            {
                name: 'Image Enhancements',
                free: '5/month',
                starter: '25/month',
                professional: 'Unlimited',
                omnia: 'Unlimited'
            },
            {
                name: 'Research Reports',
                free: '3/month',
                starter: '15/month',
                professional: 'Unlimited',
                omnia: 'Unlimited'
            },
            {
                name: 'Marketing Plans',
                free: '1/month',
                starter: '5/month',
                professional: 'Unlimited',
                omnia: 'Unlimited'
            }
        ]
    },
    {
        category: 'Learning Hub',
        features: [
            {
                name: 'Interactive Lessons',
                free: 'Basic (5)',
                starter: 'Standard (25)',
                professional: 'All Lessons',
                omnia: 'All Lessons'
            },
            {
                name: 'AI Role-Play Sessions',
                free: '3/month',
                starter: '10/month',
                professional: 'Unlimited',
                omnia: 'Unlimited'
            },
            {
                name: 'AI Learning Plans',
                free: '1/month',
                starter: '3/month',
                professional: 'Unlimited',
                omnia: 'Unlimited'
            },
            {
                name: 'Live Chat Support',
                free: '-',
                starter: 'Role-Play Only',
                professional: 'Learning Plans + Role-Play',
                omnia: 'Full Access'
            },
            {
                name: 'Certification Tracking',
                free: 'Basic',
                starter: 'Standard',
                professional: 'Advanced',
                omnia: 'Premium'
            },
            {
                name: 'Community Access',
                free: 'Read Only',
                starter: 'Post & Comment',
                professional: 'Full Access',
                omnia: 'Full Access + Moderation'
            }
        ]
    },
    {
        category: 'Brand & Market',
        features: [
            {
                name: 'Brand Monitoring',
                free: 'Basic',
                starter: 'Basic',
                professional: 'Advanced',
                omnia: 'Advanced'
            },
            {
                name: 'Competitor Tracking',
                free: '-',
                starter: '-',
                professional: '✓',
                omnia: '✓'
            }
        ]
    },
    {
        category: 'Support & Advanced',
        features: [
            {
                name: 'Priority Support',
                free: '-',
                starter: '-',
                professional: '✓',
                omnia: '✓'
            },
            {
                name: 'White-Label Options',
                free: '-',
                starter: '-',
                professional: '-',
                omnia: '✓'
            }
        ]
    }
];

export function PlanComparisonTable() {
    return (
        <ContentSection 
            title="Plan Comparison" 
            description="Compare features across all subscription tiers" 
            icon={CheckCircle2} 
            variant="card"
        >
            <div className="overflow-x-auto">
                <table 
                    className="w-full text-sm"
                    role="table"
                    aria-label="Subscription plan comparison"
                >
                    <thead>
                        <tr className="border-b" role="row">
                            <th className="text-left py-3 px-4 font-medium" scope="col">Feature</th>
                            <th className="text-center py-3 px-4 font-medium" scope="col">Free</th>
                            <th className="text-center py-3 px-4 font-medium" scope="col">Starter</th>
                            <th className="text-center py-3 px-4 font-medium" scope="col">Professional</th>
                            <th className="text-center py-3 px-4 font-medium" scope="col">Omnia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {PLAN_FEATURES.map((category) => (
                            <React.Fragment key={category.category}>
                                {/* Category Header */}
                                <tr className="bg-muted/30" role="row">
                                    <td 
                                        className="py-2 px-4 font-medium text-muted-foreground" 
                                        colSpan={5}
                                        scope="colgroup"
                                    >
                                        {category.category}
                                    </td>
                                </tr>
                                {/* Category Features */}
                                {category.features.map((feature) => (
                                    <tr key={feature.name} role="row">
                                        <td className="py-3 px-4" scope="row">{feature.name}</td>
                                        <td className="text-center py-3 px-4">{feature.free}</td>
                                        <td className="text-center py-3 px-4">{feature.starter}</td>
                                        <td className="text-center py-3 px-4">{feature.professional}</td>
                                        <td className="text-center py-3 px-4">{feature.omnia}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Live Chat Limitations Notice */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Live Chat Access Levels
                        </p>
                        <ul className="text-xs mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                            <li><strong>Starter:</strong> Live chat available only during AI role-play sessions for practice scenarios</li>
                            <li><strong>Professional:</strong> Live chat for AI learning plans and role-play sessions</li>
                            <li><strong>Omnia:</strong> Full live chat access across all features and general support</li>
                        </ul>
                    </div>
                </div>
            </div>
        </ContentSection>
    );
}