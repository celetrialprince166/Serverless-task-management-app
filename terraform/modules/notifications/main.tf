# Notifications Module
# SNS topic for task events (Phase 4). SES is configured in the AWS account (verify identity in console).

resource "aws_sns_topic" "task_events" {
  name = "${var.project_name}-${var.environment}-task-events"

  tags = var.tags
}

# Optional: dead-letter topic for failed notifications (can add SQS subscription later)
# resource "aws_sns_topic" "task_events_dlq" { ... }
