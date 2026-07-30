module.exports = {
    displayName: "integration",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.integration.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/src/test/setupIntegration.ts"],
    testTimeout: 30000,
    transform: {
        "^.+\\.(t|j)sx?$": "@swc/jest",
    },
};
