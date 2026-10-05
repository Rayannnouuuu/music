# Electric Guitar Learning Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, single-user React web app that helps a beginner guitarist practice electric guitar daily — animated tab player with metronome, electric tuner, structured exercises, a skill-based progression/streak system, and a metal-focused tab library.

**Architecture:** A Vite + React + TypeScript SPA with no backend. Base content (exercises, tabs) ships as static JSON loaded via `import.meta.glob`; personal data (XP, streak, imported tabs) lives in `localStorage` behind a tiny typed wrapper. Audio (metronome, tuner) is built directly on the Web Audio API with the timing-sensitive math extracted into pure, unit-testable functions, kept separate from the thin React/AudioContext glue that actually makes sound.

**Tech Stack:** Vite, React 18, TypeScript (strict), react-router-dom v6, Tailwind CSS, Vitest + React Testing Library, Web Audio API. No backend, no database, no charting/audio third-party libraries.

**Spec:** `docs/superpowers/specs/2026-10-05-electric-guitar-learning-site-design.md`

## Global Constraints

- No backend, server, database, or auth. Personal data persists only in `localStorage` (`src/lib/storage.ts`). Base content ships as static files under `src/content/`.
- No lyrics anywhere in tab or exercise content — notes/frets/rhythm/technique only.
- Dark theme only, exact palette from the spec: bg `#0c0a10`, panel `#16131c`, border `#271f30`, accent `#a855f7`, text `#f1edf5`, textMuted `#948aa3`.
- Tab player highlight behavior is a moving cursor over a static/fixed tab view (karaoke-style), not auto-scrolling notes — this was the validated design decision.
- No third-party charting or audio libraries — hand-rolled SVG for charts, raw Web Audio API for sound.
- TypeScript strict mode. Tests via Vitest, co-located as `*.test.ts(x)` next to the file they test.
- Repo already exists at `C:\Users\rayan\musique` (git initialized, root commit `04e7c2b`). Commit after every task.
- Run the task's tests (and `npm run build` for tasks touching shared types) before every commit.

## Review Focus

- **Malformed content JSON** (fret outside 0–24, string outside 1–6, non-ascending `startBeat`, missing fields) loaded at runtime — the app must show a friendly error, never a blank/crashed page. Covered by Task 3's validators plus a content-loading error path.
- **Microphone permission denied/unavailable** for the tuner — must show an explicit, actionable message; the rest of the site must stay usable. Covered in Task 12.
- **Corrupted or quota-exceeded `localStorage`** — reads/writes must degrade silently (fallback to defaults, no thrown error reaching the UI). Covered in Task 2.
- **Malformed ASCII import** (ragged line lengths, wrong number of string lines, stray characters) — parser must return a clear error value, never throw or silently produce garbage timing. Covered in Task 20.
- **Streak date edge cases** (today not yet logged, multi-day gaps, re-logging the same day twice) — streak math must be a pure function of an injected "today", not `new Date()` baked into the logic, and idempotent within a day. Covered in Task 14.

---

### Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `src/styles/theme.css`
- Create: `src/layout/Layout.tsx`, `src/layout/NavBar.tsx`
- Create: `src/pages/*.tsx` (placeholder stubs: `DashboardPage.tsx`, `ExercisesListPage.tsx`, `ExerciseDetailPage.tsx`, `TabLibraryPage.tsx`, `TabPlayerPage.tsx`, `TunerPage.tsx`, `ProgressionPage.tsx`, `ResourcesPage.tsx`)
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: working `npm run dev`, `npm run build`, `npm test` scripts; routes `/`, `/exercises`, `/exercises/:id`, `/tabs`, `/tabs/:id`, `/tuner`, `/progression`, `/resources` rendering their (initially empty) page components inside `Layout`; Tailwind theme colors `bg`, `panel`, `border`, `accent`, `text`, `textMuted` mapped to the exact hex values in Global Constraints, also exposed as CSS vars in `theme.css` for non-Tailwind use (e.g. inline SVG).

