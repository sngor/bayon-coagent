import { ContentManagement } from '@/components/mobile/content-management';
import { OfflineStatusIndicator } from '@/components/mobile/offline-status-indicator';

/**
 * Demo page for mobile content management
 * This page demonstrates the offline content creation and management features
 */
export default function MobileContentDemoPage() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="font-headline text-3xl font-bold">Mobile Content Management Demo</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    This demo showcases the offline-first content management system.
                    Create, edit, and manage content that automatically syncs when online.
                </p>
            </div>

            {/* Offline Status Indicator */}
            <div className="max-w-md mx-auto">
                <h2 className="font-headline text-lg font-semibold mb-4">Offline Status</h2>
                <OfflineStatusIndicator showDetails />
            </div>

            {/* Content Management */}
            <div className="max-w-4xl mx-auto">
                <ContentManagement
                    onContentCreated={(content) => {
                        console.log('Content created:', content);
                    }}
                    onContentEdited={(content) => {
                        console.log('Content edited:', content);
                    }}
                    onContentDeleted={(contentId) => {
                        console.log('Content deleted:', contentId);
                    }}
                />
            </div>
        </div>
    );
}