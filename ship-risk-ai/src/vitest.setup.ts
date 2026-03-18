import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock firebase
vi.mock("./services/firebase", () => ({
  auth: null,
  db: null,
  analytics: null,
}));

// Mock environment variables
process.env.VITE_FIREBASE_API_KEY = "test-key";
process.env.VITE_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
process.env.VITE_FIREBASE_PROJECT_ID = "test-project";
