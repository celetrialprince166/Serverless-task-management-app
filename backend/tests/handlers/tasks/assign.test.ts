import { handler as lambdaHandler } from '@handlers/tasks/assign';
import { getItem, putItem } from '@lib';
import { Context } from 'aws-lambda';
import * as validators from '../../../src/validators';
import { createMockAuthEvent } from '../../helpers';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    getItem: jest.fn(),
    putItem: jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({
        setRequestId: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

// Mock the validators module
jest.mock('../../../src/validators', () => ({
    ...jest.requireActual('../../../src/validators'),
    validateTaskInput: jest.fn(),
}));

// Mock the middleware module
jest.mock('../../../src/middleware', () => ({
    extractUser: jest.fn(),
    requireRole: jest.fn(),
}));

import { extractUser, requireRole } from '../../../src/middleware';

describe('Assign Task Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    const mockExistingTask = {
        PK: 'TASK#task-123',
        SK: 'METADATA',
        id: 'task-123',
        title: 'Test Task',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock for validation - success
        (validators.validateTaskInput as jest.Mock).mockReturnValue({
            value: { userIds: ['user-1'] },
            error: undefined,
            details: undefined,
        });
    });

    it('should return 400 if task ID is missing', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);
        const event = createMockAuthEvent({ userIds: ['user-1'] }, null, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Task ID is required');
    });

    it('should return 400 if body is missing', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);
        const event = createMockAuthEvent(null, { id: 'task-123' }, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Request body is required');
    });

    it('should return 404 if task not found', async () => {
        (getItem as jest.Mock).mockResolvedValue(undefined);
        (validators.validateTaskInput as jest.Mock).mockReturnValue({
            error: undefined,
        });
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent({ userIds: ['user-1'] }, { id: 'nonexistent-task' }, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).message).toBe('Task not found');
    });

    it('should assign users to task successfully', async () => {
        (validators.validateTaskInput as jest.Mock).mockReturnValue({
            value: { userIds: ['user-1', 'user-2'] },
            error: undefined,
        });
        (getItem as jest.Mock)
            .mockResolvedValueOnce(mockExistingTask) // Task exists
            .mockResolvedValue(undefined); // No existing assignment
        (putItem as jest.Mock).mockResolvedValue({});
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(
            { userIds: ['user-1', 'user-2'] },
            { id: 'task-123' },
            'admin',
            'assigner-123'
        );

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.data.taskId).toBe('task-123');
        expect(body.data.assignments).toHaveLength(2);
        expect(putItem).toHaveBeenCalledTimes(2);
    });

    it('should skip existing assignments', async () => {
        const existingAssignment = {
            PK: 'TASK#task-123',
            SK: 'ASSIGN#user-1',
            userId: 'user-1',
            assignedAt: '2024-01-01T00:00:00.000Z',
            assignedById: 'prev-assigner',
            assignedByName: 'Previous Assigner',
        };

        (validators.validateTaskInput as jest.Mock).mockReturnValue({
            value: { userIds: ['user-1', 'user-2'] },
            error: undefined,
        });
        (getItem as jest.Mock)
            .mockResolvedValueOnce(mockExistingTask)
            .mockResolvedValueOnce(existingAssignment) // User-1 already assigned
            .mockResolvedValue(undefined); // User-2 not assigned
        (putItem as jest.Mock).mockResolvedValue({});
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(
            { userIds: ['user-1', 'user-2'] },
            { id: 'task-123' },
            'admin',
            'assigner-123'
        );

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.data.assignments).toHaveLength(2);
        // Only one new assignment created
        expect(putItem).toHaveBeenCalledTimes(1);
    });
});
