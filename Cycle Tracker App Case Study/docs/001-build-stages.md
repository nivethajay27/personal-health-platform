# Build Stages

## Stage 1: Product Definition

Decide what the app is and what it is not.

Decisions to make:

- Primary user: women who want to understand cycle, food, workout, energy, symptom, and recovery patterns.
- Main promise: help users understand body patterns across their cycle, not just track periods.
- Product boundary: avoid fertility prediction, diagnosis, treatment advice, medical claims, and sharing user data.
- Tone: supportive, clear, elegant, and privacy-first.

Why this matters:

If the app tries to do everything, it will feel scattered. A focused product is easier to design, build, and explain to employers.

## Stage 2: Free Tech Stack

Choose tools that are free to build with and strong for a portfolio.

Decisions to make:

- Web framework: Next.js
- Language: TypeScript
- Styling: Tailwind CSS
- Components: shadcn/ui and Radix UI
- Charts: Recharts first, Visx later if more custom visualizations are needed
- Animation: Framer Motion
- Data storage: local-first with IndexedDB
- Deployment: Vercel free tier
- Mobile later: Expo and React Native

Why this matters:

This keeps the project affordable while still using modern tools employers recognize.

Important note:

Building the app can be free, but publishing to official stores is not fully free. Apple requires a yearly developer fee, and Google Play requires a one-time developer account fee.

## Stage 3: Design System

Create the visual foundation before building many screens.

Decisions to make:

- Color palette
- Typography
- Spacing scale
- Card style
- Chart style
- Button and form style
- Motion style
- Light and dark mode strategy

Recommended direction:

- Deep plum or aubergine for depth
- Coral for menstrual-related highlights
- Golden yellow for ovulatory energy
- Sage green for food and recovery
- Warm cream or soft white background
- Charcoal text

Why this matters:

The app needs to look intentional immediately. Employers often form an opinion before reading the code.

## Stage 4: Data Model

Design the app's core data before building forms.

Models to define:

- UserProfile
- Cycle
- CycleDay
- CyclePhase
- DailyCheckIn
- SymptomLog
- MealLog
- WorkoutLog
- RecoveryLog
- Insight
- PrivacySettings

Why this matters:

Clean data modeling makes the app easier to expand and shows technical maturity.

Structure decisions:

- Keep cycle data separate from food data.
- Keep daily mood and symptoms easy to track through daily check-ins.
- Let insights pull from multiple sources, including cycle, food, workouts, recovery, energy, and symptoms.
- Keep privacy settings separate from the user profile.
- Design the model so charts, AI recommendations, predictions, and reports can be added later.

Why this matters:

Separating each part of the app keeps the system easier to understand. It also makes future features easier because insights and charts can combine data without mixing everything into one messy record.

## Stage 5: Demo Data

Create realistic sample data before connecting real user input.

Decisions:

- Include 3 complete demo cycles using a 28-day average.
- Track common symptoms: cramps, bloating, headache, fatigue, cravings, acne, mood swings, breast tenderness, and back pain.
- Include workout types: walking, yoga, pilates, strength training, cardio, HIIT, stretching, and rest days.
- Use phase-based nutrition patterns, including iron-rich, protein-focused, and magnesium-rich foods.
- Include recovery patterns for sleep, hydration, fatigue, stress, and soreness.
- Show demo insights such as ovulation energy peaks, luteal cravings, menstrual fatigue, sleep changes, and workout recommendations.

Reference notes:

- Use a 5-day average period length inside the 28-day cycle.
- Use a named demo user, Anaya, so the portfolio demo feels personal rather than generic.
- Keep phase patterns simple: lower energy during menstrual days, rising energy during follicular days, peak energy around ovulation, and gradual energy decline during luteal days.
- Make food, workout, symptom, and recovery patterns phase-aware instead of random.
- Ensure the sample data supports the dashboard, cycle timeline, calendar, symptom trends, meal history, workout history, recovery score, sleep trend, personalized insights, weekly summary, and recommendations.

Why this matters:

Demo data lets you build a beautiful dashboard early. It also makes the portfolio version easier for employers to explore.

Result:

The demo data should create a realistic user journey, highlight relationships between cycle, nutrition, workouts, and recovery, and make the portfolio version feel polished before real user data is connected.

