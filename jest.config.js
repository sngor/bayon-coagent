module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/*.test.ts', 
        '**/*.test.tsx', 
        '**/*.property.test.ts',
        '**/__tests__/**/*.ts',
        '**/__tests__/**/*.tsx'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(lucide-react|uuid|@radix-ui|class-variance-authority|framer-motion)/)'
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        'src/**/*.tsx',
        '!src/**/*.test.ts',
        '!src/**/*.test.tsx',
        '!src/**/*.property.test.ts',
        '!src/**/*.d.ts',
        '!src/__tests__/**',
        '!src/lib/test-utils.tsx',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/node_modules/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'clover'],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
        // Higher thresholds for critical modules
        './src/aws/': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        './src/lib/security-utils.ts': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
        './src/lib/form-validation.ts': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85,
        },
    },
    setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/mocks/setup.ts', 
        '<rootDir>/src/lib/test-utils.tsx',
        '@testing-library/jest-dom'
    ],
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
    
    // Performance and reliability settings
    slowTestThreshold: 10000,
    verbose: true,
    clearMocks: true,
    restoreMocks: true,
    detectOpenHandles: true,
    detectLeaks: true,
    maxWorkers: '50%',
    
    // Error handling
    errorOnDeprecated: true,
    
    // Global test configuration
    globals: {
        'ts-jest': {
            useESM: true,
            isolatedModules: true,
        },
    },
    
    // Test environment options
    testEnvironmentOptions: {
        url: 'http://localhost:3000',
    },
};
