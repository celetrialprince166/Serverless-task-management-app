# ------------------------------------------------------------------------------
# SES Email Identity for notifications (Phase 4)
# ------------------------------------------------------------------------------
# Optional: Terraform can create the SES email identity and AWS sends the
# verification email. Set ses_create_sender_identity = true and ses_from_email
# to your email, then apply and click the link in your inbox.
#
# If you already created the identity in the console (e.g. princeayiku5@gmail.com),
# leave ses_create_sender_identity = false and only set ses_from_email so the
# Lambda uses that address. No need to create the identity again.
# ------------------------------------------------------------------------------

resource "aws_ses_email_identity" "notifications_sender" {
  count  = var.ses_create_sender_identity ? 1 : 0
  email  = var.ses_from_email
}
