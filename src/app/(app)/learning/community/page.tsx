'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    MessageSquare,
    ThumbsUp,
    Reply,
    Share2,
    Search,
    Filter,
    Plus,
    Clock,
    Award,
    Calendar,
    MapPin,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';
import { cn } from '@/lib/utils';

type CommunityPost = {
    id: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
        title: string;
        badges: string[];
        location: string;
    };
    content: string;
    category: 'question' | 'discussion' | 'success-story' | 'tip' | 'announcement';
    tags: string[];
    likes: number;
    replies: number;
    isLiked: boolean;
    createdAt: string;
    lastActivity: string;
    isPinned?: boolean;
    isSolved?: boolean;
};

type CommunityEvent = {
    id: string;
    title: string;
    description: string;
    type: 'webinar' | 'workshop' | 'networking' | 'q-and-a';
    date: string;
    duration: number; // in minutes
    attendees: number;
    maxAttendees?: number;
    isRegistered: boolean;
    host: string;
    tags: string[];
};

const mockPosts: CommunityPost[] = [
    {
        id: 'post-1',
        author: {
            id: 'user-1',
            name: 'Sarah Johnson',
            avatar: '/api/placeholder/40/40',
            title: 'AI Marketing Specialist',
            badges: ['Top Contributor', 'Early Adopter'],
            location: 'Seattle, WA',
        },
        content: 'Just completed my first month using AI content generation and saw a 40% increase in social media engagement! The key was personalizing the AI output with local market insights. What strategies have worked best for you?',
        category: 'success-story',
        tags: ['AI Tools', 'Social Media', 'Content Creation'],
        likes: 24,
        replies: 8,
        isLiked: false,
        createdAt: '2024-01-20T10:30:00Z',
        lastActivity: '2024-01-20T14:15:00Z',
        isPinned: true,
    },
    // Add more mock posts here...
];

const mockEvents: CommunityEvent[] = [
    {
        id: 'event-1',
        title: 'Advanced AI Prompting Workshop',
        description: 'Learn advanced techniques for getting better results from AI content generation tools.',
        type: 'workshop',
        date: '2024-02-15T18:00:00Z',
        duration: 90,
        attendees: 45,
        maxAttendees: 100,
        isRegistered: true,
        host: 'Dr. Emily Rodriguez',
        tags: ['AI Tools', 'Content Creation', 'Advanced'],
    },
    // Add more mock events here...
];

export default function LearningCommunityPage() {
    const { user } = useUser();
    const [posts, setPosts] = useState<CommunityPost[]>(mockPosts);
    const [events] = useState<CommunityEvent[]>(mockEvents);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewPostDialog, setShowNewPostDialog] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostCategory, setNewPostCategory] = useState<CommunityPost['category']>('discussion');

    // Filter posts based on category and search
    const filteredPosts = useMemo(() => {
        let filtered = posts;

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(post => post.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const searchLower = searchQuery.toLowerCase();
            filtered = filtered.filter(post =>
                post.content.toLowerCase().includes(searchLower) ||
                post.author.name.toLowerCase().includes(searchLower) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        return filtered;
    }, [posts, selectedCategory, searchQuery]);

    const handleLikePost = useCallback((postId: string) => {
        setPosts(prev => prev.map(post =>
            post.id === postId
                ? {
                    ...post,
                    isLiked: !post.isLiked,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1
                }
                : post
        ));
    }, []);

    const handleCreatePost = useCallback(() => {
        if (!newPostContent.trim()) return;

        const newPost: CommunityPost = {
            id: `post-${Date.now()}`,
            author: {
                id: user?.id || 'current-user',
                name: user?.attributes?.name || user?.email?.split('@')[0] || 'You',
                title: 'Real Estate Professional',
                badges: [],
                location: 'Your Location',
            },
            content: newPostContent,
            category: newPostCategory,
            tags: [],
            likes: 0,
            replies: 0,
            isLiked: false,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
        };

        setPosts(prev => [newPost, ...prev]);
        setNewPostContent('');
        setShowNewPostDialog(false);

        toast({
            title: 'Post Created',
            description: 'Your post has been shared with the community.',
        });
    }, [newPostContent, newPostCategory, user, toast]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-headline">Community</CardTitle>
                            <CardDescription>
                                Connect with fellow real estate professionals and share knowledge
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowNewPostDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Post
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search discussions..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-[180px]">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            <SelectItem value="question">Questions</SelectItem>
                                            <SelectItem value="discussion">Discussions</SelectItem>
                                            <SelectItem value="success-story">Success Stories</SelectItem>
                                            <SelectItem value="tip">Tips</SelectItem>
                                            <SelectItem value="announcement">Announcements</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Posts */}
                    <div className="space-y-4">
                        {filteredPosts.map((post) => (
                            <Card key={post.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {/* Post Header */}
                                        <div className="flex items-start gap-4">
                                            <Avatar>
                                                <AvatarImage src={post.author.avatar} />
                                                <AvatarFallback>
                                                    {post.author.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold">{post.author.name}</h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        {post.author.title}
                                                    </Badge>
                                                    {post.author.badges.map((badge) => (
                                                        <Badge key={badge} variant="secondary" className="text-xs">
                                                            <Award className="h-3 w-3 mr-1" />
                                                            {badge}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{post.author.location}</span>
                                                    <span>•</span>
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Post Content */}
                                        <div className="pl-14">
                                            <p className="text-sm leading-relaxed mb-3">{post.content}</p>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {post.tags.map((tag) => (
                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleLikePost(post.id)}
                                                    className={cn(
                                                        "gap-2",
                                                        post.isLiked && "text-red-600"
                                                    )}
                                                >
                                                    <ThumbsUp className={cn(
                                                        "h-4 w-4",
                                                        post.isLiked && "fill-current"
                                                    )} />
                                                    {post.likes}
                                                </Button>
                                                <Button variant="ghost" size="sm" className="gap-2">
                                                    <Reply className="h-4 w-4" />
                                                    {post.replies}
                                                </Button>
                                                <Button variant="ghost" size="sm" className="gap-2">
                                                    <Share2 className="h-4 w-4" />
                                                    Share
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Upcoming Events */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Upcoming Events</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {events.map((event) => (
                                <div key={event.id} className="p-3 border rounded-lg">
                                    <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                        {event.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(event.date).toLocaleDateString()}</span>
                                    </div>
                                    <Button size="sm" className="w-full">
                                        {event.isRegistered ? 'Registered' : 'Register'}
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Community Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Community Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Active Members</span>
                                <span className="font-semibold">2,847</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Posts This Week</span>
                                <span className="font-semibold">156</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Questions Answered</span>
                                <span className="font-semibold">89%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* New Post Dialog */}
            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Post</DialogTitle>
                        <DialogDescription>
                            Share your thoughts, ask questions, or start a discussion with the community.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Category</label>
                            <Select value={newPostCategory} onValueChange={(value) => setNewPostCategory(value as CommunityPost['category'])}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="discussion">Discussion</SelectItem>
                                    <SelectItem value="question">Question</SelectItem>
                                    <SelectItem value="success-story">Success Story</SelectItem>
                                    <SelectItem value="tip">Tip</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Content</label>
                            <Textarea
                                placeholder="What's on your mind?"
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                rows={6}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Post
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}