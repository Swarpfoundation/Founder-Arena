import { vi } from "vitest";

// Mock environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";
