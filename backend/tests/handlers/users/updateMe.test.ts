import { handler as lambdaHandler } from '@handlers/users/updateMe';
import { TABLES, getItem, updateItem, putItem } from '@lib';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    getItem: jest.fn(),
    updateItem: jest.fn(),
    putItem: jest.fn(),
    buildUpdateExpression: jest.fn().mockReturnValue({
        UpdateExpression: 'SET #attr0 = :val0',
        ExpressionAttributeNames: { '#attr0': 'name' },
        ExpressionAttributeValues: { ':val0': 'Updated Name' },
    }),
    Logger: jest.fn().mockImplementation(() => ({
        setRequestId: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

describe('Update Current User Handler', () => {
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
            body: JSON.stringify({ name: 'New Name' }),
            path: '/users/me',
            requestContext: { authorizer: { claims: {} } },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(401);
        expect(JSON.parse(result.body).message).toBe('Authentication required');
    });

    it('should return 400 if body is missing', async () => {
        const event = {
            body: null,
            path: '/users/me',
            requestContext: {
                authorizer: { claims: { sub: 'user-123' } },
            },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Request body is required');
    });

    it('should update existing user successfully', async () => {
        (getItem as jest.Mock).mockResolvedValue(mockExistingUser);
        (updateItem as jest.Mock).mockResolvedValue({
            ...mockExistingUser,
            name: 'Updated Name',
            updatedAt: '2024-01-02T00:00:00.000Z',
        });

        const event = {
            body: JSON.stringify({ name: 'Updated Name' }),
            path: '/users/me',
            requestContext: {
                authorizer: { claims: { sub: 'user-123' } },
            },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.name).toBe('Updated Name');
        expect(updateItem).toHaveBeenCalled();
    });

    it('should create new user if not exists', async () => {
        (getItem as jest.Mock).mockResolvedValue(undefined);
        (putItem as jest.Mock).mockResolvedValue({});

        const event = {
            body: JSON.stringify({ name: 'New User Name' }),
            path: '/users/me',
            requestContext: {
                authorizer: {
                    claims: {
                        sub: 'new-user-123',
                        email: 'new@example.com',
                        'custom:role': 'MEMBER',
                    },
                },
            },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.id).toBe('new-user-123');
        expect(body.data.name).toBe('New User Name');
        expect(putItem).toHaveBeenCalledWith(expect.objectContaining({
            TableName: TABLES.USERS,
            Item: expect.objectContaining({
                PK: 'USER#new-user-123',
                SK: 'PROFILE',
            }),
        }));
    });
});
