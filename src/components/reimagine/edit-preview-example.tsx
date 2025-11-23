'use client';

/**
 * Example usage of EditPreview component
 * 
 * This demonstrates how to integrate the EditPreview component
 * into the Reimagine toolkit workflow.
 */

import { useState } from 'react';
import { EditPreview } from './edit-preview';
import { Button } from '@/components/ui/button';

export function EditPreviewExample() {
    const [showPreview, setShowPreview] = useState(false);

    // Example URLs (replace with actual presigned URLs from S3)
    const originalUrl = 'https://via.placeholder.com/800x600/cccccc/666666?text=Original+Image';
    const editedUrl = 'https://via.placeholder.com/800x600/4CAF50/ffffff?text=Edited+Image';

    const handleAccept = async () => {
        console.log('Accept edit - save to history');
        // Call acceptEditAction server action
        // await acceptEditAction(editId);
        setShowPreview(false);
    };

    const handleRegenerate = () => {
        console.log('Regenerate edit - show parameter form');
        // Show edit parameter form with current values
        // Allow user to adjust parameters
        // Then call processEditAction again
        setShowPreview(false);
    };

    const handleCancel = () => {
        console.log('Cancel edit - discard without saving');
        // Call deleteEditAction to remove preview from S3/DynamoDB
        // await deleteEditAction(editId);
        setShowPreview(false);
    };

    return (
        <div className="space-y-4 p-8">
            <h1 className="font-headline text-2xl font-bold">Edit Preview Example</h1>

            {!showPreview ? (
                <Button onClick={() => setShowPreview(true)}>
                    Show Preview
                </Button>
            ) : (
                <EditPreview
                    originalUrl={originalUrl}
                    editedUrl={editedUrl}
                    editType="virtual-staging"
                    onAccept={handleAccept}
                    onRegenerate={handleRegenerate}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}

/**
 * Integration Example with Server Actions
 * 
 * ```typescript
 * // In your main Reimagine page component
 * 
 * const [previewData, setPreviewData] = useState<{
 *   editId: string;
 *   originalUrl: string;
 *   editedUrl: string;
 *   editType: EditType;
 * } | null>(null);
 * 
 * // After processing an edit
 * const handleProcessEdit = async (editType: EditType, params: EditParams) => {
 *   const result = await processEditAction(imageId, editType, params);
 *   
 *   if (result.success && result.editId && result.resultUrl) {
 *     // Get presigned URL for original image
 *     const originalUrl = await getPresignedUrl(imageId);
 *     
 *     setPreviewData({
 *       editId: result.editId,
 *       originalUrl,
 *       editedUrl: result.resultUrl,
 *       editType,
 *     });
 *   }
 * };
 * 
 * // Handle accept
 * const handleAccept = async () => {
 *   if (!previewData) return;
 *   
 *   const result = await acceptEditAction(previewData.editId);
 *   
 *   if (result.success) {
 *     // Add to edit history
 *     // Clear preview
 *     setPreviewData(null);
 *   }
 * };
 * 
 * // Handle regenerate
 * const handleRegenerate = () => {
 *   if (!previewData) return;
 *   
 *   // Show edit form with current parameters
 *   // Allow user to adjust
 *   // Clear current preview
 *   setPreviewData(null);
 * };
 * 
 * // Handle cancel
 * const handleCancel = async () => {
 *   if (!previewData) return;
 *   
 *   // Delete preview edit
 *   await deleteEditAction(previewData.editId);
 *   setPreviewData(null);
 * };
 * 
 * // Render
 * return (
 *   <div>
 *     {previewData && (
 *       <EditPreview
 *         originalUrl={previewData.originalUrl}
 *         editedUrl={previewData.editedUrl}
 *         editType={previewData.editType}
 *         onAccept={handleAccept}
 *         onRegenerate={handleRegenerate}
 *         onCancel={handleCancel}
 *       />
 *     )}
 *   </div>
 * );
 * ```
 */
