/**
 * Integration status and category icons
 */

import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Zap,
    BarChart3,
    MessageSquare,
    Database,
    Shield,
    Globe,
    Server
} from 'lucide-react';
import type { IntegrationStatus, IntegrationCategory } from '@/types/integrations';

interface IntegrationStatusIconProps {
    status: IntegrationStatus;
    className?: string;
}

export function IntegrationStatusIcon({ status, className = "h-4 w-4" }: IntegrationStatusIconProps) {
    switch (status) {
        case 'active':
            return <CheckCircle className={`${className} text-green-600`} />;
        case 'inactive':
            return <XCircle className={`${className} text-gray-600`} />;
        case 'error':
            return <AlertTriangle className={`${className} text-red-600`} />;
        case 'pending':
            return <AlertTriangle className={`${className} text-yellow-600`} />;
        default:
            return <XCircle className={`${className} text-gray-600`} />;
    }
}

interface IntegrationCategoryIconProps {
    category: IntegrationCategory;
    className?: string;
}

export function IntegrationCategoryIcon({ category, className = "h-5 w-5" }: IntegrationCategoryIconProps) {
    switch (category) {
        case 'ai':
            return <Zap className={`${className} text-purple-600`} />;
        case 'analytics':
            return <BarChart3 className={`${className} text-blue-600`} />;
        case 'communication':
            return <MessageSquare className={`${className} text-green-600`} />;
        case 'storage':
            return <Database className={`${className} text-orange-600`} />;
        case 'payment':
            return <Shield className={`${className} text-indigo-600`} />;
        case 'search':
            return <Globe className={`${className} text-teal-600`} />;
        default:
            return <Server className={`${className} text-gray-600`} />;
    }
}