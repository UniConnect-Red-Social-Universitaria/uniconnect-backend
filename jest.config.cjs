/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  moduleFileExtensions: ["ts", "js", "json"],
  testEnvironment: "node",
  testEnvironmentOptions: {
    env: { NODE_ENV: "test" },
  },
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
  },

  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/generated/**", "!src/server.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "json-summary", "lcov"],
};
