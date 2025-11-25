import { Loader2 } from 'lucide-react';

/**
 * Loading State for Client Dashboard
 * 
 * Displayed while validating the secured link and loading dashboard data.
 */
export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Loading your dashboard...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Please wait while we verify your access
                </p>
            </div>
        </div>
    );
}
