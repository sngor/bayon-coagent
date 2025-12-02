'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Clock, TrendingUp, Users } from 'lucide-react';
import type { SessionTemplate } from '@/lib/open-house/types';

interface TemplateCardProps {
    template: SessionTemplate;
    onEdit: (template: SessionTemplate) => void;
    onDelete: (templateId: string) => void;
    onUse: (template: SessionTemplate) => void;
}

export function TemplateCard({ template, onEdit, onDelete, onUse }: TemplateCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.description && (
                            <CardDescription className="mt-1">
                                {template.description}
                            </CardDescription>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(template)}
                            title="Edit template"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(template.templateId)}
                            title="Delete template"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {template.propertyType && (
                        <Badge variant="secondary">{template.propertyType}</Badge>
                    )}
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.typicalDuration} min
                    </Badge>
                </div>

                {/* Usage Statistics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{template.usageCount}</div>
                        <div className="text-xs text-muted-foreground">Times Used</div>
                    </div>
                    {template.averageVisitors !== undefined && (
                        <div className="text-center">
                            <div className="text-2xl font-bold flex items-center justify-center gap-1">
                                <Users className="h-4 w-4" />
                                {template.averageVisitors.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">Avg Visitors</div>
                        </div>
                    )}
                    {template.averageInterestLevel !== undefined && (
                        <div className="text-center">
                            <div className="text-2xl font-bold flex items-center justify-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {template.averageInterestLevel.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Avg Interest</div>
                        </div>
                    )}
                </div>

                <Button
                    className="w-full"
                    onClick={() => onUse(template)}
                >
                    Use Template
                </Button>
            </CardContent>
        </Card>
    );
}
