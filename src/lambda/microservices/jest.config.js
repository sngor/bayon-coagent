module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                module: 'commonjs',
                target: 'es2020',
                lib: ['es2020'],
                moduleResolution: 'node',
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                skipLibCheck: true,
                strict: false,
                baseUrl: '../../../src',
                paths: {
                    '@/*': ['*']
                }
            }
        }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        '**/*.ts',
        '!**/*.d.ts',
        '!**/__tests__/**',
        '!**/node_modules/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testTimeout: 30000,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/../../../src/$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(fast-check)/)'
    ]
};