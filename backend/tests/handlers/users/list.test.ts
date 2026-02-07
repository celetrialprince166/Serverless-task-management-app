import { handler as lambdaHandler } from '@handlers/users/list';
import { TABLES, scanItems } from '@lib';
import { Context } from 'aws-lambda';
import { createMockAuthEvent } from '../../helpers';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    scanItems: jest.fn(),
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

describe('List Users Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    const mockUsers = [
        {
            PK: 'USER#user-1',
            SK: 'PROFILE',
            id: 'user-1',
            email: 'user1@example.com',
            name: 'User One',
            role: 'MEMBER',
            status: 'ACTIVE',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
            PK: 'USER#user-2',
            SK: 'PROFILE',
            id: 'user-2',
            email: 'user2@example.com',
            name: 'User Two',
            role: 'ADMIN',
            status: 'ACTIVE',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should allow member to list users', async () => {
        (scanItems as jest.Mock).mockResolvedValue([]);
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'member' });

        const event = createMockAuthEvent(null, null, 'member');

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data).toEqual([]);
    });

    it('should list users for admin', async () => {
        (scanItems as jest.Mock).mockResolvedValue(mockUsers);
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, null, 'admin');

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data).toHaveLength(2);
        expect(body.data[0].id).toBe('user-1');
        expect(body.data[1].id).toBe('user-2');
        expect(body.pagination).toBeDefined();
        expect(scanItems).toHaveBeenCalledWith(expect.objectContaining({
            TableName: TABLES.USERS,
        }));
    });

    it('should respect limit query parameter', async () => {
        (scanItems as jest.Mock).mockResolvedValue([mockUsers[0]]);
        (extractUser as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
        (requireRole as jest.Mock).mockReturnValue(null);

        const event = createMockAuthEvent(null, null, 'admin', 'admin-123', { limit: '1' });

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data).toHaveLength(1);
        expect(scanItems).toHaveBeenCalledWith(expect.objectContaining({
            Limit: 1,
        }));
    });
});
