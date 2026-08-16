# Personal Calibration

> **"Help people discover how accurately they predict their own behavior and performance."**

Personal Calibration is a calm, evidence-based mirror for personal prediction and execution. Rather than acting as a generic productivity coach or habit tracker, it helps users observe the gap between what they predict will happen, what actually happens, and whether recurring biases exist in their planning.

---

## Core Philosophy & Loop

People frequently make predictions about their future behavior without incorporating evidence from their past. Personal Calibration powers a continuous feedback loop:

```
    PREDICT
       ↓
    EXECUTE
       ↓
    MEASURE
       ↓
    COMPARE
       ↓
    LEARN
       ↓
 REALITY CHECK
       ↓
 NEXT PREDICTION
```

### Key Principles
- **No Judgment**: The app never shames, manipulates, or forces the user.
- **Data Preservation**: Original predictions are preserved immutably — calendar updates never overwrite historical prediction records.
- **Deterministic Statistics**: All insights are derived strictly from user data using explainable calculations.

---

## Key Features

### 1. Today Tab
- **Quick add**: Inline task creation with category, duration, and a live Reality Check.
- **Execution timers**: Start, finish, postpone, or skip tasks and get measured actual durations automatically.
- **Forecast vs actual**: Inline comparison of your original prediction against the measured outcome.
- **Strongest insight card**: Surfaces your single most evidence-backed calibration pattern when 5+ observations exist.
- **Sleep log**: Records planned vs actual bedtime and wake time to uncover performance correlations.

### 2. Prediction Modal (Plan → Forecast)
- **Plan**: Task name, category, optional tag, date, start time, and scheduled time block.
- **Behavioral task type**: For Programming tasks, narrow the reference class with `implementation`, `debugging`, `testing`, or `documentation`.
- **Forecast**: Your predicted duration, separate from the scheduled block.
- **Confidence**: A stated confidence slider (50%–95%).
- **Live Reality Check**: Compares your estimate against your historical average and warns when it deviates by more than the configured thresholds.

### 3. Calibration Engine & Analytics
- **Duration calibration**: Percentage estimation error `(actual - predicted) / predicted`, computed per category and overall.
- **Category-specific baselines**: Programming, Studying, Reading, Writing, and Personal are calibrated separately once 5+ observations exist.
- **Evidence levels**: `no_pattern` → `early_pattern` → `established` → `strong_reference` based on observation counts.
- **Start-time delay**: Measures the gap between planned start time and actual execution start.
- **Confidence calibration**: Compares stated confidence (e.g. 90%) with actual success rates.
- **Forecast Accuracy Experiment**: Compares absolute forecast error before (Phase A baseline) vs after (Phase B intervention) Reality Checks, plus a 5-question qualitative survey.
- **Sleep impact**: Correlates sleep duration with completion rates without providing medical advice.

### 4. Google Calendar Integration
- **OAuth sign-in**: Connect a Google account from the Calendar or Settings tab.
- **Event sync**: Maps real Calendar events into renderable plan candidates (`googleCalendarEventId`).
- **Event reconciliation**: Rescheduled or edited events are reconciled with linked tasks; original prediction fields are preserved.
- **Calendar picker**: Choose which calendar to sync from (not just the primary one).
- **Two view modes**: An interactive in-app grid and the official Google embed.

### 5. Data & Developer Tools
- **Testing presets**: Seed `standard`, `rich`, `edge`, `empty`, or `generated` datasets from Settings.
- **JSON backup**: Export your tasks, sleep records, and settings to a file, and import it back later.
- **Validation suite**: Run 71 automated checks covering zero durations, midnight boundaries, and edge cases from Settings.

### Navigation (5 tabs)
- **Today**: Planned activities, execution timers, Reality Checks, and sleep context.
- **Calendar**: Google Calendar hub with sync, view modes, and event editing.
- **Calibration**: Recurring bias patterns, category statistics, and the experiment card.
- **History**: Full reflection log comparing estimated vs. actual performance.
- **Settings**: Calendar connection, calibration thresholds, presets, and backup tools.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Integrations**: Google Workspace APIs (Google Calendar OAuth via Firebase Auth)

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** (or **bun**, since both `package-lock.json` and `bun.lock` are present)

### Installation

```bash
git clone <repository-url>
cd self-aware
npm install
```

### Environment Variables

Copy `.env.example` to `.env` if you need custom API keys or Google credentials:

```bash
cp .env.example .env
```

- `GEMINI_API_KEY`: Optional — used for Gemini AI API calls (injected at runtime in AI Studio).
- `APP_URL`: The URL where the applet is hosted, used for OAuth callbacks.

Google Calendar sign-in also depends on the Firebase/OAuth configuration (see `firebase-applet-config.json`); in AI Studio these are injected at runtime.

### Development Server

```bash
npm run dev
```

Vite starts on port `3000` and binds to `0.0.0.0`. Open http://localhost:3000.

### Production Build

```bash
npm run build
npm run preview
```

### Validation

```bash
npm run lint    # TypeScript type-check (tsc --noEmit)
npm test        # Full unit & functional suite (71 checks)
```

---

## Step-by-Step Tutorial

### Step 1 — Launch the app

Start the dev server and open the app. On first run, the app automatically seeds **sample tasks, sleep records, and settings** into your browser's `localStorage`, so you can explore without entering data.

1. Open the **Today** tab. You should see sample tasks for today plus the sleep context banner.
2. Click around the 5 tabs to get oriented: **Today**, **Calendar**, **Calibration**, **History**, **Settings**.

