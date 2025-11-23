import React from 'react';

/**
 * Feature Toggle System
 * 
 * Manages which features/hubs are enabled for users.
 * Stored in localStorage for client-side persistence.
 */

export interface FeatureToggle {
    id: string;
    name: string;
    description: string;
    icon: string;
    enabled: boolean;
    category: 'hub' | 'feature';
    dependencies?: string[]; // Features that depend on this one
}

export const DEFAULT_FEATURES: FeatureToggle[] = [
    {
        id: 'studio',
        name: 'Studio Hub',
        description: 'AI content creation - Write, Describe, and Reimagine tools',
        icon: 'Wand2',
        enabled: true,
        category: 'hub'
    },
    {
        id: 'brand',
        name: 'Brand Hub',
        description: 'Brand identity and strategy - Profile, Audit, Competitors, Strategy',
        icon: 'Target',
        enabled: true,
        category: 'hub'
    },
    {
        id: 'research',
        name: 'Research Hub',
        description: 'AI-powered research and insights - Research Agent, Reports, Knowledge Base',
        icon: 'Search',
        enabled: true,
        category: 'hub'
    },
    {
        id: 'market',
        name: 'Market Hub',
        description: 'Market intelligence and trends - Insights, Opportunities, Analytics',
        icon: 'AISparkleIcon',
        enabled: true,
        category: 'hub'
    },
    {
        id: 'tools',
        name: 'Tools Hub',
        description: 'Deal analysis and calculations - Calculator, ROI, Valuation',
        icon: 'Calculator',
        enabled: true,
        category: 'hub'
    },
    {
        id: 'library',
        name: 'Library Hub',
        description: 'Content and knowledge management - Content, Reports, Media, Templates',
        icon: 'Library',
        enabled: true,
        category: 'hub'
    },
    {
        id: 'training',
        name: 'Training Hub',
        description: 'Learning and development resources',
        icon: 'GraduationCap',
        enabled: true,
        category: 'hub'
    },
    {
        id: 'assistant',
        name: 'AI Assistant',
        description: 'Chat-based AI assistant for real-time help',
        icon: 'MessageSquare',
        enabled: true,
        category: 'feature'
    }
];

const STORAGE_KEY = 'bayon-feature-toggles';

export class FeatureToggleManager {
    private features: Map<string, FeatureToggle> = new Map();

    constructor() {
        this.loadFeatures();
    }

