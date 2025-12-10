'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { AdminQuickActionItem } from '@/lib/admin/admin-config';

interface AdminQuickActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
    actions: AdminQuickActionItem[];
}

export function AdminQuickActionCard({
    title,
    description,
    icon: Icon,
    iconColor,
    iconBgColor,
    actions
}: AdminQuickActionCardProps) {
    return (
        <Card className="overflow-hidden bg-background/50 border-primary/20">
            <CardGradientMesh>
                <CardHeader className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 ${iconBgColor} rounded-xl`}>
                            <Icon className={`h-6 w-6 ${iconColor}`} />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 relative z-10">
                    {actions.map((action) => (
                        <Button
                            key={action.href}
                            variant="ghost"
                            asChild
                            className="w-full justify-start"
                        >
                            <Link href={action.href}>
                                <action.icon className="mr-2 h-4 w-4" />
                                {action.label}
                            </Link>
                        </Button>
                    ))}
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}