## Stage 6: Dashboard First

Build the main app screen before building every form.

Dashboard should include:

- Current cycle day
- Estimated cycle phase
- Energy score
- Recovery score
- Suggested workout intensity
- Food or nutrient focus
- Recent symptoms
- One or two insight cards
- Cycle visualization

Why this matters:

The dashboard is the app's first impression. It should show the value of the product immediately.

## Stage 7: Cycle Engine

Build the logic that estimates a user's current cycle phase while allowing flexibility for different cycle patterns.

Decisions:

- Users enter the first day of their period manually through a calendar or quick log button.
- Users can customize average cycle length and period length.
- Users can override estimated phases manually.
- Irregular cycles should be supported with flexible ranges instead of only exact dates.
- The UI should show uncertainty with soft labels like "estimated," "likely," or date ranges.

Why this matters:

The app should not assume every user has the same cycle. Flexible cycle logic makes the app more realistic and respectful.

Result:

The cycle engine should support standard cycles, irregular cycles, manual corrections, and transparent predictions without presenting estimates as medical certainty.

## Stage 8: Daily Check-In

Build the daily logging experience.

Inputs to include:

- Energy
- Mood
- Sleep
- Stress
- Symptoms
- Cravings
- Soreness
- Notes

Design decision:

Make the daily check-in quick and beautiful, not a giant form.

Use:

- Sliders
- Chips
- Toggles
- Icons
- Short notes

Why this matters:

Daily logging is the main habit loop. Tracking apps fail when logging feels annoying, so the check-in should feel fast and pleasant rather than like paperwork.

## Stage 9: Food, Workout, And Recovery Logs

Build lightweight logs that support pattern discovery.

Food decisions:

- Avoid calorie counting at first
- Track meal type, protein/fiber/hydration estimates, cravings, nutrient focus, and notes
- Focus on nourishment and patterns

Workout decisions:

- Track type, duration, intensity, perceived effort, cycle phase, and recovery afterward
- Connect workouts to cycle phase

Recovery decisions:

- Track sleep, soreness, stress, rest quality, and readiness

Why this matters:

The product is about understanding patterns, not dieting. That distinction makes the product feel healthier and more thoughtful.

## Stage 10: Visualizations

Build the rich visual layer.

Priority visualizations:

- Cycle phase ring
- Cycle timeline
- Symptom heatmap
- Energy trend by cycle day
- Workout intensity by phase
- Sleep versus symptoms
- Recovery trend

Why this matters:

Visualizations are what will make the app memorable as a portfolio project.

## Stage 11: Insight Engine

Start with rule-based insights.

Example insights:

- Energy tends to dip during late luteal days.
- High-intensity workouts feel harder near period start.
- Sleep under 6.5 hours often appears before lower energy days.
- Hydration appears lower on headache days.

Why this matters:

Insights make the app feel useful instead of just decorative.

Important rule:

Use pattern language, not medical certainty. Say "appears related" or "shows up often," not "causes."

## Stage 12: Privacy Features

Make privacy visible in the product.

Features to include:

- Local-first storage
- Export data
- Delete all data
- Privacy settings screen
- Clear explanation of what is stored
- Optional cloud sync later

Why this matters:

Cycle and health data are sensitive. Privacy-first design makes the app more trustworthy and technically impressive.

## Stage 13: Testing

Test the logic that matters most.

Test areas:

- Cycle phase calculations
- Insight rules
- Data validation
- Export and delete behavior
- Main dashboard rendering

Why this matters:

Tests prove the serious parts of the app work reliably.

## Stage 14: Portfolio Polish

Prepare the project for employers.

Add:

- README
- Screenshots
- Architecture diagram
- Design system notes
- Privacy strategy
- Case study
- Demo mode
- Deployed link

Why this matters:

Employers should be able to understand the product, the thinking, and the engineering decisions quickly.

## Stage 15: Mobile Path

After the web app is strong, create the mobile version.

Mobile decisions:

- Use Expo and React Native
- Reuse core logic from the web app
- Rebuild UI using native components
- Use SQLite for mobile storage
- Use SecureStore for sensitive tokens or settings
- Add store deployment only when ready to pay required store fees

Why this matters:

The app can become mobile later without throwing away the core product logic.
