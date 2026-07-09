# Decision Log

Use this file to document important product, design, and technical decisions as the app evolves.

## Decision Template

### Decision

What did we choose?

### Options Considered

- Option 1
- Option 2
- Option 3

### Final Choice

What option did we pick?

### Why This Matters

Explain the decision in plain English.

### Tradeoffs

What are we giving up or delaying?

### Date

YYYY-MM-DD

---

## Initial Decisions

### Decision

Use realistic demo data before connecting real user input.

### Options Considered

- One cycle of demo data
- Three cycles of demo data
- Six to twelve cycles of demo data

### Final Choice

Use three complete 28-day demo cycles with a 5-day average period length, a named demo user, common symptoms, balanced workout types, phase-based nutrition patterns, recovery signals, and a small set of high-quality insights.

### Why This Matters

The dashboard, charts, calendar, and insights need enough history to feel complete from the start. Three cycles provide useful trends and predictions without making the MVP too heavy.

### Tradeoffs

The demo data will not cover every possible symptom, workout, or nutrition detail, but it keeps the product simple and easy to understand.

### Date

2026-07-09

---

### Decision

Use adaptable spacing and dimension tokens across web and mobile.

### Options Considered

- Use one fixed spacing system everywhere
- Create separate unrelated spacing systems for web and mobile
- Use shared design tokens that can adjust by platform

### Final Choice

Use the 8-point spacing system as the foundation, while allowing dimensions such as padding, card radius, and layout spacing to adjust for web and mobile.

### Why This Matters

The app should feel consistent across platforms without forcing desktop-sized spacing onto mobile screens or mobile-sized spacing onto web layouts.

### Tradeoffs

The design system needs responsive rules so the app stays consistent while still feeling natural on each platform.

### Date

2026-07-09

---

### Decision

Separate the app's core data into clear product domains.

### Options Considered

- One large daily tracking record
- Separate records for each product area
- Separate domains with shared insight generation

### Final Choice

Define separate models for user profile, cycle, daily check-ins, symptoms, meals, workouts, recovery, insights, and privacy settings.

### Why This Matters

This keeps cycle data separate from food data, makes mood and symptoms easy to track, and lets insights combine multiple sources later.

### Tradeoffs

The data model needs more upfront planning, but it will better support charts, AI recommendations, predictions, reports, and future mobile reuse.

### Date

2026-07-09

---

### Decision

Use a premium wellness design system for the app's visual direction.

### Options Considered

- Generic period tracker styling
- Clinical health dashboard styling
- Premium wellness dashboard with journal-like warmth

### Final Choice

Use a calm, premium visual system inspired by Apple Health, Oura, Headspace, and a more modern, less pink version of Flo.

### Why This Matters

The app needs to feel trustworthy and beautiful immediately, while still supporting rich health and lifestyle data.

### Tradeoffs

The visual system should stay soft and polished without becoming too decorative or losing chart readability.

### Date

2026-07-09

---

### Decision

Define the app as a cycle-aware wellness companion, not just a period tracker.

### Options Considered

- Basic period tracker
- Fitness tracker with cycle notes
- Cycle-aware wellness companion

### Final Choice

Build for women who want to understand patterns between cycle, food, workouts, energy, symptoms, and recovery.

### Why This Matters

This makes the product broader and more portfolio-worthy than a basic tracking app while keeping the focus on privacy and personal understanding.

### Tradeoffs

The app must avoid fertility prediction, diagnosis, treatment advice, medical claims, and sharing user data.

### Date

2026-07-09

---

### Decision

Build the web app first, then plan for mobile.

### Options Considered

- Start with web only
- Start with mobile only
- Start with a shared monorepo for web and mobile

### Final Choice

Start with a web app first, while keeping the app logic separate so mobile can reuse it later.

### Why This Matters

A web app is easier and cheaper to deploy as a portfolio project. Separating the logic makes a future mobile app easier.

### Tradeoffs

Some mobile UI will need to be rebuilt later in React Native.

### Date

2026-07-08

---

### Decision

Use free or free-tier tools while building.

### Options Considered

- Paid backend and APIs
- Free web stack with local-first storage
- Fully custom backend from the beginning

### Final Choice

Use Next.js, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Recharts first, Visx later if needed, Framer Motion, IndexedDB local-first storage, Vercel free tier deployment, and Expo/React Native for mobile later.

### Why This Matters

This keeps the project affordable and still looks professional to employers.

### Tradeoffs

Some advanced features, like cloud sync or AI insights, may come later.

### Date

2026-07-08
