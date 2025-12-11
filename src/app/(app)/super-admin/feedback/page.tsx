'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';
import { getFeedbackAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateFeedbackStatusAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
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
    const [feedbackData, setFeedbackData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const { toast } = useToast();

    // Fetch real feedback data
    useEffect(() => {
        async function fetchFeedback() {
            try {
                const result = await getFeedbackAction();
                if (result.message === 'success') {
                    setFeedbackData(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch feedback:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchFeedback();
    }, []);

    // Handle status update
    const handleStatusUpdate = async (feedbackId: string, newStatus: 'submitted' | 'in-progress' | 'resolved' | 'closed') => {
        setUpdatingStatus(feedbackId);
        try {
            const result = await updateFeedbackStatusAction(feedbackId, newStatus);
            if (result.message === 'success') {
                // Update local state
                setFeedbackData(prev =>
                    prev.map(feedback =>
                        feedback.id === feedbackId
                            ? { ...feedback, status: newStatus, updatedAt: new Date().toISOString() }
                            : feedback
                    )
                );
                toast({
                    title: 'Status Updated',
                    description: `Feedback status changed to ${newStatus}`,
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update feedback status',
                variant: 'destructive',
            });
        } finally {
            setUpdatingStatus(null);
        }
    };

    // Filter feedback data based on selected category
    const getFilteredFeedback = (statusFilter?: string) => {
        let filtered = feedbackData;

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(f => f.type === selectedCategory);
        }

        // Apply status filter if provided
        if (statusFilter) {
            filtered = filtered.filter(f => f.status === statusFilter);
        }

        return filtered;
    };

    // Calculate stats from real data
    const feedbackStats = {
        total: feedbackData.length,
        pending: feedbackData.filter(f => f.status === 'submitted').length,
        resolved: feedbackData.filter(f => f.status === 'resolved').length,
        avgRating: 0, // Not applicable for feedback
        categories: {
            feature: feedbackData.filter(f => f.type === 'feature').length,
            bug: feedbackData.filter(f => f.type === 'bug').length,
            improvement: feedbackData.filter(f => f.type === 'improvement').length,
            general: feedbackData.filter(f => f.type === 'general').length,
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
                                        <SelectItem value="general">General</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant={selectedCategory !== 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    className={selectedCategory !== 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                                    onClick={() => selectedCategory !== 'all' && setSelectedCategory('all')}
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    {selectedCategory !== 'all' ? `Clear Filter (${selectedCategory})` : 'Filter Active'}
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="all" className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">Loading feedback...</p>
                                </div>
                            ) : getFilteredFeedback().length === 0 ? (
                                /* Empty State */
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-full w-fit mx-auto mb-4">
                                        <MessageSquare className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        {selectedCategory === 'all' ? 'No feedback submissions yet' : `No ${selectedCategory} feedback found`}
                                    </h3>
                                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                        {selectedCategory === 'all'
                                            ? 'When users submit feedback via the sidebar button or feedback forms, it will appear here for review and response.'
                                            : `No feedback of type "${selectedCategory}" has been submitted yet. Try selecting a different category or "All Categories".`
                                        }
                                    </p>
                                    <div className="flex items-center justify-center gap-4">
                                        <Button variant="outline" onClick={() => window.location.reload()}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Check for Updates
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* Feedback List */
                                <div className="space-y-4">
                                    {getFilteredFeedback().map((feedback) => (
                                        <Card key={feedback.id} className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant={
                                                            feedback.type === 'bug' ? 'destructive' :
                                                                feedback.type === 'feature' ? 'default' :
                                                                    feedback.type === 'improvement' ? 'secondary' :
                                                                        'outline'
                                                        }>
                                                            {feedback.type === 'bug' && <Bug className="h-3 w-3 mr-1" />}
                                                            {feedback.type === 'feature' && <Lightbulb className="h-3 w-3 mr-1" />}
                                                            {feedback.type === 'improvement' && <TrendingUp className="h-3 w-3 mr-1" />}
                                                            {feedback.type === 'general' && <MessageSquare className="h-3 w-3 mr-1" />}
                                                            {feedback.type}
                                                        </Badge>
                                                        <Badge variant={
                                                            feedback.status === 'submitted' ? 'secondary' :
                                                                feedback.status === 'in-progress' ? 'default' :
                                                                    feedback.status === 'resolved' ? 'outline' :
                                                                        'destructive'
                                                        }>
                                                            {feedback.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        From: {feedback.userEmail} • {new Date(feedback.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm">{feedback.message}</p>
                                                </div>
                                                <div className="ml-4 flex flex-col gap-2">
                                                    <Select
                                                        value={feedback.status}
                                                        onValueChange={(value) => handleStatusUpdate(feedback.id, value as any)}
                                                        disabled={updatingStatus === feedback.id}
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="submitted">Pending</SelectItem>
                                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                                            <SelectItem value="resolved">Resolved</SelectItem>
                                                            <SelectItem value="closed">Closed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {updatingStatus === feedback.id && (
                                                        <div className="flex items-center justify-center">
                                                            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="pending" className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">Loading feedback...</p>
                                </div>
                            ) : getFilteredFeedback('submitted').length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium mb-2">
                                        {selectedCategory === 'all' ? 'No pending feedback' : `No pending ${selectedCategory} feedback`}
                                    </p>
                                    <p className="text-sm">
                                        {selectedCategory === 'all'
                                            ? 'Items requiring review will appear here'
                                            : `No pending ${selectedCategory} feedback found. Try a different category.`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {getFilteredFeedback('submitted').map((feedback) => (
                                        <Card key={feedback.id} className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant={
                                                            feedback.type === 'bug' ? 'destructive' :
                                                                feedback.type === 'feature' ? 'default' :
                                                                    feedback.type === 'improvement' ? 'secondary' :
                                                                        'outline'
                                                        }>
                                                            {feedback.type === 'bug' && <Bug className="h-3 w-3 mr-1" />}
                                                            {feedback.type === 'feature' && <Lightbulb className="h-3 w-3 mr-1" />}
                                                            {feedback.type === 'improvement' && <TrendingUp className="h-3 w-3 mr-1" />}
                                                            {feedback.type === 'general' && <MessageSquare className="h-3 w-3 mr-1" />}
                                                            {feedback.type}
                                                        </Badge>
                                                        <Badge variant="secondary">pending</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        From: {feedback.userEmail} • {new Date(feedback.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm">{feedback.message}</p>
                                                </div>
                                                <div className="ml-4 flex flex-col gap-2">
                                                    <Select
                                                        value={feedback.status}
                                                        onValueChange={(value) => handleStatusUpdate(feedback.id, value as any)}
                                                        disabled={updatingStatus === feedback.id}
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="submitted">Pending</SelectItem>
                                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                                            <SelectItem value="resolved">Resolved</SelectItem>
                                                            <SelectItem value="closed">Closed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {updatingStatus === feedback.id && (
                                                        <div className="flex items-center justify-center">
                                                            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="resolved" className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">Loading feedback...</p>
                                </div>
                            ) : getFilteredFeedback('resolved').length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium mb-2">
                                        {selectedCategory === 'all' ? 'No resolved feedback' : `No resolved ${selectedCategory} feedback`}
                                    </p>
                                    <p className="text-sm">
                                        {selectedCategory === 'all'
                                            ? 'Completed feedback items will appear here'
                                            : `No resolved ${selectedCategory} feedback found. Try a different category.`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {getFilteredFeedback('resolved').map((feedback) => (
                                        <Card key={feedback.id} className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant={
                                                            feedback.type === 'bug' ? 'destructive' :
                                                                feedback.type === 'feature' ? 'default' :
                                                                    feedback.type === 'improvement' ? 'secondary' :
                                                                        'outline'
                                                        }>
                                                            {feedback.type === 'bug' && <Bug className="h-3 w-3 mr-1" />}
                                                            {feedback.type === 'feature' && <Lightbulb className="h-3 w-3 mr-1" />}
                                                            {feedback.type === 'improvement' && <TrendingUp className="h-3 w-3 mr-1" />}
                                                            {feedback.type === 'general' && <MessageSquare className="h-3 w-3 mr-1" />}
                                                            {feedback.type}
                                                        </Badge>
                                                        <Badge variant="outline">resolved</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        From: {feedback.userEmail} • {new Date(feedback.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm">{feedback.message}</p>
                                                </div>
                                                <div className="ml-4 flex flex-col gap-2">
                                                    <Select
                                                        value={feedback.status}
                                                        onValueChange={(value) => handleStatusUpdate(feedback.id, value as any)}
                                                        disabled={updatingStatus === feedback.id}
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="submitted">Pending</SelectItem>
                                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                                            <SelectItem value="resolved">Resolved</SelectItem>
                                                            <SelectItem value="closed">Closed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {updatingStatus === feedback.id && (
                                                        <div className="flex items-center justify-center">
                                                            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
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
                                            <span className="font-bold">{feedbackStats.categories.general}</span>
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