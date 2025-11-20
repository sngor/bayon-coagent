'use client';

/**
 * Example usage of EditHistoryList component
 * 
 * This demonstrates how to integrate the edit history list
 * into your Reimagine toolkit page.
 */

import { useState } from 'react';
import { EditHistoryList } from './edit-history-list';
import { EditPreview } from './edit-preview';
import type { EditType } from '@/ai/schemas/reimagine-schemas';

interface EditHistoryItem {
    editId: string;
    imageId: string;
    editType: EditType;
    originalUrl: string;
    resultUrl: string;
    createdAt: string;
    status: string;
    parentEditId?: string;
}

export function EditHistoryListExample() {
    const [selectedEdit, setSelectedEdit] = useState<EditHistoryItem | null>(null);
    const userId = 'example-user-id'; // Replace with actual user ID from auth

    const handleViewEdit = (item: EditHistoryItem) => {
        setSelectedEdit(item);
    };

    const handleAccept = () => {
        console.log('Accept edit:', selectedEdit?.editId);
        setSelectedEdit(null);
    };

    const handleRegenerate = () => {
        console.log('Regenerate edit:', selectedEdit?.editId);
        // Implement regeneration logic
    };

    const handleCancel = () => {
        setSelectedEdit(null);
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold">Edit History</h1>
                <p className="text-muted-foreground">
                    View, download, and manage your image edits
                </p>
            </div>

            {/* Edit Preview Modal */}
            {selectedEdit && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="max-w-4xl w-full">
                        <EditPreview
                            originalUrl={selectedEdit.originalUrl}
                            editedUrl={selectedEdit.resultUrl}
                            editType={selectedEdit.editType}
                            onAccept={handleAccept}
                            onRegenerate={handleRegenerate}
                            onCancel={handleCancel}
                        />
                    </div>
                </div>
            )}

            {/* Edit History List */}
            <EditHistoryList
                userId={userId}
                onViewEdit={handleViewEdit}
            />
        </div>
    );
}

/**
 * Usage in your main Reimagine page:
 * 
 * ```tsx
 * import { EditHistoryList } from '@/components/reimagine/edit-history-list';
 * import { useUser } from '@/aws/auth/use-user';
 * 
 * export default function ReimagineToolkitPage() {
 *   const { user } = useUser();
 *   const [selectedEdit, setSelectedEdit] = useState(null);
 * 
 *   return (
 *     <div className="space-y-8">
 *       {/* Other components: uploader, edit options, etc. *\/}
 *       
 *       <EditHistoryList
 *         userId={user?.id || ''}
 *         onViewEdit={setSelectedEdit}
 *       />
 *     </div>
 *   );
 * }
 * ```
 * 
 * Features:
 * - Automatically loads edit history on mount
 * - Lazy loads images as they come into view
 * - Shows edit chains with visual indicators
 * - Provides download and delete actions
 * - Displays status badges (completed, preview, processing, failed)
 * - Formats timestamps in a user-friendly way
 * - Responsive design for mobile and desktop
 * - Smooth animations with Framer Motion
 */
