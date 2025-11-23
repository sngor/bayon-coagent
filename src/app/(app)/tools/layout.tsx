'use client';

import { HubLayout } from '@/components/hub';
import { FeatureGuard } from '@/components/feature-guard';
import { Calculator, Wrench, DollarSign } from 'lucide-react';

const toolsTabs = [
    { id: 'calculator', label: 'Calculator', href: '/tools/calculator', icon: Calculator },
    { id: 'roi', label: 'ROI', href: '/tools/roi', icon: DollarSign },
    { id: 'valuation', label: 'Valuation', href: '/tools/valuation', icon: Wrench },
];

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="tools">
            <HubLayout
                title="Deal Analysis & Tools"
                description="Analyze deals and crunch numbers like a pro with mortgage calculators and investment analysis tools"
                icon={Calculator}
                tabs={toolsTabs}
                tabsVariant="pills"
            >
                {children}
            </HubLayout>
        </FeatureGuard>
    );
}