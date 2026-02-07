import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '@handlers/health';

describe('Health Check Handler', () => {
    const mockContext = {} as Context;
    const mockEvent = {} as APIGatewayProxyEvent;

    it('should return 200 OK', async () => {
        const result = await handler(mockEvent, mockContext);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            data: {
                status: 'healthy',
                timestamp: expect.any(String),
                version: '1.0.0',
            }
        });
    });
});
