'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Settings,
    Server,
    Database,
    Shield,
    AlertTriangle,
    CheckCircle,
    Wrench,
    RefreshCw,
    Power,
    Clock,
    Activity,
    HardDrive,
    Cpu,
    Wifi
} from 'lucide-react';

export default function SuperAdminSystemPage() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const [autoBackup, setAutoBackup] = useState(true);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const { toast } = useToast();

    const handleToggleMaintenanceMode = async (enabled: boolean) => {
        try {
            setMaintenanceMode(enabled);
            toast({
                title: enabled ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
                description: enabled ? "Platform is now in maintenance mode" : "Platform is back online",
                variant: enabled ? "destructive" : "default"
            });
        } catch (error) {
            console.error('Failed to toggle maintenance mode:', error);
            toast({
                title: "Error",
                description: "Failed to update maintenance mode",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Configuration</h2>
                    <p className="text-muted-foreground">Manage platform settings and system maintenance</p>
                </div>
            </div>

            <Tabs defaultValue="maintenance" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
                </TabsList>

                <TabsContent value="maintenance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5" />
                                Maintenance Mode
                            </CardTitle>
                            <CardDescription>
                                Enable maintenance mode to perform system updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Power className="h-4 w-4" />
                                        <Label className="font-medium">Maintenance Mode</Label>
                                        {maintenanceMode && <Badge variant="destructive">Active</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        When enabled, users will see a maintenance page
                                    </p>
                                </div>
                                <Switch
                                    checked={maintenanceMode}
                                    onCheckedChange={handleToggleMaintenanceMode}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maintenance-message">Maintenance Message</Label>
                                <Textarea
                                    id="maintenance-message"
                                    placeholder="We're performing scheduled maintenance. We'll be back shortly!"
                                    value={maintenanceMessage}
                                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button>Save Settings</Button>
                                <Button variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Restart Services
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    System Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Cpu className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium">CPU Usage</span>
                                        </div>
                                        <span className="text-sm font-medium">15%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium">Memory Usage</span>
                                        </div>
                                        <span className="text-sm font-medium">32%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '32%' }} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Wifi className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-medium">Network I/O</span>
                                        </div>
                                        <span className="text-sm font-medium">8%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '8%' }} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Database Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Query Response Time</span>
                                    <span className="text-sm font-medium">4ms</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Active Connections</span>
                                    <span className="text-sm font-medium">23</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Cache Hit Rate</span>
                                    <span className="text-sm font-medium">94%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Storage Used</span>
                                    <span className="text-sm font-medium">2.3 GB</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <Label className="font-medium">Debug Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable detailed logging for troubleshooting
                                    </p>
                                </div>
                                <Switch
                                    checked={debugMode}
                                    onCheckedChange={setDebugMode}
                                />
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium">Security Status</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="text-sm">SSL Certificate</span>
                                        </div>
                                        <Badge className="bg-green-100 text-green-800">Valid</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="text-sm">Firewall</span>
                                        </div>
                                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="text-sm">Rate Limiting</span>
                                        </div>
                                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="backup" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Backup & Recovery
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <Label className="font-medium">Automatic Backups</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Daily automated backups at 2:00 AM UTC
                                    </p>
                                </div>
                                <Switch
                                    checked={autoBackup}
                                    onCheckedChange={setAutoBackup}
                                />
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium">Recent Backups</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <div className="font-medium text-sm">Daily Backup</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(Date.now() - 86400000).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                                            <Button size="sm" variant="outline">Download</Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <div className="font-medium text-sm">Daily Backup</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(Date.now() - 172800000).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                                            <Button size="sm" variant="outline">Download</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button>
                                    Create Backup Now
                                </Button>
                                <Button variant="outline">
                                    Restore from Backup
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}