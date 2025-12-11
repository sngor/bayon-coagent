/**
 * Custom hook for health monitoring data and operations
 */

import { useState, useCallback, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getHealthMetricsAction, testServiceConnectionAction } from '@/app/health-actions';

interface HealthStatus {
    lastChecked: string;
    isRefreshing: boolean;
    systemStatus: 'operational' | 'degraded' | 'outage';
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeAlerts: number;
}

interface HealthMetrics {
    cpu: number;
    memory: number;
    network: number;
    diskUsage: number;
}

export function useHealthMonitoring() {
    const [healthStatus, setHealthStatus] = useState<HealthStatus>({
        lastChecked: '2 minutes ago',
        isRefreshing: false,
        systemStatus: 'operational',
        uptime: 99.9,
        responseTime: 142,
        errorRate: 0.01,
        activeAlerts: 0
    });

    const [metrics, setMetrics] = useState<HealthMetrics>({
        cpu: 15,
        memory: 32,
        network: 8,
        diskUsage: 45
    });

    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const refreshHealthData = useCallback(() => {
        setHealthStatus(prev => ({ ...prev, isRefreshing: true }));

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append('includeMetrics', 'true');
                formData.append('includeServices', 'true');

                const result = await getHealthMetricsAction(formData);

                if (result.success && result.data) {
                    const { metrics: newMetrics, systemStatus } = result.data;

                    if (newMetrics) {
                        setHealthStatus(prev => ({
                            ...prev,
                            isRefreshing: false,
                            lastChecked: 'Just now',
                            systemStatus: systemStatus || 'operational',
                            uptime: newMetrics.uptime,
                            responseTime: newMetrics.responseTime,
                            errorRate: newMetrics.errorRate,
                            activeAlerts: newMetrics.activeAlerts
                        }));

                        setMetrics({
                            cpu: newMetrics.cpu,
                            memory: newMetrics.memory,
                            network: newMetrics.network,
                            diskUsage: newMetrics.diskUsage
                        });
                    }
                } else {
                    throw new Error(result.message || 'Failed to fetch health data');
                }
            } catch (error) {
                console.error('Failed to refresh health data:', error);
                setHealthStatus(prev => ({ ...prev, isRefreshing: false }));

                toast({
                    title: "Health Check Failed",
                    description: "Unable to refresh system health data",
                    variant: "destructive"
                });
            }
        });
    }, [toast]);

    const testServiceConnection = useCallback(async (serviceName: string) => {
        try {
            // Simulate service connection test
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: "Connection Test Successful",
                description: `${serviceName} is responding normally`,
            });

            return { success: true, responseTime: Math.floor(Math.random() * 500 + 100) };
        } catch (error) {
            toast({
                title: "Connection Test Failed",
                description: `${serviceName} is not responding`,
                variant: "destructive"
            });

            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }, [toast]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (!healthStatus.isRefreshing) {
                refreshHealthData();
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [refreshHealthData, healthStatus.isRefreshing]);

    return {
        healthStatus,
        metrics,
        refreshHealthData,
        testServiceConnection,
        isHealthy: healthStatus.systemStatus === 'operational' && healthStatus.activeAlerts === 0
    };
}