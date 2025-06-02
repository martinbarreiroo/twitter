module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  moduleNameMapper: {
    "^@domains/(.*)$": "<rootDir>/src/domains/$1",
    "^@utils(.*)$": "<rootDir>/src/utils$1",
    "^@types(.*)$": "<rootDir>/src/types$1",
  },
  testMatch: ["**/*.spec.ts"],
};
