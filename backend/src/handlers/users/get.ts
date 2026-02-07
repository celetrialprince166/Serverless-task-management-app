/**
 * Get User Handler
 *
 * GET /api/v1/users/{id}
 * Returns a specific user's public profile
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, successResponse, errorResponse, TABLES, getItem } from '../../lib';
import { AppError, NotFoundError, BadRequestError } from '../../lib/errors';
import { UserItem } from '../../models';
import { extractUser } from '../../middleware';

const logger = new Logger('users/get');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Get user handler invoked', { path: event.path });

    try {
        // Authentication check
        const user = extractUser(event);
        if (!user) {
            return errorResponse(401, 'Unauthorized', 'Authentication required');
        }

        // Get user ID from path parameters
        const userId = event.pathParameters?.userId;
        if (!userId) {
            return errorResponse(400, 'BadRequest', 'User ID is required');
        }

        // Get user from DynamoDB
        const fetchedUser = await getItem<UserItem>({
            TableName: TABLES.USERS,
            Key: {
                PK: `USER#${userId}`,
                SK: 'PROFILE',
            },
        });

        if (!fetchedUser) {
            return errorResponse(404, 'NotFound', 'User not found');
        }

        logger.info('User fetched successfully', { userId });

        // Return user profile (public fields only)
        return successResponse(200, {
            id: fetchedUser.id,
            email: fetchedUser.email,
            name: fetchedUser.name,
            role: fetchedUser.role,
            status: fetchedUser.status,
            createdAt: fetchedUser.createdAt,
            updatedAt: fetchedUser.updatedAt,
        });
    } catch (error) {
        logger.error('Error fetching user', { error });

        if (error instanceof NotFoundError) {
            return errorResponse(404, 'NotFound', error.message);
        }

        if (error instanceof BadRequestError) {
            return errorResponse(400, 'BadRequest', error.message);
        }

        if (error instanceof AppError) {
            return errorResponse(error.statusCode, error.code, error.message);
        }

        return errorResponse(500, 'InternalServerError', 'An unexpected error occurred');
    }
};
