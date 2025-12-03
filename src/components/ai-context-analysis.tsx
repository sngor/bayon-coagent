'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Lightbulb,
    MessageSquare,
    Quote,
    Tag,
    TrendingUp,
} from 'lucide-react';
import type { AIMention } from '@/lib/types/common/common';

interface AIContextAnalysisProps {
    userId: string;
    mentions: AIMention[];
}

interface TopicData {
    topic: string;
    count: number;
    examples: string[];
    serviceTypes: string[];
}

interface ServiceTypeData {
    type: string;
    count: number;
    topics: string[];
}

// Service type keywords for categorization
const SERVICE_TYPE_KEYWORDS = {
    'Buyer Agent': ['buyer', 'buying', 'purchase', 'first-time buyer', 'home buyer'],
    'Seller Agent': ['seller', 'selling', 'listing', 'home seller', 'list your home'],
    'Luxury': ['luxury', 'high-end', 'premium', 'estate', 'upscale', 'exclusive'],
    'Investment': ['investment', 'investor', 'rental', 'portfolio', 'ROI', 'cash flow'],
    'Commercial': ['commercial', 'business', 'office', 'retail', 'industrial'],
    'Relocation': ['relocation', 'relocating', 'moving', 'transfer', 'new city'],
    'First-Time Buyer': ['first-time', 'first time', 'new buyer', 'beginner'],
    'Downsizing': ['downsize', 'downsizing', 'smaller home', 'retirement'],
};

export function AIContextAnalysis({ userId, mentions }: AIContextAnalysisProps) {
    // Aggregate topics across all mentions
    const topicData = useMemo<TopicData[]>(() => {
        const topicMap = new Map<string, {
            count: number;
            examples: Set<string>;
            serviceTypes: Set<string>;
        }>();

        mentions.forEach((mention) => {
            mention.topics.forEach((topic) => {
                const existing = topicMap.get(topic) || {
                    count: 0,
                    examples: new Set<string>(),
                    serviceTypes: new Set<string>(),
                };

                existing.count += 1;

                // Add snippet as example (limit to 150 chars)
                const snippet = mention.snippet.length > 150
                    ? mention.snippet.substring(0, 150) + '...'
                    : mention.snippet;
                existing.examples.add(snippet);

                // Categorize by service type based on keywords
                const responseText = `${mention.query} ${mention.response}`.toLowerCase();
                Object.entries(SERVICE_TYPE_KEYWORDS).forEach(([serviceType, keywords]) => {
                    if (keywords.some(keyword => responseText.includes(keyword.toLowerCase()))) {
                        existing.serviceTypes.add(serviceType);
                    }
                });

                topicMap.set(topic, existing);
            });
        });

        // Convert to array and sort by count
        return Array.from(topicMap.entries())
            .map(([topic, data]) => ({
                topic,
                count: data.count,
                examples: Array.from(data.examples).slice(0, 3), // Keep top 3 examples
                serviceTypes: Array.from(data.serviceTypes),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 topics
    }, [mentions]);

    // Aggregate service types
    const serviceTypeData = useMemo<ServiceTypeData[]>(() => {
        const serviceTypeMap = new Map<string, {
            count: number;
            topics: Set<string>;
        }>();

        mentions.forEach((mention) => {
            const responseText = `${mention.query} ${mention.response}`.toLowerCase();

            Object.entries(SERVICE_TYPE_KEYWORDS).forEach(([serviceType, keywords]) => {
                if (keywords.some(keyword => responseText.includes(keyword.toLowerCase()))) {
                    const existing = serviceTypeMap.get(serviceType) || {
                        count: 0,
                        topics: new Set<string>(),
                    };

                    existing.count += 1;
                    mention.topics.forEach(topic => existing.topics.add(topic));

                    serviceTypeMap.set(serviceType, existing);
                }
            });
        });

        return Array.from(serviceTypeMap.entries())
            .map(([type, data]) => ({
                type,
                count: data.count,
                topics: Array.from(data.topics).slice(0, 5), // Top 5 topics per service type
            }))
            .sort((a, b) => b.count - a.count);
    }, [mentions]);

    const totalMentions = mentions.length;

    if (mentions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Context & Topic Analysis
                    </CardTitle>
                    <CardDescription>
                        Understand what topics AI platforms associate with you
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-2">
                            No topic data available yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Start monitoring to see what topics AI platforms associate with you
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Lightbulb className="h-6 w-6" />
                    Context & Topic Analysis
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Understand what topics and expertise areas AI platforms associate with you
                </p>
            </div>

            {/* Top Topics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Top Topics
                    </CardTitle>
                    <CardDescription>
                        The 5 most frequently mentioned topics across {totalMentions} mention{totalMentions !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {topicData.length > 0 ? (
                        <div className="space-y-6">
                            {topicData.map((topic, index) => {
                                const percentage = totalMentions > 0
                                    ? (topic.count / totalMentions) * 100
                                    : 0;

                                return (
                                    <div
                                        key={topic.topic}
                                        className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Topic Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg">
                                                        {topic.topic}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {topic.count} mention{topic.count !== 1 ? 's' : ''}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({percentage.toFixed(1)}% of all mentions)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                        </div>

                                        {/* Service Types */}
                                        {topic.serviceTypes.length > 0 && (
                                            <div className="mb-3">
                                                <div className="text-xs font-medium text-muted-foreground mb-2">
                                                    Associated Service Types:
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {topic.serviceTypes.map((serviceType) => (
                                                        <Badge
                                                            key={serviceType}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {serviceType}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Example Quotes */}
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                                                <Quote className="h-3 w-3" />
                                                Example Mentions:
                                            </div>
                                            <div className="space-y-2">
                                                {topic.examples.map((example, exampleIndex) => (
                                                    <div
                                                        key={exampleIndex}
                                                        className="pl-4 border-l-2 border-muted-foreground/20"
                                                    >
                                                        <p className="text-sm text-muted-foreground italic">
                                                            "{example}"
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No topics found in mentions
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Service Type Categorization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Service Type Categorization
                    </CardTitle>
                    <CardDescription>
                        How mentions are categorized by service type
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {serviceTypeData.length > 0 ? (
                        <div className="space-y-4">
                            {serviceTypeData.map((serviceType) => {
                                const percentage = totalMentions > 0
                                    ? (serviceType.count / totalMentions) * 100
                                    : 0;

                                return (
                                    <div
                                        key={serviceType.type}
                                        className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        {/* Service Type Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-base">
                                                    {serviceType.type}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {serviceType.count} mention{serviceType.count !== 1 ? 's' : ''}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {percentage.toFixed(1)}% of mentions
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold">
                                                    {serviceType.count}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <Progress value={percentage} className="h-2" />
                                        </div>

                                        {/* Associated Topics */}
                                        {serviceType.topics.length > 0 && (
                                            <div>
                                                <div className="text-xs font-medium text-muted-foreground mb-2">
                                                    Related Topics:
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {serviceType.topics.map((topic) => (
                                                        <Badge
                                                            key={topic}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {topic}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No service type categorization available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Analysis Summary</CardTitle>
                    <CardDescription>
                        Key insights from your AI visibility context
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <div className="text-3xl font-bold text-primary">
                                {topicData.length}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                Unique Topics
                            </div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <div className="text-3xl font-bold text-primary">
                                {serviceTypeData.length}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                Service Categories
                            </div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <div className="text-3xl font-bold text-primary">
                                {topicData[0]?.topic || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                Top Topic
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
