/**
 * AI Visibility Sync Status Component
 * 
 * Shows the current sync status and provides controls for AI visibility integration
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  TrendingUp,
  Brain,
  Zap,
  Eye
} from 'lucide-react';
import { useUser } from '@/aws/auth';
import { toast } from '@/hooks/use-toast';
import type { SynchronizationResult } from '@/lib/ai-visibility/types/synchronization.types';

export interface AIVisibilitySyncStatusProps {
  /** Current sync status */
  status: 'idle' | 'syncing' | 'success' | 'error' | 'warning';
  
  /** Last synchronization result */
  lastSync?: SynchronizationResult | null;
  
  /** Last sync timestamp */
  lastSyncAt?: Date;
  
  /** Whether sync is currently in progress */
  isSyncing?: boolean;
  
  /** Callback to trigger manual sync */
  onManualSync?: () => Promise<void>;
  
  /** Whether to show detailed information */
  showDetails?: boolean;
  
  /** Compact mode for smaller displays */
  compact?: boolean;
}

export function AIVisibilitySyncStatus({
  status,
  lastSync,
  lastSyncAt,
  isSyncing = false,
  onManualSync,
  showDetails = true,
  compact = false
}: AIVisibilitySyncStatusProps) {
  const { user } = useUser();
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Up to date';
      case 'error':
        return 'Sync failed';
      case 'warning':
        return 'Sync completed with warnings';
      default:
        return 'Ready to sync';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return 'blue';
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const handleManualSync = async () => {
    if (!onManualSync || isManualSyncing) return;

    setIsManualSyncing(true);
    
    try {
      await onManualSync();
      toast({
        title: 'Sync Triggered',
        description: 'AI visibility sync has been initiated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Failed to trigger AI visibility sync.',
      });
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatLastSyncTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-card border">
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusLabel()}</span>
        </div>
        
        {lastSyncAt && (
          <span className="text-xs text-muted-foreground">
            {formatLastSyncTime(lastSyncAt)}
          </span>
        )}
        
        {onManualSync && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleManualSync}
            disabled={isSyncing || isManualSyncing}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${(isSyncing || isManualSyncing) ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" />
          AI Visibility Sync
        </CardTitle>
        <CardDescription className="text-sm">
          Real-time synchronization with AI optimization features
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusLabel()}</span>
          </div>
          
          <Badge variant={status === 'success' ? 'default' : 'secondary'}>
            {status === 'success' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Last Sync Info */}
        {lastSyncAt && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last sync</span>
            <span>{formatLastSyncTime(lastSyncAt)}</span>
          </div>
        )}

        {/* Sync Results */}
        {showDetails && lastSync && (
          <div className="space-y-3 pt-2 border-t">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="font-semibold text-primary">
                  {lastSync.updatedSchemas.length}
                </div>
                <div className="text-muted-foreground">Schemas</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-primary">
                  {lastSync.updatedEntities.length}
                </div>
                <div className="text-muted-foreground">Entities</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-primary">
                  {lastSync.exportedFormats.length}
                </div>
                <div className="text-muted-foreground">Formats</div>
              </div>
            </div>

            {/* Impact Analysis */}
            {lastSync.success && lastSync.impactAnalysis && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Impact</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-600">
                      +{lastSync.impactAnalysis.estimatedVisibilityImpact}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Risk Level</span>
                  <Badge 
                    variant={lastSync.impactAnalysis.riskLevel === 'low' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {lastSync.impactAnalysis.riskLevel}
                  </Badge>
                </div>
              </div>
            )}

            {/* Affected Platforms */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Synchronized Platforms</span>
              <div className="flex flex-wrap gap-1">
                {['SEO', 'AEO', 'AIO', 'GEO'].map((platform) => (
                  <Badge key={platform} variant="outline" className="text-xs">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manual Sync Button */}
        {onManualSync && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleManualSync}
              disabled={isSyncing || isManualSyncing}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {(isSyncing || isManualSyncing) ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3 w-3" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        {showDetails && (
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                asChild
              >
                <a href="/brand/audit/ai-visibility">
                  <Eye className="mr-1 h-3 w-3" />
                  View Details
                </a>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                asChild
              >
                <a href="/brand/profile">
                  <Zap className="mr-1 h-3 w-3" />
                  Optimize Profile
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact sync status indicator for use in headers or sidebars
 */
export function AIVisibilitySyncIndicator({
  status,
  lastSyncAt,
  onClick
}: {
  status: AIVisibilitySyncStatusProps['status'];
  lastSyncAt?: Date;
  onClick?: () => void;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 p-1 rounded hover:bg-accent transition-colors"
      title={`AI Visibility: ${status}${lastSyncAt ? ` (${lastSyncAt.toLocaleString()})` : ''}`}
    >
      <Brain className={`h-3 w-3 ${getStatusColor()}`} />
      {status === 'syncing' && (
        <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
      )}
    </button>
  );
}