- [ ] **Step 1: Scaffold the Vite React-TS project** at the repo root (`npm create vite@latest . -- --template react-ts`), confirm it runs with `npm run dev`.
- [ ] **Step 2: Add and configure Tailwind CSS**, with `theme.extend.colors` set to the six tokens above (exact hex values), imported in `src/main.tsx`.
- [ ] **Step 3: Add Vitest + React Testing Library** (`vitest`, `@testing-library/react`, `jsdom`), wire `"test": "vitest run"` in `package.json`, configure `environment: 'jsdom'`.
- [ ] **Step 4: Add react-router-dom**, build `Layout`/`NavBar` (links to all 7 pages) and wire the 8 routes in `App.tsx` to placeholder page components that each render just their own title.
- [ ] **Step 5: Write `src/App.test.tsx`** rendering `<App>` at each route path and asserting the matching page title text appears.
- [ ] **Step 6: Run tests, verify pass.** Run: `npm test` — Expected: all pass.
- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "feat: scaffold Vite/React/TS app with routing and theme"
```

---

### Task 2: Local storage layer

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

**Interfaces:**
- Produces: `loadJSON<T>(key: string, fallback: T): T`, `saveJSON<T>(key: string, value: T): void`.

- [ ] **Step 1: Write failing tests** for: `loadJSON` returns `fallback` when key is missing; `saveJSON` then `loadJSON` round-trips a value; `loadJSON` returns `fallback` (not a throw) when the stored string is invalid JSON; `saveJSON` does not throw when `localStorage.setItem` itself throws (simulate via mocking `Storage.prototype.setItem` to throw `QuotaExceededError`).
- [ ] **Step 2: Run tests, verify they fail** (module doesn't exist yet).
- [ ] **Step 3: Implement `loadJSON`/`saveJSON`** in `src/lib/storage.ts`, wrapping `JSON.parse`/`JSON.stringify` and all `localStorage` calls in `try/catch`, logging via `console.warn` on failure and otherwise behaving as described above.
- [ ] **Step 4: Run tests, verify pass.**
- [ ] **Step 5: Commit.**

---

### Task 3: Shared content types & validation

**Files:**
- Create: `src/lib/content/types.ts`
- Create: `src/lib/content/validate.ts`
- Test: `src/lib/content/validate.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type GuitarString = 1|2|3|4|5|6 // 1 = high e, 6 = low E
  type Technique = 'bend'|'slide'|'palmMute'|'hammer'|'pull'|'vibrato'
  interface TabEvent { string: GuitarString; fret: number; startBeat: number; duration: number; technique?: Technique }
  interface Measure { events: TabEvent[] }
  type Category = 'scales'|'legato'|'picking'|'bends'|'palmMuting'|'sweep'|'rhythm'|'arpeggios'
  interface Tab { id: string; title: string; artist: string; subgenre: string; tuning: string; originalTempo: number; difficulty: number; measures: Measure[] }
  interface Exercise { id: string; title: string; category: Category; difficulty: number; description: string; targetBpm: number; xpReward: number; pattern: TabEvent[] }
  class ContentValidationError extends Error {}
  function validateTab(data: unknown): Tab
  function validateExercise(data: unknown): Exercise
  ```
- Consumes: nothing (foundation types/validators for all later content work).

- [ ] **Step 1: Write failing tests** in `validate.test.ts`: a valid `Tab` fixture and valid `Exercise` fixture each pass through unchanged; each of these invalid fixtures throws `ContentValidationError` with a message naming the bad field: `fret: 25` (out of 0–24), `string: 7` (out of 1–6), events with `startBeat` descending between two consecutive events in the same measure, `duration: 0`, a `Tab`/`Exercise` missing a required field (e.g. no `title`), `difficulty: 11` (out of 1–10).
- [ ] **Step 2: Run tests, verify they fail.**
- [ ] **Step 3: Implement `validateTab`/`validateExercise`** in `validate.ts` performing exactly the checks above and throwing `ContentValidationError` on the first violation found, with a message that names the field and the offending value.
- [ ] **Step 4: Run tests, verify pass.**
- [ ] **Step 5: Commit.**

---

### Task 4: Tab static grid renderer

**Files:**
- Create: `src/lib/tab/renderGrid.ts`
- Create: `src/components/tab/TabStaticView.tsx`
- Test: `src/lib/tab/renderGrid.test.ts`

**Interfaces:**
- Consumes: `Measure`, `TabEvent`, `GuitarString` (Task 3).
- Produces: `renderMeasureToLines(measure: Measure): string[]` (array of exactly 6 strings, one per guitar string, high e first), `<TabStaticView measure={Measure} highlightIndex?={number} />`.

- [ ] **Step 1: Write failing test** for `renderMeasureToLines`: given a measure with two events (`string:1,fret:5,startBeat:0`, `string:1,fret:7,startBeat:1`), assert the returned array has 6 entries, the first line contains `5` before `7` in column order, and all other 5 lines contain only dashes.
- [ ] **Step 2: Run test, verify it fails.**
- [ ] **Step 3: Implement `renderMeasureToLines`**: for each of the 6 strings, lay out a dash-filled line whose column positions correspond to `startBeat` (one column per quarter-beat is enough resolution for the static view) and overwrite the columns where that string has an event with its fret number.
- [ ] **Step 4: Run test, verify it passes.**
- [ ] **Step 5: Build `TabStaticView`**, a thin component rendering the 6 lines in a monospace block; when `highlightIndex` is provided, wrap the character(s) belonging to the event at that index in a span styled with the `accent` color.
- [ ] **Step 6: Commit.**

---

### Task 5: Tab playback timing engine

**Files:**
- Create: `src/lib/tab/playback.ts`
- Test: `src/lib/tab/playback.test.ts`

**Interfaces:**
- Consumes: `TabEvent` (Task 3).
- Produces: `beatsAtTime(elapsedSeconds: number, bpm: number): number`, `activeEventIndex(events: TabEvent[], currentBeat: number): number` (events assumed sorted ascending by `startBeat`; returns `-1` if `currentBeat` is before the first event's `startBeat`), `isEventActive(event: TabEvent, currentBeat: number): boolean` (`startBeat <= currentBeat < startBeat + duration`).

- [ ] **Step 1: Write failing tests**: `beatsAtTime(2, 120)` → `4` (2s at 120bpm = 4 beats); `activeEventIndex` on a 3-event list returns the correct index at a beat squarely inside each event's range, and `-1` before the first event's start; `isEventActive` true/false at the event's exact start, just before its end, and exactly at its end (false — end is exclusive).
- [ ] **Step 2: Run tests, verify they fail.**
- [ ] **Step 3: Implement the three functions** per the definitions above.
- [ ] **Step 4: Run tests, verify they pass.**
- [ ] **Step 5: Commit.**

---

### Task 6: Tab player state controller

**Files:**
- Create: `src/lib/tab/playerState.ts`
- Test: `src/lib/tab/playerState.test.ts`

**Interfaces:**
- Consumes: `beatsAtTime` (Task 5).
- Produces:
  ```ts
  interface PlayerState { status: 'idle'|'playing'|'paused'; speedPercent: number; elapsedBeats: number; loopRange?: [number, number] }
  type PlayerAction =
    | { type: 'play' } | { type: 'pause' }
    | { type: 'seek'; beat: number }
    | { type: 'setSpeed'; percent: number }
    | { type: 'setLoop'; range: [number, number] | undefined }
    | { type: 'tick'; deltaSeconds: number; bpm: number }
  function playerReducer(state: PlayerState, action: PlayerAction): PlayerState
  ```

- [ ] **Step 1: Write failing tests**: `play`/`pause` toggle `status` without changing `elapsedBeats`; `seek` sets `elapsedBeats` directly; `setSpeed` updates `speedPercent` without affecting `elapsedBeats`; a `tick` of `deltaSeconds=1` at `bpm=120, speedPercent=100` advances `elapsedBeats` by `2`; the same tick at `speedPercent=50` advances by `1`; a `tick` while `status !== 'playing'` leaves `elapsedBeats` unchanged; a `tick` that would push `elapsedBeats` past `loopRange[1]` wraps it back to `loopRange[0]` plus the overshoot.
- [ ] **Step 2: Run tests, verify they fail.**
- [ ] **Step 3: Implement `playerReducer`** using `beatsAtTime(deltaSeconds * speedPercent/100, bpm)` for the per-tick advance, and the loop-wrap rule above.
- [ ] **Step 4: Run tests, verify they pass.**
- [ ] **Step 5: Commit.**

---

### Task 7: Animated Tab Player page & fretboard diagram

**Files:**
- Create: `src/components/tab/FretboardDiagram.tsx`
- Modify: `src/pages/TabPlayerPage.tsx`
- Test: `src/components/tab/FretboardDiagram.test.tsx`

**Interfaces:**
- Consumes: `activeEventIndex`, `isEventActive` (Task 5), `playerReducer`/`PlayerState` (Task 6), `TabStaticView` (Task 4), `Tab`/`Measure` (Task 3).
- Produces: `<FretboardDiagram activeString?={GuitarString} activeFret?={number} />`; the routed `/tabs/:id` page.

- [ ] **Step 1: Write failing test** for `FretboardDiagram`: rendered with `activeString=1, activeFret=5`, the element with `data-testid="fret-1-5"` has the active/highlight class, and no other fret cell does.
- [ ] **Step 2: Run test, verify it fails.**
- [ ] **Step 3: Implement `FretboardDiagram`** as an SVG grid of 6 strings × 15 frets, each cell carrying `data-testid="fret-{string}-{fret}"`, highlighting the one matching the active props in the `accent` color.
- [ ] **Step 4: Run test, verify it passes.**
- [ ] **Step 5: Wire `TabPlayerPage`**: load the tab by `:id` (placeholder: accept a hardcoded fixture tab for now — Task 8 supplies the real loader), drive a `requestAnimationFrame` loop dispatching `{type:'tick', deltaSeconds, bpm: tab.originalTempo}` into `playerReducer`, derive the current measure/event via `activeEventIndex`/`isEventActive`, pass `highlightIndex` into `TabStaticView` and the active string/fret into `FretboardDiagram` (toggleable visibility, on by default). Render the speed slider (bound to `setSpeed`, 50–150%), play/pause buttons, and a loop-range selector (bound to `setLoop`).
- [ ] **Step 6: Manual verification**: `npm run dev`, open a tab page, confirm the highlight advances in place (no auto-scroll), speed slider changes pace, loop wraps correctly, fretboard diagram toggle works.
- [ ] **Step 7: Commit.**

---

### Task 8: Tab library page

**Files:**
- Create: `src/lib/content/loadTabs.ts`
- Modify: `src/pages/TabLibraryPage.tsx`, `src/pages/TabPlayerPage.tsx`
- Test: `src/lib/content/loadTabs.test.ts`

**Interfaces:**
- Consumes: `validateTab` (Task 3).
- Produces: `loadAllTabs(): Tab[]` (reads every file matched by `import.meta.glob('/src/content/tabs/*.json', { eager: true })`, runs each through `validateTab`, skips and `console.warn`s any file that fails validation instead of throwing), `filterTabs(tabs: Tab[], filter: { subgenre?: string; tuning?: string; maxDifficulty?: number }): Tab[]`.

- [ ] **Step 1: Write failing tests** for `filterTabs` against a 4-item in-memory fixture array: filtering by `subgenre` returns only matches, by `maxDifficulty` returns only `difficulty <= max`, combined filters intersect, no filter returns all 4.
- [ ] **Step 2: Run tests, verify they fail.**
- [ ] **Step 3: Implement `filterTabs`**, and `loadAllTabs` per the glob/validate/skip-invalid behavior above.
- [ ] **Step 4: Run tests, verify they pass.**
- [ ] **Step 5: Wire `TabLibraryPage`**: list all tabs from `loadAllTabs()`, dropdown filters for subgenre/tuning/a difficulty ceiling driving `filterTabs`, each row links to `/tabs/:id`. Update `TabPlayerPage` to look its tab up from `loadAllTabs()` by `:id` (replacing Task 7's hardcoded fixture) and show a "tab introuvable" message if no match.
- [ ] **Step 6: Commit.**

---

### Task 9: Metronome scheduler core

**Files:**
- Create: `src/lib/audio/metronome.ts`
- Test: `src/lib/audio/metronome.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface ScheduleInput { currentTime: number; nextTickTime: number; scheduleAheadTime: number; secondsPerBeat: number; beatsPerBar: number; nextBeatIndexInBar: number }
  interface ScheduleResult { ticks: { time: number; accent: boolean }[]; nextTickTime: number; nextBeatIndexInBar: number }
  function computeScheduledTicks(input: ScheduleInput): ScheduleResult
  class MetronomeEngine { start(bpm: number): void; stop(): void; setBpm(bpm: number): void; setVolume(v: number): void; }
  ```

- [ ] **Step 1: Write failing tests** for `computeScheduledTicks` (pure, no real audio/timers): given `currentTime=0, nextTickTime=0, scheduleAheadTime=0.1, secondsPerBeat=0.5, beatsPerBar=4, nextBeatIndexInBar=0`, the result schedules ticks at `0, 0.5` is NOT included (outside the 0.1s window) — i.e. only tick(s) with `time < currentTime + scheduleAheadTime` are returned; assert the first tick has `accent: true` (beat index 0) and `nextTickTime`/`nextBeatIndexInBar` advance correctly for the next call; a second call chained with the returned `nextTickTime`/`nextBeatIndexInBar` as input produces the following tick(s) with no gaps or repeats.
- [ ] **Step 2: Run tests, verify they fail.**
- [ ] **Step 3: Implement `computeScheduledTicks`**: while `nextTickTime < currentTime + scheduleAheadTime`, push `{ time: nextTickTime, accent: nextBeatIndexInBar === 0 }`, then advance `nextTickTime += secondsPerBeat` and `nextBeatIndexInBar = (nextBeatIndexInBar + 1) % beatsPerBar`; return the collected ticks plus the final `nextTickTime`/`nextBeatIndexInBar`.
- [ ] **Step 4: Run tests, verify they pass.**
- [ ] **Step 5: Implement `MetronomeEngine`** as a thin class: owns one `AudioContext`, a `setInterval(..., 25)` polling loop that calls `computeScheduledTicks` with `audioContext.currentTime` and schedules a short oscillator "click" (higher pitch when `accent`) at each returned `time` via `AudioParam` scheduling; `setBpm` updates `secondsPerBeat` for subsequent scheduling without resetting phase; `stop` clears the interval and does not throw if called twice.
- [ ] **Step 6: Manual verification**: in a scratch page or the dev console, start the engine at 90 BPM, confirm an audible, steady click with an accented first beat.
- [ ] **Step 7: Commit.**

---

### Task 10: Metronome widget & Tab Player integration

**Files:**
- Create: `src/lib/audio/useMetronome.ts`
- Create: `src/components/audio/MetronomeWidget.tsx`
- Modify: `src/layout/NavBar.tsx`, `src/pages/TabPlayerPage.tsx`

**Interfaces:**
- Consumes: `MetronomeEngine` (Task 9).
- Produces: `useMetronome(): { isPlaying: boolean; bpm: number; start(bpm: number): void; stop(): void; setVolume(v: number): void }` (backed by one module-level `MetronomeEngine` singleton, so every caller shares the same clock), `<MetronomeWidget />`.

- [ ] **Step 1: Implement `useMetronome`** wrapping the singleton engine and exposing React state mirroring `isPlaying`/`bpm`.
- [ ] **Step 2: Build `MetronomeWidget`**: a small popover (opened from a `NavBar` button) with a BPM number input, play/stop button, and volume slider, calling the hook.
- [ ] **Step 3: Wire `TabPlayerPage`**'s metronome toggle to the same `useMetronome` hook, starting it at `tab.originalTempo * speedPercent/100` and keeping it in sync whenever the speed slider changes while playing.
- [ ] **Step 4: Manual verification**: on a tab page, confirm toggling the metronome clicks in time with the moving highlight, and that changing speed updates both together; confirm the NavBar widget still works standalone on other pages.
- [ ] **Step 5: Commit.**

---

### Task 11: Pitch detection & tuning utilities

**Files:**
- Create: `src/lib/audio/pitchDetect.ts`
- Create: `src/lib/audio/noteUtils.ts`
- Create: `src/lib/audio/tunings.ts`
- Test: `src/lib/audio/pitchDetect.test.ts`, `src/lib/audio/noteUtils.test.ts`

**Interfaces:**
- Produces:
  ```ts
  function detectPitch(buffer: Float32Array, sampleRate: number): number | null
  function frequencyToNote(freq: number, referenceA4?: number): { note: string; octave: number; cents: number }
  interface Tuning { id: string; label: string; strings: { note: string; freq: number }[] } // low-to-high order not required; store as displayed, high e first
  const TUNINGS: Tuning[] // Standard, Drop D, Eb, Open G, Open D
  ```

- [ ] **Step 1: Write failing tests** for `detectPitch`: generate synthetic sine-wave `Float32Array` buffers at 110 Hz, 220 Hz, and 440 Hz (sample rate 44100) and assert the detected frequency is within ±1 Hz; a buffer of silence (all zeros) or low-amplitude noise returns `null`.
- [ ] **Step 2: Run tests, verify they fail.**
- [ ] **Step 3: Implement `detectPitch`** using normalized autocorrelation over the buffer with parabolic interpolation around the best lag for sub-sample precision, returning `null` when the buffer's RMS is below a small fixed threshold (no signal) or no lag clears a minimum correlation threshold (no clear pitch).
- [ ] **Step 4: Run tests, verify they pass.**
- [ ] **Step 5: Write failing tests** for `frequencyToNote`: `frequencyToNote(440)` → `{ note: 'A', octave: 4, cents: 0 }`; `frequencyToNote(445)` → same note/octave with `cents` a small positive number (~20); `frequencyToNote(220)` → `{ note: 'A', octave: 3, cents: 0 }`.
- [ ] **Step 6: Run tests, verify they fail.**
- [ ] **Step 7: Implement `frequencyToNote`** via `semitones = 12 * log2(freq / referenceA4)` (default `referenceA4 = 440`), nearest semitone → note name/octave, remainder × 100 → `cents`.
- [ ] **Step 8: Run tests, verify they pass.**
- [ ] **Step 9: Implement `tunings.ts`**: hardcode `TUNINGS` with the exact standard-tuning frequencies (E2 82.41, A2 110.00, D3 146.83, G3 196.00, B3 246.94, E4 329.63) plus Drop D, Eb, Open G, Open D computed from the same reference (no tests required — this is fixed reference data, not logic).
- [ ] **Step 10: Commit.**

---

### Task 12: Tuner page

**Files:**
- Modify: `src/pages/TunerPage.tsx`
- Test: `src/pages/TunerPage.test.tsx`

**Interfaces:**
- Consumes: `detectPitch`, `frequencyToNote`, `TUNINGS` (Task 11).

- [ ] **Step 1: Write a failing test** in `TunerPage.test.tsx`: mock `navigator.mediaDevices.getUserMedia` to return a `Promise` that rejects (e.g. `DOMException('Permission denied', 'NotAllowedError')`), render `<TunerPage>`, and assert the fallback message text (e.g. containing "microphone") appears and no pitch/cents display is rendered.
- [ ] **Step 2: Run the test, verify it fails** (component doesn't exist yet / doesn't handle rejection).
- [ ] **Step 3: Implement the permission-denied path**: when `getUserMedia` rejects, render an explicit message explaining the mic was blocked and how to allow it, with a "réessayer" button that retries the request; do not let this state affect any other page.
- [ ] **Step 4: Run the test, verify it passes.**
- [ ] **Step 5: Implement the happy path**: on mount, request `getUserMedia({ audio: true })`, pipe the stream into an `AnalyserNode`, run `detectPitch` on each animation frame, render the detected note, octave, cents offset, and a visual gauge (needle or bar) that centers at `cents === 0`; a dropdown selects the active entry from `TUNINGS` for reference/display purposes.
- [ ] **Step 6: Manual verification**: with mic access actually granted (real browser, not the test mock), play/hum a known note and confirm the displayed note and cents react correctly.
- [ ] **Step 7: Commit.**

---

### Task 13: XP & level progression logic

**Files:**
- Create: `src/lib/progression/xp.ts`
- Test: `src/lib/progression/xp.test.ts`

**Interfaces:**
- Produces: `xpToNext(level: number): number` (= `100 + (level - 1) * 50`), `cumulativeXpForLevel(level: number): number` (sum of `xpToNext(1..level-1)`), `levelFromXp(xpTotal: number): number`, `tierName(level: number): 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert' | 'Virtuose'` (1–9 Débutant, 10–19 Intermédiaire, 20–34 Avancé, 35–49 Expert, 50+ Virtuose).

