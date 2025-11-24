'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Wand2,
    Target,
    Calculator,
    Library,
    GraduationCap,
    MessageSquare,
    RotateCcw,
    AlertTriangle,
    Info,
    Search
} from 'lucide-react';
import { AISparkleIcon } from '@/components/ui/real-estate-icons';
import { useFeatureToggles, type FeatureToggle } from '@/lib/feature-toggles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

const iconMap = {
    'Wand2': Wand2,
    'Target': Target,
    'Search': Search,
    'AISparkleIcon': AISparkleIcon,
    'Calculator': Calculator,
    'Library': Library,
    'GraduationCap': GraduationCap,
    'MessageSquare': MessageSquare,
};

export function FeatureToggles() {
    const { features, toggleFeature, resetToDefaults } = useFeatureToggles();
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const hubs = features.filter(f => f.category === 'hub');
    const otherFeatures = features.filter(f => f.category === 'feature');
    const enabledHubsCount = hubs.filter(f => f.enabled).length;

    const handleToggle = (featureId: string) => {
        toggleFeature(featureId);
    };

    const handleReset = () => {
        if (showResetConfirm) {
            resetToDefaults();
            setShowResetConfirm(false);
        } else {
            setShowResetConfirm(true);
            // Auto-hide confirmation after 5 seconds
            setTimeout(() => setShowResetConfirm(false), 5000);
        }
    };

    const getIcon = (iconName: string) => {
        const IconComponent = iconMap[iconName as keyof typeof iconMap];
        if (IconComponent === AISparkleIcon) {
            return <AISparkleIcon className="h-5 w-5" />;
        }
        return IconComponent ? <IconComponent className="h-5 w-5" /> : <Info className="h-5 w-5" />;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Feature Controls</span>
                        <Badge variant="secondary" className="text-xs">
                            {enabledHubsCount} of {hubs.length} hubs enabled
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Control which features and hubs are available in your workspace.
                        Disabled features will be hidden from navigation and won't be accessible.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {enabledHubsCount === 0 && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Warning: All hubs are disabled. You won't be able to access any main features.
                                Consider enabling at least one hub.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Hub Features */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-headline text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Main Hubs
                            </h4>
                            <Button
                                variant={showResetConfirm ? "destructive" : "outline"}
                                size="sm"
                                onClick={handleReset}
                                className="gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                {showResetConfirm ? "Confirm Reset" : "Reset All"}
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {hubs.map((feature) => (
                                <FeatureToggleItem
                                    key={feature.id}
                                    feature={feature}
                                    onToggle={handleToggle}
                                    icon={getIcon(feature.icon)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Other Features */}
                    {otherFeatures.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-headline text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Additional Features
                            </h4>

                            <div className="grid gap-4">
                                {otherFeatures.map((feature) => (
                                    <FeatureToggleItem
                                        key={feature.id}
                                        feature={feature}
                                        onToggle={handleToggle}
                                        icon={getIcon(feature.icon)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                                <p className="font-medium mb-1">About Feature Toggles</p>
                                <p>
                                    Feature toggles allow you to customize your workspace by hiding features you don't use.
                                    Changes take effect immediately and are saved locally in your browser.
                                    You can always re-enable features later.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface FeatureToggleItemProps {
    feature: FeatureToggle;
    onToggle: (featureId: string) => void;
    icon: React.ReactNode;
}

function FeatureToggleItem({ feature, onToggle, icon }: FeatureToggleItemProps) {
    return (
        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className={`rounded-md p-2 flex-shrink-0 ${feature.enabled
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
                }`}>
                {icon}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <Label
                        htmlFor={`toggle-${feature.id}`}
                        className="text-sm font-medium cursor-pointer"
                    >
                        {feature.name}
                    </Label>
                    <Switch
                        id={`toggle-${feature.id}`}
                        checked={feature.enabled}
                        onCheckedChange={() => onToggle(feature.id)}
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    {feature.description}
                </p>
                {feature.category === 'hub' && (
                    <Badge
                        variant={feature.enabled ? "default" : "secondary"}
                        className="mt-2 text-xs"
                    >
                        Hub
                    </Badge>
                )}
            </div>
        </div>
    );
}