import { handler as lambdaHandler } from '@handlers/tasks/delete';
import { TABLES, getItem, deleteItem, queryItems } from '@lib';
import { Context } from 'aws-lambda';
import { createMockAuthEvent } from '../../helpers';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    getItem: jest.fn(),
    deleteItem: jest.fn(),
    queryItems: jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({
        setRequestId: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn((msg, err) => console.error(msg, err)),
    })),
}));

// Mock the middleware module
jest.mock('../../../src/middleware', () => ({
    extractUser: jest.fn(),
    requireRole: jest.fn(),
}));

import { extractUser, requireRole } from '../../../src/middleware';

describe('Delete Task Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    const mockExistingTask = {
        PK: 'TASK#task-123',
        SK: 'METADATA',
        id: 'task-123',
        title: 'Test Task',
        createdById: 'user-123',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if task ID is missing', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, {}, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Task ID is required');
    });

    it('should return 404 if task not found', async () => {
        (getItem as jest.Mock).mockResolvedValue(undefined);
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, { id: 'nonexistent-task' }, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).message).toBe('Task not found');
    });

    it('should return 403 if user is not admin', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'member' });
        (requireRole as jest.Mock).mockImplementation(() => ({
            statusCode: 403,
            body: JSON.stringify({ message: 'Insufficient permissions' }),
        }));

        const event = createMockAuthEvent(null, { id: 'task-123' }, 'member');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(403);
        expect(JSON.parse(result.body).message).toBe('Insufficient permissions');
    });

    it('should delete a task successfully as admin', async () => {
        (getItem as jest.Mock).mockResolvedValue(mockExistingTask);
        (queryItems as jest.Mock).mockResolvedValue([]);
        (deleteItem as jest.Mock).mockResolvedValue({});
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, { id: 'task-123' }, 'admin');

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.message).toBe('Task deleted successfully');
        expect(body.data.id).toBe('task-123');
        expect(deleteItem).toHaveBeenCalledWith(expect.objectContaining({
            TableName: TABLES.TASKS,
            Key: { PK: 'TASK#task-123', SK: 'METADATA' },
        }));
    });

    it('should delete a task and its assignments', async () => {
        const mockAssignments = [
            { PK: 'TASK#task-123', SK: 'ASSIGN#user-1' },
            { PK: 'TASK#task-123', SK: 'ASSIGN#user-2' },
        ];

        (getItem as jest.Mock).mockResolvedValue(mockExistingTask);
        (queryItems as jest.Mock).mockResolvedValue(mockAssignments);
        (deleteItem as jest.Mock).mockResolvedValue({});
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, { id: 'task-123' }, 'admin');

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        // 2 assignments + 1 task = 3 delete calls
        expect(deleteItem).toHaveBeenCalledTimes(3);
    });
});
