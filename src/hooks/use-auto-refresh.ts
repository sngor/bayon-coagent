'use client';

import { useEffect, useRef } from 'react';

export function useAutoRefresh(callback: () => void, interval: number, enabled = true) {
    const callbackRef = useRef(callback);
    const intervalRef = useRef<NodeJS.Timeout>();

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            callbackRef.current();
        }, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [interval, enabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
}