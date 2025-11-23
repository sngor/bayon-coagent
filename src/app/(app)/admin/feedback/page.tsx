'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    MessageSquare,
    Search,
    Filter,
    Star,
    ThumbsUp,
    ThumbsDown,
    AlertTriangle,
    CheckCircle,
    Clock,
    User,
    Calendar,
    Tag,
    Reply,
    Archive,
    Trash2,
    Download,
    RefreshCw,
    TrendingUp,
    BarChart3,
    Heart,
    Lightbulb,
    Bug
} from 'lucide-react';

export default function AdminFeedbackPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Mock feedback data structure for UI demonstration
    const feedbackStats = {
        total: 0,
        pending: 0,
        resolved: 0,
        avgRating: 0,
        categories: {
            feature: 0,
            bug: 0,
            improvement: 0,
            praise: 0
        }
    };

    return (
        <div className="space-y-8">
            {/* Feedback Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-blue-600">{feedbackStats.total}</div>
                        <p className="text-xs text-blue-600 mt-1">All time submissions</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-orange-600">{feedbackStats.pending}</div>
                        <p className="text-xs text-orange-600 mt-1">Awaiting response</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-green-600">{feedbackStats.resolved}</div>
                        <p className="text-xs text-green-600 mt-1">Completed items</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-yellow-600">{feedbackStats.avgRating}</div>
                        <p className="text-xs text-yellow-600 mt-1">User satisfaction</p>
                    </CardContent>
                </Card>
            </div>

            {/* Feedback Management Interface */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Feedback Management</CardTitle>
                            <CardDescription>Review and respond to user feedback</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="all">All Feedback</TabsTrigger>
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search feedback..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 w-64"
                                    />
                                </div>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="feature">Feature Request</SelectItem>
                                        <SelectItem value="bug">Bug Report</SelectItem>
                                        <SelectItem value="improvement">Improvement</SelectItem>
                                        <SelectItem value="praise">Praise</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="all" className="space-y-4">
                            {/* Empty State */}
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-full w-fit mx-auto mb-4">
                                    <MessageSquare className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No feedback submissions yet</h3>
                                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                    When users submit feedback via the sidebar button or feedback forms,
                                    it will appear here for review and response.
                                </p>
                                <div className="flex items-center justify-center gap-4">
                                    <Button variant="outline">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Check for Updates
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="pending" className="space-y-4">
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="font-medium mb-2">No pending feedback</p>
                                <p className="text-sm">Items requiring review will appear here</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="resolved" className="space-y-4">
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="font-medium mb-2">No resolved feedback</p>
                                <p className="text-sm">Completed feedback items will appear here</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Feedback Categories</CardTitle>
                                        <CardDescription>Distribution of feedback types</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Lightbulb className="h-5 w-5 text-blue-600" />
                                                <span className="font-medium">Feature Requests</span>
                                            </div>
                                            <span className="font-bold">{feedbackStats.categories.feature}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Bug className="h-5 w-5 text-red-600" />
                                                <span className="font-medium">Bug Reports</span>
                                            </div>
                                            <span className="font-bold">{feedbackStats.categories.bug}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <TrendingUp className="h-5 w-5 text-yellow-600" />
                                                <span className="font-medium">Improvements</span>
                                            </div>
                                            <span className="font-bold">{feedbackStats.categories.improvement}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Heart className="h-5 w-5 text-green-600" />
                                                <span className="font-medium">Praise</span>
                                            </div>
                                            <span className="font-bold">{feedbackStats.categories.praise}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Feedback Trends</CardTitle>
                                        <CardDescription>Submission patterns over time</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8 text-muted-foreground">
                                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p className="font-medium mb-2">Analytics Coming Soon</p>
                                            <p className="text-sm">Trend charts will appear as feedback data accumulates</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Quick Response Templates */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Response Templates</CardTitle>
                    <CardDescription>Pre-written responses for common feedback types</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                                <span className="font-medium">Thank You Response</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                "Thank you for your valuable feedback! We appreciate you taking the time to help us improve."
                            </p>
                            <Button variant="outline" size="sm">Use Template</Button>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Bug className="h-4 w-4 text-red-600" />
                                <span className="font-medium">Bug Report Response</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                "We've received your bug report and our team is investigating. We'll keep you updated on our progress."
                            </p>
                            <Button variant="outline" size="sm">Use Template</Button>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Lightbulb className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Feature Request Response</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                "Great suggestion! We've added your feature request to our roadmap for consideration."
                            </p>
                            <Button variant="outline" size="sm">Use Template</Button>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="font-medium">Resolution Response</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                "Good news! We've implemented a fix for the issue you reported. Please let us know if you need any help."
                            </p>
                            <Button variant="outline" size="sm">Use Template</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Status */}
            <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">Feedback System Active</h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            The feedback system is fully operational and ready to receive user submissions.
                            Users can submit feedback via the sidebar button or contact forms throughout the platform.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}