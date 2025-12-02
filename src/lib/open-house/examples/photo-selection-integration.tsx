/**
 * Photo Selection Integration Examples
 * 
 * Demonstrates how to integrate photo selection components into pages.
 * 
 * Validates Requirements: 12.4
 */

import { FollowUpGeneratorWithPhotos } from '@/components/open-house/follow-up-generator-with-photos';
import { FollowUpPreview } from '@/components/open-house/follow-up-preview';
import { PhotoSelector } from '@/components/open-house/photo-selector';
import type { Visitor, SessionPhoto, FollowUpContent } from '@/lib/open-house/types';

/**
 * Example 1: Basic Follow-up Generator with Photos
 * 
 * Use this in a session detail page or follow-up management page
 */
export function BasicFollowUpGeneratorExample({
    sessionId,
    visitors,
    photos,
}: {
    sessionId: string;
    visitors: Visitor[];
    photos: SessionPhoto[];
}) {
    return (
        <FollowUpGeneratorWithPhotos
            sessionId={sessionId}
            visitors={visitors}
            photos={photos}
        />
    );
}

/**
 * Example 2: Follow-up Generator with Callback
 * 
 * Track when follow-ups are generated and perform additional actions
 */
export function FollowUpGeneratorWithCallbackExample({
    sessionId,
    visitors,
    photos,
}: {
    sessionId: string;
    visitors: Visitor[];
    photos: SessionPhoto[];
}) {
    const handleContentGenerated = (visitorId: string, content: FollowUpContent) => {
        console.log('Follow-up generated:', {
            visitorId,
            contentId: content.contentId,
            photoCount: content.photoIds?.length || 0,
        });

        // You could:
        // - Show a success notification
        // - Update analytics
        // - Trigger additional workflows
        // - Navigate to preview page
    };

    return (
        <FollowUpGeneratorWithPhotos
            sessionId={sessionId}
            visitors={visitors}
            photos={photos}
            onContentGenerated={handleContentGenerated}
        />
    );
}

/**
 * Example 3: Follow-up Preview with Photos
 * 
 * Display generated follow-up content with selected photos
 */
export function FollowUpPreviewExample({
    content,
    visitor,
    photos,
}: {
    content: FollowUpContent;
    visitor: Visitor;
    photos: SessionPhoto[];
}) {
    return (
        <FollowUpPreview
            content={content}
            visitor={visitor}
            photos={photos}
        />
    );
}

/**
 * Example 4: Standalone Photo Selector
 * 
 * Use photo selector independently for custom workflows
 */
