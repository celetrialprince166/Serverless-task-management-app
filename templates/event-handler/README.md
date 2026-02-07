# Event Handler Template (DynamoDB Stream)

Template for Lambda handlers that process DynamoDB Stream events.

## When to Use

- Stream processor for Tasks table (INSERT/MODIFY)
- Parse `event.Records`, filter by `eventName` and item keys (PK/SK)
- Publish to SNS or invoke email Lambda

## Record Shape

- `event.Records[].eventName`: INSERT | MODIFY | REMOVE
- `event.Records[].dynamodb.NewImage` / `OldImage`: DynamoDB format (AttributeValue map)
- Unmarshall to get JS object (e.g. PK, SK, status, assignedTo)

## Pattern

1. Loop over `event.Records`
2. Skip non-relevant items (e.g. SK != METADATA for task metadata)
3. Determine event type (TASK_ASSIGNED, TASK_STATUS_CHANGED, etc.)
4. Publish message to SNS with payload for email Lambda
