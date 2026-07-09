# Architecture Diagram

## Simple Architecture

```mermaid
flowchart TD
  User["User"]
  UI["Next.js Web App"]
  Storage["IndexedDB Local Storage"]
  Core["Core Logic Package"]
  Cycle["Cycle Engine"]
  Insights["Insight Engine"]
  Charts["Dashboard + Charts"]
  Privacy["Privacy Controls"]
  Mobile["Future Expo Mobile App"]

  User --> UI
  UI --> Storage
  UI --> Core
  Core --> Cycle
  Core --> Insights
  Cycle --> Charts
  Insights --> Charts
  Storage --> Charts
  Privacy --> Storage
  Mobile -. reuses .-> Core
```

## Notes

- The web app is the first build target.
- Sensitive user data starts local-first in IndexedDB.
- Core logic is separated so a future Expo mobile app can reuse it.
- Privacy controls manage export, delete, and future sync choices.
