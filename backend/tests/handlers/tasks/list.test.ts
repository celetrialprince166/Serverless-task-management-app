
import { handler as lambdaHandler } from '@handlers/tasks/list';
import { queryItems, scanItems } from '@lib';
import { Context } from 'aws-lambda';
import { createMockAuthEvent } from '../../helpers';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    queryItems: jest.fn(),
    scanItems: jest.fn(),
    batchGet: jest.fn(),
    getItem: jest.fn(),
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
}));

import { extractUser } from '../../../src/middleware';

describe('List Tasks Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all tasks when no filter provided', async () => {
        const mockItems = [
            { id: '1', title: 'Task 1', status: 'OPEN', priority: 'HIGH', createdAt: '2023-01-01', SK: 'METADATA' },
            { id: '2', title: 'Task 2', status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: '2023-01-02', SK: 'METADATA' },
        ];

        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (scanItems as jest.Mock).mockResolvedValue(mockItems);

        const event = createMockAuthEvent(null, null, 'admin');

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data).toHaveLength(2);
        expect(scanItems).toHaveBeenCalled();
    });

    it('should filter by status using query', async () => {
        const mockItems = [
            { id: '1', title: 'Task 1', status: 'OPEN', priority: 'HIGH', SK: 'METADATA' },
        ];

        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (queryItems as jest.Mock).mockResolvedValue(mockItems);

        const event = createMockAuthEvent(null, null, 'admin', 'user-123', { status: 'OPEN' });

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        expect(queryItems).toHaveBeenCalledWith(expect.objectContaining({
            IndexName: 'GSI1',
        }));
    });
});
