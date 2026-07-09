# Web-First, Mobile-Ready

## Decision

Build the web app first, while keeping the core product logic reusable for a future mobile app.

## Why This Matters

A web app is the fastest and most affordable way to create a polished portfolio demo. Keeping cycle calculations, insights, scoring, and shared types separate from the web UI makes the future Expo mobile app easier to build.

## Technical Direction

- Web: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Recharts, Framer Motion, IndexedDB.
- Mobile later: Expo, React Native, TypeScript, Expo Router, SQLite, SecureStore.
- Shared logic: cycle phase calculations, insight rules, scoring, validation, and data types.

## Tradeoff

Some UI will need to be rebuilt for mobile, but the app's core logic should not need to be rewritten from scratch.
