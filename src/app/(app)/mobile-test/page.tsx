'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Smartphone,
    Check,
    X,
    Info,
    Mail,
    Phone,
    Globe,
    Calendar,
    Hash
} from 'lucide-react';
import { auditMobileResponsiveness, MIN_TOUCH_TARGET_SIZE } from '@/lib/mobile-optimization';

/**
 * Mobile Optimization Test Page
 * 
 * This page demonstrates and tests mobile responsiveness optimizations
 * Requirements: 4.1, 4.5, 16.1, 16.3
 */
export default function MobileTestPage() {
    const [auditResults, setAuditResults] = useState<{
        issues: string[];
        warnings: string[];
        passed: boolean;
    } | null>(null);

    const runAudit = () => {
        const results = auditMobileResponsiveness();
        setAuditResults(results);
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <PageHeader
                title="Mobile Optimization Test"
                description="Testing mobile responsiveness, touch targets, and keyboard types"
            />

            {/* Audit Results */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Mobile Responsiveness Audit
                    </CardTitle>
                    <CardDescription>
                        Run an automated audit to check for mobile optimization issues
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {auditResults && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                {auditResults.passed ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                        <Check className="h-4 w-4 mr-1" />
                                        Passed
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        <X className="h-4 w-4 mr-1" />
                                        Issues Found
                                    </Badge>
                                )}
                            </div>

                            {auditResults.issues.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-destructive">Issues:</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {auditResults.issues.map((issue, i) => (
                                            <li key={i} className="text-sm text-destructive">{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {auditResults.warnings.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-yellow-600">Warnings:</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {auditResults.warnings.map((warning, i) => (
                                            <li key={i} className="text-sm text-yellow-600">{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {auditResults.passed && auditResults.warnings.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    ✅ All mobile optimization checks passed!
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={runAudit}>Run Audit</Button>
                </CardFooter>
            </Card>

            {/* Touch Target Test */}
            <Card>
                <CardHeader>
                    <CardTitle>Touch Target Size Test</CardTitle>
                    <CardDescription>
                        All interactive elements should be at least {MIN_TOUCH_TARGET_SIZE}x{MIN_TOUCH_TARGET_SIZE}px
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        <Button size="default">Default</Button>
                        <Button size="sm">Small</Button>
                        <Button size="lg">Large</Button>
                        <Button size="xl">Extra Large</Button>
                        <Button size="icon">
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Link</Button>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            <Info className="inline h-4 w-4 mr-1" />
                            All buttons above meet the minimum 44x44px touch target requirement
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Keyboard Type Test */}
            <Card>
                <CardHeader>
                    <CardTitle>Mobile Keyboard Types</CardTitle>
                    <CardDescription>
                        Form inputs automatically use appropriate keyboard types on mobile devices
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email (type="email")
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                placeholder="your@email.com"
                                helperText="Shows email keyboard on mobile"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Phone (type="tel")
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="(555) 123-4567"
                                helperText="Shows numeric keyboard on mobile"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Website (type="url")
                            </Label>
                            <Input
                                id="website"
                                name="website"
                                placeholder="https://example.com"
                                helperText="Shows URL keyboard on mobile"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="yearsOfExperience" className="flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Years of Experience (type="number")
                            </Label>
                            <Input
                                id="yearsOfExperience"
                                name="yearsOfExperience"
                                placeholder="10"
                                helperText="Shows numeric keyboard on mobile"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date (type="date")
                            </Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                helperText="Shows date picker on mobile"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio (textarea)</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                placeholder="Tell us about yourself..."
                                rows={4}
                            />
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full sm:w-auto">Submit Form</Button>
                </CardFooter>
            </Card>

            {/* Responsive Layout Test */}
            <Card>
                <CardHeader>
                    <CardTitle>Responsive Layout Test</CardTitle>
                    <CardDescription>
                        Layouts adapt from single-column on mobile to multi-column on larger screens
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="p-4 rounded-lg border bg-secondary/30 text-center"
                            >
                                <p className="font-semibold">Card {i}</p>
                                <p className="text-sm text-muted-foreground">
                                    Stacks on mobile, grid on desktop
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Card Footer Test */}
            <Card>
                <CardHeader>
                    <CardTitle>Card Footer Responsiveness</CardTitle>
                    <CardDescription>
                        Card footers stack buttons vertically on mobile, horizontally on desktop
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Resize your browser window to see the buttons below adapt their layout.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                    <Button variant="secondary">Save Draft</Button>
                </CardFooter>
            </Card>

            {/* Testing Instructions */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle>Testing Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Desktop Testing:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Open Chrome DevTools (F12)</li>
                            <li>Click the device toolbar icon (Ctrl+Shift+M)</li>
                            <li>Select different mobile devices from the dropdown</li>
                            <li>Test touch targets and keyboard types</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Mobile Device Testing:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Open this page on your mobile device</li>
                            <li>Try tapping all buttons and links</li>
                            <li>Fill out the form and check keyboard types</li>
                            <li>Verify no horizontal scrolling occurs</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">What to Check:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>All buttons are easily tappable (44x44px minimum)</li>
                            <li>Email field shows email keyboard</li>
                            <li>Phone field shows numeric keyboard</li>
                            <li>URL field shows URL keyboard</li>
                            <li>Layouts stack properly in single column on mobile</li>
                            <li>No horizontal scrolling on any viewport size</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
