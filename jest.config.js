module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts', '**/*.test.tsx', '**/*.property.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(lucide-react|uuid|@radix-ui|class-variance-authority)/)'
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        'src/**/*.tsx',
        '!src/**/*.test.ts',
        '!src/**/*.test.tsx',
        '!src/**/*.property.test.ts',
        '!src/**/*.d.ts',
        '!src/__tests__/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/mocks/setup.ts', '@testing-library/jest-dom'],
    setupFiles: ['<rootDir>/jest.setup.js'],
    testTimeout: 30000,
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: './tsconfig.test.json',
                isolatedModules: true,
                diagnostics: {
                    ignoreCodes: [1343, 2307, 2345, 2739, 7006, 18046, 2554, 2769]
                }
            },
        ],
    },
    // fast-check configuration
    // Increase timeout for property-based tests which run multiple iterations
    slowTestThreshold: 10000,
};
