/**
 * Individual integration card component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { IntegrationStatusIcon } from './integration-icons';
import { IntegrationStatusBadge } from './integration-status-badge';
import { cn } from '@/lib/utils';
import type { Integration } from '@/types/integrations';

interface IntegrationCardProps {
    integration: Integration;
    onToggle: (id: string, enabled: boolean) => void;
    onTestConnection: (id: string) => void;
    onConfigure: (integration: Integration) => void;
}

export function IntegrationCard({
    integration,
    onToggle,
    onTestConnection,
    onConfigure
}: IntegrationCardProps) {
    const usagePercentage = integration.usage
        ? Math.min((integration.usage.requests / integration.usage.limit) * 100, 100)
        : 0;

    return (
        <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <IntegrationStatusIcon status={integration.status} />
                        <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            <CardDescription className="text-sm">
                                {integration.description}
                            </CardDescription>
                        </div>
                    </div>
                    <IntegrationStatusBadge status={integration.status} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {integration.usage && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Usage</span>
                            <span>
                                {integration.usage.requests.toLocaleString()} / {integration.usage.limit.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={cn(
                                    "h-2 rounded-full transition-all duration-300",
                                    usagePercentage > 80 ? "bg-red-600" :
                                        usagePercentage > 60 ? "bg-yellow-600" : "bg-blue-600"
                                )}
                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Cost: ${integration.usage.cost.toFixed(2)}
                        </div>
                    </div>
                )}

                {integration.lastSync && (
                    <div className="text-xs text-muted-foreground">
                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                    </div>
                )}

                <div className="flex gap-2">
                    <Switch
                        checked={integration.status === 'active'}
                        onCheckedChange={(checked) => onToggle(integration.id, checked)}
                        disabled={integration.status === 'pending'}
                    />
                    <Label className="text-sm">
                        {integration.status === 'active' ? 'Enabled' : 'Disabled'}
                    </Label>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTestConnection(integration.id)}
                        disabled={integration.status !== 'active'}
                    >
                        Test Connection
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onConfigure(integration)}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}