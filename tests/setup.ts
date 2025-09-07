// Test setup file
import { config } from 'dotenv';

// Load environment variables for tests
config({ path: '.env.local' });

// Mock console.log during tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}