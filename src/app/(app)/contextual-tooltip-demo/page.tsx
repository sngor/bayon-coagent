'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Info, AlertCircle, Lightbulb } from 'lucide-react';

export default function ContextualTooltipDemoPage() {
    return (
        <StandardPageLayout
            title="Contextual Tooltips Demo"
            description="Smart tooltip system with rich content"
            spacing="default"
        >
            <TooltipProvider>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Tooltips</CardTitle>
                            <CardDescription>Simple hover tooltips with helpful information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-4">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline">
                                            <HelpCircle className="mr-2 h-4 w-4" />
                                            Hover Me
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>This is a helpful tooltip</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button>Generate Plan</Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Click to generate your marketing plan using AI</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="secondary" disabled>
                                            Locked Feature
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>This feature requires a complete profile</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rich Content Tooltips</CardTitle>
                            <CardDescription>Tooltips with formatted content and icons</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-4">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline">
                                            <Info className="mr-2 h-4 w-4" />
                                            Info Tooltip
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Info className="h-4 w-4" />
                                                <span className="font-semibold">Pro Tip</span>
                                            </div>
                                            <p className="text-sm">Complete your profile to unlock AI-powered features</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="destructive">Delete</Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                                <span className="font-semibold">Warning</span>
                                            </div>
                                            <p className="text-sm">This action cannot be undone</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline">
                                            <Lightbulb className="mr-2 h-4 w-4" />
                                            Get Suggestion
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                                <span className="font-semibold">Suggestion</span>
                                            </div>
                                            <p className="text-sm">Try using keywords related to your market</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Positioning</CardTitle>
                            <CardDescription>Tooltips automatically position to stay in viewport</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" className="w-full">Top</Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p>Tooltip on top</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" className="w-full">Right</Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>Tooltip on right</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" className="w-full">Bottom</Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Tooltip on bottom</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" className="w-full">Left</Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        <p>Tooltip on left</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Usage Example</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{`import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>Hover Me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Helpful information</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}</code>
                            </pre>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Features</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                <li>✓ Auto-positioning to stay in viewport</li>
                                <li>✓ Rich content support (JSX, formatted text)</li>
                                <li>✓ Keyboard accessible</li>
                                <li>✓ Customizable delay and duration</li>
                                <li>✓ Multiple positioning options</li>
                                <li>✓ Mobile-friendly</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </TooltipProvider>
        </StandardPageLayout>
    );
}
