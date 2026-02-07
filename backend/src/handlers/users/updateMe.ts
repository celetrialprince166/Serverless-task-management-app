/**
 * Update Current User Handler
 *
 * PUT /api/v1/users/me
 * Updates the authenticated user's profile
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, successResponse, errorResponse, TABLES, getItem, updateItem, putItem, buildUpdateExpression } from '../../lib';
import { AppError, ValidationError, UnauthorizedError } from '../../lib/errors';
import { UserItem, UpdateUserInput } from '../../models';
import { updateUserSchema, validateUserInput } from '../../validators';
import { extractUser } from '../../middleware';

const logger = new Logger('users/updateMe');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Update current user handler invoked', { path: event.path });

    try {
        // Get authenticated user from middleware
        const authUser = extractUser(event);

        if (!authUser) {
            return errorResponse(401, 'Unauthorized', 'Authentication required');
        }

        const userId = authUser.userId;

        // Parse request body
        if (!event.body) {
            return errorResponse(400, 'BadRequest', 'Request body is required');
        }

        let body: unknown;
        try {
            body = JSON.parse(event.body);
        } catch {
            return errorResponse(400, 'BadRequest', 'Invalid JSON in request body');
        }

        // Validate input
        const { value: input, error, details } = validateUserInput<UpdateUserInput>(updateUserSchema, body);
        if (error) {
            return errorResponse(400, 'ValidationError', error, details);
        }

        const now = new Date().toISOString();

        // Check if user exists in database
        const existingUser = await getItem<UserItem>({
            TableName: TABLES.USERS,
            Key: {
                PK: `USER#${userId}`,
                SK: 'PROFILE',
            },
        });

        if (!existingUser) {
            // User doesn't exist - create new profile from Cognito claims
            const claims = event.requestContext.authorizer?.claims || {};
            const newUser: UserItem = {
                PK: `USER#${userId}`,
                SK: 'PROFILE',
                GSI1PK: `EMAIL#${claims.email || ''}`,
                id: userId,
                email: claims.email || '',
                name: input.name || claims.name || claims.email?.split('@')[0] || 'User',
                role: (claims['custom:role'] as 'ADMIN' | 'MEMBER') || 'MEMBER',
                status: 'ACTIVE',
                createdAt: now,
                updatedAt: now,
            };

            await putItem({
                TableName: TABLES.USERS,
                Item: newUser,
            });

            logger.info('User profile created', { userId });

            return successResponse(200, {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                status: newUser.status,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            });
        }

        // Build update expression
        const updates: Record<string, unknown> = {
            updatedAt: now,
        };

        if (input.name) {
            updates.name = input.name;
        }

        const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
            buildUpdateExpression(updates);

        // Update user in DynamoDB
        const updatedUser = await updateItem<UserItem>({
            TableName: TABLES.USERS,
            Key: {
                PK: `USER#${userId}`,
                SK: 'PROFILE',
            },
            UpdateExpression,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        });

        logger.info('User profile updated', { userId });

        // Return updated user
        return successResponse(200, {
            id: updatedUser?.id || existingUser.id,
            email: updatedUser?.email || existingUser.email,
            name: updatedUser?.name || existingUser.name,
            role: updatedUser?.role || existingUser.role,
            status: updatedUser?.status || existingUser.status,
            createdAt: existingUser.createdAt,
            updatedAt: updatedUser?.updatedAt || now,
        });
    } catch (error) {
        logger.error('Error updating current user', { error });

        if (error instanceof ValidationError) {
            return errorResponse(400, 'ValidationError', error.message, error.details);
        }

        if (error instanceof UnauthorizedError) {
            return errorResponse(401, 'Unauthorized', error.message);
        }

        if (error instanceof AppError) {
            return errorResponse(error.statusCode, error.code, error.message);
        }

        return errorResponse(500, 'InternalServerError', 'An unexpected error occurred');
    }
};
