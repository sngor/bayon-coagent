'use client';

import React, { useState } from 'react';

export function TestChatInterface() {
    const [inputValue, setInputValue] = useState('');

    return (
        <div>
            <p>Test Chat Interface</p>
            <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
            />
        </div>
    );
}