'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { Calculator, Wrench, DollarSign, FileSearch } from 'lucide-react';

const toolsTabs = [
    { id: 'calculator', label: 'Calculator', href: '/tools/calculator', icon: Calculator },
    { id: 'roi', label: 'ROI', href: '/tools/roi', icon: DollarSign },
    { id: 'valuation', label: 'Valuation', href: '/tools/valuation', icon: Wrench },
    { id: 'scanner', label: 'Doc Scanner', href: '/tools/document-scanner', icon: FileSearch },
];

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="tools">
            <HubLayoutWithFavorites
                title="Deal Analysis & Tools"
                description="Analyze deals and crunch numbers like a pro with mortgage calculators and investment analysis tools"
                icon={Calculator}
                tabs={toolsTabs}
                tabsVariant="pills"
            >
                {children}
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}