- [ ] **Step 1: Write failing tests**: `xpToNext(1)` → `100`, `xpToNext(5)` → `300`; `cumulativeXpForLevel(1)` → `0`, `cumulativeXpForLevel(2)` → `100`, `cumulativeXpForLevel(3)` → `250`; `levelFromXp(0)` → `1`, `levelFromXp(99)` → `1`, `levelFromXp(100)` → `2`, `levelFromXp(250)` → `3`; `tierName(1)` → `'Débutant'`, `tierName(10)` → `'Intermédiaire'`, `tierName(20)` → `'Avancé'`, `tierName(35)` → `'Expert'`, `tierName(50)` → `'Virtuose'`, `tierName(80)` → `'Virtuose'`.
- [ ] **Step 2: Run tests, verify they fail.**
- [ ] **Step 3: Implement all four functions** per the exact formulas/thresholds above.
- [ ] **Step 4: Run tests, verify they pass.**
- [ ] **Step 5: Commit.**

---

### Task 14: Streak & daily goal logic

**Files:**
- Create: `src/lib/progression/streak.ts`
- Test: `src/lib/progression/streak.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface DailyGoal { type: 'minutes' | 'exercises'; amount: number }
  interface DailyProgress { minutes: number; exercisesCount: number }
  function isGoalMet(progress: DailyProgress, goal: DailyGoal): boolean
  function recordCompletion(history: Record<string, boolean>, date: string, met: boolean): Record<string, boolean>
  function currentStreak(history: Record<string, boolean>, today: string): number
  function longestStreak(history: Record<string, boolean>): number
  ```
  Dates are `YYYY-MM-DD` strings throughout, always supplied by the caller (never computed internally via `new Date()`), so every function stays pure and testable.

