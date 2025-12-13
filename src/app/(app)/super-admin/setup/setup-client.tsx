'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import {
    Shield,
    CheckCircle,
    AlertTriangle,
    Users,
    Key,
    Settings,
    UserPlus,
    Crown,
    RefreshCw
} from 'lucide-react';

export function SetupClient() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setMessage('Email is required');
            return;
        }

        setIsSubmitting(true);
        try {
            // Mock user creation - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage('success');
            setShowSuccess(true);
        } catch (error) {
            setMessage('Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Mock admin data for UI demonstration
    const adminUsers = [
        {
            id: '1',
            email: 'admin@bayoncoagent.com',
            role: 'Super Admin',
            status: 'active',
            lastLogin: '2 hours ago',
            permissions: ['all']
        }
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">System Setup</h1>
                    <p className="text-muted-foreground">Configure system settings and manage administrators</p>
                </div>
            </div>

            {/* Admin Overview */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-blue-600">{adminUsers.length}</div>
                        <p className="text-xs text-blue-600 mt-1">Active administrators</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                        <Crown className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-purple-600">1</div>
                        <p className="text-xs text-purple-600 mt-1">Full access users</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                        <Shield className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-lg font-bold text-green-600">Secure</div>
                        <p className="text-xs text-green-600 mt-1">All systems protected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Admin Management Tabs */}
            <Tabs defaultValue="create" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="create">Create Admin</TabsTrigger>
                    <TabsTrigger value="manage">Manage Admins</TabsTrigger>
                    <TabsTrigger value="security">Security Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-6">
                    <div className="max-w-2xl mx-auto">
                        <Card>
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
                                    <UserPlus className="h-8 w-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Create User / Admin</CardTitle>
                                <CardDescription className="text-base">
                                    Create a new user or grant admin privileges
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {showSuccess ? (
                                    <div className="text-center space-y-6">
                                        <div className="p-4 bg-green-50 dark:bg-green-900/50 rounded-full w-fit mx-auto">
                                            <CheckCircle className="h-12 w-12 text-green-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2">User Updated Successfully!</h3>
                                            <p className="text-muted-foreground">
                                                The user {email} has been updated with role: {role}.
                                            </p>
                                        </div>
                                        <div className="flex gap-3 justify-center">
                                            <Button onClick={() => window.location.href = '/super-admin'}>
                                                Go to Admin Dashboard
                                            </Button>
                                            <Button variant="outline" onClick={() => setShowSuccess(false)}>
                                                Update Another User
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {message && message !== 'success' && (
                                            <Alert variant="destructive">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>{message}</AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="space-y-3">
                                            <Label htmlFor="email" className="text-base font-medium">User Email Address</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="user@example.com"
                                                required
                                                className="h-12"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                The user must already exist in the system (Cognito).
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="role" className="text-base font-medium">Role</Label>
                                            <select
                                                id="role"
                                                name="role"
                                                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                            <p className="text-sm text-muted-foreground">
                                                Select the role to assign to this user.
                                            </p>
                                        </div>

                                        <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    Updating User...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Create / Update User
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="manage" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">Admin User Management</CardTitle>
                                    <CardDescription>View and manage all administrative accounts</CardDescription>
                                </div>
                                <Button>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Admin
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {adminUsers.map((admin) => (
                                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                                                <Crown className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-medium">{admin.email}</h4>
                                                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                                                        {admin.role}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                                        {admin.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Last login: {admin.lastLogin}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm">
                                                <Settings className="h-4 w-4 mr-2" />
                                                Manage
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Key className="h-5 w-5 text-blue-600" />
                                    Admin Key Management
                                </CardTitle>
                                <CardDescription>Manage super admin authentication keys</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Current Admin Key</span>
                                        <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded border flex-1">
                                            ••••••••••••••••••••••••
                                        </code>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button variant="outline" className="w-full">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Regenerate Admin Key
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Regenerating the key will invalidate the current key and require all admins to use the new key.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-green-600" />
                                    Security Settings
                                </CardTitle>
                                <CardDescription>Configure admin security policies</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">Two-Factor Authentication</div>
                                        <div className="text-sm text-muted-foreground">Require 2FA for admin accounts</div>
                                    </div>
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">Coming Soon</Badge>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">Session Timeout</div>
                                        <div className="text-sm text-muted-foreground">Auto-logout after inactivity</div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-600">24 hours</Badge>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">IP Restrictions</div>
                                        <div className="text-sm text-muted-foreground">Limit admin access by IP</div>
                                    </div>
                                    <Badge variant="outline" className="text-gray-600 border-gray-600">Disabled</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Security Notice */}
            <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                    <strong>Security Best Practices:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                        <li>• Keep the admin key secure and only share with trusted administrators</li>
                        <li>• Set the <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">SUPER_ADMIN_KEY</code> environment variable in your deployment</li>
                        <li>• Regularly review admin access and remove unused accounts</li>
                        <li>• Monitor admin activity through the system logs</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
}