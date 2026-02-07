/**
 * Assign Task Handler
 *
 * POST /api/v1/tasks/{id}/assignments
 * Assigns users to a task
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, successResponse, errorResponse, TABLES, getItem, putItem } from '../../lib';
import { AppError, ValidationError, BadRequestError, NotFoundError } from '../../lib/errors';
import { TaskItem, AssignmentItem, UserItem } from '../../models';
import { assignTaskSchema, validateTaskInput } from '../../validators';
import { extractUser, requireRole } from '../../middleware';

const logger = new Logger('tasks/assign');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Assign task handler invoked', { path: event.path });

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
        const { value: input, error, details } = validateTaskInput<{ userIds: string[] }>(assignTaskSchema, body);
        if (error) {
            return errorResponse(400, 'ValidationError', error, details);
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

        // Get assigner info from Cognito authorizer
        const assignerId = event.requestContext.authorizer?.claims?.sub || 'system';
        const assignerName = event.requestContext.authorizer?.claims?.name || 'System User';

        const now = new Date().toISOString();
        const createdAssignments: AssignmentItem[] = [];

        // Create assignments for each user
        for (const userId of input.userIds) {
            // Check if assignment already exists
            const existingAssignment = await getItem<AssignmentItem>({
                TableName: TABLES.TASKS,
                Key: {
                    PK: `TASK#${taskId}`,
                    SK: `ASSIGN#${userId}`,
                },
            });

            if (existingAssignment) {
                logger.info('Assignment already exists, skipping', { taskId, userId });
                createdAssignments.push(existingAssignment);
                continue;
            }

            // Fetch user for display name/email (stored on assignment for "Unknown User" fix)
            const userRecord = await getItem<UserItem>({
                TableName: TABLES.USERS,
                Key: {
                    PK: `USER#${userId}`,
                    SK: 'PROFILE',
                },
            });

            const assignmentItem: AssignmentItem = {
                PK: `TASK#${taskId}`,
                SK: `ASSIGN#${userId}`,
                GSI2PK: `USER#${userId}`,
                GSI2SK: now,
                taskId,
                userId,
                userName: userRecord?.name,
                userEmail: userRecord?.email,
                assignedAt: now,
                assignedById: assignerId,
                assignedByName: assignerName,
            };

            await putItem({
                TableName: TABLES.TASKS,
                Item: assignmentItem,
            });

            createdAssignments.push(assignmentItem);
            logger.info('User assigned to task', { taskId, userId });
        }

        // Return created assignments
        return successResponse(201, {
            taskId,
            assignments: createdAssignments.map((a) => ({
                userId: a.userId,
                assignedAt: a.assignedAt,
                assignedBy: {
                    id: a.assignedById,
                    name: a.assignedByName,
                },
            })),
            message: `${createdAssignments.length} user(s) assigned to task`,
        });
    } catch (error) {
        logger.error('Error assigning task', { error });

        if (error instanceof ValidationError) {
            return errorResponse(400, 'ValidationError', error.message, error.details);
        }

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
