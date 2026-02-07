/**
 * Jest Test Setup
 */

// Set test environment variables
process.env.AWS_REGION = 'eu-west-1';
process.env.TASKS_TABLE = 'test-tasks';
process.env.USERS_TABLE = 'test-users';
process.env.LOG_LEVEL = 'ERROR'; // Reduce noise in tests
process.env.IS_OFFLINE = 'true';
process.env.ALLOWED_ORIGIN = '*';

// Global test timeout
jest.setTimeout(10000);
