/**
 * Life Events Tab Component
 * 
 * Displays life event predictions cards
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, MapPin } from 'lucide-react';
import { getLifeEventIcon, getLifeEventLabel, getImpactColor } from '@/lib/utils/market-insights-utils';
import type { LifeEvent } from '@/lib/types/market-insights';

interface LifeEventsTabProps {
    lifeEvents: LifeEvent[];
}

export function LifeEventsTab({ lifeEvents }: LifeEventsTabProps) {
    return (
        <div className="grid gap-6">
            {lifeEvents.map((event) => (
                <Card key={event.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{getLifeEventIcon(event.type)}</div>
                                <div>
                                    <CardTitle className="text-lg">{getLifeEventLabel(event.type)}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <MapPin className="h-3 w-3" />
                                        {event.location}
                                        <span>•</span>
                                        {event.timeframe}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                    {event.predictedCount.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                        {event.confidence}% confidence
                                    </Badge>
                                    <Badge className={`text-xs ${getImpactColor(event.marketImpact)}`}>
                                        {event.marketImpact} impact
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">{event.description}</p>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm">
                                <Users className="h-4 w-4 mr-2" />
                                Target Audience
                            </Button>
                            <Button variant="ghost" size="sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                Set Reminder
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}