import { APIGatewayProxyEvent } from 'aws-lambda';

export const createMockAuthEvent = (
    body: any = null,
    pathParameters: Record<string, string> | null = null,
    role: 'admin' | 'member' = 'member',
    userId: string = 'test-user-id',
    queryParams: Record<string, string> | null = null
): APIGatewayProxyEvent => {
    return {
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
        pathParameters: pathParameters || null,
        queryStringParameters: queryParams || null,
        requestContext: {
            authorizer: {
                claims: {
                    sub: userId,
                    email: `${userId}@example.com`,
                    name: `Test User ${userId}`,
                    'custom:role': role,
                    'cognito:groups': role === 'admin' ? ['Admin'] : ['Member'],
                },
            },
        },
        path: '/test/path',
        httpMethod: 'GET',
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        stageVariables: null,
        resource: '',
    } as unknown as APIGatewayProxyEvent;
};

export const createMockUnauthEvent = (
    body: any = null,
    pathParameters: Record<string, string> | null = null
): APIGatewayProxyEvent => {
    return {
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
        pathParameters: pathParameters || null,
        requestContext: {},
        path: '/test/path',
        httpMethod: 'GET',
    } as unknown as APIGatewayProxyEvent;
};
