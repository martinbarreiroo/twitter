// Test setup file for Jest
// This file is run before each test file
import "reflect-metadata";

// Mock console.log to reduce noise during tests
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

// Global test timeout
jest.setTimeout(10000);

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Restore console methods after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
