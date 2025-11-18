"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export default function ModalDialogDemo() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Modal & Dialog Animations Demo</h1>
                <p className="text-muted-foreground">
                    Showcasing enhanced modal and dialog animations with backdrop blur and smooth transitions
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Standard Dialog */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Standard Dialog
                        </CardTitle>
                        <CardDescription>
                            Dialog with smooth scale and fade animations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    Open Dialog
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Profile</DialogTitle>
                                    <DialogDescription>
                                        Make changes to your profile here. Click save when you&apos;re done.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            defaultValue="John Doe"
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="email" className="text-right">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            defaultValue="john@example.com"
                                            className="col-span-3"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Save changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Alert Dialog */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-warning" />
                            Alert Dialog
                        </CardTitle>
                        <CardDescription>
                            Alert dialog with backdrop blur and focus management
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>

                {/* Success Dialog */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                            Success Dialog
                        </CardTitle>
                        <CardDescription>
                            Dialog with success state and smooth animations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="default" className="w-full">
                                    Show Success
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                        Success!
                                    </DialogTitle>
                                    <DialogDescription>
                                        Your changes have been saved successfully.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <div className="rounded-lg bg-success-light p-4 text-sm">
                                        <p className="font-medium text-success-foreground">
                                            All changes have been applied
                                        </p>
                                        <p className="text-success-foreground/80 mt-1">
                                            Your profile has been updated and is now live.
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button>Close</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* AI Processing Dialog */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Processing Dialog
                        </CardTitle>
                        <CardDescription>
                            Dialog with AI-themed styling and animations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-gradient-to-r from-primary to-purple-600">
                                    Generate Content
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                        AI Content Generator
                                    </DialogTitle>
                                    <DialogDescription>
                                        Let AI create amazing content for you
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="topic">Topic</Label>
                                        <Input
                                            id="topic"
                                            placeholder="Enter your topic..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="style">Writing Style</Label>
                                        <Input
                                            id="style"
                                            placeholder="Professional, casual, creative..."
                                        />
                                    </div>
                                    <div className="rounded-lg bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 border border-primary/20">
                                        <p className="text-sm text-muted-foreground">
                                            <Sparkles className="h-4 w-4 inline mr-1" />
                                            AI will generate unique, high-quality content based on your inputs
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button className="bg-gradient-to-r from-primary to-purple-600">
                                        Generate
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>

            {/* Features List */}
            <Card>
                <CardHeader>
                    <CardTitle>Enhanced Features</CardTitle>
                    <CardDescription>
                        All modals and dialogs now include these improvements
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                            <span>
                                <strong>Smooth Scale & Fade Animations:</strong> Dialogs scale in from 95% to 100% with fade effect
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                            <span>
                                <strong>Backdrop Blur Effect:</strong> Background is blurred when dialog is open for better focus
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                            <span>
                                <strong>Enhanced Focus Management:</strong> Proper focus indicators on all interactive elements
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                            <span>
                                <strong>Improved Close Button:</strong> Close button has hover scale effect and better focus states
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                            <span>
                                <strong>Longer Animation Duration:</strong> Increased from 200ms to 300ms for smoother feel
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                            <span>
                                <strong>Enhanced Shadow:</strong> Upgraded from shadow-lg to shadow-xl for better depth
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                            <span>
                                <strong>Keyboard Accessible:</strong> All elements properly support keyboard navigation
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                            <span>
                                <strong>Reduced Motion Support:</strong> Respects user&apos;s motion preferences
                            </span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Keyboard Navigation Guide */}
            <Card>
                <CardHeader>
                    <CardTitle>Keyboard Navigation</CardTitle>
                    <CardDescription>
                        Test focus management with keyboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <p><kbd className="px-2 py-1 bg-muted rounded">Tab</kbd> - Move focus forward</p>
                        <p><kbd className="px-2 py-1 bg-muted rounded">Shift + Tab</kbd> - Move focus backward</p>
                        <p><kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> or <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> - Activate button</p>
                        <p><kbd className="px-2 py-1 bg-muted rounded">Escape</kbd> - Close dialog</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
