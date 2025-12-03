'use client';

/**
 * PWA Install Prompt Component
 * 
 * Shows a prompt to install the PWA when available
 * 
 * Requirements: 6.1
 */

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PWAInstallPrompt() {
    const { installState, showInstallPrompt } = usePWA();
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            setIsDismissed(true);
        }

        // Show prompt if can install and not dismissed
        if (installState.canInstall && !dismissed) {
            // Delay showing the prompt to avoid being intrusive
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [installState.canInstall]);

    const handleInstall = async () => {
        const accepted = await showInstallPrompt();
        if (accepted) {
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!isVisible || isDismissed || installState.isInstalled) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
            <Card className="p-4 shadow-lg border-2">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">
                            Install Bayon Coagent
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            Install our app for quick access and offline support
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleInstall}
                                className="flex-1"
                            >
                                Install
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                            >
                                Not now
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </Card>
        </div>
    );
}