- [ ] **Step 1: Write failing tests** for `isGoalMet`: `{type:'minutes', amount:20}` met by `{minutes:20, exercisesCount:0}` and by `25`, not met by `19`; same shape for `type:'exercises'`.
- [ ] **Step 2: Run, verify fail. Implement `isGoalMet`. Run, verify pass.**
- [ ] **Step 3: Write failing tests** for `recordCompletion`: recording `true` for a new date adds it; recording for an existing date overwrites it (idempotent — calling twice with the same values leaves the map unchanged).
- [ ] **Step 4: Run, verify fail. Implement `recordCompletion`** (returns a new object; does not mutate the input). **Run, verify pass.**
- [ ] **Step 5: Write failing tests** for `currentStreak`: history with `today` and the 6 previous consecutive days all `true` → `7`; history where `today` is **absent** but the previous 5 consecutive days are `true` → `5` (today not yet logged must not break the streak); history where `today` is explicitly `false` and the previous 5 days are `true` → `5` (same treatment as absent); a `false`/absent day *two days ago* (breaking an otherwise-true run) → streak counts only the unbroken run adjacent to today; empty history → `0`.
- [ ] **Step 6: Run, verify fail.**
- [ ] **Step 7: Implement `currentStreak`**: starting at `cursor = today`, if `history[cursor] === true` increment the count; if `cursor === today` and it is not `true`, do not increment but do not stop either; for any earlier `cursor` that is not `true`, stop and return the count so far. Step `cursor` back one calendar day each iteration (parse/format via `Date` using UTC to avoid timezone drift) until a stop condition or a safety bound (e.g. 3650 iterations).
- [ ] **Step 8: Run, verify pass.**
- [ ] **Step 9: Write failing tests** for `longestStreak`: a history with two separate `true` runs (lengths 3 and 5, separated by a `false`) → `5`; empty history → `0`.
- [ ] **Step 10: Run, verify fail. Implement `longestStreak`** by scanning the sorted dates for the longest run of consecutive `true` entries. **Run, verify pass.**
- [ ] **Step 11: Commit.**

