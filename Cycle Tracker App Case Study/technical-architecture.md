# Technical Architecture

## Architecture Goal

Build a web app that can later become a mobile app without rewriting the product logic from scratch.

## Recommended Structure

```txt
apps/
  web/
    Next.js app
  mobile/
    Future Expo app

packages/
  core/
    Cycle calculations
    Insight rules
    Scoring logic
    Shared types

  ui/
    Shared design tokens
    Reusable web components if useful

  storage/
    Local storage adapters
    Export and delete helpers
```

## Web Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Recharts or Visx
- Framer Motion
- IndexedDB

## Future Mobile Stack

- Expo
- React Native
- TypeScript
- Expo Router
- SQLite
- SecureStore

## Important Technical Decisions

### Separate Product Domains

Keep cycle, food, workouts, recovery, daily check-ins, insights, and privacy settings as clearly separated domains.

Why this matters:

Separated domains make the app easier to build, test, and expand. Insights can still combine information from multiple domains without forcing all user data into one large object.

### Keep App Logic Separate

Cycle calculations, insights, and scoring should live outside React components.

Why this matters:

If the logic is separate, the future mobile app can reuse it.

### Start Local-First

Store data on the user's device first.

Why this matters:

This supports the privacy-first goal and avoids backend costs early.

### Use Demo Data Early

Create realistic demo data before requiring account creation or real user input.

Why this matters:

Demo data makes the app impressive immediately and helps build charts faster.

### Add Sync Later

Cloud sync should be optional and added after the core app works well.

Why this matters:

Auth and sync add complexity. The app should be useful before adding accounts.
