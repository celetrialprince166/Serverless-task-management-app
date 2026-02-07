/**
 * Get Task Handler
 *
 * GET /api/v1/tasks/{taskId}
 * Returns a single task by ID.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, successResponse, errorResponse, TABLES, getItem, queryItems } from '../../lib';
import { AppError, NotFoundError } from '../../lib/errors';
import { TaskItem, AssignmentItem, UserItem } from '../../models';
import { extractUser } from '../../middleware';

const logger = new Logger('tasks/get');

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
        // Query all assignment records for this task
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

        // Fetch user details for each assignee
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
                // If user lookup fails, use assignment data
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

    // Authentication check
    const user = extractUser(event);
    if (!user) {
        return errorResponse(401, 'Unauthorized', 'Authentication required');
    }

    const taskId = event.pathParameters?.taskId;

    if (!taskId) {
        return errorResponse(400, 'BadRequest', 'Task ID is required');
    }

    logger.info('Get task handler invoked', { taskId, userId: user.userId });

    try {
        // Get task from DynamoDB
        const item = await getItem<TaskItem>({
            TableName: TABLES.TASKS,
            Key: {
                PK: `TASK#${taskId}`,
                SK: 'METADATA',
            },
        });

        if (!item) {
            return errorResponse(404, 'NotFound', 'Task not found');
        }

        // For members, check if user is assigned to this task
        if (user.role === 'member') {
            const assignment = await getItem<AssignmentItem>({
                TableName: TABLES.TASKS,
                Key: {
                    PK: `TASK#${taskId}`,
                    SK: `ASSIGN#${user.userId}`,
                },
            });

            if (!assignment) {
                return errorResponse(403, 'Forbidden', 'You are not assigned to this task');
            }
        }

        // Fetch assignees
        const assignees = await fetchTaskAssignees(taskId);

        // Transform and return
        const task = {
            id: item.id,
            title: item.title,
            description: item.description,
            status: item.status,
            priority: item.priority,
            createdBy: {
                id: item.createdById,
                name: item.createdByName,
                email: item.createdByEmail,
            },
            assignedTo: assignees,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            dueDate: item.dueDate,
            completedAt: item.completedAt,
        };

        logger.info('Task retrieved successfully', { taskId });

        return successResponse(200, task);
    } catch (error) {
        logger.error('Error getting task', { taskId, error });

        if (error instanceof NotFoundError) {
            return errorResponse(404, 'NotFound', error.message);
        }

        if (error instanceof AppError) {
            return errorResponse(error.statusCode, error.code, error.message);
        }

        return errorResponse(500, 'InternalServerError', 'An unexpected error occurred');
    }
};
