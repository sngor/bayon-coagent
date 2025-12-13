'use client';

import { useState, useEffect } from 'react';

export default function UsersTestClient() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        console.log('UsersTestPage mounted');
        setCount(1);
    }, []);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Users Test</h1>
                    <p className="text-muted-foreground">Test page for user management functionality</p>
                </div>
            </div>

            <div className="space-y-4">
                <p>Count: {count}</p>
                <p>If you see this without errors, the layout is fine.</p>
            </div>
        </div>
    );
}