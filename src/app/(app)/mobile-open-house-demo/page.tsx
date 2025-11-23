'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenHouseCheckin } from '@/components/mobile';
import { useUser } from '@/aws/auth/use-user';

export default function MobileOpenHouseDemoPage() {
    const { user } = useUser();

    if (!user) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>
                            Please log in to access the open house check-in demo.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Open House Check-in Demo</CardTitle>
                    <CardDescription>
                        Test the mobile open house check-in system with offline support.
                        This demo allows you to start sessions, check in visitors, and end sessions.
                        Try going offline to test the sync functionality.
                    </CardDescription>
                </CardHeader>
            </Card>

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