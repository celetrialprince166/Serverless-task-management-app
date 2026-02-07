import { handler as lambdaHandler } from '@handlers/users/get';
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

describe('Get User Handler', () => {
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

    it('should return 400 if user ID is missing', async () => {
        const event = {
            pathParameters: null,
            path: '/users/',
            requestContext: { authorizer: { claims: { sub: 'user-123' } } },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('User ID is required');
    });

    it('should return 404 if user not found', async () => {
        (getItem as jest.Mock).mockResolvedValue(undefined);

        const event = {
            pathParameters: { id: 'nonexistent-user' },
            path: '/users/nonexistent-user',
            requestContext: { authorizer: { claims: { sub: 'user-123' } } },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).message).toBe('User not found');
    });

    it('should return user successfully', async () => {
        (getItem as jest.Mock).mockResolvedValue(mockExistingUser);

        const event = {
            pathParameters: { id: 'user-123' },
            path: '/users/user-123',
            requestContext: { authorizer: { claims: { sub: 'other-user' } } },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.id).toBe('user-123');
        expect(body.data.email).toBe('test@example.com');
        expect(body.data.name).toBe('Test User');
        expect(body.data.role).toBe('MEMBER');
        expect(getItem).toHaveBeenCalledWith(expect.objectContaining({
            TableName: TABLES.USERS,
            Key: { PK: 'USER#user-123', SK: 'PROFILE' },
        }));
    });
});
