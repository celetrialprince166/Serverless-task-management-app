/**
 * DynamoDB Stream Event Handler Template
 *
 * Replace <STREAM_NAME> with e.g. task-events.
 * Unmarshall stream record images and publish to SNS or invoke downstream Lambdas.
 */

import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Logger } from '../../lib/logger';

const logger = new Logger('notifications/streamProcessor');

export const handler = async (
  event: DynamoDBStreamEvent,
  context: Context
): Promise<void> => {
  logger.setRequestId(context.awsRequestId);
  logger.info('Stream event received', { recordCount: event.Records?.length ?? 0 });

  for (const record of event.Records ?? []) {
    try {
      const eventName = record.eventName; // INSERT | MODIFY | REMOVE
      const newImage = record.dynamodb?.NewImage
        ? unmarshall(record.dynamodb.NewImage as Record<string, unknown>)
        : null;
      const oldImage = record.dynamodb?.OldImage
        ? unmarshall(record.dynamodb.OldImage as Record<string, unknown>)
        : null;

      // Filter: e.g. only task metadata (SK === 'METADATA') or assignment items
      // const sk = newImage?.SK ?? oldImage?.SK;
      // if (sk !== 'METADATA') continue;

      // Determine notification type and build payload
      // const payload = { eventType: 'TASK_STATUS_CHANGED', task: newImage, ... };

      // Publish to SNS or call email Lambda
      // await publishToSns(payload);
    } catch (err) {
      logger.error('Failed to process stream record', { err, eventID: record.eventID });
      throw err; // or push to DLQ
    }
  }
};
