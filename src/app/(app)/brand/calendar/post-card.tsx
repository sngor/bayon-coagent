import { ScheduledContent, ScheduledContentStatus, PublishChannelType } from '@/lib/types/content-workflow-types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Calendar as CalendarIcon,
    Clock,
    MoreHorizontal,
    Eye,
    Copy,
    Edit,
    Trash,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    FileText,
    Mail,
    Globe,
    ExternalLink,
    BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface PostCardProps {
    item: ScheduledContent;
    isMultiSelectMode: boolean;
    isSelected: boolean;
    onSelect: (id: string, selected: boolean) => void;
    onClick: (id: string) => void;
    onEdit: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
}

const ChannelIcon = ({ type }: { type: PublishChannelType }) => {
    switch (type) {
        case PublishChannelType.FACEBOOK:
            return <Facebook className="h-4 w-4 text-blue-600" />;
        case PublishChannelType.INSTAGRAM:
            return <Instagram className="h-4 w-4 text-pink-600" />;
        case PublishChannelType.LINKEDIN:
            return <Linkedin className="h-4 w-4 text-blue-700" />;
        case PublishChannelType.TWITTER:
            return <Twitter className="h-4 w-4 text-sky-500" />;
        case PublishChannelType.BLOG:
            return <Globe className="h-4 w-4 text-orange-500" />;
        case PublishChannelType.NEWSLETTER:
            return <Mail className="h-4 w-4 text-purple-500" />;
        default:
            return <Globe className="h-4 w-4 text-gray-500" />;
    }
};

const StatusBadge = ({ status }: { status: ScheduledContentStatus }) => {
    const variants: Record<ScheduledContentStatus, string> = {
        [ScheduledContentStatus.SCHEDULED]: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
        [ScheduledContentStatus.PUBLISHING]: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200',
        [ScheduledContentStatus.PUBLISHED]: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
        [ScheduledContentStatus.FAILED]: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
        [ScheduledContentStatus.CANCELLED]: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200',
    };

    return (
        <Badge variant="outline" className={cn("capitalize font-medium border", variants[status])}>
            {status}
        </Badge>
    );
};

export function PostCard({
    item,
    isMultiSelectMode,
    isSelected,
    onSelect,
    onClick,
    onEdit,
    onDuplicate,
    onDelete
}: PostCardProps) {
    const handleCopyContent = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.content);
        toast({
            title: "Copied to clipboard",
            description: "Post content copied to clipboard",
        });
    };

    // Calculate total engagement if available
    const totalEngagement = item.publishResults?.reduce((acc, result) => {
        if (result.metrics) {
            return acc + (result.metrics.initialLikes || 0) + (result.metrics.initialShares || 0) + (result.metrics.initialViews || 0);
        }
        return acc;
    }, 0) || 0;

    return (
        <Card
            className={cn(
                "group relative transition-all duration-200 hover:shadow-lg border-l-4",
                isSelected ? "border-l-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30" : "border-l-transparent hover:border-l-primary",
                "overflow-hidden"
            )}
            onClick={() => !isMultiSelectMode && onClick(item.contentId)}
        >
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    {/* Selection Checkbox */}
                    {isMultiSelectMode && (
                        <div className="flex items-center pt-1" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
                                className="h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Header: Title, Type, Status */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0">
                                <h3 className="font-semibold text-lg truncate text-foreground group-hover:text-primary transition-colors">
                                    {item.title}
                                </h3>
                                <Badge variant="secondary" className="text-xs font-normal shrink-0">
                                    {item.contentType.replace(/_/g, ' ')}
                                </Badge>
                            </div>
                            <StatusBadge status={item.status} />
                        </div>

                        {/* Content Preview */}
                        <div className="relative">
                            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                                {item.content}
                            </p>
                            {/* Quick Copy Button on Hover */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-background/80 backdrop-blur-sm shadow-sm"
                                onClick={handleCopyContent}
                                title="Copy content"
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Metadata Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    <span>{format(new Date(item.publishTime), 'MMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{format(new Date(item.publishTime), 'h:mm a')}</span>
                                </div>
                                {totalEngagement > 0 && (
                                    <div className="flex items-center gap-1.5 text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                                        <BarChart2 className="h-3.5 w-3.5" />
                                        <span>{totalEngagement} Engagements</span>
                                    </div>
                                )}
                            </div>

                            {/* Channels */}
                            <div className="flex -space-x-2 hover:space-x-1 transition-all">
                                {item.channels.map((channel, idx) => (
                                    <div
                                        key={`${channel.type}-${idx}`}
                                        className="h-7 w-7 rounded-full bg-background border shadow-sm flex items-center justify-center z-10 hover:z-20 hover:scale-110 transition-transform"
                                        title={channel.type}
                                    >
                                        <ChannelIcon type={channel.type} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {!isMultiSelectMode && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => onClick(item.contentId)}
                                title="View Details"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => onEdit(item.contentId)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Content
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(item.contentId)}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                    </DropdownMenuItem>
                                    {item.status === ScheduledContentStatus.PUBLISHED && item.publishResults?.[0]?.publishedUrl && (
                                        <DropdownMenuItem onClick={() => window.open(item.publishResults![0].publishedUrl, '_blank')}>
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Live Post
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(item.id)}
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    >
                                        <Trash className="h-4 w-4 mr-2" />
                                        {item.status === ScheduledContentStatus.SCHEDULED ? 'Cancel Schedule' : 'Delete'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
