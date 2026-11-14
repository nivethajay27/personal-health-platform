# Cycle Companion Mobile

Native iOS and Android companion for the privacy-first Cycle Companion web app.

## Foundation

- Expo SDK 58 + React Native + TypeScript
- Expo Router for native navigation
- Portrait, light-only app configuration
- Product identity and deep-link scheme: `cyclecompanion://`

## Run Locally

```bash
cd apps/mobile
npm install
npm start
```

Use Expo Go to open the development build on a physical device. The first product screen will be built in the next mobile stage.

## Checks

```bash
npm run lint
npx tsc --noEmit
npx expo-doctor
```
