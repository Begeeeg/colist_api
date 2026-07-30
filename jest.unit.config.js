module.exports = {
    displayName: "unit",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.unit.test.ts"],
    transform: {
        "^.+\\.(t|j)sx?$": "@swc/jest",
    },
    clearMocks: true,
};
