import { handler as lambdaHandler } from '@handlers/tasks/update';
import { getItem, updateItem } from '@lib';
import { Context } from 'aws-lambda';
import { createMockAuthEvent } from '../../helpers';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    getItem: jest.fn(),
    updateItem: jest.fn(),
    buildUpdateExpression: jest.fn().mockReturnValue({
        UpdateExpression: 'SET #attr0 = :val0',
        ExpressionAttributeNames: { '#attr0': 'updatedAt' },
        ExpressionAttributeValues: { ':val0': '2024-01-01T00:00:00.000Z' },
    }),
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

describe('Update Task Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    const mockExistingTask = {
        PK: 'TASK#task-123',
        SK: 'METADATA',
        id: 'task-123',
        title: 'Original Title',
        description: 'Original Description',
        status: 'OPEN',
        priority: 'MEDIUM',
        createdById: 'user-123',
        createdByName: 'Test User',
        createdByEmail: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if task ID is missing', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);
        const event = createMockAuthEvent({ title: 'Updated Title' }, null, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Task ID is required');
    });

    it('should return 400 if body is missing', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);
        const event = createMockAuthEvent(null, { taskId: 'task-123' }, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Request body is required');
    });

    it('should return 404 if task not found', async () => {
        (getItem as jest.Mock).mockResolvedValue(undefined);
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent({ title: 'Updated Title' }, { taskId: 'nonexistent-task' }, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).message).toBe('Task not found');
    });

    it('should return 403 if user is not admin', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'member' });
        (requireRole as jest.Mock).mockReturnValue({ statusCode: 403, body: JSON.stringify({ message: 'Insufficient permissions' }) });

        const event = createMockAuthEvent({ title: 'Updated Title' }, { taskId: 'task-123' }, 'member');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(403);
        expect(JSON.parse(result.body).message).toBe('Members can only update task status');
    });

    it('should update a task successfully', async () => {
        (getItem as jest.Mock).mockResolvedValue(mockExistingTask);
        (updateItem as jest.Mock).mockResolvedValue({
            ...mockExistingTask,
            title: 'Updated Title',
            updatedAt: '2024-01-02T00:00:00.000Z',
        });
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent({ title: 'Updated Title' }, { taskId: 'task-123' }, 'admin');

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.id).toBe('task-123');
        expect(body.data.title).toBe('Updated Title');
        expect(updateItem).toHaveBeenCalled();
    });

    it('should update task status', async () => {
        (getItem as jest.Mock).mockResolvedValue(mockExistingTask);
        (updateItem as jest.Mock).mockResolvedValue({
            ...mockExistingTask,
            status: 'IN_PROGRESS',
        });
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent({ status: 'IN_PROGRESS' }, { taskId: 'task-123' }, 'admin');

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.status).toBe('IN_PROGRESS');
    });
});
