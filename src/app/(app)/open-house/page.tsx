'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenHouseCheckin } from '@/components/mobile';
import { useUser } from '@/aws/auth/use-user';

export default function OpenHousePage() {
    const { user } = useUser();

    if (!user) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>
                            Please log in to access the open house check-in system.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Open House</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your open house sessions and visitor check-ins.
                </p>
            </div>

            <OpenHouseCheckin
                userId={user.id}
                onSessionStart={(session) => {
                    console.log('Session started:', session);
                }}
                onSessionEnd={(summary) => {
                    console.log('Session ended:', summary);
                }}
                onVisitorAdded={(visitor) => {
                    console.log('Visitor added:', visitor);
                }}
            />
        </div>
    );
}
