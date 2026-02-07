# DynamoDB Module
# Creates DynamoDB table with optional GSIs, point-in-time recovery, and encryption

resource "aws_dynamodb_table" "this" {
  name         = "${var.project_name}-${var.environment}-${var.table_name}"
  billing_mode = var.billing_mode

  # Provisioned capacity (only if not on-demand)
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  # Primary key (deprecation warning is informational - syntax still valid in AWS provider v6)
  hash_key  = var.hash_key
  range_key = var.range_key

  # Key attributes
  dynamic "attribute" {
    for_each = var.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  # Global Secondary Indexes
  dynamic "global_secondary_index" {
    for_each = var.global_secondary_indexes
    content {
      name               = global_secondary_index.value.name
      hash_key           = global_secondary_index.value.hash_key
      range_key          = try(global_secondary_index.value.range_key, null)
      projection_type    = global_secondary_index.value.projection_type
      non_key_attributes = try(global_secondary_index.value.non_key_attributes, null)

      # For provisioned mode
      read_capacity  = var.billing_mode == "PROVISIONED" ? try(global_secondary_index.value.read_capacity, var.read_capacity) : null
      write_capacity = var.billing_mode == "PROVISIONED" ? try(global_secondary_index.value.write_capacity, var.write_capacity) : null
    }
  }

  # Local Secondary Indexes
  dynamic "local_secondary_index" {
    for_each = var.local_secondary_indexes
    content {
      name               = local_secondary_index.value.name
      range_key          = local_secondary_index.value.range_key
      projection_type    = local_secondary_index.value.projection_type
      non_key_attributes = try(local_secondary_index.value.non_key_attributes, null)
    }
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  # TTL
  dynamic "ttl" {
    for_each = var.ttl_attribute != null ? [1] : []
    content {
      attribute_name = var.ttl_attribute
      enabled        = true
    }
  }

  # DynamoDB Streams
  stream_enabled   = var.stream_enabled
  stream_view_type = var.stream_enabled ? var.stream_view_type : null

  tags = local.common_tags
}

locals {
  common_tags = merge(var.tags, {
    Module      = "dynamodb"
    Table       = var.table_name
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  })
}
