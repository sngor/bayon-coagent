/**
 * Lighthouse CI Configuration
 * 
 * This configuration defines performance budgets and assertions
 * for Lighthouse CI runs in the CI/CD pipeline.
 * 
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */

module.exports = {
    ci: {
        collect: {
            // URLs to test (can be overridden via CLI)
            url: [
                'http://localhost:3000/dashboard',
                'http://localhost:3000/studio/write',
                'http://localhost:3000/studio/describe',
                'http://localhost:3000/studio/reimagine',
                'http://localhost:3000/brand/profile',
                'http://localhost:3000/brand/audit',
                'http://localhost:3000/research/agent',
                'http://localhost:3000/market/insights',
                'http://localhost:3000/tools/calculator',
                'http://localhost:3000/library/content',
            ],
            // Number of runs per URL
            numberOfRuns: 3,
            // Lighthouse settings
            settings: {
                // Collect additional metrics
                preset: 'desktop',
                // Disable throttling for local tests
                throttling: {
                    rttMs: 40,
                    throughputKbps: 10 * 1024,
                    cpuSlowdownMultiplier: 1,
                },
                // Screen emulation
                screenEmulation: {
                    mobile: false,
                    width: 1350,
                    height: 940,
                    deviceScaleFactor: 1,
                    disabled: false,
                },
            },
        },
        assert: {
            // Performance budgets
            assertions: {
                // Core Web Vitals
                'categories:performance': ['error', { minScore: 0.9 }],
                'categories:accessibility': ['error', { minScore: 0.95 }],
                'categories:best-practices': ['error', { minScore: 0.9 }],
                'categories:seo': ['error', { minScore: 0.95 }],

                // Specific metrics
                'first-contentful-paint': ['error', { maxNumericValue: 1500 }], // 1.5s
                'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-blocking-time': ['error', { maxNumericValue: 300 }], // 300ms
                'speed-index': ['error', { maxNumericValue: 3000 }], // 3s
                'interactive': ['error', { maxNumericValue: 3000 }], // 3s (TTI)

                // Resource budgets
                'resource-summary:script:size': ['error', { maxNumericValue: 204800 }], // 200KB
                'resource-summary:stylesheet:size': ['error', { maxNumericValue: 51200 }], // 50KB
                'resource-summary:document:size': ['error', { maxNumericValue: 102400 }], // 100KB
                'resource-summary:image:size': ['warn', { maxNumericValue: 512000 }], // 500KB
                'resource-summary:font:size': ['warn', { maxNumericValue: 102400 }], // 100KB

                // Network requests
                'resource-summary:script:count': ['warn', { maxNumericValue: 15 }],
                'resource-summary:stylesheet:count': ['warn', { maxNumericValue: 5 }],
                'resource-summary:third-party:count': ['warn', { maxNumericValue: 10 }],

                // Accessibility
                'color-contrast': 'error',
                'image-alt': 'error',
                'label': 'error',
                'link-name': 'error',
                'button-name': 'error',
                'aria-required-attr': 'error',
                'aria-valid-attr': 'error',

                // Best practices
                'errors-in-console': 'warn',
                'uses-http2': 'warn',
                'uses-passive-event-listeners': 'warn',
                'no-document-write': 'error',
                'geolocation-on-start': 'error',
                'notification-on-start': 'error',

                // SEO
                'meta-description': 'error',
                'document-title': 'error',
                'crawlable-anchors': 'error',
                'robots-txt': 'warn',
                'hreflang': 'warn',
            },
        },
        upload: {
            // Target for storing results
            // Options: 'temporary-public-storage', 'filesystem', or custom server
            target: 'temporary-public-storage',
            // Store results for 30 days
            uploadUrlMap: true,
        },
    },
};
