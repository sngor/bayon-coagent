'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/common';
import type { AIMonitoringConfig } from '@/lib/types/common/common';

interface AIMonitoringConfigProps {
    userId: string;
    initialConfig?: AIMonitoringConfig | null;
    onSave?: (config: Partial<AIMonitoringConfig>) => Promise<void>;
}

const PLATFORM_OPTIONS = [
    { id: 'chatgpt', label: 'ChatGPT', description: 'OpenAI ChatGPT' },
    { id: 'perplexity', label: 'Perplexity', description: 'Perplexity AI' },
    { id: 'claude', label: 'Claude', description: 'Anthropic Claude' },
    { id: 'gemini', label: 'Gemini', description: 'Google Gemini' },
] as const;

const FREQUENCY_OPTIONS = [
    { value: 'daily', label: 'Daily', description: 'Check every day' },
    { value: 'weekly', label: 'Weekly', description: 'Check once per week' },
    { value: 'monthly', label: 'Monthly', description: 'Check once per month' },
] as const;

export function AIMonitoringConfig({
    userId,
    initialConfig,
    onSave,
}: AIMonitoringConfigProps) {
    const [enabled, setEnabled] = useState(initialConfig?.enabled ?? false);
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
        initialConfig?.frequency ?? 'weekly'
    );
    const [platforms, setPlatforms] = useState<Array<'chatgpt' | 'perplexity' | 'claude' | 'gemini'>>(
        initialConfig?.platforms ?? ['chatgpt', 'perplexity', 'claude', 'gemini']
    );
    const [alertThreshold, setAlertThreshold] = useState(
        initialConfig?.alertThreshold ?? 20
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Reset save status after 3 seconds
    useEffect(() => {
        if (saveStatus !== 'idle') {
            const timer = setTimeout(() => {
                setSaveStatus('idle');
                setErrorMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    const handlePlatformToggle = (platformId: 'chatgpt' | 'perplexity' | 'claude' | 'gemini') => {
        setPlatforms((prev) => {
            if (prev.includes(platformId)) {
                // Don't allow removing the last platform
                if (prev.length === 1) {
                    return prev;
                }
                return prev.filter((p) => p !== platformId);
            } else {
                return [...prev, platformId];
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        setErrorMessage('');

        try {
            const config: Partial<AIMonitoringConfig> = {
                enabled,
                frequency,
                platforms,
                alertThreshold,
            };

            if (onSave) {
                await onSave(config);
            } else {
                // Default save action using server action
                const { updateAIMonitoringConfigAction } = await import('@/app/actions');
                const result = await updateAIMonitoringConfigAction(userId, config);

                if (result.message !== 'success') {
                    throw new Error(result.message);
                }
            }

            setSaveStatus('success');
        } catch (error) {
            console.error('Failed to save monitoring config:', error);
            setSaveStatus('error');
            setErrorMessage(
                error instanceof Error ? error.message : 'Failed to save configuration'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = () => {
        if (!initialConfig) return true;
        return (
            enabled !== initialConfig.enabled ||
            frequency !== initialConfig.frequency ||
            JSON.stringify(platforms.sort()) !== JSON.stringify(initialConfig.platforms.sort()) ||
            alertThreshold !== initialConfig.alertThreshold
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Monitoring Configuration
                </CardTitle>
                <CardDescription>
                    Configure how often we check AI platforms for mentions of your name
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Enable/Disable Monitoring */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="enabled" className="text-base">
                            Enable AI Monitoring
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically track your visibility in AI search results
                        </p>
                    </div>
                    <Switch
                        id="enabled"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                    />
                </div>

                {/* Monitoring Frequency */}
                <div className="space-y-3">
                    <Label htmlFor="frequency">Monitoring Frequency</Label>
                    <Select
                        value={frequency}
                        onValueChange={(value) =>
                            setFrequency(value as 'daily' | 'weekly' | 'monthly')
                        }
                        disabled={!enabled}
                    >
                        <SelectTrigger id="frequency">
                            <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                            {FREQUENCY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <div className="flex flex-col">
                                        <span>{option.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {option.description}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        More frequent monitoring provides better insights but uses more API credits
                    </p>
                </div>

                {/* Platform Selection */}
                <div className="space-y-3">
                    <Label>AI Platforms to Monitor</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {PLATFORM_OPTIONS.map((platform) => (
                            <div
                                key={platform.id}
                                className={cn(
                                    'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                                    platforms.includes(platform.id)
                                        ? 'bg-primary/5 border-primary'
                                        : 'bg-muted/50 border-border',
                                    !enabled && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <Checkbox
                                    id={platform.id}
                                    checked={platforms.includes(platform.id)}
                                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                                    disabled={!enabled || (platforms.length === 1 && platforms.includes(platform.id))}
                                />
                                <div className="flex-1">
                                    <Label
                                        htmlFor={platform.id}
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        {platform.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {platform.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Select at least one platform to monitor. More platforms provide better coverage.
                    </p>
                </div>

                {/* Alert Threshold */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="alertThreshold">Alert Threshold</Label>
                        <Badge variant="secondary">{alertThreshold}%</Badge>
                    </div>
                    <Slider
                        id="alertThreshold"
                        min={5}
                        max={50}
                        step={5}
                        value={[alertThreshold]}
                        onValueChange={(value) => setAlertThreshold(value[0])}
                        disabled={!enabled}
                        className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                        Get notified when your visibility score changes by more than this percentage
                    </p>
                </div>

                {/* Save Status */}
                {saveStatus !== 'idle' && (
                    <div
                        className={cn(
                            'flex items-center gap-2 p-3 rounded-lg text-sm',
                            saveStatus === 'success' && 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
                            saveStatus === 'error' && 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
                        )}
                    >
                        {saveStatus === 'success' ? (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Configuration saved successfully</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-4 w-4" />
                                <span>{errorMessage || 'Failed to save configuration'}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Save Button */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        {initialConfig?.lastExecuted
                            ? `Last checked: ${new Date(initialConfig.lastExecuted).toLocaleDateString()}`
                            : 'Not yet monitored'}
                    </p>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges()}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        How AI Monitoring Works
                    </h4>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• We query selected AI platforms with market-specific questions</li>
                        <li>• Your mentions are analyzed for sentiment and context</li>
                        <li>• Visibility scores are calculated based on frequency and prominence</li>
                        <li>• You'll receive alerts when significant changes are detected</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
