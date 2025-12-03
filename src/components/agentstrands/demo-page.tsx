"use client";

import { useState } from "react";
import {
    FeedbackCollection,
    QuickFeedback,
    OpportunityDashboard,
    AnalyticsVisualizations,
    EditingInterface,
} from "./index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, BarChart3, MessageSquare, Edit3 } from "lucide-react";

/**
 * Demo page showcasing all AgentStrands UI components
 * 
 * This page demonstrates how to integrate and use the AgentStrands enhancement
 * components in a real application. It includes:
 * - Feedback collection (full and quick versions)
 * - Opportunity dashboard
 * - Analytics visualizations
 * - Collaborative editing interface
 * 
 * Usage:
 * Import this component into your app router page:
 * 
 * ```tsx
 * import { AgentStrandsDemoPage } from "@/components/agentstrands/demo-page";
 * 
 * export default function Page() {
 *   return <AgentStrandsDemoPage />;
 * }
 * ```
 */
export function AgentStrandsDemoPage() {
    const [showEditingInterface, setShowEditingInterface] = useState(false);
    const [selectedContent, setSelectedContent] = useState({
        id: "demo-content-1",
        text: "This is a sample piece of AI-generated content that you can edit using the collaborative editing interface. Try requesting changes like 'make it more professional' or 'add more details'.",
    });

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl font-bold tracking-tight">AgentStrands Dashboard</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                    Intelligent AI collaboration, learning, and analytics for your content generation
                </p>
            </div>

            {/* Feature Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-3">
                        <MessageSquare className="h-8 w-8 text-blue-500 mb-2" />
                        <CardTitle className="text-base">Feedback Collection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Collect user ratings and comments to improve AI quality
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                        <CardTitle className="text-base">Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            AI-detected opportunities to grow your business
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <BarChart3 className="h-8 w-8 text-purple-500 mb-2" />
                        <CardTitle className="text-base">Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Performance metrics and cost analysis
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <Edit3 className="h-8 w-8 text-orange-500 mb-2" />
                        <CardTitle className="text-base">Collaborative Editing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Refine content through conversational AI
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="opportunities" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="opportunities">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Opportunities
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="feedback">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Feedback
                    </TabsTrigger>
                    <TabsTrigger value="editing">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editing
                    </TabsTrigger>
                </TabsList>

                {/* Opportunities Tab */}
                <TabsContent value="opportunities" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Proactive Intelligence</CardTitle>
                            <CardDescription>
                                AI-detected opportunities based on market trends, content gaps, timing, and competitive analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OpportunityDashboard />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance & Cost Analytics</CardTitle>
                            <CardDescription>
                                Track strand performance, monitor costs, and analyze quality metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AnalyticsVisualizations />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="space-y-4">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Full Feedback Component */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Full Feedback Collection</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Comprehensive feedback form with ratings and comments
                                </p>
                            </div>
                            <FeedbackCollection
                                taskId="demo-task-1"
                                strandId="demo-strand-1"
                                contentId="demo-content-1"
                                onFeedbackSubmitted={() => console.log("Feedback submitted")}
                            />
                        </div>

                        {/* Quick Feedback Examples */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Quick Feedback</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Lightweight inline feedback for quick responses
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Sample Content 1</CardTitle>
                                    <CardDescription>
                                        AI-generated blog post about market trends
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm">
                                        The real estate market is showing strong signs of recovery with
                                        increased buyer activity and rising property values...
                                    </p>
                                    <QuickFeedback
                                        taskId="demo-task-2"
                                        strandId="demo-strand-1"
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Sample Content 2</CardTitle>
                                    <CardDescription>
                                        AI-generated social media post
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm">
                                        🏡 Just listed! Beautiful 3BR/2BA home in prime location.
                                        Schedule your showing today!
                                    </p>
                                    <QuickFeedback
                                        taskId="demo-task-3"
                                        strandId="demo-strand-2"
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Sample Content 3</CardTitle>
                                    <CardDescription>
                                        AI-generated property description
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm">
                                        Stunning modern home featuring open-concept living, gourmet
                                        kitchen, and luxurious master suite...
                                    </p>
                                    <QuickFeedback
                                        taskId="demo-task-4"
                                        strandId="demo-strand-3"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Editing Tab */}
                <TabsContent value="editing" className="space-y-4">
                    {!showEditingInterface ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Collaborative Editing</CardTitle>
                                <CardDescription>
                                    Refine your content through conversational AI editing
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <Card className="border-2">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-base">Sample Content</CardTitle>
                                                    <CardDescription>
                                                        Click "Edit with AI" to start collaborative editing
                                                    </CardDescription>
                                                </div>
                                                <Badge>Ready to Edit</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-sm">{selectedContent.text}</p>
                                            <Button onClick={() => setShowEditingInterface(true)}>
                                                <Edit3 className="h-4 w-4 mr-2" />
                                                Edit with AI
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <div className="rounded-lg border p-6 space-y-4">
                                        <h4 className="font-semibold">How it works:</h4>
                                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                            <li>Click "Edit with AI" to start an editing session</li>
                                            <li>Describe the changes you want in natural language</li>
                                            <li>AI processes your request and updates the content</li>
                                            <li>Review changes and request further refinements</li>
                                            <li>Use version history to rollback if needed</li>
                                            <li>Save when you're satisfied with the result</li>
                                        </ol>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <EditingInterface
                            contentId={selectedContent.id}
                            initialContent={selectedContent.text}
                            onSave={(content) => {
                                setSelectedContent({ ...selectedContent, text: content });
                                setShowEditingInterface(false);
                            }}
                            onClose={() => setShowEditingInterface(false)}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Footer Info */}
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base">About AgentStrands Enhancements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        These components are part of the AgentStrands enhancement system, which provides:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Cross-strand collaboration with automatic handoffs</li>
                        <li>User feedback loops for continuous learning</li>
                        <li>Strand specialization for market-specific expertise</li>
                        <li>Proactive intelligence with opportunity detection</li>
                        <li>Multi-modal content processing (text, images, video, audio)</li>
                        <li>Competitive intelligence monitoring</li>
                        <li>Enhanced memory with semantic search</li>
                        <li>Quality assurance with compliance checking</li>
                        <li>Performance analytics and cost monitoring</li>
                        <li>Adaptive routing based on confidence and load</li>
                        <li>Collaborative editing with version control</li>
                        <li>Integration with CRM and social media platforms</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
