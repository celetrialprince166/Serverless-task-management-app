output "task_events_topic_arn" {
  description = "ARN of the SNS topic for task notification events"
  value       = aws_sns_topic.task_events.arn
}

output "task_events_topic_name" {
  description = "Name of the SNS topic"
  value       = aws_sns_topic.task_events.name
}
