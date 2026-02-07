
import { handler } from '@handlers/tasks/get';
import { TABLES, getItem } from '@lib';
import { Context } from 'aws-lambda';
import { createMockAuthEvent } from '../../helpers';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    getItem: jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({
        setRequestId: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

// Mock the middleware module
jest.mock('../../../src/middleware', () => ({
    extractUser: jest.fn(),
    requireRole: jest.fn(),
}));

import { extractUser, requireRole } from '../../../src/middleware';

describe('Get Task Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if taskId is missing', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'member' });
        (requireRole as jest.Mock).mockReturnValue(null);
        const event = createMockAuthEvent(null, {});

        const result = await handler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Task ID is required');
    });

    it('should return 404 if task not found', async () => {
        (getItem as jest.Mock).mockResolvedValue(null);
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'member' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, { taskId: 'task-123' });

        const result = await handler(event, mockContext);
        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).message).toBe('Task not found');
    });

    it('should return task if found', async () => {
        const mockItem = {
            id: 'task-123',
            title: 'Test Task',
            description: 'Test Description',
            status: 'OPEN',
            priority: 'HIGH',
            createdById: 'user-123',
            createdByName: 'Test User',
            createdByEmail: 'test@example.com',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
        };

        (getItem as jest.Mock).mockResolvedValue(mockItem);
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'member' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, { taskId: 'task-123' }, 'member');

        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.id).toBe(mockItem.id);
        expect(body.data.title).toBe(mockItem.title);
        expect(getItem).toHaveBeenCalledWith(expect.objectContaining({
            TableName: TABLES.TASKS,
            Key: expect.objectContaining({
                PK: 'TASK#task-123',
                SK: 'METADATA',
            }),
        }));
    });
});
