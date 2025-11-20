"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { FileText, Share2, Video } from "lucide-react"

export default function TestDropdownsPage() {
    return (
        <div className="container mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Dropdown Components Test</h1>
                <p className="text-muted-foreground">
                    Testing the improved Select and DropdownMenu components with responsive styling
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Component</CardTitle>
                    <CardDescription>
                        Should have: larger chevron on mobile (20px), rotation animation, rounded-lg corners, hover effect
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Basic Select</label>
                        <Select>
                            <SelectTrigger className="w-full max-w-md">
                                <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Option 1</SelectItem>
                                <SelectItem value="2">Option 2</SelectItem>
                                <SelectItem value="3">Option 3</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Select with Icons (Studio Style)</label>
                        <Select>
                            <SelectTrigger className="w-full max-w-md">
                                <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="blog">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        <span>Blog Post</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="social">
                                    <div className="flex items-center gap-2">
                                        <Share2 className="w-4 h-4" />
                                        <span>Social Media</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="video">
                                    <div className="flex items-center gap-2">
                                        <Video className="w-4 h-4" />
                                        <span>Video Script</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>DropdownMenu Component</CardTitle>
                    <CardDescription>
                        Should have: larger chevron on mobile, smooth transitions, rounded-lg corners, backdrop blur
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">Open Menu</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem>Billing</DropdownMenuItem>
                            <DropdownMenuItem destructive>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>What to Look For</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li>✅ <strong>Chevron Icon:</strong> 20px on mobile (below 768px), 16px on desktop</li>
                        <li>✅ <strong>Chevron Rotation:</strong> Rotates 180° when Select opens</li>
                        <li>✅ <strong>Trigger Height:</strong> 44px on mobile, 40px on desktop</li>
                        <li>✅ <strong>Rounded Corners:</strong> More rounded (8px) instead of 6px</li>
                        <li>✅ <strong>Hover Effect:</strong> Light background on hover</li>
                        <li>✅ <strong>Dropdown Items:</strong> Larger padding on mobile (10px vs 6px)</li>
                        <li>✅ <strong>Backdrop Blur:</strong> Slight blur effect on dropdown background</li>
                        <li>✅ <strong>Smooth Transitions:</strong> 150ms duration on all interactions</li>
                    </ul>
                </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground border-t pt-4">
                <p><strong>To test mobile view:</strong> Open browser DevTools (F12) and toggle device toolbar, or resize browser window below 768px width</p>
            </div>
        </div>
    )
}
