/**
 * Create Task Handler
 *
 * POST /api/v1/tasks
 * Creates a new task (Admin only)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { Logger, successResponse, errorResponse, TABLES, putItem, getItem } from '../../lib';
import { AppError, ValidationError, BadRequestError } from '../../lib/errors';
import { TaskItem, TaskStatus, AssignmentItem, UserItem } from '../../models';
import { createTaskSchema, validateTaskInput } from '../../validators';
import { extractUser, requireRole } from '../../middleware';

const logger = new Logger('tasks/create');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Create task handler invoked', { path: event.path });

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
        const { value: input, error, details } = validateTaskInput(createTaskSchema, body);
        if (error) {
            return errorResponse(400, 'ValidationError', error, details);
        }

        // Get user info from authenticated user
        const userId = user.userId;
        const userName = user.name;
        const userEmail = user.email;

        // Generate task ID and timestamps
        const taskId = uuidv4();
        const now = new Date().toISOString();

        // Create task item
        const taskItem: TaskItem = {
            PK: `TASK#${taskId}`,
            SK: 'METADATA',
            GSI1PK: `STATUS#OPEN`,
            GSI1SK: now,
            GSI2PK: `PRIORITY#${input.priority || 'MEDIUM'}`,
            GSI2SK: input.dueDate || now,
            id: taskId,
            title: input.title,
            description: input.description,
            status: 'OPEN' as TaskStatus,
            priority: input.priority || 'MEDIUM',
            createdById: userId,
            createdByName: userName,
            createdByEmail: userEmail,
            createdAt: now,
            updatedAt: now,
            dueDate: input.dueDate,
        };

        // Save task to DynamoDB
        await putItem({
            TableName: TABLES.TASKS,
            Item: taskItem,
        });

        logger.info('Task created successfully', { taskId });

        // Handle assignments if provided
        const createdAssignments: { id: string; name: string; email: string }[] = [];
        
        if (input.assignedTo && input.assignedTo.length > 0) {
            logger.info('Processing assignments', { assignedTo: input.assignedTo });
            
            for (const assigneeId of input.assignedTo) {
                try {
                    // Check if user exists in the users table
                    const userRecord = await getItem<UserItem>({
                        TableName: TABLES.USERS,
                        Key: {
                            PK: `USER#${assigneeId}`,
                            SK: 'PROFILE',
                        },
                    });

                    // Create assignment item (store assignee name/email for display when user not in Users table yet)
                    const assignmentItem: AssignmentItem = {
                        PK: `TASK#${taskId}`,
                        SK: `ASSIGN#${assigneeId}`,
                        GSI2PK: `USER#${assigneeId}`,
                        GSI2SK: now,
                        taskId,
                        userId: assigneeId,
                        userName: userRecord?.name,
                        userEmail: userRecord?.email,
                        assignedAt: now,
                        assignedById: userId,
                        assignedByName: userName,
                    };

                    await putItem({
                        TableName: TABLES.TASKS,
                        Item: assignmentItem,
                    });

                    // Add to response with user info if available
                    createdAssignments.push({
                        id: assigneeId,
                        name: userRecord?.name || 'Unknown User',
                        email: userRecord?.email || '',
                    });

                    logger.info('User assigned to task', { taskId, assigneeId });
                } catch (assignError) {
                    logger.warn('Failed to create assignment', { taskId, assigneeId, error: assignError });
                    // Continue with other assignments even if one fails
                }
            }
        }

        // Return created task
        return successResponse(201, {
            id: taskId,
            title: taskItem.title,
            description: taskItem.description,
            status: taskItem.status,
            priority: taskItem.priority,
            createdBy: {
                id: taskItem.createdById,
                name: taskItem.createdByName,
                email: taskItem.createdByEmail,
            },
            assignedTo: createdAssignments,
            createdAt: taskItem.createdAt,
            updatedAt: taskItem.updatedAt,
            dueDate: taskItem.dueDate,
        });
    } catch (error) {
        logger.error('Error creating task', { error });

        if (error instanceof ValidationError) {
            return errorResponse(400, 'ValidationError', error.message, error.details);
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
