'use client';

/**
 * Multi-Angle Staging Guide Component
 * 
 * Visual guide explaining how multi-angle staging works
 */

import { Info, Upload, Sparkles, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MultiAngleGuide() {
    const steps = [
        {
            icon: Upload,
            title: 'Upload First Angle',
            description: 'Upload your first room image and choose style',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
        },
        {
            icon: Sparkles,
            title: 'AI Stages & Learns',
            description: 'AI stages the room and extracts furniture details',
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-950',
        },
        {
            icon: ImageIcon,
            title: 'Add More Angles',
            description: 'Upload additional angles from different perspectives',
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-950',
        },
        {
            icon: CheckCircle,
            title: 'Consistent Results',
            description: 'AI matches furniture across all angles automatically',
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-950',
        },
    ];

    return (
        <Card className="border-2 border-dashed">
            <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-6">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-1">How Multi-Angle Staging Works</h3>
                        <p className="text-sm text-muted-foreground">
                            Stage the same room from multiple angles with consistent furniture
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {steps.map((step, index) => (
                        <div key={index} className="relative">
                            <div className={`rounded-lg p-4 ${step.bgColor} border border-current/20`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="secondary" className="text-xs">
                                        Step {index + 1}
                                    </Badge>
                                </div>
                                <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-3 ${step.bgColor}`}>
                                    <step.icon className={`h-6 w-6 ${step.color}`} />
                                </div>
                                <h4 className="font-semibold mb-1 text-sm">{step.title}</h4>
                                <p className="text-xs text-muted-foreground">{step.description}</p>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                                    <div className="w-4 h-0.5 bg-border" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Pro Tip:</strong> For best results, use images of the same room taken from different corners or viewpoints. The AI will maintain furniture consistency while adapting to each perspective.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
