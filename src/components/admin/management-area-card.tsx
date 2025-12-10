/**
 * Reusable Management Area Card Component
 * Reduces code duplication in super admin dashboard
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface ManagementAreaCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBgColor: string;
    hoverBgColor: string;
    metrics?: Array<{
        label: string;
        value: string | number;
        bgColor: string;
    }>;
    actions: Array<{
        label: string;
        href: string;
    }>;
}

export function ManagementAreaCard({
    title,
    description,
    icon,
    iconBgColor,
    hoverBgColor,
    metrics = [],
    actions
}: ManagementAreaCardProps) {
    return (
        <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-background/50 border-primary/20">
            <CardGradientMesh>
                <CardHeader className="relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 ${iconBgColor} rounded-xl group-hover:${iconBgColor.replace('100', '200').replace('900/50', '800/50')} transition-colors`}>
                            {icon}
                        </div>
                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                    {metrics.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {metrics.map((metric, index) => (
                                <div key={index} className={`text-center p-3 ${metric.bgColor} rounded-lg`}>
                                    <div className="font-bold text-lg">{metric.value}</div>
                                    <div className="text-muted-foreground">{metric.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="space-y-2">
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                asChild
                                className={`w-full ${hoverBgColor}`}
                            >
                                <Link href={action.href}>
                                    {action.label}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}