/**
 * Update User Role Handler
 *
 * PUT /api/v1/users/{userId}
 * Updates a user's role (Admin only). Updates DynamoDB and Cognito group membership
 * so the user gets the correct permissions on next sign-in.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
    CognitoIdentityProviderClient,
    AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Logger, successResponse, errorResponse, TABLES, getItem, updateItem, buildUpdateExpression } from '../../lib';
import { AppError, NotFoundError, BadRequestError } from '../../lib/errors';
import { UserItem } from '../../models';
import { extractUser, requireRole } from '../../middleware';

const logger = new Logger('users/updateRole');

const COGNITO_GROUP_ADMIN = 'Admin';
const COGNITO_GROUP_MEMBER = 'Member';

type RoleBody = { role: 'ADMIN' | 'MEMBER' };

/**
 * Sync Cognito group membership to match the new role.
 * User pool uses email as username, so we use the user's email.
 */
async function syncCognitoGroups(userPoolId: string, email: string, newRole: 'ADMIN' | 'MEMBER'): Promise<void> {
    const client = new CognitoIdentityProviderClient({});
    const username = email;
    if (!username) {
        logger.warn('Cannot sync Cognito: user has no email', { email });
        return;
    }
    try {
        if (newRole === 'ADMIN') {
            await client.send(
                new AdminRemoveUserFromGroupCommand({
                    UserPoolId: userPoolId,
                    Username: username,
                    GroupName: COGNITO_GROUP_MEMBER,
                })
            ).catch(() => { /* ignore if not in group */ });
            await client.send(
                new AdminAddUserToGroupCommand({
                    UserPoolId: userPoolId,
                    Username: username,
                    GroupName: COGNITO_GROUP_ADMIN,
                })
            );
        } else {
            await client.send(
                new AdminRemoveUserFromGroupCommand({
                    UserPoolId: userPoolId,
                    Username: username,
                    GroupName: COGNITO_GROUP_ADMIN,
                })
            ).catch(() => { /* ignore if not in group */ });
            await client.send(
                new AdminAddUserToGroupCommand({
                    UserPoolId: userPoolId,
                    Username: username,
                    GroupName: COGNITO_GROUP_MEMBER,
                })
            );
        }
        logger.info('Cognito groups synced', { username, newRole });
    } catch (err) {
        logger.error('Failed to sync Cognito groups', { err, username, newRole });
        throw err;
    }
}

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Update user role handler invoked', { path: event.path });

    try {
        const user = extractUser(event);
        if (!user) {
            return errorResponse(401, 'Unauthorized', 'Authentication required');
        }

        const roleError = requireRole(user, ['admin']);
        if (roleError) {
            logger.warn('Access denied - admin only', { userId: user.userId, role: user.role });
            return roleError;
        }

        const userId = event.pathParameters?.userId;
        if (!userId) {
            return errorResponse(400, 'BadRequest', 'User ID is required');
        }

        if (!event.body) {
            return errorResponse(400, 'BadRequest', 'Request body is required');
        }

        let body: unknown;
        try {
            body = JSON.parse(event.body);
        } catch {
            return errorResponse(400, 'BadRequest', 'Invalid JSON in request body');
        }

        const { role } = body as RoleBody;
        if (!role || (role !== 'ADMIN' && role !== 'MEMBER')) {
            return errorResponse(400, 'BadRequest', 'Body must contain role: "ADMIN" or "MEMBER"');
        }

        const existingUser = await getItem<UserItem>({
            TableName: TABLES.USERS,
            Key: {
                PK: `USER#${userId}`,
                SK: 'PROFILE',
            },
        });

        if (!existingUser) {
            return errorResponse(404, 'NotFound', 'User not found');
        }

        const now = new Date().toISOString();
        const updates: Record<string, unknown> = {
            role,
            updatedAt: now,
        };

        const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
            buildUpdateExpression(updates);

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

        logger.info('User role updated in DynamoDB', { userId, role });

        const userPoolId = process.env.USER_POOL_ID;
        if (userPoolId && existingUser.email) {
            await syncCognitoGroups(userPoolId, existingUser.email, role);
        } else if (!userPoolId) {
            logger.warn('USER_POOL_ID not set; Cognito groups not synced');
        }

        return successResponse(200, {
            id: updatedUser?.id ?? existingUser.id,
            email: updatedUser?.email ?? existingUser.email,
            name: updatedUser?.name ?? existingUser.name,
            role: updatedUser?.role ?? role,
            status: updatedUser?.status ?? existingUser.status,
            createdAt: existingUser.createdAt,
            updatedAt: updatedUser?.updatedAt ?? now,
        });
    } catch (error) {
        logger.error('Error updating user role', { error });

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
