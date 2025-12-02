/**
 * MSW (Mock Service Worker) setup for testing
 * 
 * This file sets up API mocking for external services used in the
 * Market Intelligence Alerts feature.
 */

// MSW temporarily disabled due to dependency issues
// import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll, jest } from '@jest/globals';
// import { handlers } from './handlers/index';

// Setup MSW server with all handlers
// export const server = setupServer(...handlers);

// Polyfill for fetch API in Node.js test environment
global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
}) as any;

// Polyfill for TextEncoder and TextDecoder (needed by qrcode library)
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Polyfill for structuredClone (Node.js 17+)
if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = (obj: any) => {
        // Handle primitives and null
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // Handle Date
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        // Handle Array
        if (Array.isArray(obj)) {
            return obj.map((item: any) => global.structuredClone(item));
        }

        // Handle Object
        const clonedObj: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = global.structuredClone(obj[key]);
            }
        }
        return clonedObj;
    };
}

// Polyfill for AbortSignal.timeout (Node.js 17.3+)
if (typeof AbortSignal.timeout === 'undefined') {
    (AbortSignal as any).timeout = (ms: number) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    };
}

// Mock performance API for animation tests
let mockTime = 0;
global.performance = {
    now: jest.fn(() => mockTime),
    getEntriesByType: jest.fn().mockReturnValue([]),
} as any;

// Mock requestAnimationFrame and cancelAnimationFrame
let animationFrameId = 0;
global.requestAnimationFrame = jest.fn((callback) => {
    mockTime += 16.67; // Simulate 60fps
    setTimeout(callback, 0);
    return ++animationFrameId;
});

global.cancelAnimationFrame = jest.fn();

// Helper to reset mock time
(global as any).resetMockTime = () => {
    mockTime = 0;
};

// Polyfill for ResizeObserver (needed by Radix UI components)
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock matchMedia for responsive hooks
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock IndexedDB for testing
Object.defineProperty(window, 'indexedDB', {
    value: {
        open: jest.fn().mockImplementation(() => ({
            result: {
                createObjectStore: jest.fn(),
                transaction: jest.fn().mockReturnValue({
                    objectStore: jest.fn().mockReturnValue({
                        add: jest.fn().mockResolvedValue(undefined),
                        get: jest.fn().mockResolvedValue(undefined),
                        getAll: jest.fn().mockResolvedValue([]),
                        put: jest.fn().mockResolvedValue(undefined),
                        delete: jest.fn().mockResolvedValue(undefined),
                    }),
                }),
            },
            onsuccess: null,
            onerror: null,
        })),
    },
    writable: true,
});

// Start server before all tests
beforeAll(() => {
    // server.listen({
    //     onUnhandledRequest: 'warn',
    // });
});

// Reset handlers after each test
afterEach(() => {
    // server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
    // server.close();
});