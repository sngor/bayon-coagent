"use client";

/**
 * Mobile Help Documentation Component
 * 
 * Provides comprehensive help documentation for mobile features.
 * Organized by feature with searchable content and quick links.
 */

import * as React from "react";
import {
    Camera,
    Mic,
    Share2,
    Zap,
    MapPin,
    Bell,
    WifiOff,
    Search,
    ChevronRight,
    ExternalLink,
    BookOpen,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/common";

export interface HelpArticle {
    id: string;
    title: string;
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    content: string;
    tags: string[];
    relatedArticles?: string[];
}

const HELP_ARTICLES: HelpArticle[] = [
    {
        id: "quick-capture",
        title: "Quick Capture",
        category: "Content Creation",
        icon: Camera,
        description: "Capture property details using camera and voice",
        tags: ["camera", "voice", "capture", "photos", "ai"],
        content: `
# Quick Capture

Quick Capture lets you instantly capture property details using your phone's camera and voice.

## How to Use

1. Tap the Quick Capture button (camera icon) in the navigation
2. Choose your capture method:
   - **Camera**: Take photos of the property
   - **Voice**: Record voice notes about the property
   - **Text**: Type notes manually

## Camera Capture

When you take a photo:
- AI automatically analyzes the image
- Extracts property details (type, features, condition)
- Generates marketing highlights
- Attaches location if available

## Voice Capture

When you record voice:
- Real estate terminology is recognized
- Automatic transcription to text
- Can be attached to property records
- Works offline and syncs later

## Tips

- Take multiple photos from different angles
- Speak clearly when recording voice notes
- Enable location services for automatic context
- Captures work offline and sync when connected
        `,
    },
    {
        id: "quick-actions",
        title: "Quick Actions",
        category: "Productivity",
        icon: Zap,
        description: "One-tap shortcuts to your most-used features",
        tags: ["shortcuts", "productivity", "quick", "actions"],
        content: `
# Quick Actions

Quick Actions provide one-tap access to your most frequently used features.

## How to Use

1. Tap the Quick Actions button (lightning icon)
2. Select from your personalized shortcuts
3. The menu learns from your usage patterns

## Default Actions

- Create Content
- Capture Property
- Check Market Data
- View Calendar
- Quick Share
- Voice Note

## Customization

The menu automatically prioritizes:
- Recently used actions
- Frequently accessed features
- Context-aware suggestions

## Offline Support

Actions work offline and queue for sync when you're back online.
        `,
    },
    {
        id: "voice-notes",
        title: "Voice Notes",
        category: "Content Creation",
        icon: Mic,
        description: "Record and transcribe voice notes at properties",
        tags: ["voice", "recording", "transcription", "notes"],
        content: `
# Voice Notes

Record voice notes at properties and have them automatically transcribed.

## Recording Notes

1. Tap the Voice Note button
2. Grant microphone permission if prompted
3. Tap record and speak clearly
4. Tap stop when finished

## Features

- Automatic transcription
- Attach to property records
- Add photos to notes
- Cloud sync across devices
- Works offline

## Best Practices

- Record in quiet environments
- Speak clearly and at normal pace
- Use real estate terminology
- Review transcriptions for accuracy
- Attach relevant photos

## Privacy

- Recordings are encrypted
- Can be deleted after transcription
- 30-day retention by default
        `,
    },
    {
        id: "quick-share",
        title: "Quick Share",
        category: "Client Communication",
        icon: Share2,
        description: "Share properties via QR code, SMS, or social media",
        tags: ["share", "qr", "sms", "social", "engagement"],
        content: `
# Quick Share

Instantly share property information with clients and prospects.

## Sharing Methods

### QR Code
- Generate scannable QR codes
- Display at open houses
- Include in printed materials
- Track scans and views

### SMS
- Pre-formatted messages
- Property highlights included
- Tracking links
- Engagement metrics

### Social Media
- One-tap posting
- Platform-specific formatting
- Multiple platforms at once

## Engagement Tracking

Monitor how prospects interact:
- View counts
- Click tracking
- Time spent viewing
- Follow-up reminders

## Tips

- Use QR codes at open houses
- Send SMS for quick follow-ups
- Track engagement for lead scoring
        `,
    },
    {
        id: "location-services",
        title: "Location Services",
        category: "Navigation",
        icon: MapPin,
        description: "Location-aware reminders and navigation",
        tags: ["location", "navigation", "reminders", "check-in"],
        content: `
# Location Services

Get location-aware features for appointments and property visits.

## Features

### Arrival Reminders
- Notifications when near appointments
- Property information displayed
- Client notes accessible

### One-Tap Navigation
- Opens device navigation app
- Optimized routes
- Real-time traffic

### Check-In Logging
- Automatic visit logging
- Timestamp and location
- Attach to property records

## Privacy

- Location data is encrypted
- Can be disabled anytime
- Only used for features you enable
- Not shared with third parties

## Setup

1. Enable location services in settings
2. Grant permission when prompted
3. Set proximity radius for reminders
        `,
    },
    {
        id: "offline-mode",
        title: "Offline Mode",
        category: "Connectivity",
        icon: WifiOff,
        description: "Work without internet and sync later",
        tags: ["offline", "sync", "queue", "connectivity"],
        content: `
# Offline Mode

All features work without internet connection.

## How It Works

When offline:
- Actions are queued locally
- Recently viewed content is cached
- Captures are stored on device
- Automatic sync when online

## Offline Queue

View queued actions:
- Pending operations count
- Action details
- Sync status
- Manual retry option

## Sync Behavior

When connection returns:
- Automatic sync starts
- Progress notifications
- Conflict resolution
- Success confirmation

## Best Practices

- Review queue before syncing
- Ensure good connection for large uploads
- Check sync status regularly
- Keep app updated for best performance

## Troubleshooting

If sync fails:
- Check internet connection
- Retry manually
- Contact support if issues persist
        `,
    },
    {
        id: "lead-notifications",
        title: "Lead Notifications",
        category: "Lead Management",
        icon: Bell,
        description: "Instant alerts for new leads with quick response",
        tags: ["leads", "notifications", "alerts", "response"],
        content: `
# Lead Notifications

Get instant alerts for new leads with quick response options.

## Notification Types

- New lead alerts
- Lead quality score
- Urgency indicators
- Preview information

## Quick Response

From notification:
1. Tap to open lead details
2. View contact information
3. Use quick response templates
4. Send SMS or email
5. Set follow-up reminders

## Response Templates

Pre-written templates for:
- Initial contact
- Property inquiries
- Showing requests
- Follow-up messages

## Lead Prioritization

Notifications prioritized by:
- Lead quality score
- Urgency level
- Response time
- Source

## Settings

Customize:
- Notification frequency
- Quiet hours
- Priority thresholds
- Sound and vibration
        `,
    },
];

export interface MobileHelpDocumentationProps {
    /** Initial article to display */
    initialArticleId?: string;
    /** Callback when article is selected */
    onArticleSelect?: (articleId: string) => void;
}

export function MobileHelpDocumentation({
    initialArticleId,
    onArticleSelect,
}: MobileHelpDocumentationProps) {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedArticle, setSelectedArticle] = React.useState<string | null>(
        initialArticleId || null
    );

    const filteredArticles = React.useMemo(() => {
        if (!searchQuery) return HELP_ARTICLES;

        const query = searchQuery.toLowerCase();
        return HELP_ARTICLES.filter(
            (article) =>
                article.title.toLowerCase().includes(query) ||
                article.description.toLowerCase().includes(query) ||
                article.tags.some((tag) => tag.toLowerCase().includes(query)) ||
                article.content.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleArticleSelect = (articleId: string) => {
        setSelectedArticle(articleId);
        onArticleSelect?.(articleId);
    };

    const selectedArticleData = HELP_ARTICLES.find((a) => a.id === selectedArticle);

    if (selectedArticleData) {
        return (
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedArticle(null)}
                    className="mb-4"
                >
                    <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                    Back to all articles
                </Button>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-full bg-primary/10">
                                <selectedArticleData.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>{selectedArticleData.title}</CardTitle>
                                <CardDescription>{selectedArticleData.category}</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {selectedArticleData.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: selectedArticleData.content
                                        .split("\n")
                                        .map((line) => {
                                            if (line.startsWith("# ")) {
                                                return `<h1 class="text-2xl font-bold mb-4">${line.slice(2)}</h1>`;
                                            }
                                            if (line.startsWith("## ")) {
                                                return `<h2 class="text-xl font-semibold mt-6 mb-3">${line.slice(3)}</h2>`;
                                            }
                                            if (line.startsWith("### ")) {
                                                return `<h3 class="text-lg font-medium mt-4 mb-2">${line.slice(4)}</h3>`;
                                            }
                                            if (line.startsWith("- ")) {
                                                return `<li class="ml-4">${line.slice(2)}</li>`;
                                            }
                                            if (line.trim() === "") {
                                                return "<br />";
                                            }
                                            return `<p class="mb-2">${line}</p>`;
                                        })
                                        .join(""),
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Mobile Features Help</h2>
                </div>
                <p className="text-muted-foreground">
                    Learn how to use mobile features to work more efficiently on the go
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Articles Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                {filteredArticles.map((article) => {
                    const Icon = article.icon;
                    return (
                        <Card
                            key={article.id}
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => handleArticleSelect(article.id)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">
                                                {article.title}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                {article.category}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {article.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredArticles.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            No articles found matching "{searchQuery}"
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