---

### Task 15: Badges logic

**Files:**
- Create: `src/lib/progression/badges.ts`
- Test: `src/lib/progression/badges.test.ts`

**Interfaces:**
- Consumes: nothing beyond the shape below (kept decoupled from Tasks 13/14's real types so it's independently testable).
- Produces:
  ```ts
  interface BadgeCheckInput { streakCurrent: number; globalLevel: number; skillLevels: Record<string, number>; tabsCompletedCount: number }
  interface Badge { id: string; label: string; isUnlocked(input: BadgeCheckInput): boolean }
  const BADGES: Badge[]
  function evaluateBadges(input: BadgeCheckInput, alreadyUnlocked: string[]): string[] // ids newly unlocked, excludes ones already in alreadyUnlocked
  ```
  Fixed badge list: `premiere-semaine` (`streakCurrent >= 7`), `un-mois` (`streakCurrent >= 30`), `centurion` (`streakCurrent >= 100`), `premier-riff` (`tabsCompletedCount >= 1`), `dix-riffs` (`tabsCompletedCount >= 10`), `monte-en-gamme` (any value in `skillLevels` `>= 10`), `virtuose-en-herbe` (`globalLevel >= 25`), `shred-master` (any value in `skillLevels` `>= 25`).

- [ ] **Step 1: Write failing tests**, one per badge above: an input crossing exactly that badge's threshold unlocks it; an input just under the threshold does not; `evaluateBadges` excludes an id already present in `alreadyUnlocked` even if still met.
- [ ] **Step 2: Run tests, verify they fail.**
- [ ] **Step 3: Implement `BADGES`** with the 8 entries and conditions exactly as listed, and `evaluateBadges` as a filter over `BADGES` by `isUnlocked(input) && !alreadyUnlocked.includes(id)`.
- [ ] **Step 4: Run tests, verify they pass.**
- [ ] **Step 5: Commit.**

