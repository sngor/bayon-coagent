'use client';

import { useState, useEffect } from 'react';

export default function UsersTestPage() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        console.log('UsersTestPage mounted');
        setCount(1);
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Users Test Page</h1>
            <p>Count: {count}</p>
            <p>If you see this without errors, the layout is fine.</p>
        </div>
    );
}
