'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    getFeedbackAction,
    categorizeFeedbackAction,
    respondToFeedbackAction,
    archiveFeedbackAction,
    generateFeedbackSummaryReportAction,
} from '@/features/admin/actions/admin-actions';
import { Feedback, FeedbackSummaryReport } from '@/services/admin/feedback-service';
import {
    MessageSquare,
    Filter,
    Search,
    FileText,
    ThumbsUp,
    ThumbsDown,
    Minus,
    Archive,
    Send,
    TrendingUp,
    BarChart3,
} from 'lucide-react';

export default function FeedbackManagementPage() {
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [response, setResponse] = useState('');
    const [summaryReport, setSummaryReport] = useState<FeedbackSummaryReport | null>(null);
    const { toast } = useToast();

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [sentimentFilter, setSentimentFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadFeedback();
    }, [statusFilter, categoryFilter, sentimentFilter]);

    const loadFeedback = async () => {
        setLoading(true);
        try {
            const result = await getFeedbackAction({
                status: statusFilter !== 'all' ? statusFilter : undefined,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
                sentiment: sentimentFilter !== 'all' ? sentimentFilter : undefined,
                limit: 100,
            });

            if (result.success && result.data) {
                setFeedback(result.data.feedback);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load feedback',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load feedback',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCategorize = async (feedbackId: string, category: Feedback['category']) => {
        try {
            const result = await categorizeFeedbackAction(feedbackId, category);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                loadFeedback();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to categorize feedback',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to categorize feedback',
                variant: 'destructive',
            });
        }
    };

    const handleRespond = async () => {
        if (!selectedFeedback || !response.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a response',
                variant: 'destructive',
            });
            return;
        }

        try {
            const result = await respondToFeedbackAction(selectedFeedback.feedbackId, response);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                setResponseDialogOpen(false);
                setResponse('');
                setSelectedFeedback(null);
                loadFeedback();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to send response',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to send response',
                variant: 'destructive',
            });
        }
    };

    const handleArchive = async (feedbackId: string) => {
        try {
            const result = await archiveFeedbackAction(feedbackId);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                loadFeedback();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to archive feedback',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to archive feedback',
                variant: 'destructive',
            });
        }
    };

    const handleGenerateReport = async () => {
        try {
            const result = await generateFeedbackSummaryReportAction();

            if (result.success && result.data) {
                setSummaryReport(result.data);
                setReportDialogOpen(true);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to generate report',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate report',
                variant: 'destructive',
            });
        }
    };

    const getSentimentIcon = (sentiment: Feedback['sentiment']) => {
        switch (sentiment) {
            case 'positive':
                return <ThumbsUp className="h-4 w-4 text-green-500" />;
            case 'negative':
                return <ThumbsDown className="h-4 w-4 text-red-500" />;
            case 'neutral':
                return <Minus className="h-4 w-4 text-yellow-500" />;
            default:
                return <Minus className="h-4 w-4 text-gray-500" />;
        }
    };

    const getSentimentBadge = (sentiment: Feedback['sentiment']) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            positive: 'default',
            negative: 'destructive',
            neutral: 'secondary',
            unknown: 'outline',
        };

        return (
            <Badge variant={variants[sentiment] || 'outline'} className="capitalize">
                {sentiment}
            </Badge>
        );
    };

    const getCategoryBadge = (category: Feedback['category']) => {
        const colors: Record<string, string> = {
            bug: 'bg-red-100 text-red-800',
            feature_request: 'bg-blue-100 text-blue-800',
            general: 'bg-gray-100 text-gray-800',
            uncategorized: 'bg-yellow-100 text-yellow-800',
        };

        return (
            <Badge className={colors[category] || 'bg-gray-100 text-gray-800'}>
                {category.replace('_', ' ')}
            </Badge>
        );
    };

    const getStatusBadge = (status: Feedback['status']) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            new: 'default',
            addressed: 'secondary',
            archived: 'outline',
        };

        return (
            <Badge variant={variants[status] || 'outline'} className="capitalize">
                {status}
            </Badge>
        );
    };

    const filteredFeedback = feedback.filter((item) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                item.feedbackText.toLowerCase().includes(query) ||
                item.userName.toLowerCase().includes(query) ||
                item.userEmail.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Feedback Management</h1>
                    <p className="text-muted-foreground">
                        View and respond to user feedback
                    </p>
                </div>
                <Button onClick={handleGenerateReport}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Generate Report
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search feedback..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="addressed">Addressed</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="bug">Bug</SelectItem>
                                <SelectItem value="feature_request">Feature Request</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sentiment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sentiments</SelectItem>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                                <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Feedback List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Feedback ({filteredFeedback.length})
                    </CardTitle>
                    <CardDescription>
                        All user feedback sorted by date
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading feedback...</div>
                    ) : filteredFeedback.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No feedback found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Feedback</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Sentiment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFeedback.map((item) => (
                                    <TableRow key={item.feedbackId}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{item.userName}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {item.userEmail}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="truncate">{item.feedbackText}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={item.category}
                                                onValueChange={(value) =>
                                                    handleCategorize(item.feedbackId, value as Feedback['category'])
                                                }
                                            >
                                                <SelectTrigger className="w-[150px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bug">Bug</SelectItem>
                                                    <SelectItem value="feature_request">
                                                        Feature Request
                                                    </SelectItem>
                                                    <SelectItem value="general">General</SelectItem>
                                                    <SelectItem value="uncategorized">
                                                        Uncategorized
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getSentimentIcon(item.sentiment)}
                                                {getSentimentBadge(item.sentiment)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                        <TableCell>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedFeedback(item);
                                                        setResponseDialogOpen(true);
                                                    }}
                                                    disabled={item.status === 'addressed'}
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleArchive(item.feedbackId)}
                                                    disabled={item.status === 'archived'}
                                                >
                                                    <Archive className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Response Dialog */}
            <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Respond to Feedback</DialogTitle>
                        <DialogDescription>
                            Send a response to {selectedFeedback?.userName}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedFeedback && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Original Feedback:</h4>
                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                    {selectedFeedback.feedbackText}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Your Response:
                                </label>
                                <Textarea
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    placeholder="Type your response here..."
                                    rows={6}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRespond}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Response
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Summary Report Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Feedback Summary Report</DialogTitle>
                        <DialogDescription>
                            Overview of user feedback and trends
                        </DialogDescription>
                    </DialogHeader>

                    {summaryReport && (
                        <div className="space-y-6">
                            {/* Overview */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Overview</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-2xl font-bold">
                                                {summaryReport.totalFeedback}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Total Feedback
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* By Category */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">By Category</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(summaryReport.byCategory).map(([category, count]) => (
                                        <Card key={category}>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold">{count}</div>
                                                <div className="text-sm text-muted-foreground capitalize">
                                                    {category.replace('_', ' ')}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* By Sentiment */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">By Sentiment</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(summaryReport.bySentiment).map(([sentiment, count]) => (
                                        <Card key={sentiment}>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold">{count}</div>
                                                <div className="text-sm text-muted-foreground capitalize">
                                                    {sentiment}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Common Themes */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Common Themes</h3>
                                <div className="space-y-2">
                                    {summaryReport.commonThemes.slice(0, 10).map((theme, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-muted rounded-md"
                                        >
                                            <span className="font-medium">{theme.theme}</span>
                                            <Badge>{theme.count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Feature Requests */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Top Feature Requests</h3>
                                <div className="space-y-2">
                                    {summaryReport.topFeatureRequests.slice(0, 5).map((request, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start justify-between p-3 bg-muted rounded-md"
                                        >
                                            <span className="text-sm flex-1">{request.request}</span>
                                            <Badge className="ml-2">{request.count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sentiment Trend */}
                            {summaryReport.sentimentTrend.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Sentiment Trend</h3>
                                    <div className="space-y-2">
                                        {summaryReport.sentimentTrend.slice(-7).map((trend, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 p-3 bg-muted rounded-md"
                                            >
                                                <span className="font-medium w-24">{trend.date}</span>
                                                <div className="flex-1 flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <ThumbsUp className="h-4 w-4 text-green-500" />
                                                        <span className="text-sm">{trend.positive}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Minus className="h-4 w-4 text-yellow-500" />
                                                        <span className="text-sm">{trend.neutral}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <ThumbsDown className="h-4 w-4 text-red-500" />
                                                        <span className="text-sm">{trend.negative}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setReportDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
