/**
 * SNS Publish Template
 *
 * Set env SNS_TOPIC_ARN. Publish JSON message for email Lambda to consume.
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Logger } from '../../lib/logger';

const logger = new Logger('notifications/eventPublisher');
const sns = new SNSClient({});

export interface NotificationPayload {
  eventType: 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'TASK_DUE_SOON' | 'TASK_OVERDUE';
  task: {
    id: string;
    title: string;
    status?: string;
    dueDate?: string;
    [key: string]: unknown;
  };
  recipients: Array<{ email: string; name?: string }>;
  metadata?: Record<string, unknown>;
}

export async function publishTaskEvent(payload: NotificationPayload): Promise<string | null> {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (!topicArn) {
    logger.warn('SNS_TOPIC_ARN not set; skipping publish');
    return null;
  }
  const result = await sns.send(
    new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(payload),
      Subject: payload.eventType,
    })
  );
  logger.info('Published to SNS', { eventType: payload.eventType, messageId: result.MessageId });
  return result.MessageId ?? null;
}
