'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Celebration } from '@/components/ui/celebration';
import { useState } from 'react';
import { CheckCircle2, Trophy, Star, Sparkles } from 'lucide-react';

export default function CelebrationDemoPage() {
    const [showConfetti, setShowConfetti] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showMilestone, setShowMilestone] = useState(false);

    return (
        <StandardPageLayout
            title="Celebration Effects Demo"
            description="Success celebrations and confetti effects"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Celebration Types</CardTitle>
                        <CardDescription>Trigger celebration animations for success moments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => setShowConfetti(true)}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Confetti
                            </Button>
                            <Button onClick={() => setShowSuccess(true)} variant="secondary">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Success
                            </Button>
                            <Button onClick={() => setShowMilestone(true)} variant="outline">
                                <Trophy className="mr-2 h-4 w-4" />
                                Milestone
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Use Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ <strong>Profile Completion:</strong> Celebrate when user completes their profile</li>
                            <li>✓ <strong>First Content Created:</strong> Reward first blog post or social media content</li>
                            <li>✓ <strong>Marketing Plan Generated:</strong> Celebrate successful AI plan creation</li>
                            <li>✓ <strong>Goal Achievement:</strong> Milestone celebrations (10 listings, 100 leads, etc.)</li>
                            <li>✓ <strong>Integration Connected:</strong> Success when connecting Google Business Profile</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { Celebration } from '@/components/ui/celebration';

const [show, setShow] = useState(false);

<Celebration
  show={show}
  type="confetti"
  message="Success!"
  onComplete={() => setShow(false)}
/>`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Celebration show={showConfetti} type="confetti" onComplete={() => setShowConfetti(false)} />
                <Celebration show={showSuccess} type="success" onComplete={() => setShowSuccess(false)} />
                <Celebration show={showMilestone} type="milestone" onComplete={() => setShowMilestone(false)} />
            </div>
        </StandardPageLayout>
    );
}
