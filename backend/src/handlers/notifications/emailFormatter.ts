/**
 * Email Formatter Lambda
 *
 * Triggered by SNS (task events). Parses the message, builds branded HTML,
 * and sends via SES to recipients.
 */

import { SNSEvent, Context } from 'aws-lambda';
import { Logger } from '../../lib';
import { sendEmail, wrapEmailHtml } from '../../lib/ses';
import type { TaskEventPayload } from '../../lib/sns';

const logger = new Logger('notifications/emailFormatter');

function buildTaskAssignedBody(payload: TaskEventPayload): string {
    const t = payload.task;
    const meta = payload.metadata ?? {};
    const assigner = (meta.assignedByName as string) || t.createdByName || 'A team member';
    return `
      <p>You have been assigned to a task.</p>
      <p><strong>Task:</strong> ${escapeHtml(t.title)}</p>
      <p><strong>Assigned by:</strong> ${escapeHtml(String(assigner))}</p>
      ${t.dueDate ? `<p><strong>Due:</strong> ${escapeHtml(t.dueDate)}</p>` : ''}
      <p>Log in to the app to view and update the task.</p>
    `;
}

function buildStatusChangedBody(payload: TaskEventPayload): string {
    const t = payload.task;
    const meta = payload.metadata ?? {};
    const oldStatus = (meta.oldStatus as string) || 'previous';
    const newStatus = (meta.newStatus as string) || t.status || 'updated';
    return `
      <p>The status of a task you're assigned to has been updated.</p>
      <p><strong>Task:</strong> ${escapeHtml(t.title)}</p>
      <p><strong>Status:</strong> ${escapeHtml(oldStatus)} → ${escapeHtml(newStatus)}</p>
      ${t.dueDate ? `<p><strong>Due:</strong> ${escapeHtml(t.dueDate)}</p>` : ''}
      <p>Log in to the app for details.</p>
    `;
}

function buildTaskOverdueBody(payload: TaskEventPayload): string {
    const t = payload.task;
    return `
      <p>This task is overdue.</p>
      <p><strong>Task:</strong> ${escapeHtml(t.title)}</p>
      <p><strong>Due date:</strong> ${escapeHtml(t.dueDate || 'N/A')}</p>
      <p>Please update the task or its due date in the app.</p>
    `;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export const handler = async (event: SNSEvent, context: Context): Promise<void> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('SNS event received', { recordCount: event.Records?.length ?? 0 });

    for (const record of event.Records ?? []) {
        try {
            const message = record.Sns?.Message;
            if (!message) {
                logger.warn('SNS record has no Message');
                continue;
            }
            let payload: TaskEventPayload;
            try {
                payload = JSON.parse(message) as TaskEventPayload;
            } catch {
                logger.warn('Invalid JSON in SNS Message', { message: message.slice(0, 200) });
                continue;
            }
            const { eventType, recipients, task } = payload;
            if (!recipients?.length || !task?.title) {
                logger.warn('Payload missing recipients or task title', { eventType });
                continue;
            }
            const toEmails = recipients.map((r) => r.email).filter(Boolean);
            if (toEmails.length === 0) continue;

            let subject: string;
            let bodyHtml: string;
            switch (eventType) {
                case 'TASK_ASSIGNED':
                    subject = `Task assigned: ${task.title}`;
                    bodyHtml = buildTaskAssignedBody(payload);
                    break;
                case 'TASK_STATUS_CHANGED':
                    subject = `Task status updated: ${task.title}`;
                    bodyHtml = buildStatusChangedBody(payload);
                    break;
                case 'TASK_DUE_SOON':
                    subject = `Task due soon: ${task.title}`;
                    bodyHtml = buildTaskOverdueBody(payload);
                    break;
                case 'TASK_OVERDUE':
                    subject = `Overdue task: ${task.title}`;
                    bodyHtml = buildTaskOverdueBody(payload);
                    break;
                default:
                    logger.warn('Unknown event type', { eventType });
                    continue;
            }

            const html = wrapEmailHtml(subject, bodyHtml);
            await sendEmail({
                to: toEmails,
                subject,
                htmlBody: html,
                textBody: subject + '\n\nLog in to the app for details.',
            });
        } catch (err) {
            logger.error('Failed to send notification email', { err, messageId: record.Sns?.MessageId });
            throw err;
        }
    }
};
