# Email HTML Template

Branded HTML email template for Phase 4 notifications.

## Usage

- Copy this template when adding new notification types (e.g. `taskAssigned.html`, `statusChanged.html`).
- Replace `{{PLACEHOLDERS}}` with actual values at send time.
- Keep styles inline for maximum email client compatibility.

## Placeholders

| Placeholder    | Description                |
|----------------|----------------------------|
| `{{title}}`    | Email subject/heading      |
| `{{body}}`     | Main HTML body content     |
| `{{appName}}`  | Application name           |
| `{{year}}`     | Current year (footer)       |

## File Naming

- `taskAssigned.html` – Task assigned to user
- `statusChanged.html` – Task status updated
- `taskOverdue.html` – Task overdue / due soon
