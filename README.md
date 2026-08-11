# Personal Calibration

> **"Help people discover how accurately they predict their own behavior and performance."**

Personal Calibration is a calm, evidence-based mirror for personal prediction and execution. Rather than acting as a generic productivity coach or habit tracker, it helps users observe the gap between what they predict will happen, what actually happens, and whether recurring biases exist in their planning.

---

## 🎯 Core Philosophy & Loop

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
- **Data Preservation**: Original predictions are preserved immutably—calendar updates never overwrite historical prediction records.
- **Deterministic Statistics**: All insights are derived strictly from user data using explainable calculations.

---

## ✨ Key Features

### 1. 📅 Google Calendar Panel & Real-time Integration
- **Full Screen / Embedded Calendar View**: Full Google Calendar workspace panel with view mode toggles (Interactive App Grid & Official Web Embed).
- **Direct Event Synchronization**: Dedicated **Sync Google Calendar** action that maps `googleCalendarEventId` directly into renderable task predictions.
- **In-App Event Modification**: Inspect, edit titles, update dates, and modify start/end times directly within the application.
- **OAuth Google Workspace Ready**: Integrates with Google Calendar read/write scopes.

### 2. ⏱️ Calibration Engine & Analytics
- **Duration Calibration**: Calculates percentage estimation error: `(actual_duration - predicted_duration) / predicted_duration`.
- **Category-Specific Baselines**: Tracks calibration separately across categories (e.g., Programming, Studying, Reading, Writing, Personal) once 5+ observations are logged.
- **Start-Time Delay Tracking**: Measures the gap between planned start time and actual execution start.
- **Completion Rate & Confidence Calibration**: Compares user confidence ratings (e.g., 90%) with actual success rates.

### 3. 🛡️ Evidence-Based Reality Checks
- Soft warnings and soft interventions when creating new predictions that deviate by >15%–30% from past category averages.
- Provides actionable suggestions (*"Similar tasks usually take you 3h25m"*), letting the user make the final decision.

### 4. 😴 Sleep Context Variable
- Measures planned vs. actual bedtime and wake times to uncover performance correlations (*"After <6 hours of sleep, task completion decreases by 35%"*) without providing medical advice or health scores.

### 5. 🗺️ Clean 4-Tab Navigation
- **Today**: Planned activities, execution timers, Reality Checks, and sleep context log.
- **Calendar**: Google Calendar hub with real-time sync and full event editor.
- **Calibration**: High-level recurring bias patterns and category statistics.
- **History**: Full reflection log comparing estimated vs. actual performance.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Integrations**: Google Workspace APIs (Google Calendar OAuth)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18 or higher) and **npm** installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd personal-calibration
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` if you need custom API keys or Google Client credentials:
   ```bash
   cp .env.example .env
   ```

### Development Server

Start the development server on port `3000`:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### Production Build

To test or generate a production bundle:
```bash
# Build static client assets and server bundle
npm run build

# Start production server
npm run start
```

### Code Quality & Linting

Run TypeScript validation and linting:
```bash
npm run lint
```

---

## 📄 License

Distributed under the MIT License.
