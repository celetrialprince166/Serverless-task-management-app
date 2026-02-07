import { handler as lambdaHandler } from '@handlers/tasks/unassign';
import { TABLES, getItem, deleteItem } from '@lib';
import { Context } from 'aws-lambda';
import { createMockAuthEvent } from '../../helpers';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    getItem: jest.fn(),
    deleteItem: jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({
        setRequestId: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

// Mock the middleware module
jest.mock('../../../src/middleware', () => ({
    extractUser: jest.fn(),
    requireRole: jest.fn(),
}));

import { extractUser, requireRole } from '../../../src/middleware';

describe('Unassign Task Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    const mockExistingTask = {
        PK: 'TASK#task-123',
        SK: 'METADATA',
        id: 'task-123',
        title: 'Test Task',
    };

    const mockExistingAssignment = {
        PK: 'TASK#task-123',
        SK: 'ASSIGN#user-1',
        taskId: 'task-123',
        userId: 'user-1',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if task ID is missing', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);
        const event = createMockAuthEvent(null, { userId: 'user-1' }, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Task ID is required');
    });

    it('should return 400 if user ID is missing', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);
        const event = createMockAuthEvent(null, { id: 'task-123' }, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('User ID is required');
    });

    it('should return 404 if task not found', async () => {
        (getItem as jest.Mock).mockResolvedValue(undefined);
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, { id: 'nonexistent-task', userId: 'user-1' }, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).message).toBe('Task not found');
    });

    it('should return 404 if assignment not found', async () => {
        (getItem as jest.Mock)
            .mockResolvedValueOnce(mockExistingTask)
            .mockResolvedValueOnce(undefined);
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, { id: 'task-123', userId: 'unassigned-user' }, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).message).toBe('User is not assigned to this task');
    });

    it('should unassign user from task successfully', async () => {
        (getItem as jest.Mock)
            .mockResolvedValueOnce(mockExistingTask)
            .mockResolvedValueOnce(mockExistingAssignment);
        (deleteItem as jest.Mock).mockResolvedValue({});
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, { id: 'task-123', userId: 'user-1' }, 'admin');

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.message).toBe('User unassigned from task successfully');
        expect(body.data.taskId).toBe('task-123');
        expect(body.data.userId).toBe('user-1');
        expect(deleteItem).toHaveBeenCalledWith(expect.objectContaining({
            TableName: TABLES.TASKS,
            Key: { PK: 'TASK#task-123', SK: 'ASSIGN#user-1' },
        }));
    });
});