> Tip: Use **Settings → Testing & Data Seeding Presets** to reset to `standard`, `rich`, `edge`, `empty`, or `generated` data at any time.

### Step 2 — Add your first task with the Quick Add form

On the **Today** tab, use the inline quick-add form:

1. Type a task name (e.g. "Study Machine Learning").
2. Pick a category and enter a duration estimate.
3. Watch the **Reality Check** area — with the seeded sample data it already has enough history to warn you if your estimate deviates from your typical duration.
4. Click **Add**. The full prediction modal opens pre-filled.

### Step 3 — Create a prediction (Plan → Forecast)

In the task modal:

1. **Plan** section:
   - **Task name** — required.
   - **Category** — Programming, Studying, Reading, Writing, or Personal.
   - **Tag** (optional) — e.g. "Assignment", "BugFix" — this narrows your reference class.
   - **Date** and **Start time** — when the task is scheduled.
   - **Schedule block (plan)** — how much time the calendar block reserves.
2. If the category is **Programming**, pick a **Task type** (`implementation`, `debugging`, `testing`, `documentation`, or `other`) for a finer-grained reference class.
3. **Prediction** section:
   - **Forecast duration** — your honest prediction of how long it will take.
   - **Confidence** — how certain you are (50%–95%).
4. If your forecast deviates from history, a **Reality Check banner** appears with a suggestion (e.g. "Similar tasks usually take you 2h30m"). You decide: accept the suggestion, keep your estimate, or adjust.
5. Click **Save prediction**.

### Step 4 — Execute and measure

Back on the **Today** tab:

1. Click **Play** (▶) on the task to start it — a live timer begins.
2. When done, click **Finish**. The app records the actual duration automatically and flags it as measured.
3. If your actual deviated by more than 20% from your forecast, a **reflection prompt** appears — answer it to log what happened.
4. You can also **postpone** a task to another day or **skip** it with a reason.

The sleep context is part of execution too: click the sleep icon (🌙) to log **planned vs actual bedtime and wake time** for today.

### Step 5 — Read your Calibration

Open the **Calibration** tab:

1. **Evidence levels** are shown on the Duration Calibration rows and the Reality Check header — the more completed measured tasks you have, the stronger the pattern.
2. Review **duration calibration** (over/under-estimation per category), **start-time delay**, **confidence accuracy**, and **sleep impact**.
3. **Forecast Accuracy Experiment**: once you have enough predictions with and without Reality Checks, the app compares Phase A (baseline) vs Phase B (intervention) absolute error. Answer the 5 **qualitative questions** to record trust and understanding.
4. A legend explains the **Plan / Forecast / Actual / Calibration** columns used throughout.

### Step 6 — Review History

Open the **History** tab:

1. Every completed, postponed, or skipped prediction is listed with its forecast vs actual.
2. Filter by **status** (completed / postponed / skipped).
3. Expand entries to read **reflection notes** you left after finishing.

### Step 7 — Use the Calendar

Open the **Calendar** tab:

1. Toggle between **App Interactive** (in-app grid) and **Official Web Embed** views.
2. Click **Sync Google Calendar** to pull your real events into the app. Sign in with Google if prompted.
3. Each synced event becomes a task prediction with a stable `googleCalendarEventId`; reschedules are reconciled without overwriting your original predictions.
4. Create, edit, and delete events directly from the interactive grid.

### Step 8 — Configure Settings

Open the **Settings** tab:

1. **Calendar connection**: Sign in & sync, choose which calendar to pull from, and toggle auto-import.
2. **Calibration behavior**: Tune **Minimum Observations** (default 5), **Small Suggestion Threshold** (15%), and **Reality Check Threshold** (30%), then **Save parameters**.
3. **Developer tools**: Run the automated validation suite and view the report.
4. **Data**: Export your data as JSON, or import a previous backup (invalid records are reported and skipped).
5. **Presets**: Reset to sample data or start empty, then rebuild your calibration history by completing tasks.

### Step 9 — Build your calibration loop

Calibration is cumulative:

1. Complete at least **5 measured tasks** in a category before Reality Checks activate for it.
2. The more you measure, the higher your **evidence level** climbs (early pattern → established → strong reference).
3. When the Reality Check has been used enough, the **experiment** on the Calibration tab tells you whether the intervention actually improved your forecast accuracy.

---

## Project Structure

```
src/
  App.tsx                  Top-level state, persistence, tab routing, modal wiring
  main.tsx                 Browser entrypoint
  types.ts                 Domain types
  components/              UI views (Today, Calendar, Calibration, History, Settings, modals)
    ui/                    Tokenized primitives (Button, Field, ModalShell, Badge, CardSection, ...)
    today/                 Today view sections
    calendar/              Google Calendar view sections
    calibration/           Calibration view sections
    history/               History view sections
    settings/              Settings view sections
    task/ sleep/ correction/ reflection/ postpone/
                           Modal form sections (prediction, sleep log, corrections, ...)
  utils/
    calibrationEngine.ts   Calibration calculations & Reality Check logic
    storage.ts             localStorage persistence + fixture datasets
    googleAuthService.ts   Firebase OAuth + Google Calendar API
    googleCalendar.ts      Event ↔ task conversion helpers
    validationSuite.ts     71-check automated validation suite
  tests/runAllTests.ts     Test runner (npm test)
```

---

## License

Distributed under the MIT License.
