# SNS Publisher Template

Publish structured messages to an SNS topic for notification workflows.

## Usage

- Use when the stream processor (or any Lambda) needs to fan out events.
- Subscribers: email Lambda, or SQS for retries/DLQ.

## Message Shape

Publish a JSON string with:

- `eventType`: TASK_ASSIGNED | TASK_STATUS_CHANGED | TASK_DUE_SOON | TASK_OVERDUE
- `task`: task payload (id, title, status, dueDate, etc.)
- `recipients`: array of { email, name } or user IDs to resolve to emails
- `metadata`: optional (e.g. oldStatus, newStatus)

## IAM

Lambda needs `sns:Publish` on the task-events topic ARN.
