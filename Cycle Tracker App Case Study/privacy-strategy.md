# Privacy Strategy

## Privacy Goal

Treat cycle, symptom, food, workout, and recovery data as sensitive personal health data.

## Privacy Principles

- Collect only what the product needs.
- Store data locally first.
- Make export and delete easy.
- Explain privacy choices clearly.
- Avoid selling or sharing health data.
- Avoid unnecessary third-party tracking.

## First Version

The first version should use local-first storage.

For web:

- IndexedDB for user logs
- localStorage only for harmless preferences

For future mobile:

- SQLite for logs
- SecureStore for sensitive settings or tokens

## User Controls

Include:

- Export all data
- Delete all data
- Reset demo data
- Privacy explanation screen
- Optional cloud sync later

## Language Rules

Use careful language around insights.

Good:

- "This pattern appears in your logs."
- "Energy often trends lower during this phase."
- "This may be related to sleep, stress, or recovery."

Avoid:

- "This caused your symptoms."
- "This diagnosis means..."
- "You should treat this by..."

## Why This Matters

Privacy is not just a settings screen. It is part of the product's trust, design, and technical architecture.
