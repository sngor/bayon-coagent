import { Shield, User, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingFlowType } from '@/types/onboarding';

interface FlowIndicatorProps {
    /** Current flow type */
    flowType: OnboardingFlowType;
    /** Current step ID to determine which flow is active */
    currentStepId?: string;
    /** Whether to show in compact mode */
    compact?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Flow Indicator Component
 * 
 * Displays which onboarding flow is currently active.
 * For dual role users, shows progress through both flows.
 * 
 * Features:
 * - Visual indicator of current flow
 * - Progress indication for dual role users
 * - Compact mode for mobile
 * - Accessible labels
 * 
 * Requirements: 15.4
 */
export function FlowIndicator({
    flowType,
    currentStepId,
    compact = false,
    className,
}: FlowIndicatorProps) {
    // Determine which flow is currently active based on step ID
    const isAdminStep = currentStepId?.startsWith('admin-');
    const isUserStep = !isAdminStep;

    // For 'both' flow type, show which flow is active
    const activeFlow = flowType === 'both'
        ? (isAdminStep ? 'admin' : 'user')
        : flowType;

    // Get display info
    const getFlowInfo = (flow: 'admin' | 'user') => {
        if (flow === 'admin') {
            return {
                icon: Shield,
                label: 'Admin Onboarding',
                shortLabel: 'Admin',
                color: 'text-blue-600 dark:text-blue-400',
                bgColor: 'bg-blue-100 dark:bg-blue-900/30',
            };
        } else {
            return {
                icon: User,
                label: 'User Onboarding',
                shortLabel: 'User',
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-100 dark:bg-green-900/30',
            };
        }
    };

    const flowInfo = getFlowInfo(activeFlow as 'admin' | 'user');
    const IconComponent = flowInfo.icon;

    // Compact mode for mobile
    if (compact) {
        return (
            <div
                className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                    flowInfo.bgColor,
                    flowInfo.color,
                    className
                )}
                role="status"
                aria-label={`Current flow: ${flowInfo.label}`}
            >
                <IconComponent className="w-3 h-3" />
                <span>{flowInfo.shortLabel}</span>
            </div>
        );
    }

    // Full mode
    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
                flowInfo.bgColor,
                className
            )}
            role="status"
            aria-label={`Current flow: ${flowInfo.label}`}
        >
            <IconComponent className={cn('w-4 h-4', flowInfo.color)} />
            <span className={cn('text-sm font-medium', flowInfo.color)}>
                {flowInfo.label}
            </span>

            {/* For dual role users, show both flows */}
            {flowType === 'both' && (
                <div className="ml-2 flex items-center gap-1">
                    <div
                        className={cn(
                            'w-2 h-2 rounded-full',
                            isAdminStep ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                        )}
                        aria-label={isAdminStep ? 'Admin flow active' : 'Admin flow inactive'}
                    />
                    <div
                        className={cn(
                            'w-2 h-2 rounded-full',
                            isUserStep ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
                        )}
                        aria-label={isUserStep ? 'User flow active' : 'User flow inactive'}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * Dual Flow Progress Component
 * 
 * Shows progress through both admin and user flows for dual role users.
 * Displays which flow is complete and which is in progress.
 * 
 * Requirements: 15.3, 15.4, 15.5
 */
interface DualFlowProgressProps {
    /** Whether admin flow is complete */
    adminFlowComplete: boolean;
    /** Whether user flow is complete */
    userFlowComplete: boolean;
    /** Additional CSS classes */
    className?: string;
}

export function DualFlowProgress({
    adminFlowComplete,
    userFlowComplete,
    className,
}: DualFlowProgressProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {/* Admin Flow */}
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                        adminFlowComplete
                            ? 'bg-blue-600 dark:bg-blue-400 text-white'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    )}
                >
                    <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium">Admin Onboarding</div>
                    <div className="text-xs text-muted-foreground">
                        {adminFlowComplete ? 'Complete' : 'In Progress'}
                    </div>
                </div>
                {adminFlowComplete && (
                    <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                )}
            </div>

            {/* Connector */}
            <div className="ml-4 w-0.5 h-4 bg-border" />

            {/* User Flow */}
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                        userFlowComplete
                            ? 'bg-green-600 dark:bg-green-400 text-white'
                            : adminFlowComplete
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    )}
                >
                    <User className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium">User Onboarding</div>
                    <div className="text-xs text-muted-foreground">
                        {userFlowComplete
                            ? 'Complete'
                            : adminFlowComplete
                                ? 'In Progress'
                                : 'Pending'}
                    </div>
                </div>
                {userFlowComplete && (
                    <div className="flex-shrink-0 text-green-600 dark:text-green-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
