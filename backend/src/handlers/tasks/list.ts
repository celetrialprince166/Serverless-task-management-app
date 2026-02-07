/**
 * List Tasks Handler
 *
 * GET /api/v1/tasks
 * Lists tasks with optional filtering and pagination.
 * - Admins see all tasks
 * - Members see only assigned tasks
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, paginatedResponse, errorResponse, TABLES, queryItems, scanItems, batchGet, getItem } from '../../lib';
import { AppError } from '../../lib/errors';
import { TaskItem, TaskStatus, TaskPriority, AssignmentItem, UserItem } from '../../models';
import { extractUser } from '../../middleware';

const logger = new Logger('tasks/list');

interface ListTasksParams {
    status?: TaskStatus;
    priority?: TaskPriority;
    page: number;
    limit: number;
}

interface UserSummary {
    id: string;
    name: string;
    email: string;
}

const parseQueryParams = (event: APIGatewayProxyEvent): ListTasksParams => {
    const params = event.queryStringParameters || {};
    return {
        status: params.status as TaskStatus | undefined,
        priority: params.priority as TaskPriority | undefined,
        page: Math.max(1, parseInt(params.page || '1', 10)),
        limit: Math.min(100, Math.max(1, parseInt(params.limit || '20', 10))),
    };
};

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

const transformTaskItem = (item: TaskItem, assignees: UserSummary[] = []) => ({
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
});

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('List tasks handler invoked', {
        queryParams: event.queryStringParameters,
    });

    try {
        // Authentication check
        const user = extractUser(event);
        if (!user) {
            return errorResponse(401, 'Unauthorized', 'Authentication required');
        }

        const params = parseQueryParams(event);

        let items: TaskItem[];

        if (user.role === 'member') {
            // Member: specific tasks assigned to them
            // Query GSI2 for assignments
            const assignments = await queryItems<AssignmentItem>({
                TableName: TABLES.TASKS,
                IndexName: 'GSI2',
                KeyConditionExpression: 'GSI2PK = :userId',
                ExpressionAttributeValues: {
                    ':userId': `USER#${user.userId}`,
                },
            });

            const taskIds = assignments.map((a) => a.taskId);

            if (taskIds.length === 0) {
                items = [];
            } else {
                // Batch get tasks
                const uniqueIds = [...new Set(taskIds)];
                const keys = uniqueIds.map(id => ({
                    PK: `TASK#${id}`,
                    SK: 'METADATA'
                }));

                // Chunk keys into groups of 25
                const chunks = [];
                for (let i = 0; i < keys.length; i += 25) {
                    chunks.push(keys.slice(i, i + 25));
                }

                items = [];
                for (const chunk of chunks) {
                    const batchResult = await batchGet<TaskItem>({
                        RequestItems: {
                            [TABLES.TASKS]: {
                                Keys: chunk
                            }
                        }
                    });
                    items.push(...batchResult);
                }
            }

            // In-memory filter for members since we can't Query GSI1 easily on subset
            if (params.status) {
                items = items.filter(item => item.status === params.status);
            }

        } else {
            // Admin: See all tasks
            if (params.status) {
                // Query by status using GSI1
                items = await queryItems<TaskItem>({
                    TableName: TABLES.TASKS,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :statusKey',
                    FilterExpression: 'SK = :metadata',
                    ExpressionAttributeValues: {
                        ':statusKey': `STATUS#${params.status}`,
                        ':metadata': 'METADATA',
                    },
                    ScanIndexForward: false, // Most recent first
                });
            } else {
                // Scan all tasks (filtered for METADATA items only)
                items = await scanItems<TaskItem>({
                    TableName: TABLES.TASKS,
                    FilterExpression: 'SK = :metadata',
                    ExpressionAttributeValues: {
                        ':metadata': 'METADATA',
                    },
                });
            }
        }

        // Filter by priority if specified (in memory for both)
        if (params.priority) {
            items = items.filter((item) => item.priority === params.priority);
        }

        const total = items.length;

        // Apply pagination
        const startIndex = (params.page - 1) * params.limit;
        const paginatedItems = items.slice(startIndex, startIndex + params.limit);

        // Fetch assignees for each task and transform
        const tasks = await Promise.all(
            paginatedItems.map(async (item) => {
                const assignees = await fetchTaskAssignees(item.id);
                return transformTaskItem(item, assignees);
            })
        );

        logger.info('Tasks retrieved successfully', { count: tasks.length, total, role: user.role });

        return paginatedResponse(tasks, params.page, params.limit, total);
    } catch (error) {
        logger.error('Error listing tasks', { error });

        if (error instanceof AppError) {
            return errorResponse(error.statusCode, error.code, error.message);
        }

        return errorResponse(500, 'InternalServerError', 'An unexpected error occurred');
    }
};
