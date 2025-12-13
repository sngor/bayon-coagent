'use client';

import React from 'react';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { EnhancedFormField, EnhancedFormSection } from '@/components/ui/enhanced-form';
import { AccessibilityToolbar } from '@/components/ui/accessibility-toolbar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Accessibility,
    Eye,
    Type,
    Contrast,
    MousePointer,
    Keyboard,
    Volume2,
    Monitor,
    Smartphone,
    Tablet
} from 'lucide-react';

export function AccessibilitySettings() {
    return (
        <div className="space-y-8">
            {/* Main Accessibility Controls */}
            <EnhancedCard
                title="Accessibility Preferences"
                description="Customize the interface to meet your accessibility needs"
                icon={Accessibility}
                variant="elevated"
                size="lg"
            >
                <div className="space-y-8">
                    {/* Quick Access Toolbar */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Quick Access Toolbar</h3>
                                <p className="text-sm text-muted-foreground">
                                    Use the toolbar below to quickly adjust accessibility settings
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center p-6 bg-muted/30 rounded-xl border border-border/50">
                            <AccessibilityToolbar />
                        </div>
                    </div>

                    <Separator />

                    {/* Visual Preferences */}
                    <EnhancedFormSection
                        title="Visual Preferences"
                        description="Adjust visual elements for better readability"
                        icon={Eye}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <EnhancedFormField
                                label="High Contrast Mode"
                                id="highContrast"
                                helpText="Increases contrast for better visibility"
                            >
                                <div className="flex items-center space-x-2">
                                    <Switch id="highContrast" />
                                    <Label htmlFor="highContrast" className="text-sm">
                                        Enable high contrast borders and colors
                                    </Label>
                                </div>
                            </EnhancedFormField>

                            <EnhancedFormField
                                label="Large Text"
                                id="largeText"
                                helpText="Increases font size across the application"
                            >
                                <div className="flex items-center space-x-2">
                                    <Switch id="largeText" />
                                    <Label htmlFor="largeText" className="text-sm">
                                        Use larger text size
                                    </Label>
                                </div>
                            </EnhancedFormField>

                            <EnhancedFormField
                                label="Reduced Motion"
                                id="reducedMotion"
                                helpText="Minimizes animations and transitions"
                            >
                                <div className="flex items-center space-x-2">
                                    <Switch id="reducedMotion" />
                                    <Label htmlFor="reducedMotion" className="text-sm">
                                        Reduce animations and motion effects
                                    </Label>
                                </div>
                            </EnhancedFormField>

                            <EnhancedFormField
                                label="Enhanced Focus"
                                id="enhancedFocus"
                                helpText="Stronger focus indicators for keyboard navigation"
                            >
                                <div className="flex items-center space-x-2">
                                    <Switch id="enhancedFocus" defaultChecked />
                                    <Label htmlFor="enhancedFocus" className="text-sm">
                                        Show enhanced focus indicators
                                    </Label>
                                </div>
                            </EnhancedFormField>
                        </div>
                    </EnhancedFormSection>

                    <Separator />

                    {/* Navigation Preferences */}
                    <EnhancedFormSection
                        title="Navigation Preferences"
                        description="Customize how you navigate through the application"
                        icon={MousePointer}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <EnhancedFormField
                                label="Keyboard Navigation"
                                id="keyboardNav"
                                helpText="Optimize interface for keyboard-only navigation"
                            >
                                <div className="flex items-center space-x-2">
                                    <Switch id="keyboardNav" defaultChecked />
                                    <Label htmlFor="keyboardNav" className="text-sm">
                                        Enable keyboard navigation shortcuts
                                    </Label>
                                </div>
                            </EnhancedFormField>

                            <EnhancedFormField
                                label="Screen Reader Support"
                                id="screenReader"
                                helpText="Optimize for screen reader software"
                            >
                                <div className="flex items-center space-x-2">
                                    <Switch id="screenReader" />
                                    <Label htmlFor="screenReader" className="text-sm">
                                        Enable screen reader optimizations
                                    </Label>
                                </div>
                            </EnhancedFormField>
                        </div>
                    </EnhancedFormSection>

                    <Separator />

                    {/* Device-Specific Settings */}
                    <EnhancedFormSection
                        title="Device Preferences"
                        description="Optimize the interface for your preferred devices"
                        icon={Monitor}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-primary" />
                                    <Label className="font-medium">Desktop</Label>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="desktopTooltips" defaultChecked />
                                        <Label htmlFor="desktopTooltips" className="text-xs">
                                            Show hover tooltips
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch id="desktopShortcuts" defaultChecked />
                                        <Label htmlFor="desktopShortcuts" className="text-xs">
                                            Enable keyboard shortcuts
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Tablet className="w-4 h-4 text-primary" />
                                    <Label className="font-medium">Tablet</Label>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="tabletGestures" defaultChecked />
                                        <Label htmlFor="tabletGestures" className="text-xs">
                                            Enable touch gestures
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch id="tabletLargerTargets" defaultChecked />
                                        <Label htmlFor="tabletLargerTargets" className="text-xs">
                                            Larger touch targets
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-primary" />
                                    <Label className="font-medium">Mobile</Label>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="mobileHaptics" defaultChecked />
                                        <Label htmlFor="mobileHaptics" className="text-xs">
                                            Haptic feedback
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch id="mobileSimplified" />
                                        <Label htmlFor="mobileSimplified" className="text-xs">
                                            Simplified interface
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </EnhancedFormSection>
                </div>
            </EnhancedCard>

            {/* Accessibility Information */}
            <EnhancedCard
                title="Accessibility Information"
                description="Learn about the accessibility features available"
                icon={Volume2}
                variant="default"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Keyboard className="w-4 h-4" />
                                Keyboard Shortcuts
                            </h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Toggle sidebar:</span>
                                    <code className="bg-muted px-2 py-1 rounded text-xs">Ctrl/Cmd + B</code>
                                </div>
                                <div className="flex justify-between">
                                    <span>Search:</span>
                                    <code className="bg-muted px-2 py-1 rounded text-xs">Ctrl/Cmd + K</code>
                                </div>
                                <div className="flex justify-between">
                                    <span>Navigate tabs:</span>
                                    <code className="bg-muted px-2 py-1 rounded text-xs">Arrow Keys</code>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Type className="w-4 h-4" />
                                Screen Reader Support
                            </h4>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p>
                                    This application is optimized for screen readers including NVDA, JAWS, and VoiceOver.
                                </p>
                                <p>
                                    All interactive elements have proper ARIA labels and the content follows semantic HTML structure.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Need help with accessibility features? Contact our support team.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            This application follows WCAG 2.1 AA accessibility guidelines.
                        </p>
                    </div>
                </div>
            </EnhancedCard>
        </div>
    );
}