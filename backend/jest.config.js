/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.test.json',
        }],
    },
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
    ],
    coverageThreshold: {
        global: {
            branches: 32,
            functions: 36,
            lines: 51,
            statements: 52,
        },
    },
    moduleNameMapper: {
        '^@lib$': '<rootDir>/src/lib/index.ts',
        '^@lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@handlers/(.*)$': '<rootDir>/src/handlers/$1',
        '^@models/(.*)$': '<rootDir>/src/models/$1',
        '^@validators/(.*)$': '<rootDir>/src/validators/$1',
        '^@middleware$': '<rootDir>/src/middleware/index.ts',
        '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    verbose: true,
};
