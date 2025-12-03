'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Shield,
    Trash2,
    MapPin,
    Mic,
    Image,
    Key,
    Activity,
    AlertTriangle,
} from 'lucide-react';
import {
    deleteAllVoiceRecordings,
    clearAllSecurityData,
    getSecurityStatus,
} from '@/lib/mobile/security';
import { useUser } from '@/aws/auth/use-user';

interface PrivacySettingsProps {
    onClose?: () => void;
}

export function PrivacySettings({ onClose }: PrivacySettingsProps) {
    const { user } = useUser();
    const [locationEncryption, setLocationEncryption] = useState(true);
    const [autoDeleteRecordings, setAutoDeleteRecordings] = useState(false);
    const [stripExif, setStripExif] = useState(true);
    const [secureTokenStorage, setSecureTokenStorage] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteResult, setDeleteResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);
    const [securityStatus, setSecurityStatus] = useState<{
        hasEncryptionKey: boolean;
        tokenCount: number;
        rateLimitUsage: Record<string, { count: number; remaining: number } | null>;
    } | null>(null);

    useEffect(() => {
        loadSecurityStatus();
    }, []);

    const loadSecurityStatus = async () => {
        try {
            const status = await getSecurityStatus();
            setSecurityStatus(status);
        } catch (error) {
            console.error('Error loading security status:', error);
        }
    };

    const handleDeleteAllRecordings = async () => {
        if (!user?.userId) return;

        const confirmed = window.confirm(
            'Are you sure you want to delete all voice recordings? This action cannot be undone.'
        );

        if (!confirmed) return;

        setIsDeleting(true);
        setDeleteResult(null);

        try {
            const result = await deleteAllVoiceRecordings(user.userId);

            if (result.success) {
                setDeleteResult({
                    success: true,
                    message: `Successfully deleted ${result.deletedCount} voice recording(s).`,
                });
            } else {
                setDeleteResult({
                    success: false,
                    message: result.error || 'Failed to delete voice recordings.',
                });
            }
        } catch (error) {
            setDeleteResult({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred.',
            });
        } finally {
            setIsDeleting(false);
            await loadSecurityStatus();
        }
    };

    const handleClearAllData = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to clear all security data? This will remove all encryption keys and stored tokens. You may need to re-authenticate.'
        );

        if (!confirmed) return;

        try {
            await clearAllSecurityData();
            setDeleteResult({
                success: true,
                message: 'All security data has been cleared.',
            });
            await loadSecurityStatus();
        } catch (error) {
            setDeleteResult({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to clear security data.',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Privacy & Security</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your mobile privacy and security settings
                    </p>
                </div>
                {onClose && (
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                )}
            </div>

            {deleteResult && (
                <Alert variant={deleteResult.success ? 'default' : 'destructive'}>
                    <AlertDescription>{deleteResult.message}</AlertDescription>
                </Alert>
            )}

            {/* Security Status */}
            {securityStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Security Status
                        </CardTitle>
                        <CardDescription>Current security configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">Encryption Key</p>
                                <p className="text-2xl font-bold">
                                    {securityStatus.hasEncryptionKey ? '✓' : '✗'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Stored Tokens</p>
                                <p className="text-2xl font-bold">{securityStatus.tokenCount}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium mb-2">Rate Limit Usage</p>
                            <div className="space-y-2">
                                {Object.entries(securityStatus.rateLimitUsage).map(([key, usage]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                        <span className="capitalize">{key}</span>
                                        <span className="text-muted-foreground">
                                            {usage ? `${usage.count} used, ${usage.remaining} remaining` : 'No usage'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Location Privacy */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Location Privacy
                    </CardTitle>
                    <CardDescription>
                        Control how your location data is stored and protected
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="location-encryption">Encrypt Location Data</Label>
                            <p className="text-sm text-muted-foreground">
                                Store location data with AES-256 encryption
                            </p>
                        </div>
                        <Switch
                            id="location-encryption"
                            checked={locationEncryption}
                            onCheckedChange={setLocationEncryption}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Voice Recording Privacy */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5" />
                        Voice Recording Privacy
                    </CardTitle>
                    <CardDescription>
                        Manage your voice recordings and transcriptions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-delete">Auto-Delete After Transcription</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically delete audio files after transcription (keeps text)
                            </p>
                        </div>
                        <Switch
                            id="auto-delete"
                            checked={autoDeleteRecordings}
                            onCheckedChange={setAutoDeleteRecordings}
                        />
                    </div>

                    <div className="pt-4 border-t">
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAllRecordings}
                            disabled={isDeleting || !user}
                            className="w-full"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDeleting ? 'Deleting...' : 'Delete All Voice Recordings'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            This will permanently delete all voice recordings and their transcriptions
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Photo Privacy */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Photo Privacy
                    </CardTitle>
                    <CardDescription>
                        Control metadata in shared photos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="strip-exif">Strip EXIF Data</Label>
                            <p className="text-sm text-muted-foreground">
                                Remove location and camera metadata from shared photos
                            </p>
                        </div>
                        <Switch
                            id="strip-exif"
                            checked={stripExif}
                            onCheckedChange={setStripExif}
                        />
                    </div>

                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            EXIF data includes GPS coordinates, camera model, and capture time. Stripping
                            this data protects your privacy when sharing photos.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Token Security */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Token Security
                    </CardTitle>
                    <CardDescription>
                        Secure storage for authentication tokens
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="secure-tokens">Secure Token Storage</Label>
                            <p className="text-sm text-muted-foreground">
                                Store authentication tokens with encryption in IndexedDB
                            </p>
                        </div>
                        <Switch
                            id="secure-tokens"
                            checked={secureTokenStorage}
                            onCheckedChange={setSecureTokenStorage}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Clear All Data */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Shield className="h-5 w-5" />
                        Clear All Security Data
                    </CardTitle>
                    <CardDescription>
                        Remove all encryption keys, tokens, and security settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={handleClearAllData}
                        className="w-full"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Security Data
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        Warning: This will remove all security data and you may need to re-authenticate
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
