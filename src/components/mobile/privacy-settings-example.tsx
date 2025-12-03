/**
 * Example usage of the Privacy Settings component
 * 
 * This file demonstrates how to integrate the privacy settings
 * into your application.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Shield } from 'lucide-react';
import { PrivacySettings } from './privacy-settings';

/**
 * Example 1: Privacy Settings in a Sheet (Mobile-friendly)
 */
export function PrivacySettingsSheet() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy & Security
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                <PrivacySettings onClose={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

/**
 * Example 2: Privacy Settings in a Full Page
 */
export function PrivacySettingsPage() {
    return (
        <div className="container max-w-4xl mx-auto py-8">
            <PrivacySettings />
        </div>
    );
}

/**
 * Example 3: Privacy Settings in Settings Tab
 */
export function SettingsWithPrivacy() {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b">
                <Button
                    variant={activeTab === 'general' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('general')}
                >
                    General
                </Button>
                <Button
                    variant={activeTab === 'privacy' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('privacy')}
                >
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy & Security
                </Button>
                <Button
                    variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('notifications')}
                >
                    Notifications
                </Button>
            </div>

            {activeTab === 'general' && (
                <div>
                    <h2 className="text-xl font-bold mb-4">General Settings</h2>
                    {/* General settings content */}
                </div>
            )}

            {activeTab === 'privacy' && <PrivacySettings />}

            {activeTab === 'notifications' && (
                <div>
                    <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
                    {/* Notification settings content */}
                </div>
            )}
        </div>
    );
}

/**
 * Example 4: Quick Privacy Actions Menu
 */
export function QuickPrivacyMenu() {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
            >
                <Shield className="h-5 w-5" />
            </Button>

            {showSettings && (
                <div className="absolute right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg p-4 z-50">
                    <PrivacySettings onClose={() => setShowSettings(false)} />
                </div>
            )}
        </div>
    );
}
