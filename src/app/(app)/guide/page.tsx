import { GuideLayout } from "@/components/guide/guide-layout"
import { GuideSection } from "@/components/guide/guide-section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, LayoutDashboard, Settings, Sparkles } from "lucide-react"

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function GuidePage() {
    return (
        <GuideLayout
            title="User Guide"
            description="Learn how to get the most out of Bayon CoAgent."
        >
            <GuideSection title="Getting Started" description="Essential steps to set up your account and workspace.">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card variant="elevated" interactive hoverEffect="lift">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <LayoutDashboard className="h-5 w-5 text-primary" />
                                Dashboard Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Understand your daily metrics, tasks, and recent activities at a glance.
                            </p>
                            <Button variant="outline" size="sm" className="w-full">Read More</Button>
                        </CardContent>
                    </Card>

                    <Card variant="elevated" interactive hoverEffect="lift">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Settings className="h-5 w-5 text-primary" />
                                Account Setup
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Configure your profile, notifications, and integration settings.
                            </p>
                            <Button variant="outline" size="sm" className="w-full">Read More</Button>
                        </CardContent>
                    </Card>

                    <Card variant="elevated" interactive hoverEffect="lift">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Sparkles className="h-5 w-5 text-primary" />
                                AI Features
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Discover how AI can help you write content, analyze data, and more.
                            </p>
                            <Button variant="outline" size="sm" className="w-full">Read More</Button>
                        </CardContent>
                    </Card>
                </div>
            </GuideSection>

            <GuideSection title="Advanced Features" description="Deep dive into powerful tools and workflows.">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card variant="bordered" className="flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>Content Generation</CardTitle>
                            <CardDescription>
                                Create high-quality social media posts, emails, and listings in seconds.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" className="w-full">Explore Content Tools</Button>
                        </CardContent>
                    </Card>
                    <Card variant="bordered" className="flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>Market Analysis</CardTitle>
                            <CardDescription>
                                Get real-time insights into market trends and property values.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" className="w-full">Explore Market Tools</Button>
                        </CardContent>
                    </Card>
                </div>
            </GuideSection>
        </GuideLayout>
    )
}
