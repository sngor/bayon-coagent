'use client';

/**
 * Multi-Angle Room Staging Interface
 * 
 * Allows users to upload multiple images of the same room from different
 * angles and apply consistent furniture staging across all angles.
 */

import { useState, useCallback } from 'react';
import { Plus, Trash2, Eye, Download, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { StandardLoadingSpinner, StandardErrorDisplay } from '@/components/standard';
import { ImageUploader } from './image-uploader';
import { MultiAngleGuide } from './multi-angle-guide';
import {
    createStagingSessionAction,
    addAngleToSessionAction,
    getStagingSessionAction,
    deleteStagingSessionAction,
} from '@/app/multi-angle-staging-actions';
import { cn } from '@/lib/utils';

interface MultiAngleStagingInterfaceProps {
    userId: string;
}

interface AngleData {
    angleId: string;
    imageId: string;
    editId?: string;
    originalUrl: string;
    stagedUrl?: string;
    angleDescription?: string;
    order: number;
}

export function MultiAngleStagingInterface({ userId }: MultiAngleStagingInterfaceProps) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [roomType, setRoomType] = useState<string>('');
    const [style, setStyle] = useState<string>('');
    const [angles, setAngles] = useState<AngleData[]>([]);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [isAddingAngle, setIsAddingAngle] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const [currentAngleDescription, setCurrentAngleDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedAngle, setSelectedAngle] = useState<AngleData | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [furnitureContext, setFurnitureContext] = useState<any>(null);

    const roomTypes = [
        { value: 'living-room', label: 'Living Room' },
        { value: 'bedroom', label: 'Bedroom' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'dining-room', label: 'Dining Room' },
        { value: 'office', label: 'Office' },
        { value: 'bathroom', label: 'Bathroom' },
    ];

    const styles = [
        { value: 'modern', label: 'Modern' },
        { value: 'traditional', label: 'Traditional' },
        { value: 'minimalist', label: 'Minimalist' },
        { value: 'luxury', label: 'Luxury' },
        { value: 'rustic', label: 'Rustic' },
        { value: 'contemporary', label: 'Contemporary' },
    ];

    // Create new staging session
    const handleCreateSession = useCallback(async () => {
        if (!roomType || !style) {
            setError('Please select room type and style');
            return;
        }

        setIsCreatingSession(true);
        setError(null);

        try {
            const result = await createStagingSessionAction(userId, roomType, style);

            if (result.success && result.sessionId) {
                setSessionId(result.sessionId);
                setShowUploader(true);
            } else {
                setError(result.error || 'Failed to create session');
            }
        } catch (err) {
            setError('Failed to create staging session');
        } finally {
            setIsCreatingSession(false);
        }
    }, [userId, roomType, style]);

    // Handle image upload complete
    const handleUploadComplete = useCallback(
        async (imageId: string) => {
            console.log('[UI] handleUploadComplete called with imageId:', imageId);
            console.log('[UI] Current sessionId:', sessionId);
            console.log('[UI] Current userId:', userId);

            if (!sessionId) {
                console.error('[UI] No session ID found - session might not have been created');
                setError('Session not found. Please create a new session.');
                return;
            }

            console.log('[UI] Starting angle processing:', { imageId, sessionId, userId, angleDescription: currentAngleDescription });
            setIsAddingAngle(true);
            setError(null);

            try {
                const result = await addAngleToSessionAction(
                    userId,
                    sessionId,
                    imageId,
                    currentAngleDescription
                );

                console.log('Add angle result:', result);

                if (result.success && result.angleId) {
                    // Refresh session to get updated angles
                    const sessionResult = await getStagingSessionAction(userId, sessionId);

                    console.log('Session refresh result:', sessionResult);

                    if (sessionResult.success && sessionResult.session) {
                        setAngles(sessionResult.session.angles);

                        // Store furniture context from first angle
                        if (result.furnitureContext) {
                            console.log('Furniture context extracted:', result.furnitureContext);
                            setFurnitureContext(result.furnitureContext);
                        }
                    }

                    setShowUploader(false);
                    setCurrentAngleDescription('');
                } else {
                    console.error('Failed to add angle:', result.error);
                    setError(result.error || 'Failed to add angle');
                }
            } catch (err) {
                console.error('Error processing angle:', err);
                setError(err instanceof Error ? err.message : 'Failed to process angle');
            } finally {
                setIsAddingAngle(false);
            }
        },
        [userId, sessionId, currentAngleDescription]
    );

    // Add another angle
    const handleAddAnother = useCallback(() => {
        setShowUploader(true);
        setCurrentAngleDescription('');
    }, []);

    // View angle comparison
    const handleViewAngle = useCallback((angle: AngleData) => {
        setSelectedAngle(angle);
        setShowPreview(true);
    }, []);

    // Reset session
    const handleReset = useCallback(async () => {
        if (sessionId) {
            await deleteStagingSessionAction(userId, sessionId);
        }
        setSessionId(null);
        setAngles([]);
        setRoomType('');
        setStyle('');
        setFurnitureContext(null);
        setShowUploader(false);
    }, [userId, sessionId]);

    // If no session, show setup form
    if (!sessionId) {
        return (
            <div className="space-y-6">
                <MultiAngleGuide />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Multi-Angle Room Staging
                        </CardTitle>
                        <CardDescription>
                            Stage the same room from multiple angles with consistent furniture and styling
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="space-y-2 text-sm">
                                    <p className="font-medium text-blue-900 dark:text-blue-100">
                                        How it works:
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
                                        <li>Choose your room type and furniture style</li>
                                        <li>Upload the first angle and let AI stage it</li>
                                        <li>Upload additional angles - AI will match the furniture automatically</li>
                                        <li>Get consistent staging across all angles</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <StandardErrorDisplay
                                title="Error"
                                message={error}
                                variant="error"
                            />
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="room-type">Room Type</Label>
                                <Select value={roomType} onValueChange={setRoomType}>
                                    <SelectTrigger id="room-type">
                                        <SelectValue placeholder="Select room type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="style">Furniture Style</Label>
                                <Select value={style} onValueChange={setStyle}>
                                    <SelectTrigger id="style">
                                        <SelectValue placeholder="Select furniture style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {styles.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleCreateSession}
                                disabled={!roomType || !style || isCreatingSession}
                                className="w-full"
                                size="lg"
                            >
                                {isCreatingSession ? (
                                    <>
                                        <StandardLoadingSpinner variant="default" />
                                        Creating Session...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Start Multi-Angle Staging
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show uploader for adding angles
    if (showUploader) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {angles.length === 0 ? 'Upload First Angle' : `Upload Angle ${angles.length + 1}`}
                        </CardTitle>
                        <CardDescription>
                            {angles.length === 0
                                ? 'This will be staged with your selected style, and the furniture will be matched in subsequent angles'
                                : 'AI will match the furniture from your first angle, adjusted for this perspective'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <StandardErrorDisplay
                                title="Error"
                                message={error}
                                variant="error"
                            />
                        )}

                        {angles.length > 0 && furnitureContext && (
                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                                    Furniture Context (from first angle):
                                </p>
                                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                                    {furnitureContext.description}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {furnitureContext.furnitureItems.slice(0, 5).map((item: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                            {item}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {angles.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="angle-description">
                                    Angle Description (Optional)
                                </Label>
                                <Input
                                    id="angle-description"
                                    placeholder="e.g., 'view from entrance', 'corner perspective', 'wide angle'"
                                    value={currentAngleDescription}
                                    onChange={(e) => setCurrentAngleDescription(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Help AI understand the perspective for better furniture placement
                                </p>
                            </div>
                        )}

                        {!isAddingAngle ? (
                            <ImageUploader
                                userId={userId}
                                onUploadComplete={(imageId) => handleUploadComplete(imageId)}
                                onUploadError={(err) => setError(err)}
                                simpleMode={true}
                            />
                        ) : (
                            <Card>
                                <CardContent className="p-12">
                                    <StandardLoadingSpinner
                                        variant="ai"
                                        message={angles.length === 0 ? 'Staging first angle...' : 'Matching furniture to new angle...'}
                                        showSubtext={true}
                                        featureType="virtual-staging"
                                    />
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowUploader(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show angles gallery
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Multi-Angle Staging Session</CardTitle>
                            <CardDescription>
                                {roomTypes.find((t) => t.value === roomType)?.label} •{' '}
                                {styles.find((s) => s.value === style)?.label} Style
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleAddAnother} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Angle
                            </Button>
                            <Button onClick={handleReset} variant="outline" size="sm">
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {angles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No angles added yet</p>
                            <Button onClick={handleAddAnother} className="mt-4">
                                Upload First Angle
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {angles.map((angle) => (
                                <Card key={angle.angleId} className="overflow-hidden">
                                    <div className="aspect-video relative bg-muted">
                                        {angle.stagedUrl ? (
                                            <img
                                                src={angle.stagedUrl}
                                                alt={`Angle ${angle.order + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <StandardLoadingSpinner variant="default" />
                                            </div>
                                        )}
                                        <Badge className="absolute top-2 left-2">
                                            Angle {angle.order + 1}
                                        </Badge>
                                    </div>
                                    <CardContent className="p-4">
                                        {angle.angleDescription && (
                                            <p className="text-sm text-muted-foreground mb-3">
                                                {angle.angleDescription}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewAngle(angle)}
                                                className="flex-1"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Compare
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Angle {selectedAngle ? selectedAngle.order + 1 : ''} Comparison</DialogTitle>
                        <DialogDescription>
                            Before and after staging
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAngle && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Original</p>
                                <img
                                    src={selectedAngle.originalUrl}
                                    alt="Original"
                                    className="w-full rounded-lg"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">Staged</p>
                                {selectedAngle.stagedUrl ? (
                                    <img
                                        src={selectedAngle.stagedUrl}
                                        alt="Staged"
                                        className="w-full rounded-lg"
                                    />
                                ) : (
                                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                        <StandardLoadingSpinner variant="default" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
