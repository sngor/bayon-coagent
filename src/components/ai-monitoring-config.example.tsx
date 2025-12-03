/**
 * Example usage of AIMonitoringConfig component
 * 
 * This file demonstrates how to integrate the AI Monitoring Configuration
 * component into a page.
 */

import { AIMonitoringConfig } from './ai-monitoring-config';
import { getAIVisibilityData } from '@/app/actions';

/**
 * Example: Using in a Server Component page
 */
export async function AIMonitoringConfigPage({ userId }: { userId: string }) {
    // Fetch initial config from server
    const result = await getAIVisibilityData(userId);
    const initialConfig = result.data?.config || null;

    return (
        <div className="container mx-auto py-8">
            <AIMonitoringConfig
                userId={userId}
                initialConfig={initialConfig}
            />
        </div>
    );
}

/**
 * Example: Using in a Client Component with custom save handler
 */
'use client';

import { useState } from 'react';
import type { AIMonitoringConfig as AIMonitoringConfigType } from '@/lib/types/common/common';

export function AIMonitoringConfigWithCustomSave({
    userId,
    initialConfig
}: {
    userId: string;
    initialConfig: AIMonitoringConfigType | null;
}) {
    const [config, setConfig] = useState(initialConfig);

    const handleSave = async (updates: Partial<AIMonitoringConfigType>) => {
        // Custom save logic
        const { updateAIMonitoringConfigAction } = await import('@/app/actions');
        const result = await updateAIMonitoringConfigAction(userId, updates);

        if (result.data) {
            setConfig(result.data);
        }

        if (result.message !== 'success') {
            throw new Error(result.message);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <AIMonitoringConfig
                userId={userId}
                initialConfig={config}
                onSave={handleSave}
            />
        </div>
    );
}

/**
 * Example: Integration into existing AI Visibility page
 */
export async function AIVisibilityPage({ userId }: { userId: string }) {
    const result = await getAIVisibilityData(userId);

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Configuration Section */}
            <section>
                <h2 className="text-2xl font-bold mb-4">Configuration</h2>
                <AIMonitoringConfig
                    userId={userId}
                    initialConfig={result.data?.config || null}
                />
            </section>

            {/* Dashboard Section */}
            <section>
                <h2 className="text-2xl font-bold mb-4">Visibility Dashboard</h2>
                {/* Add AIVisibilityDashboard component here */}
            </section>

            {/* Mentions Section */}
            <section>
                <h2 className="text-2xl font-bold mb-4">Recent Mentions</h2>
                {/* Add AIMentionsList component here */}
            </section>
        </div>
    );
}
