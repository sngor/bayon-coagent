/**
 * MSW (Mock Service Worker) setup for testing
 * 
 * This file sets up API mocking for external services used in the
 * Market Intelligence Alerts feature.
 */

import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from '@jest/globals';
import { handlers } from './handlers';

// Setup MSW server with all handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
    server.listen({
        onUnhandledRequest: 'warn',
    });
});

// Reset handlers after each test
afterEach(() => {
    server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
    server.close();
});