export function StandalonePhotoSelectorExample({
    photos,
}: {
    photos: SessionPhoto[];
}) {
    const [selectedPhotoIds, setSelectedPhotoIds] = React.useState<string[]>([]);

    const handleSelectionChange = (photoIds: string[]) => {
        setSelectedPhotoIds(photoIds);
        console.log('Selected photos:', photoIds);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Photos</h3>
                <p className="text-sm text-muted-foreground">
                    {selectedPhotoIds.length} selected
                </p>
            </div>

            <PhotoSelector
                photos={photos}
                selectedPhotoIds={selectedPhotoIds}
                onSelectionChange={handleSelectionChange}
                maxSelection={3}
                showPreview={true}
            />

            {selectedPhotoIds.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                        Selected photo IDs: {selectedPhotoIds.join(', ')}
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * Example 5: Complete Session Follow-up Page
 * 
 * Full page example with both components
 */
export function CompleteFollowUpPageExample({
    sessionId,
    visitors,
    photos,
    followUpContents,
}: {
    sessionId: string;
    visitors: Visitor[];
    photos: SessionPhoto[];
    followUpContents: FollowUpContent[];
}) {
    return (
        <div className="space-y-8">
            {/* Generate Section */}
            <section>
                <h2 className="text-2xl font-bold mb-4">Generate Follow-ups</h2>
                <FollowUpGeneratorWithPhotos
                    sessionId={sessionId}
                    visitors={visitors}
                    photos={photos}
                    onContentGenerated={(visitorId, content) => {
                        console.log(`Generated for visitor ${visitorId}`);
                    }}
                />
            </section>

            {/* Preview Section */}
            {followUpContents.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-4">Generated Follow-ups</h2>
                    <div className="space-y-4">
                        {followUpContents.map((content) => {
                            const visitor = visitors.find(
                                (v) => v.visitorId === content.visitorId
                            );
                            if (!visitor) return null;

                            return (
                                <FollowUpPreview
                                    key={content.contentId}
                                    content={content}
                                    visitor={visitor}
                                    photos={photos}
                                />
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}

/**
 * Example 6: Custom Photo Selection UI
 * 
 * Build custom UI using PhotoSelector as a base
 */
export function CustomPhotoSelectionExample({
    photos,
    onSubmit,
}: {
    photos: SessionPhoto[];
    onSubmit: (photoIds: string[]) => void;
}) {
    const [selectedPhotoIds, setSelectedPhotoIds] = React.useState<string[]>([]);

    const handleSubmit = () => {
        if (selectedPhotoIds.length === 0) {
            alert('Please select at least one photo');
            return;
        }
        onSubmit(selectedPhotoIds);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">
                    Choose Photos for Follow-up
                </h3>
                <p className="text-sm text-muted-foreground">
                    Select up to 3 photos to include in the follow-up email
                </p>
            </div>

            <PhotoSelector
                photos={photos}
                selectedPhotoIds={selectedPhotoIds}
                onSelectionChange={setSelectedPhotoIds}
                maxSelection={3}
                showPreview={true}
            />

            <div className="flex justify-end gap-2">
                <button
                    onClick={() => setSelectedPhotoIds([])}
                    className="px-4 py-2 border rounded-md"
                >
                    Clear Selection
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={selectedPhotoIds.length === 0}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                >
                    Continue with {selectedPhotoIds.length} photo(s)
                </button>
            </div>
        </div>
    );
}

/**
 * Example 7: Conditional Photo Selection
 * 
 * Only show photo selector if photos are available
 */
export function ConditionalPhotoSelectionExample({
    sessionId,
    visitors,
    photos,
}: {
    sessionId: string;
    visitors: Visitor[];
    photos: SessionPhoto[];
}) {
    if (photos.length === 0) {
        // Use basic generator without photos
        return (
            <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-500">
                        💡 Tip: Upload photos to include them in follow-up emails
                    </p>
                </div>
                {/* Use basic FollowUpGenerator here */}
            </div>
        );
    }

    // Use enhanced generator with photos
    return (
        <FollowUpGeneratorWithPhotos
            sessionId={sessionId}
            visitors={visitors}
            photos={photos}
        />
    );
}

/**
 * Example 8: Photo Selection with Validation
 * 
 * Add custom validation before generating follow-up
 */
export function PhotoSelectionWithValidationExample({
    sessionId,
    visitors,
    photos,
}: {
    sessionId: string;
    visitors: Visitor[];
    photos: SessionPhoto[];
}) {
    const handleContentGenerated = (visitorId: string, content: FollowUpContent) => {
        // Validate photo selection
        if (content.photoIds && content.photoIds.length > 0) {
            const validPhotos = content.photoIds.every((photoId) =>
                photos.some((p) => p.photoId === photoId)
            );

            if (!validPhotos) {
                console.error('Invalid photo IDs in follow-up content');
                return;
            }
        }

        // Proceed with valid content
        console.log('Valid follow-up generated:', content.contentId);
    };

    return (
        <FollowUpGeneratorWithPhotos
            sessionId={sessionId}
            visitors={visitors}
            photos={photos}
            onContentGenerated={handleContentGenerated}
        />
    );
}

/**
 * Example 9: Photo Selection Analytics
 * 
 * Track which photos are selected most often
 */
export function PhotoSelectionAnalyticsExample({
    sessionId,
    visitors,
    photos,
}: {
    sessionId: string;
    visitors: Visitor[];
    photos: SessionPhoto[];
}) {
    const [photoSelectionCounts, setPhotoSelectionCounts] = React.useState<
        Record<string, number>
    >({});

    const handleContentGenerated = (visitorId: string, content: FollowUpContent) => {
        if (content.photoIds) {
            setPhotoSelectionCounts((prev) => {
                const updated = { ...prev };
                content.photoIds!.forEach((photoId) => {
                    updated[photoId] = (updated[photoId] || 0) + 1;
                });
                return updated;
            });
        }
    };

    return (
        <div className="space-y-6">
            <FollowUpGeneratorWithPhotos
                sessionId={sessionId}
                visitors={visitors}
                photos={photos}
                onContentGenerated={handleContentGenerated}
            />

            {Object.keys(photoSelectionCounts).length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Photo Selection Analytics</h4>
                    <ul className="space-y-1 text-sm">
                        {Object.entries(photoSelectionCounts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([photoId, count]) => {
                                const photo = photos.find((p) => p.photoId === photoId);
                                return (
                                    <li key={photoId}>
                                        {photo?.aiDescription?.substring(0, 30) || photoId}...:{' '}
                                        {count} times
                                    </li>
                                );
                            })}
                    </ul>
                </div>
            )}
        </div>
    );
}

/**
 * Example 10: Migration from Basic to Enhanced Generator
 * 
 * How to upgrade from FollowUpGenerator to FollowUpGeneratorWithPhotos
 */

// Before (Basic Generator):
/*
<FollowUpGenerator
    sessionId={sessionId}
    visitors={visitors}
/>
*/

// After (Enhanced Generator with Photos):
/*
<FollowUpGeneratorWithPhotos
    sessionId={sessionId}
    visitors={visitors}
    photos={session.photos || []}  // Add photos prop
    onContentGenerated={(visitorId, content) => {
        // Optional: Handle generation callback
        console.log(`Generated with ${content.photoIds?.length || 0} photos`);
    }}
/>
*/

// Note: The basic FollowUpGenerator still works for backward compatibility
// Use FollowUpGeneratorWithPhotos for new implementations

import React from 'react';
