/**
 * Get Current User Handler
 *
 * GET /api/v1/users/me
 * Returns the authenticated user's profile
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, successResponse, errorResponse, TABLES, getItem } from '../../lib';
import { AppError, UnauthorizedError } from '../../lib/errors';
import { UserItem } from '../../models';
import { extractUser } from '../../middleware';

const logger = new Logger('users/me');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Get current user handler invoked', { path: event.path });

    try {
        // Get authenticated user from middleware
        const authUser = extractUser(event);

        if (!authUser) {
            return errorResponse(401, 'Unauthorized', 'Authentication required');
        }

        const userId = authUser.userId;

        // Get user from DynamoDB
        const user = await getItem<UserItem>({
            TableName: TABLES.USERS,
            Key: {
                PK: `USER#${userId}`,
                SK: 'PROFILE',
            },
        });

        if (!user) {
            // User authenticated but not in database - might be first login
            // Return basic info from Cognito claims
            const claims = event.requestContext.authorizer?.claims || {};
            return successResponse(200, {
                id: userId,
                email: claims.email || '',
                name: claims.name || claims.email?.split('@')[0] || 'User',
                role: claims['custom:role'] || 'MEMBER',
                status: 'ACTIVE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }

        logger.info('User fetched successfully', { userId });

        // Return user profile
        return successResponse(200, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } catch (error) {
        logger.error('Error fetching current user', { error });

        if (error instanceof UnauthorizedError) {
            return errorResponse(401, 'Unauthorized', error.message);
        }

        if (error instanceof AppError) {
            return errorResponse(error.statusCode, error.code, error.message);
        }

        return errorResponse(500, 'InternalServerError', 'An unexpected error occurred');
    }
};
