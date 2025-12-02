'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SessionForm } from '@/components/open-house/session-form';

interface SessionsContentProps {
    status: string;
}

export function SessionsContent({ status }: SessionsContentProps) {
    const [sessionFormOpen, setSessionFormOpen] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-headline font-bold">Open House Sessions</h2>
                    <p className="text-muted-foreground">
                        Create and manage your open house events
                    </p>
                </div>
                <Button onClick={() => setSessionFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Session
                </Button>
            </div>

            <SessionForm open={sessionFormOpen} onOpenChange={setSessionFormOpen} />
        </>
    );
}
