'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Star, ThumbsUp, ThumbsDown, RefreshCw, User, Calendar } from 'lucide-react';

export function FeedbackClient() {
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<any[]>([]);

    useEffect(() => {
        // Mock data loading
        setTimeout(() => {
            setFeedback([
                {
                    id: '1',
                    type: 'feature_request',
                    title: 'Add more AI templates',
                    content: 'Would love to see more templates for different property types',
                    rating: 5,
                    status: 'pending',
                    createdAt: '2024-12-10T10:00:00Z',
                    userId: 'user1',
                    userName: 'John Agent'
                },
                {
                    id: '2',
                    type: 'bug_report',
                    title: 'Image upload issue',
                    content: 'Having trouble uploading images in the reimagine tool',
                    rating: 3,
                    status: 'in_progress',
                    createdAt: '2024-12-09T15:30:00Z',
                    userId: 'user2',
                    userName: 'Sarah Realtor'
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'feature_request': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'bug_report': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'general': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
        ));
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">User Feedback</h1>
                    <p className="text-muted-foreground">Review and manage user feedback and feature requests</p>
                </div>
                <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading feedback...</div>
            ) : feedback.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
                    <p className="text-muted-foreground">User feedback will appear here when submitted</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedback.map((item) => (
                        <Card key={item.id} className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-lg">{item.title}</h3>
                                            <Badge className={getStatusColor(item.status)}>
                                                {item.status.replace('_', ' ')}
                                            </Badge>
                                            <Badge className={getTypeColor(item.type)}>
                                                {item.type.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm mb-3">
                                            {item.content}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                <span>{item.userName}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {renderStars(item.rating)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm">
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <ThumbsDown className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            {/* Feedback Summary */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-blue-600">{feedback.length}</div>
                        <p className="text-xs text-blue-600 mt-1">All time submissions</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <ThumbsUp className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-yellow-600">
                            {feedback.filter(f => f.status === 'pending').length}
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">Awaiting response</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-green-600">
                            {feedback.length > 0 ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1) : '0'}
                        </div>
                        <p className="text-xs text-green-600 mt-1">Out of 5 stars</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}