---

### Task 16: Progression context & persistence

**Files:**
- Create: `src/lib/progression/ProgressionContext.tsx`
- Create: `src/lib/progression/dailyPick.ts`
- Test: `src/lib/progression/dailyPick.test.ts`

**Interfaces:**
- Consumes: `loadJSON`/`saveJSON` (Task 2), `xpToNext`/`levelFromXp`/`tierName` (Task 13), `isGoalMet`/`recordCompletion`/`currentStreak`/`longestStreak`/`DailyGoal` (Task 14), `evaluateBadges`/`BadgeCheckInput` (Task 15), `Category`/`Exercise`/`Tab` (Task 3).
- Produces:
  ```ts
  interface ProgressState {
    xpTotal: number; skillXp: Record<Category, number>;
    xpLog: { date: string; xpGained: number }[];
    dailyGoal: DailyGoal; streakHistory: Record<string, boolean>;
    badgesUnlocked: string[];
    customTempoByTabId: Record<string, number>;
    importedTabs: Tab[];
  }
  function useProgression(): {
    state: ProgressState;
    completeExercise(exercise: Exercise, today: string): void;
    completeTabPractice(tab: Tab, minutesSpent: number, today: string): void;
    setDailyGoal(goal: DailyGoal): void;
    importTab(tab: Tab): void;
    setTempoForTab(tabId: string, bpm: number): void;
  }
  function pickDailyExercise(exercises: Exercise[], skillXp: Record<Category, number>, date: string): Exercise
  function pickDailyTab(tabs: Tab[], date: string): Tab
  ```
  `<ProgressionProvider>` wraps `App`; `useProgression` must be called within it.

