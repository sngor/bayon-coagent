'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
    Accessibility,
    Eye,
    Type,
    Contrast,
    MousePointer,
    Keyboard,
    Volume2,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils/common';

interface AccessibilityPreferences {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    focusIndicators: boolean;
    screenReaderOptimized: boolean;
    keyboardNavigation: boolean;
}

export function AccessibilityToolbar({ className }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [preferences, setPreferences] = useState<AccessibilityPreferences>({
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        focusIndicators: true,
        screenReaderOptimized: false,
        keyboardNavigation: true,
    });

    // Load preferences from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('accessibility-preferences');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPreferences(parsed);
                applyPreferences(parsed);
            } catch (error) {
                console.error('Failed to parse accessibility preferences:', error);
            }
        }
    }, []);

    // Save preferences to localStorage and apply them
    const updatePreference = (key: keyof AccessibilityPreferences, value: boolean) => {
        const newPreferences = { ...preferences, [key]: value };
        setPreferences(newPreferences);
        localStorage.setItem('accessibility-preferences', JSON.stringify(newPreferences));
        applyPreferences(newPreferences);
    };

    // Apply preferences to the document
    const applyPreferences = (prefs: AccessibilityPreferences) => {
        const root = document.documentElement;

        // High contrast
        if (prefs.highContrast) {
            root.classList.add('high-contrast-borders');
            root.style.setProperty('--accessibility-border-override', '#000000');
        } else {
            root.classList.remove('high-contrast-borders');
            root.style.removeProperty('--accessibility-border-override');
        }

        // Large text
        if (prefs.largeText) {
            root.style.fontSize = '18px';
        } else {
            root.style.fontSize = '';
        }

        // Reduced motion
        if (prefs.reducedMotion) {
            root.style.setProperty('--animation-duration', '0.01ms');
            root.classList.add('animations-disabled');
        } else {
            root.style.removeProperty('--animation-duration');
            root.classList.remove('animations-disabled');
        }

        // Enhanced focus indicators
        if (prefs.focusIndicators) {
            root.classList.add('enhanced-focus');
        } else {
            root.classList.remove('enhanced-focus');
        }

        // Screen reader optimizations
        if (prefs.screenReaderOptimized) {
            root.classList.add('screen-reader-optimized');
        } else {
            root.classList.remove('screen-reader-optimized');
        }
    };

    const activePreferencesCount = Object.values(preferences).filter(Boolean).length;

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "relative h-9 w-9 rounded-full",
                        activePreferencesCount > 0 && "bg-primary/10 text-primary",
                        className
                    )}
                    aria-label="Accessibility options"
                >
                    <Accessibility className="h-4 w-4" />
                    {activePreferencesCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                        >
                            {activePreferencesCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Accessibility className="h-4 w-4" />
                    Accessibility Options
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Visual Preferences */}
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
                    Visual
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                    checked={preferences.highContrast}
                    onCheckedChange={(checked) => updatePreference('highContrast', checked)}
                    className="flex items-center gap-2"
                >
                    <Contrast className="h-4 w-4" />
                    <div className="flex-1">
                        <div className="font-medium">High Contrast</div>
                        <div className="text-xs text-muted-foreground">Stronger borders and colors</div>
                    </div>
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                    checked={preferences.largeText}
                    onCheckedChange={(checked) => updatePreference('largeText', checked)}
                    className="flex items-center gap-2"
                >
                    <Type className="h-4 w-4" />
                    <div className="flex-1">
                        <div className="font-medium">Large Text</div>
                        <div className="text-xs text-muted-foreground">Increase font size</div>
                    </div>
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                {/* Motion Preferences */}
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
                    Motion
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                    checked={preferences.reducedMotion}
                    onCheckedChange={(checked) => updatePreference('reducedMotion', checked)}
                    className="flex items-center gap-2"
                >
                    <Eye className="h-4 w-4" />
                    <div className="flex-1">
                        <div className="font-medium">Reduced Motion</div>
                        <div className="text-xs text-muted-foreground">Minimize animations</div>
                    </div>
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                {/* Navigation Preferences */}
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
                    Navigation
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                    checked={preferences.focusIndicators}
                    onCheckedChange={(checked) => updatePreference('focusIndicators', checked)}
                    className="flex items-center gap-2"
                >
                    <MousePointer className="h-4 w-4" />
                    <div className="flex-1">
                        <div className="font-medium">Enhanced Focus</div>
                        <div className="text-xs text-muted-foreground">Stronger focus indicators</div>
                    </div>
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                    checked={preferences.keyboardNavigation}
                    onCheckedChange={(checked) => updatePreference('keyboardNavigation', checked)}
                    className="flex items-center gap-2"
                >
                    <Keyboard className="h-4 w-4" />
                    <div className="flex-1">
                        <div className="font-medium">Keyboard Navigation</div>
                        <div className="text-xs text-muted-foreground">Optimize for keyboard use</div>
                    </div>
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                    checked={preferences.screenReaderOptimized}
                    onCheckedChange={(checked) => updatePreference('screenReaderOptimized', checked)}
                    className="flex items-center gap-2"
                >
                    <Volume2 className="h-4 w-4" />
                    <div className="flex-1">
                        <div className="font-medium">Screen Reader</div>
                        <div className="text-xs text-muted-foreground">Optimize for screen readers</div>
                    </div>
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => {
                        const defaultPrefs: AccessibilityPreferences = {
                            highContrast: false,
                            largeText: false,
                            reducedMotion: false,
                            focusIndicators: true,
                            screenReaderOptimized: false,
                            keyboardNavigation: true,
                        };
                        setPreferences(defaultPrefs);
                        localStorage.setItem('accessibility-preferences', JSON.stringify(defaultPrefs));
                        applyPreferences(defaultPrefs);
                    }}
                    className="flex items-center gap-2 text-muted-foreground"
                >
                    <Settings className="h-4 w-4" />
                    Reset to Defaults
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}