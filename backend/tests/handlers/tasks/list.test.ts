
import { handler as lambdaHandler } from '@handlers/tasks/list';
import { queryItems, scanItems } from '@lib';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    queryItems: jest.fn(),
    scanItems: jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({
        setRequestId: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

describe('List Tasks Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all tasks when no filter provided', async () => {
        const mockItems = [
            { id: '1', title: 'Task 1', status: 'OPEN', priority: 'HIGH', createdAt: '2023-01-01' },
            { id: '2', title: 'Task 2', status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: '2023-01-02' },
        ];

        (scanItems as jest.Mock).mockResolvedValue(mockItems);

        const event = {
            queryStringParameters: null,
            requestContext: { authorizer: { claims: { sub: 'user-123' } } },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data).toHaveLength(2);
        expect(scanItems).toHaveBeenCalled();
    });

    it('should filter by status using query', async () => {
        const mockItems = [
            { id: '1', title: 'Task 1', status: 'OPEN', priority: 'HIGH' },
        ];

        (queryItems as jest.Mock).mockResolvedValue(mockItems);

        const event = {
            queryStringParameters: { status: 'OPEN' },
            requestContext: { authorizer: { claims: { sub: 'user-123' } } },
        } as unknown as APIGatewayProxyEvent;

        const result = await lambdaHandler(event, mockContext);

        expect(result.statusCode).toBe(200);
        expect(queryItems).toHaveBeenCalledWith(expect.objectContaining({
            IndexName: 'GSI1',
        }));
    });
});
