
import { handler as lambdaHandler } from '@handlers/tasks/create';
import { TABLES, putItem } from '@lib';
import { Context } from 'aws-lambda';
import { createMockAuthEvent } from '../../helpers';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    putItem: jest.fn(),
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

describe('Create Task Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if body is missing', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);
        const event = createMockAuthEvent(null, null, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Request body is required');
    });

    it('should return 400 if body is invalid JSON', async () => {
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);
        const event = createMockAuthEvent('{invalid-json', null, 'admin');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Invalid JSON in request body');
    });

    it('should create a task successfully', async () => {
        const taskInput = {
            title: 'Test Task',
            description: 'Test Description',
            priority: 'HIGH',
        };

        const event = createMockAuthEvent(JSON.stringify(taskInput), null, 'admin', 'user-123');

        (putItem as jest.Mock).mockResolvedValue({});
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.data.title).toBe(taskInput.title);
        expect(body.data.priority).toBe(taskInput.priority);
        expect(body.data.status).toBe('OPEN');
        expect(putItem).toHaveBeenCalledWith(expect.objectContaining({
            TableName: TABLES.TASKS,
            Item: expect.objectContaining({
                title: taskInput.title,
                createdById: 'user-123',
            }),
        }));
    });
});
