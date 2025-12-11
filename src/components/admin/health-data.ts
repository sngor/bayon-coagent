/**
 * Static health monitoring data and configurations
 */

import {
    Activity,
    Clock,
    AlertCircle,
    AlertTriangle,
    Database,
    Server,
    Globe
} from 'lucide-react';

export const HEALTH_METRICS = [
    {
        id: 'uptime',
        title: 'System Uptime',
        value: '99.9%',
        subtitle: '30 days average',
        progress: 99.9,
        icon: Activity,
        iconColor: 'text-green-600',
        gradientFrom: 'from-green-50 to-emerald-50',
        gradientTo: 'dark:from-green-950/20 dark:to-emerald-950/20'
    },
    {
        id: 'response-time',
        title: 'Response Time',
        value: '142ms',
        subtitle: 'Average response',
        progress: 85,
        icon: Clock,
        iconColor: 'text-blue-600',
        gradientFrom: 'from-blue-50 to-indigo-50',
        gradientTo: 'dark:from-blue-950/20 dark:to-indigo-950/20'
    },
    {
        id: 'error-rate',
        title: 'Error Rate',
        value: '0.01%',
        subtitle: 'Last 24 hours',
        progress: 1,
        icon: AlertCircle,
        iconColor: 'text-purple-600',
        gradientFrom: 'from-purple-50 to-pink-50',
        gradientTo: 'dark:from-purple-950/20 dark:to-pink-950/20'
    },
    {
        id: 'active-alerts',
        title: 'Active Alerts',
        value: '0',
        subtitle: 'No active issues',
        progress: 0,
        icon: AlertTriangle,
        iconColor: 'text-orange-600',
        gradientFrom: 'from-orange-50 to-red-50',
        gradientTo: 'dark:from-orange-950/20 dark:to-red-950/20'
    }
] as const;

export const AWS_SERVICES = [
    {
        name: 'DynamoDB',
        description: 'Database service',
        status: 'operational' as const,
        statusText: 'Operational',
        metric: '< 5ms latency'
    },
    {
        name: 'AWS Bedrock',
        description: 'AI service',
        status: 'operational' as const,
        statusText: 'Operational',
        metric: '< 2s response'
    },
    {
        name: 'S3 Storage',
        description: 'File storage',
        status: 'operational' as const,
        statusText: 'Operational',
        metric: '99.9% available'
    },
    {
        name: 'Cognito Auth',
        description: 'Authentication',
        status: 'operational' as const,
        statusText: 'Operational',
        metric: '< 100ms auth'
    }
] as const;

export const INFRASTRUCTURE_SERVICES = [
    {
        name: 'CloudWatch',
        description: 'Monitoring & logs',
        status: 'operational' as const,
        statusText: 'Active'
    },
    {
        name: 'AWS Amplify',
        description: 'Hosting & deployment',
        status: 'operational' as const,
        statusText: 'Deployed'
    },
    {
        name: 'IAM',
        description: 'Access management',
        status: 'operational' as const,
        statusText: 'Configured'
    }
] as const;

export const EXTERNAL_APIS = [
    {
        name: 'Tavily Search API',
        description: 'AI-powered web search',
        status: 'operational' as const,
        statusText: 'Operational',
        metric: '< 500ms response'
    },
    {
        name: 'NewsAPI',
        description: 'Real estate news feed',
        status: 'operational' as const,
        statusText: 'Operational',
        metric: '< 300ms response'
    },
    {
        name: 'Google OAuth',
        description: 'Business Profile integration',
        status: 'warning' as const,
        statusText: 'Not Configured',
        metric: 'Setup required'
    },
    {
        name: 'Bridge API',
        description: 'Zillow review integration',
        status: 'operational' as const,
        statusText: 'Ready',
        metric: 'Available'
    }
] as const;

export const PERFORMANCE_METRICS = [
    {
        name: 'CPU Usage',
        value: 15,
        unit: '%',
        status: 'Optimal performance',
        icon: 'Cpu',
        color: 'text-blue-600'
    },
    {
        name: 'Memory Usage',
        value: 32,
        unit: '%',
        status: 'Within normal range',
        icon: 'HardDrive',
        color: 'text-green-600'
    },
    {
        name: 'Network I/O',
        value: 8,
        unit: '%',
        status: 'Low network activity',
        icon: 'Wifi',
        color: 'text-purple-600'
    }
] as const;

export const RESPONSE_TIMES = [
    { service: 'API Endpoints', time: '142ms', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/50' },
    { service: 'Database Queries', time: '4ms', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/50' },
    { service: 'AI Processing', time: '1.8s', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/50' },
    { service: 'File Uploads', time: '320ms', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/50' }
] as const;

export const HEALTH_CHECKS = [
    'Endpoint Monitoring',
    'Database Health',
    'Error Rate Alerts',
    'Performance Monitoring'
] as const;