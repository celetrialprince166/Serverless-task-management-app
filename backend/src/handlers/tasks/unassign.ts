/**
 * Unassign Task Handler
 *
 * DELETE /api/v1/tasks/{id}/assignments/{userId}
 * Removes a user from a task
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, successResponse, errorResponse, TABLES, getItem, deleteItem } from '../../lib';
import { AppError, BadRequestError, NotFoundError } from '../../lib/errors';
import { TaskItem, AssignmentItem } from '../../models';
import { extractUser, requireRole } from '../../middleware';

const logger = new Logger('tasks/unassign');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Unassign task handler invoked', { path: event.path });

    try {
        // Authentication check
        const user = extractUser(event);
        if (!user) {
            return errorResponse(401, 'Unauthorized', 'Authentication required');
        }

        // Authorization check - Admin only
        const roleError = requireRole(user, ['admin']);
        if (roleError) {
            logger.warn('Access denied - insufficient permissions', { userId: user.userId, role: user.role });
            return roleError;
        }

        // Get task ID and user ID from path parameters
        const taskId = event.pathParameters?.taskId;
        const targetUserId = event.pathParameters?.userId;

        if (!taskId) {
            return errorResponse(400, 'BadRequest', 'Task ID is required');
        }

        if (!targetUserId) {
            return errorResponse(400, 'BadRequest', 'User ID is required');
        }

        // Check if task exists
        const existingTask = await getItem<TaskItem>({
            TableName: TABLES.TASKS,
            Key: {
                PK: `TASK#${taskId}`,
                SK: 'METADATA',
            },
        });

        if (!existingTask) {
            return errorResponse(404, 'NotFound', 'Task not found');
        }

        // Check if assignment exists
        const existingAssignment = await getItem<AssignmentItem>({
            TableName: TABLES.TASKS,
            Key: {
                PK: `TASK#${taskId}`,
                SK: `ASSIGN#${targetUserId}`,
            },
        });

        if (!existingAssignment) {
            return errorResponse(404, 'NotFound', 'User is not assigned to this task');
        }

        // Delete the assignment
        await deleteItem({
            TableName: TABLES.TASKS,
            Key: {
                PK: `TASK#${taskId}`,
                SK: `ASSIGN#${targetUserId}`,
            },
        });

        logger.info('User unassigned from task', { taskId, userId: targetUserId });

        // Return success
        return successResponse(200, {
            message: 'User unassigned from task successfully',
            taskId,
            userId: targetUserId,
        });
    } catch (error) {
        logger.error('Error unassigning task', { error });

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
