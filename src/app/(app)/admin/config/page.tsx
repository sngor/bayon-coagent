'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Flag, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConfigPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Configuration</h1>
                <p className="text-muted-foreground mt-2">
                    Manage feature flags and platform settings
                </p>
            </div>

            {/* Configuration Options */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Feature Flags */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/config/features')}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Flag className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Feature Flags</CardTitle>
                                <CardDescription>Control feature rollout and availability</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Manage feature flags to control which features are available to users. Configure rollout percentages, target specific users or roles, and enable/disable features instantly.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Enable or disable features instantly
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Gradual rollout with percentage control
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Target specific users or roles
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                A/B testing support
                            </li>
                        </ul>
                        <Button className="w-full" onClick={(e) => {
                            e.stopPropagation();
                            router.push('/admin/config/features');
                        }}>
                            Manage Feature Flags
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Platform Settings */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/config/settings')}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Settings className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Platform Settings</CardTitle>
                                <CardDescription>Configure platform-wide preferences</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Configure platform-wide settings across different categories including general, AI, billing, email, and security settings.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                General platform configuration
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                AI model and token settings
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Billing and payment configuration
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Email and security settings
                            </li>
                        </ul>
                        <Button className="w-full" onClick={(e) => {
                            e.stopPropagation();
                            router.push('/admin/config/settings');
                        }}>
                            Manage Settings
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Info Card */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-lg">Configuration Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="text-primary font-bold">1.</div>
                        <div>
                            <strong>Test in Development:</strong> Always test feature flags and settings in a development environment before applying to production.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="text-primary font-bold">2.</div>
                        <div>
                            <strong>Gradual Rollout:</strong> Use rollout percentages to gradually enable features for a subset of users before full deployment.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="text-primary font-bold">3.</div>
                        <div>
                            <strong>Monitor Impact:</strong> Watch system health and user feedback when enabling new features or changing settings.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="text-primary font-bold">4.</div>
                        <div>
                            <strong>Document Changes:</strong> All configuration changes are logged in the audit trail for compliance and troubleshooting.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
