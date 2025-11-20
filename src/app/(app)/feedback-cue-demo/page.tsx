'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FeedbackCue } from '@/components/ui/feedback-cue';
import { useState } from 'react';

export default function FeedbackCueDemoPage() {
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    return (
        <StandardPageLayout
            title="Feedback Cues Demo"
            description="User feedback and notification cues"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Feedback Types</CardTitle>
                        <CardDescription>Different feedback cue variants for various states</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Button onClick={() => setShowSuccess(!showSuccess)}>
                                    Toggle Success
                                </Button>
                                {showSuccess && (
                                    <FeedbackCue
                                        id="success-1"
                                        type="success"
                                        title="Success!"
                                        description="Content saved successfully"
                                    />
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <Button onClick={() => setShowError(!showError)} variant="destructive">
                                    Toggle Error
                                </Button>
                                {showError && (
                                    <FeedbackCue
                                        id="error-1"
                                        type="error"
                                        title="Error"
                                        description="Failed to save. Please try again."
                                    />
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <Button onClick={() => setShowInfo(!showInfo)} variant="outline">
                                    Toggle Info
                                </Button>
                                {showInfo && (
                                    <FeedbackCue
                                        id="info-1"
                                        type="info"
                                        title="Info"
                                        description="Complete your profile to unlock this feature"
                                    />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { FeedbackCue } from '@/components/ui/feedback-cue';

<FeedbackCue
  id="success-1"
  type="success"
  title="Success!"
  description="Content saved successfully"
/>`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ Multiple feedback types (success, error, info, warning, help)</li>
                            <li>✓ Dismissible with user preferences</li>
                            <li>✓ Accessible with ARIA labels</li>
                            <li>✓ Smooth animations</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
