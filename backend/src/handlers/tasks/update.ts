/**
 * Update Task Handler
 *
 * PUT /api/v1/tasks/{id}
 * Updates an existing task
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, successResponse, errorResponse, TABLES, getItem, updateItem, buildUpdateExpression, queryItems } from '../../lib';
import { AppError, ValidationError, BadRequestError, NotFoundError } from '../../lib/errors';
import { TaskItem, UpdateTaskInput, AssignmentItem, UserItem } from '../../models';
import { updateTaskSchema, validateTaskInput } from '../../validators';
import { extractUser } from '../../middleware';

const logger = new Logger('tasks/update');

interface UserSummary {
    id: string;
    name: string;
    email: string;
}

/**
 * Fetch assignees for a task
 */
const fetchTaskAssignees = async (taskId: string): Promise<UserSummary[]> => {
    try {
        const assignments = await queryItems<AssignmentItem>({
            TableName: TABLES.TASKS,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            ExpressionAttributeValues: {
                ':pk': `TASK#${taskId}`,
                ':skPrefix': 'ASSIGN#',
            },
        });

        if (assignments.length === 0) {
            return [];
        }

        const assignees: UserSummary[] = [];
        for (const assignment of assignments) {
            try {
                const user = await getItem<UserItem>({
                    TableName: TABLES.USERS,
                    Key: {
                        PK: `USER#${assignment.userId}`,
                        SK: 'PROFILE',
                    },
                });

                assignees.push({
                    id: assignment.userId,
                    name: user?.name || assignment.userName || 'Unknown User',
                    email: user?.email || assignment.userEmail || '',
                });
            } catch {
                assignees.push({
                    id: assignment.userId,
                    name: assignment.userName || 'Unknown User',
                    email: assignment.userEmail || '',
                });
            }
        }

        return assignees;
    } catch (error) {
        logger.warn('Failed to fetch assignees for task', { taskId, error });
        return [];
    }
};

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Update task handler invoked', { path: event.path });

    try {
        // Authentication check
        const user = extractUser(event);
        if (!user) {
            return errorResponse(401, 'Unauthorized', 'Authentication required');
        }

        // Authorization check
        if (user.role !== 'admin') {
            // Member check
            if (user.role !== 'member') {
                return errorResponse(403, 'Forbidden', 'Insufficient permissions');
            }
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
        const { value: input, error, details } = validateTaskInput<UpdateTaskInput>(updateTaskSchema, body);
        if (error) {
            return errorResponse(400, 'ValidationError', error, details);
        }

        // Granular Permission Check for Members
        if (user.role === 'member') {
            // 1. Can only update status
            const allowedKeys = ['status'];
            const inputKeys = Object.keys(input);
            const invalidKeys = inputKeys.filter(k => !allowedKeys.includes(k));

            if (invalidKeys.length > 0) {
                return errorResponse(403, 'Forbidden', 'Members can only update task status');
            }

            // 2. Must be assigned
            const assignment = await getItem({
                TableName: TABLES.TASKS,
                Key: {
                    PK: `TASK#${taskId}`,
                    SK: `ASSIGN#${user.userId}`
                }
            });

            if (!assignment) {
                logger.warn('Access denied - member not assigned', { userId: user.userId, taskId });
                return errorResponse(403, 'Forbidden', 'You are not assigned to this task');
            }
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

        // Build update object
        const now = new Date().toISOString();
        const updates: Record<string, unknown> = {
            updatedAt: now,
        };

        if (input.title !== undefined) {
            updates.title = input.title;
        }
        if (input.description !== undefined) {
            updates.description = input.description;
        }
        if (input.priority !== undefined) {
            updates.priority = input.priority;
            updates.GSI2PK = `PRIORITY#${input.priority}`;
        }
        if (input.status !== undefined) {
            updates.status = input.status;
            updates.GSI1PK = `STATUS#${input.status}`;
        }
        if (input.dueDate !== undefined) {
            updates.dueDate = input.dueDate;
            updates.GSI2SK = input.dueDate || now;
        }

        // Build update expression
        const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
            buildUpdateExpression(updates);

        // Update task in DynamoDB
        const updatedTask = await updateItem<TaskItem>({
            TableName: TABLES.TASKS,
            Key: {
                PK: `TASK#${taskId}`,
                SK: 'METADATA',
            },
            UpdateExpression,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        });

        logger.info('Task updated successfully', { taskId });

        // Fetch assignees
        const assignees = await fetchTaskAssignees(taskId);

        // Return updated task
        return successResponse(200, {
            id: taskId,
            title: updatedTask?.title || existingTask.title,
            description: updatedTask?.description || existingTask.description,
            status: updatedTask?.status || existingTask.status,
            priority: updatedTask?.priority || existingTask.priority,
            createdBy: {
                id: existingTask.createdById,
                name: existingTask.createdByName,
                email: existingTask.createdByEmail,
            },
            assignedTo: assignees,
            createdAt: existingTask.createdAt,
            updatedAt: updatedTask?.updatedAt || now,
            dueDate: updatedTask?.dueDate || existingTask.dueDate,
        });
    } catch (error) {
        logger.error('Error updating task', { error });

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
