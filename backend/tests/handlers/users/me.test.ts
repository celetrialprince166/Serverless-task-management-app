import { handler as lambdaHandler } from '@handlers/users/me';
import { TABLES, getItem } from '@lib';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

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

describe('Get Current User Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    const mockExistingUser = {
        PK: 'USER#user-123',
        SK: 'PROFILE',
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'MEMBER',
        status: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if no user ID in claims', async () => {
        const event = {
            path: '/users/me',
            requestContext: { authorizer: { claims: {} } },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(401);
        expect(JSON.parse(result.body).message).toBe('Authentication required');
    });

    it('should return user from database if exists', async () => {
        (getItem as jest.Mock).mockResolvedValue(mockExistingUser);

        const event = {
            path: '/users/me',
            requestContext: {
                authorizer: {
                    claims: { sub: 'user-123' },
                },
            },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.id).toBe('user-123');
        expect(body.data.email).toBe('test@example.com');
        expect(body.data.name).toBe('Test User');
        expect(getItem).toHaveBeenCalledWith(expect.objectContaining({
            TableName: TABLES.USERS,
            Key: { PK: 'USER#user-123', SK: 'PROFILE' },
        }));
    });

    it('should return basic info from Cognito if user not in database', async () => {
        (getItem as jest.Mock).mockResolvedValue(undefined);

        const event = {
            path: '/users/me',
            requestContext: {
                authorizer: {
                    claims: {
                        sub: 'new-user-123',
                        email: 'new@example.com',
                        name: 'New User',
                        'custom:role': 'MEMBER',
                    },
                },
            },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.id).toBe('new-user-123');
        expect(body.data.email).toBe('new@example.com');
        expect(body.data.role).toBe('MEMBER');
    });
});
