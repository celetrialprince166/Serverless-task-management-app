/**
 * DynamoDB Stream Processor
 *
 * Triggered by the Tasks table stream. Detects task assignments and status changes,
 * then publishes events to SNS for the email Lambda to send notifications.
 */

import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Logger, TABLES, getItem, queryItems } from '../../lib';
import { publishTaskEvent } from '../../lib/sns';
import type { TaskItem, AssignmentItem } from '../../models';

const logger = new Logger('notifications/streamProcessor');

const SK_METADATA = 'METADATA';
const SK_ASSIGN_PREFIX = 'ASSIGN#';

function getSk(image: Record<string, unknown>): string | undefined {
    const sk = image?.SK;
    return typeof sk === 'string' ? sk : undefined;
}

function isTaskMetadata(sk: string): boolean {
    return sk === SK_METADATA;
}

function isAssignment(sk: string): boolean {
    return sk.startsWith(SK_ASSIGN_PREFIX);
}

export const handler = async (
    event: DynamoDBStreamEvent,
    context: Context
): Promise<void> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Stream event received', { recordCount: event.Records?.length ?? 0 });

    for (const record of event.Records ?? []) {
        try {
            const eventName = record.eventName;
            const newImage = record.dynamodb?.NewImage
                ? (unmarshall(record.dynamodb.NewImage as Record<string, unknown>) as Record<string, unknown>)
                : null;
            const oldImage = record.dynamodb?.OldImage
                ? (unmarshall(record.dynamodb.OldImage as Record<string, unknown>) as Record<string, unknown>)
                : null;

            const newSk = newImage ? getSk(newImage) : null;
            const oldSk = oldImage ? getSk(oldImage) : null;

            // New assignment → TASK_ASSIGNED
            if (eventName === 'INSERT' && newSk && isAssignment(newSk)) {
                const assign = newImage as unknown as AssignmentItem;
                const taskId = assign.taskId ?? (assign.PK as string)?.replace('TASK#', '');
                if (!taskId || !assign.userEmail) {
                    logger.debug('Skip assignment record without taskId or userEmail', { pk: assign.PK, sk: assign.SK });
                    continue;
                }
                const task = await getItem<TaskItem>({
                    TableName: TABLES.TASKS,
                    Key: { PK: `TASK#${taskId}`, SK: 'METADATA' },
                });
                if (!task) {
                    logger.warn('Task not found for assignment notification', { taskId });
                    continue;
                }
                await publishTaskEvent({
                    eventType: 'TASK_ASSIGNED',
                    task: {
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        dueDate: task.dueDate,
                        createdByEmail: task.createdByEmail,
                        createdByName: task.createdByName,
                    },
                    recipients: [{ email: assign.userEmail, name: assign.userName }],
                    metadata: {
                        assignedByName: assign.assignedByName,
                        assigneeName: assign.userName,
                    },
                });
                continue;
            }

            // Status change on task metadata → TASK_STATUS_CHANGED
            if (eventName === 'MODIFY' && newSk && oldSk && isTaskMetadata(newSk) && isTaskMetadata(oldSk)) {
                const oldTask = oldImage as unknown as TaskItem;
                const newTask = newImage as unknown as TaskItem;
                if (oldTask.status === newTask.status) continue;

                const assignments = await queryItems<AssignmentItem>({
                    TableName: TABLES.TASKS,
                    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                    ExpressionAttributeValues: {
                        ':pk': `TASK#${newTask.id}`,
                        ':sk': SK_ASSIGN_PREFIX,
                    },
                });
                const recipients = assignments
                    .filter((a) => a.userEmail)
                    .map((a) => ({ email: a.userEmail!, name: a.userName }));

                if (recipients.length === 0) {
                    logger.debug('No assignees for status change notification', { taskId: newTask.id });
                    continue;
                }
                await publishTaskEvent({
                    eventType: 'TASK_STATUS_CHANGED',
                    task: {
                        id: newTask.id,
                        title: newTask.title,
                        status: newTask.status,
                        dueDate: newTask.dueDate,
                        createdByEmail: newTask.createdByEmail,
                        createdByName: newTask.createdByName,
                    },
                    recipients,
                    metadata: { oldStatus: oldTask.status, newStatus: newTask.status },
                });
            }
        } catch (err) {
            logger.error('Failed to process stream record', { err, eventID: record.eventID });
            throw err;
        }
    }
};
