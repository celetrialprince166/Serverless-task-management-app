/**
 * Delete Task Handler
 *
 * DELETE /api/v1/tasks/{id}
 * Deletes a task (Admin only)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, successResponse, errorResponse, TABLES, getItem, deleteItem, queryItems } from '../../lib';
import { AppError, BadRequestError, NotFoundError, ForbiddenError } from '../../lib/errors';
import { TaskItem } from '../../models';
import { extractUser, requireRole } from '../../middleware';

const logger = new Logger('tasks/delete');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Delete task handler invoked', { path: event.path });

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

        // Get task ID from path parameters
        const taskId = event.pathParameters?.taskId;
        if (!taskId) {
            return errorResponse(400, 'BadRequest', 'Task ID is required');
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

        // Delete all assignment items for this task first
        const assignments = await queryItems<{ PK: string; SK: string }>({
            TableName: TABLES.TASKS,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `TASK#${taskId}`,
                ':sk': 'ASSIGN#',
            },
        });

        // Delete assignment items
        for (const assignment of assignments) {
            await deleteItem({
                TableName: TABLES.TASKS,
                Key: {
                    PK: assignment.PK,
                    SK: assignment.SK,
                },
            });
        }

        // Delete the task metadata item
        await deleteItem({
            TableName: TABLES.TASKS,
            Key: {
                PK: `TASK#${taskId}`,
                SK: 'METADATA',
            },
        });

        logger.info('Task deleted successfully', { taskId, assignmentsDeleted: assignments.length });

        // Return success with no content
        return successResponse(200, {
            message: 'Task deleted successfully',
            id: taskId,
        });
    } catch (error) {
        logger.error('Error deleting task', { error });

        if (error instanceof NotFoundError) {
            return errorResponse(404, 'NotFound', error.message);
        }

        if (error instanceof ForbiddenError) {
            return errorResponse(403, 'Forbidden', error.message);
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