    private loadFeatures(): void {
        try {
            // Check if we're in a browser environment
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const storedFeatures = JSON.parse(stored) as FeatureToggle[];
                    // Merge with defaults to handle new features
                    const mergedFeatures = this.mergeWithDefaults(storedFeatures);
                    mergedFeatures.forEach(feature => {
                        this.features.set(feature.id, feature);
                    });
                } else {
                    // First time - use defaults
                    DEFAULT_FEATURES.forEach(feature => {
                        this.features.set(feature.id, { ...feature });
                    });
                    this.saveFeatures();
                }
            } else {
                // Server-side or no localStorage - use defaults
                DEFAULT_FEATURES.forEach(feature => {
                    this.features.set(feature.id, { ...feature });
                });
            }
        } catch (error) {
            console.error('Failed to load feature toggles:', error);
            // Fallback to defaults
            DEFAULT_FEATURES.forEach(feature => {
                this.features.set(feature.id, { ...feature });
            });
        }
    }

    private mergeWithDefaults(stored: FeatureToggle[]): FeatureToggle[] {
        const storedMap = new Map(stored.map(f => [f.id, f]));

        return DEFAULT_FEATURES.map(defaultFeature => {
            const storedFeature = storedMap.get(defaultFeature.id);
            if (storedFeature) {
                // Keep user's enabled state but update other properties from defaults
                return {
                    ...defaultFeature,
                    enabled: storedFeature.enabled
                };
            }
            return { ...defaultFeature };
        });
    }

    private saveFeatures(): void {
        try {
            // Only save if we're in a browser environment
            if (typeof window !== 'undefined' && window.localStorage) {
                const featuresArray = Array.from(this.features.values());
                localStorage.setItem(STORAGE_KEY, JSON.stringify(featuresArray));
            }
        } catch (error) {
            console.error('Failed to save feature toggles:', error);
        }
    }

    public isEnabled(featureId: string): boolean {
        const feature = this.features.get(featureId);
        return feature?.enabled ?? false;
    }

    public getFeature(featureId: string): FeatureToggle | undefined {
        return this.features.get(featureId);
    }

    public getAllFeatures(): FeatureToggle[] {
        return Array.from(this.features.values());
    }

    public getFeaturesByCategory(category: 'hub' | 'feature'): FeatureToggle[] {
        return this.getAllFeatures().filter(f => f.category === category);
    }

    public toggleFeature(featureId: string): boolean {
        const feature = this.features.get(featureId);
        if (!feature) return false;

        feature.enabled = !feature.enabled;
        this.saveFeatures();

        // Trigger storage event for other components to react
        window.dispatchEvent(new CustomEvent('featureToggleChanged', {
            detail: { featureId, enabled: feature.enabled }
        }));

        return feature.enabled;
    }

    public setFeature(featureId: string, enabled: boolean): void {
        const feature = this.features.get(featureId);
        if (!feature) return;

        feature.enabled = enabled;
        this.saveFeatures();

        window.dispatchEvent(new CustomEvent('featureToggleChanged', {
            detail: { featureId, enabled }
        }));
    }

    public getEnabledHubs(): string[] {
        return this.getFeaturesByCategory('hub')
            .filter(f => f.enabled)
            .map(f => f.id);
    }

    public resetToDefaults(): void {
        DEFAULT_FEATURES.forEach(feature => {
            this.features.set(feature.id, { ...feature });
        });
        this.saveFeatures();

        window.dispatchEvent(new CustomEvent('featureToggleReset'));
    }
}

// Singleton instance
export const featureToggleManager = new FeatureToggleManager();

// React hook for using feature toggles
export function useFeatureToggle(featureId: string) {
    const [enabled, setEnabled] = React.useState(() =>
        featureToggleManager.isEnabled(featureId)
    );

    React.useEffect(() => {
        const handleToggleChange = (event: CustomEvent) => {
            if (event.detail.featureId === featureId) {
                setEnabled(event.detail.enabled);
            }
        };

        const handleReset = () => {
            setEnabled(featureToggleManager.isEnabled(featureId));
        };

        window.addEventListener('featureToggleChanged', handleToggleChange as EventListener);
        window.addEventListener('featureToggleReset', handleReset);

        return () => {
            window.removeEventListener('featureToggleChanged', handleToggleChange as EventListener);
            window.removeEventListener('featureToggleReset', handleReset);
        };
    }, [featureId]);

    const toggle = React.useCallback(() => {
        const newState = featureToggleManager.toggleFeature(featureId);
        setEnabled(newState);
        return newState;
    }, [featureId]);

    return { enabled, toggle };
}

// React hook for getting all features
export function useFeatureToggles() {
    const [features, setFeatures] = React.useState(() =>
        featureToggleManager.getAllFeatures()
    );

    React.useEffect(() => {
        const handleChange = () => {
            setFeatures(featureToggleManager.getAllFeatures());
        };

        const handleReset = () => {
            setFeatures(featureToggleManager.getAllFeatures());
        };

        window.addEventListener('featureToggleChanged', handleChange);
        window.addEventListener('featureToggleReset', handleReset);

        return () => {
            window.removeEventListener('featureToggleChanged', handleChange);
            window.removeEventListener('featureToggleReset', handleReset);
        };
    }, []);

    return {
        features,
        toggleFeature: featureToggleManager.toggleFeature.bind(featureToggleManager),
        setFeature: featureToggleManager.setFeature.bind(featureToggleManager),
        resetToDefaults: featureToggleManager.resetToDefaults.bind(featureToggleManager),
        getEnabledHubs: featureToggleManager.getEnabledHubs.bind(featureToggleManager)
    };
}