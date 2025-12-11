'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface ActionItem {
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
}

interface ActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
    hoverColor?: string;
    badge?: string;
    badgeColor?: string;
    actions: readonly ActionItem[];
}

export function ActionCard({
    title,
    description,
    icon: Icon,
    iconColor,
    iconBgColor,
    hoverColor,
    badge,
    badgeColor,
    actions,
}: ActionCardProps) {
    return (
        <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
            <CardGradientMesh>
                <CardHeader className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 ${iconBgColor} rounded-xl group-hover:scale-110 transition-transform`}>
                            <Icon className={`h-6 w-6 ${iconColor}`} />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                        {badge && (
                            <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${badgeColor || 'bg-muted'}`}>
                                {badge}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 relative z-10">
                    {actions.map((action, index) => (
                        <div key={action.href}>
                            <Button variant="ghost" asChild className={`w-full justify-between h-auto p-3 ${hoverColor}`}>
                                <Link href={action.href} className="flex items-center">
                                    <div className="flex items-center gap-3">
                                        <action.icon className="h-4 w-4" />
                                        <div className="text-left">
                                            <div className="font-medium">{action.title}</div>
                                            <div className="text-xs text-muted-foreground">{action.description}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            {index < actions.length - 1 && <div className="border-t border-border/50" />}
                        </div>
                    ))}
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}