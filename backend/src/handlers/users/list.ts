/**
 * List Users Handler
 *
 * GET /api/v1/users
 * Returns a list of all users (paginated)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, successResponse, errorResponse, TABLES, scanItems } from '../../lib';
import { AppError } from '../../lib/errors';
import { UserItem } from '../../models';
import { extractUser } from '../../middleware';

const logger = new Logger('users/list');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('List users handler invoked', { path: event.path });

    try {
        // Authentication check - any authenticated user (admin or member) can list team members
        const user = extractUser(event);
        if (!user) {
            return errorResponse(401, 'Unauthorized', 'Authentication required');
        }

        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        const limit = Math.min(
            parseInt(queryParams.limit || String(DEFAULT_LIMIT), 10),
            MAX_LIMIT
        );

        // Scan for all users (in production, use GSI for better performance)
        const users = await scanItems<UserItem>({
            TableName: TABLES.USERS,
            FilterExpression: 'SK = :sk',
            ExpressionAttributeValues: {
                ':sk': 'PROFILE',
            },
            Limit: limit,
        });

        logger.info('Users listed successfully', { count: users.length });

        // Return user list
        return successResponse(200, users.map((user) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        })), {
            page: 1,
            limit: limit,
            total: users.length,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
        });
    } catch (error) {
        logger.error('Error listing users', { error });

        if (error instanceof AppError) {
            return errorResponse(error.statusCode, error.code, error.message);
        }

        return errorResponse(500, 'InternalServerError', 'An unexpected error occurred');
    }
};
