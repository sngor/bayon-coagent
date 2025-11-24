'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertTriangle,
    RefreshCw,
    Wifi,
    WifiOff,
    Clock,
    Shield,
    HelpCircle,
    ExternalLink,
    Mail,
    Phone,
    MessageCircle,
    ArrowLeft,
    Home,
    Settings,
    Zap,
    Database,
    Server,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Enhanced error states with clear recovery steps and support contact
 * Following WCAG 2.1 AA accessibility standards
 */

interface ErrorStateProps {
    className?: string;
    onRetry?: () => void;
    onGoBack?: () => void;
    onContactSupport?: () => void;
    errorCode?: string;
    timestamp?: Date;
}

export function NetworkErrorState({
    className,
    onRetry,
    onGoBack,
    errorCode = "NET_001"
}: ErrorStateProps) {
    return (
        <Card className={cn("border-destructive/50", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <WifiOff className="h-10 w-10 text-destructive" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Connection Problem</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    We're having trouble connecting to our servers. This might be due to a
                    network issue or temporary service interruption.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onRetry} className="min-w-[140px]">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                    {onGoBack && (
                        <Button variant="outline" onClick={onGoBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    )}
                </div>

                <Alert className="max-w-md">
                    <Wifi className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Quick fixes to try:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                            <li>• Check your internet connection</li>
                            <li>• Refresh the page</li>
                            <li>• Try again in a few moments</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <div className="mt-4 text-xs text-muted-foreground">
                    Error Code: {errorCode} • {new Date().toLocaleTimeString()}
                </div>
            </CardContent>
        </Card>
    );
}

export function AuthenticationErrorState({
    className,
    onRetry,
    onGoBack,
    errorCode = "AUTH_001"
}: ErrorStateProps) {
    return (
        <Card className={cn("border-destructive/50", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <Shield className="h-10 w-10 text-destructive" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Your session has expired or you don't have permission to access this resource.
                    Please sign in again to continue.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={() => window.location.href = '/login'} className="min-w-[140px]">
                        <Shield className="h-4 w-4 mr-2" />
                        Sign In
                    </Button>
                    {onGoBack && (
                        <Button variant="outline" onClick={onGoBack}>
                            <Home className="h-4 w-4 mr-2" />
                            Go Home
                        </Button>
                    )}
                </div>

                <Alert className="max-w-md">
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Need help?</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                            <li>• Make sure you're using the correct credentials</li>
                            <li>• Clear your browser cache and cookies</li>
                            <li>• Contact support if the problem persists</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <div className="mt-4 text-xs text-muted-foreground">
                    Error Code: {errorCode} • {new Date().toLocaleTimeString()}
                </div>
            </CardContent>
        </Card>
    );
}

export function ServerErrorState({
    className,
    onRetry,
    onContactSupport,
    errorCode = "SRV_001"
}: ErrorStateProps) {
    return (
        <Card className={cn("border-destructive/50", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <Server className="h-10 w-10 text-destructive" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Server Error</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Something went wrong on our end. Our team has been notified and is working
                    to fix the issue. Please try again in a few minutes.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onRetry} className="min-w-[140px]">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                    <Button variant="outline" onClick={onContactSupport}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Support
                    </Button>
                </div>

                <Alert className="max-w-md">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                        <strong>What you can do:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                            <li>• Wait a few minutes and try again</li>
                            <li>• Check our status page for updates</li>
                            <li>• Contact support if urgent</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <div className="mt-4 text-xs text-muted-foreground">
                    Error Code: {errorCode} • {new Date().toLocaleTimeString()}
                </div>
            </CardContent>
        </Card>
    );
}

export function RateLimitErrorState({
    className,
    onRetry,
    resetTime,
    errorCode = "RATE_001"
}: ErrorStateProps & { resetTime?: Date }) {
    const timeUntilReset = resetTime ? Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60)) : 5;

    return (
        <Card className={cn("border-warning/50", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
                    <Zap className="h-10 w-10 text-warning" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Rate Limit Exceeded</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    You've made too many requests in a short time. Please wait a few minutes
                    before trying again to ensure optimal performance for all users.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onRetry} disabled={timeUntilReset > 0} className="min-w-[140px]">
                        <Clock className="h-4 w-4 mr-2" />
                        {timeUntilReset > 0 ? `Wait ${timeUntilReset}m` : 'Try Again'}
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/pricing', '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Upgrade Plan
                    </Button>
                </div>

                <Alert className="max-w-md">
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                        <strong>To avoid rate limits:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                            <li>• Space out your requests</li>
                            <li>• Consider upgrading your plan</li>
                            <li>• Use bulk operations when available</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <div className="mt-4 text-xs text-muted-foreground">
                    Error Code: {errorCode} • Resets in {timeUntilReset} minutes
                </div>
            </CardContent>
        </Card>
    );
}

export function ValidationErrorState({
    className,
    errors = [],
    onRetry,
    onGoBack,
    errorCode = "VAL_001"
}: ErrorStateProps & { errors?: string[] }) {
    return (
        <Card className={cn("border-destructive/50", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Validation Error</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    There are some issues with the information provided.
                    Please review and correct the following errors:
                </p>

                {errors.length > 0 && (
                    <Alert variant="destructive" className="max-w-md mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <ul className="space-y-1 text-sm">
                                {errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    {onGoBack && (
                        <Button onClick={onGoBack} className="min-w-[140px]">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back & Fix
                        </Button>
                    )}
                    {onRetry && (
                        <Button variant="outline" onClick={onRetry}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    )}
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                    Error Code: {errorCode} • {new Date().toLocaleTimeString()}
                </div>
            </CardContent>
        </Card>
    );
}

export function DataLoadErrorState({
    className,
    onRetry,
    onContactSupport,
    dataType = "content",
    errorCode = "DATA_001"
}: ErrorStateProps & { dataType?: string }) {
    return (
        <Card className={cn("border-destructive/50", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <Database className="h-10 w-10 text-destructive" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Failed to Load {dataType}</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    We couldn't load your {dataType} right now. This might be a temporary issue
                    with our data service. Please try refreshing the page.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onRetry} className="min-w-[140px]">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                    </Button>
                    <Button variant="outline" onClick={onContactSupport}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Report Issue
                    </Button>
                </div>

                <Alert className="max-w-md">
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Troubleshooting steps:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                            <li>• Refresh the page</li>
                            <li>• Check your internet connection</li>
                            <li>• Try again in a few minutes</li>
                            <li>• Clear browser cache if problem persists</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <div className="mt-4 text-xs text-muted-foreground">
                    Error Code: {errorCode} • {new Date().toLocaleTimeString()}
                </div>
            </CardContent>
        </Card>
    );
}

export function SocialMediaConnectionErrorState({
    className,
    onRetry,
    onReconnect,
    platform = "social media",
    errorCode = "SOCIAL_001"
}: ErrorStateProps & { onReconnect?: () => void; platform?: string }) {
    return (
        <Card className={cn("border-warning/50", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
                    <Globe className="h-10 w-10 text-warning" />
                </div>

                <h3 className="text-xl font-semibold mb-2">{platform} Connection Issue</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    We're having trouble connecting to your {platform} account.
                    This might be due to expired permissions or account changes.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onReconnect} className="min-w-[140px]">
                        <Wifi className="h-4 w-4 mr-2" />
                        Reconnect Account
                    </Button>
                    <Button variant="outline" onClick={onRetry}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </div>

                <Alert className="max-w-md">
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Common solutions:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                            <li>• Reconnect your {platform} account</li>
                            <li>• Check account permissions</li>
                            <li>• Verify account is still active</li>
                            <li>• Contact support if issue persists</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <div className="mt-4 text-xs text-muted-foreground">
                    Error Code: {errorCode} • {new Date().toLocaleTimeString()}
                </div>
            </CardContent>
        </Card>
    );
}

// Support contact component
export function SupportContactInfo({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-muted-foreground", className)}>
            <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@bayon.ai" className="hover:text-foreground transition-colors">
                    support@bayon.ai
                </a>
            </div>
            <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <button className="hover:text-foreground transition-colors">
                    Live Chat
                </button>
            </div>
            <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <a href="/help" className="hover:text-foreground transition-colors">
                    Help Center
                </a>
            </div>
        </div>
    );
}