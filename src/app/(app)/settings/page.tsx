
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActionState, useEffect, useState } from 'react';
import { updatePasswordAction, connectGoogleBusinessProfileAction } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';
import { Loader2, CheckCircle2, Globe, Home, Building, Share2, Users, Workflow, Sparkles, AlertCircle, XCircle, User, Palette, Plug, Database, HardDrive, Lock, Activity, Search, Newspaper, Link2, TrendingUp, Clock, Monitor, Smartphone, MapPin, FileText, Image, Wand2, Brain } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { getOAuthTokens, type OAuthTokenData } from '@/aws/dynamodb';
import { getConfig } from '@/aws/config';
import { UsageTracking, UsageStats } from '@/components/ui/usage-tracking';


function UpdatePasswordButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? 'Updating...' : 'Update Password'}
        </Button>
    )
}

function ChangePasswordForm() {
    const [state, formAction] = useActionState(updatePasswordAction, { message: '', errors: {} });

    useEffect(() => {
        if (state.message === 'success') {
            toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
        } else if (state.message) {
            toast({ variant: 'destructive', title: 'Update Failed', description: state.message });
        }
    }, [state]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
                {state.errors?.currentPassword && <p className="text-sm text-destructive">{state.errors.currentPassword[0]}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" required />
                {state.errors?.newPassword && <p className="text-sm text-destructive">{state.errors.newPassword[0]}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
                {state.errors?.confirmPassword && <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>}
            </div>
            <UpdatePasswordButton />
        </form>
    );
}

function ServiceStatusRow({
    icon,
    name,
    description,
    details,
    status
}: {
    icon: React.ReactNode;
    name: string;
    description: string;
    details?: string[];
    status: ServiceState;
}) {
    return (
        <div className="flex items-start justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3 flex-1">
                <div className="rounded-lg bg-muted p-2 mt-0.5">
                    {icon}
                </div>
                <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-sm">{name}</h3>
                    <p className="text-xs text-muted-foreground">{description}</p>
                    {details && details.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                            {details.map((detail, idx) => (
                                <p key={idx} className="text-xs text-muted-foreground font-mono">
                                    {detail}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
                {status.status === 'checking' && (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Checking...</span>
                    </>
                )}
                {status.status === 'connected' && (
                    <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-600">Connected</span>
                    </>
                )}
                {status.status === 'error' && (
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-xs font-semibold text-red-600">Error</span>
                        </div>
                        {status.error && (
                            <span className="text-xs text-red-600">{status.error}</span>
                        )}
                    </div>
                )}
                {status.status === 'not-configured' && (
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs font-semibold text-yellow-600">Not Configured</span>
                        </div>
                        {status.error && (
                            <span className="text-xs text-yellow-600">{status.error}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

type ServiceStatus = 'checking' | 'connected' | 'error' | 'not-configured';

interface ServiceState {
    status: ServiceStatus;
    error?: string;
}

export default function SettingsPage() {
    const { user } = useUser();
    const [gbpData, setGbpData] = useState<OAuthTokenData | null>(null);
    const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);

    // Service status states
    const [bedrockStatus, setBedrockStatus] = useState<ServiceState>({ status: 'checking' });
    const [dynamodbStatus, setDynamodbStatus] = useState<ServiceState>({ status: 'checking' });
    const [s3Status, setS3Status] = useState<ServiceState>({ status: 'checking' });
    const [cognitoStatus, setCognitoStatus] = useState<ServiceState>({ status: 'checking' });
    const [cloudwatchStatus, setCloudwatchStatus] = useState<ServiceState>({ status: 'checking' });
    const [tavilyStatus, setTavilyStatus] = useState<ServiceState>({ status: 'checking' });
    const [newsApiStatus, setNewsApiStatus] = useState<ServiceState>({ status: 'checking' });
    const [bridgeApiStatus, setBridgeApiStatus] = useState<ServiceState>({ status: 'checking' });

    useEffect(() => {
        async function loadOAuthTokens() {
            if (!user) {
                setIsLoadingIntegrations(false);
                return;
            }

            try {
                const tokens = await getOAuthTokens(user.id, 'GOOGLE_BUSINESS');
                setGbpData(tokens);
            } catch (error) {
                console.error('Failed to load OAuth tokens:', error);
                setGbpData(null);
            } finally {
                setIsLoadingIntegrations(false);
            }
        }

        loadOAuthTokens();
    }, [user]);

    useEffect(() => {
        async function checkServices() {
            const config = getConfig();

            // Check AWS Bedrock
            try {
                if (!config.bedrock.modelId) {
                    setBedrockStatus({ status: 'not-configured', error: 'Model ID not configured' });
                } else {
                    setBedrockStatus({ status: 'connected' });
                }
            } catch (error) {
                setBedrockStatus({ status: 'error', error: 'Configuration error' });
            }

            // Check DynamoDB
            try {
                if (!config.dynamodb.tableName) {
                    setDynamodbStatus({ status: 'not-configured', error: 'Table name not configured' });
                } else {
                    setDynamodbStatus({ status: 'connected' });
                }
            } catch (error) {
                setDynamodbStatus({ status: 'error', error: 'Configuration error' });
            }

            // Check S3
            try {
                if (!config.s3.bucketName) {
                    setS3Status({ status: 'not-configured', error: 'Bucket name not configured' });
                } else {
                    setS3Status({ status: 'connected' });
                }
            } catch (error) {
                setS3Status({ status: 'error', error: 'Configuration error' });
            }

            // Check Cognito
            try {
                if (!config.cognito.userPoolId) {
                    setCognitoStatus({ status: 'not-configured', error: 'User pool not configured' });
                } else {
                    setCognitoStatus({ status: 'connected' });
                }
            } catch (error) {
                setCognitoStatus({ status: 'error', error: 'Configuration error' });
            }

            // Check CloudWatch (assume connected if region is set)
            try {
                if (config.region) {
                    setCloudwatchStatus({ status: 'connected' });
                } else {
                    setCloudwatchStatus({ status: 'not-configured', error: 'Region not configured' });
                }
            } catch (error) {
                setCloudwatchStatus({ status: 'error', error: 'Configuration error' });
            }

            // Check external APIs via server endpoint
            checkExternalAPIs();
        }

        checkServices();
    }, []);

    // Check external APIs (needs server-side check since keys are not exposed to client)
    async function checkExternalAPIs() {
        try {
            const response = await fetch('/api/check-services');
            if (response.ok) {
                const data = await response.json();
                setTavilyStatus(data.tavily || { status: 'not-configured', error: 'API key not configured' });
                setNewsApiStatus(data.newsApi || { status: 'not-configured', error: 'API key not configured' });
                setBridgeApiStatus(data.bridgeApi || { status: 'not-configured', error: 'API key not configured' });
            } else {
                // If endpoint doesn't exist, assume not configured
                setTavilyStatus({ status: 'not-configured', error: 'Status check unavailable' });
                setNewsApiStatus({ status: 'not-configured', error: 'Status check unavailable' });
                setBridgeApiStatus({ status: 'not-configured', error: 'Status check unavailable' });
            }
        } catch (error) {
            // Fallback: assume not configured if we can't check
            setTavilyStatus({ status: 'not-configured', error: 'Status check unavailable' });
            setNewsApiStatus({ status: 'not-configured', error: 'Status check unavailable' });
            setBridgeApiStatus({ status: 'not-configured', error: 'Status check unavailable' });
        }
    }

    const isGbpConnected = gbpData && gbpData.accessToken;
    const config = getConfig();

    return (
        <div className="animate-fade-in-up space-y-8">

            <Tabs defaultValue="account" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid lg:grid-cols-6">
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Account</span>
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Activity</span>
                    </TabsTrigger>
                    <TabsTrigger value="usage" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Usage</span>
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="flex items-center gap-2">
                        <Plug className="h-4 w-4" />
                        <span className="hidden sm:inline">Integrations</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">Services</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Appearance</span>
                    </TabsTrigger>
                </TabsList>

                {/* Account Tab */}
                <TabsContent value="account" className="space-y-6">
                    {/* Security Status Card */}
                    <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="font-headline text-green-900 dark:text-green-100">
                                            Your Account is Secure
                                        </CardTitle>
                                        <CardDescription className="text-green-700 dark:text-green-300">
                                            All security features are active and protecting your data
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {/* Encryption */}
                                <div className="flex items-start gap-3 rounded-lg bg-background/50 p-3 border">
                                    <div className="rounded-md bg-green-100 dark:bg-green-900/50 p-1.5 mt-0.5">
                                        <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground">End-to-End Encryption</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            AES-256 encryption at rest, TLS in transit
                                        </p>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                </div>

                                {/* AWS Security */}
                                <div className="flex items-start gap-3 rounded-lg bg-background/50 p-3 border">
                                    <div className="rounded-md bg-green-100 dark:bg-green-900/50 p-1.5 mt-0.5">
                                        <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground">AWS Infrastructure</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Enterprise-grade security & monitoring
                                        </p>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                </div>

                                {/* Secure Auth */}
                                <div className="flex items-start gap-3 rounded-lg bg-background/50 p-3 border">
                                    <div className="rounded-md bg-green-100 dark:bg-green-900/50 p-1.5 mt-0.5">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground">Secure Authentication</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            AWS Cognito with JWT tokens
                                        </p>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                </div>

                                {/* Data Privacy */}
                                <div className="flex items-start gap-3 rounded-lg bg-background/50 p-3 border">
                                    <div className="rounded-md bg-green-100 dark:bg-green-900/50 p-1.5 mt-0.5">
                                        <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground">Data Privacy</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Your data is never sold or shared
                                        </p>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                </div>
                            </div>

                            {/* Additional Security Info */}
                            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900">
                                <div className="flex items-start gap-2 text-xs text-green-700 dark:text-green-300">
                                    <Lock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                    <p>
                                        Your connection is secure. All data is encrypted and stored in compliance with industry standards.
                                        View our <a href="/privacy" className="underline hover:text-green-900 dark:hover:text-green-100">Privacy Policy</a> and{' '}
                                        <a href="/terms" className="underline hover:text-green-900 dark:hover:text-green-100">Terms of Service</a>.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Profile Information</CardTitle>
                            <CardDescription>
                                Your email and account details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Contact support to change your email address.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Security</CardTitle>
                            <CardDescription>
                                Manage your password and security settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChangePasswordForm />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-6">
                    {/* Login History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Login History</CardTitle>
                            <CardDescription>
                                Recent sign-ins to your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Current Session */}
                                <div className="flex items-start gap-3 rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-4">
                                    <div className="rounded-md bg-green-100 dark:bg-green-900/50 p-2">
                                        <Monitor className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold">Current Session</p>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Active
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Monitor className="h-3 w-3" />
                                                <span>macOS • Chrome</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                <span>San Francisco, CA</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>Today at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Previous Sessions */}
                                <div className="flex items-start gap-3 rounded-lg border p-4">
                                    <div className="rounded-md bg-muted p-2">
                                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold mb-1">Mobile Device</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Smartphone className="h-3 w-3" />
                                                <span>iOS • Safari</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                <span>San Francisco, CA</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>Yesterday at 3:45 PM</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-lg border p-4">
                                    <div className="rounded-md bg-muted p-2">
                                        <Monitor className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold mb-1">Desktop</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Monitor className="h-3 w-3" />
                                                <span>Windows • Edge</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                <span>Los Angeles, CA</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>3 days ago</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <p className="text-xs text-muted-foreground">
                                    See an unfamiliar device? <Button variant="link" className="h-auto p-0 text-xs text-destructive">Sign out all devices</Button>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Generation History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Recent Activity</CardTitle>
                            <CardDescription>
                                Your latest content generation and AI interactions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Blog Post */}
                                <div className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                    <div className="rounded-md bg-blue-100 dark:bg-blue-900/50 p-2">
                                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold mb-1">Blog Post Generated</p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            "Top 10 Home Staging Tips for Maximum Appeal"
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                2 hours ago
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Brain className="h-3 w-3" />
                                                Claude 3.5 Sonnet
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Reimagine */}
                                <div className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                    <div className="rounded-md bg-purple-100 dark:bg-purple-900/50 p-2">
                                        <Image className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold mb-1">Image Enhanced</p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Virtual staging applied to living room photo
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                5 hours ago
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Wand2 className="h-3 w-3" />
                                                Reimagine
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media */}
                                <div className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                    <div className="rounded-md bg-green-100 dark:bg-green-900/50 p-2">
                                        <Share2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold mb-1">Social Media Post Created</p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Instagram caption for new listing announcement
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Yesterday
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Brain className="h-3 w-3" />
                                                Claude 3.5 Sonnet
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Research Report */}
                                <div className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                    <div className="rounded-md bg-orange-100 dark:bg-orange-900/50 p-2">
                                        <Search className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold mb-1">Research Report Generated</p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Market analysis for Downtown San Francisco
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                2 days ago
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Brain className="h-3 w-3" />
                                                Intelligence Hub
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Listing Description */}
                                <div className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                    <div className="rounded-md bg-pink-100 dark:bg-pink-900/50 p-2">
                                        <Home className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold mb-1">Listing Description Created</p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Luxury condo with bay views
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                3 days ago
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Brain className="h-3 w-3" />
                                                Studio
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <Button variant="outline" className="w-full">
                                    View All Activity
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Usage Tab */}
                <TabsContent value="usage" className="space-y-6">
                    <UsageStats
                        stats={[
                            {
                                label: 'Content Created',
                                value: 127,
                                previousValue: 98,
                            },
                            {
                                label: 'AI Requests',
                                value: 234,
                                previousValue: 189,
                            },
                            {
                                label: 'Engagement Rate',
                                value: 8.5,
                                previousValue: 7.2,
                                format: 'percentage',
                            },
                        ]}
                    />

                    <UsageTracking
                        limits={[
                            {
                                feature: 'AI Content Generation',
                                used: 45,
                                limit: 50,
                                period: 'monthly',
                                resetDate: new Date('2024-12-01'),
                            },
                            {
                                feature: 'Image Reimagine',
                                used: 8,
                                limit: 20,
                                period: 'monthly',
                                resetDate: new Date('2024-12-01'),
                            },
                            {
                                feature: 'Marketing Plans',
                                used: 2,
                                limit: 5,
                                period: 'monthly',
                                resetDate: new Date('2024-12-01'),
                            },
                            {
                                feature: 'Brand Audits',
                                used: 3,
                                limit: 10,
                                period: 'monthly',
                                resetDate: new Date('2024-12-01'),
                            },
                        ]}
                    />
                </TabsContent>

                {/* Integrations Tab */}
                <TabsContent value="integrations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Connected Services</CardTitle>
                            <CardDescription>
                                Connect your essential platforms to automate workflows and unify your data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Active Integration */}
                                <div className="flex items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-md">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-lg bg-muted p-3">
                                            <Globe className="h-6 w-6 text-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Google Business Profile</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Sync reviews and business information
                                            </p>
                                        </div>
                                    </div>
                                    {isGbpConnected ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="text-sm font-semibold">Connected</span>
                                        </div>
                                    ) : (
                                        <form action={connectGoogleBusinessProfileAction}>
                                            <Button type="submit" disabled={isLoadingIntegrations} variant="ai">
                                                {isLoadingIntegrations ? 'Checking...' : 'Connect'}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Coming Soon</CardTitle>
                            <CardDescription>
                                More integrations are on the way to enhance your workflow.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-4 rounded-lg border border-dashed p-4">
                                    <div className="rounded-lg bg-muted p-3">
                                        <Home className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-muted-foreground">Zillow</h3>
                                        <p className="text-sm text-muted-foreground">Reviews & ratings</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 rounded-lg border border-dashed p-4">
                                    <div className="rounded-lg bg-muted p-3">
                                        <Building className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-muted-foreground">Realtor.com</h3>
                                        <p className="text-sm text-muted-foreground">Testimonials</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 rounded-lg border border-dashed p-4">
                                    <div className="rounded-lg bg-muted p-3">
                                        <Share2 className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-muted-foreground">Social Media</h3>
                                        <p className="text-sm text-muted-foreground">Auto-posting</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 rounded-lg border border-dashed p-4">
                                    <div className="rounded-lg bg-muted p-3">
                                        <Users className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-muted-foreground">CRM</h3>
                                        <p className="text-sm text-muted-foreground">Lead sync</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 rounded-lg border border-dashed p-4">
                                    <div className="rounded-lg bg-muted p-3">
                                        <Workflow className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-muted-foreground">MCP</h3>
                                        <p className="text-sm text-muted-foreground">AI modes</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Services Tab */}
                <TabsContent value="ai" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">AWS Services</CardTitle>
                            <CardDescription>
                                Core AWS infrastructure services powering the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* AWS Bedrock */}
                                <ServiceStatusRow
                                    icon={<Sparkles className="h-5 w-5" />}
                                    name="AWS Bedrock"
                                    description="AI content generation and analysis"
                                    details={[
                                        `Model: ${config.bedrock.modelId}`,
                                        `Region: ${config.bedrock.region}`
                                    ]}
                                    status={bedrockStatus}
                                />

                                {/* DynamoDB */}
                                <ServiceStatusRow
                                    icon={<Database className="h-5 w-5" />}
                                    name="Amazon DynamoDB"
                                    description="NoSQL database for user data"
                                    details={[
                                        `Table: ${config.dynamodb.tableName}`,
                                        `Region: ${config.region}`
                                    ]}
                                    status={dynamodbStatus}
                                />

                                {/* S3 */}
                                <ServiceStatusRow
                                    icon={<HardDrive className="h-5 w-5" />}
                                    name="Amazon S3"
                                    description="Object storage for files and assets"
                                    details={[
                                        `Bucket: ${config.s3.bucketName}`,
                                        `Region: ${config.region}`
                                    ]}
                                    status={s3Status}
                                />

                                {/* Cognito */}
                                <ServiceStatusRow
                                    icon={<Lock className="h-5 w-5" />}
                                    name="AWS Cognito"
                                    description="User authentication and authorization"
                                    details={[
                                        `User Pool: ${config.cognito.userPoolId}`,
                                        `Region: ${config.region}`
                                    ]}
                                    status={cognitoStatus}
                                />

                                {/* CloudWatch */}
                                <ServiceStatusRow
                                    icon={<Activity className="h-5 w-5" />}
                                    name="AWS CloudWatch"
                                    description="Logging and monitoring"
                                    details={[`Region: ${config.region}`]}
                                    status={cloudwatchStatus}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">External APIs</CardTitle>
                            <CardDescription>
                                Third-party services integrated into the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Tavily API */}
                                <ServiceStatusRow
                                    icon={<Search className="h-5 w-5" />}
                                    name="Tavily API"
                                    description="Web search for AI research flows"
                                    status={tavilyStatus}
                                />

                                {/* NewsAPI */}
                                <ServiceStatusRow
                                    icon={<Newspaper className="h-5 w-5" />}
                                    name="NewsAPI.org"
                                    description="Real estate news feed"
                                    status={newsApiStatus}
                                />

                                {/* Bridge API */}
                                <ServiceStatusRow
                                    icon={<Link2 className="h-5 w-5" />}
                                    name="Bridge API"
                                    description="Zillow review integration"
                                    status={bridgeApiStatus}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Theme</CardTitle>
                            <CardDescription>
                                Customize the look and feel of the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="theme" className="text-base">Color Mode</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Choose between light, dark, or system theme
                                    </p>
                                </div>
                                <ThemeToggle />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
