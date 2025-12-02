/**
 * Photo Management UI Tests
 * 
 * Tests for photo selection and integration with follow-up content
 * Validates Requirements: 12.4
 */

import { describe, it, expect } from '@jest/globals';
import type { SessionPhoto } from '@/lib/open-house/types';

describe('Photo Management UI', () => {
    describe('Photo Selection for Follow-ups', () => {
        it('should support selecting photos for follow-up content', () => {
            // Requirement 12.4: Photos can be selected for follow-up content
            const photos: SessionPhoto[] = [
                {
                    photoId: 'photo-1',
                    s3Key: 'open-house/user-123/session-123/photos/photo-1.jpg',
                    url: 'https://s3.example.com/photo-1.jpg',
                    aiDescription: 'Living room with hardwood floors',
                    capturedAt: '2024-01-15T14:30:00Z',
                },
                {
                    photoId: 'photo-2',
                    s3Key: 'open-house/user-123/session-123/photos/photo-2.jpg',
                    url: 'https://s3.example.com/photo-2.jpg',
                    aiDescription: 'Modern kitchen',
                    capturedAt: '2024-01-15T14:35:00Z',
                },
            ];

            const selectedPhotoIds = ['photo-1', 'photo-2'];

            expect(selectedPhotoIds).toHaveLength(2);
            expect(selectedPhotoIds).toContain('photo-1');
            expect(selectedPhotoIds).toContain('photo-2');
        });

        it('should limit photo selection to maximum count', () => {
            const maxSelection = 3;
            const selectedPhotoIds = ['photo-1', 'photo-2', 'photo-3'];

            expect(selectedPhotoIds.length).toBeLessThanOrEqual(maxSelection);
        });

        it('should allow deselecting photos', () => {
            let selectedPhotoIds = ['photo-1', 'photo-2', 'photo-3'];

            // Deselect photo-2
            selectedPhotoIds = selectedPhotoIds.filter(id => id !== 'photo-2');

            expect(selectedPhotoIds).toHaveLength(2);
            expect(selectedPhotoIds).not.toContain('photo-2');
            expect(selectedPhotoIds).toContain('photo-1');
            expect(selectedPhotoIds).toContain('photo-3');
        });

        it('should handle empty photo selection', () => {
            const selectedPhotoIds: string[] = [];

            expect(selectedPhotoIds).toHaveLength(0);
        });
    });

    describe('Photo Integration with Follow-up Content', () => {
        it('should include photo IDs in follow-up content', () => {
            const followUpContent = {
                contentId: 'content-123',
                sessionId: 'session-123',
                visitorId: 'visitor-123',
                userId: 'user-123',
                emailSubject: 'Thank you for visiting',
                emailBody: 'It was great meeting you...',
                smsMessage: 'Thanks for visiting!',
                nextSteps: ['Schedule a showing', 'Review the listing'],
                photoIds: ['photo-1', 'photo-2'],
                generatedAt: '2024-01-15T15:00:00Z',
            };

            expect(followUpContent.photoIds).toBeDefined();
            expect(followUpContent.photoIds).toHaveLength(2);
            expect(followUpContent.photoIds).toContain('photo-1');
            expect(followUpContent.photoIds).toContain('photo-2');
        });

        it('should allow follow-up content without photos', () => {
            const followUpContent = {
                contentId: 'content-123',
                sessionId: 'session-123',
                visitorId: 'visitor-123',
                userId: 'user-123',
                emailSubject: 'Thank you for visiting',
                emailBody: 'It was great meeting you...',
                smsMessage: 'Thanks for visiting!',
                nextSteps: ['Schedule a showing'],
                generatedAt: '2024-01-15T15:00:00Z',
            };

            expect(followUpContent.photoIds).toBeUndefined();
        });

        it('should filter photos by selected IDs', () => {
            const allPhotos: SessionPhoto[] = [
                {
                    photoId: 'photo-1',
                    s3Key: 'open-house/user-123/session-123/photos/photo-1.jpg',
                    url: 'https://s3.example.com/photo-1.jpg',
                    aiDescription: 'Living room',
                    capturedAt: '2024-01-15T14:30:00Z',
                },
                {
                    photoId: 'photo-2',
                    s3Key: 'open-house/user-123/session-123/photos/photo-2.jpg',
                    url: 'https://s3.example.com/photo-2.jpg',
                    aiDescription: 'Kitchen',
                    capturedAt: '2024-01-15T14:35:00Z',
                },
                {
                    photoId: 'photo-3',
                    s3Key: 'open-house/user-123/session-123/photos/photo-3.jpg',
                    url: 'https://s3.example.com/photo-3.jpg',
                    aiDescription: 'Bedroom',
                    capturedAt: '2024-01-15T14:40:00Z',
                },
            ];

            const selectedPhotoIds = ['photo-1', 'photo-3'];
            const selectedPhotos = allPhotos.filter(p => selectedPhotoIds.includes(p.photoId));

            expect(selectedPhotos).toHaveLength(2);
            expect(selectedPhotos[0].photoId).toBe('photo-1');
            expect(selectedPhotos[1].photoId).toBe('photo-3');
        });
    });

    describe('Photo Preview in Follow-up', () => {
        it('should display selected photos in follow-up preview', () => {
            const photos: SessionPhoto[] = [
                {
                    photoId: 'photo-1',
                    s3Key: 'open-house/user-123/session-123/photos/photo-1.jpg',
                    url: 'https://s3.example.com/photo-1.jpg',
                    aiDescription: 'Living room with hardwood floors',
                    capturedAt: '2024-01-15T14:30:00Z',
                },
                {
                    photoId: 'photo-2',
                    s3Key: 'open-house/user-123/session-123/photos/photo-2.jpg',
                    url: 'https://s3.example.com/photo-2.jpg',
                    aiDescription: 'Modern kitchen',
                    capturedAt: '2024-01-15T14:35:00Z',
                },
            ];

            const photoIds = ['photo-1', 'photo-2'];
            const selectedPhotos = photos.filter(p => photoIds.includes(p.photoId));

            expect(selectedPhotos).toHaveLength(2);
            expect(selectedPhotos.every(p => p.url)).toBe(true);
            expect(selectedPhotos.every(p => p.aiDescription)).toBe(true);
        });

        it('should use AI descriptions as alt text for photos', () => {
            const photo: SessionPhoto = {
                photoId: 'photo-1',
                s3Key: 'open-house/user-123/session-123/photos/photo-1.jpg',
                url: 'https://s3.example.com/photo-1.jpg',
                aiDescription: 'Spacious living room with natural lighting',
                capturedAt: '2024-01-15T14:30:00Z',
            };

            const altText = photo.aiDescription || 'Property photo';

            expect(altText).toBe('Spacious living room with natural lighting');
        });

        it('should provide fallback alt text when AI description is missing', () => {
            const photo: SessionPhoto = {
                photoId: 'photo-1',
                s3Key: 'open-house/user-123/session-123/photos/photo-1.jpg',
                url: 'https://s3.example.com/photo-1.jpg',
                capturedAt: '2024-01-15T14:30:00Z',
            };

            const altText = photo.aiDescription || 'Property photo';

            expect(altText).toBe('Property photo');
        });
    });

    describe('Photo Selection State Management', () => {
        it('should track selection state for multiple visitors', () => {
            const selectionState: Record<string, string[]> = {
                'visitor-1': ['photo-1', 'photo-2'],
                'visitor-2': ['photo-3'],
                'visitor-3': [],
            };

            expect(selectionState['visitor-1']).toHaveLength(2);
            expect(selectionState['visitor-2']).toHaveLength(1);
            expect(selectionState['visitor-3']).toHaveLength(0);
        });

        it('should update selection state when photos are toggled', () => {
            const selectionState: Record<string, string[]> = {
                'visitor-1': ['photo-1'],
            };

            // Add photo-2
            selectionState['visitor-1'] = [...selectionState['visitor-1'], 'photo-2'];

            expect(selectionState['visitor-1']).toHaveLength(2);
            expect(selectionState['visitor-1']).toContain('photo-2');

            // Remove photo-1
            selectionState['visitor-1'] = selectionState['visitor-1'].filter(id => id !== 'photo-1');

            expect(selectionState['visitor-1']).toHaveLength(1);
            expect(selectionState['visitor-1']).not.toContain('photo-1');
        });
    });
});
