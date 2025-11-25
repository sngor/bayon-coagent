import Link from 'next/link';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Not Found Page for Client Dashboards
 * 
 * Displayed when a dashboard link is invalid, expired, or revoked.
 * Provides a user-friendly message and guidance.
 */
export default function DashboardNotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 text-center">
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Dashboard Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        This dashboard link is invalid, has expired, or has been revoked.
                    </p>
                </div>

                <div className="space-y-4 text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Possible reasons:</strong>
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
                        <li>The link has expired (links are valid for a limited time)</li>
                        <li>The link has been revoked by your agent</li>
                        <li>The link URL is incorrect or incomplete</li>
                        <li>The dashboard has been deleted</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Please contact your real estate agent to request a new dashboard link.
                    </p>

                    <Link href="/">
                        <Button className="w-full" variant="outline">
                            <Home className="h-4 w-4" />
                            Go to Homepage
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
