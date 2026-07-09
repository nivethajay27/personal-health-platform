# Implementation Steps

This file tracks the actual build steps in a simple, concise way.

## Step 1: Create Web App

- Created the app in `apps/web`.
- Used Next.js, TypeScript, Tailwind CSS, ESLint, App Router, `src/`, and `@/*`.
- Reason: creates a modern web foundation that can later sit beside a mobile app.

## Step 2: Confirm Structure

- Reviewed generated files, app router structure, config, and starter page.
- Confirmed `src/app`, `tsconfig`, ESLint, and package scripts.
- Reason: understand the generated baseline before editing.

## Step 3: Run Dev Server

- Started the local dev server at `http://localhost:3000`.
- Confirmed the app returned `200 OK`.
- Reason: prove the baseline app works before changes.

## Step 4: Clean Starter Page

- Replaced the default Next.js starter page with a simple Cycle Companion shell.
- Added placeholder hero, phase preview, and build-focus cards.
- Reason: create a clean product canvas instead of a generic framework page.

## Step 5: Add Design Tokens

- Added semantic colors, phase colors, radius, shadow, and button-height tokens.
- Refactored the placeholder page to use token classes instead of raw hex values.
- Reason: keep future screens visually consistent and easier to maintain.

## Step 6: Add Fonts

- Added Inter for body/UI text.
- Added DM Sans for headings.
- Verified computed browser styles use the expected fonts.
- Reason: improve readability and create a more premium wellness-app feel.

## Step 7: Create Base Layout Foundation

- Added `AppShell` for the shared page frame, header, status pill, and section nav.
- Added `PageContainer` for consistent max width and responsive spacing.
- Refactored the home page to use the layout components.
- Reason: future screens can share one app frame instead of repeating layout markup.

## Step 8: Add Reusable UI Primitives

- Added `Button`, `ButtonLink`, `Card`, `Badge`, and `SectionHeader`.
- Added a small `cn` utility for combining class names.
- Refactored the placeholder page and app shell to use these primitives.
- Reason: common UI pieces should be consistent before building more screens.

## Step 9: Define TypeScript Data Models

- Added domain types for user, cycle, check-ins, symptoms, meals, workouts, recovery, insights, and privacy.
- Kept each product area in a separate file under `src/domain`.
- Added shared types for ISO dates, intensity levels, and trend direction.
- Reason: clean models make future demo data, charts, insights, and mobile reuse easier.

## Step 10: Add Lightweight Demo Data

- Added a typed demo dataset for Anaya with 3 cycle records.
- Generated cycle days, check-ins, meals, workouts, recovery logs, symptoms, and insights from simple phase patterns.
- Kept demo data in `src/data`, separate from domain types.
- Reason: future dashboards and charts need realistic data before real user input exists.

## Step 11: Add Cycle Utility Functions

- Added pure cycle logic under `src/core/cycle`.
- Added helpers for cycle day, phase estimate, effective phase, phase progress, prediction confidence, and current cycle lookup.
- Kept logic outside React components.
- Reason: dashboard, charts, insights, and future mobile screens should reuse the same cycle calculations.

## Step 12: Build Dashboard Shell

- Added a dashboard feature module under `src/features/dashboard`.
- Replaced the placeholder homepage with a demo-data-backed dashboard shell.
- Included current phase, cycle progress, key metrics, quick add actions, today's logs, and insight cards.
- Reason: the first screen should show the actual product value before forms and charts are built.

## Step 13: Add Current Cycle Phase Visualization

- Added `CyclePhaseCard` for the main phase display.
- Included phase segments, current day marker, confidence label, phase progress, and current phase window.
- Kept uncertainty language visible in the card.
- Reason: cycle phase should be the dashboard's signature visual anchor.

## Design Correction: Lock Light Palette

- Removed automatic dark-mode token overrides.
- Kept the app on the provided sage, cream, white, lavender, and charcoal palette.
- Reason: the portfolio demo should match the approved design direction consistently.

## Step 14: Add Daily Check-In Prototype

- Added a dashboard daily check-in card using demo data.
- Included energy, mood, sleep, symptoms, cravings, stress, soreness, and notes.
- Used compact scales and chips instead of a long form.
- Reason: daily logging should feel quick, clear, and pleasant before persistence is added.

## Step 15: Add Food, Workout, And Recovery Log Prototypes

- Added read-only prototype panels for meal, workout, and recovery logging.
- Included estimates for protein, fiber, hydration, intensity, effort, sleep, stress, soreness, and readiness.
- Kept calorie tracking out of the first version.
- Reason: the product should focus on body patterns, nourishment, and recovery instead of dieting.

## Step 16: Add First Pattern Visualizations

- Added Recharts as the first charting library.
- Added energy trend, workout intensity by phase, and symptom heatmap visuals.
- Kept charts inside a focused client component.
- Reason: visualizations make the app feel analytical and portfolio-ready without overbuilding the insight engine yet.

## Step 17: Add Rule-Based Insight Engine

- Added a pure insight engine under `src/core/insights`.
- Generated insights from cycle, check-in, meal, workout, symptom, and recovery demo data.
- Used cautious language like "appears" and "shows up often."
- Reason: insights should feel useful and technical without making medical claims.

## Step 18: Add Local-First Storage Layer

- Added an IndexedDB wrapper under `src/storage`.
- Created stores for profile, cycles, check-ins, symptoms, meals, workouts, recovery, insights, and privacy settings.
- Added typed save/get/clear helpers.
- Kept storage separate from demo data and dashboard UI for now.
- Reason: privacy-first user data should stay local before any cloud sync is considered.