- [ ] **Step 1: Write failing tests** for `pickDailyExercise`: given a fixed `skillXp` where one category has clearly the lowest value, the pick always comes from that category, deterministically, for a fixed `date` (same inputs → same output across repeated calls); a different `date` with the same `skillXp` is allowed to pick a different exercise within that lowest category (seed by hashing the date string).
- [ ] **Step 2: Run, verify fail. Implement `pickDailyExercise`**: filter `exercises` to the lowest-XP category, pick deterministically among them using a simple hash of `date` as the index seed. **Run, verify pass.**
- [ ] **Step 3: Write failing test** for `pickDailyTab`: same determinism property (fixed `date` + fixed `tabs` → same pick every call). **Run, verify fail. Implement** (hash of `date` modulo `tabs.length`). **Run, verify pass.**
- [ ] **Step 4: Implement `ProgressionContext.tsx`**: a `defaultProgressState` (level 1, zero XP everywhere, `dailyGoal: {type:'exercises', amount:1}`, empty history/badges/imports); on mount, `loadJSON('guitar-progress', defaultProgressState)`; on every state change, `saveJSON('guitar-progress', state)`. `completeExercise` adds `exercise.xpReward` to `xpTotal` and to `skillXp[exercise.category]`, appends to `xpLog`, marks today's `DailyProgress` (tracked in-memory from today's completions so far) and calls `isGoalMet`/`recordCompletion` to update `streakHistory`, then `evaluateBadges` to extend `badgesUnlocked`. `completeTabPractice` mirrors this using a fixed XP-per-minute rate (e.g. `5` XP/minute, applied to the tab's `subgenre`-agnostic general pool plus the `rhythm` skill) and increments the counter `evaluateBadges` needs for `tabsCompletedCount`. `importTab` appends to `importedTabs`. `setTempoForTab`/`setDailyGoal` update their respective fields.
- [ ] **Step 5: Commit.**

---

### Task 17: Exercises pages

**Files:**
- Create: `src/lib/content/loadExercises.ts`
- Modify: `src/pages/ExercisesListPage.tsx`, `src/pages/ExerciseDetailPage.tsx`
- Test: `src/lib/content/loadExercises.test.ts`

**Interfaces:**
- Consumes: `validateExercise` (Task 3), `TabStaticView` (Task 4), `useProgression` (Task 16).
- Produces: `loadAllExercises(): Exercise[]` (same glob/validate/skip-invalid pattern as `loadAllTabs`, over `/src/content/exercises/*.json` where each file is an array of `Exercise`), `filterExercises(exercises: Exercise[], filter: { category?: Category; maxDifficulty?: number }): Exercise[]`.

- [ ] **Step 1: Write failing tests** for `filterExercises` against a small fixture array (mirrors Task 8's `filterTabs` tests, adapted to category/difficulty).
- [ ] **Step 2: Run, verify fail. Implement `filterExercises` and `loadAllExercises`. Run, verify pass.**
- [ ] **Step 3: Wire `ExercisesListPage`**: list from `loadAllExercises()`, filter dropdowns for category/difficulty.
- [ ] **Step 4: Wire `ExerciseDetailPage`**: show description/targetBpm, render `pattern` via `TabStaticView`, and a "Marquer comme fait" button calling `useProgression().completeExercise`.
- [ ] **Step 5: Commit.**

---

### Task 18: Dashboard page

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

**Interfaces:**
- Consumes: `useProgression` (Task 16), `loadAllExercises` (Task 17), `loadAllTabs` (Task 8), `pickDailyExercise`/`pickDailyTab` (Task 16), `xpToNext`/`levelFromXp`/`tierName` (Task 13).

- [ ] **Step 1: Implement `DashboardPage`**: show global level + tier name + XP progress bar toward the next level (using `xpToNext`/`levelFromXp`); show today's streak status and goal (with a control to edit `dailyGoal`); show the exercise and tab picked by `pickDailyExercise`/`pickDailyTab` for today's date as cards linking to their detail/player pages; show quick-access links/buttons to the tuner and the metronome widget.
- [ ] **Step 2: Manual verification**: complete an exercise from its detail page (Task 17) and confirm the Dashboard's XP/streak numbers update on return; confirm today's picks stay stable on refresh within the same day.
- [ ] **Step 3: Commit.**

---

### Task 19: Progression page

**Files:**
- Create: `src/lib/progression/charts.ts`
- Create: `src/components/charts/BarChart.tsx`
- Modify: `src/pages/ProgressionPage.tsx`
- Test: `src/lib/progression/charts.test.ts`

**Interfaces:**
- Consumes: `ProgressState` (Task 16).
- Produces: `aggregateXpByDay(xpLog: ProgressState['xpLog']): { date: string; total: number }[]` (sums `xpGained` per `date`, sorted ascending), `skillBreakdown(skillXp: Record<Category, number>): { category: Category; xp: number; level: number }[]` (using `levelFromXp` from Task 13), `<BarChart data={{label:string; value:number}[]} />` (plain SVG bars, no library).

- [ ] **Step 1: Write failing tests** for `aggregateXpByDay`: multiple log entries on the same date sum into one bucket; entries across different dates stay separate and the result is sorted by date ascending.
- [ ] **Step 2: Run, verify fail. Implement. Run, verify pass.**
- [ ] **Step 3: Write failing tests** for `skillBreakdown`: given a `skillXp` map, the result has one entry per category present with the correct `level` from `levelFromXp`.
- [ ] **Step 4: Run, verify fail. Implement. Run, verify pass.**
- [ ] **Step 5: Implement `BarChart`** (simple `<svg>` with one `<rect>` per data point, scaled to the max value) and wire `ProgressionPage` to show: an XP-over-time bar chart (`aggregateXpByDay`), a per-skill bar chart (`skillBreakdown`), the streak history (reuse `currentStreak`/`longestStreak` from Task 14), and the unlocked badges list (labels from `BADGES`, Task 15).
- [ ] **Step 6: Commit.**

---

### Task 20: ASCII tab import

**Files:**
- Create: `src/lib/tab/asciiImport.ts`
- Modify: `src/pages/TabLibraryPage.tsx`
- Test: `src/lib/tab/asciiImport.test.ts`

**Interfaces:**
- Consumes: `Measure`/`TabEvent`/`GuitarString` (Task 3), `importTab` (Task 16).
- Produces: `parseAsciiTab(text: string): { measures: Measure[] } | { error: string }`.

Algorithm to implement (fixed decisions, so the implementer isn't guessing): expect exactly 6 non-empty lines, each starting with a string label and `|` (e.g. `e|`, `B|`, `G|`, `D|`, `A|`, `E|`, case-insensitive, top-to-bottom = high e to low E); strip the label; if the 6 stripped lines aren't all the same length, return `{ error: 'lignes de longueur inégale' }`; otherwise scan column-by-column across all 6 lines, treating 4 columns as 1 beat (`startBeat = columnIndex / 4`); wherever a line has a run of one or more digits starting at a column, that's one `TabEvent` (`fret` = the parsed number, `string` = that line's index-based string number, `duration` = columns until the next digit-run on the *same* line, or `1` beat if none follows); a technique character immediately after the digit run (`h`,`p`,`b`,`/`,`\`,`~`) maps to `technique` (`hammer`,`pull`,`bend`,`slide`,`slide`,`vibrato` respectively) — any other trailing character is ignored; group all events into one `Measure` per 4 beats (`beatsPerMeasure = 4`), sorted by `startBeat`; return `{ error: 'aucune note trouvée' }` if zero events were found.

- [ ] **Step 1: Write failing tests**: a clean 2-measure, 6-line fixture string parses into the expected `TabEvent[]` (exact string/fret/startBeat/duration values worked out by hand from the fixture); a fixture with one line shorter than the others returns `{ error: ... }` (not a throw); a fixture with a `5h7` pattern produces an event with `technique: 'hammer'` on the first note; an all-dashes fixture (no digits) returns `{ error: 'aucune note trouvée' }`.
- [ ] **Step 2: Run tests, verify they fail.**
- [ ] **Step 3: Implement `parseAsciiTab`** exactly per the algorithm above.
- [ ] **Step 4: Run tests, verify they pass.**
- [ ] **Step 5: Add an import form to `TabLibraryPage`**: a textarea + "Importer" button calling `parseAsciiTab`; on success, prompt for title/artist/subgenre/tuning/difficulty/tempo metadata and call `useProgression().importTab` with the assembled `Tab`; on `{error}`, show that message inline without clearing the textarea.
- [ ] **Step 6: Manual verification**: paste a real ASCII tab copied from a text file, confirm it imports and plays in the Tab Player; paste a deliberately broken one, confirm the inline error (not a crash).
- [ ] **Step 7: Commit.**

---

### Task 21: Exercise content (~100 exercises)

**Files:**
- Create: `src/content/exercises/scales.json`, `legato.json`, `picking.json`, `bends.json`, `palmMuting.json`, `sweep.json`, `rhythm.json`, `arpeggios.json`
- Test: `src/content/exercises.content.test.ts`

**Interfaces:**
- Consumes: `Exercise`/`validateExercise` (Task 3), `loadAllExercises` (Task 19).

Exact per-category counts (sum to 100): `scales` 15, `legato` 10, `picking` 15, `bends` 10, `palmMuting` 10, `sweep` 10, `rhythm` 15, `arpeggios` 15.

- [ ] **Step 1: Write the content test first**: `loadAllExercises()` returns exactly 100 items; every item passes `validateExercise`; the count per `category` matches the table above exactly; every category contains at least one exercise with `difficulty <= 3` and at least one with `difficulty >= 7` (so beginner and advanced content exists everywhere).
- [ ] **Step 2: Run the test, verify it fails** (no content files yet).
- [ ] **Step 3: Author the 8 JSON files.** Each exercise needs a short French `description`, a `targetBpm`, an `xpReward` (suggest `difficulty * 10`), and a `pattern` (a short `TabEvent[]`, e.g. a scale run or a palm-muted riff fragment — simple, hand-constructed patterns are fine, they don't need to be musically profound, just valid and genre-appropriate). Spread difficulty 1–10 within each category per the test's requirement.
- [ ] **Step 4: Run the test, verify it passes.**
- [ ] **Step 5: Commit.**

---

### Task 22: Tab content (starter metal library)

**Files:**
- Create: `src/content/tabs/*.json` (one file per song)
- Test: `src/content/tabs.content.test.ts`

**Interfaces:**
- Consumes: `Tab`/`validateTab` (Task 3), `loadAllTabs` (Task 8).

Starter list (exactly these 20, each a short main-riff or intro excerpt — not a full transcription — with no lyrics; difficulty/tuning as noted; `originalTempo` and exact note/fret data researched and transcribed carefully by the implementer):

| # | Title — Artist | Subgenre | Tuning | Difficulty |
|---|---|---|---|---|
| 1 | Smoke on the Water — Deep Purple | heavy classique | Standard | 2 |
| 2 | Paranoid — Black Sabbath | heavy classique | Standard | 2 |
| 3 | Iron Man — Black Sabbath | heavy classique | Standard | 2 |
| 4 | Breaking the Law — Judas Priest | heavy classique | Standard | 3 |
| 5 | Crazy Train — Ozzy Osbourne | heavy | Standard | 5 |
| 6 | Enter Sandman (intro) — Metallica | thrash/heavy | Standard | 3 |
| 7 | Seek and Destroy — Metallica | thrash | Standard | 4 |
| 8 | Master of Puppets (riff principal) — Metallica | thrash | Eb | 6 |
| 9 | Battery (intro) — Metallica | thrash | Eb | 7 |
| 10 | Symphony of Destruction — Megadeth | thrash | Standard | 4 |
| 11 | Raining Blood (riff principal) — Slayer | thrash | Standard | 8 |
| 12 | The Trooper — Iron Maiden | NWOBHM | Standard | 5 |
| 13 | Walk — Pantera | groove metal | Drop D | 5 |
| 14 | Chop Suey! (intro) — System of a Down | alt/nu metal | Standard | 5 |
| 15 | Down With the Sickness (riff principal) — Disturbed | alt metal | Standard | 3 |
| 16 | Du Hast — Rammstein | industrial metal | Standard | 2 |
| 17 | Nightmare (riff principal) — Avenged Sevenfold | metalcore | Standard | 8 |
| 18 | Pull Harder on the Strings of Your Martyr (riff principal) — Trivium | metalcore/thrash | Eb | 8 |
| 19 | Still Counting (riff principal) — Volbeat | groove/heavy moderne | Standard | 5 |
| 20 | Tears Don't Fall (riff principal) — Bullet For My Valentine | metalcore | Eb | 8 |

- [ ] **Step 1: Write the content test first**: `loadAllTabs()` returns exactly 20 items; every item passes `validateTab`; at least 6 distinct `subgenre` values are present; at least 4 tabs have `difficulty <= 3` and at least 4 have `difficulty >= 7`.
- [ ] **Step 2: Run the test, verify it fails.**
- [ ] **Step 3: Author the 20 JSON files** per the table, each as a short excerpt (roughly one 4–8 measure riff), no lyrics.
- [ ] **Step 4: Run the test, verify it passes.**
- [ ] **Step 5: Commit.**

---

### Task 23: Resources & tutorials page

**Files:**
- Create: `src/content/resources.ts`
- Modify: `src/pages/ResourcesPage.tsx`

**Interfaces:**
- Produces: `interface ResourceCategory { title: string; tip: string; links: { label: string; url: string }[] }`, `const RESOURCE_CATEGORIES: ResourceCategory[]`.

- [ ] **Step 1: Author `RESOURCE_CATEGORIES`** covering at least: technique générale, théorie musicale appliquée à la guitare, spécifique metal (palm muting, riffs rythmiques, accordages abaissés), matériel/son (ampli, pédales, réglages de base). For each link, prefer well-known channels/sites over a specific unverified video URL (e.g. a channel's homepage) — **verify every URL actually resolves (fetch/open it) before including it**, rather than recalling one from memory.
- [ ] **Step 2: Wire `ResourcesPage`** to render the categories with their tips and links (opening in a new tab).
- [ ] **Step 3: Manual verification**: click through every link once to confirm it resolves.
- [ ] **Step 4: Commit.**
