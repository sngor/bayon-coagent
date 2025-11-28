'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Users, Settings, Shield } from 'lucide-react';

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                    <p className="text-muted-foreground">Manage your team and organization settings</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-muted-foreground">+2 from last month</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-2xl font-bold">5</div>
                            <p className="text-xs text-muted-foreground">3 pending review</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">System Status</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-2xl font-bold text-green-600">Healthy</div>
                            <p className="text-xs text-muted-foreground">All systems operational</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>
        </div>
    );
}
