/**
 * SNS client helpers for publishing task notification events
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Logger } from './logger';

const logger = new Logger('lib/sns');
const client = new SNSClient({});

export type TaskEventType =
    | 'TASK_ASSIGNED'
    | 'TASK_STATUS_CHANGED'
    | 'TASK_DUE_SOON'
    | 'TASK_OVERDUE';

export interface NotificationRecipient {
    email: string;
    name?: string;
}

export interface TaskEventPayload {
    eventType: TaskEventType;
    task: {
        id: string;
        title: string;
        status?: string;
        dueDate?: string;
        createdByEmail?: string;
        createdByName?: string;
        [key: string]: unknown;
    };
    recipients: NotificationRecipient[];
    metadata?: {
        oldStatus?: string;
        newStatus?: string;
        assigneeName?: string;
        assignedByName?: string;
        [key: string]: unknown;
    };
}

/**
 * Publish a task notification event to the SNS topic.
 * Returns the message ID or null if SNS_TOPIC_ARN is not set.
 */
export async function publishTaskEvent(payload: TaskEventPayload): Promise<string | null> {
    const topicArn = process.env.SNS_TOPIC_ARN;
    if (!topicArn) {
        logger.warn('SNS_TOPIC_ARN not set; skipping publish');
        return null;
    }
    try {
        const result = await client.send(
            new PublishCommand({
                TopicArn: topicArn,
                Message: JSON.stringify(payload),
                Subject: payload.eventType,
            })
        );
        logger.info('Published to SNS', {
            eventType: payload.eventType,
            messageId: result.MessageId,
        });
        return result.MessageId ?? null;
    } catch (err) {
        logger.error('SNS publish failed', { err, eventType: payload.eventType });
        throw err;
    }
}
